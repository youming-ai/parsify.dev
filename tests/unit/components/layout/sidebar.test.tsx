import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import { Sidebar } from '@/web/components/layout/sidebar'

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/tools/json/format',
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  FileJson: ({ className }: { className?: string }) => <div data-testid="file-json-icon" className={className} />,
  Code: ({ className }: { className?: string }) => <div data-testid="code-icon" className={className} />,
  Wrench: ({ className }: { className?: string }) => <div data-testid="wrench-icon" className={className} />,
  Hash: ({ className }: { className?: string }) => <div data-testid="hash-icon" className={className} />,
  FileText: ({ className }: { className?: string }) => <div data-testid="file-text-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <div data-testid="clock-icon" className={className} />,
  Star: ({ className }: { className?: string }) => <div data-testid="star-icon" className={className} />,
  ChevronDown: ({ className }: { className?: string }) => <div data-testid="chevron-down-icon" className={className} />,
  ChevronRight: ({ className }: { className?: string }) => <div data-testid="chevron-right-icon" className={className} />,
}))

// Mock UI components
vi.mock('@/web/components/ui/button', () => ({
  Button: ({ children, className, onClick, ...props }: any) => (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/web/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, className }: any) => (
    <div className={className} data-testid="scroll-area">
      {children}
    </div>
  ),
}))

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sidebar with header', () => {
    render(<Sidebar />)

    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tools' })).toHaveAttribute('href', '/')
  })

  it('renders quick access section', () => {
    render(<Sidebar />)

    expect(screen.getByText('Quick Access')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Recent Tools' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Favorites' })).toBeInTheDocument()
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    expect(screen.getByTestId('star-icon')).toBeInTheDocument()
  })

  it('renders tool categories', () => {
    render(<Sidebar />)

    expect(screen.getByText('JSON Tools')).toBeInTheDocument()
    expect(screen.getByText('Code Tools')).toBeInTheDocument()
    expect(screen.getByText('Text Tools')).toBeInTheDocument()
    expect(screen.getByTestId('file-json-icon')).toBeInTheDocument()
    expect(screen.getByTestId('code-icon')).toBeInTheDocument()
    expect(screen.getByTestId('file-text-icon')).toBeInTheDocument()
  })

  it('expands JSON Tools category by default', () => {
    render(<Sidebar />)

    expect(screen.getByText('JSON Formatter')).toBeInTheDocument()
    expect(screen.getByText('JSON Validator')).toBeInTheDocument()
    expect(screen.getByText('JSON Converter')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'JSON Formatter' })).toHaveAttribute('href', '/tools/json/format')
  })

  it('collapses and expands categories when clicked', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    // JSON Tools should be expanded by default
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument()

    // Click to collapse JSON Tools
    const jsonToolsButton = screen.getByRole('button', { name: /JSON Tools/ })
    await user.click(jsonToolsButton)

    // JSON Tools items should be hidden
    expect(screen.queryByText('JSON Formatter')).not.toBeInTheDocument()

    // Click to expand again
    await user.click(jsonToolsButton)

    // JSON Tools items should be visible again
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument()
  })

  it('expands other categories when clicked', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    // Code Tools should be collapsed by default
    expect(screen.queryByText('Code Formatter')).not.toBeInTheDocument()

    // Click to expand Code Tools
    const codeToolsButton = screen.getByRole('button', { name: /Code Tools/ })
    await user.click(codeToolsButton)

    // Code Tools items should be visible
    expect(screen.getByText('Code Formatter')).toBeInTheDocument()
    expect(screen.getByText('Code Executor')).toBeInTheDocument()
    expect(screen.getByText('Code Minifier')).toBeInTheDocument()
  })

  it('highlights active tool based on current pathname', () => {
    render(<Sidebar />)

    // Should highlight JSON Formatter as active
    const jsonFormatterLink = screen.getByRole('link', { name: 'JSON Formatter' })
    expect(jsonFormatterLink).toHaveClass('secondary')

    // Other tools should not be highlighted
    const jsonValidatorLink = screen.getByRole('link', { name: 'JSON Validator' })
    expect(jsonValidatorLink).not.toHaveClass('secondary')
  })

  it('shows chevron icons correctly for expanded/collapsed states', () => {
    render(<Sidebar />)

    // JSON Tools should show chevron down (expanded)
    const jsonToolsButton = screen.getByRole('button', { name: /JSON Tools/ })
    expect(jsonToolsButton).toContainElement(screen.getByTestId('chevron-down-icon'))

    // Code Tools should show chevron right (collapsed)
    const codeToolsButton = screen.getByRole('button', { name: /Code Tools/ })
    expect(codeToolsButton).toContainElement(screen.getByTestId('chevron-right-icon'))
  })

  it('renders pro features section', () => {
    render(<Sidebar />)

    expect(screen.getByText('Pro Features')).toBeInTheDocument()
    expect(screen.getByText('Unlock advanced tools and higher limits with our Pro plan.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upgrade Now' })).toHaveAttribute('href', '/pricing')
    expect(screen.getByTestId('hash-icon')).toBeInTheDocument()
  })

  it('handles upgrade button click', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const upgradeButton = screen.getByRole('link', { name: 'Upgrade Now' })
    await user.click(upgradeButton)

    expect(upgradeButton).toHaveAttribute('href', '/pricing')
  })

  it('shows tooltips on tool items', () => {
    render(<Sidebar />)

    const jsonFormatterLink = screen.getByRole('link', { name: 'JSON Formatter' })
    expect(jsonFormatterLink).toHaveAttribute('title', 'Format and prettify JSON data')
  })

  it('navigates to tools when clicked', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const jsonValidatorLink = screen.getByRole('link', { name: 'JSON Validator' })
    await user.click(jsonValidatorLink)

    expect(jsonValidatorLink).toHaveAttribute('href', '/tools/json/validate')
  })

  it('navigates to quick actions when clicked', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const recentToolsLink = screen.getByRole('link', { name: 'Recent Tools' })
    await user.click(recentToolsLink)

    expect(recentToolsLink).toHaveAttribute('href', '/tools/recent')
  })

  it('maintains expanded state across multiple categories', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    // Expand Code Tools
    const codeToolsButton = screen.getByRole('button', { name: /Code Tools/ })
    await user.click(codeToolsButton)

    // Expand Text Tools
    const textToolsButton = screen.getByRole('button', { name: /Text Tools/ })
    await user.click(textToolsButton)

    // All three categories should be expanded
    expect(screen.getByText('JSON Formatter')).toBeInTheDocument()
    expect(screen.getByText('Code Formatter')).toBeInTheDocument()
    expect(screen.getByText('Base64 Encoder')).toBeInTheDocument()
  })

  it('collapses only the clicked category', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    // Expand Code Tools first
    const codeToolsButton = screen.getByRole('button', { name: /Code Tools/ })
    await user.click(codeToolsButton)
    expect(screen.getByText('Code Formatter')).toBeInTheDocument()

    // Collapse JSON Tools (should not affect Code Tools)
    const jsonToolsButton = screen.getByRole('button', { name: /JSON Tools/ })
    await user.click(jsonToolsButton)

    expect(screen.queryByText('JSON Formatter')).not.toBeInTheDocument()
    expect(screen.getByText('Code Formatter')).toBeInTheDocument() // Should still be visible
  })

  it('has proper accessibility attributes', () => {
    render(<Sidebar />)

    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: 'Quick Access' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'JSON Tools' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Code Tools' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Text Tools' })).toBeInTheDocument()

    // Check for proper link accessibility
    const toolLinks = screen.getAllByRole('link')
    toolLinks.forEach(link => {
      expect(link).toHaveAttribute('href')
    })
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    // Tab to first interactive element
    await user.tab()
    expect(screen.getByRole('link', { name: 'Tools' })).toHaveFocus()

    // Continue tabbing through elements
    await user.tab()
    expect(screen.getByRole('link', { name: 'Recent Tools' })).toHaveFocus()

    // Should be able to activate buttons with Enter
    await user.keyboard('{Enter}')
    // Should trigger navigation
  })

  it('handles responsive design classes', () => {
    render(<Sidebar />)

    const sidebar = screen.getByText('Tools').closest('div')
    expect(sidebar).toHaveClass('hidden', 'md:block')
  })

  it('renders scroll area for content', () => {
    render(<Sidebar />)

    expect(screen.getByTestId('scroll-area')).toBeInTheDocument()
    expect(screen.getByTestId('scroll-area')).toHaveClass('flex-1', 'px-3', 'py-2')
  })

  it('maintains proper layout structure', () => {
    render(<Sidebar />)

    const sidebarContainer = screen.getByText('Tools').closest('.hidden')
    expect(sidebarContainer).toBeInTheDocument()

    const header = screen.getByText('Tools').closest('.flex')
    expect(header).toHaveClass('h-14', 'items-center', 'border-b')

    const scrollArea = screen.getByTestId('scroll-area')
    expect(scrollArea).toBeInTheDocument()
  })

  it('shows all tool items in JSON Tools category', () => {
    render(<Sidebar />)

    const jsonTools = [
      'JSON Formatter',
      'JSON Validator',
      'JSON Converter',
      'JSON Minifier',
      'JSON to CSV',
      'CSV to JSON'
    ]

    jsonTools.forEach(tool => {
      expect(screen.getByRole('link', { name: tool })).toBeInTheDocument()
    })
  })

  it('shows all tool items in Code Tools category when expanded', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    // Expand Code Tools
    const codeToolsButton = screen.getByRole('button', { name: /Code Tools/ })
    await user.click(codeToolsButton)

    const codeTools = [
      'Code Formatter',
      'Code Executor',
      'Code Minifier'
    ]

    codeTools.forEach(tool => {
      expect(screen.getByRole('link', { name: tool })).toBeInTheDocument()
    })
  })

  it('shows all tool items in Text Tools category when expanded', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    // Expand Text Tools
    const textToolsButton = screen.getByRole('button', { name: /Text Tools/ })
    await user.click(textToolsButton)

    const textTools = [
      'Base64 Encoder',
      'URL Encoder',
      'Hash Generator',
      'UUID Generator',
      'Timestamp Converter'
    ]

    textTools.forEach(tool => {
      expect(screen.getByRole('link', { name: tool })).toBeInTheDocument()
    })
  })
})
