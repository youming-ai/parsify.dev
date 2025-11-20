"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wifi,
  WifiOff,
  Activity,
  Globe,
  Server,
  Clock,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap,
  Network,
  Router,
  Cable,
  Satellite,
} from "lucide-react";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";

interface WebConnectivityProps {
  onTestComplete?: (results: ConnectivityTest) => void;
}

interface ConnectivityTest {
  id: string;
  timestamp: Date;
  connectionType: string;
  online: boolean;
  latency: number;
  downloadSpeed: number;
  uploadSpeed: number;
  packetLoss: number;
  jitter: number;
  isp?: string;
  serverLocation?: string;
  publicIP?: string;
  dnsServers: string[];
  webRTCWorking: boolean;
  httpWorking: boolean;
  websocketWorking: boolean;
}

interface NetworkInfo {
  downlink: number;
  effectiveType: string;
  rtt: number;
  saveData: boolean;
  type: string;
}

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  value?: number;
  unit?: string;
  error?: string;
  icon: React.ReactNode;
}

export const WebConnectivity: React.FC<WebConnectivityProps> = ({ onTestComplete }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState("");
  const [testResults, setTestResults] = useState<ConnectivityTest[]>([]);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<ConnectivityTest | null>(null);

  const [testSteps, setTestSteps] = useState<TestResult[]>([
    { name: "Network Connection", status: "pending", icon: <Wifi className="h-4 w-4" /> },
    { name: "WebRTC Support", status: "pending", icon: <Globe className="h-4 w-4" /> },
    { name: "HTTP Connectivity", status: "pending", icon: <Server className="h-4 w-4" /> },
    { name: "WebSocket Connection", status: "pending", icon: <Activity className="h-4 w-4" /> },
    { name: "Latency Test", status: "pending", icon: <Clock className="h-4 w-4" /> },
    { name: "Download Speed", status: "pending", icon: <Download className="h-4 w-4" /> },
    { name: "Upload Speed", status: "pending", icon: <Upload className="h-4 w-4" /> },
    { name: "DNS Resolution", status: "pending", icon: <Network className="h-4 w-4" /> },
  ]);

  const { startMonitoring, endMonitoring, getMetrics } = usePerformanceMonitor();

  // Get network information
  const getNetworkInfo = useCallback(async (): Promise<NetworkInfo> => {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      return {
        downlink: connection.downlink || 0,
        effectiveType: connection.effectiveType || "unknown",
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
        type: connection.type || "unknown",
      };
    }

    // Fallback for browsers without Network Information API
    return {
      downlink: 0,
      effectiveType: "unknown",
      rtt: 0,
      saveData: false,
      type: "unknown",
    };
  }, []);

  // Update test step
  const updateTestStep = useCallback((index: number, updates: Partial<TestResult>) => {
    setTestSteps((prev) => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], ...updates };
      return newSteps;
    });
  }, []);

  // Test WebRTC connectivity
  const testWebRTC = useCallback(async (): Promise<boolean> => {
    try {
      if (!window.RTCPeerConnection) {
        throw new Error("WebRTC not supported");
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Create data channel
      const dc = pc.createDataChannel("test");

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          pc.close();
          resolve(false);
        }, 5000);

        dc.onopen = () => {
          clearTimeout(timeout);
          dc.close();
          pc.close();
          resolve(true);
        };

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            // ICE candidate received, connection is working
          }
        };

        pc.createOffer()
          .then((offer) => {
            pc.setLocalDescription(offer);
          })
          .catch(() => {
            clearTimeout(timeout);
            pc.close();
            resolve(false);
          });
      });
    } catch (error) {
      console.error("WebRTC test failed:", error);
      return false;
    }
  }, []);

  // Test HTTP connectivity
  const testHTTP = useCallback(async (): Promise<number> => {
    const startTime = performance.now();

    try {
      const response = await fetch("https://httpbin.org/get", {
        method: "GET",
        cache: "no-cache",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return performance.now() - startTime;
    } catch (error) {
      throw new Error(
        `HTTP test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, []);

  // Test WebSocket connectivity
  const testWebSocket = useCallback(async (): Promise<number> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket("wss://echo.websocket.org/");
      const startTime = performance.now();

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("WebSocket connection timeout"));
      }, 5000);

      ws.onopen = () => {
        const endTime = performance.now();
        clearTimeout(timeout);
        ws.close();
        resolve(endTime - startTime);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("WebSocket connection failed"));
      };
    });
  }, []);

  // Test latency
  const testLatency = useCallback(async (): Promise<number> => {
    const measurements: number[] = [];

    for (let i = 0; i < 5; i++) {
      try {
        const startTime = performance.now();
        await fetch("https://httpbin.org/get", { cache: "no-cache" });
        const endTime = performance.now();
        measurements.push(endTime - startTime);

        // Small delay between measurements
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        // Continue with available measurements
      }
    }

    if (measurements.length === 0) {
      throw new Error("Could not measure latency");
    }

    // Return median latency
    measurements.sort((a, b) => a - b);
    return measurements[Math.floor(measurements.length / 2)];
  }, []);

  // Test download speed
  const testDownloadSpeed = useCallback(async (): Promise<number> => {
    try {
      const startTime = performance.now();
      const response = await fetch("https://httpbin.org/bytes/1048576"); // 1MB
      const blob = await response.blob();
      const endTime = performance.now();

      const duration = (endTime - startTime) / 1000; // seconds
      const bytes = blob.size;
      const bits = bytes * 8;

      return bits / duration; // bits per second
    } catch (error) {
      throw new Error(
        `Download speed test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, []);

  // Test upload speed
  const testUploadSpeed = useCallback(async (): Promise<number> => {
    try {
      // Create 1MB of test data
      const testData = new Array(1024 * 1024).fill("x").join("");
      const blob = new Blob([testData]);

      const startTime = performance.now();
      const response = await fetch("https://httpbin.org/post", {
        method: "POST",
        body: blob,
        headers: {
          "Content-Type": "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const bits = blob.size * 8;

      return bits / duration; // bits per second
    } catch (error) {
      throw new Error(
        `Upload speed test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, []);

  // Get public IP
  const getPublicIP = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      throw new Error("Could not determine public IP");
    }
  }, []);

  // Get DNS servers
  const getDNSServers = useCallback(async (): Promise<string[]> => {
    // This is a simplified test - in a real implementation, you might use WebRTC to detect DNS servers
    try {
      const response = await fetch("https://1.1.1.1/dns-query?name=google.com&type=A", {
        headers: {
          Accept: "application/dns-json",
        },
      });

      if (response.ok) {
        return ["1.1.1.1", "8.8.8.8"]; // Cloudflare and Google DNS as examples
      }

      return ["Unknown"];
    } catch (error) {
      return ["Unknown"];
    }
  }, []);

  // Run full connectivity test
  const runConnectivityTest = useCallback(async () => {
    setIsTesting(true);
    setError(null);
    setTestProgress(0);
    setCurrentTest("Initializing...");
    startMonitoring("connectivity-test");

    try {
      // Reset test steps
      setTestSteps((prev) => prev.map((step) => ({ ...step, status: "pending" })));

      const testId = Date.now().toString();
      const testStart = performance.now();
      const results: Partial<ConnectivityTest> = {
        id: testId,
        timestamp: new Date(),
        dnsServers: [],
      };

      // Get network info
      setTestProgress(10);
      setCurrentTest("Getting network information...");
      const netInfo = await getNetworkInfo();
      setNetworkInfo(netInfo);
      results.connectionType = netInfo.type;

      // Test WebRTC
      setTestProgress(20);
      setCurrentTest("Testing WebRTC connectivity...");
      updateTestStep(1, { status: "running" });
      try {
        results.webRTCWorking = await testWebRTC();
        updateTestStep(1, { status: results.webRTCWorking ? "success" : "error" });
      } catch (error) {
        results.webRTCWorking = false;
        updateTestStep(1, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test HTTP
      setTestProgress(30);
      setCurrentTest("Testing HTTP connectivity...");
      updateTestStep(2, { status: "running" });
      try {
        const httpLatency = await testHTTP();
        results.httpWorking = true;
        updateTestStep(2, { status: "success", value: httpLatency, unit: "ms" });
      } catch (error) {
        results.httpWorking = false;
        updateTestStep(2, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test WebSocket
      setTestProgress(40);
      setCurrentTest("Testing WebSocket connection...");
      updateTestStep(3, { status: "running" });
      try {
        const wsLatency = await testWebSocket();
        results.websocketWorking = true;
        updateTestStep(3, { status: "success", value: wsLatency, unit: "ms" });
      } catch (error) {
        results.websocketWorking = false;
        updateTestStep(3, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test latency
      setTestProgress(50);
      setCurrentTest("Measuring network latency...");
      updateTestStep(4, { status: "running" });
      try {
        const latency = await testLatency();
        results.latency = latency;
        updateTestStep(4, { status: "success", value: latency, unit: "ms" });
      } catch (error) {
        updateTestStep(4, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test download speed
      setTestProgress(65);
      setCurrentTest("Testing download speed...");
      updateTestStep(5, { status: "running" });
      try {
        const downloadSpeed = await testDownloadSpeed();
        results.downloadSpeed = downloadSpeed;
        updateTestStep(5, { status: "success", value: downloadSpeed / 1000000, unit: "Mbps" });
      } catch (error) {
        updateTestStep(5, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test upload speed
      setTestProgress(80);
      setCurrentTest("Testing upload speed...");
      updateTestStep(6, { status: "running" });
      try {
        const uploadSpeed = await testUploadSpeed();
        results.uploadSpeed = uploadSpeed;
        updateTestStep(6, { status: "success", value: uploadSpeed / 1000000, unit: "Mbps" });
      } catch (error) {
        updateTestStep(6, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Test DNS resolution
      setTestProgress(90);
      setCurrentTest("Testing DNS resolution...");
      updateTestStep(7, { status: "running" });
      try {
        const dnsServers = await getDNSServers();
        results.dnsServers = dnsServers;
        updateTestStep(7, { status: "success" });
      } catch (error) {
        updateTestStep(7, {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Get public IP
      setTestProgress(95);
      setCurrentTest("Getting public IP address...");
      try {
        results.publicIP = await getPublicIP();
      } catch (error) {
        console.error("Could not get public IP:", error);
      }

      // Check online status
      results.online = navigator.onLine;

      // Complete test
      setTestProgress(100);
      setCurrentTest("Test completed!");

      const finalResults: ConnectivityTest = {
        ...results,
        connectionType: results.connectionType || "unknown",
        online: results.online || false,
        latency: results.latency || 0,
        downloadSpeed: results.downloadSpeed || 0,
        uploadSpeed: results.uploadSpeed || 0,
        packetLoss: 0, // Would need more complex test for packet loss
        jitter: 0, // Would need more complex test for jitter
        webRTCWorking: results.webRTCWorking || false,
        httpWorking: results.httpWorking || false,
        websocketWorking: results.websocketWorking || false,
        dnsServers: results.dnsServers || [],
      };

      setTestResults((prev) => [finalResults, ...prev]);
      setSelectedTest(finalResults);
      onTestComplete?.(finalResults);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
    } finally {
      const metrics = getMetrics();
      endMonitoring();
      setIsTesting(false);
      setCurrentTest("");
    }
  }, [
    getNetworkInfo,
    testWebRTC,
    testHTTP,
    testWebSocket,
    testLatency,
    testDownloadSpeed,
    testUploadSpeed,
    getPublicIP,
    getDNSServers,
    updateTestStep,
    startMonitoring,
    endMonitoring,
    getMetrics,
    onTestComplete,
  ]);

  // Get connection icon based on type
  const getConnectionIcon = useCallback((type: string) => {
    switch (type) {
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "ethernet":
        return <Cable className="h-4 w-4" />;
      case "cellular":
        return <Satellite className="h-4 w-4" />;
      case "bluetooth":
        return <Router className="h-4 w-4" />;
      default:
        return <Network className="h-4 w-4" />;
    }
  }, []);

  // Format speed
  const formatSpeed = useCallback((bps: number): string => {
    if (bps < 1000) return `${bps.toFixed(1)} bps`;
    if (bps < 1000000) return `${(bps / 1000).toFixed(1)} Kbps`;
    if (bps < 1000000000) return `${(bps / 1000000).toFixed(1)} Mbps`;
    return `${(bps / 1000000000).toFixed(1)} Gbps`;
  }, []);

  // Get overall status icon
  const getOverallStatus = useCallback((test: ConnectivityTest) => {
    const workingCount = [test.webRTCWorking, test.httpWorking, test.websocketWorking].filter(
      Boolean,
    ).length;
    const totalCount = 3;

    if (workingCount === totalCount) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (workingCount > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Web Connectivity Test
            </CardTitle>
            <CardDescription>
              Comprehensive network connectivity testing with WebRTC, HTTP, WebSocket, and speed
              measurements
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {navigator.onLine ? "Online" : "Offline"}
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

        {isTesting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{currentTest}</span>
              <span className="text-sm text-gray-500">{testProgress}%</span>
            </div>
            <Progress value={testProgress} className="w-full" />
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={runConnectivityTest} disabled={isTesting} className="flex-1">
            {isTesting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Activity className="mr-2 h-4 w-4" />
                Run Connectivity Test
              </>
            )}
          </Button>
        </div>

        {/* Network Information */}
        {networkInfo && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Network Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                {getConnectionIcon(networkInfo.type)}
                <div>
                  <div className="text-sm text-gray-500">Connection Type</div>
                  <div className="font-medium">{networkInfo.type || "Unknown"}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Effective Type</div>
                <div className="font-medium">{networkInfo.effectiveType}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Downlink</div>
                <div className="font-medium">{networkInfo.downlink} Mbps</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">RTT</div>
                <div className="font-medium">{networkInfo.rtt} ms</div>
              </div>
            </div>
          </Card>
        )}

        {/* Test Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Results</h3>

          {/* Current Test Steps */}
          {(isTesting || testSteps.some((step) => step.status !== "pending")) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testSteps.map((step, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded-full ${
                          step.status === "success"
                            ? "bg-green-100"
                            : step.status === "error"
                              ? "bg-red-100"
                              : step.status === "running"
                                ? "bg-blue-100"
                                : "bg-gray-100"
                        }`}
                      >
                        {React.cloneElement(step.icon as React.ReactElement, {
                          className: `h-4 w-4 ${
                            step.status === "success"
                              ? "text-green-600"
                              : step.status === "error"
                                ? "text-red-600"
                                : step.status === "running"
                                  ? "text-blue-600"
                                  : "text-gray-600"
                          }`,
                        })}
                      </div>
                      <span className="text-sm font-medium">{step.name}</span>
                    </div>
                    <div className="text-right">
                      {step.value && (
                        <div className="text-sm font-medium">
                          {step.value.toFixed(1)} {step.unit}
                        </div>
                      )}
                      {step.error && (
                        <div className="text-xs text-red-600 max-w-32 truncate">{step.error}</div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Test History */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-md font-semibold">Test History</h4>
              <div className="space-y-2">
                {testResults.slice(0, 5).map((test) => (
                  <Card
                    key={test.id}
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedTest(test)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getOverallStatus(test)}
                        <div>
                          <div className="font-medium">
                            {test.connectionType} • {test.timestamp.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Latency: {test.latency.toFixed(0)}ms • Download:{" "}
                            {formatSpeed(test.downloadSpeed)} • Upload:{" "}
                            {formatSpeed(test.uploadSpeed)}
                          </div>
                        </div>
                      </div>
                      <Badge variant={test.online ? "default" : "secondary"}>
                        {test.online ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Selected Test Details */}
          {selectedTest && (
            <Card className="p-4">
              <h4 className="text-md font-semibold mb-3">Test Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium mb-2">Connection</h5>
                  <div className="space-y-1 text-sm">
                    <div>Type: {selectedTest.connectionType}</div>
                    <div>Status: {selectedTest.online ? "Online" : "Offline"}</div>
                    {selectedTest.publicIP && <div>Public IP: {selectedTest.publicIP}</div>}
                    <div>DNS Servers: {selectedTest.dnsServers.join(", ")}</div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Protocols</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${selectedTest.webRTCWorking ? "bg-green-500" : "bg-red-500"}`}
                      />
                      WebRTC: {selectedTest.webRTCWorking ? "Working" : "Failed"}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${selectedTest.httpWorking ? "bg-green-500" : "bg-red-500"}`}
                      />
                      HTTP: {selectedTest.httpWorking ? "Working" : "Failed"}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${selectedTest.websocketWorking ? "bg-green-500" : "bg-red-500"}`}
                      />
                      WebSocket: {selectedTest.websocketWorking ? "Working" : "Failed"}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Performance</h5>
                  <div className="space-y-1 text-sm">
                    <div>Latency: {selectedTest.latency.toFixed(0)}ms</div>
                    <div>Download: {formatSpeed(selectedTest.downloadSpeed)}</div>
                    <div>Upload: {formatSpeed(selectedTest.uploadSpeed)}</div>
                    <div>Packet Loss: {selectedTest.packetLoss}%</div>
                    <div>Jitter: {selectedTest.jitter}ms</div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Server Info</h5>
                  <div className="space-y-1 text-sm">
                    {selectedTest.serverLocation && (
                      <div>Location: {selectedTest.serverLocation}</div>
                    )}
                    {selectedTest.isp && <div>ISP: {selectedTest.isp}</div>}
                    <div>Test ID: {selectedTest.id}</div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
