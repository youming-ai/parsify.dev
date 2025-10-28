import type { CodeTemplate, LanguageConfig } from './code-types'

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    name: 'JavaScript',
    version: '18.17.0',
    extensions: ['.js', '.mjs', '.cjs'],
    interpreter: 'node',
    defaultCode: `// Welcome to JavaScript Code Runner
console.log("Hello, World!");

// Try running some JavaScript code
const message = "JavaScript is awesome!";
console.log(message);`,
    compileTimeLimit: 0,
    executionTimeLimit: 5000,
    memoryLimit: 128,
    supportsStdin: true,
    supportsCompilation: false,
    monacoLanguage: 'javascript',
  },
  typescript: {
    name: 'TypeScript',
    version: '5.2.2',
    extensions: ['.ts', '.tsx'],
    compiler: 'tsc',
    interpreter: 'ts-node',
    defaultCode: `// Welcome to TypeScript Code Runner
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const message = greet("TypeScript");
console.log(message);`,
    compileTimeLimit: 3000,
    executionTimeLimit: 5000,
    memoryLimit: 256,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'typescript',
  },
  python: {
    name: 'Python',
    version: '3.11.5',
    extensions: ['.py'],
    interpreter: 'python3',
    defaultCode: `# Welcome to Python Code Runner
print("Hello, World!")

# Try running some Python code
name = "Python"
message = f"Hello, {name}!"
print(message)`,
    compileTimeLimit: 0,
    executionTimeLimit: 5000,
    memoryLimit: 128,
    supportsStdin: true,
    supportsCompilation: false,
    monacoLanguage: 'python',
  },
  java: {
    name: 'Java',
    version: '17.0.8',
    extensions: ['.java'],
    compiler: 'javac',
    interpreter: 'java',
    defaultCode: `// Welcome to Java Code Runner
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");

        // Try running some Java code
        String message = "Java is powerful!";
        System.out.println(message);
    }
}`,
    compileTimeLimit: 5000,
    executionTimeLimit: 5000,
    memoryLimit: 256,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'java',
  },
  cpp: {
    name: 'C++',
    version: '17',
    extensions: ['.cpp', '.cc', '.cxx'],
    compiler: 'g++',
    interpreter: 'cpp',
    defaultCode: `// Welcome to C++ Code Runner
#include <iostream>
#include <string>

int main() {
    std::cout << "Hello, World!" << std::endl;

    // Try running some C++ code
    std::string message = "C++ is fast!";
    std::cout << message << std::endl;

    return 0;
}`,
    compileTimeLimit: 5000,
    executionTimeLimit: 5000,
    memoryLimit: 256,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'cpp',
  },
  c: {
    name: 'C',
    version: 'C17',
    extensions: ['.c'],
    compiler: 'gcc',
    interpreter: 'c',
    defaultCode: `// Welcome to C Code Runner
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");

    // Try running some C code
    char message[] = "C is fundamental!";
    printf("%s\\n", message);

    return 0;
}`,
    compileTimeLimit: 5000,
    executionTimeLimit: 5000,
    memoryLimit: 256,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'c',
  },
  csharp: {
    name: 'C#',
    version: '7.0',
    extensions: ['.cs'],
    compiler: 'csc',
    interpreter: 'dotnet',
    defaultCode: `// Welcome to C# Code Runner
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");

        // Try running some C# code
        string message = "C# is elegant!";
        Console.WriteLine(message);
    }
}`,
    compileTimeLimit: 5000,
    executionTimeLimit: 5000,
    memoryLimit: 256,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'csharp',
  },
  go: {
    name: 'Go',
    version: '1.21.3',
    extensions: ['.go'],
    compiler: 'go',
    interpreter: 'go',
    defaultCode: `// Welcome to Go Code Runner
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")

    // Try running some Go code
    message := "Go is concurrent!"
    fmt.Println(message)
}`,
    compileTimeLimit: 3000,
    executionTimeLimit: 5000,
    memoryLimit: 128,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'go',
  },
  rust: {
    name: 'Rust',
    version: '1.73.0',
    extensions: ['.rs'],
    compiler: 'rustc',
    interpreter: 'rust',
    defaultCode: `// Welcome to Rust Code Runner
fn main() {
    println!("Hello, World!");

    // Try running some Rust code
    let message = "Rust is safe!";
    println!("{}", message);
}`,
    compileTimeLimit: 5000,
    executionTimeLimit: 5000,
    memoryLimit: 256,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'rust',
  },
  php: {
    name: 'PHP',
    version: '8.2.11',
    extensions: ['.php'],
    interpreter: 'php',
    defaultCode: `<?php
// Welcome to PHP Code Runner
echo "Hello, World!\\n";

// Try running some PHP code
$message = "PHP is popular!";
echo "$message\\n";
?>`,
    compileTimeLimit: 0,
    executionTimeLimit: 5000,
    memoryLimit: 128,
    supportsStdin: true,
    supportsCompilation: false,
    monacoLanguage: 'php',
  },
  ruby: {
    name: 'Ruby',
    version: '3.2.2',
    extensions: ['.rb'],
    interpreter: 'ruby',
    defaultCode: `# Welcome to Ruby Code Runner
puts "Hello, World!"

# Try running some Ruby code
message = "Ruby is dynamic!"
puts message`,
    compileTimeLimit: 0,
    executionTimeLimit: 5000,
    memoryLimit: 128,
    supportsStdin: true,
    supportsCompilation: false,
    monacoLanguage: 'ruby',
  },
  swift: {
    name: 'Swift',
    version: '5.9',
    extensions: ['.swift'],
    compiler: 'swiftc',
    interpreter: 'swift',
    defaultCode: `// Welcome to Swift Code Runner
print("Hello, World!")

// Try running some Swift code
let message = "Swift is modern!"
print(message)`,
    compileTimeLimit: 5000,
    executionTimeLimit: 5000,
    memoryLimit: 256,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'swift',
  },
  kotlin: {
    name: 'Kotlin',
    version: '1.9.10',
    extensions: ['.kt', '.kts'],
    compiler: 'kotlinc',
    interpreter: 'kotlin',
    defaultCode: `// Welcome to Kotlin Code Runner
fun main() {
    println("Hello, World!")

    // Try running some Kotlin code
    val message = "Kotlin is concise!"
    println(message)
}`,
    compileTimeLimit: 5000,
    executionTimeLimit: 5000,
    memoryLimit: 256,
    supportsStdin: true,
    supportsCompilation: true,
    monacoLanguage: 'kotlin',
  },
  bash: {
    name: 'Bash',
    version: '5.2.15',
    extensions: ['.sh', '.bash'],
    interpreter: 'bash',
    defaultCode: `#!/bin/bash
# Welcome to Bash Code Runner
echo "Hello, World!"

# Try running some Bash code
message="Bash is powerful!"
echo "$message"`,
    compileTimeLimit: 0,
    executionTimeLimit: 5000,
    memoryLimit: 64,
    supportsStdin: true,
    supportsCompilation: false,
    monacoLanguage: 'shell',
  },
  powershell: {
    name: 'PowerShell',
    version: '7.3.8',
    extensions: ['.ps1', '.psm1'],
    interpreter: 'pwsh',
    defaultCode: `# Welcome to PowerShell Code Runner
Write-Host "Hello, World!"

# Try running some PowerShell code
$message = "PowerShell is versatile!"
Write-Host $message`,
    compileTimeLimit: 0,
    executionTimeLimit: 5000,
    memoryLimit: 128,
    supportsStdin: true,
    supportsCompilation: false,
    monacoLanguage: 'powershell',
  },
  sql: {
    name: 'SQL',
    version: 'Standard SQL',
    extensions: ['.sql'],
    interpreter: 'sql',
    defaultCode: `-- Welcome to SQL Code Runner
-- This is a sample SQL query
SELECT 'Hello, World!' AS greeting;

-- Try running some SQL queries
SELECT
    'SQL is declarative!' AS message,
    DATABASE() as current_database,
    NOW() as current_time;`,
    compileTimeLimit: 0,
    executionTimeLimit: 10000,
    memoryLimit: 128,
    supportsStdin: false,
    supportsCompilation: false,
    monacoLanguage: 'sql',
  },
}

