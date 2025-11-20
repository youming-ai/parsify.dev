/**
 * NLP Web Worker
 * Background processing for ML operations to prevent UI blocking
 */

// Import statements for Web Worker context
import * as tf from "@tensorflow/tfjs";

// Types for worker messages
export interface WorkerMessage<T = any> {
  id: string;
  type: "init" | "process" | "load_model" | "dispose" | "health_check";
  operation: string;
  data: T;
  timestamp: number;
}

export interface WorkerResponse<T = any> {
  id: string;
  type:
    | "success"
    | "error"
    | "progress"
    | "initialized"
    | "model_loaded"
    | "disposed";
  operation: string;
  data?: T;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  progress?: {
    current: number;
    total: number;
    message?: string;
  };
  timestamp: number;
  processingTime?: number;
}

export interface ModelLoadData {
  modelId: string;
  modelUrl?: string;
  modelConfig?: any;
  layerConfig?: any;
}

export interface ProcessingData {
  input: string | string[];
  modelId?: string;
  operation: string;
  options?: any;
  preprocessor?: any;
  postprocessor?: any;
}

export interface ProgressData {
  stage: string;
  current: number;
  total: number;
  message?: string;
  details?: any;
}

// Worker state
interface WorkerState {
  initialized: boolean;
  models: Map<string, any>;
  memory: {
    used: number;
    allocated: number;
    peak: number;
  };
  metrics: {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageProcessingTime: number;
    lastHealthCheck?: Date;
  };
}

// Global state
const workerState: WorkerState = {
  initialized: false,
  models: new Map(),
  memory: {
    used: 0,
    allocated: 0,
    peak: 0,
  },
  metrics: {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageProcessingTime: 0,
  },
};

// Initialize TensorFlow.js in worker
async function initializeWorker(): Promise<void> {
  try {
    // Initialize TensorFlow.js backend
    await tf.ready();

    // Set backend for optimal performance in worker
    await tf.setBackend("webgl");

    workerState.initialized = true;
    workerState.metrics.lastHealthCheck = new Date();

    sendResponse("initialized", "init", {
      backend: tf.getBackend(),
      memory: tf.memory(),
    });
  } catch (error) {
    sendError("init", "Failed to initialize worker", error as Error);
    throw error;
  }
}

// Send success response
function sendResponse<T>(
  type: WorkerResponse["type"],
  operation: string,
  data?: T,
  processingTime?: number,
): void {
  const response: WorkerResponse<T> = {
    id: generateId(),
    type,
    operation,
    data,
    timestamp: Date.now(),
    processingTime,
  };
  postMessage(response);
}

// Send error response
function sendError(operation: string, message: string, error?: Error): void {
  const response: WorkerResponse = {
    id: generateId(),
    type: "error",
    operation,
    error: {
      message,
      stack: error?.stack,
      code: error?.name,
    },
    timestamp: Date.now(),
  };
  postMessage(response);
}

// Send progress update
function sendProgress(operation: string, progress: ProgressData): void {
  const response: WorkerResponse = {
    id: generateId(),
    type: "progress",
    operation,
    data: progress,
    timestamp: Date.now(),
  };
  postMessage(response);
}

