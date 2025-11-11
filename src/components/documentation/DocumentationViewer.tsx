'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Book,
  Code,
  FileText,
  Terminal,
  Shield,
  Hash,
  ChevronRight,
  Star,
  Clock,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Copy,
  ExternalLink,
  Menu,
  X,
  ArrowLeft,
  BookmarkPlus,
  Filter
} from 'lucide-react';

import { documentationService } from '@/lib/documentation/documentation-service';
import { documentationAnalytics } from '@/lib/documentation/analytics-service';
import { documentationContentGenerator } from '@/lib/documentation/content-generator';
import type {
  ToolDocumentation,
  DocumentationSection,
  CodeExample,
  DocumentationFeedback,
  DocumentationAnalytics
} from '@/types/documentation';
import type { Tool } from '@/types/tools';

interface DocumentationViewerProps {
  tool?: Tool;
  toolId?: string;
  initialSection?: string;
  onNavigate?: (path: string) => void;
}

export function DocumentationViewer({
  tool,
  toolId,
  initialSection = 'overview',
  onNavigate
}: DocumentationViewerProps) {
  const [documentation, setDocumentation] = useState<ToolDocumentation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [analytics, setAnalytics] = useState<DocumentationAnalytics | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [userFeedback, setUserFeedback] = useState<Partial<DocumentationFeedback>>({});

  const currentToolId = tool?.id || toolId;
  const sessionId = React.useId(); // Generate unique session ID

  // Load documentation
  useEffect(() => {
    if (!currentToolId) return;

    const loadDocumentation = async () => {
      try {
        setLoading(true);
        setError(null);

        let doc: ToolDocumentation | null = null;

        if (tool) {
          // Generate documentation for the provided tool
          doc = documentationContentGenerator.generateDocumentation(tool.id, tool);
        } else {
          // Get documentation from service
          doc = documentationService.getToolDocumentation(currentToolId);
        }

        if (doc) {
          setDocumentation(doc);

          // Track view
          documentationAnalytics.trackView(doc.toolId, 'tool-doc', undefined, sessionId);

          // Load analytics
          const analytics = documentationAnalytics.getContentAnalytics(doc.toolId, 'tool-doc');
          setAnalytics(analytics);
        } else {
          setError('Documentation not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documentation');
      } finally {
        setLoading(false);
      }
    };

    loadDocumentation();
  }, [currentToolId, tool, sessionId]);

  // Track time spent on current section
  useEffect(() => {
    if (!documentation || !activeSection) return;

    const startTime = Date.now();
    return () => {
      const timeSpent = Date.now() - startTime;
      documentationAnalytics.trackTimeSpent(
        documentation.toolId,
        'tool-doc',
        timeSpent,
        sessionId
      );
    };
  }, [documentation, activeSection, sessionId]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (query.length > 2) {
      const results = documentationService.searchDocumentation(query);
      documentationAnalytics.trackSearch(query, results);
    }
  }, []);

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback((rating: number, feedback?: string) => {
    if (!documentation) return;

    const feedbackData = {
      contentId: documentation.toolId,
      contentType: 'tool-doc' as const,
      rating,
      feedback: feedback || '',
      wasHelpful: rating > 3,
      suggestions: feedback || '',
      userContext: {
        sessionId,
        experienceLevel: documentation.difficulty,
        previousInteractions: []
      }
    };

    documentationAnalytics.trackFeedback(feedbackData);
    setUserFeedback(feedbackData);
    setFeedbackOpen(false);
  }, [documentation, sessionId]);

  // Handle code copying
  const handleCopyCode = useCallback(async (code: string, exampleId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(exampleId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, []);

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'JSON Processing': <FileText className="w-5 h-5" />,
      'Code Execution': <Code className="w-5 h-5" />,
      'File Processing': <FileText className="w-5 h-5" />,
      'Network Utilities': <Terminal className="w-5 h-5" />,
      'Text Processing': <FileText className="w-5 h-5" />,
      'Security & Encryption': <Shield className="w-5 h-5" />,
      'Data Validation': <Hash className="w-5 h-5" />,
      'Utilities': <Terminal className="w-5 h-5" />
    };
    return iconMap[category] || <Book className="w-5 h-5" />;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading documentation...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !documentation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Documentation Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The documentation you are looking for could not be found.'}
          </p>
          <button
            onClick={() => onNavigate?.('/docs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Documentation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {onNavigate && (
                <button
                  onClick={() => onNavigate('/tools')}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}

              <div className="flex items-center space-x-2">
                {getCategoryIcon(documentation.toolCategory)}
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {documentation.toolName}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {documentation.toolCategory}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Search className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search documentation..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          autoFocus
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions */}
              <button
                onClick={() => setFeedbackOpen(!feedbackOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen sticky top-16"
            >
              <nav className="p-4">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Contents
                </h2>

                <div className="space-y-1">
                  {documentation.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{section.title}</span>
                        {section.isRequired && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Additional sections */}
                <div className="mt-8 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Examples
                    </h3>
                    <div className="space-y-1">
                      {documentation.examples.map((example, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveSection('examples')}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {example.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      Resources
                    </h3>
                    <div className="space-y-1">
                      {documentation.tutorials.map((tutorial) => (
                        <button
                          key={tutorial.id}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {tutorial.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                {analytics && (
                  <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Statistics
                    </h3>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex justify-between">
                        <span>Views:</span>
                        <span>{analytics.viewCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rating:</span>
                        <span>{analytics.feedbackScore.toFixed(1)}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Read time:</span>
                        <span>{Math.round(documentation.estimatedReadTime)}min</span>
                      </div>
                    </div>
                  </div>
                )}
              </nav>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="prose prose-gray dark:prose-invert max-w-none"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>

          {/* Feedback Component */}
          {renderFeedback()}
        </main>
      </div>
    </div>
  );

  // Render content based on active section
  function renderContent() {
    const section = documentation.sections.find(s => s.id === activeSection);

    if (!section) return null;

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {section.title}
          </h1>
          {section.isRequired && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
              Required Reading
            </span>
          )}
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          {renderMarkdown(section.content)}
        </div>

        {/* Render subsections */}
        {section.subsections && section.subsections.length > 0 && (
          <div className="mt-8 space-y-8">
            {section.subsections.map((subsection) => (
              <div key={subsection.id} className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {subsection.title}
                </h2>

                {subsection.content && (
                  <div className="prose dark:prose-invert max-w-none mb-6">
                    {renderMarkdown(subsection.content)}
                  </div>
                )}

                {/* Render code examples */}
                {subsection.codeExamples && subsection.codeExamples.length > 0 && (
                  <div className="space-y-6">
                    {subsection.codeExamples.map((example) => (
                      <CodeExampleCard
                        key={example.id}
                        example={example}
                        onCopy={() => handleCopyCode(example.code, example.id)}
                        copied={copiedCode === example.id}
                      />
                    ))}
                  </div>
                )}

                {/* Render tips */}
                {subsection.tips && subsection.tips.length > 0 && (
                  <div className="space-y-4 mt-6">
                    {subsection.tips.map((tip) => (
                      <TipCard key={tip.id} tip={tip} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Render examples section */}
        {activeSection === 'examples' && documentation.examples.length > 0 && (
          <div className="mt-8 space-y-8">
            {documentation.examples.map((example, index) => (
              <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  {example.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {example.description}
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Input
                    </h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                      {example.input}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected Output
                    </h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                      {example.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render FAQ section */}
        {activeSection === 'faq' && documentation.faq.length > 0 && (
          <div className="mt-8 space-y-6">
            {documentation.faq.map((faq) => (
              <details key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <summary className="px-4 py-3 font-medium text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  {faq.question}
                </summary>
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="prose dark:prose-invert max-w-none">
                    {renderMarkdown(faq.answer)}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span>Helpful: {faq.helpfulCount}</span>
                      <span>Not Helpful: {faq.notHelpfulCount}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {faq.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render feedback component
  function renderFeedback() {
    return (
      <AnimatePresence>
        {feedbackOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setFeedbackOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Was this documentation helpful?
              </h3>

              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleFeedbackSubmit(rating)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        rating <= (userFeedback.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Additional feedback (optional)"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={4}
                value={userFeedback.feedback || ''}
                onChange={(e) => setUserFeedback({ ...userFeedback, feedback: e.target.value })}
              />

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setFeedbackOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleFeedbackSubmit(userFeedback.rating || 5, userFeedback.feedback)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Feedback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
}

// Code Example Card Component
function CodeExampleCard({
  example,
  onCopy,
  copied
}: {
  example: CodeExample;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {example.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {example.description}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
              {example.language}
            </span>
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              {example.difficulty}
            </span>
            <button
              onClick={onCopy}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <Copy className={`w-4 h-4 ${copied ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>{example.code}</code>
        </pre>

        {example.explanation && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Explanation
            </h5>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {example.explanation}
            </p>
          </div>
        )}

        {example.output && (
          <div className="mt-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              Output
            </h5>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
              {example.output}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// Tip Card Component
function TipCard({ tip }: { tip: any }) {
  const getTipIcon = () => {
    switch (tip.type) {
      case 'tip': return '💡';
      case 'warning': return '⚠️';
      case 'best-practice': return '✨';
      case 'performance': return '⚡';
      case 'security': return '🔒';
      default: return '📝';
    }
  };

  const getTipColor = () => {
    switch (tip.type) {
      case 'tip': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'best-practice': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'performance': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200';
      case 'security': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      default: return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getTipColor()}`}>
      <div className="flex items-start space-x-3">
        <span className="text-xl">{getTipIcon()}</span>
        <div>
          <p className="text-sm font-medium mb-1">
            {tip.type.charAt(0).toUpperCase() + tip.type.slice(1).replace('-', ' ')}
          </p>
          <p className="text-sm">{tip.content}</p>
        </div>
      </div>
    </div>
  );
}

// Simple markdown renderer (in production, use a proper markdown library)
function renderMarkdown(content: string) {
  // This is a simplified markdown renderer
  // In production, use a library like react-markdown or marked
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = `line-${i}`;

    if (line.startsWith('# ')) {
      elements.push(<h1 key={key} className="text-3xl font-bold mb-4">{line.slice(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={key} className="text-2xl font-bold mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={key} className="text-xl font-bold mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={key} className="ml-4">• {line.slice(2)}</li>);
    } else if (line.startsWith('1. ')) {
      elements.push(<li key={key} className="ml-4">1. {line.slice(3)}</li>);
    } else if (line.startsWith('```')) {
      // Code block handling would be more complex in reality
      continue;
    } else if (line.trim() === '') {
      elements.push(<br key={key} />);
    } else {
      elements.push(<p key={key} className="mb-2">{line}</p>);
    }
  }

  return <>{elements}</>;
}

export default DocumentationViewer;
