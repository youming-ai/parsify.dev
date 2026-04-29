export interface NeutralToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export function convertToolSchema(tool: NeutralToolSchema) {
  return {
    openai: {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    },
    anthropic: {
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    },
    gemini: {
      functionDeclarations: [
        {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      ],
    },
    mcp: {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: {},
    },
  };
}