// Generate unique ID
function generateId(): string {
  return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Update memory metrics
function updateMemoryMetrics(): void {
  const memory = tf.memory();
  workerState.memory.used = memory.numBytes;
  workerState.memory.allocated = memory.numBytes;
  workerState.memory.peak = Math.max(workerState.memory.peak, memory.numBytes);
}

// Update performance metrics
function updateMetrics(success: boolean, processingTime: number): void {
  workerState.metrics.totalOperations++;
  if (success) {
    workerState.metrics.successfulOperations++;
  } else {
    workerState.metrics.failedOperations++;
  }

  // Update average processing time
  const total = workerState.metrics.totalOperations;
  const current =
    workerState.metrics.averageProcessingTime * (total - 1) + processingTime;
  workerState.metrics.averageProcessingTime = current / total;
}

// Load model in worker
async function loadModel(data: ModelLoadData): Promise<void> {
  try {
    sendProgress("load_model", {
      stage: "loading",
      current: 0,
      total: 100,
      message: "Starting model load...",
    });

    let model: any;

    if (data.modelUrl) {
      sendProgress("load_model", {
        stage: "loading",
        current: 25,
        total: 100,
        message: "Fetching model from URL...",
      });

      model = await tf.loadLayersModel(data.modelUrl);
    } else if (data.modelConfig) {
      sendProgress("load_model", {
        stage: "loading",
        current: 50,
        total: 100,
        message: "Creating model from config...",
      });

      model = tf.sequential(data.modelConfig);
    } else {
      throw new Error("No model URL or configuration provided");
    }

    sendProgress("load_model", {
      stage: "loading",
      current: 75,
      total: 100,
      message: "Compiling model...",
    });

    // Compile model if optimizer is provided
    if (data.layerConfig?.optimizer) {
      model.compile(data.layerConfig);
    }

    workerState.models.set(data.modelId, model);
    updateMemoryMetrics();

    sendProgress("load_model", {
      stage: "loading",
      current: 100,
      total: 100,
      message: "Model loaded successfully",
    });

    sendResponse("model_loaded", "load_model", {
      modelId: data.modelId,
      memoryInfo: tf.memory(),
      modelInfo: {
        layers: model.layers.length,
        parameters: model.countParams(),
        inputShape: model.inputs.map((input: any) => input.shape),
        outputShape: model.outputs.map((output: any) => output.shape),
      },
    });
  } catch (error) {
    sendError(
      "load_model",
      `Failed to load model ${data.modelId}`,
      error as Error,
    );
    throw error;
  }
}

// Process NLP operation
async function processOperation(data: ProcessingData): Promise<any> {
  const startTime = performance.now();

  try {
    const { input, modelId, operation, options = {} } = data;

    sendProgress(operation, {
      stage: "preprocessing",
      current: 0,
      total: 100,
      message: "Starting preprocessing...",
    });

    // Preprocessing
    let processedInput: any;
    if (typeof input === "string") {
      processedInput = await preprocessText(input, operation, options);
    } else if (Array.isArray(input)) {
      processedInput = await Promise.all(
        input.map((text) => preprocessText(text, operation, options)),
      );
    } else {
      processedInput = input;
    }

    sendProgress(operation, {
      stage: "inference",
      current: 50,
      total: 100,
      message: "Running model inference...",
    });

    // Model inference
    let result: any;
    if (modelId && workerState.models.has(modelId)) {
      const model = workerState.models.get(modelId);
      result = await runInference(model, processedInput, operation, options);
    } else {
      // Run without model (rule-based or algorithmic processing)
      result = await runAlgorithmicOperation(
        processedInput,
        operation,
        options,
      );
    }

    sendProgress(operation, {
      stage: "postprocessing",
      current: 80,
      total: 100,
      message: "Postprocessing results...",
    });

    // Postprocessing
    const finalResult = await postprocessResult(result, operation, options);

    sendProgress(operation, {
      stage: "complete",
      current: 100,
      total: 100,
      message: "Processing complete",
    });

    const processingTime = performance.now() - startTime;
    updateMetrics(true, processingTime);
    updateMemoryMetrics();

    return finalResult;
  } catch (error) {
    const processingTime = performance.now() - startTime;
    updateMetrics(false, processingTime);
    throw error;
  }
}

// Text preprocessing
async function preprocessText(
  text: string,
  operation: string,
  options: any,
): Promise<any> {
  // Basic preprocessing steps
  let processed = text.toLowerCase().trim();

  // Remove special characters for some operations
  if (options.removeSpecialChars) {
    processed = processed.replace(/[^\w\s]/g, "");
  }

  // Tokenization
  const tokens = processed.split(/\s+/).filter((token) => token.length > 0);

  // Convert to numerical representation
  switch (operation) {
    case "sentiment":
    case "classification":
      return { tokens, text: processed, length: tokens.length };

    case "embedding":
      // Convert to token indices (simplified)
      const vocab = getBasicVocabulary();
      const indices = tokens.map((token) => vocab.get(token) || 0);
      return { indices, tokens, length: indices.length };

    default:
      return { text: processed, tokens };
  }
}

// Model inference
async function runInference(
  model: any,
  input: any,
  operation: string,
  options: any,
): Promise<any> {
  // Convert input to tensor
  let inputTensor: any;

  if (Array.isArray(input)) {
    // Batch processing
    inputTensor = tf.tensor2d(
      input.map(
        (item) => item.indices || [item.length], // Simple feature extraction
      ),
    );
  } else {
    // Single input
    inputTensor = tf.tensor2d([input.indices || [input.length]]);
  }

  try {
    const prediction = await model.predict(inputTensor);
    const result = await prediction.data();

    return Array.from(result);
  } finally {
    inputTensor.dispose();
  }
}

// Algorithmic operations (no ML model)
async function runAlgorithmicOperation(
  input: any,
  operation: string,
  options: any,
): Promise<any> {
  switch (operation) {
    case "sentiment_simple":
      return simpleSentimentAnalysis(input.text || input);

    case "keyword_extraction":
      return extractKeywords(input.text || input, options.maxKeywords || 5);

    case "language_detection":
      return detectLanguage(input.text || input);

    case "text_similarity":
      if (Array.isArray(input) && input.length >= 2) {
        return calculateTextSimilarity(input[0].text, input[1].text);
      }
      throw new Error("Text similarity requires at least 2 texts");

    default:
      throw new Error(`Unknown algorithmic operation: ${operation}`);
  }
}

// Postprocessing
async function postprocessResult(
  result: any,
  operation: string,
  options: any,
): Promise<any> {
  switch (operation) {
    case "sentiment":
    case "classification":
      const scores = Array.isArray(result) ? result : [result];
      const maxIndex = scores.indexOf(Math.max(...scores));
      const labels = options.labels || ["negative", "neutral", "positive"];
      return {
        prediction: labels[maxIndex],
        confidence: scores[maxIndex],
        scores: labels.map((label: string, i: number) => ({
          label,
          score: scores[i],
        })),
      };

    case "embedding":
      return {
        embedding: result,
        dimensions: result.length,
        normalized: normalizeVector(result),
      };

    case "sentiment_simple":
      return result;

    case "keyword_extraction":
      return {
        keywords: result,
        count: result.length,
      };

    case "language_detection":
      return {
        language: result.language,
        confidence: result.confidence,
        supported: true,
      };

    case "text_similarity":
      return {
        similarity: result,
        threshold: options.threshold || 0.5,
        similar: result >= (options.threshold || 0.5),
      };

    default:
      return result;
  }
}

// Simple algorithmic implementations
function simpleSentimentAnalysis(text: string): any {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "disgusting",
    "worst",
  ];

  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter((word) =>
    positiveWords.includes(word),
  ).length;
  const negativeCount = words.filter((word) =>
    negativeWords.includes(word),
  ).length;

  const total = positiveCount + negativeCount;
  if (total === 0) {
    return { sentiment: "neutral", confidence: 0.5, score: 0 };
  }

  const score = (positiveCount - negativeCount) / total;
  let sentiment = "neutral";
  if (score > 0.1) sentiment = "positive";
  else if (score < -0.1) sentiment = "negative";

  return { sentiment, confidence: Math.abs(score), score };
}

