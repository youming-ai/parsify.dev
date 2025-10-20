'use client'

import { useEffect, useState } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/components/auth/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Parsify.dev</h1>
          <p className="text-lg text-gray-600 mb-8">
            Sign in to access your developer tools
          </p>
        </div>

        <LoginForm
          onSuccess={() => {
            setIsRedirecting(true)
            router.push(redirectTo)
          }}
          redirectTo={redirectTo}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <a
              href="/terms"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
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
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
