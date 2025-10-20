# Authentication Components

This section covers the authentication components used in the Parsify.dev application. These components provide login, signup, user profile management, and authentication state management.

## Authentication Context

The authentication system is built around React Context for state management, providing global authentication state throughout the application.

### AuthProvider

The root provider that manages authentication state and provides auth methods to child components.

#### Props

```tsx
interface AuthProviderProps {
  children: ReactNode
}
```

#### Usage

```tsx
import { AuthProvider } from '@/components/auth/auth-context'

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  )
}
```

#### Context Value

```tsx
interface AuthContextType extends AuthState {
  login: (provider: 'google' | 'github' | 'email', credentials?: any) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  clearError: () => void
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  provider: 'google' | 'github' | 'email'
}
```

### useAuth Hook

Access authentication state and methods within components.

#### Usage

```tsx
import { useAuth } from '@/components/auth/auth-context'

function MyComponent() {
  const { user, isAuthenticated, isLoading, error, login, logout } = useAuth()
  
  // Use authentication state and methods
}
```

## Login Form

A comprehensive login form supporting OAuth providers and email/password authentication.

### Props

```tsx
interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}
```

### Usage Examples

```tsx
import { LoginForm } from '@/components/auth/login-form'

// Basic login form
<LoginForm 
  onSuccess={() => router.push('/dashboard')}
  redirectTo="/dashboard"
/>
```

### Features

- **OAuth Providers**: Google and GitHub login with custom icons
- **Email/Password**: Traditional email and password authentication
- **Error Handling**: Displays authentication errors with clear messages
- **Loading States**: Shows loading indicators during authentication
- **Responsive Design**: Works on all screen sizes
- **Accessibility**: Proper form labels and ARIA attributes

### Visual Layout

The login form features:
- Provider selection buttons with custom styling
- Separators between authentication methods
- Email/password form that appears on demand
- Sign up link integration
- Error display area

### OAuth Integration

The form supports OAuth providers with custom styling:

```tsx
// Provider configuration
const oAuthProviders: OAuthProvider[] = [
  {
    id: 'google',
    name: 'google',
    displayName: 'Google',
    icon: GoogleIcon,
    color: 'bg-white hover:bg-gray-50 border-gray-300 text-gray-700',
  },
  {
    id: 'github',
    name: 'github',
    displayName: 'GitHub',
    icon: GitHubIcon,
    color: 'bg-gray-900 hover:bg-gray-800 text-white',
  },
]
```

## User Avatar

A customizable avatar component that displays user images or initials.

### Props

```tsx
interface UserAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
```

### Usage Examples

```tsx
import { UserAvatar } from '@/components/auth/user-avatar'

// Different sizes
<UserAvatar user={user} size="sm" />
<UserAvatar user={user} size="md" />
<UserAvatar user={user} size="lg" />
<UserAvatar user={user} size="xl" />

// With custom styling
<UserAvatar 
  user={user} 
  size="lg" 
  className="border-2 border-blue-500" 
/>
```

### Features

- **Fallback to Initials**: Shows user initials when no avatar is available
- **Size Variants**: Multiple predefined sizes
- **Custom Styling**: Accepts custom className for additional styling
- **Accessibility**: Proper alt text for screen readers

## User Profile

A flexible user profile component with multiple display variants.

### Props

```tsx
interface UserProfileProps {
  variant?: 'card' | 'dropdown' | 'sidebar'
  showEmail?: boolean
  showProvider?: boolean
  className?: string
}
```

### Usage Examples

```tsx
import { UserProfile } from '@/components/auth/user-profile'

// Card variant (default)
<UserProfile variant="card" />

// Dropdown variant for navigation menus
<UserProfile 
  variant="dropdown" 
  showProvider={false}
  className="w-64"
/>

// Sidebar variant for side navigation
<UserProfile 
  variant="sidebar" 
  showEmail={true}
  showProvider={true}
/>
```

### Variants

#### Card Variant
- Full card layout with avatar, name, email
- Provider badge and user ID display
- Sign out button

#### Dropdown Variant
- Compact layout for dropdown menus
- Horizontal avatar and info arrangement
- Inline sign out button

#### Sidebar Variant
- Vertical layout for side navigation
- Centered avatar and information
- Full-width sign out button

### Features

- **Multiple Layouts**: Card, dropdown, and sidebar variants
- **Configurable Information**: Toggle email and provider display
- **Provider Badges**: Color-coded badges for authentication providers
- **Responsive Design**: Adapts to different screen sizes
- **Logout Integration**: Built-in logout functionality

