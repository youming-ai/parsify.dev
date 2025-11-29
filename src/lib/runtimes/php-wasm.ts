/**
 * PHP WASM Runtime using WebAssembly PHP
 * Provides PHP 8.2 execution with web development support
 */

export interface PhpExtension {
  name: string;
  version: string;
  isEnabled: boolean;
  functions: string[];
  classes: string[];
}

export interface PhpExecutionOptions {
  code: string;
  input?: string; // STDIN input
  extensions?: string[]; // PHP extensions to enable
  iniSettings?: Record<string, string>; // php.ini settings
  workingDirectory?: string; // Working directory for file operations
  timeoutMs?: number;
  memoryLimitMB?: number;
  enableOutput?: boolean;
  captureErrors?: boolean;
  enableShortTags?: boolean;
  strictTypes?: boolean;
  errorReporting?: number; // E_ALL, E_ERROR, etc.
}

export interface PhpExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  peakMemoryUsage: number; // Peak memory usage in bytes
  includedFiles: string[]; // Files included/required
  definedFunctions: string[]; // User-defined functions
  definedClasses: string[]; // User-defined classes
  warnings?: string[];
  error?: Error;
  phpVersion: string;
  extensions: string[];
}

export interface PhpLibrary {
  name: string;
  version: string;
  description: string;
  category: 'core' | 'database' | 'web' | 'xml' | 'json' | 'crypto' | 'date' | 'math';
  functions: string[];
}

export class PhpRuntime {
  private php: any = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private defaultExtensions: PhpExtension[] = [
    {
      name: 'Core',
      version: '8.2.0',
      isEnabled: true,
      functions: ['strlen', 'substr', 'strpos', 'str_replace', 'explode', 'implode'],
      classes: ['stdClass', 'Exception', 'Error'],
    },
    {
      name: 'JSON',
      version: '1.7.0',
      isEnabled: true,
      functions: ['json_encode', 'json_decode', 'json_last_error'],
      classes: [],
    },
    {
      name: 'cURL',
      version: '8.2.0',
      isEnabled: true,
      functions: ['curl_init', 'curl_setopt', 'curl_exec', 'curl_close'],
      classes: ['CurlHandle', 'CurlMultiHandle'],
    },
    {
      name: 'PDO',
      version: '8.2.0',
      isEnabled: true,
      functions: [],
      classes: ['PDO', 'PDOStatement', 'PDOException'],
    },
    {
      name: 'mbstring',
      version: '8.2.0',
      isEnabled: true,
      functions: ['mb_strlen', 'mb_substr', 'mb_strpos', 'mb_convert_encoding'],
      classes: [],
    },
    {
      name: 'GD',
      version: '2.3.0',
      isEnabled: true,
      functions: ['imagecreate', 'imagecolorallocate', 'imagepng', 'imagedestroy'],
      classes: ['GdImage'],
    },
  ];

