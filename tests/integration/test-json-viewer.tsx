import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { JsonViewer } from '../../src/components/JsonViewer/JsonViewer'

describe('JSON Viewer Integration', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    user = userEvent.setup()
  })

  const renderWithQuery = (component: React.ReactElement) => {
    return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>)
  }

  const sampleJson = {
    name: 'Application',
    version: '1.0.0',
    settings: {
      theme: 'dark',
      autoSave: true,
      features: ['search', 'export', 'import'],
    },
    users: [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
    ],
  }

  it('should render JSON data in tree structure', () => {
    renderWithQuery(<JsonViewer data={sampleJson} />)

    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('"Application"')).toBeInTheDocument()
    expect(screen.getByText('version')).toBeInTheDocument()
    expect(screen.getByText('"1.0.0"')).toBeInTheDocument()
    expect(screen.getByText('settings')).toBeInTheDocument()
  })

  it('should expand and collapse nested objects', async () => {
    renderWithQuery(<JsonViewer data={sampleJson} />)

    const settingsToggle = screen.getByText('settings')
    expect(settingsToggle).toBeInTheDocument()

    // Initially collapsed
    expect(screen.queryByText('theme')).not.toBeInTheDocument()
    expect(screen.queryByText('"dark"')).not.toBeInTheDocument()

    // Click to expand
    await user.click(settingsToggle)

    // Should show nested properties
    expect(screen.getByText('theme')).toBeInTheDocument()
    expect(screen.getByText('"dark"')).toBeInTheDocument()
    expect(screen.getByText('autoSave')).toBeInTheDocument()
    expect(screen.getByText('true')).toBeInTheDocument()
  })

  it('should handle array expansion and collapse', async () => {
    renderWithQuery(<JsonViewer data={sampleJson} />)

    const usersToggle = screen.getByText('users')
    expect(usersToggle).toBeInTheDocument()

    // Initially collapsed
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()

    // Click to expand
    await user.click(usersToggle)

    // Should show array items
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('id')).toBeInTheDocument()
    expect(screen.getByText('name')).toBeInTheDocument()
  })

  it('should search and highlight matching nodes', async () => {
    renderWithQuery(<JsonViewer data={sampleJson} searchable={true} />)

    const searchInput = screen.getByPlaceholderText(/search json/i)
    await user.type(searchInput, 'alice')

    // Should highlight matching results
    expect(screen.getByText(/alice/i)).toBeInTheDocument()
    expect(screen.getByText(/1 match/i)).toBeInTheDocument()
  })

  it('should copy JSON path to clipboard', async () => {
    const mockWriteText = vi.fn()
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    })

    renderWithQuery(<JsonViewer data={sampleJson} />)

    // Expand settings first
    const settingsToggle = screen.getByText('settings')
    await user.click(settingsToggle)

    // Find copy button for theme property
    const themeCopyButton = screen.getByLabelText(/copy theme path/i)
    await user.click(themeCopyButton)

    expect(mockWriteText).toHaveBeenCalledWith('settings.theme')
  })

  it('should display raw JSON view', async () => {
    renderWithQuery(<JsonViewer data={sampleJson} />)

    const toggleButton = screen.getByText(/show raw/i)
    await user.click(toggleButton)

    expect(screen.getByText(/\{/)).toBeInTheDocument()
    expect(screen.getByText(/"name": "Application"/)).toBeInTheDocument()
    expect(screen.getByText(/"version": "1.0.0"/)).toBeInTheDocument()
  })

  it('should handle invalid JSON gracefully', () => {
    const invalidData = {
      valid: true,
      circular: null as any,
    }
    invalidData.circular = invalidData

    renderWithQuery(<JsonViewer data={invalidData} />)

    expect(screen.getByText(/circular reference detected/i)).toBeInTheDocument()
    expect(screen.getByText(/cannot display this value/i)).toBeInTheDocument()
  })

  it('should support keyboard navigation', async () => {
    renderWithQuery(<JsonViewer data={sampleJson} />)

    const firstNode = screen.getByText('name')
    firstNode.focus()

    // Arrow down navigation
    await user.keyboard('{ArrowDown}')
    expect(screen.getByText('version')).toHaveFocus()

    // Enter to expand/collapse
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowDown}')
    expect(screen.getByText('settings')).toHaveFocus()
  })
})
