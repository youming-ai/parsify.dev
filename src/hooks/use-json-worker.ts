'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type JsonWorkerAction = 'parse' | 'stringify' | 'format' | 'minify';

interface JsonWorkerRequest {
  id: number;
  action: JsonWorkerAction;
  payload: string;
}

interface JsonWorkerResponse {
  id: number;
  success: boolean;
  result?: string;
  parsedData?: unknown;
  error?: string;
}

interface ParseJsonResult {
  result: string;
  parsedData: unknown;
}

interface PendingRequest {
  resolve: (response: JsonWorkerResponse) => void;
  reject: (error: Error) => void;
}

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef<Map<number, PendingRequest>>(new Map());
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  useEffect(() => {
    try {
      const worker = new Worker(new URL('../lib/workers/json-worker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent<JsonWorkerResponse>) => {
        const response = event.data;
        const pendingRequest = pendingRequestsRef.current.get(response.id);

        if (!pendingRequest) {
          return;
        }

        pendingRequestsRef.current.delete(response.id);
        pendingRequest.resolve(response);
      };

      worker.onerror = () => {
        setIsWorkerReady(false);
        for (const pending of pendingRequestsRef.current.values()) {
          pending.reject(new Error('JSON worker encountered an error'));
        }
        pendingRequestsRef.current.clear();
      };

      setIsWorkerReady(true);
    } catch {
      setIsWorkerReady(false);
      workerRef.current = null;
    }

    return () => {
      for (const pendingRequest of pendingRequestsRef.current.values()) {
        pendingRequest.reject(new Error('JSON worker was terminated'));
      }
      pendingRequestsRef.current.clear();

      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }

      setIsWorkerReady(false);
    };
  }, []);

  const sendRequest = useCallback(
    (action: JsonWorkerAction, payload: string): Promise<JsonWorkerResponse> => {
      const worker = workerRef.current;

      if (!worker || !isWorkerReady) {
        return Promise.reject(new Error('JSON worker is not ready'));
      }

      const id = requestIdRef.current;
      requestIdRef.current += 1;

      const request: JsonWorkerRequest = {
        id,
        action,
        payload,
      };

      return new Promise<JsonWorkerResponse>((resolve, reject) => {
        pendingRequestsRef.current.set(id, { resolve, reject });
        worker.postMessage(request);
      });
    },
    [isWorkerReady]
  );

  const parseJson = useCallback(
    async (input: string): Promise<ParseJsonResult> => {
      if (isWorkerReady) {
        const response = await sendRequest('parse', input).catch(() => null);
        if (response?.success && typeof response.result === 'string') {
          return {
            result: response.result,
            parsedData: response.parsedData,
          };
        }
      }

      const parsedData = JSON.parse(input);
      return {
        result: JSON.stringify(parsedData),
        parsedData,
      };
    },
    [isWorkerReady, sendRequest]
  );

  const formatJson = useCallback(
    async (input: string): Promise<string> => {
      if (isWorkerReady) {
        const response = await sendRequest('format', input).catch(() => null);
        if (response?.success && typeof response.result === 'string') {
          return response.result;
        }
      }

      return JSON.stringify(JSON.parse(input), null, 2);
    },
    [isWorkerReady, sendRequest]
  );

  const minifyJson = useCallback(
    async (input: string): Promise<string> => {
      if (isWorkerReady) {
        const response = await sendRequest('minify', input).catch(() => null);
        if (response?.success && typeof response.result === 'string') {
          return response.result;
        }
      }

      return JSON.stringify(JSON.parse(input));
    },
    [isWorkerReady, sendRequest]
  );

  return {
    isWorkerReady,
    parseJson,
    formatJson,
    minifyJson,
  };
}
