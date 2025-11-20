/**
 * Java Executor Component
 * Executes Java code in browser using TeaVM WASM compilation
 */

import { Package, Play, Square } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ToolConfig, ToolWrapper } from "@/components/tools/tool-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemoryManager } from "@/lib/memory-manager";
import { PerformanceMonitor } from "@/lib/performance-monitor";
import type { JavaExecutionResult } from "@/lib/runtimes/java-wasm";

interface JavaExecutorState {
  code: string;
  className: string;
  input: string;
  output: string;
  error: string | null;
  isRunning: boolean;
  isCompiled: boolean;
  jarFiles: string[];
  compileTime: number;
  executionTime: number;
  memoryUsage: number;
  lineNumber: number;
  columnNumber: number;
  editorVisible: boolean;
  consoleVisible: boolean;
  editorSettings: {
    fontSize: number;
    theme: "light" | "dark";
    wordWrap: boolean;
    minimap: boolean;
  };
}

interface JavaPreset {
  name: string;
  description: string;
  code: string;
  className: string;
  input: string;
}

const JAVA_PRESETS: JavaPreset[] = [
  {
    name: "Hello World",
    description: 'Simple Java "Hello World" program',
    code: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");

        // Basic data types
        String message = "Welcome to Java execution";
        int number = 42;
        double decimal = 3.14159;

        System.out.println(message);
        System.out.println("Number: " + number);
        System.out.println("Pi: " + decimal);
    }
}`,
    className: "HelloWorld",
    input: "",
  },
  {
    name: "Class Example",
    description: "Java class with methods and properties",
    code: `public class Calculator {
    private double result;

    public Calculator() {
        this.result = 0.0;
    }

    public double add(double a, double b) {
        result = a + b;
        return result;
    }

    public double subtract(double a, double b) {
        result = a - b;
        return result;
    }

    public double multiply(double a, double b) {
        result = a * b;
        return result;
    }

    public double divide(double a, double b) {
        if (b != 0) {
            result = a / b;
        } else {
            throw new ArithmeticException("Division by zero");
        }
        return result;
    }

    public static void main(String[] args) {
        Calculator calc = new Calculator();

        System.out.println("5 + 3 = " + calc.add(5, 3));
        System.out.println("10 - 4 = " + calc.subtract(10, 4));
        System.out.println("6 * 7 = " + calc.multiply(6, 7));
        System.out.println("15 / 3 = " + calc.divide(15, 3));
    }
}`,
    className: "Calculator",
    input: "",
  },
  {
    name: "Array Operations",
    description: "Java array manipulation and algorithms",
    code: `import java.util.Arrays;
import java.util.ArrayList;

public class ArrayDemo {
    public static void main(String[] args) {
        // Basic array operations
        int[] numbers = {5, 2, 8, 1, 9, 3, 7, 4, 6};

        System.out.println("Original array: " + Arrays.toString(numbers));

        // Sorting
        Arrays.sort(numbers);
        System.out.println("Sorted array: " + Arrays.toString(numbers));

        // Sum calculation
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Sum: " + sum);
        System.out.println("Average: " + (double) sum / numbers.length);

        // Find maximum
        int max = numbers[0];
        for (int num : numbers) {
            if (num > max) {
                max = num;
            }
        }
        System.out.println("Maximum: " + max);

        // ArrayList usage
        ArrayList<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");
        names.add("Charlie");

        System.out.println("Names: " + names);

        // Enhanced for loop
        for (String name : names) {
            System.out.println("Hello, " + name + "!");
        }
    }
}`,
    className: "ArrayDemo",
    input: "",
  },
  {
    name: "String Processing",
    description: "Java string manipulation and methods",
    code: `import java.util.StringTokenizer;

