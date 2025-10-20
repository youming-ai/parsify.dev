import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test-utils'
import { MainLayout } from '@/web/components/layout/main-layout'

// Mock the layout components
vi.mock('@/web/components/layout/header', () => ({
  Header: () => <header data-testid="header">Header</header>
}))

vi.mock('@/web/components/layout/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>
}))

vi.mock('@/web/components/layout/footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>
}))

describe('MainLayout Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders layout without sidebar by default', () => {
    render(
      <MainLayout>
        <main data-testid="main-content">Main Content</main>
      </MainLayout>
    )

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('renders layout with sidebar when showSidebar is true', () => {
    render(
      <MainLayout showSidebar={true}>
        <main data-testid="main-content">Main Content</main>
      </MainLayout>
    )

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('main-content')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('applies correct CSS classes without sidebar', () => {
    render(
      <MainLayout>
        <main data-testid="main-content">Main Content</main>
      </MainLayout>
    )

    const container = screen.getByTestId('header').parentElement
    expect(container).toHaveClass('min-h-screen', 'bg-background')

    const mainContainer = screen.getByTestId('main-content').parentElement
    expect(mainContainer).toHaveClass('flex-1')
    expect(mainContainer).not.toHaveClass('md:ml-64')
  })

  it('applies correct CSS classes with sidebar', () => {
    render(
      <MainLayout showSidebar={true}>
        <main data-testid="main-content">Main Content</main>
      </MainLayout>
    )

    const mainContainer = screen.getByTestId('main-content').parentElement
    expect(mainContainer).toHaveClass('flex-1', 'md:ml-64')
  })

  it('renders multiple children correctly', () => {
    render(
      <MainLayout>
        <section data-testid="section-1">Section 1</section>
        <section data-testid="section-2">Section 2</section>
        <section data-testid="section-3">Section 3</section>
      </MainLayout>
    )

    expect(screen.getByTestId('section-1')).toBeInTheDocument()
    expect(screen.getByTestId('section-2')).toBeInTheDocument()
    expect(screen.getByTestId('section-3')).toBeInTheDocument()
  })

  it('renders complex nested children', () => {
    render(
      <MainLayout>
        <div data-testid="complex-content">
          <h1>Title</h1>
          <p>Paragraph content</p>
          <div>
            <span>Nested content</span>
          </div>
        </div>
      </MainLayout>
    )

    expect(screen.getByTestId('complex-content')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Paragraph content')).toBeInTheDocument()
    expect(screen.getByText('Nested content')).toBeInTheDocument()
  })

  it('maintains correct DOM structure', () => {
    render(
      <MainLayout showSidebar={true}>
        <main data-testid="main-content">Content</main>
      </MainLayout>
    )

    const container = screen.getByTestId('header').parentElement
    const header = screen.getByTestId('header')
    const flexContainer = header.nextElementSibling
    const sidebar = screen.getByTestId('sidebar')
    const mainElement = screen.getByTestId('main-content').parentElement

    expect(container).toBeInTheDocument()
    expect(header).toBeInTheDocument()
    expect(flexContainer).toHaveClass('flex')
    expect(sidebar).toBeInTheDocument()
    expect(mainElement).toBeInTheDocument()
  })

  it('has proper semantic HTML structure', () => {
    render(
      <MainLayout>
        <main role="main">Main Content</main>
      </MainLayout>
    )

    const header = screen.getByRole('banner')
    const main = screen.getByRole('main')
    const footer = screen.getByRole('contentinfo')

    expect(header).toBeInTheDocument()
    expect(main).toBeInTheDocument()
    expect(footer).toBeInTheDocument()
  })

  it('handles empty children gracefully', () => {
    render(<MainLayout />)

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('handles null children gracefully', () => {
    render(<MainLayout>{null}</MainLayout>)

    expect(screen.getByTestId('header')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('preserves child component props and event handlers', () => {
    const handleClick = vi.fn()
    render(
      <MainLayout>
        <button data-testid="interactive-child" onClick={handleClick}>
          Click me
        </button>
      </MainLayout>
    )

    const button = screen.getByTestId('interactive-child')
    button.click()
    expect(handleClick).toHaveBeenCalled()
  })

  it('supports conditional sidebar rendering', () => {
    const { rerender } = render(
      <MainLayout showSidebar={false}>
        <main>Content</main>
      </MainLayout>
    )

    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()

    rerender(
      <MainLayout showSidebar={true}>
        <main>Content</main>
      </MainLayout>
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('is accessible with proper ARIA structure', () => {
    render(
      <MainLayout showSidebar={true}>
        <main role="main" aria-label="Main content">
          Content
        </main>
      </MainLayout>
    )

    // Check for proper landmark roles
    expect(screen.getByRole('banner')).toBeInTheDocument() // Header
    expect(screen.getByRole('main')).toBeInTheDocument() // Main content
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // Footer

    // Sidebar should be present and accessible
    const sidebar = screen.getByTestId('sidebar')
    expect(sidebar).toBeInTheDocument()
  })

  it('handles responsive design classes correctly', () => {
    render(
      <MainLayout showSidebar={true}>
        <main>Content</main>
      </MainLayout>
    )

    const mainElement = screen.getByText('Content').parentElement
    expect(mainElement).toHaveClass('md:ml-64') // Responsive margin for sidebar
  })

  it('wraps children in main element with proper structure', () => {
    render(
      <MainLayout>
        <div data-testid="child-content">Child Content</div>
      </MainLayout>
    )

    const childContent = screen.getByTestId('child-content')
    const parentMain = childContent.parentElement

    expect(parentMain).toHaveClass('flex-1')
    expect(parentMain).toContainElement(screen.getByTestId('footer'))
  })

  it('maintains layout consistency with different content types', () => {
    const { rerender } = render(
      <MainLayout>
        <text data-testid="text-content">Simple text</text>
      </MainLayout>
    )

    expect(screen.getByTestId('text-content')).toBeInTheDocument()

    rerender(
      <MainLayout>
        <div data-testid="div-content">Div content</div>
      </MainLayout>
    )

    expect(screen.getByTestId('div-content')).toBeInTheDocument()

    rerender(
      <MainLayout>
        <>
          <span data-testid="fragment-1">Fragment 1</span>
          <span data-testid="fragment-2">Fragment 2</span>
        </>
      </MainLayout>
    )

    expect(screen.getByTestId('fragment-1')).toBeInTheDocument()
    expect(screen.getByTestId('fragment-2')).toBeInTheDocument()
  })
})
