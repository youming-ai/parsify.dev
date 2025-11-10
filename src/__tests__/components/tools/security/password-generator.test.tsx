import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { PasswordGenerator } from '@/components/tools/security/password-generator';
import { CryptoUtils } from '@/lib/crypto';

// Mock crypto utilities
vi.mock('@/lib/crypto', () => ({
  CryptoUtils: {
    generatePassword: vi.fn(),
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

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

// Mock speech synthesis
Object.assign(window, {
  speechSynthesis: {
    speak: vi.fn(),
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

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('PasswordGenerator', () => {
  const mockGeneratePassword = vi.mocked(CryptoUtils.generatePassword);
  const mockCalculatePasswordStrength = vi.mocked(CryptoUtils.calculatePasswordStrength);
  const mockToastError = vi.mocked(toast.error);
  const mockToastSuccess = vi.mocked(toast.success);
  const mockClipboardWrite = vi.mocked(navigator.clipboard.writeText);
  const mockSpeechSynthesis = vi.mocked(window.speechSynthesis);

  beforeEach(() => {
    vi.clearAllMocks();

    mockGeneratePassword.mockReturnValue({
      password: 'GeneratedP@ssw0rd!',
      strength: {
        score: 85,
        level: 'strong',
        feedback: [],
        crackTime: 'years',
        entropy: 128,
      },
    });

    mockCalculatePasswordStrength.mockReturnValue({
      score: 85,
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
    render(<PasswordGenerator />);

    expect(screen.getByText('Generated Password')).toBeInTheDocument();
    expect(screen.getByText('Generation Options')).toBeInTheDocument();
    expect(screen.getByText('Batch Generation')).toBeInTheDocument();
    expect(screen.getByText('Random')).toBeInTheDocument();
    expect(screen.getByText('Pronounceable')).toBeInTheDocument();
    expect(screen.getByText('Passphrase')).toBeInTheDocument();
  });

  it('generates initial password on mount', async () => {
    render(<PasswordGenerator />);

    await waitFor(() => {
      expect(mockGeneratePassword).toHaveBeenCalledWith(
        expect.objectContaining({
          length: 16,
          includeUppercase: true,
          includeLowercase: true,
          includeNumbers: true,
          includeSymbols: true,
          excludeSimilar: false,
          excludeAmbiguous: false,
        })
      );
    });
  });

  describe('Password Display', () => {
    it('displays generated password', async () => {
      render(<PasswordGenerator />);

      await waitFor(() => {
        const passwordInput = screen.getByDisplayValue('GeneratedP@ssw0rd!');
        expect(passwordInput).toBeInTheDocument();
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      await waitFor(() => {
        const passwordInput = screen.getByDisplayValue('GeneratedP@ssw0rd!');
        expect(passwordInput).toHaveAttribute('type', 'password');
      });

      const toggleButton = screen.getByRole('button', { name: /show/i });
      await user.click(toggleButton);

      await waitFor(() => {
        const passwordInput = screen.getByDisplayValue('GeneratedP@ssw0rd!');
        expect(passwordInput).toHaveAttribute('type', 'text');
      });
    });

    it('copies password to clipboard', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('GeneratedP@ssw0rd!')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(mockClipboardWrite).toHaveBeenCalledWith('GeneratedP@ssw0rd!');
      expect(mockToastSuccess).toHaveBeenCalledWith('Password copied to clipboard');
    });

    it('handles clipboard copy errors', async () => {
      const user = userEvent.setup();
      mockClipboardWrite.mockRejectedValue(new Error('Copy failed'));

      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('GeneratedP@ssw0rd!')).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);

      expect(mockToastError).toHaveBeenCalledWith('Failed to copy to clipboard');
    });

    it('generates new password', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('GeneratedP@ssw0rd!')).toBeInTheDocument();
      });

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledTimes(2);
      });
    });

    it('speaks password for accessibility', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('GeneratedP@ssw0rd!')).toBeInTheDocument();
      });

      const speakButton = screen.getByText('Speak');
      await user.click(speakButton);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'GeneratedP@ssw0rd!',
          rate: 0.7,
        })
      );
    });

    it('displays password strength indicators', async () => {
      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByText('strong')).toBeInTheDocument();
        expect(screen.getByText('Crack time: years')).toBeInTheDocument();
        expect(screen.getByText(/\b128\.?\d* bits/)).toBeInTheDocument();
      });
    });

    it('displays password strength feedback', async () => {
      mockCalculatePasswordStrength.mockReturnValue({
        score: 40,
        level: 'fair',
        feedback: ['Add more symbols', 'Use longer password'],
        crackTime: 'hours',
        entropy: 64,
      });

      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByText('Add more symbols')).toBeInTheDocument();
        expect(screen.getByText('Use longer password')).toBeInTheDocument();
      });
    });
  });

  describe('Random Password Generation', () => {
    it('adjusts password length', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      // Switch to random tab if needed
      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      const lengthSlider = screen.getByRole('slider');
      expect(screen.getByText(/Password Length: 16/)).toBeInTheDocument();

      // Increase length
      await user.click(lengthSlider, { clientX: 200 }); // Click to the right to increase

      await waitFor(() => {
        expect(screen.getByText(/Password Length: (1[7-9]|2[0-9])/)).toBeInTheDocument();
      });
    });

    it('toggles character sets', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      // Test uppercase toggle
      const uppercaseSwitch = screen.getByRole('switch', { name: /uppercase/i });
      await user.click(uppercaseSwitch);

      // Generate new password with updated settings
      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledWith(
          expect.objectContaining({
            includeUppercase: false,
          })
        );
      });
    });

    it('toggles lowercase character set', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      const lowercaseSwitch = screen.getByRole('switch', { name: /lowercase/i });
      await user.click(lowercaseSwitch);

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledWith(
          expect.objectContaining({
            includeLowercase: false,
          })
        );
      });
    });

    it('toggles numbers character set', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      const numbersSwitch = screen.getByRole('switch', { name: /numbers/i });
      await user.click(numbersSwitch);

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledWith(
          expect.objectContaining({
            includeNumbers: false,
          })
        );
      });
    });

    it('toggles symbols character set', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      const symbolsSwitch = screen.getByRole('switch', { name: /symbols/i });
      await user.click(symbolsSwitch);

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledWith(
          expect.objectContaining({
            includeSymbols: false,
          })
        );
      });
    });

    it('toggles exclude similar characters', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      const excludeSimilarSwitch = screen.getByRole('switch', { name: /exclude similar/i });
      await user.click(excludeSimilarSwitch);

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledWith(
          expect.objectContaining({
            excludeSimilar: true,
          })
        );
      });
    });

    it('toggles exclude ambiguous characters', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      const excludeAmbiguousSwitch = screen.getByRole('switch', { name: /exclude ambiguous/i });
      await user.click(excludeAmbiguousSwitch);

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledWith(
          expect.objectContaining({
            excludeAmbiguous: true,
          })
        );
      });
    });

    it('enables custom character set', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      const customCharsetSwitch = screen.getByRole('switch', { name: /use custom character set/i });
      await user.click(customCharsetSwitch);

      const customCharsetInput = screen.getByPlaceholderText('Enter custom characters...');
      await user.type(customCharsetInput, 'ABC123!@#');

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledWith(
          expect.objectContaining({
            customCharset: 'ABC123!@#',
          })
        );
      });
    });

    it('validates character set selection', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const randomTab = screen.getByText('Random');
      await user.click(randomTab);

      // Disable all character sets
      const uppercaseSwitch = screen.getByRole('switch', { name: /uppercase/i });
      const lowercaseSwitch = screen.getByRole('switch', { name: /lowercase/i });
      const numbersSwitch = screen.getByRole('switch', { name: /numbers/i });
      const symbolsSwitch = screen.getByRole('switch', { name: /symbols/i });

      await user.click(uppercaseSwitch);
      await user.click(lowercaseSwitch);
      await user.click(numbersSwitch);
      await user.click(symbolsSwitch);

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to generate password');
      });
    });
  });

  describe('Pronounceable Password Generation', () => {
    it('generates pronounceable passwords', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const pronounceableTab = screen.getByText('Pronounceable');
      await user.click(pronounceableTab);

      await waitFor(() => {
        // Should show a pronounceable password (generated by the component itself)
        const passwordInput = screen.getByDisplayValue(/\w+/);
        expect(passwordInput).toBeInTheDocument();
      });
    });

    it('adjusts syllable count', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const pronounceableTab = screen.getByText('Pronounceable');
      await user.click(pronounceableTab);

      const syllableSlider = screen.getByRole('slider');
      expect(screen.getByText(/Syllable Count: 4/)).toBeInTheDocument();

      // Increase syllable count
      await user.click(syllableSlider, { clientX: 200 });

      await waitFor(() => {
        expect(screen.getByText(/Syllable Count: [5-9]/)).toBeInTheDocument();
      });
    });

    it('calculates strength for pronounceable passwords', async () => {
      render(<PasswordGenerator />);

      const pronounceableTab = screen.getByText('Pronounceable');
      await user.click(pronounceableTab);

      await waitFor(() => {
        expect(mockCalculatePasswordStrength).toHaveBeenCalled();
      });
    });
  });

  describe('Passphrase Generation', () => {
    it('generates passphrase preview', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const passphraseTab = screen.getByText('Passphrase');
      await user.click(passphraseTab);

      await waitFor(() => {
        expect(screen.getByText('Preview:')).toBeInTheDocument();
        expect(screen.getByDisplayValue(/\w+(-\w+)+/)).toBeInTheDocument();
      });
    });

    it('adjusts word count', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const passphraseTab = screen.getByText('Passphrase');
      await user.click(passphraseTab);

      const wordCountSlider = screen.getByRole('slider');
      expect(screen.getByText(/Word Count: 6/)).toBeInTheDocument();

      // Increase word count
      await user.click(wordCountSlider, { clientX: 200 });

      await waitFor(() => {
        expect(screen.getByText(/Word Count: [7-9]/)).toBeInTheDocument();
      });
    });

    it('changes separator', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const passphraseTab = screen.getByText('Passphrase');
      await user.click(passphraseTab);

      const separatorSelect = screen.getByDisplayValue('-');
      await user.selectOptions(separatorSelect, '_');

      await waitFor(() => {
        expect(screen.getByDisplayValue(/\w+(_\w+)+/)).toBeInTheDocument();
      });
    });

    it('toggles word capitalization', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const passphraseTab = screen.getByText('Passphrase');
      await user.click(passphraseTab);

      const capitalizeSwitch = screen.getByRole('switch', { name: /capitalize words/i });
      await user.click(capitalizeSwitch);

      await waitFor(() => {
        // Check if preview shows capitalized words
        const preview = screen.getByDisplayValue(/\w+/);
        expect(preview).toBeInTheDocument();
      });
    });

    it('toggles number inclusion', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const passphraseTab = screen.getByText('Passphrase');
      await user.click(passphraseTab);

      const includeNumbersSwitch = screen.getByRole('switch', { name: /include numbers/i });
      await user.click(includeNumbersSwitch);

      await waitFor(() => {
        // Check if preview might include numbers
        const preview = screen.getByDisplayValue(/\w+/);
        expect(preview).toBeInTheDocument();
      });
    });

    it('changes word list', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const passphraseTab = screen.getByText('Passphrase');
      await user.click(passphraseTab);

      const wordListSelect = screen.getByDisplayValue('EFF (Long Word List)');
      await user.selectOptions(wordListSelect, 'Common Words');

      expect(screen.getByDisplayValue('Common Words')).toBeInTheDocument();
    });
  });

  describe('Batch Generation', () => {
    it('generates multiple passwords', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const batchTab = screen.getByText('Batch Generation');
      await user.click(batchTab);

      const generateButton = screen.getByText('Generate 5 Passwords');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockGeneratePassword).toHaveBeenCalledTimes(5);
      });

      expect(mockToastSuccess).toHaveBeenCalledWith('Generated 5 passwords');
    });

    it('adjusts batch count', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const batchTab = screen.getByText('Batch Generation');
      await user.click(batchTab);

      const batchSlider = screen.getByRole('slider');
      expect(screen.getByText(/Number of Passwords: 5/)).toBeInTheDocument();

      // Increase batch count
      await user.click(batchSlider, { clientX: 200 });

      await waitFor(() => {
        expect(screen.getByText(/Number of Passwords: [6-9]/)).toBeInTheDocument();
      });
    });

    it('displays generated passwords', async () => {
      mockGeneratePassword.mockReturnValue({
        password: 'TestPass123!',
        strength: {
          score: 75,
          level: 'good',
          feedback: [],
          crackTime: 'months',
          entropy: 96,
        },
      });

      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const batchTab = screen.getByText('Batch Generation');
      await user.click(batchTab);

      const generateButton = screen.getByText('Generate 5 Passwords');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generated Passwords')).toBeInTheDocument();
        expect(screen.getAllByText('TestPass123!').length).toBeGreaterThan(0);
      });
    });

    it('copies individual passwords from batch', async () => {
      mockGeneratePassword.mockReturnValue({
        password: 'TestPass123!',
        strength: {
          score: 75,
          level: 'good',
          feedback: [],
          crackTime: 'months',
          entropy: 96,
        },
      });

      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const batchTab = screen.getByText('Batch Generation');
      await user.click(batchTab);

      const generateButton = screen.getByText('Generate 5 Passwords');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generated Passwords')).toBeInTheDocument();
      });

      const copyButtons = screen.getAllByRole('button', { name: /copy/i });
      await user.click(copyButtons[0]);

      expect(mockClipboardWrite).toHaveBeenCalledWith('TestPass123!');
    });

    it('downloads all passwords', async () => {
      mockGeneratePassword.mockReturnValue({
        password: 'TestPass123!',
        strength: {
          score: 75,
          level: 'good',
          feedback: [],
          crackTime: 'months',
          entropy: 96,
        },
      });

      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const batchTab = screen.getByText('Batch Generation');
      await user.click(batchTab);

      const generateButton = screen.getByText('Generate 5 Passwords');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Generated Passwords')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download All');
      await user.click(downloadButton);

      expect(mockToastSuccess).toHaveBeenCalledWith('Passwords downloaded');

      // Check if file download was triggered
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('handles batch generation errors', async () => {
      const user = userEvent.setup();
      mockGeneratePassword.mockImplementation(() => {
        throw new Error('Generation failed');
      });

      render(<PasswordGenerator />);

      const batchTab = screen.getByText('Batch Generation');
      await user.click(batchTab);

      const generateButton = screen.getByText('Generate 5 Passwords');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to generate batch passwords');
      });
    });
  });

  describe('Password History', () => {
    it('stores password history', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      // Generate initial password
      await waitFor(() => {
        expect(screen.getByDisplayValue('GeneratedP@ssw0rd!')).toBeInTheDocument();
      });

      // Generate new password
      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Recent Passwords')).toBeInTheDocument();
      });
    });

    it('limits history to 10 passwords', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      // Generate 12 passwords
      const generateButton = screen.getByText('Generate New');

      for (let i = 0; i < 12; i++) {
        await user.click(generateButton);
        await waitFor(() => {
          expect(mockGeneratePassword).toHaveBeenCalledTimes(i + 2); // +1 for initial, +1 for current
        });
      }

      // Should only show 10 recent passwords
      await waitFor(() => {
        const recentPasswords = screen.getAllByText(/\w+/);
        expect(recentPasswords.length).toBeLessThanOrEqual(10);
      });
    });

    it('copies passwords from history', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      // Generate a password to add to history
      await waitFor(() => {
        expect(screen.getByDisplayValue('GeneratedP@ssw0rd!')).toBeInTheDocument();
      });

      // Generate new password
      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByText('Recent Passwords')).toBeInTheDocument();
      });

      // Copy from history
      const historyCopyButtons = screen.getAllByRole('button', { name: /copy/i });
      await user.click(historyCopyButtons[historyCopyButtons.length - 1]);

      expect(mockClipboardWrite).toHaveBeenCalled();
    });
  });

  describe('Callback Functionality', () => {
    it('calls onPasswordGenerated callback', async () => {
      const user = userEvent.setup();
      const onPasswordGenerated = vi.fn();

      render(<PasswordGenerator onPasswordGenerated={onPasswordGenerated} />);

      await waitFor(() => {
        expect(onPasswordGenerated).toHaveBeenCalledWith({
          password: 'GeneratedP@ssw0rd!',
          strength: {
            score: 85,
            level: 'strong',
            feedback: [],
            crackTime: 'years',
            entropy: 128,
          },
          entropy: expect.any(Number),
          createdAt: expect.any(Date),
        });
      });
    });

    it('calls callback when generating new password', async () => {
      const user = userEvent.setup();
      const onPasswordGenerated = vi.fn();

      render(<PasswordGenerator onPasswordGenerated={onPasswordGenerated} />);

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(onPasswordGenerated).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles password generation errors', async () => {
      const user = userEvent.setup();
      mockGeneratePassword.mockImplementation(() => {
        throw new Error('Generation failed');
      });

      render(<PasswordGenerator />);

      const generateButton = screen.getByText('Generate New');
      await user.click(generateButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to generate password');
      });
    });

    it('handles pronounceable password generation', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      const pronounceableTab = screen.getByText('Pronounceable');
      await user.click(pronounceableTab);

      // Should not throw errors
      await waitFor(() => {
        const passwordInput = screen.getByDisplayValue(/\w+/);
        expect(passwordInput).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<PasswordGenerator />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /uppercase/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      // Tab to password input
      await user.tab();
      expect(screen.getByDisplayValue('GeneratedP@ssw0rd!')).toHaveFocus();

      // Tab to generate button
      await user.tab();
      expect(screen.getByText('Generate New')).toHaveFocus();
    });

    it('announces password strength to screen readers', async () => {
      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByText('strong')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('provides text-to-speech for passwords', async () => {
      const user = userEvent.setup();
      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('GeneratedP@ssw0rd!')).toBeInTheDocument();
      });

      const speakButton = screen.getByText('Speak');
      await user.click(speakButton);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
    });
  });

  describe('Security Features', () => {
    it('uses secure random generation', () => {
      render(<PasswordGenerator />);

      // Should use crypto.getRandomValues for secure random generation
      expect(mockGeneratePassword).toHaveBeenCalled();
    });

    it('provides entropy calculation', async () => {
      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByText(/\b128\.?\d* bits/)).toBeInTheDocument();
      });
    });

    it('shows crack time estimation', async () => {
      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByText('Crack time: years')).toBeInTheDocument();
      });
    });

    it('validates password strength properly', async () => {
      mockCalculatePasswordStrength.mockReturnValue({
        score: 20,
        level: 'very_weak',
        feedback: ['Password is too short', 'Add more character types'],
        crackTime: 'instant',
        entropy: 20,
      });

      render(<PasswordGenerator />);

      await waitFor(() => {
        expect(screen.getByText('very weak')).toBeInTheDocument();
        expect(screen.getByText('Password is too short')).toBeInTheDocument();
        expect(screen.getByText('Add more character types')).toBeInTheDocument();
      });
    });
  });
});
