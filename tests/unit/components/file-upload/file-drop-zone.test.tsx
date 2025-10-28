import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FileDropZone } from '@/web/components/file-upload/file-drop-zone'
import { render } from '../test-utils'

describe('FileDropZone Component', () => {
  const mockOnDrop = vi.fn()
  const mockOnFilesSelected = vi.fn()
  const mockOnDragOver = vi.fn()
  const mockOnDragLeave = vi.fn()

  const mockFile = new File(['test content'], 'test.txt', {
    type: 'text/plain',
  })
  const mockJsonFile = new File(['{"key": "value"}'], 'test.json', {
    type: 'application/json',
  })
  const mockLargeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', {
    type: 'text/plain',
  }) // 11MB

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders default drop zone', () => {
    render(<FileDropZone />)

    expect(screen.getByText('Drag & drop files here')).toBeInTheDocument()
    expect(screen.getByText('or click to browse')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Select Files' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'File upload drop zone' })).toBeInTheDocument()
  })

  it('renders custom children when provided', () => {
    render(
      <FileDropZone>
        <div data-testid="custom-content">Custom Drop Content</div>
      </FileDropZone>
    )

    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    expect(screen.queryByText('Drag & drop files here')).not.toBeInTheDocument()
  })

  it('handles file input click', async () => {
    const user = userEvent.setup()
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })
    await user.click(dropZone)

    // Should trigger file input click
    const fileInput = screen.getByRole('button', { name: 'File input' })
    expect(fileInput).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<FileDropZone />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })
    dropZone.focus()

    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'File input' })).toBeInTheDocument()

    await user.keyboard(' ') // Space key
    expect(screen.getByRole('button', { name: 'File input' })).toBeInTheDocument()
  })

  it('handles drag over events', () => {
    render(<FileDropZone onDragOver={mockOnDragOver} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.dragOver(dropZone, {
      dataTransfer: {
        files: [mockFile],
      },
    })

    expect(mockOnDragOver).toHaveBeenCalled()
    expect(screen.getByText('Drop files here')).toBeInTheDocument()
    expect(dropZone).toHaveClass('border-blue-500', 'bg-blue-50')
  })

  it('handles drag enter events', () => {
    render(<FileDropZone />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.dragEnter(dropZone, {
      dataTransfer: {
        files: [mockFile],
      },
    })

    expect(dropZone).toHaveClass('border-blue-500')
  })

  it('handles drag leave events', () => {
    render(<FileDropZone onDragLeave={mockOnDragLeave} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    // First trigger drag over to activate state
    fireEvent.dragOver(dropZone)

    // Then drag leave
    fireEvent.dragLeave(dropZone)

    expect(mockOnDragLeave).toHaveBeenCalled()
    expect(dropZone).not.toHaveClass('border-blue-500')
    expect(screen.getByText('Drag & drop files here')).toBeInTheDocument()
  })

  it('handles file drop events', () => {
    render(<FileDropZone onDrop={mockOnDrop} onFilesSelected={mockOnFilesSelected} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile],
      },
    })

    expect(mockOnDrop).toHaveBeenCalledWith([mockFile])
    expect(mockOnFilesSelected).toHaveBeenCalledWith([mockFile])
  })

  it('filters files by accept criteria', () => {
    render(
      <FileDropZone
        accept={['.json', 'application/json']}
        onDrop={mockOnDrop}
        onFilesSelected={mockOnFilesSelected}
      />
    )

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile, mockJsonFile], // Only JSON file should be accepted
      },
    })

    expect(mockOnDrop).toHaveBeenCalledWith([mockJsonFile])
    expect(mockOnFilesSelected).toHaveBeenCalledWith([mockJsonFile])
  })

  it('filters files by size limit', () => {
    render(
      <FileDropZone
        maxSize={10 * 1024 * 1024} // 10MB limit
        onDrop={mockOnDrop}
        onFilesSelected={mockOnFilesSelected}
      />
    )

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile, mockLargeFile], // Large file should be filtered out
      },
    })

    expect(mockOnDrop).toHaveBeenCalledWith([mockFile])
    expect(mockOnFilesSelected).toHaveBeenCalledWith([mockFile])
  })

  it('handles multiple files when multiple is true', () => {
    render(
      <FileDropZone multiple={true} onDrop={mockOnDrop} onFilesSelected={mockOnFilesSelected} />
    )

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile, mockJsonFile],
      },
    })

    expect(mockOnDrop).toHaveBeenCalledWith([mockFile, mockJsonFile])
    expect(mockOnFilesSelected).toHaveBeenCalledWith([mockFile, mockJsonFile])
  })

  it('handles single file when multiple is false', () => {
    render(
      <FileDropZone multiple={false} onDrop={mockOnDrop} onFilesSelected={mockOnFilesSelected} />
    )

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile, mockJsonFile],
      },
    })

    expect(mockOnDrop).toHaveBeenCalledWith([mockFile]) // Only first file
    expect(mockOnFilesSelected).toHaveBeenCalledWith([mockFile])
  })

  it('handles file input selection', async () => {
    const _user = userEvent.setup()
    render(<FileDropZone onFilesSelected={mockOnFilesSelected} />)

    const fileInput = screen.getByRole('button', { name: 'File input' })

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    })

    expect(mockOnFilesSelected).toHaveBeenCalledWith([mockFile])
  })

  it('resets file input value after selection', async () => {
    const _user = userEvent.setup()
    render(<FileDropZone />)

    const fileInput = screen.getByRole('button', { name: 'File input' })

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    })

    expect(fileInput).toHaveValue('')
  })

  it('displays accepted file types', () => {
    render(<FileDropZone accept={['.json', '.txt']} />)

    expect(screen.getByText('Accepted formats: .json, .txt')).toBeInTheDocument()
  })

  it('displays max file size', () => {
    render(<FileDropZone maxSize={5 * 1024 * 1024} />) // 5MB

    expect(screen.getByText('Max file size: 5 MB')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<FileDropZone className="custom-drop-zone" />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })
    expect(dropZone).toHaveClass('custom-drop-zone')
  })

  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'red' }
    render(<FileDropZone style={customStyle} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })
    expect(dropZone).toHaveStyle('background-color: red')
  })

  it('disables drop zone when disabled prop is true', () => {
    render(<FileDropZone disabled />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })
    expect(dropZone).toHaveAttribute('aria-disabled', 'true')
    expect(dropZone).toHaveAttribute('tabIndex', '-1')
    expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed')

    const fileInput = screen.getByRole('button', { name: 'File input' })
    expect(fileInput).toBeDisabled()
  })

  it('prevents drop when disabled', () => {
    render(<FileDropZone disabled onDrop={mockOnDrop} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [mockFile],
      },
    })

    expect(mockOnDrop).not.toHaveBeenCalled()
  })

  it('prevents drag events when disabled', () => {
    render(<FileDropZone disabled onDragOver={mockOnDragOver} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.dragOver(dropZone, {
      dataTransfer: {
        files: [mockFile],
      },
    })

    expect(dropZone).not.toHaveClass('border-blue-500')
    expect(screen.getByText('Drag & drop files here')).toBeInTheDocument()
  })

  it('prevents click when disabled', async () => {
    const user = userEvent.setup()
    render(<FileDropZone disabled />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })
    await user.click(dropZone)

    // Should not trigger file input
    expect(screen.getByRole('button', { name: 'File input' })).toBeDisabled()
  })

  it('handles empty drop', () => {
    render(<FileDropZone onDrop={mockOnDrop} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
      },
    })

    expect(mockOnDrop).not.toHaveBeenCalled()
  })

  it("handles files that don't pass validation", () => {
    render(
      <FileDropZone
        accept={['.json']}
        maxSize={1024} // 1KB
        onDrop={mockOnDrop}
        onFilesSelected={mockOnFilesSelected}
      />
    )

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    // File that doesn't match accept criteria and is too large
    const invalidFile = new File(['x'.repeat(2048)], 'test.txt', {
      type: 'text/plain',
    })

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [invalidFile],
      },
    })

    expect(mockOnDrop).not.toHaveBeenCalled()
    expect(mockOnFilesSelected).not.toHaveBeenCalled()
  })

  it('has proper accessibility attributes', () => {
    render(<FileDropZone disabled={false} />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })
    expect(dropZone).toHaveAttribute('tabIndex', '0')
    expect(dropZone).toHaveAttribute('aria-label', 'File upload drop zone')
    expect(dropZone).toHaveAttribute('aria-disabled', 'false')
  })

  it('stops event propagation', () => {
    render(<FileDropZone />)

    const dropZone = screen.getByRole('button', {
      name: 'File upload drop zone',
    })

    const dragOverEvent = fireEvent.dragOver(dropZone, {
      dataTransfer: { files: [mockFile] },
    })

    const dropEvent = fireEvent.drop(dropZone, {
      dataTransfer: { files: [mockFile] },
    })

    // Events should have been prevented from default behavior
    expect(dragOverEvent?.defaultPrevented).toBe(true)
    expect(dropEvent?.defaultPrevented).toBe(true)
  })
})
