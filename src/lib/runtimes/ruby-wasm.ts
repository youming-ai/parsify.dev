/**
 * Ruby WASM Runtime using ruby.wasm
 * Provides Ruby 3.2 execution with metaprogramming and Rails-like features
 */

export interface RubyGem {
  name: string;
  version: string;
  isBundled: boolean;
  requires: string[];
  files: string[];
}

export interface RubyExecutionOptions {
  code: string;
  input?: string; // STDIN input
  gems?: string[]; // Ruby gems to require
  loadPath?: string[]; // Ruby load path ($LOAD_PATH)
  rubyVersion?: string;
  encoding?: string; // Source encoding
  warnLevel?: number; // $VERBOSE
  debug?: boolean;
  timeoutMs?: number;
  memoryLimitMB?: number;
  enableOutput?: boolean;
  captureErrors?: boolean;
}

export interface RubyExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  peakMemoryUsage: number;
  requiredFiles: string[]; // Files required/loaded
  definedClasses: string[]; // User-defined classes
  definedModules: string[]; // User-defined modules
  constants: Record<string, any>; // Defined constants
  warnings?: string[];
  error?: Error;
  rubyVersion: string;
  gems: string[];
  objectCount: number; // Number of objects created
}

export interface RubyLibrary {
  name: string;
  description: string;
  category: 'core' | 'json' | 'xml' | 'web' | 'database' | 'testing' | 'math';
  methods: string[];
  classes: string[];
}

export class RubyRuntime {
  private ruby: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private defaultGems: RubyGem[] = [
    {
      name: 'json',
      version: '2.7.0',
      isBundled: true,
      requires: [],
      files: ['json.rb'],
    },
    {
      name: 'csv',
      version: '3.2.0',
      isBundled: true,
      requires: [],
      files: ['csv.rb'],
    },
    {
      name: 'digest',
      version: '3.1.0',
      isBundled: true,
      requires: [],
      files: ['digest.rb'],
    },
    {
      name: 'uri',
      version: '0.12.0',
      isBundled: true,
      requires: [],
      files: ['uri.rb'],
    },
    {
      name: 'net-http',
      version: '0.3.0',
      isBundled: true,
      requires: [],
      files: ['net/http.rb'],
    },
    {
      name: 'yaml',
      version: '0.3.0',
      isBundled: true,
      requires: [],
      files: ['yaml.rb'],
    },
  ];

  /**
   * Initialize Ruby runtime with ruby.wasm
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
      // In a real implementation, you would load ruby.wasm
      // For now, we'll simulate the Ruby environment

      this.ruby = {
        // Mock Ruby API - replace with actual ruby.wasm integration
        executeRuby: async (_code: string, _options: any) => {
          // This would execute Ruby code in WebAssembly
          return {
            stdout: '',
            stderr: '',
            exitCode: 0,
            executionTime: 0,
            memoryUsed: 0,
            peakMemoryUsage: 0,
            requiredFiles: [],
            definedClasses: [],
            definedModules: [],
            constants: {},
            warnings: [],
            objectCount: 0,
          };
        },
        requireGem: (_gemName: string) => {
          // Require a gem
        },
        setLoadPath: (_paths: string[]) => {
          // Set $LOAD_PATH
        },
        setEncoding: (_encoding: string) => {
          // Set source encoding
        },
        getConstants: () => {
          // Get all constants
          return {};
        },
      };

      this.isInitialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      throw new Error(`Failed to initialize Ruby runtime: ${message}`);
    }
  }

  /**
   * Execute Ruby code with options
   */
  async executeCode(options: RubyExecutionOptions): Promise<RubyExecutionResult> {
    await this.initialize();

    if (!this.ruby) {
      throw new Error('Ruby runtime not initialized');
    }

    const {
      code,
      input = '',
      gems = [],
      loadPath = [],
      rubyVersion = '3.2.0',
      encoding = 'utf-8',
      warnLevel = 1,
      debug = false,
      timeoutMs = 30000,
      memoryLimitMB = 256,
      enableOutput = true,
      captureErrors = true,
    } = options;

    const startTime = performance.now();

    try {
      // Configure Ruby environment
      this.ruby.setEncoding(encoding);
      this.ruby.setLoadPath(loadPath.length > 0 ? loadPath : ['.']);

      // Require gems
      for (const gem of gems) {
        this.ruby.requireGem(gem);
      }

      // Prepare Ruby code with wrapper
      const fullCode = this._prepareRubyCode(code, options);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        throw new Error('Ruby execution timeout');
      }, timeoutMs);

