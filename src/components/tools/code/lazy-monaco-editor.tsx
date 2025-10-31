'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import type { CodeEditorProps } from './code-types';

// Lazy load Monaco Editor
const Editor = React.lazy(() => import('@monaco-editor/react').then((mod) => ({ default: mod.Editor })));

interface LazyMonacoEditorProps extends CodeEditorProps {
	fallback?: React.ReactNode;
}

export function LazyMonacoEditor({
	fallback,
	height = 400,
	width = '100%',
	className,
	...props
}: LazyMonacoEditorProps) {
	const [isLoaded, setIsLoaded] = React.useState(false);
	const [shouldLoad, setShouldLoad] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);

	// Intersection Observer for lazy loading
	React.useEffect(() => {
		if (!containerRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting) {
					setShouldLoad(true);
					observer.disconnect();
				}
			},
			{
				rootMargin: '50px', // Start loading 50px before it comes into view
			},
		);

		observer.observe(containerRef.current);

		return () => observer.disconnect();
	}, []);

	// Preload Monaco Editor when component is about to be shown
	React.useEffect(() => {
		if (shouldLoad && !isLoaded) {
			// Start loading Monaco Editor
			import('@monaco-editor/react').then(() => {
				setIsLoaded(true);
			});
		}
	}, [shouldLoad, isLoaded]);

	const defaultFallback = (
		<div className="flex h-96 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
			<div className="flex flex-col items-center space-y-4">
				<div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
				<p className="text-gray-600 text-sm dark:text-gray-400">Loading editor...</p>
			</div>
		</div>
	);

	return (
		<div ref={containerRef} className={cn('overflow-hidden rounded-lg border', className)}>
			{shouldLoad ? (
				<React.Suspense fallback={fallback || defaultFallback}>
					<Editor
						height={height}
						width={width}
						value={props.value}
						language={props.language}
						onChange={(newValue) => {
							if (props.onChange && newValue !== undefined) {
								props.onChange(newValue);
							}
						}}
						onMount={props.onMount}
						theme={props.theme}
						options={props.options}
						loading={props.loading}
					/>
				</React.Suspense>
			) : (
				fallback || defaultFallback
			)}
		</div>
	);
}

// Preload hook for critical scenarios
export function useMonacoPreload() {
	const preload = React.useCallback(() => {
		// Preload Monaco Editor for better UX
		import('@monaco-editor/react');
	}, []);

	return { preload };
}

// Optimized Code Editor component with lazy loading
export function OptimizedCodeEditor(props: CodeEditorProps) {
	return <LazyMonacoEditor {...props} />;
}
