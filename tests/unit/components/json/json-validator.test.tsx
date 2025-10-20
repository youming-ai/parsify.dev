import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import { JsonValidator } from '@/web/components/tools/json/json-validator'

// Mock the json-utils module
vi.mock('@/web/components/tools/json/json-utils', () => ({
  validateJson: vi.fn((json) => {
    try {
      JSON.parse(json)
      return {
        isValid: true,
        errors: []
      }
    } catch (error) {
      const match = error.message.match(/line (\d+) column (\d+)/)
      return {
        isValid: false,
        errors: [{
          line: match ? parseInt(match[1]) : 1,
          column: match ? parseInt(match[2]) : 1,
          message: error.message,
          severity: 'error' as const
        }]
      }
    }
  })
}))

// Mock the JsonErrorDisplay component
vi.mock('@/web/components/tools/json/json-error-display', () => ({
  JsonErrorDisplay: ({ errors, content }: any) => (
    <div data-testid="json-error-display">
      {errors.map((error: any, index: number) => (
        <div key={index} data-testid={`error-${index}`}>
          Error at line {error.line}, column {error.column}: {error.message}
        </div>
      ))}
    </div>
  )
}))

describe('JsonValidator Component', () => {
  const mockOnValidationChange = vi.fn()
  const validJson = '{"name":"test","value":123}'
  const invalidJson = '{"name":"test","value":123'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders validation status for empty input', () => {
    render(
      <JsonValidator
        input=""
        onValidationChange={mockOnValidationChange}
      />
    )

    expect(screen.getByText('Validating...')).toBeInTheDocument()
    expect(screen.getByText('Enter JSON content above to validate')).toBeInTheDocument()
  })

  it('validates valid JSON correctly', async () => {
    render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    // Should show validating state initially
    expect(screen.getByText('Validating...')).toBeInTheDocument()

    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument()
    })

    // Should show success message
    expect(screen.getByText('Your JSON is valid and properly formatted. No syntax errors detected.')).toBeInTheDocument()

    // Should call onValidationChange with valid result
    expect(mockOnValidationChange).toHaveBeenCalledWith({
      isValid: true,
      errors: []
    })
  })

  it('validates invalid JSON correctly', async () => {
    render(
      <JsonValidator
        input={invalidJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getByText(/errors? found/)).toBeInTheDocument()
    })

    // Should show error display
    expect(screen.getByTestId('json-error-display')).toBeInTheDocument()

    // Should call onValidationChange with invalid result
    expect(mockOnValidationChange).toHaveBeenCalledWith({
      isValid: false,
      errors: expect.arrayContaining([
        expect.objectContaining({
          message: expect.any(String),
          severity: 'error'
        })
      ])
    })
  })

  it('shows correct status icons', async () => {
    const { rerender } = render(
      <JsonValidator
        input=""
        onValidationChange={mockOnValidationChange}
      />
    )

    // Should show loading/spinning icon initially
    expect(screen.getByTestId('refresh-cw')).toBeInTheDocument()

    // Rerender with valid JSON
    rerender(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('check-circle')).toBeInTheDocument()
    })

    // Rerender with invalid JSON
    rerender(
      <JsonValidator
        input={invalidJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('alert-circle')).toBeInTheDocument()
    })
  })

  it('displays correct statistics', async () => {
    const multilineJson = '{"name":"test",\n"value":123,\n"nested":{"key":"value"}}'

    render(
      <JsonValidator
        input={multilineJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Lines: 3')).toBeInTheDocument()
      expect(screen.getByText(/Characters:/)).toBeInTheDocument()
      expect(screen.getByText(/Words:/)).toBeInTheDocument()
    })
  })

  it('handles revalidate button click', async () => {
    const user = userEvent.setup()
    const { validateJson } = await import('@/web/components/tools/json/json-utils')

    render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    // Wait for initial validation
    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument()
    })

    // Clear previous calls
    mockOnValidationChange.mockClear()

    // Click revalidate button
    const revalidateButton = screen.getByRole('button', { name: /revalidate/i })
    await user.click(revalidateButton)

    // Should call validateJson again
    expect(validateJson).toHaveBeenCalledTimes(2)
    expect(mockOnValidationChange).toHaveBeenCalledWith({
      isValid: true,
      errors: []
    })
  })

  it('disables revalidate button during validation', async () => {
    render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    // Button should be disabled during validation
    const revalidateButton = screen.getByRole('button', { name: /revalidate/i })
    expect(revalidateButton).toBeDisabled()

    // Wait for validation to complete
    await waitFor(() => {
      expect(revalidateButton).not.toBeDisabled()
    })
  })

  it('debounces validation correctly', async () => {
    const { validateJson } = await import('@/web/components/tools/json/json-utils')

    render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    // Should only call validateJson once after debounce
    await vi.advanceTimersByTimeAsync(300)

    expect(validateJson).toHaveBeenCalledTimes(1)
  })

  it('handles rapid input changes with debouncing', async () => {
    const { validateJson } = await import('@/web/components/tools/json/json-utils')

    const { rerender } = render(
      <JsonValidator
        input='{'
        onValidationChange={mockOnValidationChange}
      />
    )

    // Simulate rapid typing
    rerender(<JsonValidator input='{"n"' onValidationChange={mockOnValidationChange} />)
    rerender(<JsonValidator input='{"na"' onValidationChange={mockOnValidationChange} />)
    rerender(<JsonValidator input='{"nam"' onValidationChange={mockOnValidationChange} />)
    rerender(<JsonValidator input='{"name"' onValidationChange={mockOnValidationChange} />)

    // Should only validate once after debounce period
    await vi.advanceTimersByTimeAsync(300)

    expect(validateJson).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
        className="custom-validator"
      />
    )

    const container = screen.getByText('Validating...').closest('div')
    expect(container).toHaveClass('custom-validator')
  })

  it('shows line numbers when enabled', async () => {
    render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
        showLineNumbers={true}
      />
    )

    // Line numbers setting should be passed to JsonErrorDisplay
    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeInTheDocument()
    })
  })

  it('handles validation errors gracefully', async () => {
    const { validateJson } = await import('@/web/components/tools/json/json-utils')

    // Mock validateJson to throw an error
    ;(validateJson as any).mockImplementationOnce(() => {
      throw new Error('Validation failed')
    })

    render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith({
        isValid: false,
        errors: [{
          line: 1,
          column: 1,
          message: 'Validation failed',
          severity: 'error'
        }]
      })
    })
  })

  it('displays correct status colors', async () => {
    const { rerender } = render(
      <JsonValidator
        input=""
        onValidationChange={mockOnValidationChange}
      />
    )

    // Initial validating state - blue
    expect(screen.getByText('Validating...').closest('div')).toHaveClass('bg-blue-50', 'border-blue-200')

    // Valid state - green
    rerender(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Valid JSON').closest('div')).toHaveClass('bg-green-50', 'border-green-200')
    })

    // Invalid state - red
    rerender(
      <JsonValidator
        input={invalidJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/errors? found/).closest('div')).toHaveClass('bg-red-50', 'border-red-200')
    })
  })

  it('is accessible with keyboard navigation', async () => {
    const user = userEvent.setup()

    render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    await waitFor(() => {
      // Should be able to tab to revalidate button
      user.tab()
      expect(screen.getByRole('button', { name: /revalidate/i })).toHaveFocus()
    })

    // Should be able to activate with Enter
    await user.keyboard('{Enter}')
    expect(mockOnValidationChange).toHaveBeenCalled()
  })

  it('handles cleanup on unmount', () => {
    const { unmount } = render(
      <JsonValidator
        input={validJson}
        onValidationChange={mockOnValidationChange}
      />
    )

    // Should not throw errors on unmount
    expect(() => unmount()).not.toThrow()
  })
})
