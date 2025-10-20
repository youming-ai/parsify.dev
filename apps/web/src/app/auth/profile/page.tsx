'use client'

import { useState } from 'react'
import { UserProfile } from '@/components/auth/user-profile'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/components/auth/auth-context'
import { ProtectedRoute } from '@/components/auth/auth-guard'
import { MainLayout } from '@/components/layout/main-layout'
import { User, Settings, Shield, Key, Trash2 } from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement API call to update profile
      // const response = await fetch('/api/auth/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email })
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to update profile. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement password reset
      // const response = await fetch('/api/auth/reset-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' }
      // });

      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessage({
        type: 'success',
        text: 'Password reset link sent to your email!',
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to send password reset link. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement account deletion
      // const response = await fetch('/api/auth/delete-account', {
      //   method: 'DELETE',
      //   headers: { 'Content-Type': 'application/json' }
      // });

      await new Promise(resolve => setTimeout(resolve, 1000))

      // Redirect to login after account deletion
      window.location.href = '/auth/login'
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to delete account. Please try again.',
      })
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">
              Manage your account settings and preferences
            </p>
          </div>

          {message && (
            <Alert
              variant={message.type === 'error' ? 'destructive' : 'default'}
              className="mb-6"
            >
              {message.text}
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Information */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    <CardTitle>Profile Information</CardTitle>
                  </div>
                  <CardDescription>
                    Update your personal information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Name
                          </p>
                          <p className="text-sm text-gray-600">{user?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Email
                          </p>
                          <p className="text-sm text-gray-600">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Account Provider
                          </p>
                          <Badge className="mt-1">
                            {user?.provider
                              ? user.provider.charAt(0).toUpperCase() +
                                user.provider.slice(1)
                              : 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        className="w-full"
                      >
                        Edit Profile
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1"
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <CardTitle>Security Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-gray-600">
                          Change your account password
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                    >
                      Reset Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* User Profile Card */}
              <UserProfile variant="sidebar" className="w-full" />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <CardTitle>Quick Actions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200">
                <CardHeader>
                  <div className="flex items-center gap-2 text-red-600">
                    <Trash2 className="h-5 w-5" />
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
