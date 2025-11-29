'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import PerformanceMonitor from '@/lib/performance-monitor';
import {
  Activity,
  Clock,
  Code,
  Download,
  Globe,
  Play,
  RefreshCw,
  Send,
  Server,
  Shield,
  Square,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface HTTPRequestSimulatorProps {
  onRequestComplete?: (result: HTTPResult) => void;
  maxFileSize?: number;
}

interface HTTPResult {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  timing: RequestTiming;
  responseText: string;
  url: string;
  method: string;
  success: boolean;
  duration: number;
}

interface RequestTiming {
  dnsLookup?: number;
  tcpConnection?: number;
  tlsHandshake?: number;
  firstByte?: number;
  download?: number;
  total?: number;
}

interface HTTPMethod {
  method: string;
  hasBody: boolean;
  description: string;
}

export const HTTPRequestSimulator: React.FC<HTTPRequestSimulatorProps> = ({
  onRequestComplete,
  maxFileSize = 1024 * 1024, // 1MB
}) => {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  const [headers, setHeaders] = useState('Content-Type: application/json');
  const [body, setBody] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [result, setResult] = useState<HTTPResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestHistory, setRequestHistory] = useState<HTTPResult[]>([]);
  const [followRedirects, setFollowRedirects] = useState(true);
  const [timeout, setRequestTimeout] = useState(10000); // 10 seconds
  const [validateSSL, setValidateSSL] = useState(true);

  const performanceMonitor = PerformanceMonitor.getInstance();

  const httpMethods: HTTPMethod[] = [
    { method: 'GET', hasBody: false, description: 'Retrieve data' },
    { method: 'POST', hasBody: true, description: 'Create new resource' },
    { method: 'PUT', hasBody: true, description: 'Update entire resource' },
    { method: 'PATCH', hasBody: true, description: 'Partial update' },
    { method: 'DELETE', hasBody: false, description: 'Delete resource' },
    { method: 'HEAD', hasBody: false, description: 'Get headers only' },
    { method: 'OPTIONS', hasBody: false, description: 'Get allowed methods' },
  ];

  const parseHeaders = useCallback((headerText: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    headerText.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(':').trim();
      }
    });
    return headers;
  }, []);

  const _formatHeaders = useCallback((headers: Record<string, string>): string => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }, []);

  const measureRequest = useCallback(
    async (url: string, options: RequestInit): Promise<HTTPResult> => {
      const startTime = performance.now();

      try {
        // Use fetch API with Performance API timing
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          redirect: followRedirects ? 'follow' : 'manual',
        });

        window.clearTimeout(timeoutId);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Get timing information from Performance API
        const entries = performance.getEntriesByName(
          url,
          'navigation'
        ) as PerformanceNavigationTiming[];
        const timing: RequestTiming = {};

        if (entries.length > 0) {
          const navTiming = entries[0];
          timing.dnsLookup = navTiming.domainLookupEnd - navTiming.domainLookupStart;
          timing.tcpConnection = navTiming.connectEnd - navTiming.connectStart;
          timing.tlsHandshake =
            navTiming.secureConnectionStart > 0
              ? navTiming.connectEnd - navTiming.secureConnectionStart
              : undefined;
          timing.firstByte = navTiming.responseStart - navTiming.requestStart;
          timing.download = navTiming.responseEnd - navTiming.responseStart;
          timing.total = navTiming.responseEnd - navTiming.startTime;
        }

        // Get headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Get response text
        let responseText = '';
        try {
          const clonedResponse = response.clone();
          responseText = await clonedResponse.text();
        } catch (_textError) {
          responseText = '[Unable to read response body]';
        }

        return {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          timing,
          responseText,
          url,
          method: options.method || 'GET',
          success: response.ok,
          duration,
        };
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        return {
          status: 0,
          statusText: error instanceof Error ? error.message : 'Request Failed',
          headers: {},
          timing: {},
          responseText: '',
          url,
          method: options.method || 'GET',
          success: false,
          duration,
        };
      }
    },
    [followRedirects, timeout]
  );

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (_urlError) {
      setError('Please enter a valid URL (e.g., https://example.com/api)');
      return;
    }

    setIsRequesting(true);
    setError(null);
    performanceMonitor.startMonitoring();

    try {
      // Build request options
      const parsedHeaders = parseHeaders(headers);
      const hasBody = httpMethods.find((m) => m.method === method)?.hasBody;

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit',
      };

      // Add body if method supports it
      if (hasBody && body.trim()) {
        options.body = body;
      }

      // Measure request
      const requestResult = await measureRequest(url, options);

      setResult(requestResult);
      setRequestHistory((prev) => [requestResult, ...prev.slice(0, 9)]); // Keep last 10 requests

      if (onRequestComplete) {
        onRequestComplete(requestResult);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setError(errorMessage);
    } finally {
      performanceMonitor.stopMonitoring();
      setIsRequesting(false);
    }
  }, [url, method, headers, body, parseHeaders, measureRequest, onRequestComplete]);

  const downloadAsCurl = useCallback(
    (request: HTTPResult) => {
      const curlHeaders = Object.entries(request.headers)
        .map(([key, value]) => `-H "${key}: ${value}"`)
        .join(' \\  \n');

      const curlBody =
        request.method !== 'GET' && request.method !== 'HEAD' && body.trim()
          ? `-d '${body.replace(/'/g, "\\'")}'`
          : '';

      const curlCommand = `curl -X ${request.method} \\\
  ${curlHeaders} \\\
  ${curlBody} \\\
  "${request.url}"`;

      const blob = new Blob([curlCommand], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'request.sh';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [body]
  );

  const downloadAsPostman = useCallback(
    (request: HTTPResult) => {
      const postmanCollection = {
        info: {
          name: 'HTTP Request Collection',
          schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        item: [
          {
            name: `${request.method} ${new URL(request.url).pathname}`,
            request: {
              method: request.method,
              url: request.url,
              header: Object.entries(request.headers).map(([key, value]) => ({
                key,
                value,
              })),
              body:
                request.method !== 'GET' && request.method !== 'HEAD'
                  ? {
                      mode: 'raw',
                      raw: body,
                    }
                  : undefined,
            },
          },
        ],
      };

      const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'http-requests.postman_collection.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [body]
  );

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }, []);

  const getColorForStatus = useCallback((status: number): string => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-yellow-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  }, []);

  const clearHistory = useCallback(() => {
    setRequestHistory([]);
  }, []);

  useEffect(() => {
    // Cleanup performance entries
    return () => {
      if (typeof performance !== 'undefined' && performance.clearResourceTimings) {
        performance.clearResourceTimings();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            HTTP Request Simulator
          </CardTitle>
          <CardDescription>
            Test HTTP requests with detailed timing analysis and response inspection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Request Configuration */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://jsonplaceholder.typicode.com/posts/1"
                    disabled={isRequesting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="method">Method</Label>
                    <Select value={method} onValueChange={setMethod} disabled={isRequesting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {httpMethods.map((httpMethod) => (
                          <SelectItem key={httpMethod.method} value={httpMethod.method}>
                            {httpMethod.method} - {httpMethod.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={timeout}
                      onChange={(e) => setRequestTimeout(Number.parseInt(e.target.value) || 10000)}
                      min="1000"
                      max="60000"
                      step="1000"
                      disabled={isRequesting}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="headers">Headers (one per line)</Label>
                  <Textarea
                    id="headers"
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                    rows={3}
                    disabled={isRequesting}
                  />
                </div>

                {httpMethods.find((m) => m.method === method)?.hasBody && (
                  <div>
                    <Label htmlFor="body">Request Body</Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder='{"name": "John", "email": "john@example.com"}'
                      rows={4}
                      disabled={isRequesting}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Follow Redirects</Label>
                    <Switch
                      checked={followRedirects}
                      onCheckedChange={setFollowRedirects}
                      disabled={isRequesting}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Validate SSL</Label>
                    <Switch
                      checked={validateSSL}
                      onCheckedChange={setValidateSSL}
                      disabled={isRequesting}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={sendRequest} disabled={isRequesting} className="flex-1">
                    {isRequesting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Templates */}
                <div>
                  <Label className="font-medium text-sm">Quick Templates</Label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrl('https://jsonplaceholder.typicode.com/posts/1');
                        setMethod('GET');
                        setHeaders('Content-Type: application/json');
                        setBody('');
                      }}
                    >
                      JSON GET
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrl('https://jsonplaceholder.typicode.com/posts');
                        setMethod('POST');
                        setHeaders('Content-Type: application/json');
                        setBody('{"title": "Test", "body": "Test post", "userId": 1}');
                      }}
                    >
                      JSON POST
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrl('https://httpbin.org/status/200');
                        setMethod('GET');
                        setHeaders('');
                        setBody('');
                      }}
                    >
                      Status Check
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrl('https://httpbin.org/delay/2');
                        setMethod('GET');
                        setHeaders('');
                        setBody('');
                      }}
                    >
                      Slow Request
                    </Button>
                  </div>
                </div>

                {/* Request History */}
                {requestHistory.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="font-medium text-sm">Recent Requests</Label>
                      <Button variant="ghost" size="sm" onClick={clearHistory}>
                        Clear
                      </Button>
                    </div>
                    <div className="max-h-40 space-y-1 overflow-y-auto">
                      {requestHistory.map((req, index) => (
                        <div
                          key={index}
                          className="flex cursor-pointer items-center justify-between rounded border p-2 hover:bg-gray-50"
                          onClick={() => setResult(req)}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium text-sm ${getColorForStatus(req.status)}`}
                            >
                              {req.method}
                            </span>
                            <span className={`text-sm ${getColorForStatus(req.status)}`}>
                              {req.status}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {new URL(req.url).hostname}
                            </span>
                          </div>
                          <div className="text-gray-400 text-xs">{req.duration.toFixed(0)}ms</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Request Result */}
            {result && (
              <Tabs defaultValue="response" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="response">Response</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="timing">Timing</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="response" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={result.success ? 'default' : 'destructive'}
                          className={getColorForStatus(result.status)}
                        >
                          {result.status} {result.statusText}
                        </Badge>
                        <span className="text-gray-500 text-sm">
                          {result.duration.toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadAsCurl(result)}>
                        <Code className="mr-2 h-4 w-4" />
                        cURL
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadAsPostman(result)}>
                        <Download className="mr-2 h-4 w-4" />
                        Postman
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-lg border">
                    <pre className="overflow-x-auto whitespace-pre-wrap bg-gray-50 p-4 font-mono text-sm">
                      {result.responseText || '[Empty Response]'}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="headers" className="space-y-4">
                  <div className="overflow-hidden rounded-lg border">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50">
                          <tr>
                            <th className="p-2 text-left font-medium text-sm">Header</th>
                            <th className="p-2 text-left font-medium text-sm">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.headers).map(([key, value]) => (
                            <tr key={key} className="border-t">
                              <td className="p-2 font-medium text-sm">{key}</td>
                              <td className="break-all p-2 text-gray-600 text-sm">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timing" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {result.timing.dnsLookup !== undefined && (
                      <div className="rounded-lg border p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-sm">DNS Lookup</span>
                        </div>
                        <div className="font-bold text-2xl">
                          {result.timing.dnsLookup.toFixed(0)}
                        </div>
                        <div className="text-gray-500 text-xs">ms</div>
                      </div>
                    )}

                    {result.timing.tcpConnection !== undefined && (
                      <div className="rounded-lg border p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Server className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-sm">TCP Connection</span>
                        </div>
                        <div className="font-bold text-2xl">
                          {result.timing.tcpConnection.toFixed(0)}
                        </div>
                        <div className="text-gray-500 text-xs">ms</div>
                      </div>
                    )}

                    {result.timing.tlsHandshake !== undefined && (
                      <div className="rounded-lg border p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-sm">TLS Handshake</span>
                        </div>
                        <div className="font-bold text-2xl">
                          {result.timing.tlsHandshake.toFixed(0)}
                        </div>
                        <div className="text-gray-500 text-xs">ms</div>
                      </div>
                    )}

                    {result.timing.firstByte !== undefined && (
                      <div className="rounded-lg border p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="font-medium text-sm">First Byte</span>
                        </div>
                        <div className="font-bold text-2xl">
                          {result.timing.firstByte.toFixed(0)}
                        </div>
                        <div className="text-gray-500 text-xs">ms</div>
                      </div>
                    )}
                  </div>

                  {result.timing.total && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">Total Request Time</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min((result.timing.total / 1000) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-center text-gray-600 text-sm">
                        {result.timing.total.toFixed(0)}ms
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium text-sm">Request URL</Label>
                      <div className="mt-1 break-all rounded bg-gray-50 p-2 font-mono text-sm">
                        {result.url}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium text-sm">Method</Label>
                      <div className="mt-1 rounded bg-gray-50 p-2 text-sm">{result.method}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="font-medium text-sm">Status Code</Label>
                      <div
                        className={`mt-1 font-bold text-2xl ${getColorForStatus(result.status)}`}
                      >
                        {result.status}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium text-sm">Response Size</Label>
                      <div className="mt-1 font-bold text-2xl">
                        {formatBytes(new Blob([result.responseText]).size)}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium text-sm">Duration</Label>
                      <div className="mt-1 font-bold text-2xl">{result.duration.toFixed(0)}ms</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