  /**
   * Initialize PHP runtime with WebAssembly PHP
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
      // In a real implementation, you would load WebAssembly PHP
      // For now, we'll simulate the PHP environment

      this.php = {
        // Mock PHP API - replace with actual WebAssembly PHP integration
        executePhp: async (_code: string, _options: any) => {
          // This would execute PHP code in WebAssembly
          return {
            stdout: '',
            stderr: '',
            exitCode: 0,
            executionTime: 0,
            memoryUsed: 0,
            peakMemoryUsage: 0,
            includedFiles: [],
            definedFunctions: [],
            definedClasses: [],
            warnings: [],
          };
        },
        enableExtension: (_extensionName: string) => {
          // Enable PHP extension
        },
        setIniSetting: (_key: string, _value: string) => {
          // Set php.ini setting
        },
        includeFile: (_filename: string) => {
          // Include PHP file
        },
      };

      this.isInitialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
      throw new Error(`Failed to initialize PHP runtime: ${message}`);
    }
  }

  /**
   * Execute PHP code with options
   */
  async executeCode(options: PhpExecutionOptions): Promise<PhpExecutionResult> {
    await this.initialize();

    if (!this.php) {
      throw new Error('PHP runtime not initialized');
    }

    const {
      code,
      input = '',
      extensions = [],
      iniSettings = {},
      workingDirectory = '/tmp',
      timeoutMs = 30000,
      memoryLimitMB = 256,
      enableOutput = true,
      captureErrors = true,
      enableShortTags = true,
      strictTypes = false,
      errorReporting = E_ALL,
    } = options;

    const startTime = performance.now();

    try {
      // Enable extensions
      for (const extension of extensions) {
        this.php.enableExtension(extension);
      }

      // Set php.ini settings
      this.php.setIniSetting('memory_limit', `${memoryLimitMB}M`);
      this.php.setIniSetting('max_execution_time', Math.floor(timeoutMs / 1000).toString());
      this.php.setIniSetting('short_open_tag', enableShortTags ? '1' : '0');
      this.php.setIniSetting('error_reporting', errorReporting.toString());
      this.php.setIniSetting('display_errors', captureErrors ? '1' : '0');

      // Prepare PHP code with wrappers
      const fullCode = this._preparePhpCode(code, options);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        throw new Error('PHP execution timeout');
      }, timeoutMs);

