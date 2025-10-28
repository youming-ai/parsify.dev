'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-context'
import { LoginForm } from '@/components/auth/login-form'

function LoginContent() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Get redirect URL from query params
  const redirectTo = searchParams?.get('redirect') || '/'

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated && !isRedirecting) {
      setIsRedirecting(true)
      router.push(redirectTo)
    }
  }, [isAuthenticated, redirectTo, router, isRedirecting])

  // If authenticated, show loading state
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mb-2 font-bold text-4xl text-gray-900">Parsify.dev</h1>
          <p className="mb-8 text-gray-600 text-lg">Sign in to access your developer tools</p>
        </div>

        <LoginForm
          onSuccess={() => {
            setIsRedirecting(true)
            router.push(redirectTo)
          }}
          redirectTo={redirectTo}
        />

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            By signing in, you agree to our{' '}
            <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
