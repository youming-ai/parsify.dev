'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Settings, Shield, XCircle } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

export interface ValidationRule {
  id: string;
  name: string;
  type: 'required' | 'pattern' | 'length' | 'range' | 'email' | 'url' | 'number' | 'custom';
  field: string;
  value?: string | number;
  operation?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'min' | 'max';
  enabled: boolean;
  description: string;
}

export interface ValidationResult {
  field: string;
  value: any;
  valid: boolean;
  errors: string[];
  warnings: string[];
  rules: ValidationRule[];
}

export interface DataValidationResult {
  isValid: boolean;
  results: ValidationResult[];
  totalErrors: number;
  totalWarnings: number;
  summary: string;
  timestamp: Date;
}

interface DataValidatorProps {
  onValidationComplete?: (result: DataValidationResult) => void;
  className?: string;
}

// Predefined validation rules templates
const ruleTemplates = {
  email: {
    type: 'email' as const,
    field: 'email',
    description: 'Valid email address format',
  },
  url: {
    type: 'url' as const,
    field: 'url',
    description: 'Valid URL format',
  },
  required: {
    type: 'required' as const,
    field: 'name',
    description: 'Field must not be empty',
  },
  length: {
    type: 'length' as const,
    field: 'password',
    operation: 'min' as const,
    value: 8,
    description: 'Minimum 8 characters',
  },
  pattern: {
    type: 'pattern' as const,
    field: 'phone',
    operation: 'regex' as const,
    value: '^\\d{3}-\\d{3}-\\d{4}$',
    description: 'Phone format: XXX-XXX-XXXX',
  },
};

