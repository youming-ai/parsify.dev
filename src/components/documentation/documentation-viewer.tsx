'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Book,
  Code,
  FileText,
  Terminal,
  Shield,
  Globe,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Star,
  TrendingUp,
  Bookmark,
  Share2,
  Download,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { documentationService } from '@/lib/documentation/documentation-service';
import { documentationAnalytics } from '@/lib/documentation/analytics-service';
import type {
  ToolDocumentation,
  DocumentationSection,
  DocumentationSearchResult,
  DocumentationFeedback,
  TutorialCollection,
  CodeExample
} from '@/types/documentation';
import type { Tool } from '@/types/tools';

interface DocumentationViewerProps {
  tool?: Tool;
  initialSection?: string;
  onNavigate?: (path: string) => void;
}

export function DocumentationViewer({ tool, initialSection, onNavigate }: DocumentationViewerProps) {
  const [documentation, setDocumentation] = useState<ToolDocumentation | null>(null);
  const [searchResults, setSearchResults] = useState<DocumentationSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState(initialSection || 'overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [viewStartTime, setViewStartTime] = useState(Date.now());
  const [userRating, setUserRating] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [relatedTutorials, setRelatedTutorials] = useState<TutorialCollection[]>([]);

  const sessionId = useRef(`doc-session-${Date.now()}`);

  // Load documentation when tool changes
  useEffect(() => {
    if (tool) {
      loadDocumentation(tool.id);
      loadRelatedTutorials(tool.id);
    }
  }, [tool]);

  // Track view time when component unmounts or section changes
  useEffect(() => {
    const startTime = Date.now();
    return () => {
      const timeSpent = Date.now() - startTime;
      if (documentation && tool) {
        documentationAnalytics.trackTimeSpent(
          tool.id,
          'tool-doc',
          timeSpent,
          sessionId.current
        );
      }
    };
  }, [activeSection, documentation, tool]);

  /**
   * Load documentation for a tool
   */
  const loadDocumentation = async (toolId: string) => {
    setLoading(true);
    try {
      const docs = documentationService.getToolDocumentation(toolId);
      if (docs) {
        setDocumentation(docs);
        // Track the view
        documentationAnalytics.trackView(toolId, 'tool-doc', undefined, sessionId.current);
      }
    } catch (error) {
      console.error('Failed to load documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load related tutorials
   */
  const loadRelatedTutorials = (toolId: string) => {
    const tutorials = documentationService.getTutorialCollection('all');
    const related = tutorials.filter(tutorial =>
      tutorial.tools.includes(toolId) ||
      tutorial.category.includes(toolId.split('-')[0])
    );
    setRelatedTutorials(related);
  };

  /**
   * Handle search functionality
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const results = documentationService.searchDocumentation(query);
    setSearchResults(results);
    documentationAnalytics.trackSearch(query, results);
  };

  /**
   * Handle search result selection
   */
  const handleSearchResultSelect = (result: DocumentationSearchResult) => {
    documentationAnalytics.trackSearch(searchQuery, searchResults, result.id);
    setSearchQuery('');
    setSearchResults([]);

    if (result.type === 'tool' && onNavigate) {
      onNavigate(result.url);
    }
  };

  /**
   * Handle section navigation
   */
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /**
   * Handle user feedback submission
   */
  const handleFeedbackSubmit = () => {
    if (!documentation || !tool) return;

    const feedbackData: Omit<DocumentationFeedback, 'id' | 'timestamp'> = {
      contentId: tool.id,
      contentType: 'tool-doc',
      rating: userRating,
      feedback,
      wasHelpful: userRating > 3,
      suggestions: '',
      userContext: {
        sessionId: sessionId.current,
        experienceLevel: documentation.difficulty,
        previousInteractions: [activeSection]
      }
    };

    documentationAnalytics.trackFeedback(feedbackData);
    setShowFeedback(false);
    setUserRating(0);
    setFeedback('');
  };

  /**
   * Handle bookmark functionality
   */
  const handleBookmark = () => {
    if (!documentation || !tool) return;

    // Get existing bookmarks
    const bookmarks = JSON.parse(localStorage.getItem('documentation_bookmarks') || '[]');
    const bookmarkKey = `tool:${tool.id}`;

    if (bookmarks.includes(bookmarkKey)) {
      // Remove bookmark
      const index = bookmarks.indexOf(bookmarkKey);
      bookmarks.splice(index, 1);
    } else {
      // Add bookmark
      bookmarks.push(bookmarkKey);
    }

    localStorage.setItem('documentation_bookmarks', JSON.stringify(bookmarks));
  };

  /**
   * Handle share functionality
   */
  const handleShare = async () => {
    if (!documentation || !tool) return;

    const shareUrl = `${window.location.origin}/tools/${tool.id}/docs`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tool.name} Documentation`,
          text: documentation.sections[0]?.content.substring(0, 150) || '',
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
    }
  };

  /**
   * Render sidebar navigation
   */
  const renderSidebar = () => (
    <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto"
            >
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSearchResultSelect(result)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-sm">{result.title}</div>
                  <div className="text-xs text-gray-500">{result.description}</div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Documentation Sections */}
      <ScrollArea className="flex-1 p-4">
        {documentation && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
              {documentation.toolName} Documentation
            </h3>

            {documentation.sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{section.title}</span>
                  {section.isRequired && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              </button>
            ))}

            <Separator className="my-4" />

            {/* Quick Links */}
            <div className="space-y-2">
              <h4 className="font-medium text-xs text-gray-500 uppercase">Quick Links</h4>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                API Reference
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                Examples
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                Troubleshooting
              </button>
            </div>

            <Separator className="my-4" />

            {/* Related Content */}
            {relatedTutorials.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-xs text-gray-500 uppercase">Related Tutorials</h4>
                {relatedTutorials.slice(0, 3).map((tutorial) => (
                  <button
                    key={tutorial.id}
                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <div className="font-medium">{tutorial.title}</div>
                    <div className="text-xs text-gray-500">{tutorial.duration} min</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>v{documentation?.version || '1.0.0'}</span>
          <span>{documentation?.lastUpdated.toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  /**
   * Render main content area
   */
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!documentation) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Book className="w-12 h-12 mb-4" />
          <h3 className="text-lg font-medium">No Documentation Available</h3>
          <p className="text-sm">Documentation for this tool is not yet available.</p>
        </div>
      );
    }

    const activeSectionData = documentation.sections.find(s => s.id === activeSection);

    return (
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {documentation.toolName}
              </h1>
              <Badge variant="outline">{documentation.toolCategory}</Badge>
              <Badge variant="secondary">{documentation.difficulty}</Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleBookmark}>
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeedback(true)}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <Tabs value={activeSection} onValueChange={setActiveSection} className="mt-4">
            <TabsList className="grid w-full grid-cols-6">
              {documentation.sections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="text-sm">
                  {section.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {activeSectionData && (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                id={`section-${activeSection}`}
              >
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {/* Render markdown content */}
                  {renderMarkdownContent(activeSectionData.content)}

                  {/* Render subsections */}
                  {activeSectionData.subsections?.map((subsection) => (
                    <div key={subsection.id} className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">{subsection.title}</h3>
                      <div className="prose prose-gray dark:prose-invert max-w-none">
                        {renderMarkdownContent(subsection.content)}
                      </div>

                      {/* Render code examples */}
                      {subsection.codeExamples && (
                        <div className="mt-6 space-y-4">
                          {subsection.codeExamples.map((example) => (
                            <CodeExampleCard key={example.id} example={example} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  /**
   * Render markdown content (simplified)
   */
  const renderMarkdownContent = (content: string) => {
    // This is a simplified markdown renderer
    // In a real implementation, you'd use a proper markdown library
    return (
      <div dangerouslySetInnerHTML={{
        __html: content
          .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
          .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-3">$1</h2>')
          .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mb-2">$1</h3>')
          .replace(/^\*\* (.*) \*\*/gim, '<strong>$1</strong>')
          .replace(/^\* (.*)$/gim, '<li>$1</li>')
          .replace(/^- (.*)$/gim, '<li>$1</li>')
          .replace(/\n\n/g, '</p><p class="mb-4">')
          .replace(/^/, '<p class="mb-4">')
          .replace(/$/, '</p>')
      }} />
    );
  };

  /**
   * Render code example card
   */
  const CodeExampleCard = ({ example }: { example: CodeExample }) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {example.title}
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{example.language}</Badge>
            <Badge variant={example.difficulty === 'basic' ? 'secondary' : example.difficulty === 'advanced' ? 'destructive' : 'default'}>
              {example.difficulty}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>{example.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre>{example.code}</pre>
        </div>
        {example.output && (
          <div className="mt-3 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="font-semibold text-green-700 dark:text-green-300 mb-1">Output:</div>
            <pre className="text-sm text-green-600 dark:text-green-400">{example.output}</pre>
          </div>
        )}
        {example.explanation && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <strong>Explanation:</strong> {example.explanation}
          </div>
        )}
      </CardContent>
    </Card>
  );

  /**
   * Render feedback modal
   */
  const renderFeedbackModal = () => (
    <AnimatePresence>
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowFeedback(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">How helpful was this documentation?</h3>

            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setUserRating(rating)}
                  className={`p-2 rounded-full transition-colors ${
                    userRating >= rating
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>

            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more about your experience..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={4}
            />

            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowFeedback(false)}>
                Cancel
              </Button>
              <Button onClick={handleFeedbackSubmit} disabled={userRating === 0}>
                Submit Feedback
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed lg:relative lg:block w-64 h-full z-10"
          >
            {renderSidebar()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {renderContent()}
      </div>

      {/* Feedback Modal */}
      {renderFeedbackModal()}
    </div>
  );
}

export default DocumentationViewer;
