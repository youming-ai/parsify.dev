import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import { LoginForm } from '@/web/components/auth/login-form'

// Mock the auth context
const mockLogin = vi.fn()
const mockClearError = vi.fn()

vi.mock('@/web/components/auth/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    error: null,
    clearError: mockClearError,
    user: null,
    isLoading: false,
    logout: vi.fn()
  })
}))

describe('LoginForm Component', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with OAuth providers', () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByText('Choose your preferred sign-in method')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
    expect(screen.getByText('Continue with Email')).toBeInTheDocument()
  })

  it('renders email form when "Continue with Email" is clicked', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSuccess={mockOnSuccess} />)

    const emailButton = screen.getByRole('button', { name: /continue with email/i })
    await user.click(emailButton)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('handles OAuth login with Google', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await user.click(googleButton)

    expect(mockLogin).toHaveBeenCalledWith('google')
    expect(mockClearError).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('handles OAuth login with GitHub', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const githubButton = screen.getByRole('button', { name: /continue with github/i })
    await user.click(githubButton)

    expect(mockLogin).toHaveBeenCalledWith('github')
    expect(mockClearError).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('handles email login with valid credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)

    render(<LoginForm onSuccess={mockOnSuccess} />)

    // Click to show email form
    const emailButton = screen.getByRole('button', { name: /continue with email/i })
    await user.click(emailButton)

    // Fill in email and password
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Submit form
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInButton)

    expect(mockLogin).toHaveBeenCalledWith('email', {
      email: 'test@example.com',
      password: 'password123'
    })
    expect(mockClearError).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('validates email input', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSuccess={mockOnSuccess} />)

    // Click to show email form
    const emailButton = screen.getByRole('button', { name: /continue with email/i })
    await user.click(emailButton)

    // Try to submit with empty email
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInButton)

    // Should not call login if form is invalid
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('validates password input', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSuccess={mockOnSuccess} />)

    // Click to show email form
    const emailButton = screen.getByRole('button', { name: /continue with email/i })
    await user.click(emailButton)

    // Fill in email but not password
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'test@example.com')

    // Try to submit
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInButton)

    // Should not call login if form is invalid
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('cancels email form and returns to OAuth options', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSuccess={mockOnSuccess} />)

    // Click to show email form
    const emailButton = screen.getByRole('button', { name: /continue with email/i })
    await user.click(emailButton)

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    // Should return to OAuth options
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
  })

  it('displays error message when auth error occurs', () => {
    // Mock auth context with error
    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        login: mockLogin,
        error: 'Invalid credentials',
        clearError: mockClearError,
        user: null,
        isLoading: false,
        logout: vi.fn()
      })
    }))

    render(<LoginForm onSuccess={mockOnSuccess} />)

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('shows loading state during authentication', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await user.click(googleButton)

    // Button should be disabled during loading
    expect(googleButton).toBeDisabled()
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
  })

  it('disables all buttons during loading', async () => {
    const user = userEvent.setup()
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<LoginForm onSuccess={mockOnSuccess} />)

    // Click to show email form
    const emailButton = screen.getByRole('button', { name: /continue with email/i })
    await user.click(emailButton)

    // Start login
    const signInButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(signInButton)

    // All buttons should be disabled
    expect(signInButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('handles redirectTo parameter', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)

    render(<LoginForm onSuccess={mockOnSuccess} redirectTo="/dashboard" />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await user.click(googleButton)

    // Should still work with redirectTo parameter
    expect(mockLogin).toHaveBeenCalledWith('google')
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('handles sign up link click', async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const signUpLink = screen.getByRole('button', { name: /sign up/i })
    await user.click(signUpLink)

    expect(consoleSpy).toHaveBeenCalledWith('Navigate to sign up')

    consoleSpy.mockRestore()
  })

  it('applies correct styling to OAuth buttons', () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    const githubButton = screen.getByRole('button', { name: /continue with github/i })

    expect(googleButton).toHaveClass('bg-white', 'hover:bg-gray-50', 'border-gray-300', 'text-gray-700')
    expect(githubButton).toHaveClass('bg-gray-900', 'hover:bg-gray-800', 'text-white')
  })

  it('has proper accessibility attributes', () => {
    render(<LoginForm onSuccess={mockOnSuccess} />)

    // Email input should have proper type and attributes
    const emailButton = screen.getByRole('button', { name: /continue with email/i })
    expect(emailButton).toBeInTheDocument()

    // Form should have proper structure
    expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument()
    expect(screen.getByText('Choose your preferred sign-in method')).toBeInTheDocument()
  })

  it('is accessible with keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<LoginForm onSuccess={mockOnSuccess} />)

    // Should be able to tab through all interactive elements
    await user.tab()
    expect(screen.getByRole('button', { name: /continue with google/i })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /continue with github/i })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /continue with email/i })).toHaveFocus()
  })

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)

    render(<LoginForm onSuccess={mockOnSuccess} />)

    // Show email form
    const emailButton = screen.getByRole('button', { name: /continue with email/i })
    await user.click(emailButton)

    // Fill form
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/^password$/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Submit with Enter key
    await user.keyboard('{Enter}')

    expect(mockLogin).toHaveBeenCalledWith('email', {
      email: 'test@example.com',
      password: 'password123'
    })
  })

  it('handles errors without crashing', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue(new Error('Network error'))

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const googleButton = screen.getByRole('button', { name: /continue with google/i })
    await user.click(googleButton)

    // Should not throw unhandled errors
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })

    // onSuccess should not be called on error
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })
})
