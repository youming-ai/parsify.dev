'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PerformanceMonitor from '@/lib/performance-monitor';
import {
  ArrowSquareOut,
  ArrowsClockwise,
  ChartBar,
  Clock,
  Copy,
  DownloadSimple,
  Lightning,
  Link,
  Shield,
  Trash,
} from '@phosphor-icons/react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

const STORAGE_KEY = 'parsify-url-shortener';
const STATS_KEY = 'parsify-url-stats';

const DOMAIN_PREFIX = 'psfy.link'; // Custom short domain

export const URLShortener: React.FC<URLShortenerProps> = ({ onShortenComplete }) => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [expiresIn, setExpiresIn] = useState<number>(0); // 0 = never expires
  const [shortenedUrls, setShortenedUrls] = useState<ShortenedURL[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<ShortenedURL | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const performanceMonitor = PerformanceMonitor.getInstance();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPassword, _setShowPassword] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);

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
          }))
        );
      }
    } catch (error) {
      console.error('Error loading saved URLs:', error);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shortenedUrls));
      updateStats();
    } catch (error) {
      console.error('Error saving URLs:', error);
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
      (url) => url.isActive && (!url.expiresAt || url.expiresAt > now)
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
      console.error('Error saving stats:', error);
    }
  }, [stats]);

  // Generate short code
  const generateShortCode = useCallback((length = 6): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Validate URL
  const isValidUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  // Create shortened URL
  const createShortenedUrl = useCallback(async () => {
    if (!originalUrl.trim()) {
      setError('Please enter a URL to shorten');
      return;
    }

    if (!isValidUrl(originalUrl)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setError(null);
    setIsLoading(true);

    performanceMonitor.startMonitoring();

    try {
      // Check if custom alias already exists
      if (customAlias) {
        const existing = shortenedUrls.find((url) => url.shortCode === customAlias);
        if (existing) {
          throw new Error('This custom alias is already taken');
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
        throw new Error('Could not generate a unique short code. Please try again.');
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
      setOriginalUrl('');
      setCustomAlias('');
      setPassword('');
      setDescription('');
      setExpiresIn(0);
      setRequirePassword(false);

      onShortenComplete?.(newShortenedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while shortening the URL');
    } finally {
      performanceMonitor.stopMonitoring();
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
    onShortenComplete,
  ]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
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
          : u
      )
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
    [selectedUrl]
  );

  // Toggle URL active status
  const toggleUrlStatus = useCallback((id: string) => {
    setShortenedUrls((prev) =>
      prev.map((url) => (url.id === id ? { ...url, isActive: !url.isActive } : url))
    );
  }, []);

  // Export URLs
  const exportUrls = useCallback(() => {
    const dataStr = JSON.stringify(shortenedUrls, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `url-shortener-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [shortenedUrls]);

  // Clear all URLs
  const clearAllUrls = useCallback(() => {
    if (
      confirm('Are you sure you want to delete all shortened URLs? This action cannot be undone.')
    ) {
      setShortenedUrls([]);
      setSelectedUrl(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <Card className="mx-auto w-full max-w-4xl">
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
                  onKeyPress={(e) => e.key === 'Enter' && createShortenedUrl()}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      type={showPassword ? 'text' : 'password'}
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
                    <ArrowsClockwise className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Lightning className="mr-2 h-4 w-4" />
                    Create Short URL
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Your Shortened URLs</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportUrls}>
                  <DownloadSimple className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllUrls}>
                  <Trash className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </div>

            {shortenedUrls.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Link className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p>No shortened URLs yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shortenedUrls.map((url) => (
                  <Card key={url.id} className={`p-4 ${!url.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant={url.isActive ? 'default' : 'secondary'}>
                            {url.shortCode}
                          </Badge>
                          {url.expiresAt && (
                            <Badge variant="outline" className="text-xs">
                              Expires: {url.expiresAt.toLocaleDateString()}
                            </Badge>
                          )}
                          {url.password && <Shield className="h-3 w-3 text-muted-foreground" />}
                        </div>

                        <p className="mb-1 truncate text-muted-foreground text-sm">
                          {url.originalUrl}
                        </p>

                        {url.description && (
                          <p className="mb-2 text-muted-foreground text-xs">{url.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-muted-foreground text-xs">
                          <span className="flex items-center gap-1">
                            <ChartBar className="h-3 w-3" />
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
                          {copiedId === url.id ? 'Copied!' : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => simulateClick(url)}>
                          <ArrowSquareOut className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleUrlStatus(url.id)}>
                          {url.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteUrl(url.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card className="p-4">
                <div className="font-bold text-2xl">{stats.totalUrls}</div>
                <div className="text-muted-foreground text-sm">Total URLs</div>
              </Card>
              <Card className="p-4">
                <div className="font-bold text-2xl">{stats.totalClicks}</div>
                <div className="text-muted-foreground text-sm">Total Clicks</div>
              </Card>
              <Card className="p-4">
                <div className="font-bold text-2xl">{stats.activeUrls}</div>
                <div className="text-muted-foreground text-sm">Active URLs</div>
              </Card>
              <Card className="p-4">
                <div className="font-bold text-2xl">{stats.avgClicksPerUrl.toFixed(1)}</div>
                <div className="text-muted-foreground text-sm">Avg Clicks/URL</div>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="mb-4 font-semibold text-lg">About URL Shortener</h3>
              <div className="space-y-2 text-muted-foreground text-sm">
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
