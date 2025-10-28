import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Alert, AlertDescription, AlertTitle } from '@/web/components/ui/alert'
import { render } from '../test-utils'

describe('Alert Components', () => {
  describe('Alert', () => {
    it('renders alert with default variant', () => {
      render(<Alert>Default alert message</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Default alert message')
      expect(alert).toHaveClass('bg-white', 'text-gray-900', 'border-gray-200')
    })

    it('renders all alert variants correctly', () => {
      const variants = [
        {
          variant: 'default' as const,
          classes: ['bg-white', 'text-gray-900', 'border-gray-200'],
        },
        {
          variant: 'destructive' as const,
          classes: ['border-red-200/50', 'text-red-900', 'bg-red-50'],
        },
        {
          variant: 'warning' as const,
          classes: ['border-yellow-200/50', 'text-yellow-900', 'bg-yellow-50'],
        },
        {
          variant: 'success' as const,
          classes: ['border-green-200/50', 'text-green-900', 'bg-green-50'],
        },
        {
          variant: 'info' as const,
          classes: ['border-blue-200/50', 'text-blue-900', 'bg-blue-50'],
        },
      ]

      variants.forEach(({ variant, classes }) => {
        const { unmount } = render(
          <Alert variant={variant} data-testid={`alert-${variant}`}>
            {variant} alert message
          </Alert>
        )

        const alert = screen.getByTestId(`alert-${variant}`)
        expect(alert).toBeInTheDocument()
        classes.forEach(className => {
          expect(alert).toHaveClass(className)
        })

        unmount()
      })
    })

    it('applies custom className', () => {
      render(<Alert className="custom-alert">Custom alert</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('custom-alert')
    })

    it('has proper ARIA role', () => {
      render(<Alert>Important message</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<Alert ref={ref}>Alert message</Alert>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('handles all div HTML attributes', () => {
      render(
        <Alert data-testid="test-alert" aria-live="polite" aria-atomic="true">
          Alert message
        </Alert>
      )

      const alert = screen.getByTestId('test-alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
      expect(alert).toHaveAttribute('aria-atomic', 'true')
    })
  })

  describe('AlertTitle', () => {
    it('renders title with default styles', () => {
      render(<AlertTitle>Alert Title</AlertTitle>)
      const title = screen.getByText('Alert Title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight')
    })

    it('applies custom className', () => {
      render(<AlertTitle className="custom-title">Alert Title</AlertTitle>)
      const title = screen.getByText('Alert Title')
      expect(title).toHaveClass('custom-title')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<AlertTitle ref={ref}>Alert Title</AlertTitle>)
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
    })

    it('renders as h5 element', () => {
      render(<AlertTitle>Alert Title</AlertTitle>)
      const title = screen.getByRole('heading', { level: 5 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Alert Title')
    })
  })

  describe('AlertDescription', () => {
    it('renders description with default styles', () => {
      render(<AlertDescription>Alert description text</AlertDescription>)
      const description = screen.getByText('Alert description text')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm')
    })

    it('applies custom className', () => {
      render(<AlertDescription className="custom-desc">Alert description</AlertDescription>)
      const description = screen.getByText('Alert description')
      expect(description).toHaveClass('custom-desc')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<AlertDescription ref={ref}>Alert description</AlertDescription>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('handles paragraph elements within description', () => {
      render(
        <AlertDescription>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </AlertDescription>
      )

      const paragraphs = screen.getAllByRole('paragraph')
      expect(paragraphs).toHaveLength(2)
      expect(paragraphs[0]).toHaveTextContent('First paragraph')
      expect(paragraphs[1]).toHaveTextContent('Second paragraph')
    })
  })

  describe('Complete Alert Composition', () => {
    it('renders complete alert structure', () => {
      render(
        <Alert data-testid="complete-alert">
          <AlertTitle>Error Occurred</AlertTitle>
          <AlertDescription>Something went wrong while processing your request.</AlertDescription>
        </Alert>
      )

      const alert = screen.getByTestId('complete-alert')
      const title = screen.getByRole('heading', { name: 'Error Occurred' })
      const description = screen.getByText(/something went wrong/i)

      expect(alert).toBeInTheDocument()
      expect(title).toBeInTheDocument()
      expect(description).toBeInTheDocument()
      expect(alert).toContainElement(title)
      expect(alert).toContainElement(description.parentElement!)
    })

    it('renders alert with icon styling for SVG elements', () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>Alert with Icon</AlertTitle>
          <AlertDescription>Alert description</AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('alert')
      const icon = screen.getByTestId('alert-icon')

      // The alert should position the icon absolutely
      expect(alert).toContainElement(icon)
      expect(alert).toHaveClass('[&>svg]:absolute', '[&>svg]:left-4', '[&>svg]:top-4')
    })

    it('maintains proper semantic structure', () => {
      render(
        <Alert role="alertdialog" aria-labelledby="alert-title" aria-describedby="alert-desc">
          <AlertTitle id="alert-title">Confirmation Required</AlertTitle>
          <AlertDescription id="alert-desc">
            Are you sure you want to proceed with this action?
          </AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('alertdialog')
      const title = screen.getByRole('heading', {
        name: 'Confirmation Required',
      })

      expect(alert).toHaveAttribute('aria-labelledby', 'alert-title')
      expect(alert).toHaveAttribute('aria-describedby', 'alert-desc')
      expect(alert).toContainElement(title)
    })

    it('is accessible with screen readers', () => {
      render(
        <Alert>
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            This alert contains important information that requires your attention.
          </AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('alert')
      const title = screen.getByRole('heading', { name: 'Important Notice' })

      expect(alert).toHaveAttribute('role', 'alert')
      expect(title).toBeInTheDocument()
    })

    it('supports different alert contexts', () => {
      const alertTypes = [
        {
          variant: 'destructive' as const,
          title: 'Error',
          description: 'An error occurred',
        },
        {
          variant: 'warning' as const,
          title: 'Warning',
          description: 'Please be careful',
        },
        {
          variant: 'success' as const,
          title: 'Success',
          description: 'Operation completed',
        },
        {
          variant: 'info' as const,
          title: 'Info',
          description: 'For your information',
        },
      ]

      alertTypes.forEach(({ variant, title, description }) => {
        const { unmount } = render(
          <Alert variant={variant}>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{description}</AlertDescription>
          </Alert>
        )

        expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
        expect(screen.getByText(description)).toBeInTheDocument()

        unmount()
      })
    })
  })
})
