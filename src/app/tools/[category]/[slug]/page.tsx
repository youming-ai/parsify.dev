/**
 * Enhanced Tool Page with Workflow Integration
 * Example of how to integrate guided workflows into existing tool pages
 */

'use client';

import * as React from 'react';
import { notFound } from 'next/navigation';
import { WorkflowProvider, withWorkflows, useWorkflows } from '@/components/workflows';
import { toolsData } from '@/data/tools-data';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';

interface ToolPageProps {
	params: {
		category: string;
		slug: string;
	};
}

function ToolPageContent({ params }: ToolPageProps) {
	const { handleError, getContextualHelp } = useWorkflows();

	// Find the tool by slug
	const tool = toolsData.find(t => t.href === `/tools/${params.category}/${params.slug}`);

	if (!tool) {
		notFound();
	}

	// Example of how to handle errors in a tool component
	const handleToolError = (error: Error) => {
		handleError({
			type: 'processing',
			message: error.message,
			code: 'TOOL_ERROR',
			recoverable: true,
			suggestions: ['Check your input format', 'Try again with different data'],
		});
	};

	// Example of getting contextual help
	const contextualHelps = getContextualHelp('tool-input');

	return (
		<ToolPageWrapper
			tool={tool}
			onError={handleToolError}
			contextualHelp={contextualHelps}
		/>
	);
}

// Enhanced tool page with workflow integration
export default function ToolPage({ params }: ToolPageProps) {
	return (
		<WorkflowProvider
			toolId={params.slug}
			autoStartOnboarding={true}
			enableErrorRecovery={true}
			enableContextualHelp={true}
		>
			<ToolPageContent params={params} />
		</WorkflowProvider>
	);
}
