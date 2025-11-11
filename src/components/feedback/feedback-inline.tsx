/**
 * Feedback Inline Component
 * Inline feedback form that appears within the page flow for contextual feedback
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useFeedbackStore } from '@/lib/feedback/feedback-store';
import { FeedbackType } from '@/types/feedback';

interface FeedbackInlineProps {
  type?: FeedbackType;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  position?: 'floating' | 'inline';
  showByDefault?: boolean;
  className?: string;
}

export function FeedbackInline({
  type = 'general',
  title = 'Have feedback?',
  subtitle = 'Help us improve by sharing your thoughts',
  placeholder = 'Tell us what you think...',
  position = 'floating',
  showByDefault = false,
  className
}: FeedbackInlineProps) {
  const [isExpanded, setIsExpanded] = useState(showByDefault);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const { submitQuickFeedback, trackInteraction, shouldShowRequest } = useFeedbackStore();

  useEffect(() => {
    if (!showByDefault && shouldShowRequest && shouldShowRequest({ id: 'inline', enabled: true } as any)) {
      // Auto-expand after a delay
      const timer = setTimeout(() => {
        setIsExpanded(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showByDefault, shouldShowRequest]);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await submitQuickFeedback({
        type,
        message: message.trim(),
        email: showEmail ? email : undefined,
        source: 'inline',
        context: {
          position,
          hasEmail: !!email,
          expanded: isExpanded,
        }
      });

      setMessage('');
      setEmail('');
      setIsExpanded(false);

      trackInteraction('feedback_inline_submitted', { type, hasEmail: !!email });
    } catch (error) {
      console.error('Failed to submit inline feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    trackInteraction('feedback_inline_toggled', { expanded: !isExpanded, type });
  };

  if (position === 'floating') {
    return (
      <div className={cn(
        "fixed bottom-6 right-6 z-40 w-80 max-w-[calc(100vw-2rem)]",
        className
      )}>
        <Card className={cn(
          "bg-white dark:bg-gray-900 border shadow-lg transition-all duration-300",
          isExpanded ? "max-h-96" : "max-h-14"
        )}>
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={handleExpand}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {title}
                </h3>
                {!isExpanded && subtitle && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isExpanded && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(false);
                  }}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <ChevronUp className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200",
                !isExpanded && "rotate-180"
              )} />
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="px-4 pb-4 space-y-3">
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}

              {/* Message Input */}
              <div>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={placeholder}
                  rows={4}
                  className="resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {message.length}/1000
                  </span>
                </div>
              </div>

              {/* Email (Optional) */}
              {!showEmail ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmail(true)}
                  className="text-xs p-0 h-auto hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400"
                >
                  + Add email for follow-up
                </Button>
              ) : (
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com (optional)"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setMessage('');
                    setEmail('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !message.trim()}
                  className="flex items-center space-x-1"
                >
                  <Send className="h-3 w-3" />
                  <span>{isSubmitting ? 'Sending...' : 'Send Feedback'}</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Inline position
  return (
    <Card className={cn(
      "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
      className
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {title}
              </h3>
              {!isExpanded && subtitle && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="flex items-center space-x-1"
          >
            {isExpanded ? (
              <>
                <X className="h-4 w-4" />
                <span>Close</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Share Feedback</span>
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="resize-none"
              maxLength={1000}
            />

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {message.length}/1000
              </span>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsExpanded(false);
                    setMessage('');
                    setEmail('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !message.trim()}
                  className="flex items-center space-x-1"
                >
                  <Send className="h-3 w-3" />
                  <span>{isSubmitting ? 'Sending...' : 'Send'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default FeedbackInline;
