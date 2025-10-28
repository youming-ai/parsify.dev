'use client'

import { ArrowLeft, Lock, Mail, User } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useAuth } from '@/components/auth/auth-context'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// OAuth Provider Icons
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const oAuthProviders = [
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

function SignupContent() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get redirect URL from query params
  const redirectTo = searchParams?.get('redirect') || '/'

  // Redirect authenticated users
  if (isAuthenticated) {
    router.push(redirectTo)
  }

  const handleOAuthSignup = async (provider: 'google' | 'github') => {
    try {
      setIsLoading(true)
      setError(null)
      await login(provider)
      router.push(redirectTo)
    } catch (_error) {
      setError(`Failed to create account with ${provider}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !password) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // TODO: Implement signup API call
      // const response = await fetch('/api/auth/signup', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, password })
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // After successful signup, log the user in
      await login('email', { email, password })
      router.push(redirectTo)
    } catch (_error) {
      setError('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Button variant="ghost" onClick={() => router.push('/auth/login')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
          <h1 className="mb-2 font-bold text-4xl text-gray-900">Parsify.dev</h1>
          <p className="mb-2 text-gray-600 text-lg">Create your account</p>
          <p className="text-gray-500 text-sm">Join thousands of developers using our tools</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-center font-bold text-2xl">Sign up</CardTitle>
            <CardDescription className="text-center">
              Choose your preferred sign-up method
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && <Alert variant="destructive">{error}</Alert>}

            {/* OAuth Providers */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {oAuthProviders.map(provider => (
                  <Button
                    key={provider.id}
                    variant="outline"
                    className={`justify-start gap-3 ${provider.color}`}
                    onClick={() => handleOAuthSignup(provider.id as 'google' | 'github')}
                    disabled={isLoading}
                  >
                    <provider.icon className="h-4 w-4" />
                    Continue with {provider.displayName}
                  </Button>
                ))}
              </div>
            </div>

            {/* Email/Password Form */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>

            {showEmailForm ? (
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-gray-500 text-xs">Must be at least 8 characters long</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmailForm(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowEmailForm(true)}
                disabled={isLoading}
              >
                <Mail className="mr-2 h-4 w-4" />
                Continue with Email
              </Button>
            )}

            {/* Terms */}
            <div className="text-center text-gray-600 text-xs">
              By creating an account, you agree to our{' '}
              <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Sign In Link */}
        <div className="text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <button
            className="font-medium text-blue-600 hover:text-blue-500"
            onClick={() => router.push('/auth/login')}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2"></div>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  )
}
