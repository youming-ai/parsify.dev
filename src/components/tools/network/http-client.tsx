/**
 * HTTP Client Component
 * Test HTTP requests with custom headers, methods, and body content
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Globe,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  AlertTriangle,
  Link as LinkIcon,
  Settings,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';
import { processJSON } from '@/lib/processing';

interface HTTPRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: Date;
}

interface HTTPResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
  size: number;
}

interface RequestHistory {
  request: HTTPRequest;
  response: HTTPResponse;
  success: boolean;
  timestamp: Date;
}

export function HTTPClient({ className }: { className?: string }) {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState<Record<string, string>>({});
  const [body, setBody] = useState('');
  const [contentType, setContentType] = useState('application/json');
  const [authType, setAuthType] = useState('none');
  const [customHeaders, setCustomHeaders] = useState<Record<string, string>>({});

  const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session
  useEffect(() => {
    const session = createSession('http-client', {
      initialUrl: url,
      method,
      headers,
      body,
      contentType,
      authType,
      customHeaders
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Add request to history
  const addToHistory = useCallback((request: HTTPRequest, response: HTTPResponse, success: boolean) => {
    const historyItem: RequestHistory = {
      request,
      response,
      success,
      timestamp: new Date()
    };

    setRequestHistory(prev => {
      const updated = [historyItem, ...prev].slice(-19)]; // Keep last 20 requests
      return updated;
    });
  }, []);

  // Send HTTP request
  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      // Prepare headers
      const requestHeaders = {
        ...headers,
        ...customHeaders,
        'Content-Type': contentType
      };

      // Add authentication header if specified
      if (authType !== 'none') {
        switch (authType) {
          case 'bearer':
            if (customHeaders.Authorization) {
              requestHeaders.Authorization = customHeaders.Authorization;
            } else {
              requestHeaders.Authorization = 'Bearer YOUR_TOKEN_HERE';
            }
            break;
          case 'basic':
            if (customHeaders.Authorization) {
              requestHeaders.Authorization = customHeaders.Authorization;
            } else {
              const encoded = btoa('username:password');
              requestHeaders.Authorization = `Basic ${encoded}`;
            }
            break;
          case 'api-key':
            if (customHeaders['X-API-Key']) {
              requestHeaders['X-API-Key'] = customHeaders['X-API-Key'];
            }
            break;
        }
      }

      // Prepare request body
      let requestBody: string | FormData | null = null;

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (contentType === 'application/json') {
          requestBody = body;
        } else if (contentType === 'application/x-www-form-urlencoded') {
          const formData = new FormData();
          if (typeof body === 'object') {
            Object.entries(body).forEach(([key, value]) => {
              formData.append(key, value);
            });
          } else {
            formData.append('data', body);
          }
          requestBody = formData;
        } else {
          requestBody = body;
        }
      }

      // Make request using fetch API
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody
      });

      const responseTime = Date.now() - startTime;
      const responseSize = parseInt(response.headers.get('content-length') || '0');

      // Parse response
      let responseBody: any = null;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else if (contentType?.includes('text/')) {
        responseBody = await response.text();
      } else if (contentType?.includes('application/xml')) {
        responseBody = await response.text();
      } else {
        responseBody = await response.text();
      }

      const responseResult: HTTPResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        body: responseBody,
        responseTime,
        size: responseSize
      };

      const success = response.status >= 200 && response.status < 300;

      const request: HTTPRequest = {
        id: Date.now().toString(),
        method,
        url,
        headers: requestHeaders,
        body,
        timestamp: new Date.now()
      };

      addToHistory(request, responseResult, success);

      if (success) {
        toast.success(`Request successful (${response.status} ${response.statusText})`);
      } else {
        toast.error(`Request failed: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      toast.error(`Request failed: ${errorMessage}`);

      const errorResponse: HTTPResponse = {
        status: 0,
        statusText: errorMessage,
        headers: {},
        body: errorMessage,
        responseTime: Date.now() - startTime,
        size: 0
      };

      const request: HTTPRequest = {
        id: Date.now().toString(),
        method,
        url,
        headers: requestHeaders,
        body,
        timestamp: new Date.now()
      };

      addToHistory(request, errorResponse, false);
    } finally {
      setIsProcessing(false);
    }
  }, [url, method, headers, body, contentType, customHeaders, authType, addToHistory, sessionId]);

  // Save request as template
  const saveAsTemplate = useCallback(() => {
    const template = {
      method,
      url,
      headers,
      body,
      contentType,
      authType
    };

    // Save to localStorage
    localStorage.setItem('http-templates', JSON.stringify(template));
    toast.success('Request saved as template');
  }, [method, url, headers, body, contentType, authType]);

  // Clear history
  const clearHistory = useCallback(() => {
    setRequestHistory([]);
    setSelectedHistory(null);
    toast.info('Request history cleared');
  }, []);

  // Copy response to clipboard
  const copyResponse = useCallback(async () => {
    if (!qrResult?.response?.body) return;

    try {
      let content: string;

      if (typeof qrResult.response.body === 'object') {
        content = JSON.stringify(qrResult.response.body, null, 2);
      } else {
        content = qrResult.response.body;
      }

      await navigator.clipboard.writeText(content);
      toast.success('Response copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy response');
    }
  }, [qrResult]);

  // Copy request to clipboard
  const copyRequest = useCallback(() => {
    if (!selectedHistory) return;

    try {
      const request = requestHistory[selectedHistory].request;
      const requestText = `${request.method} ${request.url}\\nHeaders: ${JSON.stringify(request.headers)}\\n\\n${request.body}`;

      await navigator.clipboard.writeText(requestText);
      toast.success('Request copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy request');
    }
  }, [selectedHistory]);

  // Load saved template
  const loadTemplate = useCallback(() => {
    const saved = localStorage.getItem('http-templates');
    if (saved) {
      try {
        const template = JSON.parse(saved);
        setUrl(template.url);
        setMethod(template.method);
        setHeaders(template.headers || {});
        setBody(template.body || '');
        setContentType(template.contentType || 'application/json');
        setAuthType(template.authType || 'none');
        setCustomHeaders(template.customHeaders || {});
        toast.success('Template loaded');
      } catch (error) {
        toast.error('Failed to load template');
      }
    }
  }, []);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <Globe className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">HTTP Client</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={loadTemplate}
          >
            Load Template
          </Button>
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={clearHistory}
          >
            Clear History
          </Button>
        </div>
      </div>

      {/* Request Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <Settings className=\"h-5 w-5 mr-2\" />
            HTTP Request Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue=\"basic\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-4\">
              <TabsTrigger value=\"basic\">Basic</TabsTrigger>
              <TabsTrigger value=\"headers\">Headers</TabsTrigger>
              <TabsTrigger value=\"auth\">Authentication</TabsTrigger>
              <TabsTrigger value=\"advanced\">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value=\"basic\" className=\"space-y-4 mt-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"url\">URL:</Label>
                  <Input
                    id=\"url\"
                    type=\"url\"
                    placeholder=\"https://api.example.com/data\"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      handleContentChange(e.target.value);
                    }}
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"method\">Method:</Label>
                  <Select
                    value={method}
                    onValueChange={(value) => setMethod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"GET\">GET</SelectItem>
                      <SelectItem value=\"POST\">POST</SelectItem>
                      <SelectItem value=\"PUT\">PUT</SelectItem>
                      <SelectItem value=\"DELETE\">DELETE</SelectItem>
                      <SelectItem value=\"PATCH\">PATCH</SelectItem>
                      <SelectItem value=\"HEAD\">HEAD</SelectItem>
                      <SelectItem value=\"OPTIONS\">OPTIONS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"content\">Request Body:</Label>
                  <Textarea
                    id=\"content\"
                    placeholder=\"Enter request body (JSON, form data, or raw text)...\"
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      handleContentChange(e.target.value);
                    }}
                    rows={4}
                  />
                </div>
              </div>

              <TabsContent value=\"headers\" className=\"space-y-4 mt-4\">
                <div className=\"space-y-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"custom-headers\">Custom Headers:</Label>
                    <Textarea
                      id=\"custom-headers\"
                      placeholder=\"Custom headers (one per line, format: 'Key: Value'\"
                      value={Object.entries(customHeaders).map(([key, value]) => `${key}: ${value}`).join('\n')}
                      onChange={(e) => {
                        const pairs = e.target.value.split('\n');
                        const headers: Record<string, string> = {};
                        pairs.forEach(pair => {
                          const [key, value] = pair.split(':').map(s => s.trim());
                          if (key && value) {
                            headers[key] = value;
                          }
                        });
                        setCustomHeaders(headers);
                      }}
                    />
                  </div>

                  <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                    <div className=\"flex items-center space-x-2\">
                      <input
                        type=\"checkbox\"
                        id=\"preserve-headers\"
                        checked={Object.keys(headers).length > 0}
                        onChange={(e) => {
                          if (!e.target.checked) {
                            setHeaders({});
                          }
                        }}
                        className=\"rounded\"
                      />
                      <Label htmlFor=\"preserve-headers\">Preserve custom headers</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value=\"auth\" className=\"space-y-4 mt-4\">
                <div className=\"space-y-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"auth-type\">Authentication:</Label>
                    <Select
                      value={authType}
                      onValueChange={(value: 'none' | 'bearer' | 'basic' | 'api-key'}>
                      disabled={!tesseractReady}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=\"none\">No Authentication</SelectItem>
                        <SelectItem value=\"bearer\">Bearer Token</SelectItem>
                        <SelectItem value=\"basic\">Basic Auth</SelectItem>
                        <SelectItem value=\"api-key\">API Key</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {authType !== 'none' && (
                    <div className=\"space-y-2\">
                      {authType === 'basic' && (
                        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                          <div className=\"space-y-2\">
                            <Label htmlFor=\"username\">Username:</Label>
                            <Input
                              id=\"username\"
                              placeholder=\"Enter username\"
                              onChange={(e) => setAuthType(prev => ({ ...prev, username: e.target.value }))}
                              />
                          </div>
                          <div className=\"space-y-2\">
                            <Label htmlFor=\"password\">Password:</Label>
                            <Input
                              id=\"password\"
                              type=\"password\"
                              placeholder=\"Enter password\"
                              onChange={(e) => setAuthType(prev => ({ ...prev, password: e.target.value }))}
                              />
                          </div>
                        </div>
                      )}

                      {authType === 'bearer' && (
                        <div className=\"space-y-2\">
                          <Label htmlFor=\"bearer-token\">Bearer Token:</Label>
                          <Input
                            id=\"bearer-token\"
                            type=\"password\"
                            placeholder=\"Enter bearer token\"
                            onChange={(e) => setAuthType(prev => ({ ...prev, bearerToken: e.target.value }))}
                          />
                        </div>
                      )}

                      {authType === 'api-key' && (
                        <div className=\"space-y-2\">
                          <Label htmlFor=\"api-key\">API Key:</Label>
                          <Input
                            id=\"api-key\"
                            type=\"password\"
                            placeholder=\"Enter API key\"
                            onChange={(e) => setAuthType(prev => ({ ...prev, apiKey: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>
                  </div>

              <TabsContent value=\"advanced\" className=\"space-y-4 mt-4\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"timeout\">Request Timeout (seconds):</Label>
                  <Slider
                    id=\"timeout\"
                    value={[30]}
                    onValue={(value) => setOptions(prev => ({ ...prev, timeout: value[0] }))}
                    max={120}
                    min={5}
                    step={5}
                    className=\"w-full\"
                  />
                  <div className=\"text-sm text-muted-foreground\">
                    Set 0 for no timeout
                  </div>
                </div>

                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                  <div className=\"flex items-center space-x-2\">
                    <Switch
                      id=\"follow-redirects\"
                      checked={options.followRedirects || false}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, followRedirects: checked }))}
                    />
                    <Label htmlFor=\"follow-redirects\">Follow redirects</Label>
                  </div>

                  <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                    <div className=\"flex items-center space-x-2\">
                      <Switch
                        id=\"cache-control\"
                        checked={options.cacheControl || false}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, cacheControl: checked }))}
                      />
                      <Label htmlFor=\"cache-control\">Cache control</Label>
                    </div>

                  <div>
                    <div className=\"flex items-center space-x-2\">
                      <Switch
                        id=\"retry-failed\"
                        checked={options.retryFailed || false}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, retryFailed: checked }))}
                      />
                      <Label htmlFor=\"retry-failed\">Auto retry on failed</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <div className=\"flex items-center space-x-4\">
              <Button
                onClick={sendRequest}
                disabled={isProcessing || !url.trim()}
                className=\"flex items-center space-x-2\"
              >
                <Send className={`h-4 w-4 ${isProcessing ? 'animate-pulse' : ''}`} />
                <span>{isProcessing ? 'Sending...' : 'Send Request'}</span>
              </Button>

              {qrResult && (
                <>
                  <Button
                    variant=\"outline\"
                    onClick={copyResponse}
                  >
                    <Copy className=\"h-4 w-4 mr-2\" />
                    Copy Response
                  </Button>

                  <Button
                    variant=\"outline\"
                    onClick={copyRequest}
                  >
                    <Copy className=\"h-4 w-4 mr-2\" />
                    Copy Request
                  </Button>

                  <Button
                    variant=\"outline\"
                    onClick={downloadResponse}
                  >
                    <Download className=\"h-4 w-4 mr-2\" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Request History */}
      {requestHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <Clock className=\"h-5 w-5 mr-2\" />
                Request History
              </CardTitle>
              <div>
                <div className=\"flex items-center space-x-2\">
                  <Button
                    variant=\"outline\"
                    size=\"sm\"
                    onClick={clearHistory}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant=\"outline\"
                    size=\"sm\"
                    onClick={() => {
                      if (selectedHistory !== null) {
                      setSelectedHistory(null);
                    }
                    }}
                  >
                    Show Selected
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className=\"space-y-2 max-h-96 overflow-auto\">
              {requestHistory.map((item, index) => (
                <div
                  key={item.request.id}
                  className={`border-l-4 rounded-lg p-3 ${item.success ? 'border-green-500' : item.status >= 400 ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <div className=\"flex items-center justify-between mb-2\">
                    <span className=\"text-sm font-mono text-muted-foreground w-12\">
                      {item.request.method}
                    </span>
                    <span className=\"text-sm text-muted-foreground w-20 truncate\">
                      {item.request.url}
                    </span>
                  </div>
                  <div className=\"text-xs text-muted-foreground\">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>

                {selectedHistory === index && (
                  <div className=\"mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-200\">
                    <div className=\"text-sm font-medium text-blue-800\">Request Details</div>
                    <div className=\"space-y-2 text-sm\">
                      <div><strong>Status:</strong> {qrResult.status}</div>
                      <div><strong>Response Time:</strong> {qrResult.responseTime}ms</div>
                      <div><strong>Response Size:</strong> {formatBytes(qrResult.size)}</div>
                      <div><strong>Headers:</strong></div>
                      <pre className=\"text-xs bg-blue-100 p-2 rounded overflow-auto max-h-32 max-h-32\">\n                        {Object.entries(qrResult.response.headers).map(([key, value]) => `${key}: ${value}`).join(', ') || 'None'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Display */}
      {qrResult && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center\">
              <div className=\"flex items-center\">
                <FileText className=\"h-5 w-5 mr-2\" />
                HTTP Response
              </div>
              <div className=\"flex items-center space-x-2\">
                <Badge
                  variant={qrResult.status >= 200 && qrResult.status < 300 ? \"default\" :
                           qrResult.status >= 400 && qrResult.status < 500 ? \"secondary\" : \"destructive\"}
                >
                  {qrResult.status} {qrResult.statusText}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-4\">
              <div className=\"max-h-64 overflow-auto bg-muted/20 rounded-lg p-4\">
                <pre className=\"text-sm font-mono whitespace-pre-wrap\">
                  {typeof qrResult.response.body === 'object'
                    ? JSON.stringify(qrResult.response.body, null, 2)
                    : qrResult.response.body}
                </pre>
              </div>

              {/* Response Headers */}
              <div className=\"text-sm text-muted-foreground\">
                <div className=\"font-medium mb-2\">Response Headers:</div>
                <pre className=\"text-xs bg-muted/100 p-2 rounded overflow-auto max-h-32\">
                  {Object.entries(qrResult.response.headers).map(([key, value]) => `${key}: ${value}`).join(', ') || 'None'}`}
                </pre>
              </div>

              {/* Status Bar */}
              <div className=\"space-y-2\">
                <div className=\"flex justify-between items-center text-sm mb-2\">
                  <span>Status: {qrResult.status} ({qrResult.statusText})}</span>
                  <span>Response Time: {qrResult.responseTime}ms</span>
                </div>
                <Progress
                  value={qrResult.status >= 200 && qrResult.status < 300 ? 100 :
                           qrResult.status >= 400 && qrResult.status < 500 ? 50 :
                           qrResult.status >= 500 ? 25 : 0}
                  className=\"h-2\"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden canvas for image processing */}
      <canvas className=\"hidden\" />
    </div>
  );
}
