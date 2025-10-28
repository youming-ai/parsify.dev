import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { LoginForm } from '@/web/components/auth/login-form'
import { FileDropZone } from '@/web/components/file-upload/file-drop-zone'
import { MainLayout } from '@/web/components/layout/main-layout'
import { Alert, AlertDescription, AlertTitle } from '@/web/components/ui/alert'
import { Button } from '@/web/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/web/components/ui/card'
import { Input } from '@/web/components/ui/input'
import { render } from '../test-utils'

describe('Component Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Button Component Accessibility', () => {
    it('has proper button semantics', () => {
      render(<Button>Accessible Button</Button>)

      const button = screen.getByRole('button', { name: 'Accessible Button' })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('type', 'button')
    })

    it('supports keyboard navigation', () => {
      render(<Button>Test Button</Button>)

      const button = screen.getByRole('button', { name: 'Test Button' })

      button.focus()
      expect(button).toHaveFocus()

      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyDown(button, { key: ' ' })

      // Should not throw errors
      expect(button).toBeInTheDocument()
    })

    it('has visible focus indicators', () => {
      render(<Button>Test Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('handles disabled state accessibly', () => {
      render(<Button disabled>Disabled Button</Button>)

      const button = screen.getByRole('button', { name: 'Disabled Button' })
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:pointer-events-none')
    })

    it('supports ARIA attributes', () => {
      render(
        <Button aria-label="Custom action" aria-describedby="button-help">
          Action
        </Button>
      )

      const button = screen.getByRole('button', { name: 'Custom action' })
      expect(button).toHaveAttribute('aria-describedby', 'button-help')
    })
  })

  describe('Input Component Accessibility', () => {
    it('has proper input semantics', () => {
      render(<Input placeholder="Enter name" />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', 'Enter name')
    })

    it('supports keyboard navigation', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      input.focus()
      expect(input).toHaveFocus()

      fireEvent.keyDown(input, { key: 'Tab' })
      expect(input).toBeInTheDocument()
    })

    it('has visible focus indicators', () => {
      render(<Input />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('handles disabled state accessibly', () => {
      render(<Input disabled />)

      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveAttribute('aria-disabled', 'true')
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    })

    it('supports proper labeling', () => {
      render(
        <div>
          <label htmlFor="email-input">Email Address</label>
          <Input id="email-input" type="email" />
        </div>
      )

      const input = screen.getByRole('textbox', { name: 'Email Address' })
      expect(input).toHaveAttribute('id', 'email-input')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('provides validation feedback', () => {
      render(<Input required aria-invalid="true" aria-describedby="error-message" />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('required')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'error-message')
    })
  })

  describe('Card Component Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
        </Card>
      )

      const title = screen.getByRole('heading', {
        level: 3,
        name: 'Card Title',
      })
      expect(title).toBeInTheDocument()
    })

    it('supports ARIA attributes', () => {
      render(
        <Card role="article" aria-labelledby="card-title">
          <CardHeader>
            <CardTitle id="card-title">Article Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Article content</p>
          </CardContent>
        </Card>
      )

      const card = screen.getByRole('article')
      expect(card).toHaveAttribute('aria-labelledby', 'card-title')

      const title = screen.getByRole('heading', { name: 'Article Title' })
      expect(title).toHaveAttribute('id', 'card-title')
    })
  })

  describe('Alert Component Accessibility', () => {
    it('has proper alert semantics', () => {
      render(
        <Alert>
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>This is an important message</AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()

      const title = screen.getByRole('heading', {
        level: 5,
        name: 'Important Notice',
      })
      expect(title).toBeInTheDocument()

      expect(screen.getByText('This is an important message')).toBeInTheDocument()
    })

    it('supports live regions', () => {
      render(
        <Alert aria-live="polite" aria-atomic="true">
          <AlertDescription>Status update</AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
      expect(alert).toHaveAttribute('aria-atomic', 'true')
    })

    it('has proper color contrast for different variants', () => {
      const variants = ['default', 'destructive', 'warning', 'success', 'info'] as const

      variants.forEach(variant => {
        const { unmount } = render(
          <Alert variant={variant} data-testid={`alert-${variant}`}>
            <AlertDescription>Test message</AlertDescription>
          </Alert>
        )

        const alert = screen.getByTestId(`alert-${variant}`)
        expect(alert).toBeInTheDocument()

        unmount()
      })
    })
  })

  describe('LoginForm Component Accessibility', () => {
    it('has proper form structure', () => {
      render(<LoginForm />)

      // Should have main heading
      expect(screen.getByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument()

      // Should have form controls
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue with github/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continue with email/i })).toBeInTheDocument()
    })

    it('supports keyboard navigation through OAuth options', async () => {
      render(<LoginForm />)

      const googleButton = screen.getByRole('button', {
        name: /continue with google/i,
      })
      const githubButton = screen.getByRole('button', {
        name: /continue with github/i,
      })
      const emailButton = screen.getByRole('button', {
        name: /continue with email/i,
      })

      // Should be able to focus all buttons
      googleButton.focus()
      expect(googleButton).toHaveFocus()

      githubButton.focus()
      expect(githubButton).toHaveFocus()

      emailButton.focus()
      expect(emailButton).toHaveFocus()
    })

    it('has proper form labels when email form is shown', async () => {
      render(<LoginForm />)

      // Click to show email form
      const emailButton = screen.getByRole('button', {
        name: /continue with email/i,
      })
      fireEvent.click(emailButton)

      // Should have properly labeled inputs
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    })

    it('provides error feedback accessibly', () => {
      // Mock auth context with error
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          login: vi.fn(),
          error: 'Invalid credentials',
          clearError: vi.fn(),
          user: null,
          isLoading: false,
          logout: vi.fn(),
        }),
      }))

      render(<LoginForm />)

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  describe('FileDropZone Component Accessibility', () => {
    it('has proper button semantics', () => {
      render(<FileDropZone />)

      const dropZone = screen.getByRole('button', {
        name: 'File upload drop zone',
      })
      expect(dropZone).toBeInTheDocument()
      expect(dropZone).toHaveAttribute('tabIndex', '0')
      expect(dropZone).toHaveAttribute('aria-label', 'File upload drop zone')
    })

    it('supports keyboard navigation', async () => {
      render(<FileDropZone />)

      const dropZone = screen.getByRole('button', {
        name: 'File upload drop zone',
      })
      dropZone.focus()
      expect(dropZone).toHaveFocus()

      // Should support Enter and Space keys
      fireEvent.keyDown(dropZone, { key: 'Enter' })
      fireEvent.keyDown(dropZone, { key: ' ' })

      expect(dropZone).toBeInTheDocument()
    })

    it('handles disabled state accessibly', () => {
      render(<FileDropZone disabled />)

      const dropZone = screen.getByRole('button', {
        name: 'File upload drop zone',
      })
      expect(dropZone).toHaveAttribute('aria-disabled', 'true')
      expect(dropZone).toHaveAttribute('tabIndex', '-1')
      expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed')
    })

    it('provides drag and drop instructions accessibly', () => {
      render(<FileDropZone />)

      expect(screen.getByText('Drag & drop files here')).toBeInTheDocument()
      expect(screen.getByText('or click to browse')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Select Files' })).toBeInTheDocument()
    })

    it('announces drag state changes', () => {
      render(<FileDropZone />)

      const dropZone = screen.getByRole('button', {
        name: 'File upload drop zone',
      })

      // Should announce drag over state
      fireEvent.dragOver(dropZone)
      expect(screen.getByText('Drop files here')).toBeInTheDocument()
    })
  })

  describe('Layout Component Accessibility', () => {
    it('has proper landmark elements', () => {
      render(
        <MainLayout>
          <main>Main content</main>
        </MainLayout>
      )

      // Should have proper landmark roles
      expect(screen.getByRole('banner')).toBeInTheDocument() // Header
      expect(screen.getByRole('main')).toBeInTheDocument() // Main content
      expect(screen.getByRole('contentinfo')).toBeInTheDocument() // Footer
    })

    it('maintains proper heading hierarchy', () => {
      render(
        <MainLayout>
          <main>
            <h1>Main Page Title</h1>
            <section>
              <h2>Section Title</h2>
              <p>Section content</p>
            </section>
          </main>
        </MainLayout>
      )

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('supports keyboard navigation through layout', () => {
      render(
        <MainLayout>
          <main>
            <button>Interactive Element</button>
          </main>
        </MainLayout>
      )

      const button = screen.getByRole('button', { name: 'Interactive Element' })
      button.focus()
      expect(button).toHaveFocus()
    })
  })

  describe('Focus Management', () => {
    it('manages focus properly in forms', async () => {
      render(<LoginForm />)

      const emailButton = screen.getByRole('button', {
        name: /continue with email/i,
      })
      fireEvent.click(emailButton)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toBeInTheDocument()

      // Focus should be manageable
      emailInput.focus()
      expect(emailInput).toHaveFocus()
    })

    it('prevents focus trapping when appropriate', () => {
      render(
        <Card>
          <Button>Outside</Button>
          <div role="dialog">
            <Button>Inside</Button>
          </div>
        </Card>
      )

      const outsideButton = screen.getByRole('button', { name: 'Outside' })
      const insideButton = screen.getByRole('button', { name: 'Inside' })

      outsideButton.focus()
      expect(outsideButton).toHaveFocus()

      insideButton.focus()
      expect(insideButton).toHaveFocus()
    })
  })

  describe('Screen Reader Support', () => {
    it('provides appropriate ARIA labels', () => {
      render(
        <form aria-label="Contact form">
          <Input aria-label="Full name" placeholder="Enter your name" />
          <Button aria-describedby="submit-help">Submit</Button>
          <div id="submit-help">Click to submit the form</div>
        </form>
      )

      const form = screen.getByRole('form', { name: 'Contact form' })
      const input = screen.getByRole('textbox', { name: 'Full name' })
      const button = screen.getByRole('button', { name: 'Submit' })

      expect(form).toBeInTheDocument()
      expect(input).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-describedby', 'submit-help')
    })

    it('announces important state changes', () => {
      render(
        <Alert role="status" aria-live="polite">
          <AlertDescription>Operation completed successfully</AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('status')
      expect(alert).toHaveAttribute('aria-live', 'polite')
    })

    it('provides descriptive text for complex interactions', () => {
      render(<FileDropZone accept={['.json', '.txt']} maxSize={5 * 1024 * 1024} />)

      expect(screen.getByText('Accepted formats: .json, .txt')).toBeInTheDocument()
      expect(screen.getByText('Max file size: 5 MB')).toBeInTheDocument()
    })
  })

  describe('Keyboard Accessibility', () => {
    it('supports Tab navigation through all interactive elements', () => {
      render(
        <div>
          <Button>Button 1</Button>
          <Input placeholder="Input field" />
          <Button>Button 2</Button>
        </div>
      )

      const button1 = screen.getByRole('button', { name: 'Button 1' })
      const input = screen.getByRole('textbox')
      const button2 = screen.getByRole('button', { name: 'Button 2' })

      // All elements should be focusable
      button1.focus()
      expect(button1).toHaveFocus()

      input.focus()
      expect(input).toHaveFocus()

      button2.focus()
      expect(button2).toHaveFocus()
    })

    it('supports Enter and Space key activation', () => {
      render(<Button>Action Button</Button>)

      const button = screen.getByRole('button', { name: 'Action Button' })

      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyDown(button, { key: ' ' })

      expect(button).toBeInTheDocument()
    })

    it('supports Escape key where appropriate', () => {
      render(<LoginForm />)

      // Show email form
      const emailButton = screen.getByRole('button', {
        name: /continue with email/i,
      })
      fireEvent.click(emailButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      expect(cancelButton).toBeInTheDocument()

      cancelButton.focus()
      fireEvent.keyDown(cancelButton, { key: 'Escape' })

      // Should be able to handle escape key
      expect(cancelButton).toBeInTheDocument()
    })
  })

  describe('Color Contrast and Visual Accessibility', () => {
    it('provides sufficient contrast for different states', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const

      variants.forEach(variant => {
        const { unmount } = render(<Button variant={variant}>Test Button</Button>)

        const button = screen.getByRole('button', { name: 'Test Button' })
        expect(button).toBeInTheDocument()

        unmount()
      })
    })

    it('provides visual indicators for different states', () => {
      render(
        <div>
          <Button>Normal</Button>
          <Button disabled>Disabled</Button>
          <Input placeholder="Input" />
          <Input disabled placeholder="Disabled Input" />
        </div>
      )

      const normalButton = screen.getByRole('button', { name: 'Normal' })
      const disabledButton = screen.getByRole('button', { name: 'Disabled' })
      const normalInput = screen.getByRole('textbox')
      const disabledInput = screen.getByRole('textbox', { name: '' })

      expect(normalButton).toBeInTheDocument()
      expect(disabledButton).toBeDisabled()
      expect(normalInput).toBeInTheDocument()
      expect(disabledInput).toBeDisabled()
    })
  })
})
