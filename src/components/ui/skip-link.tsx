import type React from 'react';

interface SkipLinkProps {
	href?: string;
	children: React.ReactNode;
}

export function SkipLink({ href = '#main-content', children }: SkipLinkProps) {
	return (
		<a
			href={href}
			className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
		>
			{children}
		</a>
	);
}