export function DataValidator({ onValidationComplete, className }: DataValidatorProps) {
  const [inputData, setInputData] = React.useState('');
  const [dataFormat, setDataFormat] = React.useState<'json' | 'csv' | 'xml' | 'yaml' | 'form'>(
    'json'
  );
  const [validationRules, setValidationRules] = React.useState<ValidationRule[]>([]);
  const [results, setResults] = React.useState<DataValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate URL format
  const validateURL = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Validate pattern (regex)
  const validatePattern = (value: string, pattern: string): boolean => {
    try {
      const regex = new RegExp(pattern);
      return regex.test(value);
    } catch {
      return false;
    }
  };

  // Validate length
  const validateLength = (value: string, operation: 'min' | 'max', length: number): boolean => {
    const valueLength = value.length;
    switch (operation) {
      case 'min':
        return valueLength >= length;
      case 'max':
        return valueLength <= length;
      default:
        return true;
    }
  };

  // Validate range
  const validateRange = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  };

  // Parse input data based on format
  const parseData = (data: string, format: string): any => {
    try {
      switch (format) {
        case 'json':
          return JSON.parse(data);
        case 'csv': {
          // Simple CSV parsing
          const lines = data.split('\n').filter((line) => line.trim());
          const headers = lines[0].split(',').map((h) => h.trim());
          const rows = lines.slice(1).map((line) => {
            const values = line.split(',').map((v) => v.trim());
            return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
          });
          return rows;
        }
        case 'xml': {
          // Basic XML parsing - in real implementation, use proper XML parser
          const parser = new DOMParser();
          const doc = parser.parseFromString(data, 'text/xml');
          if (doc.querySelector('parsererror')) {
            throw new Error('Invalid XML');
          }
          return { xml: data, parsed: true };
        }
        case 'yaml':
          // YAML parsing would require a library
          return { yaml: data, note: 'YAML parsing not implemented' };
        case 'form': {
          // Parse form data (key=value pairs)
          const formObj: any = {};
          data.split('\n').forEach((line) => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              formObj[key.trim()] = valueParts.join('=').trim();
            }
          });
          return formObj;
        }
        default:
          return data;
      }
    } catch (error) {
      throw new Error(
        `Failed to parse ${format} data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Add rule
  const addRule = (template: (typeof ruleTemplates)[keyof typeof ruleTemplates]) => {
    const newRule: ValidationRule = {
      id: Date.now().toString(),
      name: template.field,
      ...template,
      enabled: true,
    };
    setValidationRules((prev) => [...prev, newRule]);
  };

  // Add custom rule
  const addCustomRule = () => {
    const newRule: ValidationRule = {
      id: Date.now().toString(),
      name: 'Custom Rule',
      type: 'custom',
      field: 'field',
      enabled: true,
      description: 'Custom validation rule',
    };
    setValidationRules((prev) => [...prev, newRule]);
  };

  // Remove rule
  const removeRule = (id: string) => {
    setValidationRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  // Update rule
  const updateRule = (id: string, updates: Partial<ValidationRule>) => {
    setValidationRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
    );
  };

  // Validate data
  const validateData = async () => {
    if (!inputData.trim()) {
      toast.error('Please enter data to validate');
      return;
    }

    if (validationRules.length === 0) {
      toast.error('Please add at least one validation rule');
      return;
    }

    setIsProcessing(true);

    try {
      const parsedData = parseData(inputData, dataFormat);
      const results: ValidationResult[] = [];
      let totalErrors = 0;
      let totalWarnings = 0;

      // Get all fields from data
      const getAllFields = (data: any, prefix = ''): Array<{ path: string; value: any }> => {
        const fields: Array<{ path: string; value: any }> = [];

        if (Array.isArray(data)) {
          data.forEach((item, index) => {
            const itemFields = getAllFields(item, `${prefix}[${index}]`);
            fields.push(...itemFields);
          });
        } else if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            const currentPath = prefix ? `${prefix}.${key}` : key;
            fields.push({ path: currentPath, value });
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              const nestedFields = getAllFields(value, currentPath);
              fields.push(...nestedFields);
            }
          });
        } else {
          fields.push({ path: prefix || 'value', value: data });
        }

        return fields;
      };

      const allFields = getAllFields(parsedData);

      // Apply validation rules
      for (const fieldData of allFields) {
        const fieldRules = validationRules.filter(
          (rule) => rule.enabled && (fieldData.path.includes(rule.field) || rule.field === '*')
        );

        if (fieldRules.length > 0) {
          const errors: string[] = [];
          const warnings: string[] = [];

          for (const rule of fieldRules) {
            const value = String(fieldData.value);

            try {
              let isValid = true;
              let errorMessage = '';

              switch (rule.type) {
                case 'required':
                  isValid = value.trim().length > 0;
                  errorMessage = `${rule.field} is required`;
                  break;
                case 'email':
                  isValid = validateEmail(value);
                  errorMessage = 'Invalid email format';
                  break;
                case 'url':
                  isValid = validateURL(value);
                  errorMessage = 'Invalid URL format';
                  break;
                case 'pattern':
                  if (rule.value) {
                    isValid = validatePattern(value, String(rule.value));
                    errorMessage = `Pattern validation failed: ${rule.value}`;
                  }
                  break;
                case 'length':
                  if (
                    rule.value &&
                    rule.operation &&
                    (rule.operation === 'min' || rule.operation === 'max')
                  ) {
                    isValid = validateLength(value, rule.operation, Number(rule.value));
                    errorMessage = `Length must be ${rule.operation} ${rule.value} characters`;
                  }
                  break;
                case 'range':
                  if (typeof fieldData.value === 'number' && rule.value) {
                    // For range, value should be like "min,max"
                    const [min, max] = String(rule.value).split(',').map(Number);
                    isValid = validateRange(fieldData.value, min, max);
                    errorMessage = `Value must be between ${min} and ${max}`;
                  }
                  break;
                case 'number':
                  isValid = !Number.isNaN(Number(value));
                  errorMessage = 'Must be a valid number';
                  break;
                case 'custom':
                  // Custom validation logic would go here
                  warnings.push('Custom validation not implemented');
                  break;
              }

              if (!isValid) {
                errors.push(errorMessage);
                totalErrors++;
              }
            } catch (error) {
              errors.push(
                `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
              totalErrors++;
            }
          }

          results.push({
            field: fieldData.path,
            value: fieldData.value,
            valid: errors.length === 0,
            errors,
            warnings,
            rules: fieldRules,
          });

          totalWarnings += warnings.length;
        }
      }

      const validationSummary =
        results.length > 0
          ? `Validated ${results.length} fields: ${results.filter((r) => r.valid).length} passed, ${results.filter((r) => !r.valid).length} failed`
          : 'No fields to validate';

      const validationResult: DataValidationResult = {
        isValid: totalErrors === 0,
        results,
        totalErrors,
        totalWarnings,
        summary: validationSummary,
        timestamp: new Date(),
      };

      setResults(validationResult);
      onValidationComplete?.(validationResult);

      if (totalErrors === 0) {
        toast.success('All validations passed!');
      } else {
        toast.error(`Validation failed: ${totalErrors} error(s) found`);
      }
    } catch (error) {
      toast.error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Load sample data
  const loadSampleData = (format: string) => {
    const samples = {
      json: `{
	"name": "John Doe",
	"email": "john.doe@example.com",
	"age": 30,
	"phone": "555-123-4567",
	"website": "https://johndoe.com"
}`,
      csv: `name,email,age,phone,website
John Doe,john.doe@example.com,30,555-123-4567,https://johndoe.com
Jane Smith,jane.smith@example.com,25,555-987-6543,https://janesmith.com`,
      xml: `<?xml version="1.0" encoding="UTF-8"?>
<user>
	<name>John Doe</name>
	<email>john.doe@example.com</email>
	<age>30</age>
</user>`,
      yaml: `name: John Doe
email: john.doe@example.com
age: 30
phone: 555-123-4567`,
      form: `name=John Doe
email=john.doe@example.com
age=30
phone=555-123-4567
website=https://johndoe.com`,
    };

    setInputData(samples[format as keyof typeof samples] || '');
    setDataFormat(format as any);
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Data Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Data Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data Format</Label>
                <Select value={dataFormat} onValueChange={(value: any) => setDataFormat(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select data format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="yaml">YAML</SelectItem>
                    <SelectItem value="form">Form Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sample Data</Label>
                <Button
                  variant="outline"
                  onClick={() => loadSampleData(dataFormat)}
                  className="w-full"
                >
                  Load {dataFormat.toUpperCase()} Sample
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Input Data</Label>
              <Textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder={`Enter ${dataFormat.toUpperCase()} data to validate...`}
                className="min-h-32 font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Validation Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Validation Rules
              </span>
              <Button onClick={addCustomRule} size="sm">
                Add Custom Rule
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {validationRules.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Add validation rules to check your data. You can use predefined templates or
                    create custom rules.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {validationRules.map((rule) => (
                    <div key={rule.id} className="rounded border p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                          />
                          <Input
                            value={rule.name}
                            onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                            className="w-48"
                            placeholder="Rule name"
                          />
                          <Badge variant="outline">{rule.type}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeRule(rule.id)}>
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        <Input
                          value={rule.field}
                          onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                          placeholder="Field name"
                        />
                        {(rule.type === 'length' || rule.type === 'range') && (
                          <Select
                            value={rule.operation}
                            onValueChange={(value: any) =>
                              updateRule(rule.id, { operation: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Operation" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="min">Minimum</SelectItem>
                              <SelectItem value="max">Maximum</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        {rule.value !== undefined && (
                          <Input
                            value={String(rule.value)}
                            onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                            placeholder="Value"
                          />
                        )}
                      </div>
                      <div className="text-gray-600 text-sm">{rule.description}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 border-t pt-4">
                {Object.entries(ruleTemplates).map(([key, template]) => (
                  <Button key={key} variant="outline" size="sm" onClick={() => addRule(template)}>
                    Add {key}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation */}
        <Button
          onClick={validateData}
          disabled={isProcessing || validationRules.length === 0}
          className="w-full"
        >
          {isProcessing ? 'Validating...' : 'Validate Data'}
        </Button>

        {/* Results */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Validation Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-sm md:grid-cols-4">
                <div>
                  <span className="font-medium">Status:</span>
                  <Badge variant={results.isValid ? 'default' : 'destructive'} className="ml-2">
                    {results.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Fields:</span> {results.results.length}
                </div>
                <div>
                  <span className="font-medium">Errors:</span>
                  <span className="ml-1 text-red-600">{results.totalErrors}</span>
                </div>
                <div>
                  <span className="font-medium">Warnings:</span>
                  <span className="ml-1 text-yellow-600">{results.totalWarnings}</span>
                </div>
              </div>

              <div className="rounded bg-gray-50 p-3">
                <div className="text-sm">{results.summary}</div>
              </div>

              {results.results.length > 0 && (
                <div className="space-y-3">
                  {results.results.map((result, index) => (
                    <div key={index} className="rounded border p-3">
                      <div className="mb-2 flex items-center gap-2">
                        {result.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{result.field}</span>
                        <span className="text-gray-600 text-sm">
                          ({typeof result.value === 'string' ? `"${result.value}"` : result.value})
                        </span>
                      </div>

                      {result.errors.length > 0 && (
                        <div className="space-y-1">
                          {result.errors.map((error, errorIndex) => (
                            <div
                              key={errorIndex}
                              className="flex items-center gap-1 text-red-600 text-sm"
                            >
                              <XCircle className="h-3 w-3" />
                              {error}
                            </div>
                          ))}
                        </div>
                      )}

                      {result.warnings.length > 0 && (
                        <div className="space-y-1">
                          {result.warnings.map((warning, warningIndex) => (
                            <div
                              key={warningIndex}
                              className="flex items-center gap-1 text-sm text-yellow-600"
                            >
                              <AlertCircle className="h-3 w-3" />
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