      try {
        // Execute PHP code
        const result = await this.php.executePhp(fullCode, {
          input,
          workingDirectory,
          strictTypes,
        });

        clearTimeout(timeoutId);

        const executionTime = performance.now() - startTime;

        // Get loaded extensions
        const loadedExtensions = this.defaultExtensions
          .filter((ext) => ext.isEnabled)
          .map((ext) => ext.name);

        return {
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          exitCode: result.exitCode || 0,
          executionTime,
          memoryUsed: result.memoryUsed || 0,
          peakMemoryUsage: result.peakMemoryUsage || 0,
          includedFiles: result.includedFiles || [],
          definedFunctions: result.definedFunctions || [],
          definedClasses: result.definedClasses || [],
          warnings: result.warnings || [],
          phpVersion: '8.2.0',
          extensions: loadedExtensions,
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
          includedFiles: [],
          definedFunctions: [],
          definedClasses: [],
          error: error instanceof Error ? error : new Error(String(error)),
          warnings: [],
          phpVersion: '8.2.0',
          extensions: extensions,
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
        includedFiles: [],
        definedFunctions: [],
        definedClasses: [],
        error: error instanceof Error ? error : new Error(String(error)),
        warnings: [],
        phpVersion: '8.2.0',
        extensions: extensions,
      };
    }
  }

  /**
   * Get available extensions
   */
  getAvailableExtensions(): PhpExtension[] {
    return this.defaultExtensions;
  }

  /**
   * Get code templates
   */
  getCodeTemplates(): Record<string, string> {
    return {
      'Hello World': `<?php
echo "Hello, World!" . PHP_EOL;

// Basic PHP features
$fruits = array("apple", "banana", "orange", "grape");

echo "Original fruits: " . implode(", ", $fruits) . PHP_EOL;

// Sort the array
sort($fruits);

echo "Sorted fruits: " . implode(", ", $fruits) . PHP_EOL;

// String manipulation
$text = "Hello from PHP";
echo "String: " . $text . PHP_EOL;
echo "Length: " . strlen($text) . PHP_EOL;
echo "Uppercase: " . strtoupper($text) . PHP_EOL;

// Current date and time
echo "Current time: " . date("Y-m-d H:i:s") . PHP_EOL;
?>`,
      'Array Operations': `<?php
// Multi-dimensional arrays
$students = [
    ["name" => "Alice", "age" => 20, "grade" => 85.5],
    ["name" => "Bob", "age" => 22, "grade" => 78.0],
    ["name" => "Charlie", "age" => 19, "grade" => 92.3]
];

echo "Student Information:" . PHP_EOL;
foreach ($students as $student) {
    echo sprintf(
        "%s (Age: %d, Grade: %.1f)" . PHP_EOL,
        $student["name"],
        $student["age"],
        $student["grade"]
    );
}

// Array filtering and mapping
$topStudents = array_filter($students, function($student) {
    return $student["grade"] >= 80;
});

$grades = array_column($students, "grade");
$averageGrade = array_sum($grades) / count($grades);

echo PHP_EOL . "Statistics:" . PHP_EOL;
echo "Average Grade: " . number_format($averageGrade, 2) . PHP_EOL;
echo "Top Students Count: " . count($topStudents) . PHP_EOL;

// Array functions example
$numbers = range(1, 10);
$squared = array_map(function($n) { return $n * $n; }, $numbers);
$evenSquared = array_filter($squared, function($n) { return $n % 2 === 0; });

echo "Even squares: " . implode(", ", $evenSquared) . PHP_EOL;
?>`,
      'OOP Example': `<?php
// Define a class
class Person {
    private $name;
    private $age;
    private $hobbies;

    public function __construct($name, $age, $hobbies = []) {
        $this->name = $name;
        $this->age = $age;
        $this->hobbies = $hobbies;
    }

    public function getName() {
        return $this->name;
    }

    public function getAge() {
        return $this->age;
    }

    public function addHobby($hobby) {
        $this->hobbies[] = $hobby;
    }

    public function getHobbies() {
        return $this->hobbies;
    }

    public function getInfo() {
        return sprintf(
            "%s is %d years old and enjoys %s",
            $this->name,
            $this->age,
            implode(", ", $this->hobbies)
        );
    }

    // Magic method
    public function __toString() {
        return $this->getInfo();
    }
}

// Create instances
$person1 = new Person("Alice", 30, ["reading", "coding"]);
$person2 = new Person("Bob", 25, ["gaming", "music"]);
$person3 = new Person("Charlie", 35, ["traveling", "photography"]);

// Add more hobbies
$person2->addHobby("cooking");
$person3->addHobby("writing");

$people = [$person1, $person2, $person3];

echo "People Information:" . PHP_EOL;
foreach ($people as $person) {
    echo "- " . $person . PHP_EOL;
}

// Static method example
class MathHelper {
    public static function factorial($n) {
        if ($n <= 1) return 1;
        return $n * self::factorial($n - 1);
    }

    public static function fibonacci($n) {
        if ($n <= 1) return $n;
        return self::fibonacci($n - 1) + self::fibonacci($n - 2);
    }
}

echo PHP_EOL . "Math Calculations:" . PHP_EOL;
echo "Factorial of 5: " . MathHelper::factorial(5) . PHP_EOL;
echo "Fibonacci sequence (first 10): ";
for ($i = 0; $i < 10; $i++) {
    echo MathHelper::fibonacci($i) . " ";
}
echo PHP_EOL;
?>`,
      'JSON Processing': `<?php
// Working with JSON
$data = [
    "name" => "John Doe",
    "age" => 30,
    "email" => "john@example.com",
    "hobbies" => ["reading", "coding", "gaming"],
    "address" => [
        "street" => "123 Main St",
        "city" => "Anytown",
        "country" => "USA"
    ]
];

// Encode to JSON
$jsonString = json_encode($data, JSON_PRETTY_PRINT);
echo "JSON Data:" . PHP_EOL;
echo $jsonString . PHP_EOL . PHP_EOL;

// Decode from JSON
$decodedData = json_decode($jsonString, true);

echo "Decoded Information:" . PHP_EOL;
echo "Name: " . $decodedData["name"] . PHP_EOL;
echo "Email: " . $decodedData["email"] . PHP_EOL;
echo "Hobbies: " . implode(", ", $decodedData["hobbies"]) . PHP_EOL;
echo "Address: " . $decodedData["address"]["street"] . ", " .
     $decodedData["address"]["city"] . PHP_EOL;

// Handle JSON errors
$jsonStringWithError = '{"name": "John", "age": 30,}'; // Invalid JSON
$result = json_decode($jsonStringWithError);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo PHP_EOL . "JSON Error: " . json_last_error_msg() . PHP_EOL;
}

// Nested array to JSON conversion
$products = [
    [
        "id" => 1,
        "name" => "Laptop",
        "price" => 999.99,
        "categories" => ["Electronics", "Computers"]
    ],
    [
        "id" => 2,
        "name" => "Book",
        "price" => 19.99,
        "categories" => ["Books", "Education"]
    ]
];

$productsJson = json_encode($products, JSON_PRETTY_PRINT);
echo PHP_EOL . "Products JSON:" . PHP_EOL;
echo $productsJson . PHP_EOL;

// Process JSON in a loop
$productsData = json_decode($productsJson, true);
$totalValue = 0;

echo PHP_EOL . "Product Summary:" . PHP_EOL;
foreach ($productsData as $product) {
    $totalValue += $product["price"];
    echo sprintf(
        "- %s: $%.2f (%s)" . PHP_EOL,
        $product["name"],
        $product["price"],
        implode("/", $product["categories"])
    );
}
echo "Total Value: $" . number_format($totalValue, 2) . PHP_EOL;
?>`,
      'Web Development': `<?php
// Simulate web request handling
class WebRequest {
    private $method;
    private $path;
    private $headers;
    private $body;

    public function __construct($method, $path, $headers = [], $body = '') {
        $this->method = $method;
        $this->path = $path;
        $this->headers = $headers;
        $this->body = $body;
    }

    public function getMethod() { return $this->method; }
    public function getPath() { return $this->path; }
    public function getHeaders() { return $this->headers; }
    public function getBody() { return $this->body; }
}

class WebResponse {
    private $statusCode;
    private $headers;
    private $body;

    public function __construct($statusCode = 200, $headers = [], $body = '') {
        $this->statusCode = $statusCode;
        $this->headers = array_merge(['Content-Type: text/html'], $headers);
        $this->body = $body;
    }

    public function setHeader($name, $value) {
        $this->headers[] = "$name: $value";
    }

    public function send() {
        echo "HTTP/1.1 {$this->statusCode} OK" . PHP_EOL;
        foreach ($this->headers as $header) {
            echo $header . PHP_EOL;
        }
        echo PHP_EOL . $this->body;
    }
}

// Simple router
class Router {
    private $routes = [];

    public function get($path, $handler) {
        $this->routes['GET'][$path] = $handler;
    }

    public function post($path, $handler) {
        $this->routes['POST'][$path] = $handler;
    }

    public function handle($request) {
        $method = $request->getMethod();
        $path = $request->getPath();

        if (isset($this->routes[$method][$path])) {
            $handler = $this->routes[$method][$path];
            return $handler($request);
        }

        return new WebResponse(404, [], '<h1>404 Not Found</h1>');
    }
}

// Create router and define routes
$router = new Router();

$router->get('/', function($request) {
    $html = '
    <!DOCTYPE html>
    <html>
    <head><title>Welcome</title></head>
    <body>
        <h1>Welcome to PHP Web Server</h1>
        <p>This is a simulated web response!</p>
        <ul>
            <li><a href="/about">About</a></li>
            <li><a href="/api/data">API Data</a></li>
        </ul>
    </body>
    </html>';

    $response = new WebResponse(200, ['Content-Length: ' . strlen($html)], $html);
    return $response;
});

$router->get('/about', function($request) {
    $data = [
        'app' => 'PHP Web Server Simulator',
        'version' => '1.0.0',
        'features' => ['Routing', 'Request Handling', 'Response Generation']
    ];

    $json = json_encode($data, JSON_PRETTY_PRINT);
    $response = new WebResponse(200, ['Content-Type: application/json'], $json);
    return $response;
});

$router->get('/api/data', function($request) {
    // Parse query parameters
    $query = parse_url($request->getPath(), PHP_URL_QUERY);
    parse_str($query, $params);

    $format = isset($params['format']) ? $params['format'] : 'json';
    $limit = isset($params['limit']) ? intval($params['limit']) : 5;

    $items = [];
    for ($i = 1; $i <= $limit; $i++) {
        $items[] = [
            'id' => $i,
            'title' => "Item $i",
            'description' => "This is item number $i"
        ];
    }

    if ($format === 'xml') {
        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<items>';
        foreach ($items as $item) {
            $xml .= "<item><id>{$item['id']}</id><title>{$item['title']}</title><description>{$item['description']}</description></item>";
        }
        $xml .= '</items>';

        $response = new WebResponse(200, ['Content-Type: application/xml'], $xml);
    } else {
        $json = json_encode($items, JSON_PRETTY_PRINT);
        $response = new WebResponse(200, ['Content-Type: application/json'], $json);
    }

    return $response;
});

$router->post('/api/submit', function($request) {
    $body = $request->getBody();
    $data = json_decode($body, true);

    if (!$data || !isset($data['name']) || !isset($data['email'])) {
        return new WebResponse(400, [], json_encode(['error' => 'Missing required fields']));
    }

    $response = [
        'success' => true,
        'message' => 'Data received successfully',
        'received' => $data
    ];

    $json = json_encode($response, JSON_PRETTY_PRINT);
    return new WebResponse(200, ['Content-Type: application/json'], $json);
});

// Simulate web requests
$requests = [
    new WebRequest('GET', '/'),
    new WebRequest('GET', '/about'),
    new WebRequest('GET', '/api/data?format=xml&limit=3'),
    new WebRequest('GET', '/api/data?limit=2'),
    new WebRequest('POST', '/api/submit', [], json_encode(['name' => 'John Doe', 'email' => 'john@example.com']))
];

echo "Simulated Web Server Responses:" . PHP_EOL . PHP_EOL;

foreach ($requests as $i => $request) {
    echo "--- Request {$i + 1}: {$request->getMethod()} {$request->getPath()} ---" . PHP_EOL;
    $response = $router->handle($request);
    $response->send();
    echo PHP_EOL . PHP_EOL;
}
?>`,
    };
  }

  /**
   * Interrupt execution
   */
  interrupt(): void {
    // PHP interruption would be implemented here
    console.log('Interrupting PHP execution');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.php = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Get runtime status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      version: '8.2.0',
      sapi: 'WebAssembly',
      memoryUsage: this._estimateMemoryUsage(),
      enabledExtensions: this.defaultExtensions.filter((ext) => ext.isEnabled).length,
      totalExtensions: this.defaultExtensions.length,
    };
  }

  private _preparePhpCode(code: string, options: PhpExecutionOptions): string {
    // Add opening tag if not present
    if (!/^<\?php/.test(code)) {
      code = `<?php\n${code}`;
    }

    // Add execution wrapper for better control
    let wrapper = '';

    if (options.strictTypes) {
      wrapper += 'declare(strict_types=1);\\n';
    }

    // Error reporting setup
    wrapper += `error_reporting(${options.errorReporting || E_ALL});\\n`;
    wrapper += `ini_set('display_errors', ${options.captureErrors ? '1' : '0'});\\n`;

    // Memory limit
    wrapper += `ini_set('memory_limit', '${options.memoryLimitMB || 256}M');\\n`;

    return `${wrapper}\\n${code}`;
  }

  private _estimateMemoryUsage(): number {
    // Estimate memory usage - this is a placeholder
    // In a real implementation, you would track actual PHP memory usage
    return 64 * 1024 * 1024; // 64MB estimate for PHP runtime
  }
}

// PHP error constants
const E_ALL = 32767;
const _E_ERROR = 1;
const _E_WARNING = 2;
const _E_PARSE = 4;
const _E_NOTICE = 8;
const _E_CORE_ERROR = 16;
const _E_CORE_WARNING = 32;
const _E_COMPILE_ERROR = 64;
const _E_COMPILE_WARNING = 128;
const _E_USER_ERROR = 256;
const _E_USER_WARNING = 512;
const _E_USER_NOTICE = 1024;
const _E_STRICT = 2048;
const _E_RECOVERABLE_ERROR = 4096;
const _E_DEPRECATED = 8192;
const _E_USER_DEPRECATED = 16384;

// Export singleton instance
export const phpRuntime = new PhpRuntime();
