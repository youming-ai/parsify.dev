import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '../test-utils'
import { AuthGuard, ProtectedRoute, GuestOnlyRoute, withAuth } from '@/web/components/auth/auth-guard'
import { createMockUser } from '../test-utils'

// Mock window.location
const mockLocation = { href: '' }
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('AuthGuard Component', () => {
  const mockChildren = <div data-testid="protected-content">Protected Content</div>
  const mockFallback = <div data-testid="fallback-content">Fallback Content</div>

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  describe('Basic AuthGuard functionality', () => {
    it('renders children when no auth requirements', () => {
      // Mock auth context with no requirements
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }))

      render(
        <AuthGuard>
          {mockChildren}
        </AuthGuard>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('renders loading state during authentication check', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: null,
          isLoading: true,
          isAuthenticated: false
        })
      }))

      render(
        <AuthGuard requireAuth>
          {mockChildren}
        </AuthGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('renders custom loading component when provided', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: null,
          isLoading: true,
          isAuthenticated: false
        })
      }))

      const customLoading = <div data-testid="custom-loading">Custom Loading</div>

      render(
        <AuthGuard requireAuth loadingComponent={customLoading}>
          {mockChildren}
        </AuthGuard>
      )

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument()
    })
  })

  describe('requireAuth functionality', () => {
    it('renders children when user is authenticated', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: createMockUser(),
          isLoading: false,
          isAuthenticated: true
        })
      }))

      render(
        <AuthGuard requireAuth>
          {mockChildren}
        </AuthGuard>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('redirects to login when user is not authenticated', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }))

      render(
        <AuthGuard requireAuth redirectTo="/custom-login">
          {mockChildren}
        </AuthGuard>
      )

      expect(mockLocation.href).toBe('/custom-login')
    })

    it('redirects to login with current path as redirect parameter', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }))

      // Mock current path
      Object.defineProperty(window, 'location', {
        value: { href: 'http://localhost:3000/dashboard', pathname: '/dashboard' },
        writable: true,
      })

      render(
        <AuthGuard requireAuth>
          {mockChildren}
        </AuthGuard>
      )

      expect(mockLocation.href).toContain('/login?redirect=%2Fdashboard')
    })

    it('renders fallback when provided and user is not authenticated', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }))

      render(
        <AuthGuard requireAuth fallback={mockFallback}>
          {mockChildren}
        </AuthGuard>
      )

      expect(screen.getByTestId('fallback-content')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('requireGuest functionality', () => {
    it('renders children when user is not authenticated', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }))

      render(
        <AuthGuard requireGuest>
          {mockChildren}
        </AuthGuard>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('redirects authenticated users away from guest-only routes', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: createMockUser(),
          isLoading: false,
          isAuthenticated: true
        })
      }))

      render(
        <AuthGuard requireGuest redirectTo="/dashboard">
          {mockChildren}
        </AuthGuard>
      )

      expect(mockLocation.href).toBe('/dashboard')
    })

    it('renders fallback for authenticated users when provided', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: createMockUser(),
          isLoading: false,
          isAuthenticated: true
        })
      }))

      render(
        <AuthGuard requireGuest fallback={mockFallback}>
          {mockChildren}
        </AuthGuard>
      )

      expect(screen.getByTestId('fallback-content')).toBeInTheDocument()
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('conflicting requirements', () => {
    it('prioritizes requireAuth over requireGuest when both are true and user is authenticated', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: createMockUser(),
          isLoading: false,
          isAuthenticated: true
        })
      }))

      render(
        <AuthGuard requireAuth requireGuest>
          {mockChildren}
        </AuthGuard>
      )

      // User is authenticated, requireAuth is satisfied, so children should render
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    it('prevents access when both are true and user is not authenticated', () => {
      vi.doMock('@/web/components/auth/auth-context', () => ({
        useAuth: () => ({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }))

      render(
        <AuthGuard requireAuth requireGuest>
          {mockChildren}
        </AuthGuard>
      )

      // User is not authenticated, requireAuth fails, should redirect
      expect(mockLocation.href).toContain('/login')
    })
  })
})

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  it('renders children for authenticated users', () => {
    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: createMockUser(),
        isLoading: false,
        isAuthenticated: true
      })
    }))

    render(
      <ProtectedRoute>
        <div data-testid="protected-route-content">Protected Route</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-route-content')).toBeInTheDocument()
  })

  it('redirects unauthenticated users', () => {
    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }))

    render(
      <ProtectedRoute redirectTo="/signin">
        <div data-testid="protected-route-content">Protected Route</div>
      </ProtectedRoute>
    )

    expect(mockLocation.href).toBe('/signin')
  })
})

describe('GuestOnlyRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  it('renders children for unauthenticated users', () => {
    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }))

    render(
      <GuestOnlyRoute>
        <div data-testid="guest-only-content">Guest Only Route</div>
      </GuestOnlyRoute>
    )

    expect(screen.getByTestId('guest-only-content')).toBeInTheDocument()
  })

  it('redirects authenticated users', () => {
    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: createMockUser(),
        isLoading: false,
        isAuthenticated: true
      })
    }))

    render(
      <GuestOnlyRoute redirectTo="/dashboard">
        <div data-testid="guest-only-content">Guest Only Route</div>
      </GuestOnlyRoute>
    )

    expect(mockLocation.href).toBe('/dashboard')
  })
})

describe('withAuth HOC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  it('wraps component with authentication protection', () => {
    const MockComponent = () => <div data-testid="hoc-content">HOC Protected</div>

    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: createMockUser(),
        isLoading: false,
        isAuthenticated: true
      })
    }))

    const ProtectedComponent = withAuth(MockComponent, { redirectTo: '/login' })

    render(<ProtectedComponent />)

    expect(screen.getByTestId('hoc-content')).toBeInTheDocument()
  })

  it('redirects when wrapped component is accessed by unauthenticated user', () => {
    const MockComponent = () => <div data-testid="hoc-content">HOC Protected</div>

    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }))

    const ProtectedComponent = withAuth(MockComponent, { redirectTo: '/login' })

    render(<ProtectedComponent />)

    expect(mockLocation.href).toBe('/login')
    expect(screen.queryByTestId('hoc-content')).not.toBeInTheDocument()
  })

  it('passes props to wrapped component', () => {
    interface MockComponentProps {
      message: string
    }

    const MockComponent = ({ message }: MockComponentProps) => (
      <div data-testid="hoc-content">{message}</div>
    )

    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: createMockUser(),
        isLoading: false,
        isAuthenticated: true
      })
    }))

    const ProtectedComponent = withAuth(MockComponent)

    render(<ProtectedComponent message="Hello World" />)

    expect(screen.getByTestId('hoc-content')).toHaveTextContent('Hello World')
  })
})

describe('useRouteAuth hook', () => {
  it('returns correct access status for authenticated user on protected route', () => {
    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: createMockUser(),
        isLoading: false,
        isAuthenticated: true
      })
    }))

    const { result } = renderHook(() => useRouteAuth(true, false))

    expect(result.current.canAccess).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toEqual(createMockUser())
  })

  it('returns correct access status for unauthenticated user on protected route', () => {
    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
    }))

    const { result } = renderHook(() => useRouteAuth(true, false))

    expect(result.current.canAccess).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('returns false for canAccess during loading', () => {
    vi.doMock('@/web/components/auth/auth-context', () => ({
      useAuth: () => ({
        user: null,
        isLoading: true,
        isAuthenticated: false
      })
    }))

    const { result } = renderHook(() => useRouteAuth(true, false))

    expect(result.current.canAccess).toBe(false)
    expect(result.current.isLoading).toBe(true)
  })
})
