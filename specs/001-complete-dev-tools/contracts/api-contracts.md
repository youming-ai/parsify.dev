# API Contracts: Complete Developer Tools Platform

**Created**: 2025-01-18  
**Purpose**: API contracts and service interfaces for tool interoperability

---

## Core Tool API Contracts

### Tool Registration and Discovery

```typescript
// Tool Registration Contract
interface ToolRegistry {
  // Register a new tool
  registerTool(tool: ToolRegistration): Promise<ToolRegistrationResponse>;
  
  // List available tools
  listTools(options?: ToolListOptions): Promise<ToolListResponse>;
  
  // Get tool by ID
  getTool(toolId: string): Promise<ToolResponse>;
  
  // Update tool configuration
  updateTool(toolId: string, config: ToolConfiguration): Promise<ToolUpdateResponse>;
  
  // Deactivate/reactivate tool
  setToolStatus(toolId: string, status: ToolStatus): Promise<ToolStatusResponse>;
}

interface ToolRegistration {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  icon?: string;
  tags: string[];
  bundle: ToolBundleInfo;
  dependencies: Dependency[];
  features: ToolFeature[];
  performance: ToolPerformanceProfile;
}

interface ToolBundleInfo {
  entryPoint: string;           // Main component path
  bundleSize: BundleSize;
  wasmModules?: WasmModule[];
  cssFiles?: string[];
  loadStrategy: "eager" | "lazy" | "preload";
}

interface WasmModule {
  name: string;
  path: string;
  size: number;
  features: string[];
  required: boolean;
}
```

### Tool Execution Contract

```typescript
// Tool Execution Interface
interface ToolExecution {
  // Execute tool with input
  execute(input: ToolExecutionInput): Promise<ToolExecutionResult>;
  
  // Validate input before execution
  validateInput(input: ToolInput): Promise<ValidationResult>;
  
  // Get tool configuration schema
  getConfigSchema(): Promise<ConfigurationSchema>;
  
  // Get tool capabilities
  getCapabilities(): Promise<ToolCapabilities>;
  
  // Cancel ongoing execution
  cancel(executionId: string): Promise<CancellationResult>;
}

interface ToolExecutionInput {
  toolId: string;
  sessionId?: string;
  input: ToolInputData;
  configuration: ToolConfiguration;
  executionOptions: ExecutionOptions;
  callback?: (progress: ToolProgress) => void;
}

interface ToolExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  output: ToolOutput;
  performance: ExecutionMetrics;
  errors: ToolError[];
  warnings: ToolWarning[];
  metadata: ResultMetadata;
}

interface ExecutionMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsed: number;
  cpuUsage?: number;
  networkCalls?: number;
  steps: ExecutionStep[];
}

interface ExecutionStep {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: "completed" | "failed" | "pending";
  details?: Record<string, any>;
}
```

---

## JSON Tools API Contracts

### JSON Processing Contracts

```typescript
// JSON Tool Interface
interface JSONTool extends ToolExecution {
  // Parse and validate JSON
  parseJSON(input: JSONParseInput): Promise<JSONParseResult>;
  
  // Format JSON
  formatJSON(input: JSONFormatInput): Promise<JSONFormatResult>;
  
  // Convert JSON to other formats
  convertJSON(input: JSONConvertInput): Promise<JSONConvertResult>;
  
  // Generate code from JSON
  generateCode(input: JSONCodeGenInput): Promise<JSONCodeGenResult>;
  
  // Validate against schema
  validateSchema(input: JSONSchemaValidateInput): Promise<JSONSchemaValidateResult>;
}

interface JSONParseInput {
  json: string | File;
  options: JSONParseOptions;
}

interface JSONParseOptions {
  allowComments: boolean;           // Allow JSON5 comments
  allowTrailingCommas: boolean;   // Allow trailing commas
  maxDepth: number;                // Maximum nesting depth
  recoverable: boolean;           // Attempt to recover from errors
  encoding: string;                 // Text encoding
}

interface JSONParseResult {
  isValid: boolean;
  parsedData?: any;
  errors: JSONError[];
  warnings: JSONWarning[];
  metadata: JSONMetadata;
}

interface JSONError {
  line: number;
  column: number;
  position: number;
  message: string;
  type: "syntax" | "schema" | "logic" | "encoding";
  severity: "error" | "warning";
  suggestion?: string;
}

interface JSONCodeGenInput {
  jsonData: any;
  language: CodeLanguage;
  options: CodeGenOptions;
}

interface CodeGenOptions {
  useTypeScript: boolean;
  generateInterfaces: boolean;
  generateValidation: boolean;
  generateExamples: boolean;
  namingConvention: NamingConvention;
  includeComments: boolean;
}
```

