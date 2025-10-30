import { Button } from '@/components/ui/button';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button Component', () => {
	it('renders correctly with default props', () => {
		render(<Button>Click me</Button>);
		const button = screen.getByRole('button', { name: /click me/i });

		expect(button).toBeInTheDocument();
		expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
	});

	it('renders with variant styles', () => {
		render(<Button variant="destructive">Delete</Button>);
		const button = screen.getByRole('button', { name: /delete/i });

		expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
	});

	it('renders with different sizes', () => {
		render(<Button size="lg">Large Button</Button>);
		const button = screen.getByRole('button', { name: /large button/i });

		expect(button).toHaveClass('h-11', 'px-8');
	});

	it('handles click events', async () => {
		const handleClick = vi.fn();
		const user = userEvent.setup();

		render(<Button onClick={handleClick}>Click me</Button>);
		const button = screen.getByRole('button', { name: /click me/i });

		await user.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('can be disabled', async () => {
		const handleClick = vi.fn();
		const user = userEvent.setup();

		render(
			<Button disabled onClick={handleClick}>
				Disabled Button
			</Button>,
		);
		const button = screen.getByRole('button', { name: /disabled button/i });

		expect(button).toBeDisabled();
		expect(button).toHaveClass('disabled:opacity-50');

		await user.click(button);
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('renders as child component when asChild is true', () => {
		render(
			<Button asChild>
				<a href="https://example.com">Link Button</a>
			</Button>,
		);

		const link = screen.getByRole('link', { name: /link button/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', 'https://example.com');
		expect(link).toHaveClass('inline-flex', 'items-center');
	});

	it('applies custom className', () => {
		render(<Button className="custom-class">Custom Button</Button>);
		const button = screen.getByRole('button', { name: /custom button/i });

		expect(button).toHaveClass('custom-class');
	});

	it('renders loading state correctly', () => {
		render(<Button disabled>Loading...</Button>);
		const button = screen.getByRole('button', { name: /loading\.\.\./i });

		expect(button).toBeInTheDocument();
		expect(button).toBeDisabled();
	});
});
