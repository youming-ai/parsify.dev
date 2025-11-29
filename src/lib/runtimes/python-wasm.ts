/**
 * Python WASM Runtime using Pyodide
 * Provides Python 3.11 execution with scientific computing support
 */

export interface PythonPackage {
  name: string;
  version?: string;
  installOptions?: string[];
  pipOptions?: string[];
}

export interface PythonExecutionOptions {
  code: string;
  packages?: PythonPackage[];
  inputFiles?: Array<{ name: string; content: string }>;
  captureGraphics?: boolean;
  environment?: Record<string, string>;
  timeoutMs?: number;
  memoryLimitMB?: number;
  enableOutput?: boolean;
  captureErrors?: boolean;
}

export interface PythonExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  packages?: PackageInfo[];
  graphics?: string[]; // Base64 encoded images
  error?: Error;
  warnings?: string[];
}

export interface PackageInfo {
  name: string;
  version: string;
  installed: boolean;
  files: string[];
}

export class PythonRuntime {
  private pyodide: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize Python runtime with Pyodide
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Load Pyodide
      const { loadPyodide } = await import('pyodide');
      this.pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        packages: ['numpy', 'pandas', 'matplotlib'], // Pre-load common packages
      });

      // Configure Python environment
      this.pyodide.runPython(`
import sys
import io
from contextlib import redirect_stdout, redirect_stderr

# Set up output capture
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
      `);

      this.isInitialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      throw new Error(`Failed to initialize Python runtime: ${message}`);
    }
  }

  /**
   * Install a package
   */
  async installPackage(packageName: string): Promise<void> {
    await this.initialize();
    if (!this.pyodide) {
      throw new Error('Python runtime not initialized');
    }
    await this.pyodide.loadPackage(packageName);
  }

  /**
   * Interrupt execution
   */
  interrupt(): void {
    // Pyodide interruption requires SharedArrayBuffer and service worker setup
    // For now, we'll just log
    console.log('Interrupting Python execution (not fully implemented)');
  }

  /**
   * Execute Python code with options
   */
  async executeCode(options: PythonExecutionOptions): Promise<PythonExecutionResult> {
    await this.initialize();

    if (!this.pyodide) {
      throw new Error('Python runtime not initialized');
    }

    const {
      code,
      packages = [],
      inputFiles = [],
      captureGraphics = false,
      environment = {},
      timeoutMs = 5000,
      memoryLimitMB = 100,
      enableOutput = true,
      captureErrors = true,
    } = options;

    const startTime = performance.now();
    let output = '';
    let errorOutput = '';
    let isComplete = false;
    const graphics: string[] = [];
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      // Load additional packages if requested
      if (packages.length > 0) {
        const packageNames = packages.map((pkg) => pkg.name);
        await this.pyodide.loadPackage(packageNames);
      }

      // Create input files
      if (inputFiles.length > 0) {
        for (const file of inputFiles) {
          this.pyodide.FS.writeFile(file.name, file.content);
        }
      }

      // Set environment variables
      if (Object.keys(environment).length > 0) {
        for (const [key, value] of Object.entries(environment)) {
          this.pyodide.runPython(`import os; os.environ['${key}'] = '${value}'`);
        }
      }

      // Set up timeout
      timeoutId = setTimeout(() => {
        if (!isComplete) {
          isComplete = true;
          throw new Error('Python execution timeout');
        }
      }, timeoutMs);

      // Execute code with output capture
      try {
        if (enableOutput || captureErrors) {
          this.pyodide.runPython(`
import sys
import io
from contextlib import redirect_stdout, redirect_stderr

output_buffer = io.StringIO()
error_buffer = io.StringIO()

with redirect_stdout(output_buffer), redirect_stderr(error_buffer):
    pass
          `);

          this.pyodide.runPython(code);

          // Capture output
          output = this.pyodide.runPython(`
output_buffer.getvalue()
          `) as string;

          errorOutput = this.pyodide.runPython(`
error_buffer.getvalue()
          `) as string;
        } else {
          this.pyodide.runPython(code);
        }

        isComplete = true;
        if (timeoutId) clearTimeout(timeoutId);

        // Capture graphics if requested
        if (captureGraphics) {
          try {
            const figures = this.pyodide.runPython(`
import matplotlib.pyplot as plt
import base64
import io

figures = []
if plt.get_fignures():
    for fig in plt.get_fignures():
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        figures.append(base64.b64encode(buf.getvalue()).decode())
        plt.close(fig)
figures
            `);
            if (figures.length > 0) {
              graphics.push(...figures);
            }
          } catch (_e) {
            // Graphics capture failed
          }
        }

        const endTime = performance.now();
        const executionTime = endTime - startTime;
        const exitCode = errorOutput.includes('Error') ? 1 : 0;

        return {
          stdout: output,
          stderr: errorOutput,
          exitCode,
          executionTime,
          memoryUsed: this._estimateMemoryUsage(),
          graphics,
          warnings: [],
        };
      } catch (error) {
        isComplete = true;
        if (timeoutId) clearTimeout(timeoutId);

        const endTime = performance.now();
        const executionTime = endTime - startTime;

        return {
          stdout: output,
          stderr: errorOutput,
          exitCode: 1,
          executionTime,
          memoryUsed: this._estimateMemoryUsage(),
          error: error instanceof Error ? error : new Error(String(error)),
          warnings: [],
        };
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  /**
   * Get package information
   */
  async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
    await this.initialize();

    if (!this.pyodide) {
      throw new Error('Python runtime not initialized');
    }

    try {
      const info = this.pyodide.runPython(`
import importlib.metadata
try:
    info = importlib.metadata.version('${packageName}')
    {"version": info, "installed": True}
except:
    {"installed": False}
      `) as PackageInfo;

      if (info.installed) {
        return {
          name: packageName,
          version: info.version,
          installed: true,
          files: [], // Would need additional logic to list files
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.pyodide) {
      try {
        this.pyodide.runPython(`
import sys
if hasattr(sys, 'stdout'):
    sys.stdout = sys.__stdout__
if hasattr(sys, 'stderr'):
    sys.stderr = sys.__stderr__
        `);
      } catch (_e) {
        // Cleanup failed, but continue
      }

      this.pyodide = null;
      this.isInitialized = false;
      this.initializationPromise = null;
    }
  }

  /**
   * Get runtime status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      version: '3.11',
      packages: ['numpy', 'pandas', 'matplotlib'],
      memoryUsage: this._estimateMemoryUsage(),
    };
  }

  private _estimateMemoryUsage(): number {
    // Estimate memory usage - implementation would vary
    // This is a placeholder for actual memory monitoring
    return 0;
  }
}

// Export singleton instance
export const pythonRuntime = new PythonRuntime();