### JSON Hero Viewer Contract

```typescript
// JSON Hero Visualization Interface
interface JSONHeroViewer extends JSONTool {
  // Get visualization data
  getVisualization(input: JSONVisInput): Promise<JSONVisResult>;
  
  // Search in JSON
  searchJSON(input: JSONSearchInput): Promise<JSONSearchResult>;
  
  // Get JSON path
  getJSONPath(input: JSONPathInput): Promise<JSONPathResult>;
}

interface JSONVisInput {
  jsonData: any;
  options: JSONVisOptions;
}

interface JSONVisOptions {
  maxDepth: number;
  expandedPaths: string[];
  highlightTypes: boolean;
  showLineNumbers: boolean;
  theme: "light" | "dark" | "auto";
  collapseArrays: number;         // Collapse arrays longer than
  collapseObjects: number;        // Collapse objects deeper than
}

interface JSONVisResult {
  visualization: JSONVisualization;
  treeStructure: JSONTreeNode[];
  stats: JSONStats;
  metadata: VisMetadata;
}

interface JSONTreeNode {
  path: string;
  key: string;
  value: any;
  type: string;
  depth: number;
  children: JSONTreeNode[];
  isExpanded: boolean;
  isHighlighted: boolean;
  line?: number;
  column?: number;
}
```

---

## Code Execution API Contracts

### WASM Runtime Interface

```typescript
// WASM Runtime Management
interface WASMRuntime {
  // Initialize runtime
  initialize(config: WASMRuntimeConfig): Promise<WASMInitResult>;
  
  // Load language module
  loadLanguage(language: string): Promise<LanguageLoadResult>;
  
  // Execute code
  executeCode(input: CodeExecutionInput): Promise<CodeExecutionResult>;
  
  // Manage runtime lifecycle
  getRuntimeStatus(): Promise<RuntimeStatus>;
  cleanup(): Promise<void>;
}

interface WASMRuntimeConfig {
  memoryLimitMB: number;           // Memory limit in MB
  timeoutMs: number;                // Execution timeout
  allowedImports: string[];         // Allowed module imports
  blockedImports: string[];         // Blocked module imports
  environment: Record<string, string>; // Environment variables
  enableDebug: boolean;             // Enable debugging features
}

interface CodeExecutionInput {
  language: string;
  code: string;
  files?: ExecutionFile[];
  stdin?: string;
  timeoutMs?: number;
  memoryLimitMB?: number;
  enableOutput: boolean;
  captureErrors: boolean;
}

interface CodeExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  output: ExecutionOutput;
  metrics: ExecutionMetrics;
  error?: ExecutionError;
  warnings: ExecutionWarning[];
  consoleLogs: ConsoleLog[];
}

interface ExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal?: string;
  runtime: string;
  memoryUsed: number;
  executionTime: number;
}

interface ExecutionFile {
  name: string;
  content: string;
  type: "source" | "input" | "output" | "config";
}

interface ExecutionError {
  type: string;
  message: string;
  stackTrace?: string;
  line?: number;
  column?: number;
  file?: string;
  code: number;
}
```

### Language-Specific Contracts

```typescript
// Python Execution Contract
interface PythonRuntime extends WASMRuntime {
  // Execute Python code
  executePython(input: PythonExecutionInput): Promise<PythonExecutionResult>;
  
  // Manage Python packages
  managePackages(action: PackageManagerAction): Promise<PackageManagerResult>;
  
  // Get Python environment info
  getPythonEnvironment(): Promise<PythonEnvironment>;
}

interface PythonExecutionInput {
  code: string;
  packages?: PythonPackage[];
  inputFiles?: ExecutionFile[];
  captureGraphics?: boolean;       // Capture matplotlib graphics
  environment?: Record<string, string>;
}

interface PythonPackage {
  name: string;
  version?: string;
  installOptions?: string[];
  pipOptions?: string[];
}

// Java Execution Contract  
interface JavaRuntime extends WASMRuntime {
  // Compile and execute Java
  compileAndExecute(input: JavaExecutionInput): Promise<JavaExecutionResult>;
  
  // Get Java compilation info
  getCompilationInfo(input: JavaCompilationInput): Promise<JavaCompilationResult>;
}

interface JavaExecutionInput {
  mainClass?: string;             // Main class name
  sourceFiles: ExecutionFile[];   // Java source files
  classpath?: string[];           // Classpath entries
  jvmOptions?: string[];          // JVM options
  programArgs?: string[];          // Program arguments
}

// Go Execution Contract
interface GoRuntime extends WASMRuntime {
  // Build and execute Go
  buildAndExecute(input: GoExecutionInput): Promise<GoExecutionResult>;
  
  // Get Go module info
  getGoModuleInfo(input: GoModuleInput): Promise<GoModuleResult>;
}

interface GoExecutionInput {
  mainPackage?: string;            // Main package
  sourceFiles: ExecutionFile[];   // Go source files
  buildTags?: string[];          // Build tags
  gcFlags?: string;              // GC flags
  ldFlags?: string;              // Linker flags
  goVersion?: string;             // Target Go version
}
```

