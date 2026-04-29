export interface SchemaWarning {
  path: string;
  message: string;
}

export interface GeneratedSchema {
  schema: unknown;
  warnings: SchemaWarning[];
}

function inferType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function hasMixedTypes(arr: unknown[]): boolean {
  const types = new Set(arr.map(inferType));
  return types.size > 1;
}

function generateSchemaFromValue(path: string, value: unknown, warnings: SchemaWarning[]): unknown {
  if (value === null) {
    return { type: 'null' };
  }

  if (Array.isArray(value)) {
    if (hasMixedTypes(value)) {
      warnings.push({
        path,
        message: 'Mixed types detected in array items. Using multi-type unions is recommended.',
      });
    }
    if (value.length === 0) {
      return { type: 'array' };
    }
    const itemSchema = generateSchemaFromValue(`${path}/items`, value[0], warnings);
    return { type: 'array', items: itemSchema };
  }

  if (typeof value === 'object') {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, propValue] of Object.entries(value)) {
      properties[key] = generateSchemaFromValue(`${path}/${key}`, propValue, warnings);
      if (propValue !== null && propValue !== undefined) {
        required.push(key);
      }
    }
    return {
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    };
  }

  if (typeof value === 'number') {
    return { type: Number.isInteger(value) ? 'integer' : 'number' };
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return { type: typeof value };
  }

  return {};
}

export function generateSchemaFromJson(jsonValue: unknown): GeneratedSchema {
  const warnings: SchemaWarning[] = [];
  const schema = generateSchemaFromValue('#', jsonValue, warnings);
  return { schema, warnings };
}
