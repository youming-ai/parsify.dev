import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextProcessor, type TextProcessingOptions, type TextProcessingResult } from '@/components/tools/file/text-processor';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  Editor: ({ value, onChange, ...props }: any) => (
    <textarea
      data-testid="code-editor"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      data-language={props.language}
      data-height={props.height}
    />
  ),
}));

// Mock FileUpload component
vi.mock('@/components/file-upload/file-upload', () => ({
  FileUpload: ({ files, onFilesChange, acceptedFormats }: any) => (
    <div data-testid="file-upload">
      <div data-testid="accepted-formats">{acceptedFormats?.join(',')}</div>
      <div data-testid="file-count">{files.length}</div>
      <button
        data-testid="add-file"
        onClick={() => {
          const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
          onFilesChange([...files, mockFile]);
        }}
      >
        Add File
      </button>
    </div>
  ),
}));

// Mock download functionality
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock createElement and appendChild for download
const mockCreateElement = vi.fn();
global.document.createElement = mockCreateElement;

describe('TextProcessor Component', () => {
  const defaultProps = {
    value: '',
    height: 400,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
    mockCreateElement.mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render TextProcessor component with all tabs', () => {
      render(<TextProcessor {...defaultProps} />);

      expect(screen.getByText('Input Text')).toBeInTheDocument();
      expect(screen.getByText('Search & Replace')).toBeInTheDocument();
      expect(screen.getByText('Transform')).toBeInTheDocument();
      expect(screen.getByText('Case')).toBeInTheDocument();
      expect(screen.getByText('Format')).toBeInTheDocument();
    });

    it('should render file upload section', () => {
      render(<TextProcessor {...defaultProps} />);

      expect(screen.getByTestId('file-upload')).toBeInTheDocument();
      expect(screen.getByTestId('accepted-formats')).toBeInTheDocument();
    });

    it('should render code editor for text input', () => {
      render(<TextProcessor {...defaultProps} />);

      const editor = screen.getByTestId('code-editor');
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('data-language', 'javascript');
    });

    it('should render process button', () => {
      render(<TextProcessor {...defaultProps} />);

      expect(screen.getByText('Process Text')).toBeInTheDocument();
    });

    it('should accept custom height prop', () => {
      render(<TextProcessor {...defaultProps} height={600} />);

      const editor = screen.getByTestId('code-editor');
      expect(editor).toHaveAttribute('data-height', '600');
    });

    it('should accept initial value', () => {
      const initialText = 'Hello World';
      render(<TextProcessor {...defaultProps} value={initialText} />);

      const editor = screen.getByTestId('code-editor');
      expect(editor).toHaveValue(initialText);
    });
  });

  describe('Text Input', () => {
    it('should allow typing text in the editor', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} />);

      const editor = screen.getByTestId('code-editor');
      await user.type(editor, 'Hello World');

      expect(editor).toHaveValue('Hello World');
    });

    it('should handle text changes and trigger processing', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} />);

      const editor = screen.getByTestId('code-editor');
      await user.type(editor, 'Test');

      // Wait for debounced processing
      await waitFor(() => {
        expect(screen.getByText('Processed Text')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle large text input', async () => {
      const user = userEvent.setup();
      const largeText = 'A'.repeat(10000);
      render(<TextProcessor {...defaultProps} />);

      const editor = screen.getByTestId('code-editor');

      await act(async () => {
        fireEvent.change(editor, { target: { value: largeText } });
      });

      expect(editor).toHaveValue(largeText);
    });
  });

  describe('Search and Replace Functionality', () => {
    beforeEach(() => {
      render(<TextProcessor {...defaultProps} value="Hello World Hello Test" />);
    });

    it('should switch to search and replace tab', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Search & Replace'));

      expect(screen.getByText('Search Text')).toBeInTheDocument();
      expect(screen.getByText('Replace With')).toBeInTheDocument();
    });

    it('should perform normal search and replace', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Search & Replace'));

      const searchInput = screen.getByPlaceholderText('Text to search for...');
      const replaceInput = screen.getByPlaceholderText('Replacement text...');

      await user.type(searchInput, 'Hello');
      await user.type(replaceInput, 'Hi');

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue(/Hi World Hi Test/);
      });
    });

    it('should handle case sensitive search', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Search & Replace'));

      const searchInput = screen.getByPlaceholderText('Text to search for...');
      const replaceInput = screen.getByPlaceholderText('Replacement text...');

      await user.type(searchInput, 'hello');
      await user.type(replaceInput, 'Hi');

      // Enable case sensitive
      const caseSensitiveToggle = screen.getByText('Case Sensitive');
      await user.click(caseSensitiveToggle);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        // Should not replace "Hello" with "Hi" because case doesn't match
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Hello World Hello Test');
      });
    });

    it('should handle whole word search', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello HelloWorld" />);

      await user.click(screen.getByText('Search & Replace'));

      const searchInput = screen.getByPlaceholderText('Text to search for...');
      const replaceInput = screen.getByPlaceholderText('Replacement text...');

      await user.type(searchInput, 'Hello');
      await user.type(replaceInput, 'Hi');

      // Enable whole word
      const wholeWordToggle = screen.getByText('Whole Word');
      await user.click(wholeWordToggle);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Hi HelloWorld');
      });
    });

    it('should handle regex search and replace', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello 123 World 456 Test" />);

      await user.click(screen.getByText('Search & Replace'));

      const searchInput = screen.getByPlaceholderText('Text to search for...');
      const replaceInput = screen.getByPlaceholderText('Replacement text...');

      await user.type(searchInput, '\\d+');
      await user.type(replaceInput, 'NUM');

      // Enable regex
      const regexToggle = screen.getByText('Use Regex');
      await user.click(regexToggle);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Hello NUM World NUM Test');
      });
    });

    it('should show search statistics', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Search & Replace'));

      const searchInput = screen.getByPlaceholderText('Text to search for...');
      await user.type(searchInput, 'Hello');

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText(/Matches Found:/)).toBeInTheDocument();
        expect(screen.getByText(/Replacements:/)).toBeInTheDocument();
      });
    });
  });

  describe('Text Transformation', () => {
    beforeEach(() => {
      render(<TextProcessor {...defaultProps} value="Hello World" />);
    });

    it('should switch to transform tab', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Transform'));

      expect(screen.getByText('Text Transformation')).toBeInTheDocument();
      expect(screen.getByText('Transform Type')).toBeInTheDocument();
    });

    it('should encode text to base64', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Transform'));

      const transformTypeSelect = screen.getByText('Select transform type');
      await user.click(transformTypeSelect);
      await user.click(screen.getByText('Encode'));

      const encodingSelect = screen.getByText('Select encoding');
      await user.click(encodingSelect);
      await user.click(screen.getByText('Base64'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue(btoa('Hello World'));
      });
    });

    it('should decode text from base64', async () => {
      const user = userEvent.setup();
      const encodedText = btoa('Hello World');
      render(<TextProcessor {...defaultProps} value={encodedText} />);

      await user.click(screen.getByText('Transform'));

      const transformTypeSelect = screen.getByText('Select transform type');
      await user.click(transformTypeSelect);
      await user.click(screen.getByText('Decode'));

      const encodingSelect = screen.getByText('Select encoding');
      await user.click(encodingSelect);
      await user.click(screen.getByText('Base64'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Hello World');
      });
    });

    it('should encode text to URL encoding', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello World! How are you?" />);

      await user.click(screen.getByText('Transform'));

      const transformTypeSelect = screen.getByText('Select transform type');
      await user.click(transformTypeSelect);
      await user.click(screen.getByText('Encode'));

      const encodingSelect = screen.getByText('Select encoding');
      await user.click(encodingSelect);
      await user.click(screen.getByText('URL Encoding'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue(encodeURIComponent('Hello World! How are you?'));
      });
    });

    it('should normalize text', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello   World\n\n\nTest" />);

      await user.click(screen.getByText('Transform'));

      const transformTypeSelect = screen.getByText('Select transform type');
      await user.click(transformTypeSelect);
      await user.click(screen.getByText('Normalize'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Hello World Test');
      });
    });

    it('should format text structure', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Line 1\n\nLine 2\n\n\nLine 3" />);

      await user.click(screen.getByText('Transform'));

      const transformTypeSelect = screen.getByText('Select transform type');
      await user.click(transformTypeSelect);
      await user.click(screen.getByText('Format'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Line 1\n\nLine 2\n\nLine 3');
      });
    });

    it('should handle line ending normalization', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Line 1\r\nLine 2\rLine 3" />);

      await user.click(screen.getByText('Transform'));

      const lineEndingSelect = screen.getByText('Select line ending type');
      await user.click(lineEndingSelect);
      await user.click(screen.getByText('LF (Unix/Linux)'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Line 1\nLine 2\nLine 3');
      });
    });

    it('should trim lines when enabled', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="  Line 1  \n  Line 2  \n  Line 3  " />);

      await user.click(screen.getByText('Transform'));

      const trimLinesToggle = screen.getByText('Trim Lines');
      await user.click(trimLinesToggle);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Line 1\nLine 2\nLine 3');
      });
    });
  });

  describe('Case Conversion', () => {
    beforeEach(() => {
      render(<TextProcessor {...defaultProps} value="hello world test" />);
    });

    it('should switch to case tab', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Case'));

      expect(screen.getByText('Case Conversion')).toBeInTheDocument();
      expect(screen.getByText('Case Type')).toBeInTheDocument();
    });

    it('should convert to uppercase', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('UPPERCASE'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('HELLO WORLD TEST');
      });
    });

    it('should convert to lowercase', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="HELLO WORLD TEST" />);

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('lowercase'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('hello world test');
      });
    });

    it('should convert to title case', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('Title Case'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Hello World Test');
      });
    });

    it('should convert to sentence case', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('Sentence case'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('Hello world test');
      });
    });

    it('should convert to camelCase', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('camelCase'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('helloWorldTest');
      });
    });

    it('should convert to PascalCase', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('PascalCase'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('HelloWorldTest');
      });
    });

    it('should convert to snake_case', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('snake_case'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('hello_world_test');
      });
    });

    it('should convert to kebab-case', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('kebab-case'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('hello-world-test');
      });
    });
  });

  describe('File Upload', () => {
    it('should handle file upload', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} />);

      const addFileButton = screen.getByTestId('add-file');
      await user.click(addFileButton);

      expect(screen.getByTestId('file-count')).toHaveTextContent('1');
    });

    it('should read file content and add to editor', async () => {
      const user = userEvent.setup();
      const fileContent = 'File content test';
      const mockFile = new File([fileContent], 'test.txt', { type: 'text/plain' });

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
        result: fileContent,
      };

      global.FileReader = vi.fn(() => mockFileReader) as any;

      render(<TextProcessor {...defaultProps} />);

      const addFileButton = screen.getByTestId('add-file');
      await user.click(addFileButton);

      // Simulate FileReader onload
      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: fileContent } });
        }
      });

      await waitFor(() => {
        const editor = screen.getByTestId('code-editor');
        expect(editor).toHaveValue(fileContent);
      });
    });

    it('should filter files by accepted formats', () => {
      render(<TextProcessor {...defaultProps} />);

      const acceptedFormats = screen.getByTestId('accepted-formats');
      expect(acceptedFormats).toHaveTextContent('txt,md,csv,json,xml,html,css,js,ts');
    });
  });

  describe('Results Display', () => {
    it('should show processing results', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello World" />);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText('Processed Text')).toBeInTheDocument();
        expect(screen.getByText(/Original Length:/)).toBeInTheDocument();
        expect(screen.getByText(/Processed Length:/)).toBeInTheDocument();
      });
    });

    it('should show error when processing fails', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} />);

      // Trigger an error by using invalid regex
      await user.click(screen.getByText('Search & Replace'));

      const searchInput = screen.getByPlaceholderText('Text to search for...');
      await user.type(searchInput, '[');

      const regexToggle = screen.getByText('Use Regex');
      await user.click(regexToggle);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText(/Processing failed/)).toBeInTheDocument();
      });
    });

    it('should allow downloading processed text', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello World" />);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText('Download Result')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download Result');
      await user.click(downloadButton);

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should allow using processed text as input', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="hello world" />);

      await user.click(screen.getByText('Case'));

      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('UPPERCASE'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText('Use as Input')).toBeInTheDocument();
      });

      const useAsInputButton = screen.getByText('Use as Input');
      await user.click(useAsInputButton);

      const inputEditor = screen.getByTestId('code-editor');
      expect(inputEditor).toHaveValue('HELLO WORLD');
    });
  });

  describe('State Management', () => {
    it('should call onChange callback with processing result', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      render(<TextProcessor {...defaultProps} value="Hello World" onChange={mockOnChange} />);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        const result = mockOnChange.mock.calls[0][0] as TextProcessingResult;
        expect(result.success).toBe(true);
        expect(result.originalText).toBe('Hello World');
        expect(result.processedText).toBeDefined();
        expect(result.stats).toBeDefined();
      });
    });

    it('should maintain options state between tab switches', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} />);

      // Configure search and replace options
      await user.click(screen.getByText('Search & Replace'));

      const searchInput = screen.getByPlaceholderText('Text to search for...');
      await user.type(searchInput, 'test');

      const caseSensitiveToggle = screen.getByText('Case Sensitive');
      await user.click(caseSensitiveToggle);

      // Switch to another tab and come back
      await user.click(screen.getByText('Transform'));
      await user.click(screen.getByText('Search & Replace'));

      // Options should be preserved
      expect(searchInput).toHaveValue('test');
      expect(caseSensitiveToggle).toBeChecked();
    });

    it('should auto-process when text or options change', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello World" />);

      // Change text should trigger auto-processing
      const editor = screen.getByTestId('code-editor');
      await user.clear(editor);
      await user.type(editor, 'New text');

      await waitFor(() => {
        expect(screen.getByText('Processed Text')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<TextProcessor {...defaultProps} />);

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: /input text/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /search & replace/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /transform/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /case/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /format/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} />);

      // Tab navigation
      await user.tab();
      expect(screen.getByRole('tab', { name: /search & replace/i })).toHaveFocus();

      // Arrow key navigation between tabs
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /transform/i })).toHaveFocus();

      // Enter to activate tab
      await user.keyboard('{Enter}');
      expect(screen.getByText('Text Transformation')).toBeInTheDocument();
    });

    it('should have proper form labels', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} />);

      await user.click(screen.getByText('Search & Replace'));

      expect(screen.getByLabelText('Search Text')).toBeInTheDocument();
      expect(screen.getByLabelText('Replace With')).toBeInTheDocument();
    });

    it('should announce changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello World" />);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        // Results section should be visible and accessible
        expect(screen.getByText('Processed Text')).toBeInTheDocument();
        expect(screen.getByText(/Original Length:/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid base64 decode', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Invalid@Base64!!!" />);

      await user.click(screen.getByText('Transform'));

      const transformTypeSelect = screen.getByText('Select transform type');
      await user.click(transformTypeSelect);
      await user.click(screen.getByText('Decode'));

      const encodingSelect = screen.getByText('Select encoding');
      await user.click(encodingSelect);
      await user.click(screen.getByText('Base64'));

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText(/Processing failed/)).toBeInTheDocument();
      });
    });

    it('should handle invalid regex patterns', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Test text" />);

      await user.click(screen.getByText('Search & Replace'));

      const searchInput = screen.getByPlaceholderText('Text to search for...');
      await user.type(searchInput, '[invalid');

      const regexToggle = screen.getByText('Use Regex');
      await user.click(regexToggle);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText(/Processing failed/)).toBeInTheDocument();
      });
    });

    it('should handle empty text gracefully', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="" />);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText('Processed Text')).toBeInTheDocument();
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue('');
      });
    });

    it('should handle very large text', async () => {
      const user = userEvent.setup();
      const largeText = 'A'.repeat(100000);
      render(<TextProcessor {...defaultProps} value={largeText} />);

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText('Processed Text')).toBeInTheDocument();
        const processedEditor = screen.getAllByTestId('code-editor')[1];
        expect(processedEditor).toHaveValue(largeText);
      }, { timeout: 5000 });
    });
  });

  describe('Performance', () => {
    it('should handle rapid input changes without crashing', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} />);

      const editor = screen.getByTestId('code-editor');

      // Simulate rapid typing
      for (let i = 0; i < 50; i++) {
        await act(async () => {
          fireEvent.change(editor, { target: { value: `Test ${i}` } });
        });
      }

      expect(editor).toBeInTheDocument();
    });

    it('should debounce processing to avoid excessive calls', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      render(<TextProcessor {...defaultProps} onChange={mockOnChange} />);

      const editor = screen.getByTestId('code-editor');

      // Type rapidly
      await user.type(editor, 'Hello World');

      // Should not call onChange for every keystroke due to debouncing
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
        // Should be called fewer times than keystrokes due to debouncing
        expect(mockOnChange.mock.calls.length).toBeLessThan(11); // Less than "Hello World" length
      }, { timeout: 1000 });
    });

    it('should maintain performance with multiple operations', async () => {
      const user = userEvent.setup();
      render(<TextProcessor {...defaultProps} value="Hello World" />);

      // Apply multiple operations sequentially
      await user.click(screen.getByText('Case'));
      const caseTypeSelect = screen.getByText('Select case conversion');
      await user.click(caseTypeSelect);
      await user.click(screen.getByText('UPPERCASE'));

      await user.click(screen.getByText('Search & Replace'));
      const searchInput = screen.getByPlaceholderText('Text to search for...');
      await user.type(searchInput, 'HELLO');
      const replaceInput = screen.getByPlaceholderText('Replacement text...');
      await user.type(replaceInput, 'HI');

      await user.click(screen.getByText('Process Text'));

      await waitFor(() => {
        expect(screen.getByText('Processed Text')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
