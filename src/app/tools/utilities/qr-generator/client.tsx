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
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Copy,
  Download,
  Link,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  RefreshCw,
  Smartphone,
  User,
  Wifi,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useState } from 'react';

export default function QRGeneratorClient() {
  const [qrType, setQrType] = useState('url');
  const [qrContent, setQrContent] = useState('');
  const [qrSize, setQrSize] = useState([300]);
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg'>('png');
  const [copied, setCopied] = useState(false);

  // Form specific states
  const [wifiSettings, setWifiSettings] = useState({
    ssid: '',
    password: '',
    encryption: 'WPA',
  });
  const [contactSettings, setContactSettings] = useState({
    name: '',
    phone: '',
    email: '',
    organization: '',
    url: '',
  });

  const generateQRCode = async () => {
    if (!qrContent && qrType !== 'wifi' && qrType !== 'contact') {
      return;
    }

    setIsGenerating(true);
    try {
      let dataToEncode = '';

      switch (qrType) {
        case 'url':
          dataToEncode = qrContent;
          if (dataToEncode && !dataToEncode.match(/^https?:\/\//)) {
            dataToEncode = `https://${dataToEncode}`;
          }
          break;
        case 'text':
          dataToEncode = qrContent;
          break;
        case 'email':
          dataToEncode = `mailto:${qrContent}`;
          break;
        case 'phone':
          dataToEncode = `tel:${qrContent}`;
          break;
        case 'sms':
          dataToEncode = `sms:${qrContent}`;
          break;
        case 'wifi':
          dataToEncode = `WIFI:T:${wifiSettings.encryption};S:${wifiSettings.ssid};P:${wifiSettings.password};;`;
          break;
        case 'contact': {
          const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contactSettings.name}
TEL:${contactSettings.phone}
EMAIL:${contactSettings.email}
ORG:${contactSettings.organization}
URL:${contactSettings.url}
END:VCARD`;
          dataToEncode = vcard.replace(/^\s+|\s+$/gm, ''); // Remove extra whitespace
          break;
        }
        default:
          dataToEncode = qrContent;
      }

      if (!dataToEncode) {
        setIsGenerating(false);
        return;
      }

      // Generate QR Code with specified options
      const options = {
        width: qrSize[0],
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: errorCorrection,
      };

      if (downloadFormat === 'svg') {
        const svgData = await QRCode.toString(dataToEncode, {
          ...options,
          type: 'svg',
        });
        setQrDataUrl(`data:image/svg+xml;base64,${btoa(svgData)}`);
      } else {
        const dataUrl = await QRCode.toDataURL(dataToEncode, options);
        setQrDataUrl(dataUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `qrcode-${qrType}-${Date.now()}.${downloadFormat}`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    if (!qrDataUrl) return;

    try {
      // For images, we need to convert to blob first
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy QR code:', error);
    }
  };

  const getQRTypeIcon = (type: string) => {
    switch (type) {
      case 'url':
      case 'link':
        return Link;
      case 'wifi':
        return Wifi;
      case 'email':
        return Mail;
      case 'phone':
      case 'sms':
        return Phone;
      case 'contact':
        return User;
      case 'location':
        return MapPin;
      default:
        return MessageSquare;
    }
  };

  const getErrorCorrectionDescription = (level: string) => {
    switch (level) {
      case 'L':
        return 'Low - ~7% error correction';
      case 'M':
        return 'Medium - ~15% error correction';
      case 'Q':
        return 'Quartile - ~25% error correction';
      case 'H':
        return 'High - ~30% error correction';
      default:
        return '';
    }
  };

  const QRTypeIcon = getQRTypeIcon(qrType);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QRTypeIcon className="h-5 w-5" />
            QR Code Configuration
          </CardTitle>
          <CardDescription>Set up your QR code content and appearance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>QR Code Type</Label>
            <Select value={qrType} onValueChange={setQrType}>
              <SelectTrigger>
                <SelectValue placeholder="Select QR code type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">🔗 URL/Website</SelectItem>
                <SelectItem value="text">📝 Plain Text</SelectItem>
                <SelectItem value="email">📧 Email Address</SelectItem>
                <SelectItem value="phone">📱 Phone Number</SelectItem>
                <SelectItem value="sms">💬 SMS Message</SelectItem>
                <SelectItem value="wifi">📶 WiFi Credentials</SelectItem>
                <SelectItem value="contact">👤 Contact Card (vCard)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={qrType} className="w-full">
            <TabsContent value="url" className="space-y-2">
              <Label>Website URL</Label>
              <Input
                placeholder="https://example.com"
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="text" className="space-y-2">
              <Label>Text Content</Label>
              <Textarea
                placeholder="Enter your text here..."
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
                rows={3}
              />
            </TabsContent>

            <TabsContent value="email" className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="phone" className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+1234567890"
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="sms" className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+1234567890"
                value={qrContent}
                onChange={(e) => setQrContent(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="wifi" className="space-y-3">
              <div>
                <Label>Network Name (SSID)</Label>
                <Input
                  placeholder="MyWiFiNetwork"
                  value={wifiSettings.ssid}
                  onChange={(e) => setWifiSettings({ ...wifiSettings, ssid: e.target.value })}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="password123"
                  value={wifiSettings.password}
                  onChange={(e) => setWifiSettings({ ...wifiSettings, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Security Type</Label>
                <Select
                  value={wifiSettings.encryption}
                  onValueChange={(value) => setWifiSettings({ ...wifiSettings, encryption: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WPA">WPA/WPA2</SelectItem>
                    <SelectItem value="WEP">WEP</SelectItem>
                    <SelectItem value="nopass">No Password</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-3">
              <div>
                <Label>Full Name</Label>
                <Input
                  placeholder="John Doe"
                  value={contactSettings.name}
                  onChange={(e) => setContactSettings({ ...contactSettings, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  placeholder="+1234567890"
                  value={contactSettings.phone}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={contactSettings.email}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Organization</Label>
                <Input
                  placeholder="Company Inc."
                  value={contactSettings.organization}
                  onChange={(e) =>
                    setContactSettings({ ...contactSettings, organization: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  placeholder="https://example.com"
                  value={contactSettings.url}
                  onChange={(e) => setContactSettings({ ...contactSettings, url: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label>Size: {qrSize[0]}px</Label>
            <Slider
              value={qrSize}
              onValueChange={setQrSize}
              max={500}
              min={100}
              step={10}
              className="w-full"
            />
            <p className="text-muted-foreground text-xs">Adjust QR code size from 100px to 500px</p>
          </div>

          <div className="space-y-2">
            <Label>Error Correction Level</Label>
            <Select
              value={errorCorrection}
              onValueChange={(value: 'L' | 'M' | 'Q' | 'H') => setErrorCorrection(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Low (L)</SelectItem>
                <SelectItem value="M">Medium (M)</SelectItem>
                <SelectItem value="Q">Quartile (Q)</SelectItem>
                <SelectItem value="H">High (H)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {getErrorCorrectionDescription(errorCorrection)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Download Format</Label>
            <Select
              value={downloadFormat}
              onValueChange={(value: 'png' | 'svg') => setDownloadFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Raster)</SelectItem>
                <SelectItem value="svg">SVG (Vector)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateQRCode} disabled={isGenerating} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate QR Code'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>QR Code Preview</span>
            {qrDataUrl && <Badge variant="secondary">{qrSize[0]}px</Badge>}
          </CardTitle>
          <CardDescription>Preview and download your generated QR code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrDataUrl ? (
            <>
              <div className="flex justify-center rounded-lg bg-muted p-6">
                <img
                  src={qrDataUrl}
                  alt="Generated QR Code"
                  className="h-auto max-w-full"
                  style={{ maxHeight: '400px' }}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadQRCode} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download {downloadFormat.toUpperCase()}
                </Button>
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  Test your QR code with a mobile device to ensure it scans correctly.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <QrCode className="mx-auto mb-4 h-16 w-16 opacity-50" />
              <p>Configure your QR code and click "Generate QR Code" to see the preview</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