function extractKeywords(text: string, maxKeywords: number): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
  ]);

  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    const clean = word.replace(/[^\w]/g, "");
    if (clean.length > 2 && !stopWords.has(clean)) {
      wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
    }
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

function detectLanguage(text: string): any {
  // Simple language detection based on character patterns
  const patterns = {
    en: /^[a-zA-Z\s.,!?'"-]+$/,
    es: /[ñáéíóúü]/i,
    fr: /[àâäçéèêëïîôöùûüÿ]/i,
    de: /[äöüß]/i,
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff]/,
    ar: /[\u0600-\u06ff]/,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      return { language: lang, confidence: 0.8 };
    }
  }

  return { language: "unknown", confidence: 0.1 };
}

function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size; // Jaccard similarity
}

function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => val / norm);
}

function getBasicVocabulary(): Map<string, number> {
  // Simple vocabulary for demonstration
  const vocab = [
    "the",
    "be",
    "to",
    "of",
    "and",
    "a",
    "in",
    "that",
    "have",
    "i",
    "it",
    "for",
    "not",
    "on",
    "with",
    "he",
    "as",
    "you",
    "do",
    "at",
    "this",
    "but",
    "his",
    "by",
    "from",
    "is",
    "was",
    "are",
    "been",
    "or",
    "had",
    "its",
    "an",
    "will",
    "my",
    "would",
    "there",
    "their",
    "what",
    "so",
    "if",
    "about",
    "which",
    "them",
    "can",
    "may",
    "than",
    "when",
    "make",
    "like",
    "how",
    "after",
    "should",
    "our",
    "well",
    "just",
    "any",
    "most",
    "good",
    "new",
    "time",
    "very",
    "only",
    "come",
    "his",
    "old",
    "take",
    "see",
    "way",
    "day",
    "could",
    "go",
    "did",
    "no",
    "work",
    "back",
    "call",
    "even",
    "two",
    "first",
    "may",
    "know",
    "where",
    "get",
    "through",
    "much",
    "before",
    "also",
    "around",
    "right",
    "here",
    "why",
    "things",
    "help",
    "great",
    "tell",
    "try",
    "ask",
    "need",
    "turn",
    "point",
    "became",
    "high",
    "follow",
    "came",
    "week",
    "leave",
    "felt",
    "give",
    "same",
    "found",
    "still",
    "between",
    "both",
    "few",
    "hand",
    "place",
    "such",
    "again",
    "case",
    "big",
    "group",
    "last",
    "important",
    "left",
    "night",
    "next",
    "part",
    "another",
    "begin",
    "while",
    "number",
    "quite",
    "second",
    "enough",
    "along",
    "different",
    "something",
    "still",
    "public",
    "read",
    "already",
    "those",
    "always",
    "show",
    "large",
    "often",
    "school",
    "until",
    "put",
    "keep",
    "family",
    "seem",
    "house",
    "world",
    "sometimes",
    "point",
    "student",
    "government",
    "state",
    "company",
    "possible",
    "head",
    "group",
    "problem",
    "information",
    "service",
    "however",
    "several",
    "word",
    "water",
    "business",
    "system",
    "program",
    "question",
    "play",
    "place",
    "seem",
    "come",
    "think",
    "child",
    "hand",
    "high",
    "use",
    "against",
    "history",
    "party",
    "within",
    "grow",
    "result",
    "open",
    "face",
    "appear",
    "support",
    "turn",
    "reason",
    "hold",
    "money",
    "tell",
    "week",
    "thing",
    "give",
    "year",
    "another",
    "course",
    "feel",
    "three",
    "system",
    "state",
    "number",
    "group",
    "problem",
    "fact",
    "best",
    "so",
    "know",
    "water",
    "seem",
    "call",
    "think",
    "back",
    "case",
    "thing",
    "study",
    "where",
    "job",
    "government",
    "place",
    "work",
    "hour",
    "point",
    "company",
    "help",
    "world",
    "country",
    "school",
    "find",
    "still",
    "over",
    "use",
    "your",
    "said",
    "went",
    "old",
    "number",
    "part",
    "take",
    "end",
    "good",
    "give",
    "same",
    "kind",
    "area",
    "want",
    "right",
    "line",
    "hand",
    "now",
    "little",
    "man",
    "year",
    "than",
    "work",
    "part",
    "again",
    "place",
    "case",
    "week",
    "company",
    "system",
    "each",
    "right",
    "program",
    "hear",
    "question",
    "play",
    "government",
    "run",
    "small",
    "number",
    "night",
    "point",
    "bring",
    "happen",
    "next",
    "carry",
    "help",
    "only",
    "change",
    "move",
    "better",
    "show",
    "family",
    "begin",
    "open",
    "cause",
    "try",
    "once",
    "around",
    "book",
    "eye",
    "job",
    "car",
    "door",
    "look",
    "face",
    "cut",
    "watch",
    "stop",
    "pull",
    "read",
    "actually",
    "lose",
    "turn",
    "leave",
    "write",
    "test",
    "hit",
    "hold",
    "sure",
    "pick",
    "inside",
    "notice",
    "stand",
    "win",
    "wear",
    "throw",
    "wash",
    "sit",
    "lie",
    "fall",
    "cut",
    "push",
    "become",
    "include",
    "continue",
    "develop",
    "watch",
    "remain",
    "allow",
    "remember",
    "follow",
    "support",
    "play",
    "appear",
    "serve",
    "build",
    "stay",
    "reach",
    "kill",
    "meet",
    "send",
    "buy",
    "take",
    "hear",
    "happen",
    "write",
    "provide",
    "sit",
    "stand",
    "lose",
    "pay",
    "meet",
    "include",
    "continue",
    "learn",
    "change",
    "lead",
    "understand",
    "watch",
    "follow",
    "stop",
    "create",
    "speak",
    "read",
    "allow",
    "add",
    "spend",
    "grow",
    "open",
    "walk",
    "win",
    "offer",
    "remember",
    "love",
    "consider",
    "appear",
    "buy",
    "wait",
    "serve",
    "die",
    "send",
    "expect",
    "build",
    "stay",
    "fall",
    "cut",
    "reach",
    "kill",
    "remain",
  ];

  const map = new Map<string, number>();
  vocab.forEach((word, index) => map.set(word, index + 1)); // 0 reserved for unknown
  return map;
}

