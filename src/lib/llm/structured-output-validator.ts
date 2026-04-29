export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function stripMarkdownCodeFence(output: string): string {
  const trimmed = output.trim();
  if (trimmed.startsWith('```')) {
    const firstNewline = trimmed.indexOf('\n');
    const lastFence = trimmed.lastIndexOf('```');
    if (firstNewline !== -1 && lastFence > firstNewline) {
      return trimmed.slice(firstNewline + 1, lastFence).trim();
    }
  }
  return trimmed;
}

function validateValue(
  path: string,
  value: unknown,
  schema: unknown,
  errors: ValidationError[]
): void {
  if (typeof schema !== 'object' || schema === null) return;
  const s = schema as Record<string, unknown>;

  if (s['enum'] !== undefined && Array.isArray(s['enum'])) {
    if (!s['enum'].some((ev: unknown) => ev === value)) {
      errors.push({
        path,
        message: `Value must be one of ${JSON.stringify(s['enum'])}`,
      });
    }
    return;
  }

  if (s['type'] !== undefined) {
    const schemaType = s['type'] as string;
    const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;

    if (schemaType === 'integer') {
      if (!Number.isInteger(value)) {
        errors.push({ path, message: `Expected integer, got ${actualType}` });
      }
      return;
    }

    if (schemaType !== actualType) {
      errors.push({ path, message: `Expected ${schemaType}, got ${actualType}` });
      return;
    }
  }

  const schemaType = s['type'] as string | undefined;

  if (schemaType === 'object' && typeof value === 'object' && value !== null) {
    const valueObj = value as Record<string, unknown>;
    const properties = s['properties'] as Record<string, unknown> | undefined;
    const required = s['required'] as string[] | undefined;
    const additionalProperties = s['additionalProperties'];

    if (Array.isArray(required)) {
      for (const key of required) {
        if (!(key in valueObj)) {
          errors.push({ path: `${path}/${key}`, message: `Missing required field "${key}"` });
        }
      }
    }

    if (properties !== undefined) {
      for (const [key, propSchema] of Object.entries(properties)) {
        if (key in valueObj) {
          validateValue(`${path}/${key}`, valueObj[key], propSchema, errors);
        }
      }
    }

    if (additionalProperties === false && properties !== undefined) {
      const allowedKeys = new Set(Object.keys(properties));
      for (const key of Object.keys(valueObj)) {
        if (!allowedKeys.has(key)) {
          errors.push({
            path: `${path}/${key}`,
            message: `Additional property "${key}" is not allowed`,
          });
        }
      }
    }
  }

  if (schemaType === 'array' && Array.isArray(value)) {
    const items = (s['items'] ?? {}) as Record<string, unknown>;
    for (let i = 0; i < value.length; i++) {
      validateValue(`${path}[${i}]`, value[i], items, errors);
    }
  }
}

export function validateStructuredOutput(output: string, schema: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const cleaned = stripMarkdownCodeFence(output);
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    errors.push({ path: '#', message });
    return { valid: false, errors };
  }

  validateValue('#', parsed, schema, errors);
  return { valid: errors.length === 0, errors };
}