## Logout Button

A simple logout button with loading states and error handling.

### Props

```tsx
interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
  onLogout?: () => void
}
```

### Usage Examples

```tsx
import { LogoutButton } from '@/components/auth/logout-button'

// Basic logout button
<LogoutButton>Sign out</LogoutButton>

// Custom styling
<LogoutButton 
  variant="outline" 
  size="sm"
  className="ml-2"
>
  Logout
</LogoutButton>

// Icon only
<LogoutButton size="icon">
  <LogOutIcon className="h-4 w-4" />
</LogoutButton>
```

## Auth Guard

A higher-order component that protects routes and requires authentication.

### Props

```tsx
interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  fallback?: React.ReactNode
}
```

### Usage Examples

```tsx
import { AuthGuard } from '@/components/auth/auth-guard'

// Basic protected route
<AuthGuard>
  <Dashboard />
</AuthGuard>

// With custom redirect
<AuthGuard redirectTo="/login">
  <Settings />
</AuthGuard>

// With custom fallback
<AuthGuard 
  fallback={<div>Loading authentication...</div>}
>
  <Profile />
</AuthGuard>
```

### Features

- **Route Protection**: Prevents access to protected routes
- **Automatic Redirect**: Redirects unauthenticated users to login
- **Loading States**: Shows loading during authentication check
- **Custom Fallbacks**: Allows custom loading/Unauthorized components

## Auth Status Indicator

A small component that displays the current authentication status.

### Props

```tsx
interface AuthStatusIndicatorProps {
  showText?: boolean
  variant?: 'badge' | 'icon' | 'full'
  className?: string
}
```

### Usage Examples

```tsx
import { AuthStatusIndicator } from '@/components/auth/auth-status-indicator'

// Badge variant
<AuthStatusIndicator variant="badge" />

// Icon only
<AuthStatusIndicator variant="icon" />

// Full status with text
<AuthStatusIndicator 
  variant="full" 
  showText={true}
/>
```

### Features

- **Status Display**: Shows authenticated, loading, or error states
- **Multiple Variants**: Badge, icon, or full display options
- **Real-time Updates**: Reflects current authentication state
- **Customizable**: Configurable text and styling options

## Authentication Types

### Core Types

```tsx
interface User {
  id: string
  email: string
  name: string
  avatar?: string
  provider: 'google' | 'github' | 'email'
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface OAuthProvider {
  id: 'google' | 'github'
  name: string
  displayName: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  name: string
}
```

## Best Practices

### 1. Security
- Always validate authentication state on the server
- Use secure HTTP-only cookies for tokens when possible
- Implement proper CSRF protection
- Handle token refresh securely

### 2. User Experience
- Provide clear loading states during authentication
- Show helpful error messages
- Maintain authentication state across page refreshes
- Implement proper logout functionality

### 3. Accessibility
- Ensure all form elements have proper labels
- Provide keyboard navigation for authentication flows
- Include ARIA attributes for screen readers
- Maintain focus management during authentication

### 4. Performance
- Debounce authentication state checks
- Cache user information appropriately
- Minimize unnecessary re-renders
- Optimize OAuth redirect flows

### 5. Error Handling
- Handle network errors gracefully
- Provide retry mechanisms for failed operations
- Log authentication errors for debugging
- Display user-friendly error messages

## Integration Examples

### Complete Authentication Flow

```tsx
import { AuthProvider, useAuth, LoginForm, UserProfile } from '@/components/auth'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoginForm 
        onSuccess={() => window.location.href = '/dashboard'}
      />
    </div>
  )
}

function Dashboard() {
  const { user } = useAuth()
  
  return (
    <div>
      <header>
        <UserProfile variant="dropdown" />
      </header>
      <main>
        <h1>Welcome, {user?.name}!</h1>
      </main>
    </div>
  )
}
```

### Custom Authentication Hook

```tsx
import { useAuth } from '@/components/auth/auth-context'

function useAuthenticatedUser() {
  const { user, isAuthenticated, isLoading } = useAuth()
  
  return {
    user,
    isAuthenticated,
    isLoading,
    hasAvatar: !!user?.avatar,
    displayName: user?.name || 'Anonymous User',
    providerLabel: user?.provider?.charAt(0).toUpperCase() + user?.provider?.slice(1)
  }
}
```