export {};

interface JsonWorkerRequest {
  id: number;
  action: 'parse' | 'stringify' | 'format' | 'minify';
  payload: string;
}

interface JsonWorkerResponse {
  id: number;
  success: boolean;
  result?: string;
  parsedData?: unknown;
  error?: string;
}

function buildSuccessResponse(
  id: number,
  result: string,
  parsedData?: unknown
): JsonWorkerResponse {
  return {
    id,
    success: true,
    result,
    parsedData,
  };
}

function buildErrorResponse(id: number, error: string): JsonWorkerResponse {
  return {
    id,
    success: false,
    error,
  };
}

self.onmessage = (event: MessageEvent<JsonWorkerRequest>) => {
  const { id, action, payload } = event.data;

  try {
    if (action === 'parse') {
      const parsed = JSON.parse(payload);
      const response = buildSuccessResponse(id, JSON.stringify(parsed), parsed);
      self.postMessage(response);
      return;
    }

    if (action === 'stringify') {
      const parsed = JSON.parse(payload);
      const response = buildSuccessResponse(id, JSON.stringify(parsed));
      self.postMessage(response);
      return;
    }

    if (action === 'format') {
      const parsed = JSON.parse(payload);
      const response = buildSuccessResponse(id, JSON.stringify(parsed, null, 2));
      self.postMessage(response);
      return;
    }

    if (action === 'minify') {
      const parsed = JSON.parse(payload);
      const response = buildSuccessResponse(id, JSON.stringify(parsed));
      self.postMessage(response);
      return;
    }

    self.postMessage(buildErrorResponse(id, 'Unsupported action'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JSON worker error';
    self.postMessage(buildErrorResponse(id, message));
  }
};
