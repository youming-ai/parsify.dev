/**
 * Feedback Modal Component
 * Main modal for collecting user feedback with dynamic forms and multi-step support
 */

'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Send, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFeedbackStore } from '@/lib/feedback/feedback-store';
import { FeedbackTemplate, FeedbackQuestion, QuestionType } from '@/types/feedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: FeedbackTemplate;
  className?: string;
}

export function FeedbackModal({ isOpen, onClose, template, className }: FeedbackModalProps) {
  const {
    currentStep,
    formData,
    isSubmitting,
    nextStep,
    previousStep,
    updateFormData,
    setFormData,
    submitFeedback,
    discardFeedback,
    saveDraft,
  } = useFeedbackStore();

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen || !template) return null;

  const currentSection = template.layout.sections[currentStep];
  const totalSteps = template.layout.sections.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = async () => {
    if (validateCurrentSection()) {
      if (isLastStep) {
        await handleSubmit();
      } else {
        nextStep();
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      previousStep();
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (validateAllSections()) {
      await submitFeedback();
      onClose();
    }
  };

  const handleFieldChange = (questionId: string, value: any) => {
    updateFormData(questionId, value);
    // Clear error for this field if it exists
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateCurrentSection = (): boolean => {
    const sectionQuestions = template.questions.filter(q =>
      currentSection.questions.includes(q.id)
    );

    const newErrors: Record<string, string> = {};

    for (const question of sectionQuestions) {
      const value = formData[question.id];

      if (question.required && (value === undefined || value === null || value === '')) {
        newErrors[question.id] = 'This field is required';
      } else if (question.validation) {
        const validationError = validateField(value, question.validation);
        if (validationError) {
          newErrors[question.id] = validationError;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSections = (): boolean => {
    const allErrors: Record<string, string> = {};

    for (const question of template.questions) {
      const value = formData[question.id];

      if (question.required && (value === undefined || value === null || value === '')) {
        allErrors[question.id] = 'This field is required';
      } else if (question.validation && value !== undefined && value !== null && value !== '') {
        const validationError = validateField(value, question.validation);
        if (validationError) {
          allErrors[question.id] = validationError;
        }
      }
    }

    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const validateField = (value: any, validation: any): string | null => {
    if (validation.minLength && typeof value === 'string' && value.length < validation.minLength) {
      return `Minimum length is ${validation.minLength} characters`;
    }

    if (validation.maxLength && typeof value === 'string' && value.length > validation.maxLength) {
      return `Maximum length is ${validation.maxLength} characters`;
    }

    if (validation.min !== undefined && Number(value) < validation.min) {
      return `Minimum value is ${validation.min}`;
    }

    if (validation.max !== undefined && Number(value) > validation.max) {
      return `Maximum value is ${validation.max}`;
    }

    if (validation.pattern && typeof value === 'string' && !new RegExp(validation.pattern).test(value)) {
      return 'Invalid format';
    }

    if (validation.custom && typeof validation.custom === 'function') {
      const customError = validation.custom(value);
      if (typeof customError === 'string') {
        return customError;
      }
    }

    return null;
  };

  const handleClose = () => {
    if (Object.keys(formData).length > 0) {
      saveDraft();
    }
    discardFeedback();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <Card className={cn(
        "relative max-w-2xl w-full max-h-[90vh] mx-4 overflow-hidden",
        "bg-white dark:bg-gray-900 shadow-2xl",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {template.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {template.description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        {template.layout.type === 'multi_step' && totalSteps > 1 && (
          <div className="px-6 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentSection && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {currentSection.title}
                </h3>
                {currentSection.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentSection.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {template.questions
                  .filter(question => currentSection.questions.includes(question.id))
                  .map(question => (
                    <FeedbackQuestionComponent
                      key={question.id}
                      question={question}
                      value={formData[question.id]}
                      onChange={(value) => handleFieldChange(question.id, value)}
                      error={errors[question.id]}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-2">
            {!isFirstStep && template.layout.navigation.showPrevious && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? (
                <>Submitting...</>
              ) : isLastStep ? (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Submit
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface FeedbackQuestionComponentProps {
  question: FeedbackQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

function FeedbackQuestionComponent({ question, value, onChange, error }: FeedbackQuestionComponentProps) {
  const [fieldValue, setFieldValue] = useState(value || '');

  useEffect(() => {
    setFieldValue(value || '');
  }, [value]);

  const handleChange = (newValue: any) => {
    setFieldValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        {question.text}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {question.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {question.description}
        </p>
      )}

      <div className={cn(
        "relative",
        error && "border-red-500 focus-within:border-red-500"
      )}>
        {renderQuestionInput(question, fieldValue, handleChange)}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function renderQuestionInput(question: FeedbackQuestion, value: any, onChange: (value: any) => void) {
  switch (question.type) {
    case 'text':
    case 'email':
    case 'url':
      return (
        <input
          type={question.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={question.description || ''}
          disabled={false}
        />
      );

    case 'textarea':
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          placeholder={question.description || ''}
          disabled={false}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={question.description || ''}
          disabled={false}
        />
      );

    case 'rating':
      return (
        <RatingInput
          value={value || 0}
          onChange={onChange}
          max={question.validation?.max || 5}
          size="lg"
        />
      );

    case 'scale':
      return (
        <ScaleInput
          value={value || 0}
          onChange={onChange}
          min={question.validation?.min || 1}
          max={question.validation?.max || 10}
          labels={question.options?.map(opt => opt.label)}
        />
      );

    case 'choice':
      return (
        <RadioInput
          value={value}
          onChange={onChange}
          options={question.options || []}
        />
      );

    case 'multiple_choice':
      return (
        <CheckboxInput
          value={value || []}
          onChange={onChange}
          options={question.options || []}
        />
      );

    case 'boolean':
      return (
        <BooleanInput
          value={value}
          onChange={onChange}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={false}
        />
      );

    default:
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={question.description || ''}
          disabled={false}
        />
      );
  }
}

// Specialized input components
function RatingInput({ value, onChange, max = 5, size = 'md' }: {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex space-x-1">
      {Array.from({ length: max }, (_, i) => i + 1).map(rating => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange(rating)}
          className={cn(
            "transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded",
            sizeClasses[size]
          )}
        >
          <svg
            className={cn(
              rating <= value ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600",
              "hover:text-yellow-500 transition-colors"
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ScaleInput({ value, onChange, min = 1, max = 10, labels }: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: string[];
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(num => (
          <span key={num} className="flex-1 text-center">
            {num}
          </span>
        ))}
      </div>
      <div className="flex space-x-2">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
              value === num
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      {labels && labels.length > 0 && (
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}

function RadioInput({ value, onChange, options }: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
}) {
  return (
    <div className="space-y-2">
      {options.map(option => (
        <label
          key={option.value}
          className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
        >
          <input
            type="radio"
            name={option.value}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {option.label}
            </div>
            {option.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {option.description}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

function CheckboxInput({ value, onChange, options }: {
  value: string[];
  onChange: (value: string[]) => void;
  options: Array<{ value: string; label: string; description?: string }>;
}) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  return (
    <div className="space-y-2">
      {options.map(option => (
        <label
          key={option.value}
          className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
        >
          <input
            type="checkbox"
            value={option.value}
            checked={value.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {option.label}
            </div>
            {option.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {option.description}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

function BooleanInput({ value, onChange }: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex space-x-4">
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          name="boolean"
          checked={value === true}
          onChange={() => onChange(true)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">Yes</span>
      </label>
      <label className="flex items-center space-x-2">
        <input
          type="radio"
          name="boolean"
          checked={value === false}
          onChange={() => onChange(false)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">No</span>
      </label>
    </div>
  );
}

export default FeedbackModal;