      try {
        // Execute Ruby code
        const result = await this.ruby.executeRuby(fullCode, {
          input,
          rubyVersion,
          warnLevel,
          debug,
        });

        clearTimeout(timeoutId);

        const executionTime = performance.now() - startTime;

        // Get runtime constants
        const constants = this.ruby.getConstants();

        return {
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          exitCode: result.exitCode || 0,
          executionTime,
          memoryUsed: result.memoryUsed || 0,
          peakMemoryUsage: result.peakMemoryUsage || 0,
          requiredFiles: result.requiredFiles || [],
          definedClasses: result.definedClasses || [],
          definedModules: result.definedModules || [],
          constants: constants || {},
          warnings: result.warnings || [],
          rubyVersion: rubyVersion,
          gems: gems,
          objectCount: result.objectCount || 0,
        };
      } catch (error) {
        clearTimeout(timeoutId);

        const executionTime = performance.now() - startTime;

        return {
          stdout: '',
          stderr: error instanceof Error ? error.message : String(error),
          exitCode: 1,
          executionTime,
          memoryUsed: 0,
          peakMemoryUsage: 0,
          requiredFiles: [],
          definedClasses: [],
          definedModules: [],
          constants: {},
          error: error instanceof Error ? error : new Error(String(error)),
          warnings: [],
          rubyVersion: rubyVersion,
          gems: gems,
          objectCount: 0,
        };
      }
    } catch (error) {
      const totalTime = performance.now() - startTime;

      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        executionTime: totalTime,
        memoryUsed: 0,
        peakMemoryUsage: 0,
        requiredFiles: [],
        definedClasses: [],
        definedModules: [],
        constants: {},
        error: error instanceof Error ? error : new Error(String(error)),
        warnings: [],
        rubyVersion: rubyVersion,
        gems: gems,
        objectCount: 0,
      };
    }
  }

  /**
   * Get available gems
   */
  getAvailableGems(): RubyGem[] {
    return this.defaultGems;
  }

  /**
   * Get code templates
   */
  getCodeTemplates(): Record<string, string> {
    return {
      'Hello World': `# Welcome to Ruby 3.2 Code Runner
puts "Hello, World! from Ruby #{RUBY_VERSION}"

# Demonstrate basic Ruby features
fruits = ["apple", "banana", "orange", "grape"]

puts "Original fruits: \#{fruits.join(', ')}"

# Ruby array methods
fruits.sort!
puts "Sorted fruits: \#{fruits.join(', ')}"

# String manipulation
text = "Hello from Ruby"
puts "String: \#{text}"
puts "Length: \#{text.length}"
puts "Uppercase: \#{text.upcase}"

# Current time
puts "Current time: \#{Time.now.strftime('%Y-%m-%d %H:%M:%S')}"

# Numbers and math
numbers = [1, 2, 3, 4, 5]
puts "Sum: \#{numbers.sum}"
puts "Average: \#{numbers.sum.to_f / numbers.length}"
puts "Product: \#{numbers.reduce(:*)}"

# Symbol and hash examples
person = {
  name: "Ruby Developer",
  age: 30,
  skills: ["Ruby", "Rails", "JavaScript"],
  certified: true
}

puts "Person data:"
person.each do |key, value|
  puts "  \#{key}: \#{value}"
end`,
      Metaprogramming: `# Ruby Metaprogramming Examples
puts "=== Metaprogramming in Ruby ==="

# Dynamic method definition
class Person
  # Define methods dynamically
  [:name, :age, :email].each do |attr|
    define_method(attr) do
      instance_variable_get("@#{attr}")
    end

    define_method("\#{attr}=") do |value|
      instance_variable_set("@#{attr}", value)
    end
  end

  def initialize(name:, age:, email:)
    @name = name
    @age = age
    @email = email
  end

  # Method missing for dynamic attribute access
  def method_missing(method_name, *args, &block)
    if method_name.to_s.end_with?('_info')
      attr = method_name.to_s.chomp('_info')
      value = instance_variable_get("@#{attr}")
      puts "\#{attr.capitalize}: \#{value} (\#{value.class})"
    else
      super
    end
  end
end

person = Person.new(name: "Alice", age: 30, email: "alice@example.com")
person.name_info
person.age_info

# Class methods with metaclass
class Calculator
  class << self
    def power(base, exponent)
      base ** exponent
    end

    def factorial(n)
      return 1 if n <= 1
      n * factorial(n - 1)
    end

    # Dynamic class method creation
    [:add, :subtract, :multiply, :divide].each do |op|
      define_method(op) do |a, b|
        a.send(op, b)
      end
    end
  end
end

puts "Calculator Results:"
puts "2^10 = \#{Calculator.power(2, 10)}"
puts "5! = \#{Calculator.factorial(5)}"
puts "10 + 5 = \#{Calculator.add(10, 5)}"
puts "10 * 3 = \#{Calculator.multiply(10, 3)}"

# Module mixins
module Greetable
  def greet
    puts "Hello, I'm \#{@name}!"
  end

  def formal_greet(title = nil)
    greeting = "Hello"
    greeting += ", \#{title}" if title
    greeting += " #{@name}!"
    puts greeting
  end
end

class Employee
  include Greetable

  attr_reader :name, :position

  def initialize(name:, position:)
    @name = name
    @position = position
  end
end

employee = Employee.new(name: "Bob", position: "Developer")
employee.greet
employee.formal_greet("Mr.")

# Reflection and introspection
puts "\\n=== Reflection ==="
puts "Calculator methods: \#{Calculator.methods(false).sort.join(', ')}"
puts "Calculator class methods: \#{Calculator.methods(true).sort.join(', ')}"
puts "Employee included modules: \#{Employee.included_modules.map(&:name).join(', ')}"

# Method chaining example
class NumberChain
  def initialize(number)
    @number = number
  end

  def add(value)
    @number += value
    self
  end

  def multiply(value)
    @number *= value
    self
  end

  def subtract(value)
    @number -= value
    self
  end

  def result
    @number
  end

  def to_s
    @number.to_s
  end
end

result = NumberChain.new(10)
  .add(5)
  .multiply(2)
  .subtract(3)
  .result

puts "\\nChaining result: \#{result}"
`,
      'Web Development': `require 'json'
require 'net/http'
require 'uri'
require 'digest'

# Simulate web development with Ruby
puts "=== Web Development with Ruby ==="

# JSON handling
class WebResponse
  attr_accessor :status_code, :headers, :body

  def initialize(status_code: 200, headers: {}, body: "")
    @status_code = status_code
    @headers = headers
    @body = body
  end

  def to_json
    {
      status_code: @status_code,
      headers: @headers,
      body: @body
    }.to_json
  end
end

# Simulate API endpoints
class API
  def initialize(base_url = "https://api.example.com")
    @base_url = base_url
  end

  def get_users
    users = [
      { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
      { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
      { id: 3, name: "Charlie", email: "charlie@example.com", role: "user" }
    ]

    response = WebResponse.new(
      200,
      { "Content-Type" => "application/json" },
      users.to_json
    )

    puts "GET /api/users - Status: \#{response.status_code}"
    puts "Response: \#{response.body[0..50]}..."
    response
  end

  def create_user(user_data)
    # Simulate user creation
    user_data[:id] = rand(1000..9999)
    user_data[:created_at] = Time.now.iso8601

    response = WebResponse.new(
      201,
      { "Content-Type" => "application/json" },
      user_data.to_json
    )

    puts "POST /api/users - Status: \#{response.status_code}"
    puts "Created user: \#{user_data[:name]} (ID: \#{user_data[:id]})"
    response
  end

  def authenticate_user(email, password)
    # Simulate authentication
    users = {
      "admin@example.com" => "admin123",
      "user@example.com" => "user123"
    }

    if users[email] == password
      token = Digest::SHA256.hexdigest("\#{email}:\#{Time.now.to_i}")
      response = WebResponse.new(
        200,
        { "Content-Type" => "application/json" },
        { token: token, user: email }.to_json
      )

      puts "POST /api/auth - Status: \#{response.status_code}"
      puts "Authenticated: \#{email}"
      response
    else
      response = WebResponse.new(
        401,
        { "Content-Type" => "application/json" },
        { error: "Invalid credentials" }.to_json
      )

      puts "POST /api/auth - Status: \#{response.status_code}"
      puts "Authentication failed"
      response
    end
  end
end

# Simulate web server
class WebServer
  def initialize
    @api = API.new
    @routes = {}
    setup_routes
  end

  def setup_routes
    @routes["GET /api/users"] = -> { @api.get_users }
    @routes["POST /api/users"] = ->(params) { @api.create_user(params) }
    @routes["POST /api/auth"] = ->(params) {
      @api.authenticate_user(params[:email], params[:password])
    }
  end

  def handle_request(method, path, params = {})
    route_key = "#{method} #{path}"

    if @routes[route_key]
      @routes[route_key].call(params)
    else
      puts "404 - Not Found: #{method} #{path}"
      WebResponse.new(404, {}, "Not Found")
    end
  end
end

# Simulate web requests
server = WebServer.new

puts "\\n=== Simulated Web Requests ==="

# Get users
users_response = server.handle_request("GET", "/api/users")
puts ""

# Create user
new_user = {
  name: "Diana",
  email: "diana@example.com",
  role: "developer"
}
server.handle_request("POST", "/api/users", new_user)
puts ""

# Authentication
server.handle_request("POST", "/api/auth", {
  email: "alice@example.com",
  password: "wrongpassword"
})
puts ""

server.handle_request("POST", "/api/auth", {
  email: "admin@example.com",
  password: "admin123"
})

# URL and URI manipulation
puts "\\n=== URL and URI Manipulation ==="
base_url = "https://example.com/api/v1"
endpoint = "/users?active=true&limit=10"

full_url = base_url + endpoint
uri = URI.parse(full_url)

puts "Full URL: \#{full_url}"
puts "Scheme: \#{uri.scheme}"
puts "Host: \#{uri.host}"
puts "Path: \#{uri.path}"
puts "Query: \#{uri.query}"
puts "Params: \#{URI.decode_www_form_component(uri.query)}"

# Hash and symbol keys
config = {
  "database_host" => "localhost",
  "database_port" => 5432,
  "database_name" => "myapp_development",
  :redis_host => "localhost",
  :redis_port => 6379
}

puts "\\nConfiguration (with symbol keys):"
config.each do |key, value|
  puts "  \#{key}: \#{value}"
end

# Convert hash keys between strings and symbols
string_keys_config = config.transform_keys(&:to_s)
symbol_keys_config = config.transform_keys(&:to_sym)

puts "\\nHash with string keys has \#{string_keys_config.keys.size} entries"
puts "Hash with symbol keys has \#{symbol_keys_config.keys.size} entries"
`,
      'Data Processing': `require 'json'
require 'csv'

# Ruby Data Processing Examples
puts "=== Data Processing with Ruby ==="

# Working with JSON data
json_string = '{
  "products": [
    {
      "id": 1,
      "name": "Laptop",
      "price": 999.99,
      "category": "Electronics",
      "in_stock": true,
      "tags": ["computer", "portable", "work"]
    },
    {
      "id": 2,
      "name": "Coffee Mug",
      "price": 12.99,
      "category": "Kitchen",
      "in_stock": false,
      "tags": ["drinkware", "ceramic"]
    },
    {
      "id": 3,
      "name": "Wireless Mouse",
      "price": 29.99,
      "category": "Electronics",
      "in_stock": true,
      "tags": ["computer", "accessory", "wireless"]
    }
  ],
  "total_products": 3,
  "generated_at": "2024-01-15T10:30:00Z"
}'

# Parse JSON
data = JSON.parse(json_string)
products = data["products"]

puts "Parsed \#{products.length} products from JSON"

# Data filtering and transformation
available_products = products.select { |p| p["in_stock"] }
expensive_products = products.select { |p| p["price"] > 100 }
electronics_products = products.select { |p| p["category"] == "Electronics" }

puts "Available products: \#{available_products.length}"
puts "Expensive products: \#{expensive_products.length}"
puts "Electronics products: \#{electronics_products.length}"

# Custom sorting
sorted_by_price = products.sort_by { |p| -p["price"] }
sorted_by_name = products.sort_by { |p| p["name"] }

puts "\\nProducts sorted by price (highest first):"
sorted_by_price.each { |p| puts "  \#{p[:name]}: $#{p[:price]}" }

# Data aggregation
categories = products.group_by { |p| p["category"] }
category_stats = categories.transform_values do |products_in_category|
  {
    count: products_in_category.length,
    avg_price: products_in_category.map { |p| p["price"] }.sum / products_in_category.length,
    total_value: products_in_category.map { |p| p["price"] }.sum.round(2)
  }
end

puts "\\nCategory Statistics:"
category_stats.each do |category, stats|
  puts "  \#{category}:"
  puts "    Products: \#{stats[:count]}"
  puts "    Avg Price: $#{stats[:avg_price].round(2)}"
  puts "    Total Value: $#{stats[:total_value]}"
end

# Tag analysis
all_tags = products.flat_map { |p| p["tags"] }
tag_counts = all_tags.each_with_object(Hash.new(0)) { |tag, counts| counts[tag] += 1 }

puts "\\nTag Usage:"
tag_counts.sort_by { |_tag, count| -count }.each do |tag, count|
  puts "  \#{tag}: \#{count} products"
end

# Custom data classes
class ProductAnalyzer
  attr_reader :products

  def initialize(products)
    @products = products
  end

  def find_by_id(id)
    @products.find { |p| p["id"] == id }
  end

  def search(term)
    @products.select do |p|
      p["name"].downcase.include?(term.downcase) ||
      p["tags"].any? { |tag| tag.downcase.include?(term.downcase) }
    end
  end

  def price_range(min_price, max_price)
    @products.select { |p| p["price"] >= min_price && p["price"] <= max_price }
  end

  def generate_report
    {
      summary: {
        total_products: @products.length,
        available_count: @products.count { |p| p["in_stock"] },
        categories: @products.map { |p| p["category"] }.uniq.count,
        price_range: {
          min: @products.map { |p| p["price"] }.min,
          max: @products.map { |p| p["price"] }.max,
          avg: @products.map { |p| p["price"] }.sum / @products.length
        }
      },
      categories: categories,
      top_expensive: @products.sort_by { |p| -p["price"] }.first(3),
      budget_friendly: @products.select { |p| p["price"] < 50 }.sort_by { |p| p["price"] }
    }
  end
end

analyzer = ProductAnalyzer.new(products)

puts "\\n=== Product Analysis ==="

# Find specific product
product = analyzer.find_by_id(2)
puts "Product with ID 2: \#{product['name']}" if product

# Search functionality
search_results = analyzer.search("computer")
puts "Products matching 'computer': \#{search_results.length}"
search_results.each { |p| puts "  - \#{p['name']} ($\#{p['price']})" }

# Price range analysis
budget_products = analyzer.price_range(0, 50)
puts "Budget products (under $50): \#{budget_products.length}"

# Generate comprehensive report
report = analyzer.generate_report
puts "\\n=== Summary Report ==="
summary = report[:summary]
puts "Total products: \#{summary[:total_products]}"
puts "Available products: \#{summary[:available_count]}"
puts "Number of categories: \#{summary[:categories]}"
puts "Price range: $#{summary[:price_range][:min]} - $#{summary[:price_range][:max]}"
puts "Average price: $#{summary[:price_range][:avg].round(2)}"

# CSV generation
puts "\\n=== CSV Generation ==="
csv_data = [
  ["ID", "Name", "Price", "Category", "Stock", "Tags"],
  *products.map do |p|
    [
      p["id"],
      p["name"],
      p["price"],
      p["category"],
      p["in_stock"] ? "Yes" : "No",
      p["tags"].join(";")
    ]
  end
]

# Convert to CSV string
csv_string = csv_data.map { |row| row.join(",") }.join("\\n")
puts "CSV Data:"
puts csv_string

# Save CSV to a virtual file
csv_file = "products.csv"
File.write(csv_file, csv_string)
puts "CSV saved to \#{csv_file}"

# Export data back to JSON with additional fields
export_data = {
  metadata: {
    export_time: Time.now.iso8601,
    exporter: "Ruby Data Processor",
    version: "1.0"
  },
  analytics: {
    report: report,
    most_expensive: sorted_by_price.first,
    most_tagged: tag_counts.max_by { |_tag, count| count },
    product_density: "Average \#{(categories.values.map { |cat| cat[:count] }.sum.to_f / categories.size).round(2)} products per category"
  },
  data: products.map do |p|
    p.merge(
      "price_category" => case p["price"]
                     when 0..50 then "Budget"
                     when 51..200 then "Mid-range"
                     when 201..500 then "Premium"
                     else "Luxury"
                     end,
      "affordability_score" => p["price"] < 100 ? "High" : "Medium",
      "tag_count" => p["tags"].length
    )
  end
}

# Pretty-print enhanced JSON
puts "\\n=== Enhanced Data Export ==="
puts JSON.pretty_generate(export_data)
`,
      'Functional Programming': `# Ruby Functional Programming Examples
puts "=== Functional Programming in Ruby ==="

# Basic functional concepts with blocks and procs
puts "1. Working with Blocks and Procs:"

# Map, filter, and reduce (inject)
numbers = (1..10).to_a

squared = numbers.map { |n| n * n }
evens = numbers.select { |n| n.even? }
sum = numbers.inject(0) { |total, n| total + n }
product = numbers.inject(1) { |total, n| total * n }

puts "Numbers: \#{numbers}"
puts "Squared: \#{squared}"
puts "Even numbers: \#{evens}"
puts "Sum: \#{sum}"
puts "Product: \#{product}"

# Custom enumerable methods
module Enumerable
  def take_while
    each do |item|
      break unless yield(item)
      item
    end
  end

  def drop_while
    started = false
    each do |item|
      return to_a unless started
      started = !yield(item)
    end
  end
end

words = ["hello", "world", "ruby", "programming", "functional"]
short_words = words.take_while { |word| word.length < 6 }
long_words = words.drop_while { |word| word.length <= 4 }

puts "\\nWords: \#{words}"
puts "Words while length < 6: \#{short_words}"
puts "Words after length > 4: \#{long_words}"

# Higher-order functions
puts "\\n2. Higher-order Functions:"

# Function composition
def add_five
  proc { |x| x + 5 }
end

def multiply_by_three
  proc { |x| x * 3 }
end

def compose(f, g)
  proc { |x| f.call(g.call(x)) }
end

add_five_then_multiply = compose(multiply_by_three, add_five)
result = add_five_then_multiply.call(2) # (2 + 5) * 3 = 21

puts "Composed function result: \#{result}"

# Curry functions
def curry_multiply
  proc { |a| proc { |b| a * b } }
end

doubler = curry_multiply.call(2)
tripler = curry_multiply.call(3)

puts "Double 5: \#{doubler.call(5)}"
puts "Triple 7: \#{tripler.call(7)}"

# Lazy evaluation with Enumerator
def lazy_fibonacci
  Enumerator.new do |yield|
    a, b = 0, 1
    loop do
      yield a
      a, b = b, a + b
    end
  end
end

puts "\\nFirst 10 Fibonacci numbers:"
fib_numbers = lazy_fibonacci.take(10).to_a
puts fib_numbers.join(", ")

# Lazy filtering
even_fibonacci = lazy_fibonacci.select { |n| n.even? }
puts "First 5 even Fibonacci numbers:"
even_fibonacci.take(5).each { |n| print "\#{n} " }

puts "\\n"

# Memoization for performance
class Memoizer
  def initialize
    @cache = {}
  end

  def memoize(key, &block)
    if @cache.key?(key)
      @cache[key]
    else
      @cache[key] = block.call
    end
  end
end

memo = Memoizer.new

# Memoized expensive function
def expensive_calculation(n)
  puts "Performing expensive calculation for \#{n}..."
  (1..n).reduce(:*)
end

# Without memoization
puts "Without memoization:"
result1 = expensive_calculation(10)
puts "Result: \#{result1}"
result2 = expensive_calculation(10)
puts "Result: \#{result2}"

# With memoization
puts "\\nWith memoization:"
memoized_calc = proc { |n| memo.memoize(n, &method(:expensive_calculation)) }
result3 = memoized_calc.call(10)
puts "Result: \#{result3}"
result4 = memoized_calc.call(10)
puts "Result: \#{result4}" # Should not recalculate

# Functional programming with arrays
puts "\\n3. Functional Array Operations:"

# Transpose a matrix
matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

transposed = matrix.first.map.with_index do |_row, i|
  matrix.map { |row| row[i] }
end

puts "Original matrix:"
matrix.each { |row| puts "  \#{row}" }
puts "Transposed matrix:"
transposed.each { |row| puts "  \#{row}" }

# Functional group_by
people = [
  { name: "Alice", age: 25, department: "Engineering" },
  { name: "Bob", age: 30, department: "Engineering" },
  { name: "Charlie", age: 35, department: "Sales" },
  { name: "Diana", age: 28, department: "Sales" },
  { name: "Eve", age: 32, department: "Marketing" }
]

grouped = people.group_by { |person| person[:department] }
age_averages = grouped.transform_values { |people_in_dept|
  people_in_dept.map { |p| p[:age] }.sum.to_f / people_in_dept.length
}

puts "\\nAverage age by department:"
age_averages.each do |dept, avg_age|
  puts "  \#{dept}: \#{avg_age.round(1)} years"
end

# Functional sorting with custom criteria
sorted_people = people.sort_by do |person|
  [person[:department], person[:age]]
end

puts "\\nPeople sorted by department then age:"
sorted_people.each { |p| puts "  \#{p[:department]}: \#{p[:name]} (#{p[:age]})" }

# Pipeline for data processing
class DataPipeline
  def initialize
    @operations = []
  end

  def step(description = nil, &block)
    @operations << [description, block]
    self
  end

  def process(data)
    @operations.each_with_index do |(description, operation), index|
      puts "Step #{index + 1}: \#{description}" if description
      data = operation.call(data)
      puts "  Result: \#{data.class} with \#{data.respond_to?(:count) ? data.count : 'N/A'} items"
    end
    data
  end
end

pipeline = DataPipeline.new

result = pipeline
  .step("Start with numbers 1-10") { (1..10).to_a }
  .step("Square each number") { |arr| arr.map { |n| n * n } }
  .step("Filter for even numbers") { |arr| arr.select { |n| n.even? } }
  .step("Convert to strings") { |arr| arr.map(&:to_s) }
  .step("Join with spaces") { |arr| arr.join(" ") }
  .process(nil)

puts "\\nPipeline result: \#{result}"

# Monads - Maybe monad implementation
class Maybe
  def initialize(value = nil)
    @value = value
  end

  def self.some(value)
    new(value)
  end

  def self.none
    new(nil)
  end

  def map(&block)
    if @value
      Maybe.some(block.call(@value))
    else
      Maybe.none
    end
  end

  def flat_map(&block)
    if @value
      result = block.call(@value)
      result.is_a?(Maybe) ? result : Maybe.some(result)
    else
      Maybe.none
    end
  end

  def or(default)
    @value || default
  end

  def get_or_else(&block)
    @value || block.call
  end

  def present?
    !@value.nil?
  end

  def none?
    @value.nil?
  end
end

def safe_parse_json(json_string)
  begin
    Maybe.some(JSON.parse(json_string))
  rescue JSON::ParserError
    Maybe.none
  end
end

# Using Maybe monad for safe operations
valid_json = safe_parse_json('{"name": "Alice", "age": 25}')
invalid_json = safe_parse_json('invalid json')

puts "\\nMaybe monad examples:"
puts "Valid JSON name: \#{valid_json.map { |data| data['name'] }.get_or_else('N/A')}"
puts "Invalid JSON name: \#{invalid_json.map { |data| data['name'] }.get_or_else('N/A')}"

# Chain of safe operations
result = valid_json
  .flat_map { |data| data.key?('email') ? Maybe.some(data['email']) : Maybe.none }
  .map { |email| email.upcase }
  .or('NO_EMAIL')

puts "Safe email extraction: \#{result}"
`,
    };
  }

  /**
   * Interrupt execution
   */
  interrupt(): void {
    // Ruby interruption would be implemented here
    console.log('Interrupting Ruby execution');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.ruby = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Get runtime status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      version: '3.2.0',
      implementation: 'ruby.wasm',
      memoryUsage: this._estimateMemoryUsage(),
      loadedGems: this.defaultGems.filter((gem) => gem.isBundled).length,
      totalGems: this.defaultGems.length,
    };
  }

  private _prepareRubyCode(code: string, options: RubyExecutionOptions): string {
    let wrapper = '';

    // Add encoding comment
    wrapper += '# frozen_string_literal: true\n';

    // Add require statements for gems
    if (options.gems && options.gems.length > 0) {
      options.gems.forEach((gem) => {
        wrapper += `require '${gem}'\n`;
      });
      wrapper += '\n';
    }

    // Add load path
    if (options.loadPath && options.loadPath.length > 0) {
      wrapper += `$LOAD_PATH.unshift(*${JSON.stringify(options.loadPath)})\n`;
    }

    // Add error handling wrapper
    wrapper += 'begin\n';

    wrapper += `\n${code}`;

    // Add error handling
    wrapper += '\nrescue => e\n';
    wrapper += '  puts "Error: #{e.class} - #{e.message}"\n';
    wrapper += '  puts e.backtrace.join("\n") if defined?(e.backtrace)\n';
    wrapper += '  exit 1\n';
    wrapper += 'end\n';

    return wrapper;
  }

  private _estimateMemoryUsage(): number {
    // Estimate memory usage - this is a placeholder
    // In a real implementation, you would track actual Ruby memory usage
    return 48 * 1024 * 1024; // 48MB estimate for Ruby runtime
  }
}

// Export singleton instance
export const rubyRuntime = new RubyRuntime();
