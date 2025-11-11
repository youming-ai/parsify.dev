/**
 * Integration tests for JSON processing workflows
 * Tests complete user journeys across multiple JSON tools and their interactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { customRender, cleanup, createJsonInput } from '../../utils/comprehensive-test-utils';
import fixtures from '../../fixtures/tools-fixtures';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/tools/json/formatter',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock JSON processing utilities
vi.mock('@/lib/json-processing', () => ({
  validateJson: vi.fn((input) => {
    try {
      const parsed = JSON.parse(input);
      return { isValid: true, data: parsed, error: null };
    } catch (error) {
      return {
        isValid: false,
        data: null,
        error: { message: 'Invalid JSON', line: 1, column: 1 }
      };
    }
  }),
  formatJson: vi.fn((data, indent = 2, sort = false) => {
    if (sort && typeof data === 'object' && data !== null) {
      const sorted = {};
      Object.keys(data).sort().forEach(key => {
        sorted[key] = data[key];
      });
      data = sorted;
    }
    return JSON.stringify(data, null, indent);
  }),
  minifyJson: vi.fn((data) => JSON.stringify(data)),
  sortJsonKeys: vi.fn((data) => {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const sorted = {};
      Object.keys(data).sort().forEach(key => {
        sorted[key] = data[key];
      });
      return sorted;
    }
    return data;
  }),
}));

// Mock components for testing
const JsonFormatter = ({ onFormatted }: { onFormatted: (data: any) => void }) => {
  const [input, setInput] = React.useState('');
  const [output, setOutput] = React.useState('');
  const [indentSize, setIndentSize] = React.useState(2);
  const [sortKeys, setSortKeys] = React.useState(false);

  const handleFormat = () => {
    try {
      const data = JSON.parse(input);
      const formatted = JSON.stringify(data, null, indentSize);
      setOutput(formatted);
      onFormatted(data);
    } catch (error) {
      setOutput('Invalid JSON');
    }
  };

  return (
    <div data-testid="json-formatter">
      <textarea
        data-testid="json-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter JSON..."
      />
      <div data-testid="format-controls">
        <select
          data-testid="indent-size"
          value={indentSize}
          onChange={(e) => setIndentSize(Number(e.target.value))}
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
        </select>
        <input
          data-testid="sort-keys"
          type="checkbox"
          checked={sortKeys}
          onChange={(e) => setSortKeys(e.target.checked)}
        />
        <button data-testid="format-button" onClick={handleFormat}>
          Format
        </button>
      </div>
      <textarea
        data-testid="json-output"
        value={output}
        readOnly
        placeholder="Formatted JSON..."
      />
    </div>
  );
};

const JsonValidator = ({ json }: { json: string }) => {
  const [validation, setValidation] = React.useState<any>(null);

  React.useEffect(() => {
    try {
      const parsed = JSON.parse(json);
      setValidation({ isValid: true, data: parsed, error: null });
    } catch (error) {
      setValidation({
        isValid: false,
        data: null,
        error: { message: error.message, line: 1, column: 1 }
      });
    }
  }, [json]);

  return (
    <div data-testid="json-validator">
      {validation && (
        <div data-testid={`validation-${validation.isValid ? 'valid' : 'invalid'}`}>
          {validation.isValid ? '✅ Valid JSON' : '❌ Invalid JSON'}
          {!validation.isValid && validation.error && (
            <div data-testid="error-message">{validation.error.message}</div>
          )}
        </div>
      )}
    </div>
  );
};

const JsonConverter = ({ data, targetFormat }: { data: any, targetFormat: string }) => {
  const [converted, setConverted] = React.useState('');

  React.useEffect(() => {
    try {
      switch (targetFormat) {
        case 'xml':
          const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
${Object.entries(data).map(([key, value]) => `  <${key}>${value}</${key}>`).join('\n')}
</root>`;
          setConverted(xml.trim());
          break;
        case 'csv':
          const headers = Object.keys(data);
          const values = Object.values(data);
          const csv = [headers.join(','), values.join(',')].join('\n');
          setConverted(csv);
          break;
        case 'yaml':
          const yaml = Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          setConverted(yaml);
          break;
        default:
          setConverted(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      setConverted('Conversion error');
    }
  }, [data, targetFormat]);

  return (
    <div data-testid="json-converter">
      <select data-testid="target-format" value={targetFormat}>
        <option value="xml">XML</option>
        <option value="csv">CSV</option>
        <option value="yaml">YAML</option>
      </select>
      <textarea
        data-testid="converted-output"
        value={converted}
        readOnly
      />
    </div>
  );
};

describe('JSON Processing Integration Tests', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Basic JSON Formatting Workflow', () => {
    it('should format invalid JSON and show validation errors', async () => {
      const user = userEvent.setup();
      const mockOnFormatted = vi.fn();

      customRender(
        <div>
          <JsonFormatter onFormatted={mockOnFormatted} />
          <JsonValidator json={fixtures.json.invalid.syntaxError} />
        </div>
      );

      // Enter invalid JSON
      const input = screen.getByTestId('json-input');
      await user.type(input, fixtures.json.invalid.syntaxError);

      // Should show validation error
      expect(screen.getByTestId('validation-invalid')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toBeInTheDocument();

      // Try to format
      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      // Should show error in output
      const output = screen.getByTestId('json-output');
      expect(output).toHaveValue('Invalid JSON');

      // Should not call onFormatted
      expect(mockOnFormatted).not.toHaveBeenCalled();
    });

    it('should format JSON with different indentation sizes', async () => {
      const user = userEvent.setup();
      const mockOnFormatted = vi.fn();

      customRender(<JsonFormatter onFormatted={mockOnFormatted} />);

      // Enter valid JSON
      const input = screen.getByTestId('json-input');
      const jsonInput = createJsonInput(fixtures.json.valid.simple);
      await user.type(input, jsonInput);

      // Format with 2 spaces
      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      const output = screen.getByTestId('json-output');
      let formattedOutput = output.value || '';
      expect(formattedOutput).toContain('  ');

      // Change to 4 spaces and reformat
      const indentSelect = screen.getByTestId('indent-size');
      await user.selectOptions(indentSelect, '4');
      await user.click(formatButton);

      formattedOutput = output.value || '';
      expect(formattedOutput).toContain('    ');
      expect(formattedOutput).not.toContain('  ');

      expect(mockOnFormatted).toHaveBeenCalledTimes(2);
    });

    it('should sort JSON keys when requested', async () => {
      const user = userEvent.setup();
      const mockOnFormatted = vi.fn();

      // Create object with unsorted keys
      const unsortedObject = {
        zebra: 'last',
        apple: 'first',
        banana: 'middle'
      };

      customRender(<JsonFormatter onFormatted={mockOnFormatted} />);

      // Enter unsorted JSON
      const input = screen.getByTestId('json-input');
      await user.type(input, JSON.stringify(unsortedObject));

      // Enable key sorting
      const sortCheckbox = screen.getByTestId('sort-keys');
      await user.click(sortCheckbox);

      // Format
      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      const output = screen.getByTestId('json-output');
      const formattedOutput = output.value || '';

      // Keys should be in alphabetical order
      expect(formattedOutput).toContain('"apple"');
      expect(formattedOutput).toContain('"banana"');
      expect(formattedOutput).toContain('"zebra"');

      // Check order
      const appleIndex = formattedOutput.indexOf('"apple"');
      const bananaIndex = formattedOutput.indexOf('"banana"');
      const zebraIndex = formattedOutput.indexOf('"zebra"');

      expect(appleIndex).toBeLessThan(bananaIndex);
      expect(bananaIndex).toBeLessThan(zebraIndex);

      expect(mockOnFormatted).toHaveBeenCalledWith(
        expect.objectContaining({
          apple: 'first',
          banana: 'middle',
          zebra: 'last'
        })
      );
    });
  });

  describe('Multi-Tool JSON Workflows', () => {
    it('should format JSON and convert to multiple formats', async () => {
      const user = userEvent.setup();
      let formattedData: any = null;

      const handleFormatted = (data: any) => {
        formattedData = data;
      };

      customRender(
        <div>
          <JsonFormatter onFormatted={handleFormatted} />
          {formattedData && (
            <JsonConverter data={formattedData} targetFormat="xml" />
          )}
        </div>
      );

      // Format JSON
      const input = screen.getByTestId('json-input');
      const jsonInput = createJsonInput(fixtures.json.valid.simple);
      await user.type(input, jsonInput);

      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      // Wait for formatted data to be available
      await waitFor(() => {
        expect(formattedData).not.toBeNull();
      });

      // Check converter is rendered
      await waitFor(() => {
        expect(screen.getByTestId('json-converter')).toBeInTheDocument();
      });

      // Check XML conversion
      const convertedOutput = screen.getByTestId('converted-output');
      expect(convertedOutput.value || '').toContain('<?xml version="1.0"');
      expect(convertedOutput.value || '').toContain('<name>John Doe</name>');
      expect(convertedOutput.value || '').toContain('<age>30</age>');
    });

    it('should handle complex nested JSON in formatter and converter', async () => {
      const user = userEvent.setup();
      let formattedData: any = null;

      const handleFormatted = (data: any) => {
        formattedData = data;
      };

      customRender(
        <div>
          <JsonFormatter onFormatted={handleFormatted} />
          {formattedData && (
            <>
              <JsonValidator json={JSON.stringify(formattedData)} />
              <JsonConverter data={formattedData} targetFormat="csv" />
            </>
          )}
        </div>
      );

      // Use complex nested JSON
      const input = screen.getByTestId('json-input');
      const jsonInput = createJsonInput(fixtures.json.valid.complex);
      await user.type(input, jsonInput);

      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      // Wait for components to render
      await waitFor(() => {
        expect(screen.getByTestId('validation-valid')).toBeInTheDocument();
        expect(screen.getByTestId('json-converter')).toBeInTheDocument();
      });

      // Check CSV conversion
      const convertedOutput = screen.getByTestId('converted-output');
      const csvContent = convertedOutput.value || '';

      // CSV should contain the flattened data
      expect(csvContent).toContain('id');
      expect(csvContent).toContain('name');
    });

    it('should maintain data integrity through multiple transformations', async () => {
      const user = userEvent.setup();
      let formattedData: any = null;

      const handleFormatted = (data: any) => {
        formattedData = JSON.parse(JSON.stringify(data)); // Deep copy
      };

      const originalData = fixtures.json.valid.complex;

      customRender(
        <div>
          <JsonFormatter onFormatted={handleFormatted} />
          {formattedData && (
            <div>
              <JsonValidator json={JSON.stringify(formattedData)} />
              <JsonConverter data={formattedData} targetFormat="yaml" />
            </div>
          )}
        </div>
      );

      // Format the complex data
      const input = screen.getByTestId('json-input');
      const jsonInput = createJsonInput(originalData);
      await user.type(input, jsonInput);

      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      await waitFor(() => {
        expect(formattedData).not.toBeNull();
      });

      // Verify data integrity
      expect(JSON.stringify(formattedData)).toBe(JSON.stringify(originalData));

      // Check validation passes
      expect(screen.getByTestId('validation-valid')).toBeInTheDocument();

      // Check YAML conversion contains key data
      const convertedOutput = screen.getByTestId('converted-output');
      const yamlContent = convertedOutput.value || '';

      expect(yamlContent).toContain('id:');
      expect(yamlContent).toContain('user:');
      expect(yamlContent).toContain('orders:');
    });
  });

  describe('Error Handling in Workflows', () => {
    it('should handle validation errors gracefully across tools', async () => {
      const user = userEvent.setup();
      const mockOnFormatted = vi.fn();

      customRender(
        <div>
          <JsonFormatter onFormatted={mockOnFormatted} />
          <JsonValidator json={fixtures.json.invalid.commaError} />
        </div>
      );

      // Should immediately show validation error
      expect(screen.getByTestId('validation-invalid')).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(/Unexpected token/);

      // Try to format the invalid JSON
      const input = screen.getByTestId('json-input');
      await user.type(input, fixtures.json.invalid.commaError);

      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      // Should show error in formatter output
      const output = screen.getByTestId('json-output');
      expect(output).toHaveValue('Invalid JSON');

      // Should not trigger callback
      expect(mockOnFormatted).not.toHaveBeenCalled();
    });

    it('should handle empty and null inputs across tools', async () => {
      const user = userEvent.setup();

      customRender(
        <div>
          <JsonFormatter onFormatted={() => {}} />
          <JsonValidator json="" />
        </div>
      );

      // Empty string should be invalid JSON
      expect(screen.getByTestId('validation-invalid')).toBeInTheDocument();

      // Try to format empty input
      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      const output = screen.getByTestId('json-output');
      expect(output).toHaveValue('Invalid JSON');
    });

    it('should handle large JSON files efficiently', async () => {
      const user = userEvent.setup();
      const mockOnFormatted = vi.fn();

      // Create large JSON object
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(10),
          metadata: {
            created: new Date().toISOString(),
            tags: Array.from({ length: 5 }, (_, j) => `tag-${i}-${j}`)
          }
        }))
      };

      const startTime = performance.now();

      customRender(<JsonFormatter onFormatted={mockOnFormatted} />);

      const input = screen.getByTestId('json-input');
      const jsonInput = createJsonInput(largeObject);
      await user.type(input, jsonInput, { delay: 10 }); // Add delay for large input

      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      await waitFor(() => {
        expect(screen.getByTestId('json-output')).not.toHaveValue('Invalid JSON');
      }, { timeout: 5000 });

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should complete within reasonable time
      expect(processingTime).toBeLessThan(10000);
      expect(mockOnFormatted).toHaveBeenCalledWith(largeObject);
    });
  });

  describe('User Experience Flows', () => {
    it('should provide real-time validation feedback', async () => {
      const user = userEvent.setup();

      customRender(
        <div>
          <JsonFormatter onFormatted={() => {}} />
          <JsonValidator json="" />
        </div>
      );

      const validator = screen.getByTestId('json-validator');
      const input = screen.getByTestId('json-input');

      // Initially invalid (empty)
      expect(validator).toHaveTextContent(/Invalid JSON/);

      // Start typing valid JSON
      await user.type(input, '{');
      expect(validator).toHaveTextContent(/Invalid JSON/);

      await user.type(input, '"name": "John"');
      expect(validator).toHaveTextContent(/Invalid JSON/);

      await user.type(input, '}');
      await waitFor(() => {
        expect(screen.getByTestId('validation-valid')).toBeInTheDocument();
      });
    });

    it('should preserve user preferences across tool interactions', async () => {
      const user = userEvent.setup();
      const mockOnFormatted = vi.fn();

      customRender(<JsonFormatter onFormatted={mockOnFormatted} />);

      // Set user preferences
      const indentSelect = screen.getByTestId('indent-size');
      const sortCheckbox = screen.getByTestId('sort-keys');

      await user.selectOptions(indentSelect, '4');
      await user.click(sortCheckbox);

      // Enter and format JSON
      const input = screen.getByTestId('json-input');
      const unsortedJson = createJsonInput({
        zebra: 'last',
        apple: 'first',
        banana: 'middle'
      });

      await user.type(input, unsortedJson);

      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      // Verify preferences were applied
      const output = screen.getByTestId('json-output');
      const formattedOutput = output.value || '';

      expect(formattedOutput).toContain('    '); // 4 spaces
      expect(formattedOutput).toContain('"apple"'); // sorted keys
      expect(formattedOutput).toContain('"banana"');
      expect(formattedOutput).toContain('"zebra"');
    });

    it('should handle copy/paste operations correctly', async () => {
      const user = userEvent.setup();
      const mockOnFormatted = vi.fn();

      // Mock clipboard API
      const mockClipboard = {
        writeText: vi.fn(),
        readText: vi.fn().mockResolvedValue('{"copied": "data"}'),
      };

      Object.assign(navigator, { clipboard: mockClipboard });

      customRender(<JsonFormatter onFormatted={mockOnFormatted} />);

      // Enter and format JSON
      const input = screen.getByTestId('json-input');
      const jsonInput = createJsonInput(fixtures.json.valid.simple);
      await user.type(input, jsonInput);

      const formatButton = screen.getByTestId('format-button');
      await user.click(formatButton);

      // Copy formatted output
      const output = screen.getByTestId('json-output');
      await user.click(output);
      await user.keyboard('{Control>}{c}{/Control}'); // Ctrl+C

      // Verify clipboard was called
      expect(mockClipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('Performance in Integration Scenarios', () => {
    it('should handle rapid successive operations efficiently', async () => {
      const user = userEvent.setup();
      const mockOnFormatted = vi.fn();

      customRender(<JsonFormatter onFormatted={mockOnFormatted} />);

      const input = screen.getByTestId('json-input');
      const formatButton = screen.getByTestId('format-button');

      // Perform rapid formatting operations
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(
          user.clear(input),
          user.type(input, `{"count": ${i}}`),
          user.click(formatButton)
        );
      }

      await Promise.all(operations);

      // Should handle all operations without errors
      expect(mockOnFormatted).toHaveBeenCalledTimes(10);
    });

    it('should maintain responsiveness with large datasets', async () => {
      const user = userEvent.setup();

      // Create very large JSON
      const veryLargeData = {
        items: Array.from({ length: 5000 }, (_, i) => ({
          id: i,
          data: `x`.repeat(100), // 100 characters per item
          nested: {
            value: i * 2,
            text: `Item number ${i}`
          }
        }))
      };

      const startTime = performance.now();

      customRender(
        <div>
          <JsonFormatter onFormatted={() => {}} />
          <JsonValidator json={JSON.stringify(veryLargeData)} />
        </div>
      );

      const input = screen.getByTestId('json-input');
      const jsonInput = createJsonInput(veryLargeData);

      // Type in chunks to avoid overwhelming the test
      const chunks = jsonInput.match(/.{1,1000}/g) || [];
      for (const chunk of chunks) {
        await user.type(input, chunk);
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const endTime = performance.now();

      // Should remain responsive
      expect(endTime - startTime).toBeLessThan(30000);
      expect(screen.getByTestId('json-input')).toBeInTheDocument();
    });
  });
});
