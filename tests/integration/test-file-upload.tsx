import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FileSelector } from '../../src/components/FileSelector/FileSelector'

// Mock File API
global.File = class File {
  name: string
  size: number
  type: string
  content: string

  constructor(chunks: string[], filename: string, options: { type: string }) {
    this.name = filename
    this.size = chunks[0].length
    this.type = options.type
    this.content = chunks[0]
  }
} as any

global.FileReader = class FileReader {
  result: string | null = null
  error: any = null
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  readAsText(file: any) {
    setTimeout(() => {
      if (this.onload) {
        this.result = (file as any).content
        this.onload({ target: this })
      }
    }, 0)
  }
} as any

describe('File Upload Workflow Integration', () => {
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
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  it('should handle successful file upload and validation', async () => {
    renderWithQuery(<FileSelector onFileSelect={vi.fn()} />)

    const fileInput = screen.getByLabelText(/select file/i)
    const validFile = new global.File(
      ['{"name": "test", "value": 123}'],
      'test.md',
      { type: 'text/markdown' }
    )

    await user.upload(fileInput, validFile)

    // Should show loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Should show success state after processing
    await waitFor(() => {
      expect(screen.getByText(/file loaded successfully/i)).toBeInTheDocument()
    })
  })

  it('should display error for oversized files', async () => {
    renderWithQuery(<FileSelector onFileSelect={vi.fn()} />)

    const fileInput = screen.getByLabelText(/select file/i)
    const largeFile = new global.File(
      ['x'.repeat(2 * 1024 * 1024)], // 2MB
      'large.md',
      { type: 'text/markdown' }
    )

    await user.upload(fileInput, largeFile)

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument()
      expect(screen.getByText(/maximum size is 1mb/i)).toBeInTheDocument()
    })
  })

  it('should handle unsupported file types', async () => {
    renderWithQuery(<FileSelector onFileSelect={vi.fn()} />)

    const fileInput = screen.getByLabelText(/select file/i)
    const unsupportedFile = new global.File(
      ['some content'],
      'test.exe',
      { type: 'application/octet-stream' }
    )

    await user.upload(fileInput, unsupportedFile)

    await waitFor(() => {
      expect(screen.getByText(/unsupported file format/i)).toBeInTheDocument()
      expect(screen.getByText(/please use .md or .txt files/i)).toBeInTheDocument()
    })
  })

  it('should support drag and drop functionality', async () => {
    renderWithQuery(<FileSelector onFileSelect={vi.fn()} />)

    const dropZone = screen.getByTestId(/drop-zone/i)
    const validFile = new global.File(
      ['{"test": true}'],
      'test.md',
      { type: 'text/markdown' }
    )

    // Simulate drag and drop
    fireEvent.dragEnter(dropZone)
    fireEvent.dragOver(dropZone)
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [validFile],
      },
    })

    await waitFor(() => {
      expect(screen.getByText(/file loaded successfully/i)).toBeInTheDocument()
    })
  })
})