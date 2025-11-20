"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Link,
  Copy,
  Download,
  Trash2,
  BarChart,
  Clock,
  ExternalLink,
  Settings,
  RefreshCw,
  Share,
  QrCode,
  Shield,
  Zap,
} from "lucide-react";
import { usePerformanceMonitor } from "@/hooks/use-performance-monitor";

interface URLShortenerProps {
  onShortenComplete?: (shortenedUrl: ShortenedURL) => void;
}

interface ShortenedURL {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: Date;
  clicks: number;
  lastAccessed?: Date;
  expiresAt?: Date;
  customAlias?: string;
  password?: string;
  description?: string;
  isActive: boolean;
}

interface URLStats {
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  expiredUrls: number;
  avgClicksPerUrl: number;
}

const STORAGE_KEY = "parsify-url-shortener";
const STATS_KEY = "parsify-url-stats";

const DOMAIN_PREFIX = "psfy.link"; // Custom short domain

export const URLShortener: React.FC<URLShortenerProps> = ({ onShortenComplete }) => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");
  const [expiresIn, setExpiresIn] = useState<number>(0); // 0 = never expires
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedURL[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<ShortenedURL | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);

  const { startMonitoring, endMonitoring, getMetrics } = usePerformanceMonitor();

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setShortenedUrls(
          parsedData.map((url: any) => ({
            ...url,
            createdAt: new Date(url.createdAt),
            lastAccessed: url.lastAccessed ? new Date(url.lastAccessed) : undefined,
            expiresAt: url.expiresAt ? new Date(url.expiresAt) : undefined,
          })),
        );
      }
    } catch (error) {
      console.error("Error loading saved URLs:", error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortenedUrls));
      updateStats();
    } catch (error) {
      console.error("Error saving URLs:", error);
    }
  }, [shortenedUrls]);

  // Clean up expired URLs periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date();
      setShortenedUrls((prev) => prev.filter((url) => !url.expiresAt || url.expiresAt > now));
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Generate statistics
  const stats = useMemo((): URLStats => {
    const now = new Date();
    const activeUrls = shortenedUrls.filter(
      (url) => url.isActive && (!url.expiresAt || url.expiresAt > now),
    );
    const expiredUrls = shortenedUrls.filter((url) => url.expiresAt && url.expiresAt <= now);

    return {
      totalUrls: shortenedUrls.length,
      totalClicks: shortenedUrls.reduce((sum, url) => sum + url.clicks, 0),
      activeUrls: activeUrls.length,
      expiredUrls: expiredUrls.length,
      avgClicksPerUrl:
        shortenedUrls.length > 0
          ? shortenedUrls.reduce((sum, url) => sum + url.clicks, 0) / shortenedUrls.length
          : 0,
    };
  }, [shortenedUrls]);

  // Update stats in localStorage
  const updateStats = useCallback(() => {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error("Error saving stats:", error);
    }
  }, [stats]);

  // Generate short code
  const generateShortCode = useCallback((length: number = 6): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Validate URL
  const isValidUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  }, []);

  // Create shortened URL
  const createShortenedUrl = useCallback(async () => {
    if (!originalUrl.trim()) {
      setError("Please enter a URL to shorten");
      return;
    }

    if (!isValidUrl(originalUrl)) {
      setError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setError(null);
    setIsLoading(true);

    startMonitoring("url-shorten");

    try {
      // Check if custom alias already exists
      if (customAlias) {
        const existing = shortenedUrls.find((url) => url.shortCode === customAlias);
        if (existing) {
          throw new Error("This custom alias is already taken");
        }
      }

      // Generate unique short code
      let shortCode = customAlias || generateShortCode();
      let attempts = 0;
      const maxAttempts = 10;

      while (shortenedUrls.find((url) => url.shortCode === shortCode) && attempts < maxAttempts) {
        shortCode = generateShortCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error("Could not generate a unique short code. Please try again.");
      }

      // Calculate expiration date
      const expiresAt =
        expiresIn > 0 ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : undefined;

      const newShortenedUrl: ShortenedURL = {
        id: Date.now().toString(),
        originalUrl,
        shortCode,
        shortUrl: `https://${DOMAIN_PREFIX}/${shortCode}`,
        createdAt: new Date(),
        clicks: 0,
        expiresAt,
        customAlias: customAlias || undefined,
        password: requirePassword ? password : undefined,
        description: description || undefined,
        isActive: true,
      };

      setShortenedUrls((prev) => [newShortenedUrl, ...prev]);
      setSelectedUrl(newShortenedUrl);

      // Reset form
      setOriginalUrl("");
      setCustomAlias("");
      setPassword("");
      setDescription("");
      setExpiresIn(0);
      setRequirePassword(false);

      onShortenComplete?.(newShortenedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while shortening the URL");
    } finally {
      const metrics = getMetrics();
      endMonitoring();
      setIsLoading(false);
    }
  }, [
    originalUrl,
    customAlias,
    password,
    description,
    expiresIn,
    requirePassword,
    shortenedUrls,
    generateShortCode,
    isValidUrl,
    startMonitoring,
    endMonitoring,
    getMetrics,
    onShortenComplete,
  ]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  // Simulate click on short URL
  const simulateClick = useCallback((url: ShortenedURL) => {
    setShortenedUrls((prev) =>
      prev.map((u) =>
        u.id === url.id
          ? {
              ...u,
              clicks: u.clicks + 1,
              lastAccessed: new Date(),
            }
          : u,
      ),
    );
  }, []);

  // Delete URL
  const deleteUrl = useCallback(
    (id: string) => {
      setShortenedUrls((prev) => prev.filter((url) => url.id !== id));
      if (selectedUrl?.id === id) {
        setSelectedUrl(null);
      }
    },
    [selectedUrl],
  );

  // Toggle URL active status
  const toggleUrlStatus = useCallback((id: string) => {
    setShortenedUrls((prev) =>
      prev.map((url) => (url.id === id ? { ...url, isActive: !url.isActive } : url)),
    );
  }, []);

  // Export URLs
  const exportUrls = useCallback(() => {
    const dataStr = JSON.stringify(shortenedUrls, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `url-shortener-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [shortenedUrls]);

  // Clear all URLs
  const clearAllUrls = useCallback(() => {
    if (
      confirm("Are you sure you want to delete all shortened URLs? This action cannot be undone.")
    ) {
      setShortenedUrls([]);
      setSelectedUrl(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              URL Shortener
            </CardTitle>
            <CardDescription>
              Create short, memorable URLs with custom aliases and advanced features
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.activeUrls} active
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Short URL</TabsTrigger>
            <TabsTrigger value="manage">Manage URLs</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="original-url">Original URL</Label>
                <Input
                  id="original-url"
                  type="url"
                  placeholder="https://example.com/very/long/url"
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && createShortenedUrl()}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="custom-alias">Custom Alias (optional)</Label>
                  <Input
                    id="custom-alias"
                    placeholder="my-link"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="expires-in">Expires In (hours, 0 = never)</Label>
                  <Input
                    id="expires-in"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Link to my portfolio"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="require-password"
                    checked={requirePassword}
                    onChange={(e) => setRequirePassword(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="require-password">Require password to access</Label>
                </div>

                {requirePassword && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Button onClick={createShortenedUrl} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Create Short URL
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Your Shortened URLs</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportUrls}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllUrls}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>

            {shortenedUrls.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Link className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No shortened URLs yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shortenedUrls.map((url) => (
                  <Card key={url.id} className={`p-4 ${!url.isActive ? "opacity-50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={url.isActive ? "default" : "secondary"}>
                            {url.shortCode}
                          </Badge>
                          {url.expiresAt && (
                            <Badge variant="outline" className="text-xs">
                              Expires: {url.expiresAt.toLocaleDateString()}
                            </Badge>
                          )}
                          {url.password && <Shield className="h-3 w-3 text-gray-500" />}
                        </div>

                        <p className="text-sm text-gray-600 truncate mb-1">{url.originalUrl}</p>

                        {url.description && (
                          <p className="text-xs text-gray-500 mb-2">{url.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <BarChart className="h-3 w-3" />
                            {url.clicks} clicks
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created {url.createdAt.toLocaleDateString()}
                          </span>
                          {url.lastAccessed && (
                            <span>Last accessed {url.lastAccessed.toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(url.shortUrl, url.id)}
                        >
                          {copiedId === url.id ? "Copied!" : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => simulateClick(url)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleUrlStatus(url.id)}>
                          {url.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteUrl(url.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats.totalUrls}</div>
                <div className="text-sm text-gray-500">Total URLs</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats.totalClicks}</div>
                <div className="text-sm text-gray-500">Total Clicks</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats.activeUrls}</div>
                <div className="text-sm text-gray-500">Active URLs</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">{stats.avgClicksPerUrl.toFixed(1)}</div>
                <div className="text-sm text-gray-500">Avg Clicks/URL</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">About URL Shortener</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Create short, memorable URLs with custom aliases</p>
                <p>• Password protection for sensitive links</p>
                <p>• Set expiration dates for temporary links</p>
                <p>• Track clicks and access statistics</p>
                <p>• Export and manage your link collection</p>
                <p>• All data stored locally in your browser</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