export const CODE_TEMPLATES: CodeTemplate[] = [
  // JavaScript Templates
  {
    id: 'js-hello-world',
    name: 'Hello World',
    language: 'javascript',
    description: 'Simple hello world program',
    code: `console.log("Hello, World!");`,
    category: 'Basics',
    difficulty: 'beginner',
  },
  {
    id: 'js-array-methods',
    name: 'Array Methods',
    language: 'javascript',
    description: 'Common array manipulation methods',
    code: `const numbers = [1, 2, 3, 4, 5];

// Map: Transform each element
const doubled = numbers.map(n => n * 2);
console.log("Doubled:", doubled);

// Filter: Select elements that meet a condition
const evens = numbers.filter(n => n % 2 === 0);
console.log("Even numbers:", evens);

// Reduce: Reduce array to single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log("Sum:", sum);

// Find: Find first element that meets condition
const firstGreaterThan3 = numbers.find(n => n > 3);
console.log("First > 3:", firstGreaterThan3);`,
    category: 'Arrays',
    difficulty: 'intermediate',
  },
  {
    id: 'js-async-await',
    name: 'Async/Await',
    language: 'javascript',
    description: 'Asynchronous programming with async/await',
    code: `// Simulate async operation
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Async function using await
async function fetchUserData(userId) {
  try {
    console.log("Fetching user data...");
    await delay(1000); // Simulate API call

    const user = {
      id: userId,
      name: \`User \${userId}\`,
      email: \`user\${userId}@example.com\`
    };

    console.log("User data:", user);
    return user;
  } catch (error) {
    console.error("Error fetching user:", error);
  }
}

// Usage
fetchUserData(123);`,
    category: 'Async',
    difficulty: 'intermediate',
  },

  // Python Templates
  {
    id: 'py-hello-world',
    name: 'Hello World',
    language: 'python',
    description: 'Simple hello world program',
    code: `print("Hello, World!")`,
    category: 'Basics',
    difficulty: 'beginner',
  },
  {
    id: 'py-list-comprehension',
    name: 'List Comprehensions',
    language: 'python',
    description: 'Pythonic way to create lists',
    code: `# Basic list comprehension
numbers = [1, 2, 3, 4, 5]
squares = [n**2 for n in numbers]
print("Squares:", squares)

# List comprehension with condition
evens = [n for n in numbers if n % 2 == 0]
print("Even numbers:", evens)

# Nested list comprehension
matrix = [[i * j for j in range(3)] for i in range(3)]
print("Matrix:", matrix)

# Dictionary comprehension
word_lengths = {word: len(word) for word in ["hello", "world", "python"]}
print("Word lengths:", word_lengths)`,
    category: 'Data Structures',
    difficulty: 'intermediate',
  },
  {
    id: 'py-decorators',
    name: 'Decorators',
    language: 'python',
    description: 'Python decorators for function modification',
    code: `# Simple decorator
def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

@timer
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Usage
print("Fibonacci(10):", fibonacci(10))

# Decorator with parameters
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for i in range(times):
                print(f"Execution {i+1}:")
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet(name):
    print(f"Hello, {name}!")

greet("Python")`,
    category: 'Functions',
    difficulty: 'advanced',
  },

  // Java Templates
  {
    id: 'java-hello-world',
    name: 'Hello World',
    language: 'java',
    description: 'Simple hello world program',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    category: 'Basics',
    difficulty: 'beginner',
  },
  {
    id: 'java-oop',
    name: 'Object-Oriented Programming',
    language: 'java',
    description: 'Classes and objects in Java',
    code: `class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void introduce() {
        System.out.println("Hi, I'm " + name + " and I'm " + age + " years old.");
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}

class Student extends Person {
    private String grade;

    public Student(String name, int age, String grade) {
        super(name, age);
        this.grade = grade;
    }

    @Override
    public void introduce() {
        super.introduce();
        System.out.println("I'm in grade " + grade);
    }
}

public class Main {
    public static void main(String[] args) {
        Person person = new Person("Alice", 25);
        person.introduce();

        Student student = new Student("Bob", 16, "10th");
        student.introduce();
    }
}`,
    category: 'OOP',
    difficulty: 'intermediate',
  },

  // C++ Templates
  {
    id: 'cpp-hello-world',
    name: 'Hello World',
    language: 'cpp',
    description: 'Simple hello world program',
    code: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
    category: 'Basics',
    difficulty: 'beginner',
  },
  {
    id: 'cpp-stl-containers',
    name: 'STL Containers',
    language: 'cpp',
    description: 'Using Standard Template Library containers',
    code: `#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <algorithm>

int main() {
    // Vector (dynamic array)
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    numbers.push_back(6);

    std::cout << "Vector: ";
    for (int num : numbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // Map (key-value pairs)
    std::map<std::string, int> ages;
    ages["Alice"] = 25;
    ages["Bob"] = 30;
    ages["Charlie"] = 35;

    std::cout << "\\nAges:" << std::endl;
    for (const auto& [name, age] : ages) {
        std::cout << name << ": " << age << std::endl;
    }

    // Set (unique elements)
    std::set<int> uniqueNumbers = {3, 1, 4, 1, 5, 9, 2, 6, 5};

    std::cout << "\\nUnique numbers: ";
    for (int num : uniqueNumbers) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    // Algorithm example
    std::vector<int> source = {1, 2, 3, 4, 5};
    std::vector<int> destination(5);

    std::copy(source.begin(), source.end(), destination.begin());

    std::cout << "\\nCopied vector: ";
    for (int num : destination) {
        std::cout << num << " ";
    }
    std::cout << std::endl;

    return 0;
}`,
    category: 'STL',
    difficulty: 'intermediate',
  },
]

export const getLanguageConfig = (language: string): LanguageConfig => {
  return LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.javascript
}

export const getTemplatesByLanguage = (language: string): CodeTemplate[] => {
  return CODE_TEMPLATES.filter(template => template.language === language)
}

export const getTemplatesByCategory = (category: string): CodeTemplate[] => {
  return CODE_TEMPLATES.filter(template => template.category === category)
}

export const searchTemplates = (query: string, language?: string): CodeTemplate[] => {
  return CODE_TEMPLATES.filter(template => {
    const matchesQuery =
      template.name.toLowerCase().includes(query.toLowerCase()) ||
      template.description.toLowerCase().includes(query.toLowerCase())
    const matchesLanguage = !language || template.language === language
    return matchesQuery && matchesLanguage
  })
}
