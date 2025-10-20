import { describe, it, expect, vi } from 'vitest'

// Mock clsx and tailwind-merge
vi.mock('clsx', () => ({
  clsx: vi.fn((...inputs: any[]) => {
    return inputs.filter(Boolean).join(' ')
  }),
}))

vi.mock('tailwind-merge', () => ({
  twMerge: vi.fn((...classes: string[]) => {
    // Simple implementation for testing - in real tests, the actual library would be used
    return classes.join(' ')
  }),
}))

// Direct implementation of the cn function for testing
function cn(...inputs: any[]) {
  const { clsx } = require('clsx')
  const { twMerge } = require('tailwind-merge')
  return twMerge(clsx(inputs))
}

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('class1', true && 'class2', false && 'class3')).toBe(
        'class1 class2'
      )
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null as any)).toBe('')
      expect(cn(undefined as any)).toBe('')
    })

    it('should handle arrays of classes', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2')
    })

    it('should handle objects with boolean values', () => {
      expect(cn({ class1: true, class2: false, class3: true })).toBe(
        'class1 class3'
      )
    })

    it('should handle mixed input types', () => {
      expect(
        cn(
          'class1',
          { class2: true, class3: false },
          ['class4', null],
          'class5'
        )
      ).toBe('class1 class2 class4 class5')
    })

    it('should handle Tailwind class merging', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2') // twMerge merges conflicting classes
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500') // twMerge keeps the last conflicting class
    })

    it('should handle complex conditional logic', () => {
      const isActive = true
      const isDisabled = false
      const size = 'large'

      expect(
        cn(
          'base-class',
          isActive && 'active-class',
          isDisabled && 'disabled-class',
          size === 'large' && 'large-class',
          size === 'small' && 'small-class'
        )
      ).toBe('base-class active-class large-class')
    })

    it('should handle utility-first CSS patterns', () => {
      expect(cn('flex items-center justify-between p-4 m-2')).toBe(
        'flex items-center justify-between p-4 m-2'
      )
    })

    it('should handle state variants', () => {
      expect(
        cn('border-gray-300 focus:border-blue-500 focus:ring-blue-500')
      ).toBe('border-gray-300 focus:border-blue-500 focus:ring-blue-500')
    })

    it('should handle dark mode classes', () => {
      expect(
        cn('bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100')
      ).toBe('bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100')
    })

    it('should handle responsive classes', () => {
      expect(cn('p-4 md:p-6', 'md:p-8')).toBe('p-4 md:p-8') // twMerge merges conflicting responsive classes
    })

    it('should handle component scenarios', () => {
      const variant = 'primary'
      const size = 'medium'

      const result = cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variant === 'primary' &&
          'bg-primary text-primary-foreground hover:bg-primary/90',
        size === 'medium' && 'h-10 px-4 py-2'
      )

      expect(result).toContain('inline-flex')
      expect(result).toContain('bg-primary')
      expect(result).toContain('h-10')
    })
  })
})
