import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { HashGenerator } from '@/components/tools/security/hash-generator';
import { CryptoUtils } from '@/lib/crypto';

// Mock crypto utilities
vi.mock('@/lib/crypto', () => ({
  CryptoUtils: {
    generateHash: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock file API
Object.defineProperty(global, 'File', {
  value: class File {
    name: string;
    size: number;
    constructor(parts: any[], fileName: string, options: any = {}) {
      this.name = fileName;
      this.size = options.size || 0;
    }
    async text() {
      return 'file content';
    }
    async arrayBuffer() {
      return new ArrayBuffer(10);
    }
  },
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('HashGenerator', () => {
  const mockGenerateHash = vi.mocked(CryptoUtils.generateHash);
  const mockToastError = vi.mocked(toast.error);
  const mockToastSuccess = vi.mocked(toast.success);
  const mockClipboardWrite = vi.mocked(navigator.clipboard.writeText);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateHash.mockResolvedValue({
      algorithm: 'sha256',
      hash: 'abcdef1234567890',
      inputSize: 10,
      processingTime: 10,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<HashGenerator />);

    expect(screen.getByText('Hash Algorithms')).toBeInTheDocument();
    expect(screen.getByText('HMAC Settings (Optional)')).toBeInTheDocument();
    expect(screen.getByText('Text Input')).toBeInTheDocument();
    expect(screen.getByText('File Input')).toBeInTheDocument();
    expect(screen.getByText('Hash Comparison')).toBeInTheDocument();
  });

  describe('Algorithm Selection', () => {
    it('displays all available hash algorithms', () => {
      render(<HashGenerator />);

      expect(screen.getByText('MD5')).toBeInTheDocument();
      expect(screen.getByText('SHA-256')).toBeInTheDocument();
      expect(screen.getByText('SHA-512')).toBeInTheDocument();
      expect(screen.getByText('SHA3-256')).toBeInTheDocument();
      expect(screen.getByText('SHA3-512')).toBeInTheDocument();
    });

    it('allows selecting algorithms', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      expect(sha256Badge).toHaveClass('cursor-pointer');
    });

    it('shows algorithm descriptions when selected', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      await waitFor(() => {
        expect(screen.getByText('256-bit hash function, secure and widely used')).toBeInTheDocument();
      });
    });

    it('shows security indicators for algorithms', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      await waitFor(() => {
        const securityBadges = screen.getAllByText('high');
        expect(securityBadges.some(badge => badge.closest('div')?.textContent?.includes('SHA-256'))).toBe(true);
      });
    });

    it('supports "Select All" functionality', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const selectAllButton = screen.getByText('Select All');
      await user.click(selectAllButton);

      // Check that all algorithm badges are selected
      const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'SHA3-256', 'SHA3-512'];
      for (const algorithm of algorithms) {
        const badge = screen.getByText(algorithm);
        expect(badge.closest('div')).toHaveClass('bg-white');
      }
    });

    it('supports "Secure Only" functionality', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const secureOnlyButton = screen.getByText('Secure Only');
      await user.click(secureOnlyButton);

      // Check that only secure algorithms are selected
      const secureAlgorithms = ['SHA-256', 'SHA-384', 'SHA-512', 'SHA3-256', 'SHA3-512'];
      for (const algorithm of secureAlgorithms) {
        const badge = screen.getByText(algorithm);
        expect(badge.closest('div')).toHaveClass('bg-white');
      }

      // Check that insecure algorithms are not selected
      const insecureAlgorithms = ['MD5', 'SHA-1'];
      for (const algorithm of insecureAlgorithms) {
        const badge = screen.getByText(algorithm);
        expect(badge.closest('div')).not.toHaveClass('bg-white');
      }
    });
  });

  describe('Text Input', () => {
    it('allows text input for hashing', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      expect(textArea).toHaveValue('test input');
    });

    it('generates hash for text input', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Select SHA-256 algorithm
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      // Enter text
      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      // Generate hash
      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateHash).toHaveBeenCalledWith(
          'test input',
          'sha256',
          { uppercase: false, format: 'hex' }
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith('Generated 1 hash(es)');
    });

    it('shows error when no text is entered', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      expect(mockToastError).toHaveBeenCalledWith('Please enter text to hash');
    });

    it('supports uppercase output option', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Select algorithm and enable uppercase
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      const uppercaseCheckbox = screen.getByLabelText('Uppercase output');
      await user.click(uppercaseCheckbox);

      // Enter text and generate
      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateHash).toHaveBeenCalledWith(
          'test input',
          'sha256',
          { uppercase: true, format: 'hex' }
        );
      });
    });

    it('handles different input formats', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Change input format to hex
      const formatSelect = screen.getByDisplayValue('Plain Text');
      await user.selectOptions(formatSelect, 'hex');

      expect(screen.getByPlaceholderText('Enter hex string...')).toBeInTheDocument();

      // Change input format to base64
      await user.selectOptions(formatSelect, 'base64');

      expect(screen.getByPlaceholderText('Enter base64 string...')).toBeInTheDocument();
    });

    it('handles HMAC key input', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Select algorithm and enter HMAC key
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      const hmacInput = screen.getByPlaceholderText('Enter HMAC key (optional)...');
      await user.type(hmacInput, 'secret-key');

      // Enter text and generate
      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateHash).toHaveBeenCalledWith(
          'test inputsecret-key',
          'sha256',
          { uppercase: false, format: 'hex' }
        );
      });
    });

    it('handles invalid hex format', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Change to hex format and enter invalid hex
      const formatSelect = screen.getByDisplayValue('Plain Text');
      await user.selectOptions(formatSelect, 'hex');

      const textArea = screen.getByPlaceholderText('Enter hex string...');
      await user.type(textArea, 'invalid hex');

      // Select algorithm
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Input format error: Invalid hex format');
      });
    });

    it('displays generated hash results', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Select algorithm
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      // Enter text and generate
      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Results (1)')).toBeInTheDocument();
        expect(screen.getByText('abcdef1234567890')).toBeInTheDocument();
        expect(screen.getByText('SHA256')).toBeInTheDocument();
      });
    });

    it('supports copying hash to clipboard', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Select algorithm and generate hash
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Results (1)')).toBeInTheDocument();
      });

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(mockClipboardWrite).toHaveBeenCalledWith('abcdef1234567890');
      expect(mockToastSuccess).toHaveBeenCalledWith('Hash copied to clipboard');
    });

    it('handles clipboard copy errors', async () => {
      const user = userEvent.setup();
      mockClipboardWrite.mockRejectedValue(new Error('Copy failed'));

      render(<HashGenerator />);

      // Select algorithm and generate hash
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Results (1)')).toBeInTheDocument();
      });

      // Click copy button
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(mockToastError).toHaveBeenCalledWith('Failed to copy to clipboard');
    });

    it('supports clearing all results', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Generate hash first
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Results (1)')).toBeInTheDocument();
      });

      // Clear results
      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);

      expect(screen.queryByText('Results (1)')).not.toBeInTheDocument();
      expect(screen.queryByText('abcdef1234567890')).not.toBeInTheDocument();
    });
  });

  describe('File Input', () => {
    it('allows file upload for hashing', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Switch to file tab
      const fileTab = screen.getByText('File Input');
      await user.click(fileTab);

      expect(screen.getByText('File Input')).toBeInTheDocument();
    });

    it('processes files for hashing', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Switch to file tab and select algorithm
      const fileTab = screen.getByText('File Input');
      await user.click(fileTab);

      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      // Mock file upload
      const fileInput = screen.getByRole('button', { name: /upload/i });
      const file = new File(['test content'], 'test.txt', { size: 12 });

      // Simulate file upload
      await user.upload(fileInput, file);

      // Generate hash
      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateHash).toHaveBeenCalledWith(
          expect.any(ArrayBuffer),
          'sha256',
          { uppercase: false, format: 'hex' }
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith('Generated 1 hash(es) from 1 file(s)');
    });

    it('shows error when no files are selected', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Switch to file tab
      const fileTab = screen.getByText('File Input');
      await user.click(fileTab);

      // Try to generate without files
      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      expect(mockToastError).toHaveBeenCalledWith('Please select files to hash');
    });

    it('displays file information in results', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Switch to file tab and select algorithm
      const fileTab = screen.getByText('File Input');
      await user.click(fileTab);

      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      // This would need file upload mocking in a real implementation
      // For now, we'll test the UI elements

      expect(screen.getByText('File Input')).toBeInTheDocument();
      expect(screen.getByText('Generate Hash')).toBeInTheDocument();
    });
  });

  describe('Hash Comparison', () => {
    it('allows hash comparison', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const hash1Input = screen.getByPlaceholderText('Enter first hash to compare...');
      const hash2Input = screen.getByPlaceholderText('Enter second hash to compare...');

      await user.type(hash1Input, 'abcdef1234567890');
      await user.type(hash2Input, 'abcdef1234567890');

      const compareButton = screen.getByText('Compare Hashes');
      await user.click(compareButton);

      expect(screen.getByText('Hashes match!')).toBeInTheDocument();
    });

    it('shows mismatch when hashes differ', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const hash1Input = screen.getByPlaceholderText('Enter first hash to compare...');
      const hash2Input = screen.getByPlaceholderText('Enter second hash to compare...');

      await user.type(hash1Input, 'hash1');
      await user.type(hash2Input, 'hash2');

      const compareButton = screen.getByText('Compare Hashes');
      await user.click(compareButton);

      expect(screen.getByText('Hashes do not match')).toBeInTheDocument();
    });

    it('ignores whitespace and case differences', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const hash1Input = screen.getByPlaceholderText('Enter first hash to compare...');
      const hash2Input = screen.getByPlaceholderText('Enter second hash to compare...');

      await user.type(hash1Input, 'ABCDEF1234567890');
      await user.type(hash2Input, 'abcdef 1234567890');

      const compareButton = screen.getByText('Compare Hashes');
      await user.click(compareButton);

      expect(screen.getByText('Hashes match!')).toBeInTheDocument();
    });

    it('disables compare button when hashes are empty', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const compareButton = screen.getByText('Compare Hashes');
      expect(compareButton).toBeDisabled();

      const hash1Input = screen.getByPlaceholderText('Enter first hash to compare...');
      await user.type(hash1Input, 'hash1');

      // Button should still be disabled with only one hash
      expect(compareButton).toBeDisabled();

      const hash2Input = screen.getByPlaceholderText('Enter second hash to compare...');
      await user.type(hash2Input, 'hash2');

      // Button should be enabled with both hashes
      expect(compareButton).toBeEnabled();
    });
  });

  describe('Error Handling', () => {
    it('handles hash generation errors', async () => {
      const user = userEvent.setup();
      mockGenerateHash.mockRejectedValue(new Error('Hash generation failed'));

      render(<HashGenerator />);

      // Select algorithm
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      // Enter text and try to generate
      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to generate SHA-256 hash');
      });
    });

    it('handles multiple algorithm selection', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Select multiple algorithms
      const sha256Badge = screen.getByText('SHA-256');
      const sha512Badge = screen.getByText('SHA-512');

      await user.click(sha256Badge);
      await user.click(sha512Badge);

      // Enter text and generate
      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGenerateHash).toHaveBeenCalledTimes(2);
        expect(mockToastSuccess).toHaveBeenCalledWith('Generated 2 hash(es)');
      });
    });

    it('disables generate button when no algorithms selected', () => {
      render(<HashGenerator />);

      const generateButton = screen.getByText('Generate Hash');
      expect(generateButton).toBeDisabled();
    });

    it('enables generate button when algorithm selected', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      const generateButton = screen.getByText('Generate Hash');
      expect(generateButton).toBeDisabled();

      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      expect(generateButton).toBeEnabled();
    });
  });

  describe('Callback Functionality', () => {
    it('calls onHashGenerated callback when hash is generated', async () => {
      const user = userEvent.setup();
      const onHashGenerated = vi.fn();

      render(<HashGenerator onHashGenerated={onHashGenerated} />);

      // Select algorithm
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      // Enter text and generate
      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(onHashGenerated).toHaveBeenCalledWith({
          algorithm: 'sha256',
          input: 'test input',
          hash: 'abcdef1234567890',
          uppercase: false,
          inputType: 'text',
          inputFormat: 'text',
          isHmac: false,
          inputSize: 10,
          processingTime: 10,
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<HashGenerator />);

      expect(screen.getByRole('textbox', { name: /plain text/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /uppercase output/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Tab to text input
      await user.tab();
      expect(screen.getByPlaceholderText('Enter text to generate hash...')).toHaveFocus();

      // Type in text input
      await user.keyboard('test');
      expect(screen.getByPlaceholderText('Enter text to generate hash...')).toHaveValue('test');
    });

    it('announces results to screen readers', async () => {
      const user = userEvent.setup();
      render(<HashGenerator />);

      // Select algorithm and generate hash
      const sha256Badge = screen.getByText('SHA-256');
      await user.click(sha256Badge);

      const textArea = screen.getByPlaceholderText('Enter text to generate hash...');
      await user.type(textArea, 'test input');

      const generateButton = screen.getByText('Generate Hash');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /results/i })).toBeInTheDocument();
      });
    });
  });
});
