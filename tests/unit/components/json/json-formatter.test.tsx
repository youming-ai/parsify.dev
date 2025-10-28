import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JsonFormatter } from '@/web/components/tools/json/json-formatter'
import { render } from '../test-utils'

// Mock the json-utils module
vi.mock('@/web/components/tools/json/json-utils', () => ({
  formatJson: vi.fn((json, options) => {
    try {
      const parsed = JSON.parse(json)
      if (options.compact) {
        return JSON.stringify(parsed)
      }
      return JSON.stringify(parsed, null, options.indent)
    } catch {
      throw new Error('Invalid JSON')
    }
  }),
  copyToClipboard: vi.fn(() => Promise.resolve()),
  downloadFile: vi.fn(),
}))

// Mock the json-types module
vi.mock('@/web/components/tools/json/json-types', () => ({
  JsonFormatterProps: {},
  JsonFormatOptions: {},
}))

describe('JsonFormatter Component', () => {
  const mockOnFormat = vi.fn()
  const mockOnError = vi.fn()
  const sampleJson = '{"name":"test","value":123}'
  const formattedJson = '{\n  "name": "test",\n  "value": 123\n}'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders format options panel', () => {
    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    expect(screen.getByText('Format Options')).toBeInTheDocument()
    expect(screen.getByText('Show Settings')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /format json/i })).toBeInTheDocument()
  })

  it('shows/hides settings panel', async () => {
    const user = userEvent.setup()
    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Initially settings should be hidden
    expect(screen.queryByText('Indent Size:')).not.toBeInTheDocument()

    // Click to show settings
    await user.click(screen.getByText('Show Settings'))
    expect(screen.getByText('Indent Size:')).toBeInTheDocument()
    expect(screen.getByText('Hide Settings')).toBeInTheDocument()

    // Click to hide settings
    await user.click(screen.getByText('Hide Settings'))
    expect(screen.queryByText('Indent Size:')).not.toBeInTheDocument()
    expect(screen.getByText('Show Settings')).toBeInTheDocument()
  })

  it('formats JSON when format button is clicked', async () => {
    const user = userEvent.setup()
    const { formatJson } = await import('@/web/components/tools/json/json-utils')

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    expect(formatJson).toHaveBeenCalledWith(sampleJson, expect.any(Object))
    expect(mockOnFormat).toHaveBeenCalledWith(formattedJson)
  })

  it('shows formatted output when formatting succeeds', async () => {
    const user = userEvent.setup()
    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    await waitFor(() => {
      expect(screen.getByText('Formatted Output')).toBeInTheDocument()
      expect(screen.getByText(formattedJson)).toBeInTheDocument()
    })
  })

  it('handles empty input', async () => {
    const user = userEvent.setup()
    render(<JsonFormatter input="" onFormat={mockOnFormat} onError={mockOnError} />)

    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    expect(mockOnError).toHaveBeenCalledWith('No input to format')
    expect(mockOnFormat).not.toHaveBeenCalled()
  })

  it('handles invalid JSON', async () => {
    const user = userEvent.setup()
    const { formatJson } = await import('@/web/components/tools/json/json-utils')

    render(<JsonFormatter input="invalid json" onFormat={mockOnFormat} onError={mockOnError} />)

    // Mock formatJson to throw an error
    ;(formatJson as any).mockImplementationOnce(() => {
      throw new Error('Invalid JSON')
    })

    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    expect(mockOnError).toHaveBeenCalledWith('Invalid JSON')
  })

  it('copies formatted output to clipboard', async () => {
    const user = userEvent.setup()
    const { copyToClipboard } = await import('@/web/components/tools/json/json-utils')

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // First format the JSON
    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    // Wait for formatted output to appear
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy/i })
    await user.click(copyButton)

    expect(copyToClipboard).toHaveBeenCalledWith(formattedJson)
  })

  it('downloads formatted JSON', async () => {
    const user = userEvent.setup()
    const { downloadFile } = await import('@/web/components/tools/json/json-utils')

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // First format the JSON
    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    // Wait for download button to appear
    await waitFor(() => {
      expect(screen.getByText('Download')).toBeInTheDocument()
    })

    // Click download button
    const downloadButton = screen.getByRole('button', { name: /download/i })
    await user.click(downloadButton)

    expect(downloadFile).toHaveBeenCalledWith(
      formattedJson,
      expect.stringMatching(/formatted-json-\d{4}-\d{2}-\d{2}\.json/),
      'application/json'
    )
  })

  it('adjusts indent size', async () => {
    const user = userEvent.setup()
    const { formatJson } = await import('@/web/components/tools/json/json-utils')

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Show settings
    await user.click(screen.getByText('Show Settings'))

    // Find and adjust indent slider
    const indentSlider = screen.getByRole('slider')
    await user.clear(indentSlider)
    await user.type(indentSlider, '4')

    // Format with new settings
    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    expect(formatJson).toHaveBeenCalledWith(
      sampleJson,
      expect.objectContaining({
        indent: 4,
      })
    )
  })

  it('toggles sort keys option', async () => {
    const user = userEvent.setup()
    const { formatJson } = await import('@/web/components/tools/json/json-utils')

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Show settings
    await user.click(screen.getByText('Show Settings'))

    // Find and toggle sort keys checkbox
    const sortKeysCheckbox = screen.getByLabelText('Alphabetically sort object keys')
    await user.click(sortKeysCheckbox)

    // Format with new settings
    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    expect(formatJson).toHaveBeenCalledWith(
      sampleJson,
      expect.objectContaining({
        sortKeys: true,
      })
    )
  })

  it('toggles compact mode', async () => {
    const user = userEvent.setup()
    const { formatJson } = await import('@/web/components/tools/json/json-utils')

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Show settings
    await user.click(screen.getByText('Show Settings'))

    // Find and toggle compact checkbox
    const compactCheckbox = screen.getByLabelText('Remove all whitespace')
    await user.click(compactCheckbox)

    // Format with new settings
    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    expect(formatJson).toHaveBeenCalledWith(
      sampleJson,
      expect.objectContaining({
        compact: true,
      })
    )
  })

  it('toggles trailing commas', async () => {
    const user = userEvent.setup()
    const { formatJson } = await import('@/web/components/tools/json/json-utils')

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Show settings
    await user.click(screen.getByText('Show Settings'))

    // Find and toggle trailing commas checkbox
    const trailingCommaCheckbox = screen.getByLabelText('Add trailing commas')
    await user.click(trailingCommaCheckbox)

    // Format with new settings
    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    expect(formatJson).toHaveBeenCalledWith(
      sampleJson,
      expect.objectContaining({
        trailingComma: true,
      })
    )
  })

  it('disables trailing commas when compact mode is enabled', async () => {
    const user = userEvent.setup()

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Show settings
    await user.click(screen.getByText('Show Settings'))

    // Enable compact mode
    const compactCheckbox = screen.getByLabelText('Remove all whitespace')
    await user.click(compactCheckbox)

    // Check if trailing commas checkbox is disabled
    const trailingCommaCheckbox = screen.getByLabelText('Add trailing commas')
    expect(trailingCommaCheckbox).toBeDisabled()
  })

  it('shows copy notification', async () => {
    const user = userEvent.setup()

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Format the JSON
    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    // Wait for copy button and click it
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument()
    })

    const copyButton = screen.getByRole('button', { name: /copy/i })
    await user.click(copyButton)

    // Should show notification
    await waitFor(() => {
      expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument()
    })

    // Notification should disappear after timeout
    await waitFor(
      () => {
        expect(screen.queryByText('Copied to clipboard!')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('displays line and character count', async () => {
    const user = userEvent.setup()

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Format the JSON
    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    await waitFor(() => {
      expect(screen.getByText(/\d+ lines, \d+ characters/)).toBeInTheDocument()
    })
  })

  it('applies custom className', () => {
    render(
      <JsonFormatter
        input={sampleJson}
        onFormat={mockOnFormat}
        onError={mockOnError}
        className="custom-formatter"
      />
    )

    const container = screen.getByText('Format Options').closest('div')
    expect(container).toHaveClass('custom-formatter')
  })

  it('disables format button when formatting', async () => {
    const user = userEvent.setup()

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    const formatButton = screen.getByRole('button', { name: /format json/i })
    await user.click(formatButton)

    // Button should be disabled during formatting
    expect(formatButton).toBeDisabled()
  })

  it('is accessible with keyboard navigation', async () => {
    const user = userEvent.setup()

    render(<JsonFormatter input={sampleJson} onFormat={mockOnFormat} onError={mockOnError} />)

    // Tab through interactive elements
    await user.tab()
    expect(screen.getByRole('button', { name: /format json/i })).toHaveFocus()

    await user.tab()
    // Should focus on settings toggle
  })
})
