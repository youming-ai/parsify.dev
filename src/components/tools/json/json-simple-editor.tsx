'use client';

import { CheckCircle, Copy, FileText, Lightning, Quotes, XCircle } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { CodeEditor } from '../code/codemirror-editor';
import { isSerializedJsonString, parseSerializedJson } from './json-utils';

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface JsonSimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (errors: ValidationError[]) => void;
  className?: string;
  height?: string | number;
  readOnly?: boolean;
  showToolbar?: boolean;
  placeholder?: string;
  onFormat?: () => void;
  onMinify?: () => void;
  onCopy?: () => void;
}

export const JsonSimpleEditor: React.FC<JsonSimpleEditorProps> = ({
  value,
  onChange,
  onValidationChange,
  className,
  height = 400,
  readOnly = false,
  showToolbar = true,
  placeholder = 'Enter JSON here...',
  onFormat,
  onMinify,
  onCopy,
}) => {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [isSerialized, setIsSerialized] = useState(false);

  // Check if content looks like serialized JSON
  useEffect(() => {
    try {
      setIsSerialized(isSerializedJsonString(value));
    } catch {
      setIsSerialized(false);
    }
  }, [value]);

  // Validate JSON
  const _validateJson = useCallback(
    (jsonString: string) => {
      const errors: ValidationError[] = [];
      let valid = true;

      try {
        // Handle empty or whitespace-only strings
        if (!jsonString || !jsonString.trim()) {
          valid = true; // Empty input is considered valid
        } else {
          JSON.parse(jsonString);
        }
      } catch (error) {
        valid = false;
        if (error instanceof SyntaxError) {
          errors.push({
            line: 1,
            column: 1,
            message: error.message,
            severity: 'error',
          });
        }
      }

      // Don't update state if component is unmounted or if we're in the middle of a re-render
      try {
        setValidationErrors(errors);
        setIsValid(valid);
        onValidationChange?.(errors);
      } catch (_stateError) {
        // State update race condition — safe to ignore
      }
    },
    [onValidationChange]
  );

  // Handle value change
  const handleChange = useCallback(
    (newValue: string) => {
      try {
        onChange(newValue);
      } catch (_error) {
        // onChange callback error — safe to ignore
      }
    },
    [onChange]
  );

  // Format JSON
  const formatJson = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      onFormat?.();
    } catch (_error) {
      toast.error('Cannot format invalid JSON');
    }
  }, [value, onChange, onFormat]);

  // Minify JSON
  const minifyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      onChange(minified);
      onMinify?.();
    } catch (_error) {
      toast.error('Cannot minify invalid JSON');
    }
  }, [value, onChange, onMinify]);

  // Copy JSON
  const copyJson = useCallback(() => {
    navigator.clipboard.writeText(value);
    onCopy?.();
  }, [value, onCopy]);

  // Unescape serialized JSON
  const unescapeJson = useCallback(() => {
    try {
      const parsed = parseSerializedJson(value);
      onChange(parsed);
    } catch (_error) {
      toast.error('Cannot unescape JSON');
    }
  }, [value, onChange]);

  return (
    <div className={cn('w-full', className)}>
      {showToolbar && (
        <div className="mb-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-base">JSON Editor</h4>
            <Badge
              variant={isValid ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              {isValid ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Valid
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  {validationErrors.length} Error
                  {validationErrors.length !== 1 ? 's' : ''}
                </>
              )}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={formatJson} disabled={!isValid}>
              <FileText className="mr-1 h-4 w-4" />
              Format
            </Button>

            <Button variant="outline" size="sm" onClick={minifyJson} disabled={!isValid}>
              <Lightning className="mr-1 h-4 w-4" />
              Minify
            </Button>

            {isSerialized && (
              <Button
                variant="outline"
                size="sm"
                onClick={unescapeJson}
                className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                title="Detected serialized JSON string. Click to unescape and format."
              >
                <Quotes className="mr-1 h-4 w-4" />
                Unescape
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={copyJson}>
              <Copy className="mr-1 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border">
        <CodeEditor
          value={value}
          onChange={handleChange}
          language="json"
          height={height}
          readOnly={readOnly}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

// For backward compatibility
export const JsonAdvancedEditor = JsonSimpleEditor;
export default JsonSimpleEditor;
