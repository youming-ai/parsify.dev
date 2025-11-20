"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Globe,
  RefreshCw,
  Server,
  Shield,
  XCircle,
  Wifi,
  Zap,
  Router,
  Cable,
  Smartphone,
  Monitor,
  Settings,
  FileText,
  BarChart,
  TrendingUp,
  Network,
  Satellite,
  Terminal,
} from "lucide-react";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";

interface NetworkDiagnosticsProps {
  onDiagnosticComplete?: (results: DiagnosticResults) => void;
}

interface DiagnosticResults {
  id: string;
  timestamp: Date;
  overall: "healthy" | "warning" | "critical" | "unknown";
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    warnings: number;
  };
  connectivity: ConnectivityResults;
  performance: PerformanceResults;
  security: SecurityResults;
  dns: DNSResults;
  recommendations: Recommendation[];
}

interface ConnectivityResults {
  internetAccess: TestResult;
  httpStatus: TestResult;
  httpsStatus: TestResult;
  webRTC: TestResult;
  webSocket: TestResult;
  cdnAccess: TestResult;
}

interface PerformanceResults {
  latency: number;
  downloadSpeed: number;
  uploadSpeed: number;
  jitter: number;
  packetLoss: number;
  dnsResolution: TestResult;
}

interface SecurityResults {
  httpsSupport: TestResult;
  certificateCheck: TestResult;
  securityHeaders: TestResult;
  mixedContent: TestResult;
  cspSupport: TestResult;
}

interface DNSResults {
  primaryDNS: string;
  secondaryDNS: string[];
  resolutionTime: number;
  dnsSec: boolean;
  dohSupport: boolean;
}

interface TestResult {
  status: "pass" | "fail" | "warning" | "unknown";
  value?: number | string;
  unit?: string;
  message?: string;
  details?: any;
}

interface Recommendation {
  type: "performance" | "security" | "reliability" | "configuration";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action?: string;
}

