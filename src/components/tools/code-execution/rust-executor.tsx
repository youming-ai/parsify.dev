'use client';

/**
 * Rust Executor Component
 * Executes Rust code in browser using native WASM compilation
 */

import { type ToolConfig, ToolWrapper } from '@/components/tools/tool-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MemoryManager } from '@/lib/memory-manager';
import { PerformanceMonitor } from '@/lib/performance-monitor';
import type { RustExecutionResult } from '@/lib/runtimes/rust-wasm';
import { Package, Play, Square } from '@phosphor-icons/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface RustExecutorState {
  code: string;
  crateName: string;
  dependencies: string[];
  features: string[];
  input: string;
  output: string;
  error: string | null;
  isRunning: boolean;
  isCompiled: boolean;
  wasmFile: string;
  buildTime: number;
  executionTime: number;
  memoryUsage: number;
  rustVersion: string;
  target: string;
  optimizationLevel: 'debug' | 'release';
  editorSettings: {
    fontSize: number;
    theme: 'light' | 'dark';
    wordWrap: boolean;
    minimap: boolean;
  };
}

interface RustPreset {
  name: string;
  description: string;
  code: string;
  crateName: string;
  dependencies: string[];
  features: string[];
  input: string;
}

const RUST_PRESETS: RustPreset[] = [
  {
    name: 'Hello World',
    description: 'Simple Rust "Hello World" program',
    code: `fn main() {
    println!("Hello, World!");
    println!("Welcome to Rust execution in the browser!");

    // Basic data types and pattern matching
    let name = "Rust Developer";
    let version: f64 = 1.75.0;
    let is_awesome: bool = true;

    println!("Name: {}", name);
    println!("Version: {}", version);
    println!("Awesome: {}", is_awesome);

    // Basic arithmetic
    let a = 10;
    let b = 20;
    println!("{} + {} = {}", a, b, a + b);
    println!("{} * {} = {}", a, b, a * b);

    // String formatting
    let message = format!("{} is {} years old", name, (version * 10.0) as i32);
    println!("{}", message);
}`,
    crateName: 'hello_world',
    dependencies: [],
    features: [],
    input: '',
  },
  {
    name: 'Structs and Impls',
    description: 'Rust struct definitions and implementations',
    code: `#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
    email: String,
}

impl Person {
    fn new(name: &str, age: u32, email: &str) -> Self {
        Person {
            name: name.to_string(),
            age,
            email: email.to_string(),
        }
    }

    fn birthday(&mut self) {
        self.age += 1;
        println!("Happy birthday, {}! You are now {} years old.", self.name, self.age);
    }

    fn change_email(&mut self, new_email: &str) {
        self.email = new_email.to_string();
    }

    fn print_info(&self) {
        println!("Person Information:");
        println!("  Name: {}", self.name);
        println!("  Age: {}", self.age);
        println!("  Email: {}", self.email);
    }
}

trait Vehicle {
    fn start(&self);
    fn stop(&mut self);
    fn is_running(&self) -> bool;
    fn get_type(&self) -> &str;
}

#[derive(Debug)]
struct Car {
    brand: String,
    model: String,
    year: u32,
    running: bool,
}

impl Vehicle for Car {
    fn start(&self) {
        println!("Starting {} {}", self.brand, self.model);
    }

    fn stop(&mut self) {
        println!("Stopping {} {}", self.brand, self.model);
        self.running = false;
    }

    fn is_running(&self) -> bool {
        self.running
    }

    fn get_type(&self) -> &str {
        "Car"
    }
}

impl Car {
    fn new(brand: &str, model: &str, year: u32) -> Self {
        Car {
            brand: brand.to_string(),
            model: model.to_string(),
            year,
            running: false,
        }
    }

    fn drive(&mut self, distance: u32) {
        if self.running {
            println!("Driving {} km", distance);
        } else {
            println!("Car is not running!");
        }
    }
}

fn main() {
    // Create and use Person struct
    let mut person = Person::new("Alice Smith", 30, "alice@example.com");
    person.print_info();

    person.birthday();
    person.change_email("alice.smith@newdomain.com");
    person.print_info();

    println!();

    // Create and use Car struct with Vehicle trait
    let mut car = Car::new("Toyota", "Camry", 2023);
    println!("Created: {:?}", car);

    car.start();
    println!("Is running: {}", car.is_running());
    println!("Type: {}", car.get_type());

    car.drive(100);
    car.stop();

    // Using struct update syntax
    let updated_car = Car {
        model: String::from("Prius"),
        ..car
    };
    println!("Updated: {:?}", updated_car);
}`,
    crateName: 'structs_impls',
    dependencies: [],
    features: [],
    input: '',
  },
  {
    name: 'Vec Operations',
    description: 'Rust vector manipulation and algorithms',
    code: `use std::collections::HashMap;

fn main() {
    // Basic vector operations
    let mut numbers = vec![5, 2, 8, 1, 9, 3, 7, 4, 6];
    println!("Original vector: {:?}", numbers);

    // Adding elements
    numbers.push(10);
    numbers.push(11);
    numbers.push(12);
    println!("After pushing: {:?}", numbers);

    // Length and capacity
    println!("Length: {}, Capacity: {}", numbers.len(), numbers.capacity());

    // Accessing elements
    if let Some(first) = numbers.first() {
        println!("First element: {}", first);
    }

    if let Some(last) = numbers.last() {
        println!("Last element: {}", last);
    }

    // Slicing
    println!("First 5 elements: {:?}", &numbers[0..5]);
    println!("Last 3 elements: {:?}", &numbers[numbers.len()-3..]);

    // Sorting
    numbers.sort();
    println!("Sorted: {:?}", numbers);

    // Finding elements
    let target = 7;
    match numbers.iter().position(|&x| x == target) {
        Some(index) => println!("Found {} at index {}", target, index),
        None => println!("Could not find {}", target),
    }

    // Filter and map
    let even_numbers: Vec<i32> = numbers.iter()
        .filter(|&&x| x % 2 == 0)
        .copied()
        .collect();
    println!("Even numbers: {:?}", even_numbers);

    let doubled: Vec<i32> = numbers.iter()
        .map(|x| x * 2)
        .collect();
    println!("Doubled numbers: {:?}", doubled);

    // String vector operations
    let mut words = vec![
        "apple".to_string(),
        "banana".to_string(),
        "cherry".to_string(),
        "date".to_string(),
        "elderberry".to_string(),
    ];
    println!("Original words: {:?}", words);

    words.sort();
    println!("Sorted words: {:?}", words);

    // Word lengths
    let word_lengths: HashMap<String, usize> = words.iter()
        .map(|word| (word.clone(), word.len()))
        .collect();
    println!("Word lengths: {:?}", word_lengths);

    // Iterators and consumers
    let sum: i32 = numbers.iter().sum();
    println!("Sum of numbers: {}", sum);

    let max = numbers.iter().max();
    match max {
        Some(&max_val) => println!("Maximum value: {}", max_val),
        None => println!("Empty vector"),
    }

    // Remove elements
    let index = numbers.iter().position(|&x| x == 8);
    if let Some(idx) = index {
        numbers.remove(idx);
        println!("After removing 8: {:?}", numbers);
    }

    // Extend with another vector
    let more_numbers = vec![13, 14, 15];
    numbers.extend(more_numbers);
    println!("After extending: {:?}", numbers);

    // Drain vector (consume elements)
    let mut consumed: Vec<i32> = numbers.drain(2..5).collect();
    println!("Consumed elements: {:?}", consumed);
    println!("Remaining elements: {:?}", numbers);
}`,
    crateName: 'vec_operations',
    dependencies: [],
    features: [],
    input: '',
  },
  {
    name: 'Error Handling',
    description: 'Rust ownership and error handling',
    code: `use std::fs::File;
use std::io::{self, Read};

#[derive(Debug)]
enum MathError {
    DivisionByZero,
    NegativeSquareRoot,
    InvalidInput(String),
}

impl std::fmt::Display for MathError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MathError::DivisionByZero => write!(f, "Division by zero"),
            MathError::NegativeSquareRoot => write!(f, "Negative square root"),
            MathError::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
        }
    }
}

impl std::error::Error for MathError {}

// Custom Result type alias
type MathResult<T> = Result<T, Box<dyn std::error::Error>>;

fn divide(a: f64, b: f64) -> MathResult<f64> {
    if b == 0.0 {
        return Err(Box::new(MathError::DivisionByZero));
    }
    Ok(a / b)
}

fn square_root(x: f64) -> MathResult<f64> {
    if x < 0.0 {
        return Err(Box::new(MathError::NegativeSquareRoot));
    }
    Ok(x.sqrt())
}

fn parse_number(s: &str) -> MathResult<f64> {
    s.trim()
        .parse::<f64>()
        .map_err(|_| Box::new(MathError::InvalidInput(
            format!("'{}' is not a valid number", s)
        )))
}

// Function that can return multiple error types
fn calculate_expression(expr: &str) -> MathResult<f64> {
    let parts: Vec<&str> = expr.trim().split_whitespace().collect();

    if parts.len() != 3 {
        return Err(Box::new(MathError::InvalidInput(
            "Expression must be in format: number operator number"
        )));
    }

    let a = parse_number(parts[0])?;
    let operator = parts[1];
    let b = parse_number(parts[2])?;

    match operator {
        "+" => Ok(a + b),
        "-" => Ok(a - b),
        "*" => Ok(a * b),
        "/" => divide(a, b),
        "^" => square_root(a),
        _ => Err(Box::new(MathError::InvalidInput(
            format!("Unknown operator: {}", operator)
        ))),
    }
}

fn read_file_content(filename: &str) -> io::Result<String> {
    let mut file = File::open(filename)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    Ok(content)
}

fn main() {
    println!("=== Error Handling Examples ===\\n");

    // Successful operations
    match divide(10.0, 2.0) {
        Ok(result) => println!("10 / 2 = {}", result),
        Err(e) => println!("Division error: {}", e),
    }

    match square_root(16.0) {
        Ok(result) => println!("√16 = {}", result),
        Err(e) => println!("Square root error: {}", e),
    }

    // Error cases
    match divide(10.0, 0.0) {
        Ok(result) => println!("10 / 0 = {}", result),
        Err(e) => println!("Division error: {}", e),
    }

    match square_root(-4.0) {
        Ok(result) => println!("√-4 = {}", result),
        Err(e) => println!("Square root error: {}", e),
    }

    // Using the calculate_expression function
    let expressions = vec![
        "5 + 3",
        "10 - 2",
        "4 * 6",
        "15 / 3",
        "9 ^ 2",
        "invalid expression",
        "1 / 0",
        "-4 ^ 2",
    ];

    println!("\\n=== Expression Calculator ===");
    for expr in expressions {
        println!("Evaluating: {}", expr);
        match calculate_expression(expr) {
            Ok(result) => println!("Result: {}\\n", result),
            Err(e) => println!("Error: {}\\n", e),
        }
    }

    // File I/O with error handling
    println!("=== File Operations ===");
    match read_file_content("nonexistent.txt") {
        Ok(content) => println!("File content: {}", content),
        Err(e) => println!("File error: {}", e),
    }

    // Chaining operations with ? operator
    println!("\\n=== Chained Operations ===");
    let result = parse_number("42")
        .and_then(|x| divide(x, 2.0))
        .and_then(|x| square_root(x))
        .unwrap_or(0.0);

    println!("Result of (√(42/2)): {}", result);

    // Panic vs Result
    println!("\\n=== Safe vs Unsafe ===");

    // Safe: Uses Result
    let safe_vec = vec![1, 2, 3];
    let safe_result = safe_vec.get(5).unwrap_or(&0);
    println!("Safe access: {}", safe_result);

    // This would panic at runtime, so we don't use it:
    // let panic_result = safe_vec[5]; // Would panic!
}`,
    crateName: 'error_handling',
    dependencies: [],
    features: [],
    input: '',
  },
];

