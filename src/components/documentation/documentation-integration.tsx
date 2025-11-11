'use client';

import React, { useState, useEffect } from 'react';
import {
  Book,
  HelpCircle,
  Lightbulb,
  GraduationCap,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

import { DocumentationViewer } from './documentation-viewer';
import { contextualHelp } from '@/lib/workflows/contextual-help';
import { documentationService } from '@/lib/documentation/documentation-service';
import { documentationAnalytics } from '@/lib/documentation/analytics-analytics';
import type { Tool, ToolExample } from '@/types/tools';

interface DocumentationIntegrationProps {
  tool: Tool;
  variant?: 'button' | 'floating' | 'inline';
  position?: 'top-right' | 'bottom-right' | 'bottom-left';
  showTooltip?: boolean;
}

/**
 * Documentation Integration Component
 * Provides seamless access to documentation within tool pages
 */
export function DocumentationIntegration({
  tool,
  variant = 'button',
  position = 'top-right',
  showTooltip = true
}: DocumentationIntegrationProps) {
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [quickTips, setQuickTips] = useState<string[]>([]);
  const [relatedTutorials, setRelatedTutorials] = useState<any[]>([]);

  useEffect(() => {
    if (tool) {
      // Load quick tips for the current tool
      loadQuickTips();
      loadRelatedTutorials();

      // Track documentation access
      documentationAnalytics.trackView(tool.id, 'tool-doc-integration');
    }
  }, [tool]);

  /**
   * Load quick tips for the current tool
   */
  const loadQuickTips = () => {
    const helpSuggestions = contextualHelp.getToolHelpSuggestions(tool.id, {
      userData: {
        skillLevel: 'intermediate',
        errorCount: 0,
        timeSpent: 0,
        completedWorkflows: [],
        showHints: true,
        seenHints: []
      }
    });

    setQuickTips(helpSuggestions.quickTips || []);
  };

  /**
   * Load related tutorials for the current tool
   */
  const loadRelatedTutorials = () => {
    const tutorials = documentationService.getTutorialCollection('all');
    const related = tutorials.filter(tutorial =>
      tutorial.tools.includes(tool.id) ||
      tutorial.category.includes(tool.category.toLowerCase().replace(' ', '-'))
    );
    setRelatedTutorials(related);
  };

  /**
   * Handle documentation open
   */
  const handleDocsOpen = () => {
    setIsDocsOpen(true);
    documentationAnalytics.trackView(tool.id, 'tool-doc-viewer');
  };

  /**
   * Handle contextual help
   */
  const handleContextualHelp = () => {
    setIsHelpOpen(true);
    documentationAnalytics.trackView(tool.id, 'contextual-help');
  };

  /**
   * Render floating action button variant
   */
  const renderFloatingButton = () => (
    <TooltipProvider>
      <div className={`fixed ${getPositionClasses()} z-40 flex flex-col gap-2`}>
        {/* Quick Tips */}
        {quickTips.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full shadow-lg"
                onClick={handleContextualHelp}
              >
                <Lightbulb className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Quick Tips & Help</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Documentation Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
              onClick={handleDocsOpen}
            >
              <Book className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View Documentation</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );

  /**
   * Render inline buttons variant
   */
  const renderInlineButtons = () => (
    <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 border-t">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDocsOpen}
        className="flex items-center gap-2"
      >
        <Book className="w-4 h-4" />
        Documentation
      </Button>

      {quickTips.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleContextualHelp}
          className="flex items-center gap-2"
        >
          <Lightbulb className="w-4 h-4" />
          Tips
        </Button>
      )}

      {relatedTutorials.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4" />
          Tutorials
        </Button>
      )}
    </div>
  );

  /**
   * Render button variant
   */
  const renderButton = () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDocsOpen}
            className="flex items-center gap-2"
          >
            <Book className="w-4 h-4" />
            Documentation
          </Button>
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent>
            <p>View {tool.name} documentation</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );

  /**
   * Get position classes for floating button
   */
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  /**
   * Render contextual help dialog
   */
  const renderContextualHelp = () => (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Quick Tips for {tool.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {quickTips.map((tip, index) => (
            <div key={index} className="flex gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
            </div>
          ))}

          {relatedTutorials.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Recommended Tutorials</h4>
              <div className="space-y-2">
                {relatedTutorials.slice(0, 3).map((tutorial) => (
                  <Button
                    key={tutorial.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {tutorial.title}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDocsOpen}
            >
              <Book className="w-4 h-4 mr-2" />
              View Full Documentation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  /**
   * Render documentation sheet
   */
  const renderDocumentationSheet = () => (
    <Sheet open={isDocsOpen} onOpenChange={setIsDocsOpen}>
      <SheetContent className="w-full sm:max-w-4xl overflow-hidden p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{tool.name} Documentation</SheetTitle>
        </SheetHeader>
        <div className="h-[calc(100vh-80px)]">
          <DocumentationViewer
            tool={tool}
            onNavigate={(path) => {
              // Handle navigation within documentation
              console.log('Navigate to:', path);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {/* Render based on variant */}
      {variant === 'floating' && renderFloatingButton()}
      {variant === 'inline' && renderInlineButtons()}
      {variant === 'button' && renderButton()}

      {/* Dialogs and Sheets */}
      {renderContextualHelp()}
      {renderDocumentationSheet()}
    </>
  );
}

/**
 * Example Usage Component
 * Shows how to integrate documentation within tool pages
 */
export function ExampleUsage({ examples }: { examples: ToolExample[] }) {
  const [activeExample, setActiveExample] = useState(0);

  if (!examples || examples.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">Examples</h4>
        <div className="flex gap-1">
          {examples.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveExample(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                activeExample === index ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h5 className="font-medium text-sm mb-1">
            {examples[activeExample].title}
          </h5>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {examples[activeExample].description}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded p-3 font-mono text-sm">
          <pre>{examples[activeExample].input}</pre>
        </div>
      </div>
    </div>
  );
}

/**
 * Related Tools Component
 * Shows related tools with documentation links
 */
export function RelatedTools({ relatedToolIds }: { relatedToolIds: string[] }) {
  if (!relatedToolIds || relatedToolIds.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
      <h4 className="font-medium mb-3 flex items-center gap-2">
        <ExternalLink className="w-4 h-4" />
        Related Tools
      </h4>
      <div className="flex flex-wrap gap-2">
        {relatedToolIds.map((toolId) => (
          <Button
            key={toolId}
            variant="outline"
            size="sm"
            asChild
          >
            <a href={`/tools/${toolId}/docs`}>
              {toolId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * Documentation Badge Component
 * Small badge showing documentation status
 */
export function DocumentationBadge({
  status,
  lastUpdated
}: {
  status: 'complete' | 'partial' | 'missing';
  lastUpdated?: Date;
}) {
  const getStatusInfo = () => {
    switch (status) {
      case 'complete':
        return { color: 'bg-green-500', text: 'Complete' };
      case 'partial':
        return { color: 'bg-yellow-500', text: 'In Progress' };
      case 'missing':
        return { color: 'bg-red-500', text: 'Missing' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
      <span className="text-gray-600 dark:text-gray-400">
        {statusInfo.text}
      </span>
      {lastUpdated && (
        <span className="text-gray-500">
          Updated {lastUpdated.toLocaleDateString()}
        </span>
      )}
    </div>
  );
}

export default DocumentationIntegration;
