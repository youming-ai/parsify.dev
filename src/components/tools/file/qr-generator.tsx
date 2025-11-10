/**
 * QR Code Generator Component
 * Generate QR codes for URLs, text, WiFi, and other data types
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  QrCode,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Smartphone,
  Wifi,
  Link,
  Mail,
  MapPin,
  Calendar,
  RefreshCw,
  Settings,
  Share2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface QRCodeData {
  type: 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'location' | 'event' | 'vcard' | 'custom';
  content: string;
  options: QRCodeOptions;
}

interface QRCodeOptions {
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  color: string;
  backgroundColor: string;
  includeLogo: boolean;
  logoText?: string;
  format: 'png' | 'svg' | 'jpeg';
}

interface QRCodeResult {
  dataUrl: string;
  size: number;
  format: string;
  type: QRCodeData['type'];
  content: string;
  options: QRCodeOptions;
  processingTime: number;
}

interface WiFiCredentials {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
  address: string;
  note: string;
}

export function QRCodeGenerator({ className }: { className?: string }) {
  const [qrType, setQrType] = useState<QRCodeData['type']>('url');
  const [content, setContent] = useState('https://parsify.dev');
  const [qrResult, setQrResult] = useState<QRCodeResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  const [options, setOptions] = useState<QRCodeOptions>({
    size: 256,
    errorCorrectionLevel: 'M',
    margin: 4,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    includeLogo: false,
    format: 'png'
  });

  const [wifiCredentials, setWifiCredentials] = useState<WiFiCredentials>({
    ssid: '',
    password: '',
    encryption: 'WPA',
    hidden: false
  });

  const [vCardData, setVCardData] = useState<VCardData>({
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    phone: '',
    email: '',
    url: '',
    address: '',
    note: ''
  });

  // Initialize session
  useEffect(() => {
    const session = createSession('qr-generator', {
      qrType,
      content,
      options,
      wifiCredentials,
      vCardData
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Generate QR code
  const generateQRCode = useCallback(async () => {
    if (!content.trim()) return;

    setIsProcessing(true);
    const startTime = Date.now();

    try {
      let qrContent = content;

      // Format content based on type
      switch (qrType) {
        case 'wifi':
          const wifiString = `WIFI:T:${wifiCredentials.encryption};S:${wifiCredentials.ssid};P:${wifiCredentials.password};;${wifiCredentials.hidden ? 'H:true' : ''};;`;
          qrContent = wifiString;
          break;

        case 'email':
          qrContent = `mailto:${content}`;
          break;

        case 'phone':
          qrContent = `tel:${content}`;
          break;

        case 'sms':
          qrContent = `sms:${content}`;
          break;

        case 'location':
          // Format: geo:latitude,longitude
          qrContent = content;
          break;

        case 'vcard':
          const vCardString = `BEGIN:VCARD
VERSION:3.0
FN:${vCardData.firstName} ${vCardData.lastName}
ORG:${vCardData.organization}
TITLE:${vCardData.title}
TEL:${vCardData.phone}
EMAIL:${vCardData.email}
URL:${vCardData.url}
ADR:;;${vCardData.address}
NOTE:${vCardData.note}
END:VCARD`;
          qrContent = vCardString;
          break;

        case 'url':
          qrContent = content.startsWith('http') ? content : `https://${content}`;
          break;

        case 'text':
          qrContent = content;
          break;
      }

      // Generate QR code using qrcode.js library
      const QRCode = await import('qrcode');

      const qrOptions = {
        width: options.size,
        margin: options.margin,
        color: {
          dark: options.color,
          light: options.backgroundColor
        },
        errorCorrectionLevel: options.errorCorrectionLevel
      };

      const dataUrl = await QRCode.toDataURL(qrContent, qrOptions);
      const processingTime = Date.now() - startTime;

      const result: QRCodeResult = {
        dataUrl,
        size: options.size,
        format: options.format,
        type: qrType,
        content,
        options: { ...options },
        processingTime
      };

      setQrResult(result);
      toast.success('QR code generated successfully!');

      if (sessionId) {
        updateSession(sessionId, {
          results: {
            dataUrl,
            size: result.size,
            format: result.format,
            type: result.type,
            content: result.content
          },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'generate', true);
      }

    } catch (error) {
      toast.error('Failed to generate QR code');
      if (sessionId) addToHistory(sessionId, 'generate', false);
    } finally {
      setIsProcessing(false);
    }
  }, [content, qrType, options, wifiCredentials, vCardData, sessionId]);

  // Download QR code
  const downloadQRCode = useCallback(() => {
    if (!qrResult) return;

    const link = document.createElement('a');
    link.href = qrResult.dataUrl;
    link.download = `qrcode.${qrResult.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('QR code downloaded');

    if (sessionId) {
      addToHistory(sessionId, 'download', true);
    }
  }, [qrResult, sessionId]);

  // Copy QR code to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!qrResult) return;

    try {
      const blob = await (await fetch(qrResult.dataUrl)).blob();
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([clipboardItem]);
      toast.success('QR code copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy QR code');
    }
  }, [qrResult]);

  // Reset form
  const reset = useCallback(() => {
    setContent('');
    setQrResult(null);
    setWifiCredentials({
      ssid: '',
      password: '',
      encryption: 'WPA',
      hidden: false
    });
    setVCardData({
      firstName: '',
      lastName: '',
      organization: '',
      title: '',
      phone: '',
      email: '',
      url: '',
      address: '',
      note: ''
    });
  }, []);

  // Load sample data
  const loadSample = useCallback(() => {
    const samples = {
      url: 'https://parsify.dev',
      text: 'Hello, this is a sample QR code!',
      wifi: {
        ssid: 'ParsifyDev',
        password: 'password123',
        encryption: 'WPA',
        hidden: false
      },
      email: 'hello@parsify.dev',
      phone: '+1234567890',
      vcard: {
        firstName: 'John',
        lastName: 'Doe',
        organization: 'Parsify.dev',
        title: 'Developer',
        phone: '+1234567890',
        email: 'john@parsify.dev',
        url: 'https://parsify.dev',
        address: '123 Main St, City, State 12345',
        note: 'Software Developer'
      }
    };

    if (qrType === 'wifi') {
      setWifiCredentials(samples.wifi as WiFiCredentials);
    } else if (qrType === 'vcard') {
      setVCardData(samples.vcard);
    } else {
      setContent(samples[qrType as keyof typeof samples] || samples.text);
    }
  }, [qrType]);

  // Handle content change based on type
  const handleContentChange = useCallback((value: string) => {
    setContent(value);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { content, qrType, options, wifiCredentials, vCardData },
        lastActivity: new Date()
      });
    }
  }, [sessionId, qrType, options, wifiCredentials, vCardData]);

  // Format size for display
  const formatSize = (size: number): string => {
    return `${size}x${size}px`;
  };

  // Error correction level descriptions
  const getErrorCorrectionDescription = (level: string): string => {
    const descriptions = {
      'L': 'Low (7% error correction)',
      'M': 'Medium (15% error correction)',
      'Q': 'High (25% error correction)',
      'H': 'Highest (30% error correction)'
    };
    return descriptions[level as keyof typeof descriptions] || 'Medium (15% error correction)';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <QrCode className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">QR Code Generator</h1>
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

      {/* QR Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <FileText className=\"h-5 w-5 mr-2\" />
            QR Code Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className=\"space-y-4\">
            <div className=\"flex items-center space-x-4\">
              <Label htmlFor=\"qr-type\">Type:</Label>
              <Select value={qrType} onValueChange={(value: QRCodeData['type']) => setQrType(value)}>
                <SelectTrigger className=\"w-48\">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"url\">URL / Link</SelectItem>
                  <SelectItem value=\"text\">Plain Text</SelectItem>
                  <SelectItem value=\"wifi\">WiFi Network</SelectItem>
                  <SelectItem value=\"email\">Email</SelectItem>
                  <SelectItem value=\"phone\">Phone Number</SelectItem>
                  <SelectItem value=\"sms\">SMS Message</SelectItem>
                  <SelectItem value=\"location\">Location</SelectItem>
                  <SelectItem value=\"event\">Event</SelectItem>
                  <SelectItem value=\"vcard\">vCard Contact</SelectItem>
                  <SelectItem value=\"custom\">Custom Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type-specific inputs */}
            {qrType === 'url' && (
              <div className=\"space-y-2\">
                <Label htmlFor=\"url\">URL:</Label>
                <Input
                  id=\"url\"
                  type=\"url\"
                  placeholder=\"https://example.com\"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                />
              </div>
            )}

            {qrType === 'text' && (
              <div className=\"space-y-2\">
                <Label htmlFor=\"text\">Text:</Label>
                <Textarea
                  id=\"text\"
                  placeholder=\"Enter your text here...\"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {qrType === 'wifi' && (
              <div className=\"space-y-4\">
                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"ssid\">Network Name (SSID):</Label>
                    <Input
                      id=\"ssid\"
                      placeholder=\"MyWiFiNetwork\"
                      value={wifiCredentials.ssid}
                      onChange={(e) => setWifiCredentials(prev => ({ ...prev, ssid: e.target.value }))}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"password\">Password:</Label>
                    <Input
                      id=\"password\"
                      type=\"password\"
                      placeholder=\"Enter password\"
                      value={wifiCredentials.password}
                      onChange={(e) => setWifiCredentials(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"encryption\">Encryption:</Label>
                    <Select
                      value={wifiCredentials.encryption}
                      onValueChange={(value: 'WPA' | 'WEP' | 'nopass') =>
                        setWifiCredentials(prev => ({ ...prev, encryption: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=\"WPA\">WPA/WPA2/WPA3</SelectItem>
                        <SelectItem value=\"WEP\">WEP</SelectItem>
                        <SelectItem value=\"nopass\">No Password</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className=\"flex items-center space-x-2\">
                    <input
                      type=\"checkbox\"
                      id=\"hidden\"
                      checked={wifiCredentials.hidden}
                      onChange={(e) => setWifiCredentials(prev => ({ ...prev, hidden: e.target.checked }))}
                      className=\"rounded\"
                    />
                    <Label htmlFor=\"hidden\">Hidden Network</Label>
                  </div>
                </div>
                {/* WiFi preview */}
                <div className=\"text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg\">
                  <div className=\"font-mono\">WIFI:T:{wifiCredentials.encryption};S:{wifiCredentials.ssid};P:{wifiCredentials.password};;{wifiCredentials.hidden ? 'H:true' : ''};;</div>
                </div>
              </div>
            )}

            {qrType === 'email' && (
              <div className=\"space-y-2\">
                <Label htmlFor=\"email\">Email Address:</Label>
                <Input
                  id=\"email\"
                  type=\"email\"
                  placeholder=\"example@email.com\"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                />
              </div>
            )}

            {qrType === 'phone' && (
              <div className=\"space-y-2\">
                <Label htmlFor=\"phone\">Phone Number:</Label>
                <Input
                  id=\"phone\"
                  type=\"tel\"
                  placeholder=\"+1234567890\"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                />
              </div>
            )}

            {qrType === 'sms' && (
              <div className=\"space-y-2\">
                <Label htmlFor=\"sms\">SMS Message:</Label>
                <Textarea
                  id=\"sms\"
                  placeholder=\"Enter SMS message here...\"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {qrType === 'location' && (
              <div className=\"space-y-2\">
                <Label htmlFor=\"location\">Location (geo:lat,lon):</Label>
                <Input
                  id=\"location\"
                  placeholder=\"40.7128,-74.0060\"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                />
                <div className=\"text-sm text-muted-foreground\">
                  Format: geo:latitude,longitude
                </div>
              </div>
            )}

            {qrType === 'vcard' && (
              <div className=\"space-y-4\">
                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"firstName\">First Name:</Label>
                    <Input
                      id=\"firstName\"
                      placeholder=\"John\"
                      value={vCardData.firstName}
                      onChange={(e) => setVCardData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"lastName\">Last Name:</Label>
                    <Input
                      id=\"lastName\"
                      placeholder=\"Doe\"
                      value={vCardData.lastName}
                      onChange={(e) => setVCardData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"organization\">Organization:</Label>
                    <Input
                      id=\"organization\"
                      placeholder=\"Company Name\"
                      value={vCardData.organization}
                      onChange={(e) => setVCardData(prev => ({ ...prev, organization: e.target.value }))}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"title\">Title:</Label>
                    <Input
                      id=\"title\"
                      placeholder=\"Software Engineer\"
                      value={vCardData.title}
                      onChange={(e) => setVCardData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                </div>
                <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"vcard-phone\">Phone:</Label>
                    <Input
                      id=\"vcard-phone\"
                      type=\"tel\"
                      placeholder=\"+1234567890\"
                      value={vCardData.phone}
                      onChange={(e) => setVCardData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className=\"space-y-2\">
                    <Label htmlFor=\"vcard-email\">Email:</Label>
                    <Input
                      id=\"vcard-email\"
                      type=\"email\"
                      placeholder=\"john@example.com\"
                      value={vCardData.email}
                      onChange={(e) => setVCardData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className=\"space-y-2\">
                  <Label htmlFor=\"vcard-url\">Website:</Label>
                  <Input
                    id=\"vcard-url\"
                    type=\"url\"
                    placeholder=\"https://example.com\"
                    value={vCardData.url}
                    onChange={(e) => setVCardData(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <div className=\"space-y-2\">
                  <Label htmlFor=\"address\">Address:</Label>
                  <Input
                    id=\"address\"
                    placeholder=\"123 Main St, City, State 12345\"
                    value={vCardData.address}
                    onChange={(e) => setVCardData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div className=\"space-y-2\">
                  <Label htmlFor=\"note\">Note:</Label>
                  <Textarea
                    id=\"note\"
                    placeholder=\"Additional notes...\"
                    value={vCardData.note}
                    onChange={(e) => setVCardData(prev => ({ ...prev, note: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            )}

            {qrType === 'event' && (
              <div className=\"space-y-2\">
                <Label htmlFor=\"event\">Event Details:</Label>
                <Textarea
                  id=\"event\"
                  placeholder=\"BEGIN:VEVENT\\nSUMMARY:Meeting\\nDTSTART:20250115T100000Z\\nDTEND:20250115T110000Z\\nLOCATION:Office\\nEND:VEVENT\"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={5}
                />
                <div className=\"text-sm text-muted-foreground\">
                  Use vEvent or iCalendar format for events
                </div>
              </div>
            )}

            {qrType === 'custom' && (
              <div className=\"space-y-2\">
                <Label htmlFor=\"custom\">Custom Data:</Label>
                <Textarea
                  id=\"custom\"
                  placeholder=\"Enter custom data in any format...\"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* Generate Button */}
            <div className=\"flex items-center space-x-4\">
              <Button
                onClick={generateQRCode}
                disabled={isProcessing || !content.trim()}
                className=\"flex items-center space-x-2\"
              >
                <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Generating...' : 'Generate QR Code'}</span>
              </Button>

              {qrResult && (
                <>
                  <Button
                    variant=\"outline\"
                    onClick={copyToClipboard}
                  >
                    <Copy className=\"h-4 w-4 mr-2\" />
                    Copy
                  </Button>

                  <Button
                    variant=\"outline\"
                    onClick={downloadQRCode}
                  >
                    <Download className=\"h-4 w-4 mr-2\" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Options */}
      <Card>
        <CardHeader>
          <CardTitle className=\"flex items-center\">
            <Settings className=\"h-5 w-5 mr-2\" />
            QR Code Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue=\"basic\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-3\">
              <TabsTrigger value=\"basic\">Basic</TabsTrigger>
              <TabsTrigger value=\"appearance\">Appearance</TabsTrigger>
              <TabsTrigger value=\"advanced\">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value=\"basic\" className=\"space-y-4 mt-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"size\">Size: {formatSize(options.size)}</Label>
                  <Slider
                    id=\"size\"
                    value={[options.size]}
                    onValueChange={(value) => setOptions(prev => ({ ...prev, size: value[0] }))}
                    max={512}
                    min={128}
                    step={32}
                    className=\"w-full\"
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"error-correction\">Error Correction: {options.errorCorrectionLevel}</Label>
                  <Select
                    value={options.errorCorrectionLevel}
                    onValueChange={(value: 'L' | 'M' | 'Q' | 'H') =>
                      setOptions(prev => ({ ...prev, errorCorrectionLevel: value }))
                    }
                  >
                    <SelectTrigger className=\"w-full\">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"L\">L (7%) - Low</SelectItem>
                      <SelectItem value=\"M\">M (15%) - Medium</SelectItem>
                      <SelectItem value=\"Q\">Q (25%) - High</SelectItem>
                      <SelectItem value=\"H\">H (30%) - Highest</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className=\"text-xs text-muted-foreground mt-1\">
                    {getErrorCorrectionDescription(options.errorCorrectionLevel)}
                  </div>
                </div>
              </div>

              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"margin\">Margin: {options.margin}px</Label>
                  <Slider
                    id=\"margin\"
                    value={[options.margin]}
                    onValueChange={(value) => setOptions(prev => ({ ...prev, margin: value[0] }))}
                    max={10}
                    min={0}
                    step={1}
                    className=\"w-full\"
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"format\">Format:</Label>
                  <Select
                    value={options.format}
                    onValueChange={(value: 'png' | 'svg' | 'jpeg') =>
                      setOptions(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger className=\"w-full\">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"png\">PNG</SelectItem>
                      <SelectItem value=\"svg\">SVG</SelectItem>
                      <SelectItem value=\"jpeg\">JPEG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value=\"appearance\" className=\"space-y-4 mt-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
                <div className=\"space-y-2\">
                  <Label htmlFor=\"qr-color\">QR Color:</Label>
                  <Input
                    id=\"qr-color\"
                    type=\"color\"
                    value={options.color}
                    onChange={(e) => setOptions(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label htmlFor=\"bg-color\">Background Color:</Label>
                  <Input
                    id=\"bg-color\"
                    type=\"color\"
                    value={options.backgroundColor}
                    onChange={(e) => setOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                  />
                </div>

                <div className=\"flex items-center space-x-2 pt-6\">
                  <Switch
                    id=\"include-logo\"
                    checked={options.includeLogo}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLogo: checked }))}
                  />
                  <Label htmlFor=\"include-logo\">Include Logo</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value=\"advanced\" className=\"space-y-4 mt-4\">
              <div className=\"text-sm text-muted-foreground\">
                <p>Advanced options coming soon:</p>
                <ul className=\"list-disc list-inside mt-2 space-y-1\">
                  <li>Logo upload and positioning</li>
                  <li>Custom patterns and templates</li>
                  <li>Batch QR generation</li>
                  <li>Custom SVG patterns</li>
                  <li>Analytics tracking</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* QR Code Result */}
      {qrResult && (
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <QrCode className=\"h-5 w-5 mr-2\" />
                Generated QR Code
              </div>
              <div className=\"flex items-center space-x-2\">
                <Badge variant=\"outline\">
                  {qrResult.type.charAt(0).toUpperCase() + qrResult.type.slice(1)}
                </Badge>
                <Badge variant=\"outline\">
                  {formatSize(qrResult.size)}
                </Badge>
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={() => {/* Toggle preview */}}
                >
                  {qrResult.dataUrl ? <EyeOff className=\"h-4 w-4\" /> : <Eye className=\"h-4 w-4\" />}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"flex justify-center mb-4\">
              <img
                src={qrResult.dataUrl}
                alt=\"Generated QR Code\"
                className=\"max-w-full h-auto\"
                style={{ maxHeight: '400px' }}
              />
            </div>

            <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 text-center\">
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {qrResult.type.charAt(0).toUpperCase() + qrResult.type.slice(1)}
                </div>
                <div className=\"text-xs text-muted-foreground\">Type</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {formatSize(qrResult.size)}
                </div>
                <div className=\"text-xs text-muted-foreground\">Size</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {qrResult.format.toUpperCase()}
                </div>
                <div className=\"text-xs text-muted-foreground\">Format</div>
              </div>
              <div>
                <div className=\"text-lg font-bold text-gray-600\">
                  {qrResult.processingTime}ms
                </div>
                <div className=\"text-xs text-muted-foreground\">Processing Time</div>
              </div>
            </div>

            <div className=\"pt-4 border-t\">
              <div className=\"text-sm text-muted-foreground mb-2\">
                <div className=\"font-medium\">Content Preview:</div>
                <div className=\"font-mono text-xs bg-muted/50 p-2 rounded break-all\">
                  {qrResult.content.length > 100
                    ? qrResult.content.substring(0, 100) + '...'
                    : qrResult.content
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