public class StringDemo {
    public static void main(String[] args) {
        String text = "Hello World! This is a Java String Demo.";

        // Basic string operations
        System.out.println("Original: " + text);
        System.out.println("Length: " + text.length());
        System.out.println("Uppercase: " + text.toUpperCase());
        System.out.println("Lowercase: " + text.toLowerCase());

        // String searching
        System.out.println("Contains 'Java': " + text.contains("Java"));
        System.out.println("Starts with 'Hello': " + text.startsWith("Hello"));
        System.out.println("Ends with 'Demo.': " + text.endsWith("Demo."));

        // String splitting
        String[] words = text.split(" ");
        System.out.println("Words count: " + words.length);
        for (int i = 0; i < words.length; i++) {
            System.out.println("Word " + (i + 1) + ": " + words[i]);
        }

        // String tokenization
        String data = "John,Doe,30,Engineer";
        StringTokenizer tokenizer = new StringTokenizer(data, ",");

        System.out.println("\\nParsing comma-separated data:");
        while (tokenizer.hasMoreTokens()) {
            System.out.println("Token: " + tokenizer.nextToken());
        }

        // String formatting
        String name = "Alice";
        int age = 25;
        double score = 95.5;

        System.out.println("\\nFormatted output:");
        System.out.printf("Name: %s, Age: %d, Score: %.1f\\n", name, age, score);

        // StringBuilder for efficient concatenation
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append("Line ").append(i).append("\\n");
        }
        System.out.println("\\nStringBuilder result:\\n" + sb.toString());
    }
}`,
    className: "StringDemo",
    input: "",
  },
];

export function JavaExecutor(): React.ReactElement {
  const [state, setState] = useState<JavaExecutorState>({
    code: JAVA_PRESETS[0].code,
    className: JAVA_PRESETS[0].className,
    input: JAVA_PRESETS[0].input,
    output: "",
    error: null,
    isRunning: false,
    isCompiled: false,
    jarFiles: [],
    compileTime: 0,
    executionTime: 0,
    memoryUsage: 0,
    lineNumber: 1,
    columnNumber: 1,
    editorVisible: true,
    consoleVisible: true,
    editorSettings: {
      fontSize: 14,
      theme: "dark",
      wordWrap: true,
      minimap: true,
    },
  });

  const [javaRuntime, setJavaRuntime] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const memoryManager = MemoryManager.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize Java runtime
  useEffect(() => {
    const initRuntime = async () => {
      try {
        const { JavaWasm } = await import("@/lib/runtimes/java-wasm");
        const runtime = JavaWasm.getInstance();
        await runtime.initialize();
        setJavaRuntime(runtime);
      } catch (error) {
        console.error("Failed to initialize Java runtime:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to initialize Java runtime. Please refresh the page.",
        }));
      }
    };

    initRuntime();
  }, []);

  // Load preset
  const loadPreset = useCallback((preset: JavaPreset) => {
    setState((prev) => ({
      ...prev,
      code: preset.code,
      className: preset.className,
      input: preset.input,
      output: "",
      error: null,
      isCompiled: false,
    }));
  }, []);

  // Compile Java code
  const compileCode = useCallback(async () => {
    if (!javaRuntime || !state.code.trim()) {
      setState((prev) => ({
        ...prev,
        error: state.code.trim() ? "Java runtime not initialized" : "Please enter Java code",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isRunning: true, error: null }));

    try {
      // Start performance tracking
      const startTime = performance.now();
      performanceMonitor.trackToolLoad("java-executor");

      const result = await javaRuntime.compile(state.code, state.className);
      const compileTime = performance.now() - startTime;

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isCompiled: true,
          jarFiles: result.jarFiles || [],
          compileTime,
          output:
            "✅ Compilation successful!\n" +
            `Generated ${result.jarFiles?.length || 0} class files\n` +
            `Compilation time: ${compileTime.toFixed(2)}ms\n`,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isCompiled: false,
          error: result.error || "Compilation failed",
          output: "",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Compilation error",
        isCompiled: false,
        output: "",
      }));
    } finally {
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [javaRuntime, state.code, state.className, performanceMonitor.trackToolLoad]);

  // Run compiled Java code
  const runCode = useCallback(async () => {
    if (!javaRuntime || !state.isCompiled) {
      setState((prev) => ({
        ...prev,
        error: !state.isCompiled ? "Please compile the code first" : "Java runtime not initialized",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isRunning: true, error: null }));

    try {
      const startTime = performance.now();

      const result: JavaExecutionResult = await javaRuntime.run(
        state.className,
        state.className,
        state.input,
      );

      const executionTime = performance.now() - startTime;
      const memoryUsage = memoryManager.getCurrentMemoryUsage();

      if (result.success) {
        const output = result.output || "";
        setState((prev) => ({
          ...prev,
          output: output || "Program executed successfully (no output)",
          executionTime,
          memoryUsage,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || "Execution failed",
          output: result.output || "",
          executionTime,
          memoryUsage,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Execution error",
        output: "",
      }));
    } finally {
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [javaRuntime, state.className, state.input, state.isCompiled, memoryManager]);

  // Compile and run in one step
  const compileAndRun = useCallback(async () => {
    await compileCode();
    if (state.isCompiled) {
      await runCode();
    }
  }, [compileCode, runCode, state.isCompiled]);

  // Stop execution
  const stopExecution = useCallback(() => {
    if (javaRuntime) {
      javaRuntime.stop();
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [javaRuntime]);

  // Clear output
  const clearOutput = useCallback(() => {
    setState((prev) => ({ ...prev, output: "", error: null }));
  }, []);

  // Export code
  const exportCode = useCallback(() => {
    const blob = new Blob([state.code], { type: "text/x-java-source" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.className || "Main"}.java`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.code, state.className]);

  // Import code
  const importCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".java")) {
        const className = file.name.replace(/\.java$/i, "");
        setState((prev) => ({
          ...prev,
          code: content,
          className,
          isCompiled: false,
          output: "",
          error: null,
        }));
      }
    };
    reader.readAsText(file);
  }, []);

  // Scroll to bottom of output
  useEffect(() => {
    if (outputRef.current && state.output) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [state.output]);

  const toolConfig: ToolConfig = {
    id: "java-executor",
    name: "Java Executor",
    description: "Execute Java code in browser using TeaVM WASM compilation",
    category: "code",
    version: "1.0.0",
    icon: "☕",
    tags: ["java", "compiler", "tea", "wasm", "execution"],
    hasSettings: true,
    hasHelp: true,
    canExport: true,
    canImport: true,
    canCopy: true,
    canReset: true,
  };

  return (
    <ToolWrapper
      config={toolConfig}
      isLoading={!javaRuntime}
      loadingMessage="Initializing Java runtime..."
      onExport={exportCode}
      onImport={() => document.getElementById("java-import")?.click()}
      onCopy={() => navigator.clipboard.writeText(state.output)}
      onReset={() => loadPreset(JAVA_PRESETS[0])}
      performance={{
        loadTime: state.compileTime + state.executionTime,
        memoryUsage: state.memoryUsage,
        renderTime: 0,
      }}
      status={state.isRunning ? "processing" : state.error ? "error" : "ready"}
      notifications={
        state.error
          ? [
              {
                type: "error",
                message: state.error,
                timestamp: Date.now(),
              },
            ]
          : []
      }
      onNotificationDismiss={() => setState((prev) => ({ ...prev, error: null }))}
    >
      <input id="java-import" type="file" accept=".java" onChange={importCode} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Java Code Editor</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedPreset}
                onChange={(e) => {
                  const index = parseInt(e.target.value, 10);
                  setSelectedPreset(index);
                  loadPreset(JAVA_PRESETS[index]);
                }}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {JAVA_PRESETS.map((preset, index) => (
                  <option key={index} value={index}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={state.isRunning ? stopExecution : compileAndRun}
                disabled={!javaRuntime}
              >
                {state.isRunning ? (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Compile & Run
                  </>
                )}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Class Name</label>
                  <input
                    type="text"
                    value={state.className}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        className: e.target.value,
                        isCompiled: false,
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm font-mono"
                    placeholder="Main"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Java Code</label>
                  <textarea
                    value={state.code}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        code: e.target.value,
                        isCompiled: false,
                      }))
                    }
                    className="w-full mt-1 h-64 px-3 py-2 border rounded-md text-sm font-mono resize-none"
                    placeholder="Enter your Java code here..."
                    spellCheck={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Standard Input</CardTitle>
              <CardDescription>
                Provide input for the Java program (reads from System.in)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <textarea
                value={state.input}
                onChange={(e) => setState((prev) => ({ ...prev, input: e.target.value }))}
                className="w-full h-24 px-3 py-2 border rounded-md text-sm font-mono resize-none"
                placeholder="Enter input for the Java program..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Console Output</h3>
            <div className="flex items-center gap-2">
              {state.compileTime > 0 && (
                <Badge variant="secondary">Compile: {state.compileTime.toFixed(2)}ms</Badge>
              )}
              {state.executionTime > 0 && (
                <Badge variant="secondary">Run: {state.executionTime.toFixed(2)}ms</Badge>
              )}
              {state.memoryUsage > 0 && (
                <Badge variant="secondary">
                  Memory: {(state.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </Badge>
              )}
              <Button size="sm" variant="outline" onClick={clearOutput}>
                Clear
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <ScrollArea
                className="h-80 border rounded-md p-3 font-mono text-sm bg-gray-50 dark:bg-gray-900"
                ref={outputRef}
              >
                {state.output || "Output will appear here..."}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Compilation Status */}
          {state.isCompiled && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4" />
                  <h4 className="font-medium">Compilation Status</h4>
                  <Badge variant="default">Compiled</Badge>
                </div>
                {state.jarFiles.length > 0 && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Generated class files:
                    <ul className="mt-1 ml-4 list-disc">
                      {state.jarFiles.map((file, index) => (
                        <li key={index}>{file}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
}

export default JavaExecutor;
