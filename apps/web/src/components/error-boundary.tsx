/**
 * React Error Boundary 组件
 * 提供前端错误捕获和优雅降级
 */

import { Button } from '@/components/ui/button';
import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: React.ErrorInfo;
	retryCount: number;
}

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	maxRetries?: number;
	resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	private resetTimeout?: NodeJS.Timeout;

	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({ errorInfo });

		// 记录错误
		console.error('Error Boundary caught an error', error, {
			componentStack: errorInfo.componentStack,
			errorBoundary: true,
			retryCount: this.state.retryCount,
		});

		// 调用自定义错误处理
		this.props.onError?.(error, errorInfo);
	}

	componentDidUpdate(prevProps: ErrorBoundaryProps) {
		const { resetKeys } = this.props;
		const { hasError, retryCount } = this.state;

		// 检查重置条件
		if (
			hasError &&
			retryCount < (this.props.maxRetries || 3) &&
			resetKeys &&
			resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
		) {
			this.handleRetry();
		}
	}

	componentWillUnmount() {
		if (this.resetTimeout) {
			clearTimeout(this.resetTimeout);
		}
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: undefined,
			errorInfo: undefined,
			retryCount: 0,
		});
	};

	handleRetry = () => {
		if (this.state.retryCount < (this.props.maxRetries || 3)) {
			this.setState((prevState) => ({
				hasError: false,
				error: undefined,
				errorInfo: undefined,
				retryCount: prevState.retryCount + 1,
			}));

			console.info('Error boundary retry attempt', {
				retryCount: this.state.retryCount + 1,
				maxRetries: this.props.maxRetries,
			});
		}
	};

	render() {
		if (this.state.hasError) {
			// 自定义错误回退组件
			if (this.props.fallback) {
				return <>{this.props.fallback}</>;
			}

			// 默认错误界面
			return (
				<div className="flex min-h-screen items-center justify-center bg-gray-50">
					<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
						<div className="mb-4 flex items-center">
							<div className="flex-shrink-0">
								<svg
									className="h-6 w-6 text-red-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-label="Warning icon"
								>
									<title>Warning</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
							</div>
							<div className="ml-3">
								<h1 className="font-medium text-gray-900 text-lg">
									出现了一些问题
								</h1>
								<p className="mt-1 text-gray-500 text-sm">
									应用程序遇到了意外错误。我们已经记录了这个问题。
								</p>
							</div>
						</div>

						{process.env.NODE_ENV === 'development' && this.state.error && (
							<details className="mt-4 rounded bg-red-50 p-3 text-sm">
								<summary className="cursor-pointer font-medium text-red-800">
									错误详情 (开发模式)
								</summary>
								<pre className="mt-2 whitespace-pre-wrap text-red-700 text-xs">
									{this.state.error.toString()}
									{this.state.errorInfo?.componentStack}
								</pre>
							</details>
						)}

						<div className="mt-6 space-y-3">
							{this.state.retryCount < (this.props.maxRetries || 3) && (
								<Button
									onClick={this.handleRetry}
									className="w-full"
									variant="outline"
								>
									重试 ({this.state.retryCount + 1}/{this.props.maxRetries || 3}
									)
								</Button>
							)}

							<Button
								onClick={this.handleReset}
								className="w-full"
								variant="default"
							>
								刷新页面
							</Button>
						</div>

						<div className="mt-4 text-center">
							<button
								type="button"
								onClick={() => {
									window.location.href = '/';
								}}
								className="text-blue-600 text-sm hover:text-blue-500"
							>
								返回首页
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// 高阶组件版本
export const withErrorBoundary = <P extends object>(
	Component: React.ComponentType<P>,
	errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
	const WrappedComponent = (props: P) => (
		<ErrorBoundary {...errorBoundaryProps}>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

	return WrappedComponent;
};

// Hook 用于在函数组件中处理错误
export const useErrorHandler = () => {
	const [error, setError] = React.useState<Error | null>(null);

	React.useEffect(() => {
		if (error) {
			console.error('Error caught by useErrorHandler', error);
			setError(null);
		}
	}, [error]);

	return React.useCallback((error: Error) => {
		setError(error);
	}, []);
};
