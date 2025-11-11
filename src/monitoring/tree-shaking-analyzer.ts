/**
 * Tree Shaking and Dead Code Elimination Analyzer
 * Identifies unused code and optimizes bundle through tree shaking
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

interface CodeAnalysis {
  filePath: string;
  exports: ExportInfo[];
  imports: ImportInfo[];
  deadExports: string[];
  unusedImports: string[];
  sideEffects: boolean;
  canTreeShake: boolean;
}

interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'variable' | 'default';
  isUsed: boolean;
  usedBy: string[];
  lineNumber: number;
}

interface ImportInfo {
  name: string;
  source: string;
  type: 'default' | 'named' | 'namespace';
  isUsed: boolean;
  lineNumber: number;
}

interface DeadCodeReport {
  timestamp: Date;
  totalFiles: number;
  totalDeadCode: number;
  filesWithDeadCode: Array<{
    filePath: string;
    deadExports: string[];
    unusedImports: string[];
    estimatedSavings: number;
  }>;
  recommendations: TreeShakingRecommendation[];
  moduleAnalysis: ModuleAnalysis;
}

interface TreeShakingRecommendation {
  type: 'remove-unused-exports' | 'remove-unused-imports' | 'convert-to-esm' | 'fix-side-effects' | 'enable-pure-annotations';
  priority: 'high' | 'medium' | 'low';
  description: string;
  filePath: string;
  estimatedSavings: number;
  action: string;
}

interface ModuleAnalysis {
  esmModules: number;
  commonjsModules: number;
  modulesWithSideEffects: number;
  treeShakableModules: number;
  blockedModules: Array<{
    path: string;
    reason: string;
  }>;
}

class TreeShakingAnalyzer {
  private projectRoot: string;
  private analysisResults: Map<string, CodeAnalysis>;
  private dependencies: Map<string, DependencyInfo>;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.analysisResults = new Map();
    this.dependencies = new Map();
  }

  async analyzeCodebase(): Promise<DeadCodeReport> {
    console.log('🌳 Analyzing codebase for tree shaking opportunities...');

    await this.scanProjectFiles();
    await this.analyzeDependencies();
    const deadCodeReport = await this.identifyDeadCode();

    return deadCodeReport;
  }

  private async scanProjectFiles(): Promise<void> {
    const sourceDirectories = ['src', 'lib', 'components', 'pages', 'app'];

    for (const dir of sourceDirectories) {
      const dirPath = join(this.projectRoot, dir);
      if (existsSync(dirPath)) {
        await this.scanDirectory(dirPath);
      }
    }
  }

  private async scanDirectory(dirPath: string): Promise<void> {
    try {
      const files = execSync(`find "${dirPath}" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"`, { encoding: 'utf-8' });

      for (const filePath of files.trim().split('\n')) {
        if (filePath) {
          await this.analyzeFile(filePath);
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dirPath}:`, error);
    }
  }

  private async analyzeFile(filePath: string): Promise<void> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const analysis = this.parseFileContent(filePath, content);
      this.analysisResults.set(filePath, analysis);
    } catch (error) {
      console.warn(`Could not analyze file ${filePath}:`, error);
    }
  }

  private parseFileContent(filePath: string, content: string): CodeAnalysis {
    const analysis: CodeAnalysis = {
      filePath,
      exports: [],
      imports: [],
      deadExports: [],
      unusedImports: [],
      sideEffects: this.hasSideEffects(content),
      canTreeShake: this.canBeTreeShaken(content),
    };

    // Parse exports
    analysis.exports = this.extractExports(content);

    // Parse imports
    analysis.imports = this.extractImports(content);

    return analysis;
  }

  private extractExports(content: string): ExportInfo[] {
    const exports: ExportInfo[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Named exports
      const namedExportMatch = line.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/);
      if (namedExportMatch) {
        exports.push({
          name: namedExportMatch[1],
          type: this.getExportType(line),
          isUsed: false,
          usedBy: [],
          lineNumber: index + 1,
        });
      }

      // Export declarations
      const exportDeclarationMatch = line.match(/export\s*{\s*([^}]+)\s*}/);
      if (exportDeclarationMatch) {
        const exportedNames = exportDeclarationMatch[1].split(',').map(name => name.trim().replace(/as\s+\w+/, ''));
        exportedNames.forEach(name => {
          if (name) {
            exports.push({
              name,
              type: 'variable',
              isUsed: false,
              usedBy: [],
              lineNumber: index + 1,
            });
          }
        });
      }

      // Default exports
      const defaultExportMatch = line.match(/export\s+default\s+/);
      if (defaultExportMatch) {
        const nameMatch = line.match(/(?:const|let|var|function|class)\s+(\w+)/);
        exports.push({
          name: nameMatch ? nameMatch[1] : 'default',
          type: 'default',
          isUsed: false,
          usedBy: [],
          lineNumber: index + 1,
        });
      }
    });

    return exports;
  }

  private extractImports(content: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Default imports
      const defaultImportMatch = line.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
      if (defaultImportMatch) {
        imports.push({
          name: defaultImportMatch[1],
          source: defaultImportMatch[2],
          type: 'default',
          isUsed: false,
          lineNumber: index + 1,
        });
      }

      // Named imports
      const namedImportMatch = line.match(/import\s*{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/);
      if (namedImportMatch) {
        const importedNames = namedImportMatch[1].split(',').map(name => {
          const cleanName = name.trim().replace(/as\s+\w+/, '').trim();
          return cleanName;
        });

        importedNames.forEach(name => {
          if (name) {
            imports.push({
              name,
              source: namedImportMatch[2],
              type: 'named',
              isUsed: false,
              lineNumber: index + 1,
            });
          }
        });
      }

      // Namespace imports
      const namespaceImportMatch = line.match(/import\s*\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
      if (namespaceImportMatch) {
        imports.push({
          name: namespaceImportMatch[1],
          source: namespaceImportMatch[2],
          type: 'namespace',
          isUsed: false,
          lineNumber: index + 1,
        });
      }
    });

    return imports;
  }

  private getExportType(line: string): ExportInfo['type'] {
    if (line.includes('function')) return 'function';
    if (line.includes('class')) return 'class';
    if (line.includes('default')) return 'default';
    return 'variable';
  }

  private hasSideEffects(content: string): boolean {
    // Check for common side effect patterns
    const sideEffectPatterns = [
      /console\.(log|warn|error|info)/,
      /document\.(createElement|addEventListener)/,
      /window\.(addEventListener|location)/,
      /process\./,
      /require\(/,
      /global\./,
      /__webpack/,
      /import\s+[^'"]*['"](?![^'"]*from)/, // Import for side effects
    ];

    return sideEffectPatterns.some(pattern => pattern.test(content));
  }

  private canBeTreeShaken(content: string): boolean {
    // Check if module can be tree shaken
    return (
      content.includes('export') && // Has exports
      !this.hasSideEffects(content) && // No obvious side effects
      !content.includes('module.exports') && // Not CommonJS
      !content.includes('exports.') // Not CommonJS
    );
  }

  private async analyzeDependencies(): Promise<void> {
    const packageJsonPath = join(this.projectRoot, 'package.json');

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      for (const [name, version] of Object.entries(dependencies)) {
        this.dependencies.set(name, {
          name,
          version: version as string,
          isESM: await this.checkIfPackageIsESM(name),
          hasSideEffects: await this.checkPackageSideEffects(name),
        });
      }
    }
  }

  private async checkIfPackageIsESM(packageName: string): Promise<boolean> {
    try {
      // Try to read package.json of the dependency
      const packagePath = join(this.projectRoot, 'node_modules', packageName, 'package.json');
      if (existsSync(packagePath)) {
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
        return packageJson.type === 'module' || packageJson.exports;
      }
    } catch (error) {
      // Silently fail and assume CommonJS
    }

    return false;
  }

  private async checkPackageSideEffects(packageName: string): Promise<boolean> {
    try {
      const packagePath = join(this.projectRoot, 'node_modules', packageName, 'package.json');
      if (existsSync(packagePath)) {
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
        return packageJson.sideEffects !== false;
      }
    } catch (error) {
      // Assume has side effects if we can't determine
    }

    return true;
  }

  private async identifyDeadCode(): Promise<DeadCodeReport> {
    await this.crossReferenceUsage();

    let totalDeadCode = 0;
    const filesWithDeadCode: DeadCodeReport['filesWithDeadCode'] = [];
    const recommendations: TreeShakingRecommendation[] = [];

    for (const [filePath, analysis] of this.analysisResults.entries()) {
      // Find dead exports
      analysis.deadExports = analysis.exports
        .filter(exp => !exp.isUsed && exp.type !== 'default')
        .map(exp => exp.name);

      // Find unused imports
      analysis.unusedImports = analysis.imports
        .filter(imp => !imp.isUsed)
        .map(imp => `${imp.type === 'default' ? imp.name : `${imp.name} from ${imp.source}`}`);

      if (analysis.deadExports.length > 0 || analysis.unusedImports.length > 0) {
        const estimatedSavings = this.estimateSavings(analysis);
        totalDeadCode += estimatedSavings;

        filesWithDeadCode.push({
          filePath,
          deadExports: analysis.deadExports,
          unusedImports: analysis.unusedImports,
          estimatedSavings,
        });

        // Generate recommendations
        recommendations.push(...this.generateRecommendations(analysis));
      }
    }

    const moduleAnalysis = this.analyzeModules();

    return {
      timestamp: new Date(),
      totalFiles: this.analysisResults.size,
      totalDeadCode,
      filesWithDeadCode,
      recommendations,
      moduleAnalysis,
    };
  }

  private async crossReferenceUsage(): Promise<void> {
    // Cross-reference imports and exports across the codebase
    for (const [filePath, analysis] of this.analysisResults.entries()) {
      for (const importInfo of analysis.imports) {
        // Check if import is used in the file
        importInfo.isUsed = this.checkImportUsage(filePath, importInfo);
      }
    }

    // Check export usage
    for (const [filePath, analysis] of this.analysisResults.entries()) {
      for (const exportInfo of analysis.exports) {
        exportInfo.isUsed = this.checkExportUsage(exportInfo.name);
        exportInfo.usedBy = this.findExportUsers(exportInfo.name);
      }
    }
  }

  private checkImportUsage(filePath: string, importInfo: ImportInfo): boolean {
    // Simple heuristic: check if import name appears in the file after the import line
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const contentAfterImport = lines.slice(importInfo.lineNumber).join('\n');

      // Simple usage check - could be made more sophisticated with AST parsing
      const usageRegex = new RegExp(`\\b${importInfo.name}\\b`, 'g');
      return usageRegex.test(contentAfterImport);
    } catch {
      return false;
    }
  }

  private checkExportUsage(exportName: string): boolean {
    // Check if export is imported in any file
    for (const analysis of this.analysisResults.values()) {
      const isImported = analysis.imports.some(imp =>
        imp.name === exportName || (imp.type === 'namespace' && imp.name)
      );
      if (isImported) return true;
    }
    return false;
  }

  private findExportUsers(exportName: string): string[] {
    const users: string[] = [];

    for (const [filePath, analysis] of this.analysisResults.entries()) {
      const usesExport = analysis.imports.some(imp =>
        imp.name === exportName && imp.isUsed
      );
      if (usesExport) {
        users.push(filePath);
      }
    }

    return users;
  }

  private estimateSavings(analysis: CodeAnalysis): number {
    // Rough estimation of savings based on lines of code
    const deadCodeLines = analysis.deadExports.length + analysis.unusedImports.length;
    return deadCodeLines * 50; // Assume 50 bytes per line
  }

  private generateRecommendations(analysis: CodeAnalysis): TreeShakingRecommendation[] {
    const recommendations: TreeShakingRecommendation[] = [];

    // Remove unused exports
    if (analysis.deadExports.length > 0) {
      recommendations.push({
        type: 'remove-unused-exports',
        priority: 'high',
        description: `Remove ${analysis.deadExports.length} unused exports from ${analysis.filePath}`,
        filePath: analysis.filePath,
        estimatedSavings: analysis.deadExports.length * 50,
        action: `Remove exports: ${analysis.deadExports.join(', ')}`,
      });
    }

    // Remove unused imports
    if (analysis.unusedImports.length > 0) {
      recommendations.push({
        type: 'remove-unused-imports',
        priority: 'medium',
        description: `Remove ${analysis.unusedImports.length} unused imports from ${analysis.filePath}`,
        filePath: analysis.filePath,
        estimatedSavings: analysis.unusedImports.length * 25,
        action: `Remove imports: ${analysis.unusedImports.join(', ')}`,
      });
    }

    // Convert to ESM
    if (!analysis.canTreeShake && analysis.exports.length > 0) {
      recommendations.push({
        type: 'convert-to-esm',
        priority: 'high',
        description: `Convert ${analysis.filePath} to ES modules for better tree shaking`,
        filePath: analysis.filePath,
        estimatedSavings: 200,
        action: 'Replace CommonJS exports with ES module exports',
      });
    }

    // Fix side effects
    if (analysis.sideEffects && analysis.exports.length > 0) {
      recommendations.push({
        type: 'fix-side-effects',
        priority: 'medium',
        description: `Eliminate side effects in ${analysis.filePath} to enable tree shaking`,
        filePath: analysis.filePath,
        estimatedSavings: 150,
        action: 'Remove or isolate code with side effects',
      });
    }

    return recommendations;
  }

  private analyzeModules(): ModuleAnalysis {
    let esmModules = 0;
    let commonjsModules = 0;
    let modulesWithSideEffects = 0;
    let treeShakableModules = 0;
    const blockedModules: ModuleAnalysis['blockedModules'] = [];

    for (const analysis of this.analysisResults.values()) {
      if (analysis.canTreeShake) {
        esmModules++;
        treeShakableModules++;
      } else {
        commonjsModules++;
      }

      if (analysis.sideEffects) {
        modulesWithSideEffects++;
      }

      if (!analysis.canTreeShake && analysis.exports.length > 0) {
        blockedModules.push({
          path: analysis.filePath,
          reason: analysis.sideEffects ? 'Has side effects' : 'CommonJS module',
        });
      }
    }

    return {
      esmModules,
      commonjsModules,
      modulesWithSideEffects,
      treeShakableModules,
      blockedModules,
    };
  }

  async applyTreeShakingOptimizations(dryRun: boolean = true): Promise<TreeShakingRecommendation[]> {
    console.log(`🔧 ${dryRun ? 'Previewing' : 'Applying'} tree shaking optimizations...`);

    const report = await this.analyzeCodebase();
    const appliedRecommendations: TreeShakingRecommendation[] = [];

    for (const recommendation of report.recommendations) {
      try {
        if (!dryRun) {
          await this.applyRecommendation(recommendation);
        }
        appliedRecommendations.push(recommendation);
      } catch (error) {
        console.warn(`Failed to apply recommendation: ${recommendation.description}`, error);
      }
    }

    console.log(`${dryRun ? 'Previewed' : 'Applied'} ${appliedRecommendations.length} optimizations`);
    return appliedRecommendations;
  }

  private async applyRecommendation(recommendation: TreeShakingRecommendation): Promise<void> {
    switch (recommendation.type) {
      case 'remove-unused-exports':
        await this.removeUnusedExports(recommendation);
        break;
      case 'remove-unused-imports':
        await this.removeUnusedImports(recommendation);
        break;
      case 'convert-to-esm':
        await this.convertToESM(recommendation);
        break;
      case 'fix-side-effects':
        await this.fixSideEffects(recommendation);
        break;
      case 'enable-pure-annotations':
        await this.enablePureAnnotations(recommendation);
        break;
    }
  }

  private async removeUnusedExports(recommendation: TreeShakingRecommendation): Promise<void> {
    // Implementation would remove unused exports from the file
    console.log(`Removing unused exports from ${recommendation.filePath}`);
  }

  private async removeUnusedImports(recommendation: TreeShakingRecommendation): Promise<void> {
    // Implementation would remove unused imports from the file
    console.log(`Removing unused imports from ${recommendation.filePath}`);
  }

  private async convertToESM(recommendation: TreeShakingRecommendation): Promise<void> {
    // Implementation would convert CommonJS to ES modules
    console.log(`Converting ${recommendation.filePath} to ES modules`);
  }

  private async fixSideEffects(recommendation: TreeShakingRecommendation): Promise<void> {
    // Implementation would fix side effects
    console.log(`Fixing side effects in ${recommendation.filePath}`);
  }

  private async enablePureAnnotations(recommendation: TreeShakingRecommendation): Promise<void> {
    // Implementation would add pure annotations
    console.log(`Adding pure annotations to ${recommendation.filePath}`);
  }

  generateReport(): string {
    const report = this.analyzeCodebase();

    let output = '# Tree Shaking Analysis Report\n\n';
    output += `**Generated:** ${new Date().toISOString()}\n\n`;

    output += `## Summary\n`;
    output += `- **Total Files Analyzed:** ${report.totalFiles}\n`;
    output += `- **Files with Dead Code:** ${report.filesWithDeadCode.length}\n`;
    output += `- **Estimated Dead Code Size:** ${this.formatSize(report.totalDeadCode)}\n\n`;

    output += `## Module Analysis\n`;
    output += `- **ES Modules:** ${report.moduleAnalysis.esmModules}\n`;
    output += `- **CommonJS Modules:** ${report.moduleAnalysis.commonjsModules}\n`;
    output += `- **Tree Shakable Modules:** ${report.moduleAnalysis.treeShakableModules}\n`;
    output += `- **Modules with Side Effects:** ${report.moduleAnalysis.modulesWithSideEffects}\n\n`;

    if (report.filesWithDeadCode.length > 0) {
      output += `## Files with Dead Code\n`;
      report.filesWithDeadCode.forEach(file => {
        output += `\n### ${file.filePath}\n`;
        if (file.deadExports.length > 0) {
          output += `**Dead Exports:** ${file.deadExports.join(', ')}\n`;
        }
        if (file.unusedImports.length > 0) {
          output += `**Unused Imports:** ${file.unusedImports.join(', ')}\n`;
        }
        output += `**Estimated Savings:** ${this.formatSize(file.estimatedSavings)}\n`;
      });
    }

    if (report.recommendations.length > 0) {
      output += `\n## Recommendations\n`;
      report.recommendations.forEach((rec, index) => {
        output += `\n### ${index + 1}. ${rec.type.replace(/-/g, ' ').toUpperCase()}\n`;
        output += `**Priority:** ${rec.priority.toUpperCase()}\n`;
        output += `**Description:** ${rec.description}\n`;
        output += `**Action:** ${rec.action}\n`;
        output += `**Estimated Savings:** ${this.formatSize(rec.estimatedSavings)}\n`;
      });
    }

    return output;
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

interface DependencyInfo {
  name: string;
  version: string;
  isESM: boolean;
  hasSideEffects: boolean;
}

export {
  TreeShakingAnalyzer,
  type CodeAnalysis,
  type DeadCodeReport,
  type TreeShakingRecommendation,
  type ModuleAnalysis,
  type DependencyInfo,
};
