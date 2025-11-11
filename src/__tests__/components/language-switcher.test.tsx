import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Mock routing
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => '/tools',
}));

describe('LanguageSwitcher', () => {
  it('should render the language switcher button', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button', { name: /select language/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Select language');
  });

  it('should display current language', () => {
    render(<LanguageSwitcher />);

    // Should contain the current language (English)
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should show language dropdown when clicked', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button', { name: /select language/i });
    fireEvent.click(button);

    // Should show language options
    expect(screen.getByText('简体中文')).toBeInTheDocument();
    expect(screen.getByText('繁體中文')).toBeInTheDocument();
    expect(screen.getByText('日本語')).toBeInTheDocument();
    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('עברית')).toBeInTheDocument();
  });

  it('should show flag emojis', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show flag emojis
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('🇨🇳')).toBeInTheDocument();
    expect(screen.getByText('🇸🇦')).toBeInTheDocument();
  });

  it('should check the current language', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should have check mark for English (current language)
    const englishOption = screen.getByText('English').closest('div');
    expect(englishOption?.querySelector('[data-testid="check-icon"]')).toBeInTheDocument();
  });

  it('should handle language selection', () => {
    const mockReplace = vi.fn();
    vi.mock('@/i18n/routing', () => ({
      useRouter: () => ({
        replace: mockReplace,
      }),
      usePathname: () => '/tools',
    }));

    render(<LanguageSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Click on Chinese option
    const chineseOption = screen.getByText('简体中文');
    fireEvent.click(chineseOption);

    expect(mockReplace).toHaveBeenCalledWith('/tools', { locale: 'zh-CN' });
  });

  it('should show responsive text', () => {
    render(<LanguageSwitcher />);

    // On larger screens, should show full text
    expect(screen.getByText('🇺🇸 English')).toBeInTheDocument();
  });

  it('should support RTL languages', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should support Arabic (RTL)
    const arabicOption = screen.getByText('العربية').closest('div');
    expect(arabicOption).toHaveAttribute('dir', 'rtl');

    // Should support Hebrew (RTL)
    const hebrewOption = screen.getByText('עברית').closest('div');
    expect(hebrewOption).toHaveAttribute('dir', 'rtl');
  });
});
