import { estimateTokens } from '@/lib/llm/text-chunker';

export interface FewShotExample {
  input: string;
  output: string;
}

export interface FewShotInput {
  task: string;
  examples: FewShotExample[];
  style: 'xml' | 'json' | 'markdown' | 'text';
}

export interface FewShotResult {
  prompt: string;
  estimatedTokens: number;
  exampleCount: number;
  recommendation: string;
}

export function renderFewShotPrompt(input: FewShotInput): FewShotResult {
  let prompt: string;
  switch (input.style) {
    case 'xml':
      prompt = `<task>${input.task}</task>\n${input.examples
        .map(
          (ex, i) =>
            `<example id="${i + 1}">\n  <input>${ex.input}</input>\n  <output>${ex.output}</output>\n</example>`
        )
        .join('\n')}`;
      break;
    case 'json':
      prompt = JSON.stringify({ task: input.task, examples: input.examples }, null, 2);
      break;
    case 'markdown':
      prompt = `Task: ${input.task}\n\n${input.examples
        .map((ex, i) => `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n`)
        .join('\n')}`;
      break;
    default:
      prompt = `# Task\n\n${input.task}\n\n${input.examples
        .map(
          (ex, i) => `## Example ${i + 1}\n\n**Input:** ${ex.input}\n\n**Output:** ${ex.output}\n`
        )
        .join('\n')}`;
  }
  return {
    prompt,
    estimatedTokens: estimateTokens(prompt),
    exampleCount: input.examples.length,
    recommendation:
      input.examples.length < 2
        ? 'Add more examples for better accuracy.'
        : input.examples.length > 8
          ? 'Consider reducing examples to avoid overfitting.'
          : 'Looks good.',
  };
}
