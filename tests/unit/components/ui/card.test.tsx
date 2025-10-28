import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/web/components/ui/card'
import { render } from '../test-utils'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card with default styles', () => {
      render(<Card>Card content</Card>)
      const card = screen.getByText('Card content')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'border-gray-200',
        'bg-white',
        'text-gray-900',
        'shadow-sm'
      )
    })

    it('applies custom className', () => {
      render(<Card className="custom-card">Card content</Card>)
      const card = screen.getByText('Card content')
      expect(card).toHaveClass('custom-card')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<Card ref={ref}>Card content</Card>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('handles all div HTML attributes', () => {
      render(
        <Card data-testid="test-card" role="article" aria-label="Test Card">
          Card content
        </Card>
      )

      const card = screen.getByTestId('test-card')
      expect(card).toHaveAttribute('role', 'article')
      expect(card).toHaveAttribute('aria-label', 'Test Card')
    })
  })

  describe('CardHeader', () => {
    it('renders header with default styles', () => {
      render(<CardHeader>Header content</CardHeader>)
      const header = screen.getByText('Header content')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    it('applies custom className', () => {
      render(<CardHeader className="custom-header">Header content</CardHeader>)
      const header = screen.getByText('Header content')
      expect(header).toHaveClass('custom-header')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<CardHeader ref={ref}>Header content</CardHeader>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardTitle', () => {
    it('renders title as h3 with default styles', () => {
      render(<CardTitle>Card Title</CardTitle>)
      const title = screen.getByRole('heading', {
        level: 3,
        name: 'Card Title',
      })
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight')
    })

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Card Title</CardTitle>)
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveClass('custom-title')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<CardTitle ref={ref}>Card Title</CardTitle>)
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
    })

    it('handles accessibility attributes', () => {
      render(
        <CardTitle id="title-id" aria-describedby="desc-id">
          Card Title
        </CardTitle>
      )
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toHaveAttribute('id', 'title-id')
      expect(title).toHaveAttribute('aria-describedby', 'desc-id')
    })
  })

  describe('CardDescription', () => {
    it('renders description with default styles', () => {
      render(<CardDescription>Card description</CardDescription>)
      const description = screen.getByText('Card description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'text-gray-600')
    })

    it('applies custom className', () => {
      render(<CardDescription className="custom-desc">Card description</CardDescription>)
      const description = screen.getByText('Card description')
      expect(description).toHaveClass('custom-desc')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<CardDescription ref={ref}>Card description</CardDescription>)
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement)
    })
  })

  describe('CardContent', () => {
    it('renders content with default styles', () => {
      render(<CardContent>Card content</CardContent>)
      const content = screen.getByText('Card content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    it('applies custom className', () => {
      render(<CardContent className="custom-content">Card content</CardContent>)
      const content = screen.getByText('Card content')
      expect(content).toHaveClass('custom-content')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<CardContent ref={ref}>Card content</CardContent>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('CardFooter', () => {
    it('renders footer with default styles', () => {
      render(<CardFooter>Footer content</CardFooter>)
      const footer = screen.getByText('Footer content')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    it('applies custom className', () => {
      render(<CardFooter className="custom-footer">Footer content</CardFooter>)
      const footer = screen.getByText('Footer content')
      expect(footer).toHaveClass('custom-footer')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      render(<CardFooter ref={ref}>Footer content</CardFooter>)
      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('Complete Card Composition', () => {
    it('renders complete card structure', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      )

      const card = screen.getByTestId('complete-card')
      const title = screen.getByRole('heading', { name: 'Test Title' })
      const description = screen.getByText('Test Description')
      const content = screen.getByText('Card content goes here')
      const footer = screen.getByText('Action')

      expect(card).toBeInTheDocument()
      expect(title).toBeInTheDocument()
      expect(description).toBeInTheDocument()
      expect(content).toBeInTheDocument()
      expect(footer).toBeInTheDocument()
    })

    it('maintains proper semantic structure', () => {
      render(
        <Card role="article">
          <CardHeader>
            <CardTitle>Article Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Article content</p>
          </CardContent>
        </Card>
      )

      const card = screen.getByRole('article')
      const title = screen.getByRole('heading', { level: 3 })

      expect(card).toContainElement(title)
      expect(screen.getByText('Article content')).toBeInTheDocument()
    })

    it('supports keyboard navigation within card', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
          </CardHeader>
          <CardContent>
            <button>Action Button</button>
          </CardContent>
        </Card>
      )

      const button = screen.getByRole('button', { name: 'Action Button' })
      button.focus()
      expect(button).toHaveFocus()
    })

    it('is accessible with proper ARIA attributes', () => {
      render(
        <Card aria-labelledby="card-title" aria-describedby="card-desc">
          <CardHeader>
            <CardTitle id="card-title">Accessible Card</CardTitle>
            <CardDescription id="card-desc">Card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Content</p>
          </CardContent>
        </Card>
      )

      const card = screen.getByRole('generic')
      expect(card).toHaveAttribute('aria-labelledby', 'card-title')
      expect(card).toHaveAttribute('aria-describedby', 'card-desc')
    })
  })
})
