/**
 * Feedback Tooltip Component
 * Lightweight tooltip for quick feedback collection without disrupting user workflow
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFeedbackStore } from '@/lib/feedback/feedback-store';
import { FeedbackType } from '@/types/feedback';

interface FeedbackTooltipProps {
  children: React.ReactNode;
  type?: FeedbackType;
  position?: 'top' | 'bottom' | 'left' | 'right';
  title?: string;
  placeholder?: string;
  showQuickActions?: boolean;
  className?: string;
}

export function FeedbackTooltip({
  children,
  type = 'general',
  position = 'top',
  title = 'Quick Feedback',
  placeholder = 'Share your thoughts...',
  showQuickActions = true,
  className
}: FeedbackTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const { submitQuickFeedback, trackInteraction } = useFeedbackStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      trackInteraction('feedback_tooltip_opened', { type, position });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, type, position]);

  const handleSubmit = async () => {
    if (!message.trim() && !rating) return;

    setIsSubmitting(true);
    try {
      await submitQuickFeedback({
        type,
        message: message.trim(),
        rating,
        source: 'tooltip',
        context: {
          type,
          position,
          hasRating: !!rating,
          hasMessage: !!message.trim(),
        }
      });

      setMessage('');
      setRating(null);
      setIsOpen(false);

      trackInteraction('feedback_tooltip_submitted', { type, hasRating: !!rating, hasMessage: !!message.trim() });
    } catch (error) {
      console.error('Failed to submit quick feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAction = async (action: 'thumbs_up' | 'thumbs_down') => {
    setIsSubmitting(true);
    try {
      await submitQuickFeedback({
        type,
        rating: action === 'thumbs_up' ? 5 : 1,
        source: 'tooltip',
        context: {
          type,
          position,
          quickAction: action,
        }
      });

      setIsOpen(false);
      trackInteraction('feedback_quick_action', { type, action });
    } catch (error) {
      console.error('Failed to submit quick feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-180';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 -translate-x-1/2 rotate-90';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 translate-x-1/2 -rotate-90';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center space-x-1 px-3 py-1.5 text-sm rounded-full",
          "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
          "text-gray-700 dark:text-gray-300 cursor-pointer transition-colors",
          className
        )}
      >
        <MessageCircle className="h-4 w-4" />
        <span>Feedback</span>
      </div>

      {isOpen && (
        <>
          {/* Arrow */}
          <div className={cn(
            "absolute w-0 h-0 border-l-8 border-r-8 border-t-8",
            "border-l-transparent border-r-transparent",
            position === 'top' || position === 'bottom'
              ? 'border-b-white dark:border-b-gray-800'
              : 'border-t-white dark:border-t-gray-800',
            getArrowClasses()
          )} />

          {/* Tooltip Content */}
          <div className={cn(
            "absolute z-50 w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700",
            getPositionClasses()
          )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                {title}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 -mr-2 -mt-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            {showQuickActions && (
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs text-gray-600 dark:text-gray-400">Quick feedback:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('thumbs_up')}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1"
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>Good</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('thumbs_down')}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1"
                >
                  <ThumbsDown className="h-3 w-3" />
                  <span>Bad</span>
                </Button>
              </div>
            )}

            {/* Rating */}
            {(type === 'satisfaction' || type === 'rating') && (
              <div className="mb-3">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Rate this:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <svg
                          className={cn(
                            "w-4 h-4 transition-colors",
                            star <= (rating || 0)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 dark:text-gray-600"
                          )}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="mb-3">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="resize-none text-sm"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {message.length}/500
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || (!message.trim() && !rating)}
                className="flex items-center space-x-1"
              >
                <Send className="h-3 w-3" />
                <span>{isSubmitting ? 'Sending...' : 'Send'}</span>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FeedbackTooltip;
