export interface Base64UrlDecodeResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const BASE64URL_RE = /^[A-Za-z0-9_-]*={0,2}$/;

function assertValidBase64Url(input: string): { success: boolean; error?: string } {
  if (!BASE64URL_RE.test(input)) {
    return { success: false, error: 'Invalid Base64URL characters or padding.' };
  }

  const paddingIndex = input.indexOf('=');
  if (paddingIndex !== -1) {
    // Padding must be at the end.
    for (let i = paddingIndex; i < input.length; i++) {
      if (input[i] !== '=') {
        return { success: false, error: 'Invalid Base64URL padding position.' };
      }
    }

    const paddingCount = input.length - paddingIndex;
    if (paddingCount > 2) {
      return { success: false, error: 'Invalid Base64URL padding length.' };
    }

    // If padding is present, total length must be a multiple of 4.
    if (input.length % 4 !== 0) {
      return { success: false, error: 'Invalid Base64URL length with padding.' };
    }
  } else {
    // Without padding, length mod 4 can be 0, 2, or 3. Mod 1 is invalid.
    const mod = input.length % 4;
    if (mod === 1) {
      return { success: false, error: 'Invalid Base64URL length.' };
    }
  }

  return { success: true };
}

function binaryStringToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      binary += String.fromCharCode(byte);
    }
  }
  return binary;
}

function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBase64(base64url: string): Base64UrlDecodeResult<string> {
  const validation = assertValidBase64Url(base64url);
  if (!validation.success) {
    return { success: false, error: validation.error ?? 'Invalid Base64URL input.' };
  }

  let normalized = base64url.replace(/-/g, '+').replace(/_/g, '/');

  // If '=' is present, we already validated length % 4 === 0.
  if (!normalized.includes('=')) {
    const mod = normalized.length % 4;
    if (mod === 2) {
      normalized += '==';
    } else if (mod === 3) {
      normalized += '=';
    }
  }

  return { success: true, data: normalized };
}

function decodeBase64ToBinaryString(base64: string): Base64UrlDecodeResult<string> {
  try {
    return { success: true, data: globalThis.atob(base64) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Base64 decoding failed',
    };
  }
}

function encodeBinaryStringToBase64(binary: string): Base64UrlDecodeResult<string> {
  try {
    return { success: true, data: globalThis.btoa(binary) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Base64 encoding failed',
    };
  }
}

export function encodeBase64Url(input: string | ArrayBuffer | Uint8Array): string {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);

  const binary = bytesToBinaryString(bytes);
  const base64 = encodeBinaryStringToBase64(binary);
  if (!base64.success || base64.data === undefined) {
    throw new Error(base64.error ?? 'Base64 encoding failed');
  }

  return base64ToBase64Url(base64.data);
}

export function decodeBase64UrlToBytes(base64url: string): Base64UrlDecodeResult<Uint8Array> {
  const base64 = base64UrlToBase64(base64url);
  if (!base64.success || base64.data === undefined) {
    return { success: false, error: base64.error ?? 'Invalid Base64URL input.' };
  }

  const decoded = decodeBase64ToBinaryString(base64.data);
  if (!decoded.success || decoded.data === undefined) {
    return { success: false, error: decoded.error ?? 'Base64 decoding failed.' };
  }

  return { success: true, data: binaryStringToBytes(decoded.data) };
}

export function decodeBase64UrlToString(base64url: string): Base64UrlDecodeResult<string> {
  const bytes = decodeBase64UrlToBytes(base64url);
  if (!bytes.success || bytes.data === undefined) {
    return { success: false, error: bytes.error ?? 'Base64URL decoding failed.' };
  }

  try {
    const text = new TextDecoder().decode(bytes.data);
    return { success: true, data: text };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Text decoding failed',
    };
  }
}
