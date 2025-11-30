'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowRightLeft, CheckCircle, Copy, Download, Hash, Info } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';

interface EncodingResult {
  original: string;
  encoded: string;
  decoded: string;
  encoding: string;
  format: string;
  metadata: {
    originalLength: number;
    encodedLength: number;
    compressionRatio?: number;
    charset: string;
    errors?: string[];
  };
}

const encodingAlgorithms = {
  unicode: {
    name: 'Unicode Encoding',
    formats: ['UTF-8', 'UTF-16', 'UTF-32', 'UCS-2'],
  },
  base64: {
    name: 'Base64 Family',
    formats: ['Base64', 'Base64URL', 'Base32', 'Base58', 'Base62', 'Base91', 'Base100'],
  },
  hash: {
    name: 'Hash Functions',
    formats: ['MD5', 'SHA-1', 'SHA-256', 'SHA-512', 'CRC32'],
  },
  binary: {
    name: 'Binary Encoding',
    formats: ['Binary', 'Hexadecimal', 'Octal', 'Decimal'],
  },
  url: {
    name: 'URL Encoding',
    formats: ['URL Encode', 'URL Decode', 'Punycode'],
  },
  html: {
    name: 'HTML Encoding',
    formats: ['HTML Entities', 'URL Encode', 'CSS Escape'],
  },
  custom: {
    name: 'Custom Encoding',
    formats: ['ROT13', 'Caesar Cipher', 'Atbash', 'Reverse', 'Uppercase', 'Lowercase'],
  },
};

