import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { documentationService } from '@/lib/documentation/documentation-service';
import { documentationAnalytics } from '@/lib/documentation/analytics-service';
import { toolsData } from '@/data/tools-data';
import type { ToolCategory } from '@/types/tools';

export const metadata: Metadata = {
  title: 'Documentation - Parsify.dev Developer Tools',
  description: 'Comprehensive documentation for all 58 developer tools. Learn how to use JSON processors, code executors, file converters, and more.',
  keywords: [
    'developer tools documentation',
    'JSON tools guide',
    'code execution tutorial',
    'file processing help',
    'API documentation',
    'developer guide'
  ],
  openGraph: {
    title: 'Documentation - Parsify.dev Developer Tools',
    description: 'Complete documentation and tutorials for our 58 developer tools',
    type: 'website',
  },
};

// Define categories with their metadata
const categories = [
  {
    id: 'json-processing',
    name: 'JSON Processing',
    description: 'Tools for formatting, validating, and converting JSON data',
    icon: '📄',
    color: 'bg-blue-500',
    tools: toolsData.filter(tool => tool.category === 'JSON Processing'),
  },
  {
    id: 'code-execution',
    name: 'Code Execution',
    description: 'Execute and format code in multiple programming languages',
    icon: '💻',
    color: 'bg-green-500',
    tools: toolsData.filter(tool => tool.category === 'Code Execution'),
  },
  {
    id: 'file-processing',
    name: 'File Processing',
    description: 'Convert and process various file formats',
    icon: '📁',
    color: 'bg-purple-500',
    tools: toolsData.filter(tool => tool.category === 'File Processing'),
  },
  {
    id: 'network-utilities',
    name: 'Network Utilities',
    description: 'Network, API, and web development tools',
    icon: '🌐',
    color: 'bg-orange-500',
    tools: toolsData.filter(tool => tool.category === 'Network Utilities'),
  },
  {
    id: 'text-processing',
    name: 'Text Processing',
    description: 'Text manipulation and analysis tools',
    icon: '📝',
    color: 'bg-pink-500',
    tools: toolsData.filter(tool => tool.category === 'Text Processing'),
  },
  {
    id: 'security-encryption',
    name: 'Security & Encryption',
    description: 'Security, hashing, and encryption tools',
    icon: '🔒',
    color: 'bg-red-500',
    tools: toolsData.filter(tool => tool.category === 'Security & Encryption'),
  },
];

export default async function DocumentationPage() {
  // Get analytics data for insights
  const analyticsData = documentationAnalytics.generateReport();
  const popularContent = analyticsData.topContent.slice(0, 8);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Developer Tools Documentation
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Complete guides and tutorials for all 58 developer tools.
              Learn JSON processing, code execution, file conversion, and more.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Input
                type="search"
                placeholder="Search documentation, tools, or examples..."
                className="w-full px-6 py-4 text-lg bg-white/10 backdrop-blur border-white/20 text-white placeholder-white/70 rounded-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">58</div>
              <div className="text-gray-600 dark:text-gray-400">Tools</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">6</div>
              <div className="text-gray-600 dark:text-gray-400">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {analyticsData.summary.totalViews.toLocaleString()}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Documentation Views</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600">
                {analyticsData.summary.averageRating.toFixed(1)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Getting Started */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Getting Started
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      🚀 Quick Start
                    </CardTitle>
                    <CardDescription>
                      Get up and running with our tools in minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>✅ No registration required</li>
                      <li>✅ All processing happens in your browser</li>
                      <li>✅ Support for multiple data formats</li>
                      <li>✅ Real-time validation and feedback</li>
                    </ul>
                    <Button className="w-full mt-4" asChild>
                      <Link href="/tools">Browse Tools</Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📚 Tutorials
                    </CardTitle>
                    <CardDescription>
                      Step-by-step guides for common workflows
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>📖 JSON Processing Basics</li>
                      <li>💻 Code Execution Workshop</li>
                      <li>🔄 Data Transformation</li>
                      <li>🔒 Security Best Practices</li>
                    </ul>
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <Link href="/tutorials">View Tutorials</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Tool Categories */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Tool Categories
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {categories.map((category) => (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-2xl`}>
                          {category.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription>{category.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category.tools.length} tools
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/tools/${category.id}`}>Explore →</Link>
                        </Button>
                      </div>

                      {/* Popular tools in category */}
                      <div className="mt-4 flex flex-wrap gap-1">
                        {category.tools
                          .filter(tool => tool.isPopular)
                          .slice(0, 3)
                          .map((tool) => (
                            <Badge key={tool.id} variant="secondary" className="text-xs">
                              {tool.name}
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Popular Documentation */}
            <section>
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                Popular Documentation
              </h2>
              <div className="grid gap-4">
                {popularContent.map((content) => (
                  <Card key={content.contentId} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {content.viewCount.toLocaleString()} views
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              {content.averageRating.toFixed(1)}
                            </span>
                            {content.trending && (
                              <Badge variant="outline" className="text-xs">
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  Trending
                                </span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" asChild>
                          <Link href={`/tools/${content.contentId}/docs`}>
                            Read Docs
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/api">API Reference</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/examples">Code Examples</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/troubleshooting">Troubleshooting</Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/changelog">Changelog</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="font-medium">New: JWT Decoder</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Decode and validate JSON Web Tokens
                  </div>
                  <div className="text-xs text-gray-500 mt-1">2 days ago</div>
                </div>
                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="font-medium">Enhanced: JSON Formatter</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Added custom formatting options
                  </div>
                  <div className="text-xs text-gray-500 mt-1">1 week ago</div>
                </div>
                <div>
                  <div className="font-medium">New: Code Minifier</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Minify JavaScript and CSS files
                  </div>
                  <div className="text-xs text-gray-500 mt-1">2 weeks ago</div>
                </div>
              </CardContent>
            </Card>

            {/* Community */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  GitHub Discussions
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Report Issues
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  Request Features
                </Button>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/support">Get Support</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Newsletter CTA */}
      <section className="bg-gray-100 dark:bg-gray-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Stay Updated
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Get notified about new tools, features, and tutorials. Join our newsletter for the latest updates.
          </p>
          <div className="flex max-w-md mx-auto gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="flex-1"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