// Health check
async function healthCheck(): Promise<any> {
  const now = new Date();
  const memory = tf.memory();

  workerState.metrics.lastHealthCheck = now;

  return {
    initialized: workerState.initialized,
    models: Array.from(workerState.models.keys()),
    memory: {
      ...memory,
      peak: workerState.memory.peak,
    },
    metrics: workerState.metrics,
    uptime: now.getTime() - (performance.timeOrigin || 0),
  };
}

// Dispose resources
function dispose(): void {
  // Dispose all models
  for (const [modelId, model] of workerState.models.entries()) {
    try {
      model.dispose();
    } catch (error) {
      console.error(`Error disposing model ${modelId}:`, error);
    }
  }
  workerState.models.clear();

  // Clear memory
  tf.disposeVariables();

  // Reset state
  workerState.initialized = false;
  workerState.memory = { used: 0, allocated: 0, peak: 0 };
}

// Message handler
self.addEventListener("message", async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, operation, data, timestamp } = event.data;

  try {
    switch (type) {
      case "init":
        if (!workerState.initialized) {
          await initializeWorker();
        } else {
          sendResponse("initialized", operation, { alreadyInitialized: true });
        }
        break;

      case "load_model":
        await loadModel(data as ModelLoadData);
        break;

      case "process":
        const startTime = performance.now();
        const result = await processOperation(data as ProcessingData);
        const processingTime = performance.now() - startTime;
        sendResponse("success", operation, result, processingTime);
        break;

      case "health_check":
        const health = await healthCheck();
        sendResponse("success", operation, health);
        break;

      case "dispose":
        dispose();
        sendResponse("disposed", operation);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    sendError(operation, `Operation failed: ${type}`, error as Error);
  }
});

// Handle worker termination
self.addEventListener("close", () => {
  dispose();
});

// Export for type checking
export {};
