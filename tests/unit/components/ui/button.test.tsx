import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../test-utils'
import { Button } from '@/web/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('applies default variant styles', () => {
    render(<Button>Default Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-red-600', 'text-white')

    rerender(<Button variant="outline">Cancel</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-gray-300', 'bg-white')

    rerender(<Button variant="secondary">Secondary</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-100', 'text-gray-900')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('hover:bg-gray-100')

    rerender(<Button variant="link">Link</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('text-blue-600', 'underline-offset-4')
  })

  it('applies different sizes correctly', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-9', 'rounded-md', 'px-3')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-11', 'rounded-md', 'px-8')

    rerender(<Button size="icon">Icon</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'w-10')

    // Default size
    rerender(<Button>Default</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'px-4', 'py-2')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    const handleClick = vi.fn()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')

    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Button ref={ref}>Ref Button</Button>)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('handles all button HTML attributes', () => {
    render(
      <Button
        type="submit"
        name="test-button"
        value="test-value"
        aria-label="Test Button"
        data-testid="test-button"
      >
        Test
      </Button>
    )

    const button = screen.getByTestId('test-button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('name', 'test-button')
    expect(button).toHaveAttribute('value', 'test-value')
    expect(button).toHaveAttribute('aria-label', 'Test Button')
  })

  it('focuses correctly with keyboard navigation', () => {
    render(<Button>Focus Test</Button>)
    const button = screen.getByRole('button')

    button.focus()
    expect(button).toHaveFocus()

    fireEvent.keyDown(button, { key: 'Enter' })
    fireEvent.keyDown(button, { key: ' ' })

    // Should not throw errors and should trigger click events
    expect(button).toBeInTheDocument()
  })

  it('has accessible focus indicators', () => {
    render(<Button>Accessible Button</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
  })

  it('supports children as React nodes', () => {
    render(
      <Button>
        <span data-testid="custom-child">Custom Child</span>
      </Button>
    )

    expect(screen.getByTestId('custom-child')).toBeInTheDocument()
  })
})
