export interface SchemaParameter {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
  required: boolean;
  description: string;
  enumValues?: string;
}

export interface SchemaBuilderInput {
  name: string;
  description: string;
  parameters: SchemaParameter[];
}

export function buildJsonSchema(input: SchemaBuilderInput): Record<string, unknown> {
  const properties: Record<string, Record<string, unknown>> = {};
  const required: string[] = [];
  for (const param of input.parameters) {
    const prop: Record<string, unknown> = {
      type: param.type === 'enum' ? 'string' : param.type,
    };
    if (param.description) prop['description'] = param.description;
    if (param.type === 'enum' && param.enumValues) {
      prop['enum'] = param.enumValues.split(',').map((v) => v.trim());
    }
    properties[param.name] = prop;
    if (param.required) required.push(param.name);
  }
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  };
}

export function buildProviderFormats(input: SchemaBuilderInput) {
  const schema = buildJsonSchema(input);
  return {
    openai: {
      type: 'function',
      function: {
        name: input.name,
        description: input.description,
        parameters: schema,
      },
    },
    anthropic: {
      name: input.name,
      description: input.description,
      input_schema: schema,
    },
    gemini: {
      functionDeclarations: [
        { name: input.name, description: input.description, parameters: schema },
      ],
    },
    mcp: {
      name: input.name,
      description: input.description,
      inputSchema: schema,
      annotations: {},
    },
  };
}
