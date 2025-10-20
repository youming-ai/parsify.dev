import type { Metadata } from 'next'
import { MainLayout } from '@/components/layout/main-layout'
import { CodeToolComplete } from '@/components/tools/code/code-tool-complete'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Code,
  Play,
  CheckCircle,
  Info,
  Lightbulb,
  Zap,
  Shield,
  Terminal,
  Settings,
  BookOpen,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Code Runner & IDE - Online Code Editor & Compiler | Parsify.dev',
  description:
    'Professional online code editor and IDE with multi-language support. Execute, compile, and test code in JavaScript, Python, Java, C++, TypeScript, and more with real-time results.',
  keywords:
    'code runner, online compiler, code editor, IDE, JavaScript, Python, Java, C++, TypeScript, code execution, online coding, programming, developer tools, web IDE',
  openGraph: {
    title: 'Code Runner & IDE - Professional Online Development Environment',
    description:
      'Execute, compile, and test code in multiple programming languages with real-time results and advanced debugging features',
    type: 'website',
    images: [
      {
        url: '/og-code-tools.png',
        width: 1200,
        height: 630,
        alt: 'Code Runner & IDE - Professional Online Development Environment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Code Runner & IDE - Professional Online Development Environment',
    description:
      'Execute, compile, and test code in multiple programming languages with real-time results',
    images: ['/og-code-tools.png'],
  },
  alternates: {
    canonical: '/tools/code',
  },
}

const codeExamples = {
  javascript: {
    name: 'JavaScript',
    description: 'Modern JavaScript with ES6+ features',
    code: `// Modern JavaScript Example
const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
};

// Calculate first 10 Fibonacci numbers
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}

// Async/await example
const fetchData = async () => {
  console.log('Fetching data...');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Data fetched successfully!');
};

fetchData();`,
  },
  python: {
    name: 'Python',
    description: 'Python with data structures and algorithms',
    code: `# Python Example - Data Processing
import json
from collections import defaultdict

def process_data(data):
    """Process and analyze data"""
    word_count = defaultdict(int)

    for item in data:
        if 'text' in item:
            words = item['text'].lower().split()
            for word in words:
                word_count[word] += 1

    return dict(sorted(word_count.items(), key=lambda x: x[1], reverse=True))

# Sample data
sample_data = [
    {"id": 1, "text": "Hello world, Python is awesome!"},
    {"id": 2, "text": "Python programming is fun"},
    {"id": 3, "text": "Hello again, Python developers"}
]

# Process and display results
result = process_data(sample_data)
print("Word frequency analysis:")
for word, count in list(result.items())[:5]:
    print(f"{word}: {count}")

# Class example
class Calculator:
    def __init__(self):
        self.history = []

    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result

    def get_history(self):
        return self.history

calc = Calculator()
print(f"Addition: {calc.add(5, 3)}")
print(f"History: {calc.get_history()}")`,
  },
  java: {
    name: 'Java',
    description: 'Object-oriented Java programming',
    code: `// Java Example - Object-Oriented Programming
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Create and manage a list of students
        List<Student> students = new ArrayList<>();

        students.add(new Student("Alice", 20, 3.8));
        students.add(new Student("Bob", 21, 3.5));
        students.add(new Student("Charlie", 19, 4.0));

        // Process student data
        StudentManager manager = new StudentManager(students);

        System.out.println("All Students:");
        manager.displayAllStudents();

        System.out.println("\\nTop Students (GPA >= 3.7):");
        List<Student> topStudents = manager.getTopStudents(3.7);
        topStudents.forEach(System.out::println);

        System.out.println("\\nAverage GPA: " + manager.getAverageGPA());

        // Demonstrate lambda expressions
        System.out.println("\\nStudents sorted by name:");
        students.stream()
               .sorted(Comparator.comparing(Student::getName))
               .forEach(System.out::println);
    }
}

class Student {
    private String name;
    private int age;
    private double gpa;

    public Student(String name, int age, double gpa) {
        this.name = name;
        this.age = age;
        this.gpa = gpa;
    }

    // Getters
    public String getName() { return name; }
    public int getAge() { return age; }
    public double getGpa() { return gpa; }

    @Override
    public String toString() {
        return String.format("Student{name='%s', age=%d, gpa=%.2f}", name, age, gpa);
    }
}

class StudentManager {
    private List<Student> students;

    public StudentManager(List<Student> students) {
        this.students = students;
    }

    public void displayAllStudents() {
        students.forEach(System.out::println);
    }

    public List<Student> getTopStudents(double minGpa) {
        return students.stream()
                     .filter(s -> s.getGpa() >= minGpa)
                     .sorted(Comparator.comparing(Student::getGpa).reversed())
                     .toList();
    }

    public double getAverageGPA() {
        return students.stream()
                     .mapToDouble(Student::getGpa)
                     .average()
                     .orElse(0.0);
    }
}`,
  },
  cpp: {
    name: 'C++',
    description: 'High-performance C++ with STL',
    code: `// C++ Example - STL Containers and Algorithms
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>
#include <map>
#include <memory>

class Product {
private:
    std::string name;
    double price;
    int quantity;

public:
    Product(const std::string& n, double p, int q)
        : name(n), price(p), quantity(q) {}

    // Getters
    const std::string& getName() const { return name; }
    double getPrice() const { return price; }
    int getQuantity() const { return quantity; }

    double getTotalValue() const { return price * quantity; }

    void display() const {
        std::cout << name << ": $" << price << " x " << quantity
                  << " = $" << getTotalValue() << std::endl;
    }
};

class Inventory {
private:
    std::vector<std::unique_ptr<Product>> products;
    std::map<std::string, int> categoryCount;

public:
    void addProduct(std::unique_ptr<Product> product) {
        products.push_back(std::move(product));
    }

    void displayInventory() const {
        std::cout << "\\n=== Inventory ===\\n";
        for (const auto& product : products) {
            product->display();
        }
    }

    double getTotalValue() const {
        double total = 0.0;
        for (const auto& product : products) {
            total += product->getTotalValue();
        }
        return total;
    }

    void sortByValue() {
        std::sort(products.begin(), products.end(),
            [](const std::unique_ptr<Product>& a, const std::unique_ptr<Product>& b) {
                return a->getTotalValue() > b->getTotalValue();
            });
    }

    // Template function for finding products
    template<typename Predicate>
    std::vector<Product*> findProducts(Predicate pred) const {
        std::vector<Product*> result;
        for (const auto& product : products) {
            if (pred(product.get())) {
                result.push_back(product.get());
            }
        }
        return result;
    }
};

int main() {
    std::cout << "=== C++ STL and Modern Features Demo ===\\n";

    // Create inventory
    Inventory inventory;

    // Add products using smart pointers
    inventory.addProduct(std::make_unique<Product>("Laptop", 999.99, 5));
    inventory.addProduct(std::make_unique<Product>("Mouse", 29.99, 20));
    inventory.addProduct(std::make_unique<Product>("Keyboard", 79.99, 15));
    inventory.addProduct(std::make_unique<Product>("Monitor", 299.99, 8));

    // Display inventory
    inventory.displayInventory();

    std::cout << "\\nTotal inventory value: $" << inventory.getTotalValue() << std::endl;

    // Sort by value
    inventory.sortByValue();
    std::cout << "\\n=== Sorted by Value ===\\n";
    inventory.displayInventory();

    // Use lambda to find expensive products
    auto expensiveProducts = inventory.findProducts(
        [](const Product* p) { return p->getPrice() > 100; }
    );

    std::cout << "\\nExpensive products (> $100):\\n";
    for (const auto& product : expensiveProducts) {
        product->display();
    }

    // Demonstrate modern C++ features
    std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Use lambda with algorithm
    std::cout << "\\nEven numbers: ";
    std::for_each(numbers.begin(), numbers.end(), [](int n) {
        if (n % 2 == 0) std::cout << n << " ";
    });
    std::cout << std::endl;

    // Use auto and range-based for loop
    std::map<std::string, int> wordCount = {
        {"hello", 2},
        {"world", 1},
        {"cpp", 3}
    };

    std::cout << "\\nWord counts:\\n";
    for (const auto& [word, count] : wordCount) {
        std::cout << word << ": " << count << std::endl;
    }

    return 0;
}`,
  },
}

const toolFeatures = [
  {
    icon: Play,
    title: 'Real-time Execution',
    description: 'Execute code instantly with live output and comprehensive error reporting',
  },
  {
    icon: Code,
    title: 'Multi-language Support',
    description: 'Support for 20+ programming languages with syntax highlighting and auto-completion',
  },
  {
    icon: Terminal,
    title: 'Interactive Terminal',
    description: 'Full-featured terminal with stdin support and command history',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized WASM-based execution for near-native performance in your browser',
  },
  {
    icon: Shield,
    title: 'Secure Sandbox',
    description: 'Code runs in a secure sandbox environment with resource limits and isolation',
  },
  {
    icon: Settings,
    title: 'Customizable Environment',
    description: 'Configure execution settings, memory limits, and compilation options',
  },
]

const learningPaths = [
  {
    title: 'Getting Started',
    description: 'Perfect for beginners learning to code',
    languages: ['JavaScript', 'Python'],
    difficulty: 'Beginner',
    estimatedTime: '30 minutes',
  },
  {
    title: 'Data Structures & Algorithms',
    description: 'Common algorithms and data structures',
    languages: ['Python', 'Java', 'C++'],
    difficulty: 'Intermediate',
    estimatedTime: '1 hour',
  },
  {
    title: 'Web Development',
    description: 'Frontend and backend development patterns',
    languages: ['JavaScript', 'TypeScript'],
    difficulty: 'Intermediate',
    estimatedTime: '45 minutes',
  },
  {
    title: 'System Programming',
    description: 'Low-level programming and performance optimization',
    languages: ['C++', 'Java', 'Rust'],
    difficulty: 'Advanced',
    estimatedTime: '1.5 hours',
  },
]

const bestPractices = [
  {
    category: 'Code Quality',
    tips: [
      'Write clear, descriptive variable names',
      'Use consistent indentation and formatting',
      'Add comments for complex logic',
      'Break down large functions into smaller ones',
      'Follow language-specific conventions',
    ],
  },
  {
    category: 'Performance',
    tips: [
      'Choose appropriate data structures',
      'Avoid unnecessary computations in loops',
      'Use built-in functions when available',
      'Profile your code to find bottlenecks',
      'Consider time and space complexity',
    ],
  },
  {
    category: 'Debugging',
    tips: [
      'Use print statements to trace execution',
      'Test with edge cases and boundary conditions',
      'Write unit tests for critical functions',
      'Use a systematic debugging approach',
      'Learn to read error messages carefully',
    ],
  },
]

export default function CodeToolsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">
              <Code className="w-3 h-3 mr-1" />
              Development Tools
            </Badge>
            <Badge variant="outline" className="text-xs">
              Browser Native
            </Badge>
            <Badge variant="outline" className="text-xs">
              WASM Powered
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Code Runner & IDE
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl">
            Professional online code editor and IDE with multi-language support.
            Execute, compile, and test code in JavaScript, Python, Java, C++,
            TypeScript, and more with real-time results.
          </p>

          {/* Feature badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              '20+ Languages',
              'Real-time Execution',
              'Interactive Terminal',
              'Syntax Highlighting',
              'Code Formatting',
              'Error Detection',
              'Stdin Support',
              'File I/O',
            ].map(feature => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Main Tool Component */}
        <CodeToolComplete />

        {/* Code Examples Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Code Examples & Templates
              </CardTitle>
              <CardDescription>
                Click on any example to load it into the editor and start experimenting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  {Object.entries(codeExamples).map(([key, example]) => (
                    <TabsTrigger key={key} value={key} className="text-xs">
                      {example.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(codeExamples).map(([key, example]) => (
                  <TabsContent key={key} value={key} className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {example.name}
                          <Badge variant="outline" className="text-xs">
                            Example
                          </Badge>
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {example.description}
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(example.code)
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded hover:bg-blue-50"
                        >
                          Copy Code
                        </button>
                        <button
                          onClick={() => {
                            // This would load the code into the editor
                            console.log('Loading code into editor...')
                          }}
                          className="text-sm text-green-600 hover:text-green-800 px-3 py-1 border border-green-200 rounded hover:bg-green-50"
                        >
                          Load in Editor
                        </button>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid lg:grid-cols-3 gap-6">
          {toolFeatures.map((feature, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <feature.icon className="w-5 h-5 text-blue-600" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Learning Paths */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Learning Paths
              </CardTitle>
              <CardDescription>
                Structured learning paths to improve your coding skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {learningPaths.map((path, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{path.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {path.description}
                        </p>
                      </div>
                      <Badge
                        variant={path.difficulty === 'Beginner' ? 'secondary' :
                                path.difficulty === 'Intermediate' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {path.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>⏱️ {path.estimatedTime}</span>
                      <span>🔧 {path.languages.join(', ')}</span>
                    </div>
                    <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Start Learning →
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Best Practices */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Best Practices & Tips
              </CardTitle>
              <CardDescription>
                Improve your coding skills with these essential practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {bestPractices.map((category, index) => (
                  <div key={index} className="space-y-3">
                    <h4 className="font-medium text-lg">{category.category}</h4>
                    <ul className="space-y-2">
                      {category.tips.map((tip, tipIndex) => (
                        <li key={tipIndex} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">How does code execution work?</h4>
                  <p className="text-sm text-gray-600">
                    Code is executed in a secure WebAssembly (WASM) sandbox in your browser.
                    This provides near-native performance while keeping your code and data private.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">What languages are supported?</h4>
                  <p className="text-sm text-gray-600">
                    We support 20+ programming languages including JavaScript, Python, Java,
                    C++, TypeScript, Go, Rust, PHP, Ruby, and more. Each language has its
                    specific compiler or interpreter configured.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Can I use external libraries?</h4>
                  <p className="text-sm text-gray-600">
                    Currently, we support standard library functions for each language.
                    External package support is planned for future updates.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">What are the execution limits?</h4>
                  <p className="text-sm text-gray-600">
                    Default limits are 5 seconds execution time and 128MB memory for most languages.
                    These can be adjusted in the settings tab based on your needs.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Is my code saved anywhere?</h4>
                  <p className="text-sm text-gray-600">
                    No, your code is processed locally in your browser and never sent to our servers.
                    You can download your code using the export button if you want to save it.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">How do I report issues?</h4>
                  <p className="text-sm text-gray-600">
                    If you encounter any issues with code execution or find bugs, please use the
                    feedback button or report issues on our GitHub repository.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
