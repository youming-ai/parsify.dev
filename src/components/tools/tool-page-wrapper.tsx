import { cn } from '@/lib/utils';

interface ToolPageWrapperProps {
	children: React.ReactNode;
	className?: string;
}

export function ToolPageWrapper({ children, className }: ToolPageWrapperProps) {
	return <div className={cn('py-6 animate-fade-in', className)}>{children}</div>;
}
