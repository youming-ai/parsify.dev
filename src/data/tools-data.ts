export type Tool = {
  id: string;
  name: string;
  description: string;
  path: string;
};

export const TOOLS: Tool[] = [
  {
    id: 'url-agent',
    name: 'URL → Markdown → Agent',
    description:
      'Paste a URL. We fetch it with curl.md to produce LLM-optimized markdown, then run a Zhipu GLM agent on it. See token & cost savings vs. raw HTML.',
    path: '/',
  },
];
