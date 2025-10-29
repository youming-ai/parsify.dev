'use client';

import { AuthProvider } from '@/components/auth/auth-context';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return <AuthProvider>{children}</AuthProvider>;
}