export const NetworkDiagnostics: React.FC<NetworkDiagnosticsProps> = ({ onDiagnosticComplete }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState("");
  const [results, setResults] = useState<DiagnosticResults[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<DiagnosticResults | null>(null);
  const [targetURL, setTargetURL] = useState("https://google.com");
  const [testMode, setTestMode] = useState<"quick" | "comprehensive">("comprehensive");

  const { startMonitoring, endMonitoring, getMetrics } = usePerformanceMonitor();

  // Generate unique ID for diagnostic run
  const generateId = useCallback(() => Date.now().toString(), []);

  // Create test result
  const createTestResult = useCallback(
    (
      status: "pass" | "fail" | "warning" | "unknown",
      message?: string,
      value?: number | string,
      unit?: string,
    ): TestResult => ({
      status,
      message,
      value,
      unit,
    }),
    [],
  );

  // Test HTTP status
  const testHTTPStatus = useCallback(
    async (url: string): Promise<TestResult> => {
      try {
        const startTime = performance.now();
        const response = await fetch(url, {
          method: "GET",
          cache: "no-cache",
          signal: AbortSignal.timeout(5000),
        });
        const endTime = performance.now();

        if (response.ok) {
          return createTestResult("pass", `HTTP ${response.status}`, endTime - startTime, "ms");
        } else {
          return createTestResult("fail", `HTTP ${response.status}`, endTime - startTime, "ms");
        }
      } catch (error) {
        return createTestResult(
          "fail",
          `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [createTestResult],
  );

  // Test HTTPS status
  const testHTTPSStatus = useCallback(
    async (url: string): Promise<TestResult> => {
      try {
        const httpsUrl = url.replace("http://", "https://");
        const startTime = performance.now();
        const response = await fetch(httpsUrl, {
          method: "GET",
          cache: "no-cache",
          signal: AbortSignal.timeout(5000),
        });
        const endTime = performance.now();

        if (response.ok) {
          return createTestResult(
            "pass",
            `HTTPS working - ${response.status}`,
            endTime - startTime,
            "ms",
          );
        } else {
          return createTestResult(
            "warning",
            `HTTPS responded with ${response.status}`,
            endTime - startTime,
            "ms",
          );
        }
      } catch (error) {
        return createTestResult(
          "fail",
          `HTTPS connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    },
    [createTestResult],
  );

  // Test WebRTC
  const testWebRTC = useCallback(async (): Promise<TestResult> => {
    try {
      if (!window.RTCPeerConnection) {
        return createTestResult("fail", "WebRTC not supported in this browser");
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve(createTestResult("fail", "WebRTC connection timeout"));
        }, 3000);

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            clearTimeout(timeout);
            pc.close();
            resolve(createTestResult("pass", "WebRTC connection successful"));
          }
        };

        pc.createOffer()
          .then((offer) => {
            pc.setLocalDescription(offer);
            setTimeout(() => {
              clearTimeout(timeout);
              pc.close();
              resolve(createTestResult("warning", "WebRTC partially working"));
            }, 1000);
          })
          .catch((error) => {
            clearTimeout(timeout);
            pc.close();
            resolve(createTestResult("fail", `WebRTC failed: ${error.message}`));
          });
      });
    } catch (error) {
      return createTestResult(
        "fail",
        `WebRTC error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [createTestResult]);

  // Test WebSocket
  const testWebSocket = useCallback(async (): Promise<TestResult> => {
    try {
      return new Promise((resolve) => {
        const ws = new WebSocket("wss://echo.websocket.org/");
        const startTime = performance.now();

        const timeout = setTimeout(() => {
          ws.close();
          resolve(createTestResult("fail", "WebSocket connection timeout"));
        }, 5000);

        ws.onopen = () => {
          const endTime = performance.now();
          clearTimeout(timeout);
          ws.close();
          resolve(
            createTestResult("pass", "WebSocket connection successful", endTime - startTime, "ms"),
          );
        };

        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(createTestResult("fail", "WebSocket connection failed"));
        };
      });
    } catch (error) {
      return createTestResult(
        "fail",
        `WebSocket error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [createTestResult]);

  // Test CDN access
  const testCDNAccess = useCallback(async (): Promise<TestResult> => {
    try {
      const cdns = [
        "https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
        "https://unpkg.com/react@18/umd/react.production.min.js",
      ];

      let successCount = 0;
      const startTime = performance.now();

      for (const cdn of cdns) {
        try {
          const response = await fetch(cdn, {
            method: "HEAD",
            cache: "no-cache",
            signal: AbortSignal.timeout(3000),
          });
          if (response.ok) successCount++;
        } catch {
          // Continue testing other CDNs
        }
      }

      const endTime = performance.now();

      if (successCount === cdns.length) {
        return createTestResult("pass", `All CDNs accessible`, endTime - startTime, "ms");
      } else if (successCount > 0) {
        return createTestResult(
          "warning",
          `${successCount}/${cdns.length} CDNs accessible`,
          endTime - startTime,
          "ms",
        );
      } else {
        return createTestResult("fail", "No CDNs accessible", endTime - startTime, "ms");
      }
    } catch (error) {
      return createTestResult(
        "fail",
        `CDN test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [createTestResult]);

  // Measure latency
  const measureLatency = useCallback(async (): Promise<number> => {
    const measurements: number[] = [];

    for (let i = 0; i < 5; i++) {
      try {
        const startTime = performance.now();
        await fetch("https://httpbin.org/get", {
          cache: "no-cache",
          signal: AbortSignal.timeout(3000),
        });
        const endTime = performance.now();
        measurements.push(endTime - startTime);

        // Small delay between measurements
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch {
        // Continue with available measurements
      }
    }

    if (measurements.length === 0) {
      return 0;
    }

    // Return median latency
    measurements.sort((a, b) => a - b);
    return measurements[Math.floor(measurements.length / 2)];
  }, []);

  // Test download speed
  const testDownloadSpeed = useCallback(async (): Promise<number> => {
    try {
      const startTime = performance.now();
      const response = await fetch("https://httpbin.org/bytes/1048576", {
        // 1MB
        signal: AbortSignal.timeout(10000),
      });
      const blob = await response.blob();
      const endTime = performance.now();

      const duration = (endTime - startTime) / 1000; // seconds
      const bytes = blob.size;
      const bits = bytes * 8;

      return bits / duration; // bits per second
    } catch {
      return 0;
    }
  }, []);

  // Test upload speed
  const testUploadSpeed = useCallback(async (): Promise<number> => {
    try {
      const testData = new Array(1024 * 256).fill("x").join(""); // 256KB
      const blob = new Blob([testData]);

      const startTime = performance.now();
      const response = await fetch("https://httpbin.org/post", {
        method: "POST",
        body: blob,
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const bits = blob.size * 8;

      return bits / duration; // bits per second
    } catch {
      return 0;
    }
  }, []);

  // Test DNS resolution
  const testDNSResolution = useCallback(async (): Promise<TestResult> => {
    try {
      const startTime = performance.now();
      const response = await fetch("https://1.1.1.1/dns-query?name=google.com&type=A", {
        headers: {
          Accept: "application/dns-json",
        },
        signal: AbortSignal.timeout(5000),
      });
      const endTime = performance.now();

      if (response.ok) {
        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
          return createTestResult("pass", "DNS resolution successful", endTime - startTime, "ms");
        }
      }

      return createTestResult(
        "warning",
        "DNS resolution working with fallback",
        endTime - startTime,
        "ms",
      );
    } catch (error) {
      return createTestResult(
        "fail",
        `DNS resolution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [createTestResult]);

  // Generate recommendations
  const generateRecommendations = useCallback(
    (results: Partial<DiagnosticResults>): Recommendation[] => {
      const recommendations: Recommendation[] = [];

      // Performance recommendations
      if (results.performance?.latency && results.performance.latency > 200) {
        recommendations.push({
          type: "performance",
          priority: "high",
          title: "High Latency Detected",
          description: `Your network latency is ${results.performance.latency.toFixed(0)}ms, which is higher than optimal.`,
          action: "Consider using a wired connection or checking for network congestion.",
        });
      }

      if (results.performance?.downloadSpeed && results.performance.downloadSpeed < 1000000) {
        recommendations.push({
          type: "performance",
          priority: "medium",
          title: "Slow Download Speed",
          description: "Your download speed is below 1 Mbps.",
          action: "Check your internet plan or contact your ISP for faster service.",
        });
      }

      // Security recommendations
      if (results.security?.httpsSupport?.status !== "pass") {
        recommendations.push({
          type: "security",
          priority: "high",
          title: "HTTPS Issues Detected",
          description: "Some HTTPS connections are failing.",
          action: "Ensure your system time is correct and check for certificate issues.",
        });
      }

      // Connectivity recommendations
      if (results.connectivity?.webRTC?.status !== "pass") {
        recommendations.push({
          type: "reliability",
          priority: "medium",
          title: "WebRTC Not Working",
          description: "WebRTC functionality is impaired.",
          action: "This may affect video calls and real-time applications. Check browser settings.",
        });
      }

      return recommendations;
    },
    [],
  );

  // Run comprehensive diagnostics
  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setProgress(0);
    setCurrentTest("Initializing diagnostics...");
    startMonitoring("network-diagnostics");

    try {
      const diagnosticId = generateId();
      const startTime = performance.now();

      // Initialize results structure
      const results: Partial<DiagnosticResults> = {
        id: diagnosticId,
        timestamp: new Date(),
        overall: "unknown",
        summary: { totalTests: 0, passedTests: 0, failedTests: 0, warnings: 0 },
        connectivity: {
          internetAccess: createTestResult("unknown"),
          httpStatus: createTestResult("unknown"),
          httpsStatus: createTestResult("unknown"),
          webRTC: createTestResult("unknown"),
          webSocket: createTestResult("unknown"),
          cdnAccess: createTestResult("unknown"),
        },
        performance: {
          latency: 0,
          downloadSpeed: 0,
          uploadSpeed: 0,
          jitter: 0,
          packetLoss: 0,
          dnsResolution: createTestResult("unknown"),
        },
        security: {
          httpsSupport: createTestResult("unknown"),
          certificateCheck: createTestResult("unknown"),
          securityHeaders: createTestResult("unknown"),
          mixedContent: createTestResult("unknown"),
          cspSupport: createTestResult("unknown"),
        },
        dns: {
          primaryDNS: "",
          secondaryDNS: [],
          resolutionTime: 0,
          dnsSec: false,
          dohSupport: false,
        },
        recommendations: [],
      };

      // Connectivity Tests
      setProgress(10);
      setCurrentTest("Testing HTTP connectivity...");
      results.connectivity!.httpStatus = await testHTTPStatus(targetURL);

      setProgress(20);
      setCurrentTest("Testing HTTPS connectivity...");
      results.connectivity!.httpsStatus = await testHTTPSStatus(targetURL);

      setProgress(30);
      setCurrentTest("Testing WebRTC connectivity...");
      results.connectivity!.webRTC = await testWebRTC();

      setProgress(40);
      setCurrentTest("Testing WebSocket connectivity...");
      results.connectivity!.webSocket = await testWebSocket();

      setProgress(50);
      setCurrentTest("Testing CDN accessibility...");
      results.connectivity!.cdnAccess = await testCDNAccess();

      // Performance Tests
      setProgress(60);
      setCurrentTest("Measuring network latency...");
      results.performance!.latency = await measureLatency();

      setProgress(70);
      setCurrentTest("Testing download speed...");
      results.performance!.downloadSpeed = await testDownloadSpeed();

      setProgress(75);
      setCurrentTest("Testing upload speed...");
      results.performance!.uploadSpeed = await testUploadSpeed();

      setProgress(80);
      setCurrentTest("Testing DNS resolution...");
      results.performance!.dnsResolution = await testDNSResolution();

      // Security Tests
      setProgress(85);
      setCurrentTest("Checking HTTPS support...");
      results.security!.httpsSupport =
        results.connectivity!.httpsStatus.status === "pass"
          ? createTestResult("pass", "HTTPS working correctly")
          : createTestResult("fail", "HTTPS issues detected");

      setProgress(90);
      setCurrentTest("Analyzing results...");

      // Calculate summary
      const allTests = [
        ...Object.values(results.connectivity!),
        results.performance!.dnsResolution,
        results.security!.httpsSupport,
      ];

      const summary = {
        totalTests: allTests.length,
        passedTests: allTests.filter((t) => t.status === "pass").length,
        failedTests: allTests.filter((t) => t.status === "fail").length,
        warnings: allTests.filter((t) => t.status === "warning").length,
      };

      results.summary = summary;

      // Determine overall status
      if (summary.failedTests === 0) {
        results.overall = summary.warnings > 0 ? "warning" : "healthy";
      } else if (summary.failedTests < summary.totalTests / 2) {
        results.overall = "warning";
      } else {
        results.overall = "critical";
      }

      // Generate recommendations
      results.recommendations = generateRecommendations(results);

      const finalResults = results as DiagnosticResults;
      setResults((prev) => [finalResults, ...prev]);
      setSelectedResult(finalResults);

      setProgress(100);
      setCurrentTest("Diagnostics completed!");

      onDiagnosticComplete?.(finalResults);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "An unknown error occurred during diagnostics",
      );
    } finally {
      const metrics = getMetrics();
      endMonitoring();
      setIsRunning(false);
      setCurrentTest("");
    }
  }, [
    generateId,
    targetURL,
    createTestResult,
    testHTTPStatus,
    testHTTPSStatus,
    testWebRTC,
    testWebSocket,
    testCDNAccess,
    measureLatency,
    testDownloadSpeed,
    testUploadSpeed,
    testDNSResolution,
    generateRecommendations,
    startMonitoring,
    endMonitoring,
    getMetrics,
    onDiagnosticComplete,
  ]);

  // Get status icon and color
  const getStatusInfo = useCallback((status: string) => {
    switch (status) {
      case "pass":
      case "healthy":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          color: "text-green-500",
          bg: "bg-green-100",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: "text-yellow-500",
          bg: "bg-yellow-100",
        };
      case "fail":
      case "critical":
        return { icon: <XCircle className="h-4 w-4" />, color: "text-red-500", bg: "bg-red-100" };
      default:
        return { icon: <Clock className="h-4 w-4" />, color: "text-gray-500", bg: "bg-gray-100" };
    }
  }, []);

  // Format speed
  const formatSpeed = useCallback((bps: number): string => {
    if (bps < 1000) return `${bps.toFixed(1)} bps`;
    if (bps < 1000000) return `${(bps / 1000).toFixed(1)} Kbps`;
    if (bps < 1000000000) return `${(bps / 1000000).toFixed(1)} Mbps`;
    return `${(bps / 1000000000).toFixed(1)} Gbps`;
  }, []);

  // Export results
  const exportResults = useCallback(() => {
    if (!selectedResult) return;

    const dataStr = JSON.stringify(selectedResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `network-diagnostics-${selectedResult.timestamp.toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedResult]);

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Network Diagnostics
            </CardTitle>
            <CardDescription>
              Comprehensive network analysis including connectivity, performance, and security
              testing
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {results.length > 0 ? `${results.length} reports` : "No reports"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isRunning && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{currentTest}</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="target-url">Target URL</Label>
            <Input
              id="target-url"
              type="url"
              placeholder="https://example.com"
              value={targetURL}
              onChange={(e) => setTargetURL(e.target.value)}
            />
          </div>
          <div>
            <Label>Test Mode</Label>
            <div className="flex gap-2 mt-1">
              <Button
                variant={testMode === "quick" ? "default" : "outline"}
                size="sm"
                onClick={() => setTestMode("quick")}
                disabled={isRunning}
              >
                Quick
              </Button>
              <Button
                variant={testMode === "comprehensive" ? "default" : "outline"}
                size="sm"
                onClick={() => setTestMode("comprehensive")}
                disabled={isRunning}
              >
                Comprehensive
              </Button>
            </div>
          </div>
          <div className="flex items-end">
            <Button onClick={runDiagnostics} disabled={isRunning} className="w-full">
              {isRunning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Run Diagnostics
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results Display */}
        {selectedResult && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="connectivity">Connectivity</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Overall Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Status</span>
                    {getStatusInfo(selectedResult.overall).icon}
                  </div>
                  <div
                    className={`text-2xl font-bold ${getStatusInfo(selectedResult.overall).color}`}
                  >
                    {selectedResult.overall.toUpperCase()}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Passed Tests</div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedResult.summary.passedTests}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Failed Tests</div>
                  <div className="text-2xl font-bold text-red-600">
                    {selectedResult.summary.failedTests}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500 mb-1">Warnings</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedResult.summary.warnings}
                  </div>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Latency</span>
                  </div>
                  <div className="text-xl font-bold">
                    {selectedResult.performance.latency.toFixed(0)} ms
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Download</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatSpeed(selectedResult.performance.downloadSpeed)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Upload</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatSpeed(selectedResult.performance.uploadSpeed)}
                  </div>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportResults}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="connectivity" className="space-y-4">
              <h3 className="text-lg font-semibold">Connectivity Tests</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(selectedResult.connectivity).map(([key, result]) => (
                  <Card key={key} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className={`p-1 rounded-full ${getStatusInfo(result.status).bg}`}>
                        {React.cloneElement(
                          getStatusInfo(result.status).icon as React.ReactElement,
                          {
                            className: `h-4 w-4 ${getStatusInfo(result.status).color}`,
                          },
                        )}
                      </div>
                    </div>
                    <div className={`text-sm ${getStatusInfo(result.status).color}`}>
                      {result.message || result.status}
                    </div>
                    {result.value && (
                      <div className="text-xs text-gray-500">
                        {result.value} {result.unit}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Latency</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {selectedResult.performance.latency.toFixed(0)} ms
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedResult.performance.latency < 50
                      ? "Excellent"
                      : selectedResult.performance.latency < 100
                        ? "Good"
                        : selectedResult.performance.latency < 200
                          ? "Fair"
                          : "Poor"}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Download Speed</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatSpeed(selectedResult.performance.downloadSpeed)}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Upload Speed</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {formatSpeed(selectedResult.performance.uploadSpeed)}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <h3 className="text-lg font-semibold">Recommendations</h3>
              {selectedResult.recommendations.length === 0 ? (
                <Card className="p-4 text-center text-gray-500">
                  <CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-500" />
                  <p>No recommendations - your network looks healthy!</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {selectedResult.recommendations.map((rec, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-1 rounded-full ${
                            rec.priority === "high"
                              ? "bg-red-100"
                              : rec.priority === "medium"
                                ? "bg-yellow-100"
                                : "bg-blue-100"
                          }`}
                        >
                          {rec.priority === "high" ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : rec.priority === "medium" ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{rec.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {rec.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                          {rec.action && (
                            <p className="text-sm text-blue-600">
                              <strong>Action:</strong> {rec.action}
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Test History */}
        {results.length > 1 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test History</h3>
            <div className="space-y-2">
              {results.slice(1, 5).map((result) => (
                <Card
                  key={result.id}
                  className="p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusInfo(result.overall).icon}
                      <div>
                        <div className="font-medium">
                          {result.overall.toUpperCase()} • {result.timestamp.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.summary.passedTests}/{result.summary.totalTests} tests passed
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
