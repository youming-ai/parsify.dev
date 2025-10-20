import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../test-utils'
import { Input } from '@/web/components/ui/input'

describe('Input Component', () => {
  it('renders input with default props', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border')
  })

  it('renders with custom placeholder', () => {
    render(<Input placeholder="Enter text here" />)
    const input = screen.getByPlaceholderText('Enter text here')
    expect(input).toBeInTheDocument()
  })

  it('renders different input types', () => {
    const { rerender } = render(<Input type="text" />)
    let input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'text')

    rerender(<Input type="password" />)
    input = screen.getByDisplayValue('')
    expect(input).toHaveAttribute('type', 'password')

    rerender(<Input type="email" />)
    input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="number" />)
    input = screen.getByDisplayValue('')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('handles value changes', () => {
    const handleChange = vi.fn()
    render(<Input value="test" onChange={handleChange} />)

    const input = screen.getByDisplayValue('test')
    expect(input).toHaveValue('test')

    fireEvent.change(input, { target: { value: 'new value' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('handles focus and blur events', () => {
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    const input = screen.getByRole('textbox')

    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)

    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
  })

  it('applies custom className', () => {
    render(<Input className="custom-input-class" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input-class')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('handles all input HTML attributes', () => {
    render(
      <Input
        name="test-input"
        id="test-id"
        maxLength={10}
        autoComplete="email"
        required
        aria-label="Test Input"
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('name', 'test-input')
    expect(input).toHaveAttribute('id', 'test-id')
    expect(input).toHaveAttribute('maxLength', '10')
    expect(input).toHaveAttribute('autoComplete', 'email')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('aria-label', 'Test Input')
  })

  it('has accessible focus indicators', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')

    expect(input).toHaveClass(
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-2'
    )
  })

  it('supports keyboard navigation', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')

    input.focus()
    expect(input).toHaveFocus()

    // Test typing
    fireEvent.change(input, { target: { value: 'Hello World' } })
    expect(input).toHaveValue('Hello World')
  })

  it('handles file input type', () => {
    render(<Input type="file" />)
    const input = screen.getByRole('button') // File inputs are often exposed as buttons
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'file')
  })

  it('supports controlled and uncontrolled modes', () => {
    // Uncontrolled (default behavior)
    const { rerender } = render(<Input defaultValue="default" />)
    let input = screen.getByDisplayValue('default')
    expect(input).toHaveValue('default')

    // Controlled
    rerender(<Input value="controlled" readOnly />)
    input = screen.getByDisplayValue('controlled')
    expect(input).toHaveValue('controlled')
    expect(input).toHaveAttribute('readOnly')
  })

  it('handles form integration', () => {
    const handleSubmit = vi.fn((e) => e.preventDefault())

    render(
      <form onSubmit={handleSubmit}>
        <Input name="username" required />
        <button type="submit">Submit</button>
      </form>
    )

    const input = screen.getByRole('textbox')
    const submitButton = screen.getByRole('button', { name: 'Submit' })

    fireEvent.change(input, { target: { value: 'testuser' } })
    fireEvent.click(submitButton)

    expect(handleSubmit).toHaveBeenCalled()
  })
})
