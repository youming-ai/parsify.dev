/**
 * JSON Hero Visualizer Page
 * Interactive JSON data visualization with multiple chart types
 */

import { JSONHeroVisualizer } from '@/components/tools/json/json-hero-visualizer';
import { ToolPageWrapper } from '@/components/tools/tool-page-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'JSON Hero Visualizer - Interactive JSON Visualization | Parsify.dev',
	description:
		'Visualize JSON data in interactive graphs and tree structures. Multiple visualization types including tree, bubble, sunburst, and treemap charts.',
	keywords: ['json visualizer', 'json tree', 'interactive json', 'json charts', 'data visualization'],
};

export default function JSONHeroVisualizerPage() {
	return (
		<ToolPageWrapper
			title="JSON Hero Visualizer"
			description="Visualize JSON data in interactive graphs and tree structures"
			toolId="json-hero-visualizer"
		>
			<JSONHeroVisualizer />
		</ToolPageWrapper>
	);
}