export function RustExecutor(): React.ReactElement {
  const [state, setState] = useState<RustExecutorState>({
    code: RUST_PRESETS[0].code,
    crateName: RUST_PRESETS[0].crateName,
    dependencies: RUST_PRESETS[0].dependencies,
    features: RUST_PRESETS[0].features,
    input: RUST_PRESETS[0].input,
    output: '',
    error: null,
    isRunning: false,
    isCompiled: false,
    wasmFile: '',
    buildTime: 0,
    executionTime: 0,
    memoryUsage: 0,
    rustVersion: '1.75.0',
    target: 'wasm32-unknown-unknown',
    optimizationLevel: 'release',
    editorSettings: {
      fontSize: 14,
      theme: 'dark',
      wordWrap: true,
      minimap: true,
    },
  });

  const [rustRuntime, setRustRuntime] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const memoryManager = MemoryManager.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize Rust runtime
  useEffect(() => {
    const initRuntime = async () => {
      try {
        const { rustRuntime } = await import('@/lib/runtimes/rust-wasm');
        await rustRuntime.initialize();
        setRustRuntime(rustRuntime);
      } catch (error) {
        console.error('Failed to initialize Rust runtime:', error);
        setState((prev) => ({
          ...prev,
          error: 'Failed to initialize Rust runtime. Please refresh the page.',
        }));
      }
    };

    initRuntime();
  }, []);

  // Load preset
  const loadPreset = useCallback((preset: RustPreset) => {
    setState((prev) => ({
      ...prev,
      code: preset.code,
      crateName: preset.crateName,
      dependencies: preset.dependencies,
      features: preset.features,
      input: preset.input,
      output: '',
      error: null,
      isCompiled: false,
    }));
  }, []);

  // Build Rust code
  const buildCode = useCallback(async () => {
    if (!rustRuntime || !state.code.trim()) {
      setState((prev) => ({
        ...prev,
        error: state.code.trim() ? 'Rust runtime not initialized' : 'Please enter Rust code',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isRunning: true, error: null }));

    try {
      const startTime = performance.now();
      performanceMonitor.trackToolLoad('rust-executor');

      const result = await rustRuntime.compile(state.code, state.crateName, {
        dependencies: state.dependencies,
        features: state.features,
        optimization_level: state.optimizationLevel,
      });
      const buildTime = performance.now() - startTime;

      if (result.success) {
        setState((prev) => ({
          ...prev,
          isCompiled: true,
          wasmFile: result.wasmFile || 'main.wasm',
          buildTime,
          output: `✅ Build successful!\nGenerated WASM file: ${result.wasmFile || 'main.wasm'}\nBuild time: ${buildTime.toFixed(2)}ms\nRust version: ${state.rustVersion}\nTarget: ${state.target}\nOptimization: ${state.optimizationLevel}\nDependencies: ${state.dependencies.join(', ') || 'none'}\nFeatures: ${state.features.join(', ') || 'none'}`,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          isCompiled: false,
          error: result.error || 'Build failed',
          output: '',
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Build error',
        isCompiled: false,
        output: '',
      }));
    } finally {
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [
    rustRuntime,
    state.code,
    state.crateName,
    state.dependencies,
    state.features,
    state.optimizationLevel,
    state.rustVersion,
    state.target,
    performanceMonitor.trackToolLoad,
  ]);

  // Run compiled Rust code
  const runCode = useCallback(async () => {
    if (!rustRuntime || !state.isCompiled) {
      setState((prev) => ({
        ...prev,
        error: !state.isCompiled ? 'Please build the code first' : 'Rust runtime not initialized',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isRunning: true, error: null }));

    try {
      const startTime = performance.now();

      const result: RustExecutionResult = await rustRuntime.run(state.wasmFile, state.input);

      const executionTime = performance.now() - startTime;
      const memoryUsage = memoryManager.getMemoryUsage().used;

      if (result.exitCode === 0) {
        const output = result.stdout || '';
        setState((prev) => ({
          ...prev,
          output: output || 'Program executed successfully (no output)',
          executionTime,
          memoryUsage,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error?.message || result.stderr || 'Execution failed',
          output: result.stdout || result.stderr || '',
          executionTime,
          memoryUsage,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Execution error',
        output: '',
      }));
    } finally {
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [rustRuntime, state.wasmFile, state.input, state.isCompiled, memoryManager]);

  // Build and run in one step
  const buildAndRun = useCallback(async () => {
    await buildCode();
    if (state.isCompiled) {
      await runCode();
    }
  }, [buildCode, runCode, state.isCompiled]);

  // Stop execution
  const stopExecution = useCallback(() => {
    if (rustRuntime) {
      rustRuntime.stop();
      setState((prev) => ({ ...prev, isRunning: false }));
    }
  }, [rustRuntime]);

  // Clear output
  const clearOutput = useCallback(() => {
    setState((prev) => ({ ...prev, output: '', error: null }));
  }, []);

  // Export code
  const exportCode = useCallback(() => {
    const blob = new Blob([state.code], { type: 'text/x-rust-source' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.crateName || 'main'}.rs`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.code, state.crateName]);

  // Import code
  const importCode = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.rs')) {
        // Extract crate name from file or use default
        const crateName = file.name.replace(/\.rs$/i, '');
        setState((prev) => ({
          ...prev,
          code: content,
          crateName,
          isCompiled: false,
          output: '',
          error: null,
        }));
      }
    };
    reader.readAsText(file);
  }, []);

  // Add dependency
  const addDependency = useCallback((dep: string) => {
    setState((prev) => ({
      ...prev,
      dependencies: [...prev.dependencies, dep],
      isCompiled: false,
      output: '',
      error: null,
    }));
  }, []);

  // Remove dependency
  const removeDependency = useCallback((dep: string) => {
    setState((prev) => ({
      ...prev,
      dependencies: prev.dependencies.filter((d) => d !== dep),
      isCompiled: false,
      output: '',
      error: null,
    }));
  }, []);

  // Add feature
  const addFeature = useCallback((feature: string) => {
    setState((prev) => ({
      ...prev,
      features: [...prev.features, feature],
      isCompiled: false,
      output: '',
      error: null,
    }));
  }, []);

  // Remove feature
  const removeFeature = useCallback((feature: string) => {
    setState((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== feature),
      isCompiled: false,
      output: '',
      error: null,
    }));
  }, []);

  // Scroll to bottom of output
  useEffect(() => {
    if (outputRef.current && state.output) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [state.output]);

  const toolConfig: ToolConfig = {
    id: 'rust-executor',
    name: 'Rust Executor',
    description: 'Execute Rust code in browser using native WASM compilation',
    category: 'code',
    version: '1.0.0',
    icon: '🦀',
    tags: ['rust', 'cargo', 'wasm', 'execution', 'safe'],
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
      isLoading={!rustRuntime}
      onExport={exportCode}
      onImport={() => document.getElementById('rust-import')?.click()}
      onCopy={() => navigator.clipboard.writeText(state.output)}
      onReset={() => loadPreset(RUST_PRESETS[0])}
      performance={{
        loadTime: state.buildTime + state.executionTime,
        memoryUsage: state.memoryUsage,
        renderTime: 0,
      }}
      status={state.isRunning ? 'processing' : state.error ? 'error' : 'ready'}
      notifications={
        state.error
          ? [
              {
                type: 'error',
                message: state.error,
                timestamp: Date.now(),
              },
            ]
          : []
      }
      onNotificationDismiss={() => setState((prev) => ({ ...prev, error: null }))}
    >
      <input id="rust-import" type="file" accept=".rs" onChange={importCode} className="hidden" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Code Editor Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Rust Code Editor</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedPreset}
                onChange={(e) => {
                  const index = Number.parseInt(e.target.value, 10);
                  setSelectedPreset(index);
                  loadPreset(RUST_PRESETS[index]);
                }}
                className="rounded-md border px-3 py-1 text-sm"
              >
                {RUST_PRESETS.map((preset, index) => (
                  <option key={index} value={index}>
                    {preset.name}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={state.isRunning ? stopExecution : buildAndRun}
                disabled={!rustRuntime}
              >
                {state.isRunning ? (
                  <>
                    <Square className="mr-1 h-4 w-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="mr-1 h-4 w-4" />
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
                  <label className="font-medium text-sm">Crate Name</label>
                  <input
                    type="text"
                    value={state.crateName}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        crateName: e.target.value,
                        isCompiled: false,
                      }))
                    }
                    className="mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm"
                    placeholder="main"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-sm">Dependencies</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {state.dependencies.map((dep, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeDependency(dep)}
                        >
                          {dep} ×
                        </Badge>
                      ))}
                      <input
                        type="text"
                        placeholder="Add dependency"
                        className="rounded border px-2 py-1 text-xs"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            addDependency(e.currentTarget.value.trim());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-sm">Features</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {state.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeFeature(feature)}
                        >
                          {feature} ×
                        </Badge>
                      ))}
                      <input
                        type="text"
                        placeholder="Add feature"
                        className="rounded border px-2 py-1 text-xs"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            addFeature(e.currentTarget.value.trim());
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-medium text-sm">Optimization</label>
                  <select
                    value={state.optimizationLevel}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        optimizationLevel: e.target.value as 'debug' | 'release',
                        isCompiled: false,
                      }))
                    }
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="debug">Debug</option>
                    <option value="release">Release</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-sm">Rust Code</label>
                  <textarea
                    value={state.code}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        code: e.target.value,
                        isCompiled: false,
                      }))
                    }
                    className="mt-1 h-64 w-full resize-none rounded-md border px-3 py-2 font-mono text-sm"
                    placeholder="Enter your Rust code here..."
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
                Provide input for the Rust program (reads from std::io)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <textarea
                value={state.input}
                onChange={(e) => setState((prev) => ({ ...prev, input: e.target.value }))}
                className="h-24 w-full resize-none rounded-md border px-3 py-2 font-mono text-sm"
                placeholder="Enter input for the Rust program..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Console Output</h3>
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
                className="h-80 rounded-md border bg-muted p-3 font-mono text-sm dark:bg-card"
                ref={outputRef}
              >
                {state.output || 'Output will appear here...'}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Build Status */}
          {state.isCompiled && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <h4 className="font-medium">Build Status</h4>
                  <Badge variant="default">Compiled</Badge>
                </div>
                <div className="text-muted-foreground text-sm dark:text-muted-foreground">
                  <p>WASM file: {state.wasmFile}</p>
                  <p>Rust version: {state.rustVersion}</p>
                  <p>Target: {state.target}</p>
                  <p>Optimization: {state.optimizationLevel}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
}

export default RustExecutor;