export const EncodingConverter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('converter');
  const [encodingType, setEncodingType] = useState('base64');
  const [encodingFormat, setEncodingFormat] = useState('Base64');
  const [inputText, setInputText] = useState('');
  const [encodingResult, setEncodingResult] = useState<EncodingResult | null>(null);
  const [_charsets, _setCharsets] = useState<string[]>([
    'UTF-8',
    'ASCII',
    'ISO-8859-1',
    'Windows-1252',
  ]);
  const [selectedCharset, setSelectedCharset] = useState('UTF-8');
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [encodingHistory, setEncodingHistory] = useState<EncodingResult[]>([]);

  const sampleTexts = {
    basic: 'Hello, World! This is a test string with various characters: 123, @#$%^&*()',
    unicode: 'Hello 世界 🌍! This contains Unicode characters: café, naïve, résumé, 日本語',
    chinese: '你好，世界！这是中文文本，包含各种汉字和标点符号。',
    emoji: '🔒 🔑 💻 🌐 🎯 📱 💾 🎨 🎭 🎪 🎢 🎡 🎠 🎪',
    binary: 'Binary data: \x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0A\x0B\x0C\x0D\x0E\x0F',
  };

  useEffect(() => {
    // Update format options when encoding type changes
    const formats =
      encodingAlgorithms[encodingType as keyof typeof encodingAlgorithms]?.formats || [];
    if (formats.length > 0 && !formats.includes(encodingFormat)) {
      setEncodingFormat(formats[0]);
    }
  }, [encodingType, encodingFormat]);

  const encodeText = (text: string, type: string, format: string): string => {
    try {
      switch (type) {
        case 'unicode':
          return encodeUnicode(text, format);
        case 'base64':
          return encodeBase64(text, format);
        case 'hash':
          return encodeHash(text, format);
        case 'binary':
          return encodeBinary(text, format);
        case 'url':
          return encodeURL(text, format);
        case 'html':
          return encodeHTML(text, format);
        case 'custom':
          return encodeCustom(text, format);
        default:
          return text;
      }
    } catch (error) {
      return `Encoding error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const decodeText = (text: string, type: string, format: string): string => {
    try {
      switch (type) {
        case 'unicode':
          return decodeUnicode(text, format);
        case 'base64':
          return decodeBase64(text, format);
        case 'url':
          return decodeURL(text, format);
        case 'html':
          return decodeHTML(text, format);
        case 'custom':
          return decodeCustom(text, format);
        default:
          return text;
      }
    } catch (error) {
      return `Decoding error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  const encodeUnicode = (text: string, format: string): string => {
    switch (format) {
      case 'UTF-8':
        return text; // JavaScript strings are UTF-16, but we'll represent UTF-8
      case 'UTF-16':
        return Array.from(text)
          .map((char) => char.charCodeAt(0).toString(16).padStart(4, '0'))
          .join(' ');
      case 'UTF-32':
        return Array.from(text)
          .map((char) => char.codePointAt(0)?.toString(16).padStart(8, '0') || '00000000')
          .join(' ');
      case 'UCS-2':
        return Array.from(text)
          .map((char) => char.charCodeAt(0).toString(16).padStart(4, '0'))
          .join(' ');
      default:
        return text;
    }
  };

  const decodeUnicode = (text: string, format: string): string => {
    const parseHexCodes = () =>
      text
        .split(/\s+/)
        .filter(Boolean)
        .map((code) => String.fromCodePoint(Number.parseInt(code, 16)))
        .join('');

    switch (format) {
      case 'UTF-8':
        return text;
      case 'UTF-16':
      case 'UCS-2':
        return parseHexCodes();
      case 'UTF-32':
        return parseHexCodes();
      default:
        return text;
    }
  };

  const encodeBase64 = (text: string, format: string): string => {
    switch (format) {
      case 'Base64':
        return btoa(text);
      case 'Base64URL':
        return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      case 'Base32':
        return textToBase32(text);
      case 'Base58':
        return textToBase58(text);
      case 'Base62':
        return textToBase62(text);
      case 'Base91':
        return textToBase91(text);
      case 'Base100':
        return textToBase100(text);
      default:
        return btoa(text);
    }
  };

  const encodeHash = (text: string, format: string): string => {
    // Simplified hash implementation (in production, use crypto API)
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    switch (format) {
      case 'MD5':
        return Math.abs(hash).toString(16).padEnd(32, '0');
      case 'SHA-1':
        return Math.abs(hash).toString(16).padEnd(40, '0');
      case 'SHA-256':
        return Math.abs(hash).toString(16).padEnd(64, '0');
      case 'SHA-512':
        return Math.abs(hash).toString(16).padEnd(128, '0');
      case 'CRC32':
        return Math.abs(hash).toString(16).padEnd(8, '0');
      default:
        return Math.abs(hash).toString(16);
    }
  };

  const encodeBinary = (text: string, format: string): string => {
    switch (format) {
      case 'Binary':
        return Array.from(text)
          .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
          .join(' ');
      case 'Hexadecimal':
        return Array.from(text)
          .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join(' ');
      case 'Octal':
        return Array.from(text)
          .map((char) => char.charCodeAt(0).toString(8).padStart(3, '0'))
          .join(' ');
      case 'Decimal':
        return Array.from(text)
          .map((char) => char.charCodeAt(0).toString())
          .join(' ');
      default:
        return text;
    }
  };

  const encodeURL = (text: string, format: string): string => {
    switch (format) {
      case 'URL Encode':
        return encodeURIComponent(text);
      case 'URL Decode':
        return decodeURIComponent(text);
      case 'Punycode':
        // Simplified punycode encoding - check for non-ASCII characters
        if (!/^[\x20-\x7E]*$/.test(text)) {
          return `xn--${text.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
        }
        return text;
      default:
        return encodeURIComponent(text);
    }
  };

  const encodeHTML = (text: string, format: string): string => {
    switch (format) {
      case 'HTML Entities':
        return text.replace(/[\u00A0-\u9999<>\&]/g, (i) => `&#${i.charCodeAt(0)};`);
      case 'URL Encode':
        return encodeURIComponent(text);
      case 'CSS Escape':
        return text.replace(/[^\w\s-]/g, '\\$&');
      default:
        return text;
    }
  };

  const encodeCustom = (text: string, format: string): string => {
    switch (format) {
      case 'ROT13':
        return text.replace(/[a-zA-Z]/g, (char) => {
          const code = char.charCodeAt(0);
          const base = code < 97 ? 65 : 97;
          return String.fromCharCode(((code - base + 13) % 26) + base);
        });
      case 'Caesar Cipher':
        return text.replace(/[a-zA-Z]/g, (char) => {
          const code = char.charCodeAt(0);
          const base = code < 97 ? 65 : 97;
          return String.fromCharCode(((code - base + 3) % 26) + base);
        });
      case 'Atbash':
        return text.replace(/[a-zA-Z]/g, (char) => {
          const code = char.charCodeAt(0);
          const base = code < 97 ? 65 : 97;
          return String.fromCharCode(25 - (code - base) + base);
        });
      case 'Reverse':
        return text.split('').reverse().join('');
      case 'Uppercase':
        return text.toUpperCase();
      case 'Lowercase':
        return text.toLowerCase();
      default:
        return text;
    }
  };

  const decodeBase64 = (text: string, format: string): string => {
    try {
      switch (format) {
        case 'Base64':
          return atob(text);
        case 'Base64URL': {
          const padded = text + '='.repeat((4 - (text.length % 4)) % 4);
          return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
        }
        case 'Base32':
          return base32ToText(text);
        case 'Base58':
          return base58ToText(text);
        default:
          return atob(text);
      }
    } catch (error) {
      return `Decoding error: ${error instanceof Error ? error.message : 'Invalid format'}`;
    }
  };

  const decodeURL = (text: string, format: string): string => {
    try {
      switch (format) {
        case 'URL Decode':
          return decodeURIComponent(text);
        case 'Punycode':
          // Simplified punycode decoding
          if (text.startsWith('xn--')) {
            return text.replace('xn--', '').replace(/-/g, ' ');
          }
          return text;
        default:
          return decodeURIComponent(text);
      }
    } catch (error) {
      return `Decoding error: ${error instanceof Error ? error.message : 'Invalid format'}`;
    }
  };

  const decodeHTML = (text: string, format: string): string => {
    try {
      switch (format) {
        case 'HTML Entities': {
          const textarea = document.createElement('textarea');
          textarea.innerHTML = text;
          return textarea.value;
        }
        default:
          return text;
      }
    } catch (error) {
      return `Decoding error: ${error instanceof Error ? error.message : 'Invalid format'}`;
    }
  };

  const decodeCustom = (text: string, format: string): string => {
    switch (format) {
      case 'ROT13':
        return encodeCustom(text, 'ROT13'); // ROT13 is its own inverse
      case 'Caesar Cipher':
        return text.replace(/[a-zA-Z]/g, (char) => {
          const code = char.charCodeAt(0);
          const base = code < 97 ? 65 : 97;
          return String.fromCharCode(((code - base - 3 + 26) % 26) + base);
        });
      case 'Atbash':
        return encodeCustom(text, 'Atbash'); // Atbash is its own inverse
      case 'Reverse':
        return text.split('').reverse().join('');
      default:
        return text;
    }
  };

  // Simplified implementations for Base32, Base58, etc.
  const textToBase32 = (text: string): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const bytes = new TextEncoder().encode(text);
    let result = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < bytes.length; i++) {
      value = (value << 8) | bytes[i];
      bits += 8;

      while (bits >= 5) {
        result += alphabet[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      result += alphabet[(value << (5 - bits)) & 31];
    }

    return result;
  };

  const textToBase58 = (text: string): string => {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const bytes = new TextEncoder().encode(text);
    let result = '';
    let num = 0;

    for (const byte of bytes) {
      num = num * 256 + byte;
    }

    while (num > 0) {
      result = alphabet[num % 58] + result;
      num = Math.floor(num / 58);
    }

    return result || '1';
  };

  const textToBase62 = (text: string): string => {
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const bytes = new TextEncoder().encode(text);
    let result = '';
    let num = 0;

    for (const byte of bytes) {
      num = num * 256 + byte;
    }

    while (num > 0) {
      result = alphabet[num % 62] + result;
      num = Math.floor(num / 62);
    }

    return result || '0';
  };

  const textToBase91 = (text: string): string => {
    const alphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+-./:<=>?@[]^_`{|}~';
    const bytes = new TextEncoder().encode(text);
    let result = '';
    let num = 0;

    for (const byte of bytes) {
      num = num * 256 + byte;
    }

    while (num > 0) {
      result = alphabet[num % 91] + result;
      num = Math.floor(num / 91);
    }

    return result || 'A';
  };

  const textToBase100 = (text: string): string => {
    // Very simplified Base100 using emojis
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇'];
    const bytes = new TextEncoder().encode(text);
    let result = '';

    for (let i = 0; i < bytes.length; i++) {
      result += emojis[bytes[i] % emojis.length];
    }

    return result;
  };

  const base32ToText = (text: string): string => {
    // Simplified Base32 decoding
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let result = '';
    let bits = 0;
    let value = 0;

    for (let i = 0; i < text.length; i++) {
      value = (value << 5) | alphabet.indexOf(text[i]);
      bits += 5;

      if (bits >= 8) {
        result += String.fromCharCode((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return result;
  };

  const base58ToText = (text: string): string => {
    // Simplified Base58 decoding
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0;

    for (const char of text) {
      num = num * 58 + alphabet.indexOf(char);
    }

    let result = '';
    while (num > 0) {
      result = String.fromCharCode(num % 256) + result;
      num = Math.floor(num / 256);
    }

    return result;
  };

  const performEncoding = () => {
    if (!inputText.trim()) return;

    const encoded = encodeText(inputText, encodingType, encodingFormat);
    const decoded = decodeText(encoded, encodingType, encodingFormat);

    const compressionRatio =
      encoded.length > 0 ? ((encoded.length - inputText.length) / inputText.length) * 100 : 0;

    const result: EncodingResult = {
      original: inputText,
      encoded,
      decoded,
      encoding: encodingFormat,
      format: encodingType,
      metadata: {
        originalLength: inputText.length,
        encodedLength: encoded.length,
        compressionRatio: compressionRatio !== 0 ? compressionRatio : undefined,
        charset: selectedCharset,
      },
    };

    setEncodingResult(result);
    setEncodingHistory((prev) => [result, ...prev.slice(0, 9)]);
  };

  const loadSampleText = (type: keyof typeof sampleTexts) => {
    setInputText(sampleTexts[type]);
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    // Show brief feedback
    const button = document.querySelector(`[data-copy="${type}"]`) as HTMLButtonElement;
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = 'Copied!';
      setTimeout(() => {
        button.innerHTML = originalText;
      }, 2000);
    }
  };

  const exportResults = () => {
    if (!encodingResult) return;

    const report = {
      timestamp: new Date().toISOString(),
      encoding: {
        type: encodingType,
        format: encodingFormat,
        charset: selectedCharset,
      },
      results: encodingResult,
      history: encodingHistory,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encoding-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Advanced Encoding Converter
          </CardTitle>
          <CardDescription>
            Convert between Unicode, Base64 family, Hash functions, Binary, URL, HTML, and Custom
            encodings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="converter">Converter</TabsTrigger>
              <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="converter" className="space-y-6">
              {/* Configuration */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Encoding Type</Label>
                  <Select value={encodingType} onValueChange={setEncodingType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(encodingAlgorithms).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          {value.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Encoding Format</Label>
                  <Select value={encodingFormat} onValueChange={setEncodingFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {encodingAlgorithms[
                        encodingType as keyof typeof encodingAlgorithms
                      ]?.formats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Character Set</Label>
                  <Select value={selectedCharset} onValueChange={setSelectedCharset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTF-8">UTF-8</SelectItem>
                      <SelectItem value="UTF-16">UTF-16</SelectItem>
                      <SelectItem value="ASCII">ASCII</SelectItem>
                      <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                      <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Input/Output */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium text-lg">Original Text</Label>
                    <div className="flex gap-2">
                      <Button onClick={() => loadSampleText('basic')} variant="outline" size="sm">
                        Basic
                      </Button>
                      <Button onClick={() => loadSampleText('unicode')} variant="outline" size="sm">
                        Unicode
                      </Button>
                      <Button onClick={() => loadSampleText('emoji')} variant="outline" size="sm">
                        Emoji
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter text to encode..."
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <div className="text-gray-600 text-sm">
                    Characters: {inputText.length.toLocaleString()}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center justify-between font-medium text-lg">
                    <span>Encoded Result</span>
                    <Badge variant="outline">{encodingFormat}</Badge>
                  </Label>
                  <div className="relative">
                    <Textarea
                      value={encodingResult?.encoded || ''}
                      readOnly
                      placeholder="Encoded text will appear here..."
                      className="min-h-[150px] bg-gray-50 font-mono text-sm"
                    />
                    <Button
                      onClick={() => copyToClipboard(encodingResult?.encoded || '', 'encoded')}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      data-copy="encoded"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-gray-600 text-sm">
                    {encodingResult &&
                      `Characters: ${encodingResult.encoded.length.toLocaleString()}`}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="case-sensitive"
                    checked={caseSensitive}
                    onCheckedChange={setCaseSensitive}
                  />
                  <Label htmlFor="case-sensitive">Case Sensitive</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="preserve-formatting"
                    checked={preserveFormatting}
                    onCheckedChange={setPreserveFormatting}
                  />
                  <Label htmlFor="preserve-formatting">Preserve Formatting</Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={performEncoding} disabled={!inputText.trim()} className="flex-1">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Encode Text
                </Button>
                <Button onClick={exportResults} variant="outline" disabled={!encodingResult}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>

              {/* Results Analysis */}
              {encodingResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Encoding Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <div className="font-bold text-blue-600 text-xl">
                          {encodingResult.metadata.originalLength}
                        </div>
                        <div className="text-gray-600 text-sm">Original Length</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <div className="font-bold text-green-600 text-xl">
                          {encodingResult.metadata.encodedLength}
                        </div>
                        <div className="text-gray-600 text-sm">Encoded Length</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <div className="font-bold text-purple-600 text-xl">
                          {encodingResult.metadata.charset}
                        </div>
                        <div className="text-gray-600 text-sm">Character Set</div>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3 text-center">
                        <div className="font-bold text-orange-600 text-xl">
                          {encodingResult.encoding}
                        </div>
                        <div className="text-gray-600 text-sm">Format</div>
                      </div>
                    </div>

                    {encodingResult.metadata.compressionRatio !== undefined && (
                      <div className="mt-4 rounded-lg bg-blue-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Size Change:</span>
                          <span
                            className={
                              encodingResult.metadata.compressionRatio > 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }
                          >
                            {encodingResult.metadata.compressionRatio > 0 ? '+' : ''}
                            {encodingResult.metadata.compressionRatio.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Decode Verification */}
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium">Decode Verification</h4>
                      <div className="flex items-center gap-2">
                        {encodingResult.original === encodingResult.decoded ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-600">
                              Decoding successful - round trip verified
                            </span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <span className="text-red-600">
                              Round trip failed - encoding may be lossy
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analyzer" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Encoding analysis tools coming soon! This will include character encoding
                  detection, binary analysis, and encoding optimization suggestions.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Additional encoding tools coming soon! Including batch encoding, encoding
                  comparison, and advanced character set analysis.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Encoding History */}
      {encodingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Encoding History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {encodingHistory.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{result.encoding}</div>
                    <div className="text-gray-600 text-sm">
                      {result.metadata.originalLength} → {result.metadata.encodedLength} characters
                    </div>
                    <div className="text-gray-500 text-xs">{new Date().toLocaleString()}</div>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(result.encoded, `history-${index}`)}
                    variant="ghost"
                    size="sm"
                    data-copy={`history-${index}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EncodingConverter;
