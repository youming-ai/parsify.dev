'use client';

import { useAuth } from '@/components/auth/auth-context';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function PasswordResetContent() {
	const [email, setEmail] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isResetting, setIsResetting] = useState(false);
	const [resetSuccess, setResetSuccess] = useState(false);

	const router = useRouter();
	const searchParams = useSearchParams();
	const { isAuthenticated } = useAuth();

	// Get token from URL params
	useEffect(() => {
		const tokenParam = searchParams?.get('token');
		if (tokenParam) {
			setToken(tokenParam);
		}
	}, [searchParams]);

	// Redirect authenticated users
	useEffect(() => {
		if (isAuthenticated) {
			router.push('/');
		}
	}, [isAuthenticated, router]);

	const handleRequestReset = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			// TODO: Implement API call to request password reset
			// const response = await fetch('/api/auth/forgot-password', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ email })
			// });

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setIsSubmitted(true);
		} catch (_error) {
			setError('Failed to send reset link. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handlePasswordReset = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (newPassword !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		if (newPassword.length < 8) {
			setError('Password must be at least 8 characters long.');
			return;
		}

		setIsResetting(true);

		try {
			// TODO: Implement API call to reset password
			// const response = await fetch('/api/auth/reset-password', {
			//   method: 'POST',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify({ token, password: newPassword })
			// });

			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			setResetSuccess(true);
		} catch (_error) {
			setError('Failed to reset password. The link may have expired.');
		} finally {
			setIsResetting(false);
		}
	};

	// If token is present, show password reset form
	if (token) {
		if (resetSuccess) {
			return (
				<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
					<div className="w-full max-w-md space-y-8">
						<div className="text-center">
							<CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
							<h1 className="mb-2 font-bold text-3xl text-gray-900">
								Password Reset Successful
							</h1>
							<p className="mb-8 text-gray-600 text-lg">
								Your password has been reset successfully.
							</p>
							<Button
								onClick={() => router.push('/auth/login')}
								className="w-full"
							>
								Sign In with New Password
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<Button
							variant="ghost"
							onClick={() => router.push('/auth/login')}
							className="mb-4"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Login
						</Button>
						<h1 className="mb-2 font-bold text-3xl text-gray-900">
							Reset Your Password
						</h1>
						<p className="text-gray-600 text-lg">
							Enter your new password below
						</p>
					</div>

					<Card>
						<CardHeader>
							<CardTitle className="text-center">New Password</CardTitle>
							<CardDescription className="text-center">
								Choose a strong password for your account
							</CardDescription>
						</CardHeader>
						<CardContent>
							{error && (
								<Alert variant="destructive" className="mb-4">
									<AlertCircle className="h-4 w-4" />
									{error}
								</Alert>
							)}

							<form onSubmit={handlePasswordReset} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="newPassword">New Password</Label>
									<Input
										id="newPassword"
										type="password"
										placeholder="Enter new password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										required
										minLength={8}
										disabled={isResetting}
									/>
									<p className="text-gray-500 text-xs">
										Must be at least 8 characters long
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm Password</Label>
									<Input
										id="confirmPassword"
										type="password"
										placeholder="Confirm new password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										required
										minLength={8}
										disabled={isResetting}
									/>
								</div>

								<Button type="submit" className="w-full" disabled={isResetting}>
									{isResetting ? 'Resetting...' : 'Reset Password'}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Show password reset request form
	if (isSubmitted) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
				<div className="w-full max-w-md space-y-8">
					<div className="text-center">
						<Mail className="mx-auto mb-4 h-12 w-12 text-blue-500" />
						<h1 className="mb-2 font-bold text-3xl text-gray-900">
							Check Your Email
						</h1>
						<p className="mb-2 text-gray-600 text-lg">
							We've sent a password reset link to
						</p>
						<p className="mb-8 font-medium text-gray-900">{email}</p>

						<div className="mb-8 text-gray-600 text-sm">
							<p className="mb-2">Didn't receive the email?</p>
							<ul className="list-inside list-disc space-y-1">
								<li>Check your spam folder</li>
								<li>Make sure the email address is correct</li>
								<li>Wait a few minutes for delivery</li>
							</ul>
						</div>

						<div className="space-y-3">
							<Button
								onClick={() => setIsSubmitted(false)}
								variant="outline"
								className="w-full"
							>
								Try a different email
							</Button>
							<Button
								onClick={() => router.push('/auth/login')}
								variant="ghost"
								className="w-full"
							>
								Back to Sign In
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center">
					<Button
						variant="ghost"
						onClick={() => router.push('/auth/login')}
						className="mb-4"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Login
					</Button>
					<h1 className="mb-2 font-bold text-3xl text-gray-900">
						Reset Your Password
					</h1>
					<p className="text-gray-600 text-lg">
						Enter your email address and we'll send you a link to reset your
						password
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-center">Forgot Password</CardTitle>
						<CardDescription className="text-center">
							We'll email you instructions to reset your password
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<Alert variant="destructive" className="mb-4">
								<AlertCircle className="h-4 w-4" />
								{error}
							</Alert>
						)}

						<form onSubmit={handleRequestReset} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<Input
									id="email"
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>

							<Button type="submit" className="w-full" disabled={isLoading}>
								{isLoading ? 'Sending...' : 'Send Reset Link'}
							</Button>
						</form>

						<div className="mt-6 text-center">
							<p className="text-gray-600 text-sm">
								Remember your password?{' '}
								<button
									type="button"
									onClick={() => router.push('/auth/login')}
									className="font-medium text-blue-600 hover:text-blue-500"
								>
									Sign in
								</button>
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

export default function PasswordResetPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
				</div>
			}
		>
			<PasswordResetContent />
		</Suspense>
	);
}