---

## Image Processing API Contracts

### Image Processing Interface

```typescript
// Image Tool Interface
interface ImageProcessor extends ToolExecution {
  // Process image with operations
  processImage(input: ImageProcessInput): Promise<ImageProcessResult>;
  
  // Get image information
  getImageInfo(input: ImageInfoInput): Promise<ImageInfoResult>;
  
  // Convert image format
  convertImage(input: ImageConvertInput): Promise<ImageConvertResult>;
  
  // Apply filters and effects
  applyFilters(input: ImageFilterInput): Promise<ImageFilterResult>;
}

interface ImageProcessInput {
  image: File | Blob | string;    // Image file, blob, or URL
  operations: ImageOperation[];
  options: ImageProcessOptions;
}

interface ImageOperation {
  type: "resize" | "crop" | "rotate" | "flip" | "watermark" | "filter";
  parameters: Record<string, any>;
}

interface ImageProcessOptions {
  outputFormat: ImageFormat;
  quality: number;                 // 0-100 quality
  preserveMetadata: boolean;
  progressive: boolean;
  optimizeSize: boolean;
  backgroundColor?: string;      // For transparency removal
}

interface ImageProcessResult {
  processedImage: Blob;
  processingStats: ImageProcessingStats;
  warnings: ImageWarning[];
  metadata: ImageMetadata;
}

interface ImageProcessingStats {
  originalSize: ImageSize;
  processedSize: ImageSize;
  compressionRatio: number;
  processingTime: number;
  memoryUsed: number;
  operationsCount: number;
}
```

### QR Code Scanner Contract

```typescript
// QR Code Scanner Interface
interface QRCodeScanner extends ImageProcessor {
  // Scan QR codes from image
  scanQRCode(input: QRScanInput): Promise<QRScanResult>;
  
  // Scan multiple QR codes
  scanMultipleQRCodes(input: QRScanInput): Promise<QRMultipleScanResult>;
}

interface QRScanInput {
  image: File | Blob | string;    // Image containing QR codes
  options: QRScanOptions;
}

interface QRScanOptions {
  region?: QRRegion;            // Scan region
  multiple: boolean;            // Allow multiple QR codes
  minSize: number;               // Minimum QR code size
  maxSize: number;               // Maximum QR code size
  errorCorrection: "L" | "M" | "Q" | "H";
  formats: QRCodeFormat[];
}

interface QRScanResult {
  qrCodes: QRCode[];
  scanStats: QRScanStats;
  warnings: QRWarning[];
  imageMetadata: ImageMetadata;
}

interface QRCode {
  data: string;
  position: QRect;
  size: QRSize;
  confidence: number;
  format: QRCodeFormat;
  errorLevel: ErrorCorrectionLevel;
}

interface QRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QRSize {
  modules: number;               // Number of modules (cells)
  version: number;                // QR code version
  errorCorrection: string;        // Error correction level
}

interface QRScanStats {
  scanTime: number;
  qrCodesFound: number;
  averageConfidence: number;
  processingResolution: ImageSize;
  algorithm: string;
}
```

---

## Network Utilities API Contracts

### HTTP Request Simulator Contract

