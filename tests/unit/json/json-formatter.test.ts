import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JSONFormatter } from '@/components/tools/json/json-formatter';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('JSONFormatter', () => {
  const mockJsonData = JSON.stringify({ name: 'test', value: 123 }, null, 2);

  beforeEach(() => {
    render(<JSONFormatter jsonData={mockJsonData} />);
  });

  it('renders the JSON formatter component', () => {
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  it('displays initial JSON data', () => {
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toHaveValue(mockJsonData);
  });

  it('formats JSON when format button is clicked', async () => {
    const formatButton = screen.getByText('Format');
    const editor = screen.getByTestId('monaco-editor');

    // Set unformatted JSON
    fireEvent.change(editor, { target: { value: '{"name":"test","value":123}' } });

    await fireEvent.click(formatButton);

    expect(editor).toHaveValue(mockJsonData);
  });

  it('minifies JSON when minify button is clicked', async () => {
    const minifyButton = screen.getByText('Minify');
    const editor = screen.getByTestId('monaco-editor');

    await fireEvent.click(minifyButton);

    expect(editor).toHaveValue('{"name":"test","value":123}');
  });
});
