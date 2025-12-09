import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regex Tester - Test & Validate Regular Expressions Online',
  description:
    'Free online regex tester and validator. Test regular expressions with live highlighting, match details, and replace functionality. Supports JavaScript regex syntax.',
  keywords: [
    'regex tester',
    'regex validator',
    'regular expression tester',
    'regex online',
    'regex matcher',
    'regex replace',
    'pattern matching',
  ],
  openGraph: {
    title: 'Regex Tester - Parsify.dev',
    description: 'Test and validate regular expressions with live highlighting and match details.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
