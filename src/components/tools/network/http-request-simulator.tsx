"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Send,
  Download,
  RefreshCw,
  Globe,
  Clock,
  Activity,
  Play,
  Square,
  Code,
  Zap,
  Server,
  Shield,
} from "lucide-react";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";

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
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState("Content-Type: application/json");
  const [body, setBody] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [result, setResult] = useState<HTTPResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestHistory, setRequestHistory] = useState<HTTPResult[]>([]);
  const [followRedirects, setFollowRedirects] = useState(true);
  const [timeout, setTimeout] = useState(10000); // 10 seconds
  const [validateSSL, setValidateSSL] = useState(true);

  const { startMonitoring, endMonitoring, getMetrics } = usePerformanceMonitor();

  const httpMethods: HTTPMethod[] = [
    { method: "GET", hasBody: false, description: "Retrieve data" },
    { method: "POST", hasBody: true, description: "Create new resource" },
    { method: "PUT", hasBody: true, description: "Update entire resource" },
    { method: "PATCH", hasBody: true, description: "Partial update" },
    { method: "DELETE", hasBody: false, description: "Delete resource" },
    { method: "HEAD", hasBody: false, description: "Get headers only" },
    { method: "OPTIONS", hasBody: false, description: "Get allowed methods" },
  ];

  const parseHeaders = useCallback((headerText: string): Record<string, string> => {
    const headers: Record<string, string> = {};
    headerText.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(":").trim();
      }
    });
    return headers;
  }, []);

  const formatHeaders = useCallback((headers: Record<string, string>): string => {
    return Object.entries(headers)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  }, []);

  const measureRequest = useCallback(
    async (url: string, options: RequestInit): Promise<HTTPResult> => {
      const startTime = performance.now();

      try {
        // Use fetch API with Performance API timing
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          redirect: followRedirects ? "follow" : "manual",
        });

        clearTimeout(timeoutId);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Get timing information from Performance API
        const entries = performance.getEntriesByName(
          url,
          "navigation",
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
        let responseText = "";
        try {
          const clonedResponse = response.clone();
          responseText = await clonedResponse.text();
        } catch (textError) {
          responseText = "[Unable to read response body]";
        }

        return {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          timing,
          responseText,
          url,
          method: options.method || "GET",
          success: response.ok,
          duration,
        };
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        return {
          status: 0,
          statusText: error instanceof Error ? error.message : "Request Failed",
          headers: {},
          timing: {},
          responseText: "",
          url,
          method: options.method || "GET",
          success: false,
          duration,
        };
      }
    },
    [followRedirects, timeout],
  );

  const sendRequest = useCallback(async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL");
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      setError("Please enter a valid URL (e.g., https://example.com/api)");
      return;
    }

    setIsRequesting(true);
    setError(null);
    startMonitoring("http-request");

    try {
      // Build request options
      const parsedHeaders = parseHeaders(headers);
      const hasBody = httpMethods.find((m) => m.method === method)?.hasBody;

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
        mode: "cors",
        cache: "no-cache",
        credentials: "omit",
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
      const errorMessage = error instanceof Error ? error.message : "Request failed";
      setError(errorMessage);
    } finally {
      endMonitoring();
      setIsRequesting(false);
    }
  }, [
    url,
    method,
    headers,
    body,
    parseHeaders,
    measureRequest,
    startMonitoring,
    endMonitoring,
    onRequestComplete,
  ]);

  const downloadAsCurl = useCallback(
    (request: HTTPResult) => {
      const curlHeaders = Object.entries(request.headers)
        .map(([key, value]) => `-H "${key}: ${value}"`)
        .join(" \\  \n");

      const curlBody =
        request.method !== "GET" && request.method !== "HEAD" && body.trim()
          ? `-d '${body.replace(/'/g, "\\'")}'`
          : "";

      const curlCommand = `curl -X ${request.method} \\\
  ${curlHeaders} \\\
  ${curlBody} \\\
  "${request.url}"`;

      const blob = new Blob([curlCommand], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "request.sh";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [body],
  );

  const downloadAsPostman = useCallback(
    (request: HTTPResult) => {
      const postmanCollection = {
        info: {
          name: "HTTP Request Collection",
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
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
                request.method !== "GET" && request.method !== "HEAD"
                  ? {
                      mode: "raw",
                      raw: body,
                    }
                  : undefined,
            },
          },
        ],
      };

      const blob = new Blob([JSON.stringify(postmanCollection, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "http-requests.postman_collection.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [body],
  );

  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  const getColorForStatus = useCallback((status: number): string => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 300 && status < 400) return "text-yellow-600";
    if (status >= 400 && status < 500) return "text-orange-600";
    if (status >= 500) return "text-red-600";
    return "text-gray-600";
  }, []);

  const clearHistory = useCallback(() => {
    setRequestHistory([]);
  }, []);

  useEffect(() => {
    // Cleanup performance entries
    return () => {
      if (typeof performance !== "undefined" && performance.clearResourceTimings) {
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      onChange={(e) => setTimeout(parseInt(e.target.value) || 10000)}
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
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Templates */}
                <div>
                  <Label className="text-sm font-medium">Quick Templates</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrl("https://jsonplaceholder.typicode.com/posts/1");
                        setMethod("GET");
                        setHeaders("Content-Type: application/json");
                        setBody("");
                      }}
                    >
                      JSON GET
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrl("https://jsonplaceholder.typicode.com/posts");
                        setMethod("POST");
                        setHeaders("Content-Type: application/json");
                        setBody('{"title": "Test", "body": "Test post", "userId": 1}');
                      }}
                    >
                      JSON POST
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrl("https://httpbin.org/status/200");
                        setMethod("GET");
                        setHeaders("");
                        setBody("");
                      }}
                    >
                      Status Check
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUrl("https://httpbin.org/delay/2");
                        setMethod("GET");
                        setHeaders("");
                        setBody("");
                      }}
                    >
                      Slow Request
                    </Button>
                  </div>
                </div>

                {/* Request History */}
                {requestHistory.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Recent Requests</Label>
                      <Button variant="ghost" size="sm" onClick={clearHistory}>
                        Clear
                      </Button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {requestHistory.map((req, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => setResult(req)}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${getColorForStatus(req.status)}`}
                            >
                              {req.method}
                            </span>
                            <span className={`text-sm ${getColorForStatus(req.status)}`}>
                              {req.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new URL(req.url).hostname}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{req.duration.toFixed(0)}ms</div>
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
                          variant={result.success ? "default" : "destructive"}
                          className={getColorForStatus(result.status)}
                        >
                          {result.status} {result.statusText}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {result.duration.toFixed(0)}ms
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadAsCurl(result)}>
                        <Code className="h-4 w-4 mr-2" />
                        cURL
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadAsPostman(result)}>
                        <Download className="h-4 w-4 mr-2" />
                        Postman
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <pre className="p-4 text-sm font-mono bg-gray-50 overflow-x-auto whitespace-pre-wrap">
                      {result.responseText || "[Empty Response]"}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="headers" className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="text-left p-2 text-sm font-medium">Header</th>
                            <th className="text-left p-2 text-sm font-medium">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(result.headers).map(([key, value]) => (
                            <tr key={key} className="border-t">
                              <td className="p-2 text-sm font-medium">{key}</td>
                              <td className="p-2 text-sm text-gray-600 break-all">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timing" className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {result.timing.dnsLookup !== undefined && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium">DNS Lookup</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {result.timing.dnsLookup.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">ms</div>
                      </div>
                    )}

                    {result.timing.tcpConnection !== undefined && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Server className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">TCP Connection</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {result.timing.tcpConnection.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">ms</div>
                      </div>
                    )}

                    {result.timing.tlsHandshake !== undefined && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">TLS Handshake</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {result.timing.tlsHandshake.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">ms</div>
                      </div>
                    )}

                    {result.timing.firstByte !== undefined && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium">First Byte</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {result.timing.firstByte.toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-500">ms</div>
                      </div>
                    )}
                  </div>

                  {result.timing.total && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Total Request Time</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((result.timing.total / 1000) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="text-center text-sm text-gray-600">
                        {result.timing.total.toFixed(0)}ms
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Request URL</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                        {result.url}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Method</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded text-sm">{result.method}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Status Code</Label>
                      <div
                        className={`mt-1 text-2xl font-bold ${getColorForStatus(result.status)}`}
                      >
                        {result.status}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Response Size</Label>
                      <div className="mt-1 text-2xl font-bold">
                        {formatBytes(new Blob([result.responseText]).size)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Duration</Label>
                      <div className="mt-1 text-2xl font-bold">{result.duration.toFixed(0)}ms</div>
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
