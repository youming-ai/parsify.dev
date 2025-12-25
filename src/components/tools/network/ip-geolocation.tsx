'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PerformanceMonitor from '@/lib/performance-monitor';
import {
  ArrowsClockwise,
  Clock,
  DownloadSimple,
  Eye,
  Globe,
  HardDrives,
  MagnifyingGlass,
  MapPin,
  Network,
  Pulse,
  Shield,
  WifiHigh,
} from '@phosphor-icons/react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface IPGeolocationToolProps {
  onLookupComplete?: (result: GeoLocationResult) => void;
}

interface GeoLocationResult {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  regionCode?: string;
  city: string;
  zip?: string;
  flag?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  org?: string;
  as: string;
  proxy?: boolean;
  hosting?: boolean;
  mobile?: boolean;
  source: string;
  responseTime: number;
  timestamp: Date;
}

interface DataSource {
  name: string;
  url: string;
  requiresApiKey: boolean;
  rateLimit?: string;
  features: string[];
  endpoint: string;
}

interface CachedResult {
  data: GeoLocationResult;
  expiry: number;
}

export const IPGeolocationTool: React.FC<IPGeolocationToolProps> = ({ onLookupComplete }) => {
  const [ipAddress, setIpAddress] = useState('');
  const [currentIP, setCurrentIP] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<GeoLocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<GeoLocationResult[]>([]);
  const [selectedSource, setSelectedSource] = useState('ip-api');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);

  const performanceMonitor = PerformanceMonitor.getInstance();
  const cacheRef = useRef<Map<string, CachedResult>>(new Map());

  const dataSources: Record<string, DataSource> = {
    'ip-api': {
      name: 'IP-API.co',
      url: 'https://ipapi.co',
      requiresApiKey: false,
      rateLimit: '1000/hour',
      features: ['geolocation', 'isp', 'timezone', 'proxy', 'mobile'],
      endpoint: '/json',
    },
    'ip-api-com': {
      name: 'IP-API.com',
      url: 'https://ipapi.com',
      requiresApiKey: false,
      rateLimit: '45/minute',
      features: ['geolocation', 'isp', 'mobile', 'security'],
      endpoint: '/json',
    },
    ipify: {
      name: 'IPify',
      url: 'https://geo.ipify.org',
      requiresApiKey: false,
      rateLimit: '1000/month',
      features: ['geolocation'],
      endpoint: '/api/v1',
    },
    freegeoip: {
      name: 'FreeGeoIP',
      url: 'https://freegeoip.app',
      requiresApiKey: false,
      rateLimit: '1000/hour',
      features: ['geolocation'],
      endpoint: '/json',
    },
    ipgeolocation: {
      name: 'IPGeolocation.io',
      url: 'https://ipgeolocation.io',
      requiresApiKey: true,
      rateLimit: '50000/month',
      features: ['geolocation', 'isp', 'timezone', 'security', 'organization'],
      endpoint: '/api/json',
    },
  };

  const detectClientIP = useCallback(async (): Promise<string> => {
    try {
      // Try multiple methods to get client IP
      const methods = [
        // Using ipify for client IP detection
        'https://api.ipify.org?format=json',
        'https://jsonip.com/?format=json',
        'https://ipapi.co/json',
        'https://ipinfo.io/json',
      ];

      for (const methodUrl of methods) {
        try {
          const response = await fetch(methodUrl, {
            signal: AbortSignal.timeout(5000),
          });
          const data = await response.json();

          if (data.ip) {
            return data.ip;
          }
        } catch (_err) {}
      }

      throw new Error('Could not detect client IP');
    } catch (error) {
      console.warn('Client IP detection failed:', error);
      return '';
    }
  }, []);

  const parseGeolocationData = useCallback((data: any, source: string): GeoLocationResult => {
    const commonFields = {
      source,
      responseTime: 0, // Will be set by caller
      timestamp: new Date(),
    };

    // Parse based on different API response formats
    switch (source) {
      case 'ip-api':
        return {
          ip: data.ip,
          country: data.country_name || data.country || '',
          countryCode: data.country_code || '',
          region: data.region || '',
          regionName: data.region_name || '',
          city: data.city || '',
          zip: data.postal || data.zip,
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timezone: data.timezone || '',
          isp: data.org || data.connection?.isp || '',
          org: data.org,
          as: data.connection?.asn || '',
          hosting: false,
          proxy: data.connection?.proxy || false,
          ...commonFields,
        };

      case 'ip-api-com':
        return {
          ip: data.query || '',
          country: data.country || '',
          countryCode: data.countryCode || '',
          region: data.regionName || data.region || '',
          regionName: data.regionName || data.region || '',
          city: data.city || '',
          zip: data.zip || '',
          latitude: data.lat || 0,
          longitude: data.lon || 0,
          timezone: data.timezone?.offset
            ? `UTC${data.timezone.offset >= 0 ? '+' : ''}${data.timezone.offset}`
            : '',
          isp: data.isp || data.org || '',
          org: data.org || '',
          as: data.as || data.query || '',
          mobile: data.mobile || false,
          hosting: data.hosting || false,
          proxy: data.proxy || false,
          ...commonFields,
        };

      case 'ipify':
        return {
          ip: data.ip || '',
          country: data.country_code || data.country || '',
          countryCode: data.country_code || data.country || '',
          region: '',
          regionName: data.region || '',
          city: data.city || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timezone: data.time_zone?.offset
            ? `UTC${data.time_zone.offset >= 0 ? '+' : ''}${data.time_zone.offset}`
            : '',
          isp: '',
          org: '',
          as: '',
          hosting: false,
          proxy: false,
          ...commonFields,
        };

      case 'freegeoip':
        return {
          ip: data.ip || '',
          country: data.country_name || data.country || '',
          countryCode: data.country_code || '',
          region: data.region_code || data.region || '',
          regionName: data.region_name || data.region || '',
          city: data.city || '',
          zip: data.zip_code || data.postal || data.zip || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timezone: data.time_zone?.offset
            ? `UTC${data.time_zone.offset >= 0 ? '+' : ''}${data.time_zone.offset}`
            : '',
          isp: '',
          org: '',
          as: '',
          hosting: false,
          proxy: false,
          ...commonFields,
        };

      case 'ipgeolocation':
        return {
          ip: data.ip || data.query || '',
          country: data.country_name || data.country || '',
          countryCode: data.country_code || data.country || '',
          region: data.region_code || data.state || '',
          regionName: data.region_name || data.state || '',
          city: data.city || '',
          zip: data.zip || data.postal || data.zip_code || '',
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          timezone: data.time_zone || '',
          isp: data.isp || data.org || '',
          org: data.org || '',
          as: data.as || '',
          hosting: data.hosting || false,
          proxy: data.proxy || false,
          ...commonFields,
        };

      default:
        return {
          ip: '',
          country: '',
          countryCode: '',
          region: '',
          regionName: '',
          city: '',
          latitude: 0,
          longitude: 0,
          timezone: '',
          isp: '',
          org: '',
          as: '',
          hosting: false,
          proxy: false,
          ...commonFields,
        };
    }
  }, []);

  const getCacheKey = useCallback((ip: string, source: string): string => {
    return `${ip}:${source}`;
  }, []);

  const isCacheValid = useCallback((cached: CachedResult): boolean => {
    return Date.now() < cached.expiry;
  }, []);

  const lookupIP = useCallback(
    async (targetIP: string, sourceKey: string) => {
      const source = dataSources[sourceKey];

      try {
        const startTime = performance.now();

        // Check cache first
        if (cacheEnabled) {
          const cacheKey = getCacheKey(targetIP, sourceKey);
          const cached = cacheRef.current.get(cacheKey);
          if (cached && isCacheValid(cached)) {
            return { ...cached.data, cached: true, responseTime: 0 };
          }
        }

        // Make API request
        const url = source.endpoint.startsWith('/')
          ? `${source.url}${source.endpoint}`
          : source.url;

        const response = await fetch(`${url}/${targetIP}`, {
          signal: AbortSignal.timeout(10000),
          headers: source.requiresApiKey
            ? {
                'X-Api-Key': process.env.NEXT_PUBLIC_IPGEOLOCATION_API_KEY || '',
                'Content-Type': 'application/json',
              }
            : { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        const result = parseGeolocationData(data, sourceKey);
        result.responseTime = responseTime;

        // Cache result
        if (cacheEnabled) {
          const cacheKey = getCacheKey(targetIP, sourceKey);
          const cacheEntry: CachedResult = {
            data: result,
            expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
          };
          cacheRef.current.set(cacheKey, cacheEntry);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lookup failed';
        throw new Error(`${source.name} API error: ${errorMessage}`);
      }
    },
    [cacheEnabled, dataSources, getCacheKey, isCacheValid, parseGeolocationData]
  );

  const searchIP = useCallback(async () => {
    const targetIP = ipAddress.trim() || currentIP;

    if (!targetIP) {
      setError('Please enter an IP address or use auto-detection');
      return;
    }

    // Validate IP format
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;
    if (!ipRegex.test(targetIP)) {
      setError('Please enter a valid IP address');
      return;
    }

    setIsSearching(true);
    setError(null);
    performanceMonitor.startMonitoring();

    try {
      const result = await lookupIP(targetIP, selectedSource);
      setResult(result);

      // Add to history if not duplicate
      setSearchHistory((prev) => {
        const exists = prev.some((item) => item.ip === result.ip);
        return exists ? prev : [result, ...prev.slice(0, 19)]; // Keep last 20
      });

      if (onLookupComplete) {
        onLookupComplete(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Geolocation lookup failed';
      setError(errorMessage);
    } finally {
      performanceMonitor.stopMonitoring();
      setIsSearching(false);
    }
  }, [ipAddress, currentIP, selectedSource, lookupIP, onLookupComplete]);

  const getCurrentIP = useCallback(async () => {
    setIsSearching(true);
    setError(null);

    try {
      const ip = await detectClientIP();
      setCurrentIP(ip);
      if (ip) {
        setIpAddress(ip);
      }
    } catch (error) {
      console.warn('Failed to detect current IP:', error);
      setError('Could not auto-detect IP address');
    } finally {
      setIsSearching(false);
    }
  }, [detectClientIP]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  const downloadResult = useCallback((result: GeoLocationResult) => {
    const data = {
      ip: result.ip,
      country: result.country,
      countryCode: result.countryCode,
      region: result.regionName || result.region,
      regionCode: result.region || result.regionCode,
      city: result.city,
      postalCode: result.zip,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
      isp: result.isp,
      organization: result.org,
      asn: result.as,
      isProxy: result.proxy,
      isHosting: result.hosting,
      isMobile: result.mobile || false,
      source: result.source,
      responseTime: result.responseTime,
      timestamp: result.timestamp,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-geolocation-${result.ip}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadAsCSV = useCallback(() => {
    const headers = [
      'IP',
      'Country',
      'Country Code',
      'Region',
      'City',
      'Latitude',
      'Longitude',
      'ISP',
      'Organization',
      'ASN',
      'Proxy',
      'Hosting',
      'Source',
      'Response Time (ms)',
      'Timestamp',
    ];

    const rows = searchHistory.map((result) => [
      result.ip,
      result.country,
      result.countryCode,
      result.regionName || result.region,
      result.city,
      result.latitude,
      result.longitude,
      result.isp,
      result.org || '',
      result.as || '',
      result.proxy ? 'Yes' : 'No',
      result.hosting ? 'Yes' : 'No',
      result.source,
      result.responseTime.toFixed(2),
      result.timestamp.toISOString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ip-geolocation-history.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [searchHistory]);

  useEffect(() => {
    if (autoDetect) {
      getCurrentIP();
    }

    // Cleanup cache on unmount
    return () => {
      clearCache();
    };
  }, [autoDetect, getCurrentIP]);

  const formatTimezone = useCallback((tz: string): string => {
    if (!tz) return 'Unknown';

    // Parse timezone string like "UTC-5" or "UTC+8"
    const match = tz.match(/UTC([+-]\d+)/);
    if (match) {
      return `GMT ${match[1]}`;
    }

    return tz;
  }, []);

  const getProviderInfo = useCallback((sourceKey: string): DataSource => {
    return dataSources[sourceKey] || dataSources['ip-api'];
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            IP Geolocation Tool
          </CardTitle>
          <CardDescription>
            Lookup IP addresses with multiple data sources and detailed location information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* IP Input */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div>
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="Enter IP address (e.g., 8.8.8.8)"
                    disabled={isSearching}
                  />
                  {currentIP && (
                    <div className="mt-1">
                      <Label className="text-muted-foreground text-sm">Current IP:</Label>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-muted px-2 py-1 font-mono text-sm">
                          {currentIP}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIpAddress(currentIP);
                            setError(null);
                          }}
                        >
                          Use Current
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <Label htmlFor="source">Data Source</Label>
                    <Select
                      value={selectedSource}
                      onValueChange={setSelectedSource}
                      disabled={isSearching}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(dataSources).map(([key, source]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col">
                              <span>{source.name}</span>
                              <div className="text-muted-foreground text-xs">
                                {source.features.join(', ')} • {source.rateLimit}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={searchIP}
                      disabled={isSearching || (!ipAddress && !currentIP)}
                      className="w-full"
                    >
                      {isSearching ? (
                        <>
                          <ArrowsClockwise className="mr-2 h-4 w-4 animate-spin" />
                          Looking up...
                        </>
                      ) : (
                        <>
                          <MagnifyingGlass className="mr-2 h-4 w-4" />
                          Lookup IP
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={getCurrentIP}
                      disabled={isSearching || !autoDetect}
                    >
                      <WifiHigh className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Auto-detect IP</Label>
                      <Switch
                        checked={autoDetect}
                        onCheckedChange={setAutoDetect}
                        disabled={isSearching}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Cache Results</Label>
                      <Switch
                        checked={cacheEnabled}
                        onCheckedChange={setCacheEnabled}
                        disabled={isSearching}
                      />
                    </div>
                  </div>

                  <div className="text-muted-foreground text-xs">
                    {cacheEnabled && (
                      <span>
                        Cache expires after 5 minutes • {cacheRef.current.size} items cached
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 font-medium text-sm">Source Information</div>
                <div className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <HardDrives className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">
                        {getProviderInfo(selectedSource).name}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {getProviderInfo(selectedSource).rateLimit}
                      </div>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Features: {getProviderInfo(selectedSource).features.join(', ')}
                  </div>
                  {getProviderInfo(selectedSource).requiresApiKey && (
                    <div className="text-orange-600 text-xs">
                      API key required for production use
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Current Result */}
            {result && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="map">Map View</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Basic Information</Label>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">IP Address:</span>
                          <span className="font-medium font-mono text-sm">{result.ip}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Country:</span>
                          <span className="text-sm">
                            {result.countryCode
                              ? `${result.flag || ''} ${result.country}`
                              : result.country}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">City:</span>
                          <span className="text-sm">{result.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Region:</span>
                          <span className="text-sm">{result.regionName || result.region}</span>
                        </div>
                        {result.zip && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-sm">Postal:</span>
                            <span className="text-sm">{result.zip}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Network Information</Label>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">ISP:</span>
                          <span className="max-w-32 truncate text-sm">{result.isp}</span>
                        </div>
                        {result.org && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-sm">Organization:</span>
                            <span className="max-w-32 truncate text-sm">{result.org}</span>
                          </div>
                        )}
                        {result.as && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-sm">ASN:</span>
                            <span className="text-sm">{result.as}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-sm">Technical Details</Label>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Latitude:</span>
                          <span className="text-sm">{result.latitude.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Longitude:</span>
                          <span className="text-sm">{result.longitude.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Timezone:</span>
                          <span className="text-sm">{formatTimezone(result.timezone)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Proxy:</span>
                          <Badge variant={result.proxy ? 'destructive' : 'secondary'}>
                            {result.proxy ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Hosting:</span>
                          <Badge variant={result.hosting ? 'secondary' : 'outline'}>
                            {result.hosting ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Source:</span>
                          <span className="text-sm">{result.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">Response:</span>
                          <span className="text-sm">{result.responseTime.toFixed(0)}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => downloadResult(result)}>
                      <DownloadSimple className="mr-2 h-4 w-4" />
                      DownloadSimple JSON
                    </Button>
                    <Button variant="outline" onClick={clearCache}>
                      <ArrowsClockwise className="mr-2 h-4 w-4" />
                      Clear Cache
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="map" className="space-y-4">
                  <div className="overflow-hidden rounded-lg border">
                    <div className="aspect-video">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${result.longitude - 0.005},${result.latitude - 0.005},${result.longitude + 0.005},${result.latitude + 0.005}&layer=mapnik&marker=${result.latitude},${result.longitude}`}
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        title={`Location: ${result.city}, ${result.country}`}
                      />
                    </div>
                    <div className="bg-muted p-3">
                      <div className="text-center text-sm">
                        <MapPin className="mr-2 inline-block h-4 w-4" />
                        View location on OpenStreetMap
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  {searchHistory.length > 0 ? (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <Label className="font-medium text-sm">
                          MagnifyingGlass History ({searchHistory.length})
                        </Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadAsCSV}
                            disabled={searchHistory.length === 0}
                          >
                            <DownloadSimple className="mr-2 h-4 w-4" />
                            Export CSV
                          </Button>
                          <Button variant="outline" size="sm" onClick={clearHistory}>
                            Clear
                          </Button>
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-lg border">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-muted">
                              <tr>
                                <th className="p-2 text-left font-medium text-sm">IP</th>
                                <th className="p-2 text-left font-medium text-sm">Location</th>
                                <th className="p-2 text-left font-medium text-sm">ISP</th>
                                <th className="p-2 text-left font-medium text-sm">Source</th>
                                <th className="p-2 text-left font-medium text-sm">Time</th>
                                <th className="p-2 text-left font-medium text-sm">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {searchHistory.map((item, index) => (
                                <tr key={index} className="border-t hover:bg-muted">
                                  <td className="p-2 font-mono text-sm">{item.ip}</td>
                                  <td className="p-2 text-sm">
                                    {item.city}, {item.country}
                                  </td>
                                  <td className="max-w-32 truncate p-2 text-sm">{item.isp}</td>
                                  <td className="p-2 text-sm">
                                    <Badge variant="outline" className="text-xs">
                                      {item.source}
                                    </Badge>
                                  </td>
                                  <td className="p-2 text-sm">{item.responseTime.toFixed(0)}ms</td>
                                  <td className="p-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setIpAddress(item.ip);
                                        setSelectedSource(
                                          item.source.toLowerCase().replace('.', '-')
                                        );
                                        setResult(item);
                                      }}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <Globe className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>
                        No search history yet. Start looking up IP addresses to see your results
                        here.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="tools" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Quick Links</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            window.open(`https://www.shodan.io/host/${result.ip}`, '_blank');
                          }}
                        >
                          <Pulse className="mr-2 h-4 w-4" />
                          Shodan.io
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            window.open(
                              `https://www.virustotal.com/en/ip-address/${result.ip}/information`,
                              '_blank'
                            );
                          }}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          VirusTotal
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            window.open(`https://dnschecker.org/#A/0/${result.ip}`, '_blank');
                          }}
                        >
                          <Network className="mr-2 h-4 w-4" />
                          DNS Checker
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">IP Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="rounded bg-muted p-2">
                          <div className="mb-1 flex justify-between">
                            <span>IP Type:</span>
                            <Badge variant={result.proxy ? 'destructive' : 'secondary'}>
                              {result.proxy ? 'Proxy' : result.hosting ? 'Hosting' : 'Residential'}
                            </Badge>
                          </div>
                          <div className="mb-1 flex justify-between">
                            <span>Privacy:</span>
                            <span className="font-medium">{result.proxy ? 'Low' : 'High'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Location Type:</span>
                            <span>{result.hosting ? 'Data Center' : 'Consumer'}</span>
                          </div>
                        </div>

                        <div className="text-muted-foreground text-xs">
                          <Clock className="mr-1 inline-block h-3 w-3" />
                          Data cached for 5 minutes • Total cache: {cacheRef.current.size} items
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {/* MagnifyingGlass History Summary */}
            {searchHistory.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-sm">Summary</Label>
                  <Button variant="outline" size="sm" onClick={downloadAsCSV}>
                    <DownloadSimple className="mr-2 h-4 w-4" />
                    Export All
                  </Button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="font-bold text-2xl">{searchHistory.length}</div>
                    <div className="text-muted-foreground text-xs">Total Lookups</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl">
                      {searchHistory.filter((item) => item.proxy).length}
                    </div>
                    <div className="text-muted-foreground text-xs">Proxy IPs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl">
                      {searchHistory.filter((item) => item.hosting).length}
                    </div>
                    <div className="text-muted-foreground text-xs">Hosting IPs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl">
                      {(
                        searchHistory.reduce((sum, item) => sum + item.responseTime, 0) /
                        searchHistory.length
                      ).toFixed(0)}
                    </div>
                    <div className="text-muted-foreground text-xs">Avg Response</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
