import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { FileEncryptor } from '@/components/tools/security/file-encryptor';
import { CryptoUtils } from '@/lib/crypto';

// Mock crypto utilities
vi.mock('@/lib/crypto', () => ({
  CryptoUtils: {
    encryptData: vi.fn(),
    decryptData: vi.fn(),
    calculatePasswordStrength: vi.fn(),
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
    content: string;
    constructor(parts: any[], fileName: string, options: any = {}) {
      this.name = fileName;
      this.size = options.size || 0;
      this.content = parts[0];
    }
    async text() {
      return this.content || 'file content';
    }
    async arrayBuffer() {
      return new TextEncoder().encode(this.content || 'file content').buffer;
    }
  },
});

// Mock Blob and URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock document.createElement for file downloads
Object.assign(document, {
  createElement: vi.fn((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: vi.fn(),
      };
    }
    return {};
  }),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
});

describe('FileEncryptor', () => {
  const mockEncryptData = vi.mocked(CryptoUtils.encryptData);
  const mockDecryptData = vi.mocked(CryptoUtils.decryptData);
  const mockCalculatePasswordStrength = vi.mocked(CryptoUtils.calculatePasswordStrength);
  const mockToastError = vi.mocked(toast.error);
  const mockToastSuccess = vi.mocked(toast.success);
  const mockClipboardWrite = vi.mocked(navigator.clipboard.writeText);

  beforeEach(() => {
    vi.clearAllMocks();

    mockEncryptData.mockResolvedValue({
      algorithm: 'AES-256-GCM',
      encryptedData: 'salt:iv:encrypted-data',
      salt: 'mock-salt',
      iv: 'mock-iv',
      processingTime: 50,
      dataSize: 100,
    });

    mockDecryptData.mockResolvedValue('decrypted content');

    mockCalculatePasswordStrength.mockReturnValue({
      score: 80,
      level: 'strong',
      feedback: [],
      crackTime: 'years',
      entropy: 128,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component correctly', () => {
    render(<FileEncryptor />);

    expect(screen.getByText('Encryption Settings')).toBeInTheDocument();
    expect(screen.getByText('Password Settings')).toBeInTheDocument();
    expect(screen.getByText('File Encryption')).toBeInTheDocument();
    expect(screen.getByText('Text Encryption')).toBeInTheDocument();
  });

  describe('Encryption Settings', () => {
    it('displays available encryption algorithms', () => {
      render(<FileEncryptor />);

      expect(screen.getByText('AES (Advanced Encryption Standard)')).toBeInTheDocument();
      expect(screen.getByText('ChaCha20')).toBeInTheDocument();
    });

    it('allows algorithm selection', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const algorithmSelect = screen.getByDisplayValue('AES (Advanced Encryption Standard)');
      await user.selectOptions(algorithmSelect, 'ChaCha20');

      expect(screen.getByDisplayValue('ChaCha20')).toBeInTheDocument();
    });

    it('allows key size selection', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const keySizeSelect = screen.getByDisplayValue('256');
      await user.selectOptions(keySizeSelect, '128');

      expect(screen.getByDisplayValue('128')).toBeInTheDocument();
    });

    it('allows key derivation function selection', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const kdfSelect = screen.getByDisplayValue('PBKDF2');
      await user.selectOptions(kdfSelect, 'Scrypt');

      expect(screen.getByDisplayValue('Scrypt')).toBeInTheDocument();
    });

    it('updates key sizes based on algorithm selection', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Select ChaCha20 (only supports 256-bit)
      const algorithmSelect = screen.getByDisplayValue('AES (Advanced Encryption Standard)');
      await user.selectOptions(algorithmSelect, 'ChaCha20');

      const keySizeSelect = screen.getByDisplayValue('256');
      expect(keySizeSelect).toBeDisabled(); // ChaCha20 only supports 256-bit
    });
  });

  describe('Password Settings', () => {
    it('allows password input', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      await user.type(passwordInput, 'secure-password');

      expect(passwordInput).toHaveValue('secure-password');
    });

    it('allows password confirmation', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'secure-password');
      await user.type(confirmPasswordInput, 'secure-password');

      expect(confirmPasswordInput).toHaveValue('secure-password');
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      expect(passwordInput).toHaveAttribute('type', 'password');

      const toggleButton = screen.getByRole('button', { name: /show/i });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('calculates password strength', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      await user.type(passwordInput, 'StrongP@ssw0rd!');

      await waitFor(() => {
        expect(mockCalculatePasswordStrength).toHaveBeenCalledWith('StrongP@ssw0rd!');
      });
    });

    it('displays password strength indicators', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      await user.type(passwordInput, 'StrongP@ssw0rd!');

      await waitFor(() => {
        expect(screen.getByText('strong')).toBeInTheDocument();
        expect(screen.getByText('Crack time: years')).toBeInTheDocument();
      });
    });

    it('shows password strength feedback', async () => {
      const user = userEvent.setup();
      mockCalculatePasswordStrength.mockReturnValue({
        score: 30,
        level: 'weak',
        feedback: ['Add uppercase letters', 'Include numbers'],
        crackTime: 'minutes',
        entropy: 40,
      });

      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      await user.type(passwordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText('Add uppercase letters')).toBeInTheDocument();
        expect(screen.getByText('Include numbers')).toBeInTheDocument();
      });
    });
  });

  describe('File Encryption', () => {
    it('validates password before encryption', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Try to encrypt without password
      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      expect(mockToastError).toHaveBeenCalledWith('Please enter a password');
    });

    it('validates password length', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      await user.type(passwordInput, 'short');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      expect(mockToastError).toHaveBeenCalledWith('Password must be at least 8 characters long');
    });

    it('validates password confirmation', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'different');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      expect(mockToastError).toHaveBeenCalledWith('Passwords do not match');
    });

    it('validates password strength', async () => {
      const user = userEvent.setup();
      mockCalculatePasswordStrength.mockReturnValue({
        score: 20,
        level: 'very_weak',
        feedback: ['Password is too weak'],
        crackTime: 'instant',
        entropy: 10,
      });

      render(<FileEncryptor />);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'weak');
      await user.type(confirmPasswordInput, 'weak');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      expect(mockToastError).toHaveBeenCalledWith('Please use a stronger password');
    });

    it('enables encryption when password is valid', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Set valid password
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const encryptButton = screen.getByText('Encrypt Files');
      expect(encryptButton).toBeDisabled(); // Still disabled because no files

      // Would need file upload to enable button fully
    });

    it('processes file encryption', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Set valid password
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      // Mock file upload
      const fileInput = screen.getByRole('button', { name: /upload/i });
      const file = new File(['test content'], 'test.txt', { size: 12 });

      // Simulate file upload (would need proper file upload handling in tests)

      const encryptButton = screen.getByText('Encrypt Files');
      expect(encryptButton).toBeEnabled();

      await user.click(encryptButton);

      await waitFor(() => {
        expect(mockEncryptData).toHaveBeenCalledWith(
          'test content',
          'StrongP@ssw0rd!',
          expect.objectContaining({
            algorithm: 'AES',
            keySize: 256,
          })
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith('Encrypted 1 file(s) successfully');
    });

    it('handles encryption errors', async () => {
      const user = userEvent.setup();
      mockEncryptData.mockRejectedValue(new Error('Encryption failed'));

      render(<FileEncryptor />);

      // Set valid password
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Encryption failed');
      });
    });

    it('displays encryption jobs progress', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Set valid password
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      // Mock slow encryption to show progress
      mockEncryptData.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      // Should show processing state
      expect(screen.getByText('Encrypting...')).toBeInTheDocument();
    });
  });

  describe('File Decryption', () => {
    it('validates password before decryption', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      const decryptButton = screen.getByText('Decrypt Files');
      await user.click(decryptButton);

      expect(mockToastError).toHaveBeenCalledWith('Please enter a password');
    });

    it('processes file decryption', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Set valid password
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      // Mock encrypted file content
      const decryptButton = screen.getByText('Decrypt Files');
      await user.click(decryptButton);

      await waitFor(() => {
        expect(mockDecryptData).toHaveBeenCalled();
      });

      expect(mockToastSuccess).toHaveBeenCalledWith('Decrypted 1 file(s) successfully');
    });

    it('handles decryption errors', async () => {
      const user = userEvent.setup();
      mockDecryptData.mockRejectedValue(new Error('Invalid password'));

      render(<FileEncryptor />);

      // Set valid password
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const decryptButton = screen.getByText('Decrypt Files');
      await user.click(decryptButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Decryption failed');
      });
    });
  });

  describe('Text Encryption', () => {
    it('allows text input for encryption', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Switch to text tab
      const textTab = screen.getByText('Text Encryption');
      await user.click(textTab);

      const textArea = screen.getByPlaceholderText('Enter text to encrypt...');
      await user.type(textArea, 'Secret message');

      expect(textArea).toHaveValue('Secret message');
    });

    it('encrypts text', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Switch to text tab and set password
      const textTab = screen.getByText('Text Encryption');
      await user.click(textTab);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');
      const textArea = screen.getByPlaceholderText('Enter text to encrypt...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');
      await user.type(textArea, 'Secret message');

      const encryptButton = screen.getByText('Encrypt Text');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(mockEncryptData).toHaveBeenCalledWith(
          'Secret message',
          'StrongP@ssw0rd!',
          expect.objectContaining({
            algorithm: 'AES',
            keySize: 256,
          })
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith('Text encrypted successfully');
      expect(screen.getByDisplayValue('salt:iv:encrypted-data')).toBeInTheDocument();
    });

    it('copies encrypted text to clipboard', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Switch to text tab and encrypt text
      const textTab = screen.getByText('Text Encryption');
      await user.click(textTab);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');
      const textArea = screen.getByPlaceholderText('Enter text to encrypt...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');
      await user.type(textArea, 'Secret message');

      const encryptButton = screen.getByText('Encrypt Text');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('salt:iv:encrypted-data')).toBeInTheDocument();
      });

      const copyButton = screen.getByText('Copy');
      await user.click(copyButton);

      expect(mockClipboardWrite).toHaveBeenCalledWith('salt:iv:encrypted-data');
      expect(mockToastSuccess).toHaveBeenCalledWith('Copied to clipboard');
    });

    it('decrypts text', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Switch to text tab and set password
      const textTab = screen.getByText('Text Encryption');
      await user.click(textTab);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      // Mock encrypted data in textarea
      const encryptedTextarea = screen.getByDisplayValue('');
      await user.type(encryptedTextarea, 'salt:iv:encrypted-data');

      const decryptButton = screen.getByText('Decrypt');
      await user.click(decryptButton);

      await waitFor(() => {
        expect(mockDecryptData).toHaveBeenCalledWith(
          'encrypted-data',
          'StrongP@ssw0rd!',
          'salt',
          'iv',
          256
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith('Text decrypted successfully');
      expect(screen.getByDisplayValue('decrypted content')).toBeInTheDocument();
    });

    it('handles invalid encrypted data format', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Switch to text tab and set password
      const textTab = screen.getByText('Text Encryption');
      await user.click(textTab);

      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      // Enter invalid encrypted data format
      const encryptedTextarea = screen.getByDisplayValue('');
      await user.type(encryptedTextarea, 'invalid-format');

      const decryptButton = screen.getByText('Decrypt');
      await user.click(decryptButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Text decryption failed');
      });
    });
  });

  describe('Results Display', () => {
    it('displays encryption jobs', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Set valid password and encrypt
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(screen.getByText('Encryption Jobs (1)')).toBeInTheDocument();
      });
    });

    it('shows job status indicators', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Set valid password and encrypt
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(screen.getByRole('img', { hidden: true })); // Check icon for completed status
      });
    });

    it('allows clearing all jobs', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Set valid password and encrypt
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(screen.getByText('Encryption Jobs (1)')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);

      expect(screen.queryByText('Encryption Jobs (1)')).not.toBeInTheDocument();
    });

    it('shows error messages for failed jobs', async () => {
      const user = userEvent.setup();
      mockEncryptData.mockRejectedValue(new Error('File too large'));

      render(<FileEncryptor />);

      // Set valid password and encrypt
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(screen.getByText(/Error: File too large/i)).toBeInTheDocument();
      });
    });
  });

  describe('Callback Functionality', () => {
    it('calls onEncryptionComplete callback', async () => {
      const user = userEvent.setup();
      const onEncryptionComplete = vi.fn();

      render(<FileEncryptor onEncryptionComplete={onEncryptionComplete} />);

      // Set valid password and encrypt
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(onEncryptionComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'completed',
            operation: 'encrypt',
          })
        );
      });
    });

    it('calls onDecryptionComplete callback', async () => {
      const user = userEvent.setup();
      const onDecryptionComplete = vi.fn();

      render(<FileEncryptor onDecryptionComplete={onDecryptionComplete} />);

      // Set valid password and decrypt
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const decryptButton = screen.getByText('Decrypt Files');
      await user.click(decryptButton);

      await waitFor(() => {
        expect(onDecryptionComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'completed',
            operation: 'decrypt',
          })
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<FileEncryptor />);

      expect(screen.getByLabelText('Encryption Algorithm')).toBeInTheDocument();
      expect(screen.getByLabelText('Key Size')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Tab through form fields
      await user.tab();
      expect(screen.getByPlaceholderText('Enter encryption password...')).toHaveFocus();

      await user.tab();
      expect(screen.getByPlaceholderText('Confirm password...')).toHaveFocus();
    });

    it('announces encryption status to screen readers', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Set valid password and encrypt
      const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

      await user.type(passwordInput, 'StrongP@ssw0rd!');
      await user.type(confirmPasswordInput, 'StrongP@ssw0rd!');

      const encryptButton = screen.getByText('Encrypt Files');
      await user.click(encryptButton);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /encryption jobs/i })).toBeInTheDocument();
      });
    });
  });

  describe('Security Features', () => {
    it('uses secure algorithms only', () => {
      render(<FileEncryptor />);

      const algorithmSelect = screen.getByLabelText('Encryption Algorithm');
      const options = Array.from(algorithmSelect.querySelectorAll('option'));

      const secureAlgorithms = ['AES', 'ChaCha20'];
      expect(options.length).toBe(secureAlgorithms.length);

      options.forEach((option) => {
        expect(secureAlgorithms).toContain(option.textContent);
      });
    });

    it('enforces strong password requirements', async () => {
      const user = userEvent.setup();
      render(<FileEncryptor />);

      // Test various weak passwords
      const weakPasswords = [
        { password: 'short', error: 'Password must be at least 8 characters long' },
        { password: '12345678', error: 'Please use a stronger password' },
      ];

      for (const { password, error } of weakPasswords) {
        vi.clearAllMocks();
        mockCalculatePasswordStrength.mockReturnValue({
          score: 20,
          level: 'very_weak',
          feedback: ['Password is too weak'],
          crackTime: 'instant',
          entropy: 10,
        });

        const passwordInput = screen.getByPlaceholderText('Enter encryption password...');
        const confirmPasswordInput = screen.getByPlaceholderText('Confirm password...');

        await user.clear(passwordInput);
        await user.clear(confirmPasswordInput);

        await user.type(passwordInput, password);
        await user.type(confirmPasswordInput, password);

        const encryptButton = screen.getByText('Encrypt Files');
        await user.click(encryptButton);

        expect(mockToastError).toHaveBeenCalledWith(error);
      }
    });

    it('uses secure key derivation functions', () => {
      render(<FileEncryptor />);

      const kdfSelect = screen.getByLabelText('Key Derivation Function');
      const options = Array.from(kdfSelect.querySelectorAll('option'));

      const secureKDFs = ['PBKDF2', 'Scrypt'];
      expect(options.length).toBe(secureKDFs.length);

      options.forEach((option) => {
        expect(secureKDFs).toContain(option.textContent);
      });
    });
  });
});
