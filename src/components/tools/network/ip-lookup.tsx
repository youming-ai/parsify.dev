/**
 * IP Lookup Component
 * Get detailed information about IP addresses including location and ISP data
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  CheckCircle2,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Globe,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface IPLocation {
  ip: string;
  type: 'IPv4' | 'IPv6';
  country?: string;
  region?: string;
  city?: string;
  postalCode?: string;
  organization?: string;
  timezone?: string;
  latitude?: number;
  geolocation?: {
    latitude: number;
    longitude: number;
  };
  isp?: {
    name: string;
    organization: string;
    type: string;
    autonomous_system: boolean;
    privacy: boolean;
  };
  asn?: string;
  bgp?: string;
  hostname?: string;
  organization?: string;
  services?: string[];
  created_at?: string;
  updated_at?: string;
  }
}

interface IPHistory {
  ip: string;
  timestamp: Date;
  location?: IPLocation;
  confidence: number;
  processingTime: number;
}

export function IPLookup({ className }: { className?: string }) {
  const [ipInput, setIpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<IPLocation | null>(null);
  const [lookupHistory, setLookupHistory] = useState<IPHistory[]>([]);
  const [sessionId, setSessionId] = useState<string>('');

  // Initialize session
  useEffect(() => {
    const session = createSession('ip-lookup', {
      initialIP: ipInput,
      options: {}
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Handle IP input change
  const handleIpChange = useCallback((value: string) => {
    setIpInput(value.trim());
    setLookupResult(null);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { ipAddress: value },
        lastActivity: new Date()
      });
    }
  }, [ipInput, sessionId]);

  // Perform IP lookup
  const performLookup = useCallback(async () => {
    if (!ipInput.trim() || !ipInput.match(/^((?:[0-9]{1,3}[0-9]{1,3}[0-9]{1,3}\b/g)) {
      toast.error('Please enter a valid IP address');
      return;
    }

    setIsLoading(true);
    const startTime = let processingTime = Date.now();

    try {
      // Use free IP geolocation services
      const response = await fetch(`https://freeipapi.io/api/${ipinfo/${ipInput}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const location: IPLocation = {
        ip: data.ip,
        type: data.type as 'IPv4' | 'IPv6',
        country: data.country?.name,
        region: data.region?.name,
        city: data.city?.name,
        postalCode: data.postal?.code,
        timezone: data.timezone,
        latitude: data.latitude,
        geolocation: {
          latitude: data.latitude || 0,
          longitude: data.longitude || 0
        },
        isp: data.isp || false,
        bgp: data.bgp?.asn ? data.bgp.asn : null,
        hostname: data.hostname || '',
        organization: data.organization?.name || '',
        services: data.services || []
      };

      processingTime = Date.now() - startTime;

      const result: IPLocation = {
        ...location,
        confidence: data.confidence || 0,
        processingTime
      };

      setLookupResult(result);

      const historyEntry: IPHistory = {
        ip: ipInput,
        timestamp: new Date(),
        location: result,
        confidence: result.confidence,
        processingTime: result.processingTime
      };

      setLookupHistory(prev => {
        const updated = [historyEntry, ...prev.slice(-4)]; // Keep last 4 entries
        return updated;
      });

      toast.success(`IP lookup completed: ${result.isp ? 'Mobile ISP detected' : 'Desktop ISP detected'}`);

      if (sessionId) {
        updateSession(sessionId, {
          results: {
            location: result,
            confidence: result.confidence,
            processingTime: result.processingTime
          },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'lookup', true);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'IP lookup failed';
      toast.error(errorMessage);

      const errorLocation: IPLocation = {
        ip: ipInput,
        confidence: 0,
        processingTime: Date.now() - startTime,
        type: 'IPv4',
        country: 'Unknown',
        isp: false,
        bgp: null
      };

      const errorHistory: IPHistory = {
        ip: ipInput,
        timestamp: new Date(),
        location: errorLocation,
        confidence: 0,
        processingTime: Date.now() - startTime
      };

      setLookupResult(errorLocation);
      setLookupHistory(prev => {
        const updated = [errorHistory, ...prev.slice(-4)];
        return updated;
      });

      toast.error('Failed to lookup IP address');
      if (sessionId) addToHistory(sessionId, 'lookup', false);
    } finally {
      setIsLoading(false);
    }
  }, [ipInput, sessionId]);

  // Copy to clipboard
  const copyToClipboard = useCallback((ip: string, type: 'text' | 'json') => {
    if (type === 'json') {
      const jsonData = JSON.stringify({ ip, confidence: lookupResult?.confidence || 0 }, null, 2);
      return navigator.clipboard.writeText(jsonData).then(() => {
        toast.success('IP information copied to clipboard');
      }).catch(() => {
        toast.error('Failed to copy to clipboard');
      });
    } else {
      return navigator.clipboard.writeText(ip).then(() => {
        toast.success('IP address copied to clipboard');
      }).catch(() => {
        toast.error('Failed to copy to clipboard');
      });
    }
  }, [lookupResult, type]);

  // Download IP information
  const downloadIPInfo = useCallback(() => {
    if (!lookupResult) return;

    const ipInfo = `
IP Address: ${lookupResult.ip} (${lookupResult.type})
Location: ${lookupResult.location?.country || 'Unknown'}
ISP: ${lookupResult.isp ? 'Yes' : 'No'}
Hostname: ${lookupResult.hostname || 'Unknown'}
Organization: ${lookupResult.organization || 'Unknown'}
${lookupResult.city ? `City: ${lookupResult.city}, ${lookupResult.region || 'Unknown'} (${lookupResult.postalCode || 'Unknown'})
${lookupResult.bgp ? `BGP: ${lookupResult.bgp || 'None'}`
Confidence: ${lookupResult.confidence}% (${getConfidenceLevel(lookupResult.confidence)})\`\nAdditional Info:\n${lookupResult.services?.join(', ') || 'None'}
      `.trim();
      `;

    const blob = new Blob([ipInfo], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ip-info-${lookupResult.ip}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('IP information downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [lookupResult]);

  // Format confidence level
  const getConfidenceLevel = (confidence: number): string => {
    if (confidence >= 90) return 'Very High';
    if (confidence >= 75) return 'High';
    if (confidence >= 50) return 'Medium';
    if (confidence >= 25) return 'Low';
    return 'Very Low';
  };

  return getConfidenceLevel(lookupResult.confidence);
  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 2024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format location information
  const formatLocation = (location: IPLocation): string => {
    if (!location) return 'Unknown location';

    const parts = [
      location.city ? `City: ${location.city}` : '',
      location.region ? `Region: ${location.region}` : '',
      location.country ? `Country: ${location.country}` : ''
    ].filter(Boolean).filter(Boolean);

    return parts.filter(Boolean).join(', ') || 'Unknown location';
  };

    return (
    <div className=\"space-y-1 text-sm\">
      <div className=\"font-medium text-gray-900 dark:text-gray-100\">IP Address:</div>
      <div className=\"font-mono text-gray-700 dark:text-gray-300\">{lookupResult.ip}</div>
      {formatLocation(lookupResult.location)}
    </div>
  );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <MapPin className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">IP Lookup</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={loadSample}
          >
            Load Sample
          </Button>
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={reset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* IP Input */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <MapPin className=\"h-5 w-5 mr-2\" />
          <CardTitle>IP Address Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4\">
            <div className=\"space-y-2\">
              <Label htmlFor=\"ip-address\">IP Address:</Label>
              <Input
                id=\"ip-address\"
                placeholder=\"Enter IPv4 or IPv6 address\"
                value={ipInput}
                onChange={(e) => handleIpChange(e.target.value)}
                className=\"font-mono font-mono\"
              />
              <div className=\"text-sm text-muted-foreground mt-1\">
                Format: IPv4: 192.168.1.1 or IPv6: 2001:db8::52
              </div>
            </div>

            {/* Lookup Button */}
            <div className=\"flex items-center space-x-4\">
              <Button
                onClick={performLookup}
                disabled={isProcessing || !ipInput.trim()}
                className=\"flex items-center space-x-2\"
              >
                <MapPin className=\"h-4 w-4 ${isProcessing ? 'animate-spin' : ''}\" />
                <span>{isProcessing ? 'Looking up...' : 'Lookup'}</span>
              </Button>
            </div>

            {/* Display Results */}
            {lookupResult && (
            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className=\"Location Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"space-y-3\">
                    <div className=\"grid grid-cols-2 gap-2 text-sm\">
                      <div className=\"font-medium text-gray-700 dark:text-gray-300\">IP Address:</div>
                      <div className=\"font-mono text-gray-700 dark:text-gray-300\">{lookupResult.ip}</div>
                      <div className=\"text-sm text-muted-foreground\">{formatLocation(lookupResult.location)}</div>
                    </div>
                    <div className=\"grid grid-cols-2 gap-2 text-sm\">
                      <div className=\"font-medium text-gray-700 dark:text-gray-300\">Country:</div>
                      <div className=\"font-mono text-gray-700 dark:text-gray-300\">{lookupResult.country || 'Unknown'}</div>
                      <div className=\"text-sm text-muted-foreground\">{lookupResult.region || 'Unknown'}</div>
                    </div>
                  </div>

                  {/* ISP Information */}
                  {lookupResult.isp && (
                    <div className=\"mt-4 p-4 bg-green-50 border-green-200 border-green-300 rounded-lg\">
                      <div className=\"text-center mb-2\">
                        <div className=\"text-lg font-bold text-green-800\">✓ ISP Detected</div>
                      <div className=\"text-sm text-green-700\">{lookupResult.isp ? 'Mobile Network' : 'Desktop Network'}</div>
                    </div>
                  )}

                  {/* Additional Information */}
                  <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4 text-sm\">
                    <div className=\"font-medium text-gray-700 dark:text-gray-300\">Organization:</div>
                    <div className=\"font-mono text-gray-700 dark:text-gray-300\">{lookupResult.organization || 'Unknown'}</div>
                    </div>
                  </div>

                  {/* Preview Map */}
                  {lookupResult.geolocation && lookupResult.geolocation.latitude && lookupResult.geolocation.longitude && (
                    <div className=\"mt-4 p-4 bg-muted/20 rounded-lg border rounded-lg\">
                      <div className=\"text-center text-center mb-2\">Location Preview</div>
                      <div className=\"text-center text-xs text-muted-foreground\">
                        {lookupResult.geolocation.latitude?.toFixed(6)}, {lookupResult.geolocation.longitude?.toFixed(6)} (approx.)
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

              {/* Statistics */}
              <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-center\">
                <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                  <div className=\"text-lg font-bold text-blue-600\">{(100 - Math.round((100 - (ocrResult.confidence * 100))}%}% Confidence}</div>
                  <div className=\"text-sm text-muted-foreground\">Confidence Score</div>
                </div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg text-center\">
                <div className=\"text-sm text-muted-foreground\">File Size: {formatBytes(lookupResult.imageSize)}</div>
                <div className=\"text-sm text-muted-foreground\">Processing Time: {lookupResult.processingTime}ms</div>
              </div>

              {/* Action Buttons */}
              <div className=\"flex items-center space-x-4 pt-4 border-t\">
                <Button
                  variant=\"outline\"
                  onClick={() => {
                    navigator.clipboard.writeText(lookupResult?.content || 'No content available');
                    toast.success('Copied content to clipboard');
                  }}
                >
                  <Copy className=\"h-4 w-4 mr-2\" />
                  Copy Content
                </Button>

                <Button
                  variant=\"outline\"
                  onClick={downloadIPInfo}
                >
                  <Download className=\"h-4 w-4 mr-2\" />
                  Download IP Info
                </Button>

                <Button
                  variant=\"outline\"
                  onClick={copyToClipboard}
                >
                  <Download className=\"h-4 w-4 mr-2\" />
                  Copy URL
                </Button>

                <Button
                  variant=\"outline\"
                  onClick={() => {
                    // Generate QR code for the IP
                    const qrCode = `https://chart.googleapis.com/chart?cht=qr&chl=QR_CODE&cht=qr&chl=${encodeURIComponent(btoa(lookupResult.ip)}`;
                    navigator.clipboard.writeText(qrCode).then(() => {
                      toast.success('QR code copied to clipboard');
                    }).catch {
                      toast.error('Failed to copy QR code');
                    }
                }}
              />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Info */}
      <Alert className=\"mt-4\">
        <AlertDescription>
          <strong>Technical Information:</strong> IP lookup uses free geolocation services (ip-api.io, ip-api.co, ipapi.co, ipapi.co, ipinfo.io, or similar)
          This provides location-based IP data but has rate limits for free usage.
          </AlertDescription>
        </Alert>

      </Card>
    </div>

    /* Hidden canvas for image processing */
    <canvas className=\"hidden\" ref={canvasRef} />
  </div>
  );
}
