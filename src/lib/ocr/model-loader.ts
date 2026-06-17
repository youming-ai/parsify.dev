import * as ort from 'onnxruntime-web';
import { logger } from '~/lib/logger';

export type ModelName = 'det' | 'cls' | 'rec';

const MODEL_FILES: Record<ModelName, string> = {
  det: 'det.onnx',
  cls: 'cls.onnx',
  rec: 'rec.onnx',
};

const DB_NAME = 'parsify-ocr-models';
const DB_VERSION = 1;
const STORE_NAME = 'models';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getCachedModel(name: ModelName): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(name);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function setCachedModel(name: ModelName, data: ArrayBuffer): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data, name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function fetchModel(
  name: ModelName,
  baseUrl: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  const url = `${baseUrl}/${MODEL_FILES[name]}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch model ${name}: ${response.status} ${response.statusText}`);
  }

  const contentLength = Number(response.headers.get('content-length') ?? '0');
  const reader = response.body?.getReader();
  if (!reader) {
    return await response.arrayBuffer();
  }

  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, contentLength);
  }

  const total = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}

export interface LoadedModels {
  det: ort.InferenceSession;
  cls: ort.InferenceSession;
  rec: ort.InferenceSession;
}

/**
 * Load all three PP-OCRv6 models. Checks IndexedDB cache first,
 * falls back to network fetch. Caches after download.
 */
export async function loadModels(
  baseUrl = '/models/pp-ocrv6-tiny',
  onModelLoaded?: (name: ModelName, fromCache: boolean) => void
): Promise<LoadedModels> {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = '/ort/';

  const loadOne = async (name: ModelName): Promise<ort.InferenceSession> => {
    let buffer = await getCachedModel(name);
    const fromCache = buffer !== null;

    if (!buffer) {
      logger.info(`Downloading model: ${name}`);
      buffer = await fetchModel(name, baseUrl);
      await setCachedModel(name, buffer);
      logger.info(`Cached model: ${name} (${(buffer.byteLength / 1024).toFixed(1)}KB)`);
    } else {
      logger.info(`Loaded model from cache: ${name}`);
    }

    onModelLoaded?.(name, fromCache);

    const session = await ort.InferenceSession.create(buffer, {
      executionProviders: ['wasm'],
    });

    return session;
  };

  const [det, cls, rec] = await Promise.all([loadOne('det'), loadOne('cls'), loadOne('rec')]);

  return { det, cls, rec };
}
