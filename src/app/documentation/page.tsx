import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Search, Book, Code, FileText, Terminal, Shield, Globe, TrendingUp, Star, Clock, Users } from 'lucide-react';

import { documentationService } from '@/lib/documentation/documentation-service';
import { documentationAnalytics } from '@/lib/documentation/analytics-service';
import type { ToolCategory } from '@/types/tools';

export const metadata: Metadata = {
  title: 'Documentation - Parsify.dev Developer Tools',
  description: 'Comprehensive documentation and guides for all 58 developer tools. Learn how to use JSON processing, code execution, file processing, and more.',
  keywords: 'developer tools documentation, guides, tutorials, examples, best practices',
};

export default async function DocumentationPage() {
  // Get navigation data
  const navigation = documentationService.getDocumentationNavigation();

  // Get analytics for popular content
  const popularContent = documentationAnalytics.getPopularContent(6);

  // Get tutorial collections
  const tutorialCollections = documentationService.getTutorialCollection('all');

  // Category icons and descriptions
  const categories = [
    {
      id: 'json-processing',
      name: 'JSON Processing',
      description: 'Tools for working with JSON data',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-blue-500',
      toolCount: 8,
    },
    {
      id: 'code-execution',
      name: 'Code Execution',
      description: 'Execute and format code',
      icon: <Terminal className="w-6 h-6" />,
      color: 'bg-green-500',
      toolCount: 6,
    },
    {
      id: 'file-processing',
      name: 'File Processing',
      description: 'Convert and process files',
      icon: <Code className="w-6 h-6" />,
      color: 'bg-purple-500',
      toolCount: 6,
    },
    {
      id: 'network-utilities',
      name: 'Network Utilities',
      description: 'Network and API tools',
      icon: <Globe className="w-6 h-6" />,
      color: 'bg-orange-500',
      toolCount: 3,
    },
    {
      id: 'text-processing',
      name: 'Text Processing',
      description: 'Text manipulation and analysis',
      icon: <FileText className="w-6 h-6" />,
      color: 'bg-pink-500',
      toolCount: 4,
    },
    {
      id: 'security-encryption',
      name: 'Security & Encryption',
      description: 'Security and cryptographic tools',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-red-500',
      toolCount: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Developer Tools Documentation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Comprehensive guides, examples, and best practices for all 58 developer tools
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search documentation, tools, examples..."
                className="pl-12 pr-4 py-3 text-lg h-12"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">58</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tools</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">6</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">200+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Examples</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">50+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tutorials</div>
                </CardContent>
              </Card>
            </div>

            {/* Categories */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Browse by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <Link key={category.id} href={`/documentation/category/${category.id}`}>
                    <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${category.color} text-white group-hover:scale-110 transition-transform`}>
                            {category.icon}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{category.name}</CardTitle>
                            <CardDescription>{category.description}</CardDescription>
                          </div>
                          <Badge variant="secondary">{category.toolCount} tools</Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Getting Started */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Getting Started</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Book className="w-5 h-5 text-blue-500" />
                      <span>Quick Start Guide</span>
                    </CardTitle>
                    <CardDescription>
                      Learn the basics of Parsify.dev tools in 5 minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Start Learning
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <span>Popular Tutorials</span>
                    </CardTitle>
                    <CardDescription>
                      Most-watched tutorials this week
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      View Tutorials
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Popular Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Popular Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {popularContent.map((content, index) => (
                  <div key={content.id} className="flex items-start space-x-3">
                    <div className="text-sm font-medium text-gray-500 w-6">{index + 1}.</div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/documentation/${content.type}/${content.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block truncate"
                      >
                        {content.title}
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {content.type}
                        </Badge>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Eye className="w-3 h-3" />
                          <span>{content.viewCount}</span>
                        </div>
                        {content.averageRating > 0 && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Star className="w-3 h-3 fill-current text-yellow-500" />
                            <span>{content.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Tutorials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Book className="w-5 h-5" />
                  <span>Recent Tutorials</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tutorialCollections.slice(0, 5).map((tutorial) => (
                  <div key={tutorial.id} className="border-l-2 border-blue-500 pl-4">
                    <Link
                      href={`/tutorials/${tutorial.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block"
                    >
                      {tutorial.title}
                    </Link>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {tutorial.difficulty}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{tutorial.duration} min</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {tutorial.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/documentation/api"
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  API Reference
                </Link>
                <Link
                  href="/documentation/examples"
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Code Examples
                </Link>
                <Link
                  href="/documentation/best-practices"
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Best Practices
                </Link>
                <Link
                  href="/documentation/troubleshooting"
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Troubleshooting
                </Link>
                <Link
                  href="/documentation/changelog"
                  className="block text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  Changelog
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
