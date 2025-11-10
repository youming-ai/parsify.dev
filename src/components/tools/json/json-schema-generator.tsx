/**
 * JSON Schema Generator Component
 * Generate JSON Schema from JSON data samples with validation rules
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Schema,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Upload,
  Settings,
  Code,
  FileJson,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { validateInput } from '@/lib/validation';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface SchemaOptions {
  strictTypes: boolean;
  includeExamples: boolean;
  includeDescriptions: boolean;
  requiredFields: boolean;
  additionalProperties: boolean;
  schemaVersion: string;
  outputFormat: 'json' | 'yaml';
}

export function JSONSchemaGenerator({ className }: { className?: string }) {
  const [jsonInput, setJsonInput] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [options, setOptions] = useState<SchemaOptions>({
    strictTypes: true,
    includeExamples: false,
    includeDescriptions: true,
    requiredFields: true,
    additionalProperties: false,
    schemaVersion: 'http://json-schema.org/draft-07/schema#',
    outputFormat: 'json'
  });

  const [stats, setStats] = useState({
    inputSize: 0,
    outputSize: 0,
    processingTime: 0,
    propertiesFound: 0,
    requiredFields: 0
  });

  // Initialize session
  useEffect(() => {
    const session = createSession('json-schema-generator', {
      initialInput: '',
      options
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Validate JSON input
  const validateJSON = useCallback((text: string) => {
    if (!text.trim()) {
      setIsValid(true);
      setValidationError('');
      return true;
    }

    const validation = validateInput('json-formatter', text);
    if (validation.isValid) {
      try {
        JSON.parse(text);
        setIsValid(true);
        setValidationError('');
        return true;
      } catch (error) {
        setIsValid(false);
        setValidationError(error instanceof Error ? error.message : 'Invalid JSON');
        return false;
      }
    } else {
      setIsValid(false);
      setValidationError(validation.errors[0]?.message || 'Invalid JSON');
      return false;
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setJsonInput(value);
    validateJSON(value);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { json: value, options },
        lastActivity: new Date()
      });
    }
  }, [validateJSON, sessionId, options]);

  // Infer JSON Schema from data
  const generateSchema = useCallback((data: any, options: SchemaOptions): any => {
    const inferType = (value: any): string => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value;
    };

    const inferSchema = (value: any, key: string = 'root', depth: number = 0): any => {
      const type = inferType(value);
      const schema: any = { type };

      // Add description if enabled
      if (options.includeDescriptions && key !== 'root') {
        schema.description = `The ${key.replace(/_/g, ' ')} field`;
      }

      switch (type) {
        case 'object':
          if (value === null) return { type: 'null' };

          const properties: any = {};
          const required: string[] = [];
          let propertyCount = 0;

          for (const [propKey, propValue] of Object.entries(value)) {
            properties[propKey] = inferSchema(propValue, propKey, depth + 1);

            if (options.requiredFields && propValue !== null && propValue !== undefined) {
              required.push(propKey);
            }

            propertyCount++;
          }

          schema.properties = properties;

          if (required.length > 0 && options.requiredFields) {
            schema.required = required;
          }

          if (!options.additionalProperties) {
            schema.additionalProperties = false;
          }

          // Update stats
          if (depth === 0) {
            setStats(prev => ({ ...prev, propertiesFound: propertyCount, requiredFields: required.length }));
          }

          break;

        case 'array':
          if (value.length === 0) {
            schema.items = {};
          } else {
            // Infer item type from first few elements
            const itemTypes = new Set<string>();
            const sampleSize = Math.min(5, value.length);

            for (let i = 0; i < sampleSize; i++) {
              itemTypes.add(inferType(value[i]));
            }

            if (itemTypes.size === 1) {
              schema.items = inferSchema(value[0], 'item', depth + 1);
            } else {
              // Mixed types - use schema union
              schema.items = {
                anyOf: Array.from(itemTypes).map(type => ({ type }))
              };
            }

            // Add minItems and maxItems if strict
            if (options.strictTypes) {
              schema.minItems = value.length;
              schema.maxItems = value.length;
            }
          }

          // Add example if enabled
          if (options.includeExamples && value.length > 0) {
            schema.examples = [value[0]];
          }

          break;

        case 'string':
          // Add format detection for common patterns
          if (options.strictTypes) {
            // Email detection
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              schema.format = 'email';
            }
            // Date detection
            else if (!isNaN(Date.parse(value))) {
              schema.format = 'date-time';
            }
            // URI detection
            else if (/^https?:\/\//.test(value)) {
              schema.format = 'uri';
            }
          }

          // Add length constraints if strict
          if (options.strictTypes) {
            schema.minLength = value.length;
            schema.maxLength = value.length;
          }

          // Add example if enabled
          if (options.includeExamples) {
            schema.examples = [value];
          }

          break;

        case 'number':
          // Add numeric constraints if strict
          if (options.strictTypes) {
            schema.minimum = value;
            schema.maximum = value;
          }

          // Determine if integer or float
          if (Number.isInteger(value)) {
            schema.type = 'integer';
          }

          // Add example if enabled
          if (options.includeExamples) {
            schema.examples = [value];
          }

          break;

        case 'boolean':
          // Add example if enabled
          if (options.includeExamples) {
            schema.examples = [value];
          }
          break;
      }

      return schema;
    };

    // Start inference from root data
    const schema = inferSchema(data);

    // Add JSON Schema metadata
    const result: any = {
      $schema: options.schemaVersion,
      title: 'Generated Schema',
      description: 'JSON Schema generated from sample data',
      ...schema
    };

    // Add additional metadata
    if (options.includeExamples) {
      result.examples = [data];
    }

    return result;
  }, []);

  // Generate schema
  const handleGenerateSchema = useCallback(async () => {
    if (!jsonInput.trim() || !isValid) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      const data = JSON.parse(jsonInput);
      const schema = generateSchema(data, options);

      let output: string;
      if (options.outputFormat === 'yaml') {
        // Simple YAML conversion (basic implementation)
        output = convertToYAML(schema);
      } else {
        output = JSON.stringify(schema, null, 2);
      }

      setGeneratedSchema(output);

      const processingTime = Date.now() - startTime;
      setStats(prev => ({
        ...prev,
        inputSize: jsonInput.length,
        outputSize: output.length,
        processingTime
      }));

      toast.success('JSON Schema generated successfully');

      if (sessionId) {
        updateSession(sessionId, {
          results: { schema: output, stats: { processingTime } },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'generate-schema', true);
      }
    } catch (error) {
      toast.error('Failed to generate JSON Schema');
      if (sessionId) addToHistory(sessionId, 'generate-schema', false);
    } finally {
      setIsProcessing(false);
    }
  }, [jsonInput, isValid, options, generateSchema, sessionId]);

  // Simple YAML converter (basic implementation)
  const convertToYAML = (obj: any, indent: number = 0): string => {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n`;
          yaml += convertToYAML(value, indent + 1);
        } else {
          yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
        }
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        yaml += `${spaces}- `;
        if (typeof item === 'object' && item !== null) {
          yaml += '\n' + convertToYAML(item, indent + 1);
        } else {
          yaml += JSON.stringify(item) + '\n';
        }
      }
    } else {
      yaml += `${spaces}${JSON.stringify(obj)}\n`;
    }

    return yaml;
  };

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generatedSchema).then(() => {
      toast.success('Schema copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy schema');
    });
  }, [generatedSchema]);

  // Download schema
  const downloadSchema = useCallback(() => {
    if (!generatedSchema) return;

    const blob = new Blob([generatedSchema], {
      type: options.outputFormat === 'yaml' ? 'text/yaml' : 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema.${options.outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Schema file downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [generatedSchema, options.outputFormat, sessionId]);

  // Upload JSON file
  const uploadJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      validateJSON(content);
      toast.success('File uploaded successfully');

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { json: content, fileName: file.name, options },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'upload', true);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      if (sessionId) addToHistory(sessionId, 'upload', false);
    };
    reader.readAsText(file);
  }, [validateJSON, sessionId, options]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Schema className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">JSON Schema Generator</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Settings className=\"h-4 w-4 mr-2\" />
            {showAdvanced ? 'Hide Options' : 'Show Options'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Input JSON */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <FileJson className=\"h-5 w-5 mr-2\" />
                Sample JSON
              </div>
              <div className=\"flex items-center space-x-2\">
                {isValid ? (
                  <CheckCircle2 className=\"h-5 w-5 text-green-500\" />
                ) : (
                  <XCircle className=\"h-5 w-5 text-red-500\" />
                )}
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className=\"h-4 w-4 mr-2\" />
                  Upload
                </Button>
                <input
                  id=\"file-upload\"
                  type=\"file\"
                  accept=\".json\"
                  onChange={uploadJSON}
                  className=\"hidden\"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder=\"Paste your JSON sample here...\"
              className=\"min-h-[400px] font-mono text-sm\"
            />
            {validationError && (
              <div className=\"mt-2 text-sm text-red-600 dark:text-red-400\">
                {validationError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Schema */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <Code className=\"h-5 w-5 mr-2\" />
                Generated Schema
              </div>
              <div className=\"flex items-center space-x-2\">
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={copyToClipboard}
                  disabled={!generatedSchema}
                >
                  <Copy className=\"h-4 w-4 mr-2\" />
                  Copy
                </Button>
                <Button
                  variant=\"outline\"
                  size=\"sm\"
                  onClick={downloadSchema}
                  disabled={!generatedSchema}
                >
                  <Download className=\"h-4 w-4 mr-2\" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedSchema}
              readOnly
              placeholder=\"Generated JSON Schema will appear here...\"
              className=\"min-h-[400px] font-mono text-sm bg-muted/50\"
            />
          </CardContent>
        </Card>
      </div>

      {/* Configuration Options */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle>Schema Generation Options</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue=\"basic\" className=\"w-full\">
              <TabsList className=\"grid w-full grid-cols-3\">
                <TabsTrigger value=\"basic\">Basic</TabsTrigger>
                <TabsTrigger value=\"advanced\">Advanced</TabsTrigger>
                <TabsTrigger value=\"output\">Output</TabsTrigger>
              </TabsList>

              <TabsContent value=\"basic\" className=\"space-y-4 mt-4\">
                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                  <div className=\"flex items-center space-x-2\">
                    <Switch
                      id=\"strict-types\"
                      checked={options.strictTypes}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, strictTypes: checked }))
                      }
                    />
                    <Label htmlFor=\"strict-types\">Strict type inference</Label>
                  </div>

                  <div className=\"flex items-center space-x-2\">
                    <Switch
                      id=\"required-fields\"
                      checked={options.requiredFields}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, requiredFields: checked }))
                      }
                    />
                    <Label htmlFor=\"required-fields\">Include required fields</Label>
                  </div>

                  <div className=\"flex items-center space-x-2\">
                    <Switch
                      id=\"examples\"
                      checked={options.includeExamples}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, includeExamples: checked }))
                      }
                    />
                    <Label htmlFor=\"examples\">Include examples</Label>
                  </div>

                  <div className=\"flex items-center space-x-2\">
                    <Switch
                      id=\"descriptions\"
                      checked={options.includeDescriptions}
                      onCheckedChange={(checked) =>
                        setOptions(prev => ({ ...prev, includeDescriptions: checked }))
                      }
                    />
                    <Label htmlFor=\"descriptions\">Include descriptions</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value=\"advanced\" className=\"space-y-4 mt-4\">
                <div className=\"flex items-center space-x-2\">
                  <Switch
                    id=\"additional-properties\"
                    checked={options.additionalProperties}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, additionalProperties: checked }))
                    }
                  />
                  <Label htmlFor=\"additional-properties\">
                    Allow additional properties
                  </Label>
                </div>

                <div className=\"space-y-2\">
                  <Label>Schema Version</Label>
                  <Select
                    value={options.schemaVersion}
                    onValueChange={(value) =>
                      setOptions(prev => ({ ...prev, schemaVersion: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"http://json-schema.org/draft-07/schema#\">
                        Draft 07
                      </SelectItem>
                      <SelectItem value=\"http://json-schema.org/draft-06/schema#\">
                        Draft 06
                      </SelectItem>
                      <SelectItem value=\"http://json-schema.org/draft-04/schema#\">
                        Draft 04
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value=\"output\" className=\"space-y-4 mt-4\">
                <div className=\"space-y-2\">
                  <Label>Output Format</Label>
                  <Select
                    value={options.outputFormat}
                    onValueChange={(value: 'json' | 'yaml') =>
                      setOptions(prev => ({ ...prev, outputFormat: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"json\">JSON</SelectItem>
                      <SelectItem value=\"yaml\">YAML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      <div className=\"flex justify-center\">
        <Button
          onClick={handleGenerateSchema}
          disabled={isProcessing || !isValid || !jsonInput.trim()}
          size=\"lg\"
          className=\"flex items-center space-x-2\"
        >
          <RefreshCw className={`h-5 w-5 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>{isProcessing ? 'Generating...' : 'Generate Schema'}</span>
        </Button>
      </div>

      {/* Statistics */}
      {generatedSchema && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <Eye className=\"h-5 w-5 mr-2\" />
              Generation Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-5 gap-4 text-center\">
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-blue-600\">{stats.inputSize}</div>
                <div className=\"text-sm text-muted-foreground\">Input Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-green-600\">{stats.outputSize}</div>
                <div className=\"text-sm text-muted-foreground\">Output Size</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-purple-600\">{stats.propertiesFound}</div>
                <div className=\"text-sm text-muted-foreground\">Properties</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-orange-600\">{stats.requiredFields}</div>
                <div className=\"text-sm text-muted-foreground\">Required Fields</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-pink-600\">{stats.processingTime}</div>
                <div className=\"text-sm text-muted-foreground\">Processing Time (ms)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
