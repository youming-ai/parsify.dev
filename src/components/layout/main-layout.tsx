import { cn } from '@/lib/utils';
import { Footer } from './footer';
import { Header } from './header';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
	children: React.ReactNode;
	showSidebar?: boolean;
}

export function MainLayout({ children, showSidebar = false }: MainLayoutProps) {
	return (
		<div className="min-h-screen bg-background main-container">
			<Header />
			<div className="flex flex-col md:flex-row">
				{showSidebar && (
					<aside className="w-full md:w-64 md:flex-shrink-0 contain-layout">
						<Sidebar />
					</aside>
				)}
				<main className={cn('flex-1 w-full', showSidebar ? 'md:ml-0' : '')}>
					<div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 contain-layout">{children}</div>
					<Footer />
				</main>
			</div>
		</div>
	);
}
