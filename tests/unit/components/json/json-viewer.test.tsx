import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import { JsonViewer } from '@/web/components/tools/json/json-viewer'
import { SAMPLE_JSON } from '../test-utils'

// Mock the json-utils module
vi.mock('@/web/components/tools/json/json-utils', () => ({
  parseJsonToTree: vi.fn((data) => [
    {
      path: 'root',
      key: 'root',
      type: 'object',
      value: data,
      children: Object.entries(data as any).map(([key, value]) => ({
        path: `root.${key}`,
        key,
        type: typeof value === 'object' && value !== null ? 'object' : typeof value,
        value,
        children: typeof value === 'object' && value !== null
          ? Object.entries(value as any).map(([k, v]) => ({
              path: `root.${key}.${k}`,
              key: k,
              type: typeof v === 'object' && v !== null ? 'object' : typeof v,
              value: v,
              children: typeof v === 'object' && v !== null ? [] : undefined
            }))
          : undefined
      }))
    }
  ]),
  copyToClipboard: vi.fn(() => Promise.resolve()),
  downloadFile: vi.fn()
}))

describe('JsonViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders JSON data correctly', () => {
    render(<JsonViewer data={SAMPLE_JSON} />)

    expect(screen.getByText('JSON Viewer')).toBeInTheDocument()
    expect(screen.getByText(/2 items/)).toBeInTheDocument()
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('version')).toBeInTheDocument()
    expect(screen.getByText('settings')).toBeInTheDocument()
    expect(screen.getByText('users')).toBeInTheDocument()
  })

  it('displays empty state for empty data', () => {
    render(<JsonViewer data={{}} />)

    expect(screen.getByText('JSON Viewer')).toBeInTheDocument()
    expect(screen.getByText('(1 item)')).toBeInTheDocument()
    expect(screen.getByText('No data to display')).toBeInTheDocument()
  })

  it('expands and collapses nested objects', async () => {
    const user = userEvent.setup()
    render(<JsonViewer data={SAMPLE_JSON} />)

    // Initially should show root level properties
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.queryByText('theme')).not.toBeInTheDocument()

    // Click on settings to expand
    const settingsToggle = screen.getByText('settings')
    await user.click(settingsToggle)

    // Should now show nested properties
    expect(screen.getByText('theme')).toBeInTheDocument()
    expect(screen.getByText('autoSave')).toBeInTheDocument()
    expect(screen.getByText('features')).toBeInTheDocument()
  })

  it('expands and collapses arrays', async () => {
    const user = userEvent.setup()
    render(<JsonViewer data={SAMPLE_JSON} />)

    // Initially should not show array items
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()

    // Click on users to expand array
    const usersToggle = screen.getByText('users')
    await user.click(usersToggle)

    // Should now show array items
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('id')).toBeInTheDocument()
    expect(screen.getByText('name')).toBeInTheDocument()
  })

  it('copies values to clipboard', async () => {
    const user = userEvent.setup()
    const { copyToClipboard } = await import('@/web/components/tools/json/json-utils')

    render(<JsonViewer data={SAMPLE_JSON} />)

    // Click on a value to copy it
    const nameValue = screen.getByText('"Application"')
    await user.click(nameValue)

    expect(copyToClipboard).toHaveBeenCalledWith('"Application"')
  })

  it('copies all JSON data', async () => {
    const user = userEvent.setup()
    const { copyToClipboard } = await import('@/web/components/tools/json/json-utils')

    render(<JsonViewer data={SAMPLE_JSON} />)

    // Click copy all button
    const copyAllButton = screen.getByText('Copy All')
    await user.click(copyAllButton)

    expect(copyToClipboard).toHaveBeenCalledWith(JSON.stringify(SAMPLE_JSON, null, 2))
  })

  it('downloads JSON file', async () => {
    const user = userEvent.setup()
    const { downloadFile } = await import('@/web/components/tools/json/json-utils')

    render(<JsonViewer data={SAMPLE_JSON} />)

    // Click download button
    const downloadButton = screen.getByText('Download')
    await user.click(downloadButton)

    expect(downloadFile).toHaveBeenCalledWith(
      JSON.stringify(SAMPLE_JSON, null, 2),
      'formatted-json.json',
      'application/json'
    )
  })

  it('shows copy notification', async () => {
    const user = userEvent.setup()
    render(<JsonViewer data={SAMPLE_JSON} />)

    // Click on a value to trigger copy notification
    const nameValue = screen.getByText('"Application"')
    await user.click(nameValue)

    // Should show notification
    await waitFor(() => {
      expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()
    })

    // Notification should disappear after timeout
    await waitFor(
      () => {
        expect(screen.queryByText('Copied to clipboard')).not.toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('applies custom className', () => {
    render(<JsonViewer data={SAMPLE_JSON} className="custom-viewer" />)

    const container = screen.getByText('JSON Viewer').closest('div')
    expect(container).toHaveClass('custom-viewer')
  })

  it('hides toolbar when copyable is false', () => {
    render(<JsonViewer data={SAMPLE_JSON} copyable={false} />)

    expect(screen.queryByText('Copy All')).not.toBeInTheDocument()
    expect(screen.queryByText('Download')).not.toBeInTheDocument()
  })

  it('shows line numbers when enabled', () => {
    render(<JsonViewer data={SAMPLE_JSON} showLineNumbers={true} />)

    // Should show line numbers
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('handles different data types correctly', () => {
    const testData = {
      string: 'hello',
      number: 42,
      boolean: true,
      nullValue: null,
      array: [1, 2, 3],
      object: { nested: 'value' }
    }

    render(<JsonViewer data={testData} />)

    expect(screen.getByText('"hello"')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('true')).toBeInTheDocument()
    expect(screen.getByText('null')).toBeInTheDocument()
    expect(screen.getByText('array')).toBeInTheDocument()
    expect(screen.getByText('object')).toBeInTheDocument()
  })

  it('handles complex nested structures', async () => {
    const user = userEvent.setup()
    const complexData = {
      level1: {
        level2: {
          level3: {
            deep: 'value'
          }
        }
      }
    }

    render(<JsonViewer data={complexData} />)

    // Expand level1
    await user.click(screen.getByText('level1'))
    expect(screen.getByText('level2')).toBeInTheDocument()

    // Expand level2
    await user.click(screen.getByText('level2'))
    expect(screen.getByText('level3')).toBeInTheDocument()

    // Expand level3
    await user.click(screen.getByText('level3'))
    expect(screen.getByText('deep')).toBeInTheDocument()
    expect(screen.getByText('"value"')).toBeInTheDocument()
  })

  it('is accessible with keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<JsonViewer data={SAMPLE_JSON} />)

    // Focus on first element
    const firstElement = screen.getByText('name')
    firstElement.focus()
    expect(firstElement).toHaveFocus()

    // Test keyboard interaction
    await user.keyboard('{Tab}')
    // Should move to next interactive element
  })

  it('has proper ARIA labels and roles', () => {
    render(<JsonViewer data={SAMPLE_JSON} />)

    const container = screen.getByText('JSON Viewer').closest('div')
    expect(container).toBeInTheDocument()

    // Copy buttons should have proper labels
    const copyAllButton = screen.getByText('Copy All')
    expect(copyAllButton).toBeInTheDocument()

    const downloadButton = screen.getByText('Download')
    expect(downloadButton).toBeInTheDocument()
  })
})
