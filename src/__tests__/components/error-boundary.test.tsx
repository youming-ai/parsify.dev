import { ErrorBoundary } from '@/components/error-boundary';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
	if (shouldThrow) {
		throw new Error('Test error');
	}
	return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
	let consoleError: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Suppress console.error for these tests
		consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	it('renders children when there is no error', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		expect(screen.getByText('No error')).toBeInTheDocument();
	});

	it('catches and displays error information', () => {
		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText(/出现了一些问题/i)).toBeInTheDocument();
		expect(screen.getByText(/应用程序遇到了意外错误/)).toBeInTheDocument();
	});

	it('displays error details in development mode', () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'development';

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		const details = screen.getByText(/错误详情 \(开发模式\)/i);
		expect(details).toBeInTheDocument();

		process.env.NODE_ENV = originalEnv;
	});

	it('does not show error details in production', () => {
		const originalEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';

		render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.queryByText(/错误详情 \(开发模式\)/i)).not.toBeInTheDocument();

		process.env.NODE_ENV = originalEnv;
	});

	it('calls onError callback when error occurs', () => {
		const onError = vi.fn();

		render(
			<ErrorBoundary onError={onError}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(onError).toHaveBeenCalled();
		expect(onError).toHaveBeenCalledWith(
			expect.any(Error),
			expect.objectContaining({
				componentStack: expect.any(String),
			}),
		);
	});

	it('resets when reset button is clicked', async () => {
		const user = userEvent.setup();

		const { rerender } = render(
			<ErrorBoundary>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		// Should show error state
		expect(screen.getByText(/出现了一些问题/i)).toBeInTheDocument();

		// Click reset button
		const resetButton = screen.getByRole('button', { name: /刷新页面/i });
		await user.click(resetButton);

		// Rerender with non-throwing component
		rerender(
			<ErrorBoundary>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		// Should show normal content
		expect(screen.getByText('No error')).toBeInTheDocument();
	});

	it('limits retry attempts', async () => {
		const user = userEvent.setup();
		const maxRetries = 2;

		const { rerender } = render(
			<ErrorBoundary maxRetries={maxRetries}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		// Should show retry button
		expect(screen.getByRole('button', { name: /重try \(1\/2\)/i })).toBeInTheDocument();

		// Retry and fail again
		const retryButton = screen.getByRole('button', { name: /重try \(1\/2\)/i });
		await user.click(retryButton);

		rerender(
			<ErrorBoundary maxRetries={maxRetries}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		// Should show retry button again
		expect(screen.getByRole('button', { name: /重试 \(2\/2\)/i })).toBeInTheDocument();

		// Retry and fail again (max retries reached)
		const retryButton2 = screen.getByRole('button', { name: /重试 \(2\/2\)/i });
		await user.click(retryButton2);

		rerender(
			<ErrorBoundary maxRetries={maxRetries}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		// Should not show retry button anymore
		expect(screen.queryByText(/重try/i)).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: /刷新页面/i })).toBeInTheDocument();
	});

	it('renders custom fallback when provided', () => {
		const customFallback = <div>Custom error message</div>;

		render(
			<ErrorBoundary fallback={customFallback}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		expect(screen.getByText('Custom error message')).toBeInTheDocument();
		expect(screen.queryByText(/出现了一些问题/i)).not.toBeInTheDocument();
	});

	it('handles resetKeys for automatic reset', () => {
		const { rerender } = render(
			<ErrorBoundary resetKeys={[1]}>
				<ThrowError shouldThrow={true} />
			</ErrorBoundary>,
		);

		// Should show error state
		expect(screen.getByText(/出现了一些问题/i)).toBeInTheDocument();

		// Rerender with different resetKey
		rerender(
			<ErrorBoundary resetKeys={[2]}>
				<ThrowError shouldThrow={false} />
			</ErrorBoundary>,
		);

		// Should automatically reset and show normal content
		expect(screen.getByText('No error')).toBeInTheDocument();
	});
});
