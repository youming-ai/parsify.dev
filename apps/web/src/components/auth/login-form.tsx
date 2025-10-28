'use client';

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
import type React from 'react';
import { useState } from 'react';
import { useAuth } from './auth-context';
import type { OAuthProvider } from './auth-types';

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
);

const GitHubIcon = ({ className }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor">
		<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
	</svg>
);

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
];

interface LoginFormProps {
	onSuccess?: () => void;
	redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo }: LoginFormProps) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showEmailForm, setShowEmailForm] = useState(false);

	const { login, error, clearError } = useAuth();

	const handleOAuthLogin = async (provider: 'google' | 'github') => {
		try {
			setIsLoading(true);
			clearError();
			await login(provider);
			onSuccess?.();
		} catch (_error) {
			// Error is handled by the auth context
		} finally {
			setIsLoading(false);
		}
	};

	const handleEmailLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!email || !password) {
			return;
		}

		try {
			setIsLoading(true);
			clearError();
			await login('email', { email, password });
			onSuccess?.();
		} catch (_error) {
			// Error is handled by the auth context
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="mx-auto w-full max-w-md">
			<Card>
				<CardHeader className="space-y-1">
					<CardTitle className="text-center font-bold text-2xl">
						Sign in to your account
					</CardTitle>
					<CardDescription className="text-center">
						Choose your preferred sign-in method
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
								<span className="bg-white px-2 text-gray-500">
									Continue with
								</span>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-3">
							{oAuthProviders.map((provider) => (
								<Button
									key={provider.id}
									variant="outline"
									className={`justify-start gap-3 ${provider.color}`}
									onClick={() => handleOAuthLogin(provider.id)}
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
							<span className="bg-white px-2 text-gray-500">
								Or continue with email
							</span>
						</div>
					</div>

					{showEmailForm ? (
						<form onSubmit={handleEmailLogin} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
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

							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									disabled={isLoading}
								/>
							</div>

							<div className="flex gap-2">
								<Button type="submit" className="flex-1" disabled={isLoading}>
									{isLoading ? 'Signing in...' : 'Sign In'}
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
							Continue with Email
						</Button>
					)}

					{/* Sign Up Link */}
					<div className="text-center text-gray-600 text-sm">
						Don't have an account?{' '}
						<button
							className="font-medium text-blue-600 hover:text-blue-500"
							onClick={() => {
								// Navigate to sign up page or show sign up form
								console.log('Navigate to sign up');
							}}
						>
							Sign up
						</button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
