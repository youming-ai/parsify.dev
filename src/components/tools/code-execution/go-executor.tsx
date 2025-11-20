/**
 * Go Executor Component
 * Executes Go code in browser using TinyGo WASM compilation
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
import type { GoExecutionResult } from "@/lib/runtimes/go-wasm";

interface GoExecutorState {
  code: string;
  packageName: string;
  input: string;
  output: string;
  error: string | null;
  isRunning: boolean;
  isCompiled: boolean;
  wasmFile: string;
  buildTime: number;
  executionTime: number;
  memoryUsage: number;
  goVersion: string;
  target: string;
  editorSettings: {
    fontSize: number;
    theme: "light" | "dark";
    wordWrap: boolean;
    minimap: boolean;
  };
}

interface GoPreset {
  name: string;
  description: string;
  code: string;
  packageName: string;
  input: string;
}

const GO_PRESETS: GoPreset[] = [
  {
    name: "Hello World",
    description: 'Simple Go "Hello World" program',
    code: `package main

import (
    "fmt"
    "time"
)

func main() {
    fmt.Println("Hello, World!")
    fmt.Println("Welcome to Go execution in the browser!")

    // Basic data types
    name := "Go Developer"
    version := 1.21
    isAwesome := true
    rating := 4.8

    fmt.Printf("Name: %s\\n", name)
    fmt.Printf("Version: %.1f\\n", version)
    fmt.Printf("Awesome: %t\\n", isAwesome)
    fmt.Printf("Rating: %.1f\\n", rating)

    // Current time
    now := time.Now()
    fmt.Printf("Current time: %s\\n", now.Format("2006-01-02 15:04:05"))
}`,
    packageName: "main",
    input: "",
  },
  {
    name: "Structs and Methods",
    description: "Go struct definitions and methods",
    code: `package main

import (
    "fmt"
    "math"
)

// Rectangle struct
type Rectangle struct {
    Width  float64
    Height float64
    Color  string
}

// Area method
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// Perimeter method
func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

// String method
func (r Rectangle) String() string {
    return fmt.Sprintf("Rectangle{Width: %.1f, Height: %.1f, Color: %s}",
        r.Width, r.Height, r.Color)
}

// Circle struct
type Circle struct {
    Radius float64
    Color  string
}

// Area method for Circle
func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

// Perimeter method for Circle
func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

// String method for Circle
func (c Circle) String() string {
    return fmt.Sprintf("Circle{Radius: %.1f, Color: %s}", c.Radius, c.Color)
}

func main() {
    // Create a rectangle
    rect := Rectangle{
        Width:  10.0,
        Height: 5.0,
        Color:  "blue",
    }

    // Create a circle
    circle := Circle{
        Radius: 7.0,
        Color:  "red",
    }

    fmt.Printf("Rectangle: %s\\n", rect)
    fmt.Printf("Rectangle Area: %.2f\\n", rect.Area())
    fmt.Printf("Rectangle Perimeter: %.2f\\n\\n", rect.Perimeter())

    fmt.Printf("Circle: %s\\n", circle)
    fmt.Printf("Circle Area: %.2f\\n", circle.Area())
    fmt.Printf("Circle Perimeter: %.2f\\n", circle.Perimeter())

    // Compare areas
    rectArea := rect.Area()
    circleArea := circle.Area()

    if rectArea > circleArea {
        fmt.Printf("Rectangle has larger area (%.2f > %.2f)\\n", rectArea, circleArea)
    } else {
        fmt.Printf("Circle has larger area (%.2f > %.2f)\\n", circleArea, rectArea)
    }
}`,
    packageName: "main",
    input: "",
  },
  {
    name: "Slice Operations",
    description: "Go slice manipulation and algorithms",
    code: `package main

import (
    "fmt"
    "sort"
    "strconv"
)

func main() {
    // Basic slice operations
    numbers := []int{5, 2, 8, 1, 9, 3, 7, 4, 6}
    fmt.Printf("Original slice: %v\\n", numbers)

    // Appending
    numbers = append(numbers, 10, 11, 12)
    fmt.Printf("After append: %v\\n", numbers)

    // Length and capacity
    fmt.Printf("Length: %d, Capacity: %d\\n", len(numbers), cap(numbers))

    // Slicing
    fmt.Printf("First 5 elements: %v\\n", numbers[:5])
    fmt.Printf("Last 3 elements: %v\\n", numbers[len(numbers)-3:])

    // Sorting
    sort.Ints(numbers)
    fmt.Printf("Sorted: %v\\n", numbers)

    // Find element
    target := 7
    index := -1
    for i, num := range numbers {
        if num == target {
            index = i
            break
        }
    }

    if index != -1 {
        fmt.Printf("Found %d at index %d\\n", target, index)
    } else {
        fmt.Printf("Could not find %d\\n", target)
    }

    // String slice operations
    words := []string{"apple", "banana", "cherry", "date", "elderberry"}
    fmt.Printf("\\nOriginal words: %v\\n", words)

    sort.Strings(words)
    fmt.Printf("Sorted words: %v\\n", words)

    // Map with string slice
    wordLengths := make(map[string]int)
    for _, word := range words {
        wordLengths[word] = len(word)
    }

    fmt.Printf("Word lengths: %v\\n", wordLengths)

    // Filter slice
    evenNumbers := []int{}
    for _, num := range numbers {
        if num%2 == 0 {
            evenNumbers = append(evenNumbers, num)
        }
    }
    fmt.Printf("Even numbers: %v\\n", evenNumbers)

    // Convert int slice to string slice
    strings := make([]string, len(numbers))
    for i, num := range numbers {
        strings[i] = strconv.Itoa(num)
    }
    fmt.Printf("String representation: %v\\n", strings)
}`,
    packageName: "main",
    input: "",
  },
  {
    name: "Goroutines and Channels",
    description: "Concurrent programming with goroutines",
    code: `package main

import (
    "fmt"
    "sync"
    "time"
)

// Worker function
func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()

    for job := range jobs {
        fmt.Printf("Worker %d started job %d\\n", id, job)

        // Simulate work
        time.Sleep(time.Millisecond * 500)

        result := job * job // Square the number
        fmt.Printf("Worker %d completed job %d with result %d\\n", id, job, result)

        results <- result
    }
}

func main() {
    const numWorkers = 3
    const numJobs = 8

    jobs := make(chan int, numJobs)
    results := make(chan int, numJobs)

    var wg sync.WaitGroup

    // Start workers
    fmt.Printf("Starting %d workers\\n", numWorkers)
    for i := 1; i <= numWorkers; i++ {
        wg.Add(1)
        go worker(i, jobs, results, &wg)
    }

    // Send jobs
    fmt.Printf("\\nSending %d jobs\\n", numJobs)
    for j := 1; j <= numJobs; j++ {
        jobs <- j
        fmt.Printf("Sent job %d\\n", j)
    }
    close(jobs)

    // Collect results
    fmt.Printf("\\nCollecting results:\\n")
    totalResult := 0
    for i := 0; i < numJobs; i++ {
        result := <-results
        totalResult += result
        fmt.Printf("Received result: %d (total: %d)\\n", result, totalResult)
    }

    // Wait for workers to finish
    wg.Wait()

    fmt.Printf("\\nAll jobs completed! Final total: %d\\n", totalResult)

    // Channel example with timeout
    timeout := make(chan bool, 1)
    go func() {
        time.Sleep(time.Second * 2)
        timeout <- true
    }()

    select {
    case <-timeout:
        fmt.Println("Operation completed within timeout")
    case <-time.After(time.Second * 1):
        fmt.Println("Operation timed out")
    }

    // Buffered channel example
    buffer := make(chan string, 3)

    go func() {
        for i := 1; i <= 5; i++ {
            buffer <- fmt.Sprintf("Message %d", i)
            fmt.Printf("Sent Message %d to buffer\\n", i)
        }
        close(buffer)
    }()

    fmt.Printf("\\nReceiving from buffer:\\n")
    for msg := range buffer {
        fmt.Printf("Received: %s\\n", msg)
    }
}`,
    packageName: "main",
    input: "",
  },
];

export function GoExecutor(): React.ReactElement {
  const [state, setState] = useState<GoExecutorState>({
    code: GO_PRESETS[0].code,
    packageName: GO_PRESETS[0].packageName,
    input: GO_PRESETS[0].input,
    output: "",
    error: null,
    isRunning: false,
    isCompiled: false,
    wasmFile: "",
    buildTime: 0,
    executionTime: 0,
    memoryUsage: 0,
    goVersion: "1.21",
    target: "wasm",
    editorSettings: {
      fontSize: 14,
      theme: "dark",
      wordWrap: true,
      minimap: true,
    },
  });

  const [goRuntime, setGoRuntime] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const memoryManager = MemoryManager.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize Go runtime
  useEffect(() => {
    const initRuntime = async () => {
      try {
        const { GoWasm } = await import("@/lib/runtimes/go-wasm");
        const runtime = GoWasm.getInstance();
        await runtime.initialize();
        setGoRuntime(runtime);
      } catch (error) {
        console.error("Failed to initialize Go runtime:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to initialize Go runtime. Please refresh the page.",
        }));
      }
    };

    initRuntime();
  }, []);

  // Load preset
  const loadPreset = useCallback((preset: GoPreset) => {
    setState((prev) => ({
      ...prev,
      code: preset.code,
      packageName: preset.packageName,
      input: preset.input,
      output: "",
      error: null,
      isCompiled: false,
    }));
  }, []);

  // Build Go code
  const buildCode = useCallback(async () => {
    if (!goRuntime || !state.code.trim()) {
      setState((prev) => ({
        ...prev,
        error: state.code.trim() ? "Go runtime not initialized" : "Please enter Go code",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isRunning: true, error: null }));

    try {
      const startTime = performance.now();
      performanceMonitor.trackToolLoad("go-executor");

      const result = await goRuntime.build(state.code, state.packageName);
      const buildTime = performance.now() - startTime;

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isCompiled: true,
          wasmFile: result.wasmFile || "main.wasm",
          buildTime,
          output:
            "✅ Build successful!\n" +
            `Generated WASM file: ${result.wasmFile || "main.wasm"}\n` +
            `Build time: ${buildTime.toFixed(2)}ms\n` +
            `Go version: ${state.goVersion}\n` +
            `Target: ${state.target}\n`,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isCompiled: false,
          error: result.error || "Build failed",
          output: "",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Build error",
        isCompiled: false,
        output: "",
      }));
    } finally {
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [
    goRuntime,
    state.code,
    state.packageName,
    state.goVersion,
    state.target,
    performanceMonitor.trackToolLoad,
  ]);

  // Run compiled Go code
  const runCode = useCallback(async () => {
    if (!goRuntime || !state.isCompiled) {
      setState((prev) => ({
        ...prev,
        error: !state.isCompiled ? "Please build the code first" : "Go runtime not initialized",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isRunning: true, error: null }));

    try {
      const startTime = performance.now();

      const result: GoExecutionResult = await goRuntime.run(state.wasmFile, state.input);

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
  }, [goRuntime, state.wasmFile, state.input, state.isCompiled, memoryManager]);

  // Build and run in one step
  const buildAndRun = useCallback(async () => {
    await buildCode();
    if (state.isCompiled) {
      await runCode();
    }
  }, [buildCode, runCode, state.isCompiled]);

  // Stop execution
  const stopExecution = useCallback(() => {
    if (goRuntime) {
      goRuntime.stop();
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [goRuntime]);

  // Clear output
  const clearOutput = useCallback(() => {
    setState((prev) => ({ ...prev, output: "", error: null }));
  }, []);

  // Export code
  const exportCode = useCallback(() => {
    const blob = new Blob([state.code], { type: "text/x-go-source" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.packageName || "main"}.go`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.code, state.packageName]);

  // Import code
  const importCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".go")) {
        // Extract package name from file or use default
        const packageName = file.name.replace(/\.go$/i, "");
        setState((prev) => ({
          ...prev,
          code: content,
          packageName,
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
    id: "go-executor",
    name: "Go Executor",
    description: "Execute Go code in browser using TinyGo WASM compilation",
    category: "code",
    version: "1.0.0",
    icon: "🐹",
    tags: ["go", "golang", "tinygo", "wasm", "execution"],
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
      isLoading={!goRuntime}
      loadingMessage="Initializing Go runtime..."
      onExport={exportCode}
      onImport={() => document.getElementById("go-import")?.click()}
      onCopy={() => navigator.clipboard.writeText(state.output)}
      onReset={() => loadPreset(GO_PRESETS[0])}
      performance={{
        loadTime: state.buildTime + state.executionTime,
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
      <input id="go-import" type="file" accept=".go" onChange={importCode} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Go Code Editor</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedPreset}
                onChange={(e) => {
                  const index = parseInt(e.target.value, 10);
                  setSelectedPreset(index);
                  loadPreset(GO_PRESETS[index]);
                }}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {GO_PRESETS.map((preset, index) => (
                  <option key={index} value={index}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={state.isRunning ? stopExecution : buildAndRun}
                disabled={!goRuntime}
              >
                {state.isRunning ? (
                  <>
                    <Square className="w-4 h-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Build & Run
                  </>
                )}
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Package Name</label>
                  <input
                    type="text"
                    value={state.packageName}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        packageName: e.target.value,
                        isCompiled: false,
                      }))
                    }
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm font-mono"
                    placeholder="main"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Go Code</label>
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
                    placeholder="Enter your Go code here..."
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
                Provide input for the Go program (reads from os.Stdin)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <textarea
                value={state.input}
                onChange={(e) => setState((prev) => ({ ...prev, input: e.target.value }))}
                className="w-full h-24 px-3 py-2 border rounded-md text-sm font-mono resize-none"
                placeholder="Enter input for the Go program..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Console Output</h3>
            <div className="flex items-center gap-2">
              {state.buildTime > 0 && (
                <Badge variant="secondary">Build: {state.buildTime.toFixed(2)}ms</Badge>
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

          {/* Build Status */}
          {state.isCompiled && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4" />
                  <h4 className="font-medium">Build Status</h4>
                  <Badge variant="default">Compiled</Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>WASM file: {state.wasmFile}</p>
                  <p>Go version: {state.goVersion}</p>
                  <p>Target: {state.target}</p>
                  <p>Build time: {state.buildTime.toFixed(2)}ms</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
}

export default GoExecutor;
