import { Metadata } from 'next';
import { TextComparator } from '@/components/tools/text/text-comparator';

export const metadata: Metadata = {
	title: 'Text Comparator - Compare Text Differences | Parsify.dev',
	description:
		'Compare two texts and find differences with side-by-side, unified, and inline views. Advanced text comparison tool with similarity analysis and detailed change reports.',
	keywords:
		'text comparator, text comparison, diff tool, text diff, compare text, text difference, similarity checker, file comparison, text analysis',
};

export default function TextComparatorPage() {
	return <TextComparator />;
}