```typescript
// HTTP Request Interface
interface HTTPRequestSimulator extends ToolExecution {
  // Send HTTP request
  sendRequest(input: HTTPRequestInput): Promise<HTTPRequestResult>;
  
  // Test multiple requests
  batchRequests(input: HTTPBatchInput): Promise<HTTPBatchResult>;
  
  // Generate request code samples
  generateCodeSample(input: CodeSampleInput): Promise<CodeSampleResult>;
}

interface HTTPRequestInput {
  url: string;
  method: HTTPMethod;
  headers?: Record<string, string>;
  body?: string | Record<string, any> | FormData;
  options: HTTPOptions;
}

interface HTTPOptions {
  timeoutMs: number;              // Request timeout
  followRedirects: boolean;       // Follow redirects
  maxRedirects: number;           // Maximum redirects
  enableCors: boolean;            // Enable CORS mode
  enableCookies: boolean;          // Enable cookies
  cacheMode: "default" | "no-store" | "reload" | "no-cache" | "force-cache";
  credentials: "omit" | "same-origin" | "include";
  mode: "cors" | "no-cors" | "same-origin";
}

interface HTTPRequestResult {
  request: HTTPRequestDetails;
  response: HTTPResponseDetails;
  timing: HTTPTiming;
  performance: HTTPPerformance;
  security: HTTPSecurity;
  warnings: HTTPWarning[];
}

interface HTTPResponseDetails {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  size: number;
  contentType: string;
  contentLength?: number;
  encoding?: string;
  redirected: boolean;
  url: string;
  type: ResponseType;
  trailer?: Record<string, string>;
}

interface HTTPTiming {
  startTime: number;              // Request start timestamp
  dnsStart: number;               // DNS lookup start
  dnsEnd: number;                 // DNS lookup end
  connectStart: number;           // Connection start
  connectEnd: number;             // Connection end
  requestStart: number;           // Request send start
  responseStart: number;          // Response receive start
  responseEnd: number;            // Response receive end
  totalDuration: number;          // Total request duration
  ttfb: number;                  // Time to first byte
  downloadTime: number;            // Download time
  uploadTime: number;              // Upload time
}
```

### IP Geolocation Contract

```typescript
// IP Geolocation Interface
interface IPGeolocationTool extends ToolExecution {
  // Get IP location
  getIPLocation(input: IPLocationInput): Promise<IPLocationResult>;
  
  // Get current IP
  getCurrentIP(): Promise<CurrentIPResult>;
  
  // Batch IP lookup
  batchIPLookup(input: IPLocationBatchInput): Promise<IPLocationBatchResult>;
}

interface IPLocationInput {
  ip: string;                      // IP address to lookup
  sources?: IPLocationSource[];    // Preferred lookup sources
  timeoutMs?: number;            // Request timeout
  cacheStrategy: "none" | "session" | "persistent";
}

interface IPLocationSource {
  name: string;                    // Source name
  type: "api" | "database" | "dns";
  url?: string;                     // API endpoint
  rateLimit?: RateLimit;           // Rate limiting info
  reliability: number;              // Reliability score (0-1)
  fields: IPGeolocationField[];     // Available fields
}

interface IPLocationResult {
  ip: string;
  location: IPLocationData;
  source: IPLocationSource;
  accuracy: IPLocationAccuracy;
  privacy: IPLocationPrivacy;
  warnings: IPLocationWarning[];
  lookupTime: number;
}

interface IPLocationData {
  country: string;
  countryCode: string;
  region?: string;
  regionCode?: string;
  city?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  currency?: string;
  languages?: string[];
  isp?: string;
  organization?: string;
  asn?: string;
  domain?: string;
  connectionType?: string;
}

interface IPLocationAccuracy {
  radius: number;                  // Accuracy radius in km
  confidence: number;              // Confidence level (0-1)
  method: string;                   // Geolocation method
  lastUpdated: string;              // Last database update
}
```

---

## Security Tools API Contracts

### Encryption Tool Interface

```typescript
// Encryption Tool Interface
interface EncryptionTool extends ToolExecution {
  // Encrypt data
  encrypt(input: EncryptInput): Promise<EncryptResult>;
  
  // Decrypt data
  decrypt(input: DecryptInput): Promise<DecryptResult>;
  
  // Generate keys
  generateKey(input: KeyGenInput): Promise<KeyGenResult>;
  
  // Validate keys
  validateKey(input: KeyValidateInput): Promise<KeyValidateResult>;
}

interface EncryptInput {
  data: string | ArrayBuffer | Blob;
  algorithm: EncryptionAlgorithm;
  key: CryptoKey | string;
  options: EncryptOptions;
}

interface EncryptionAlgorithm {
  name: string;                    // Algorithm name
  iv?: string;                      // Initialization vector
  tag?: string;                      // Authentication tag
  additionalData?: string;         // Additional authenticated data
  counter?: string;                 // Counter for counter modes
  keySize?: number;                 // Key size in bits
  blockSize?: number;               // Block size in bits
  mode?: string;                     // Cipher mode
  padding?: string;                 // Padding scheme
}

interface EncryptOptions {
  encoding: "raw" | "base64" | "hex" | "utf8";
  compression?: boolean;
  includeMeta: boolean;
  iterations?: number;
  salt?: string;
  keyDerivation: "pbkdf2" | "scrypt" | "argon2";
}

interface EncryptResult {
  encryptedData: ArrayBuffer;
  algorithm: EncryptionAlgorithm;
  metadata: EncryptionMetadata;
  performance: EncryptPerformance;
  warnings: EncryptWarning[];
}

interface EncryptionMetadata {
  algorithm: string;
  keySize: number;
  mode: string;
  padding: string;
  iv: string;
  tag?: string;
  salt: string;
  iterations: number;
  compression: boolean;
  encoding: string;
  timestamp: string;
}
```

