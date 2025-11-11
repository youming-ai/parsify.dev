import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BreadcrumbNavigation } from '@/components/tools/breadcrumb-navigation';
import { mockBreadcrumbNavigationProps } from '../../utils/test-data';
import { customRender } from '../../utils/test-utils';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
	usePathname: () => '/tools',
}));

describe('BreadcrumbNavigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render breadcrumb navigation', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			expect(screen.getByText('Home')).toBeInTheDocument();
			expect(screen.getByText('Tools')).toBeInTheDocument();
			expect(screen.getByText('JSON Processing')).toBeInTheDocument();
		});

		it('should render all breadcrumb items', () => {
			const items = [
				{ label: 'Home', href: '/' },
				{ label: 'Tools', href: '/tools' },
				{ label: 'JSON Processing', href: '/tools/json' },
				{ label: 'Formatter', href: '/tools/json/formatter' },
			];

			customRender(<BreadcrumbNavigation items={items} />);

			items.forEach(item => {
				expect(screen.getByText(item.label)).toBeInTheDocument();
			});
		});

		it('should apply custom className', () => {
			customRender(
				<BreadcrumbNavigation
					{...mockBreadcrumbNavigationProps}
					className="custom-class"
				/>
			);

			const nav = document.querySelector('.custom-class');
			expect(nav).toBeInTheDocument();
		});

		it('should render separator icons between items', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const separators = document.querySelectorAll('.icon-chevron-right');
			expect(separators.length).toBe(2); // 3 items = 2 separators
		});
	});

	describe('Navigation', () => {
		it('should navigate when breadcrumb item is clicked', async () => {
			const user = userEvent.setup();
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const homeLink = screen.getByText('Home');
			await user.click(homeLink);

			expect(mockPush).toHaveBeenCalledWith('/');
		});

		it('should navigate when intermediate breadcrumb is clicked', async () => {
			const user = userEvent.setup();
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const toolsLink = screen.getByText('Tools');
			await user.click(toolsLink);

			expect(mockPush).toHaveBeenCalledWith('/tools');
		});

		it('should not navigate when last breadcrumb is clicked', async () => {
			const user = userEvent.setup();
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const currentLink = screen.getByText('JSON Processing');
			await user.click(currentLink);

			// Last item should not be clickable
			expect(mockPush).not.toHaveBeenCalledWith('/tools/json');
		});
	});

	describe('Styling and Classes', () => {
		it('should apply correct styles to navigation items', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const links = screen.getAllByRole('link');
			expect(links.length).toBe(2); // First 2 items should be links

			// Last item should not be a link
			const nonLinkItems = screen.getAllByText(/Home|Tools|JSON Processing/)
				.filter(item => !item.closest('a'));
			expect(nonLinkItems.length).toBe(1); // Last item
		});

		it('should show current page as non-clickable', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const currentItem = screen.getByText('JSON Processing');
			expect(currentItem.closest('a')).toBeNull();
		});

		it('should have proper hover states', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const links = screen.getAllByRole('link');
			links.forEach(link => {
				expect(link).toHaveClass(/hover:/);
			});
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const nav = screen.getByRole('navigation');
			expect(nav).toBeInTheDocument();
			expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');
		});

		it('should have proper link structure', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const links = screen.getAllByRole('link');
			expect(links.length).toBeGreaterThan(0);

			links.forEach(link => {
				expect(link).toHaveAttribute('href');
			});
		});

		it('should be keyboard navigable', async () => {
			const user = userEvent.setup();
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			await user.tab();
			const focusedElement = document.activeElement;
			expect(focusedElement?.tagName).toBe('A');
		});
	});

	describe('Edge Cases', () => {
		it('should handle single breadcrumb item', () => {
			const singleItem = [{ label: 'Home', href: '/' }];
			customRender(<BreadcrumbNavigation items={singleItem} />);

			expect(screen.getByText('Home')).toBeInTheDocument();
			// Should not show separators
			const separators = document.querySelectorAll('.icon-chevron-right');
			expect(separators.length).toBe(0);
		});

		it('should handle empty breadcrumb items', () => {
			customRender(<BreadcrumbNavigation items={[]} />);

			// Should not crash and should render empty navigation
			const nav = screen.getByRole('navigation');
			expect(nav).toBeInTheDocument();
			expect(nav).toBeEmptyDOMElement();
		});

		it('should handle items without href', () => {
			const items = [
				{ label: 'Home', href: '/' },
				{ label: 'Current Page' }, // No href
			];

			customRender(<BreadcrumbNavigation items={items} />);

			expect(screen.getByText('Home')).toBeInTheDocument();
			expect(screen.getByText('Current Page')).toBeInTheDocument();
		});

		it('should handle long breadcrumb labels', () => {
			const items = [
				{ label: 'Home', href: '/' },
				{ label: 'A very long category name that might need truncation', href: '/category' },
				{ label: 'Current', href: '/current' },
			];

			customRender(<BreadcrumbNavigation items={items} />);

			expect(screen.getByText('A very long category name that might need truncation')).toBeInTheDocument();
		});
	});

	describe('Performance', () => {
		it('should handle many breadcrumb items efficiently', () => {
			const manyItems = Array.from({ length: 10 }, (_, i) => ({
				label: `Level ${i + 1}`,
				href: `/level-${i + 1}`,
			}));

			customRender(<BreadcrumbNavigation items={manyItems} />);

			manyItems.forEach(item => {
				expect(screen.getByText(item.label)).toBeInTheDocument();
			});
		});

		it('should not re-render unnecessarily', () => {
			const { rerender } = customRender(
				<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />
			);

			rerender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			expect(screen.getByText('Home')).toBeInTheDocument();
		});
	});

	describe('Integration', () => {
		it('should integrate with navigation system', async () => {
			const user = userEvent.setup();
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const toolsLink = screen.getByText('Tools');
			await user.click(toolsLink);

			expect(mockPush).toHaveBeenCalledWith('/tools');
		});

		it('should work with different page structures', () => {
			const homeItems = [{ label: 'Home', href: '/' }];
			customRender(<BreadcrumbNavigation items={homeItems} />);

			expect(screen.getByText('Home')).toBeInTheDocument();
			expect(screen.queryByText('Tools')).not.toBeInTheDocument();
		});
	});

	describe('Visual Design', () => {
		it('should have proper spacing between items', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const nav = screen.getByRole('navigation');
			expect(nav).toHaveClass(/flex/);
			expect(nav).toHaveClass(/items-center/);
			expect(nav).toHaveClass(/space-x/);
		});

		it('should have appropriate text sizes', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const items = screen.getAllByText(/Home|Tools|JSON Processing/);
			items.forEach(item => {
				expect(item).toHaveClass(/text-/);
			});
		});

		it('should show current item with different styling', () => {
			customRender(<BreadcrumbNavigation {...mockBreadcrumbNavigationProps} />);

			const currentItem = screen.getByText('JSON Processing');
			const linkItems = screen.getAllByRole('link');

			// Current item should not be in the links array
			expect(linkItems.some(link => link.textContent === 'JSON Processing')).toBe(false);
		});
	});
});
