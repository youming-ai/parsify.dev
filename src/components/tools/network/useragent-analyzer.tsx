/**
 * User Agent Analyzer
 * Analyzes browser user agent strings and provides detailed browser and device information
 */

import React, { useState, useEffect } from "react";
import { Monitor, Smartphone, Tablet, Globe, Shield, Cpu, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  architecture: string;
  mobile: boolean;
  bot: boolean;
}

interface DeviceInfo {
  type: "desktop" | "mobile" | "tablet";
  vendor?: string;
  model?: string;
  os: string;
  osVersion?: string;
}

interface CapabilityInfo {
  cookies: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webGL: boolean;
  webGL2: boolean;
  webAssembly: boolean;
  serviceWorker: boolean;
  push: boolean;
  geolocation: boolean;
  camera: boolean;
  microphone: boolean;
  notifications: boolean;
  fullscreen: boolean;
}

export const UserAgentAnalyzer: React.FC = () => {
  const [userAgent, setUserAgent] = useState("");
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [capabilities, setCapabilities] = useState<CapabilityInfo | null>(null);
  const [customUserAgent, setCustomUserAgent] = useState("");

  useEffect(() => {
    analyzeUserAgent(navigator.userAgent);
    detectCapabilities();
  }, []);

  const analyzeUserAgent = (uaString: string) => {
    const ua = uaString.toLowerCase();

    // Browser detection
    let browserName = "Unknown";
    let browserVersion = "";
    let engine = "Unknown";

    // Chrome/Edge/Brave/Opera
    if (ua.includes("chrome") && !ua.includes("edg")) {
      browserName = "Chrome";
      const match = ua.match(/chrome\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : "";
      engine = "Blink";
    } else if (ua.includes("edg")) {
      browserName = "Edge";
      const match = ua.match(/edg\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : "";
      engine = "Blink";
    } else if (ua.includes("firefox")) {
      browserName = "Firefox";
      const match = ua.match(/firefox\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : "";
      engine = "Gecko";
    } else if (ua.includes("safari") && !ua.includes("chrome")) {
      browserName = "Safari";
      const match = ua.match(/version\/(\d+\.\d+)/);
      browserVersion = match ? match[1] : "";
      engine = "WebKit";
    }

    // Platform detection
    let platform = "Unknown";
    let architecture = "Unknown";

    if (ua.includes("windows")) platform = "Windows";
    else if (ua.includes("mac os")) platform = "macOS";
    else if (ua.includes("linux")) platform = "Linux";
    else if (ua.includes("android")) platform = "Android";
    else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) platform = "iOS";

    if (ua.includes("x64") || ua.includes("x86_64") || ua.includes("win64")) architecture = "x64";
    else if (ua.includes("arm64") || ua.includes("aarch64")) architecture = "ARM64";
    else if (ua.includes("arm")) architecture = "ARM";
    else if (ua.includes("x86") || ua.includes("i386") || ua.includes("win32"))
      architecture = "x86";

    const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
    const isBot = /bot|crawler|spider|crawling|facebook|twitter|google|yahoo|bing/i.test(ua);

    setBrowserInfo({
      name: browserName,
      version: browserVersion,
      engine,
      platform,
      architecture,
      mobile: isMobile,
      bot: isBot,
    });

    // Device detection
    let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
    let vendor: string | undefined;
    let model: string | undefined;
    let os = platform;
    let osVersion: string | undefined;

    if (isBot) {
      deviceType = "desktop";
      vendor = "Bot";
    } else if (ua.includes("iphone") || (ua.includes("android") && ua.includes("mobile"))) {
      deviceType = "mobile";
      if (ua.includes("iphone")) {
        vendor = "Apple";
        model = "iPhone";
        const match = ua.match(/iphone os (\d+[._\d]+)/);
        osVersion = match ? match[1].replace(/_/g, ".") : undefined;
      }
    } else if (ua.includes("ipad") || (ua.includes("android") && !ua.includes("mobile"))) {
      deviceType = "tablet";
      if (ua.includes("ipad")) {
        vendor = "Apple";
        model = "iPad";
        const match = ua.match(/cpu os (\d+[._\d]+)/);
        osVersion = match ? match[1].replace(/_/g, ".") : undefined;
      }
    }

    setDeviceInfo({
      type: deviceType,
      vendor,
      model,
      os,
      osVersion,
    });

    setUserAgent(uaString);
  };

  const detectCapabilities = () => {
    const caps: CapabilityInfo = {
      cookies: navigator.cookieEnabled,
      localStorage: typeof Storage !== "undefined" && !!window.localStorage,
      sessionStorage: typeof Storage !== "undefined" && !!window.sessionStorage,
      indexedDB: "indexedDB" in window,
      webGL: !!(() => {
        try {
          const canvas = document.createElement("canvas");
          return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
        } catch (e) {
          return false;
        }
      })(),
      webGL2: !!(() => {
        try {
          const canvas = document.createElement("canvas");
          return !!canvas.getContext("webgl2");
        } catch (e) {
          return false;
        }
      })(),
      webAssembly: typeof WebAssembly !== "undefined",
      serviceWorker: "serviceWorker" in navigator,
      push: "PushManager" in window,
      geolocation: "geolocation" in navigator,
      camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      notifications: "Notification" in window,
      fullscreen: "fullscreenEnabled" in document || "webkitFullscreenEnabled" in document,
    };

    setCapabilities(caps);
  };

  const analyzeCustomUserAgent = () => {
    if (customUserAgent.trim()) {
      analyzeUserAgent(customUserAgent.trim());
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return <Smartphone className="w-5 h-5" />;
      case "tablet":
        return <Tablet className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const formatUserAgent = (ua: string) => {
    return ua.split(" ").map((part, index) => (
      <span key={index} className="inline-block">
        <span className="text-blue-600">{part}</span>
        {index < ua.split(" ").length - 1 && " "}
      </span>
    ));
  };

  return (
    <div className="space-y-6">
      {/* Current User Agent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Current User Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg font-mono text-sm break-all">
            {formatUserAgent(navigator.userAgent)}
          </div>
        </CardContent>
      </Card>

      {/* Custom User Agent Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analyze Custom User Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={customUserAgent}
            onChange={(e) => setCustomUserAgent(e.target.value)}
            placeholder="Enter a custom user agent string to analyze..."
            className="w-full p-3 border rounded-md font-mono text-sm"
            rows={3}
          />
          <Button onClick={analyzeCustomUserAgent} disabled={!customUserAgent.trim()}>
            Analyze User Agent
          </Button>
        </CardContent>
      </Card>

      {browserInfo && (
        <Tabs defaultValue="browser" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browser">Browser</TabsTrigger>
            <TabsTrigger value="device">Device</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          </TabsList>

          {/* Browser Information */}
          <TabsContent value="browser">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Browser Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Browser</label>
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {browserInfo.name} {browserInfo.version}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Engine</label>
                    <div className="mt-1">
                      <Badge variant="outline">{browserInfo.engine}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Platform</label>
                    <div className="mt-1">
                      <Badge variant="outline">{browserInfo.platform}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Architecture</label>
                    <div className="mt-1">
                      <Badge variant="outline">{browserInfo.architecture}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {browserInfo.mobile && <Badge variant="secondary">Mobile</Badge>}
                  {browserInfo.bot && <Badge variant="destructive">Bot/Crawler</Badge>}
                  {!browserInfo.mobile && !browserInfo.bot && (
                    <Badge variant="secondary">Desktop</Badge>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Full User Agent</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
                    {userAgent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Device Information */}
          <TabsContent value="device">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deviceInfo && (
                  <>
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(deviceInfo.type)}
                      <div>
                        <div className="font-medium capitalize">{deviceInfo.type}</div>
                        {deviceInfo.vendor && (
                          <div className="text-sm text-gray-600">
                            {deviceInfo.vendor} {deviceInfo.model && `- ${deviceInfo.model}`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Operating System
                        </label>
                        <div className="mt-1">
                          <Badge variant="secondary">
                            {deviceInfo.os} {deviceInfo.osVersion && deviceInfo.osVersion}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Device Type</label>
                        <div className="mt-1">
                          <Badge variant="outline" className="capitalize">
                            {deviceInfo.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Capabilities */}
          <TabsContent value="capabilities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Browser Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {capabilities && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(capabilities).map(([key, value]) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          value
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${
                            value ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