### Hash Tool Interface

```typescript
// Hash Tool Interface
interface HashTool extends ToolExecution {
  // Calculate hash
  calculateHash(input: HashInput): Promise<HashResult>;
  
  // Calculate multiple hashes
  calculateMultipleHashes(input: HashMultipleInput): Promise<HashMultipleResult>;
  
  // Verify hash
  verifyHash(input: HashVerifyInput): Promise<HashVerifyResult>;
  
  // Calculate file hash
  calculateFileHash(input: FileHashInput): Promise<FileHashResult>;
}

interface HashInput {
  data: string | ArrayBuffer | File;
  algorithm: HashAlgorithm;
  options: HashOptions;
}

interface HashAlgorithm {
  name: string;                    // Algorithm name
  outputSize: number;              // Output size in bits
  blockSize?: number;              // Block size in bits
  security: "secure" | "weak" | "deprecated" | "broken";
  useCases: string[];               // Appropriate use cases
  warnings?: string[];              // Security warnings
}

interface HashOptions {
  encoding: "hex" | "base64" | "base64url" | "binary";
  iterations?: number;              // For iterative hashing
  salt?: string;                   // For keyed hashing
  hmac?: {                        // HMAC options
    key: string;
    algorithm: string;
  };
  tree?: boolean;                   // Merkle tree hashing
  stream?: boolean;                 // Streaming hash calculation
}

interface HashResult {
  hash: string;
  algorithm: HashAlgorithm;
  inputSize: number;
  calculationTime: number;
  metadata: HashMetadata;
  warnings: HashWarning[];
}

interface HashMetadata {
  algorithm: string;
  encoding: string;
  inputSize: number;
  iterations?: number;
  salt?: string;
  hmacAlgorithm?: string;
  timestamp: string;
  version: string;
}
```

---

## Event and Communication Contracts

### Tool Event Bus

```typescript
// Event Management Interface
interface ToolEventBus {
  // Subscribe to events
  subscribe(event: ToolEventType, handler: EventHandler): EventSubscription;
  
  // Unsubscribe from events
  unsubscribe(subscription: EventSubscription): void;
  
  // Emit event
  emit(event: ToolEvent): void;
  
  // Get event history
  getEventHistory(filter?: EventFilter): ToolEvent[];
}

interface ToolEvent {
  id: string;
  type: ToolEventType;
  source: string;                   // Event source (tool ID)
  timestamp: Date;
  data: Record<string, any>;
  priority: EventPriority;
  category: EventCategory;
}

type ToolEventType = 
  | "tool_execution_started"
  | "tool_execution_completed" 
  | "tool_execution_failed"
  | "tool_registration"
  | "tool_configuration_changed"
  | "performance_warning"
  | "security_event"
  | "user_action";

interface EventPriority {
  level: "low" | "medium" | "high" | "critical";
  importance: number;               // 1-10 importance score
  requiresNotification: boolean;
}

interface EventSubscription {
  id: string;
  event: ToolEventType;
  handler: EventHandler;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}
```

### State Management Contract

```typescript
// State Management Interface
interface ToolStateManager {
  // Get tool state
  getState(toolId: string, sessionId?: string): Promise<ToolState>;
  
  // Update tool state
  updateState(toolId: string, state: Partial<ToolState>, sessionId?: string): Promise<void>;
  
  // Reset tool state
  resetState(toolId: string, sessionId?: string): Promise<void>;
  
  // Get session history
  getSessionHistory(sessionId: string): Promise<ToolState[]>;
}

interface ToolState {
  toolId: string;
  sessionId: string;
  version: string;
  configuration: ToolConfiguration;
  input: ToolInput;
  output?: ToolOutput;
  execution: ExecutionState;
  uiState: UIState;
  metadata: StateMetadata;
}

interface ExecutionState {
  status: ExecutionStatus;
  startTime?: Date;
  endTime?: Date;
  errorCount: number;
  warningCount: number;
  lastExecutionId?: string;
}

interface UIState {
  activeTab?: string;
  expandedSections: string[];
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "auto";
  zoomLevel: number;
  scrollPosition: ScrollPosition;
}

interface ScrollPosition {
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
}

interface StateMetadata {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  storageType: "session" | "local" | "memory";
}
```

---

These API contracts provide a comprehensive foundation for implementing all 76+ developer tools while maintaining consistency, type safety, and interoperability across the platform.