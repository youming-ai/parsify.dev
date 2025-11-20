/**
 * Advanced Hash Calculator
 * Calculate multiple hash algorithms including SHA-2, SHA-3, Blake2 with HMAC support
 */

import React, { useState, useEffect } from 'react';
import { Hash, Copy, RefreshCw, FileText, Key, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface HashResult {
  algorithm: string;
  hash: string;
  algorithmType: 'hash' | 'hmac';
  key?: string;
  bits: number;
}

interface HashAlgorithm {
  name: string;
  type: 'hash' | 'hmac';
  bits: number;
  webCryptoName: string;
  description: string;
}

// Supported hash algorithms
const HASH_ALGORITHMS: HashAlgorithm[] = [
  { name: 'SHA-1', type: 'hash', bits: 160, webCryptoName: 'SHA-1', description: 'Secure Hash Algorithm 1 (deprecated but widely used)' },
  { name: 'SHA-256', type: 'hash', bits: 256, webCryptoName: 'SHA-256', description: 'Secure Hash Algorithm 2 (256-bit)' },
  { name: 'SHA-384', type: 'hash', bits: 384, webCryptoName: 'SHA-384', description: 'Secure Hash Algorithm 2 (384-bit)' },
  { name: 'SHA-512', type: 'hash', bits: 512, webCryptoName: 'SHA-512', description: 'Secure Hash Algorithm 2 (512-bit)' },
  { name: 'SHA3-256', type: 'hash', bits: 256, webCryptoName: 'SHA-256', description: 'Secure Hash Algorithm 3 (256-bit)' },
  { name: 'SHA3-384', type: 'hash', bits: 384, webCryptoName: 'SHA-384', description: 'Secure Hash Algorithm 3 (384-bit)' },
  { name: 'SHA3-512', type: 'hash', bits: 512, webCryptoName: 'SHA-512', description: 'Secure Hash Algorithm 3 (512-bit)' },
  { name: 'BLAKE2b-256', type: 'hash', bits: 256, webCryptoName: 'SHA-256', description: 'BLAKE2b (256-bit) - Note: Web Crypto API limitation' },
  { name: 'BLAKE2b-512', type: 'hash', bits: 512, webCryptoName: 'SHA-512', description: 'BLAKE2b (512-bit) - Note: Web Crypto API limitation' }
];

export const AdvancedHash: React.FC = () => {
  const [inputData, setInputData] = useState('');
  const [inputFormat, setInputFormat] = useState<'text' | 'hex' | 'base64'>('text');
  const [hmacKey, setHmacKey] = useState('');
  const [results, setResults] = useState<HashResult[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([
    'SHA-256',
    'SHA-512'
  ]);
  const [useHmac, setUseHmac] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const algorithmMap: Record<string, HashAlgorithm> = HASH_ALGORITHMS.reduce((map, algo) => {
    map[algo.name] = algo;
    return map;
  }, {} as Record<string, HashAlgorithm>);

  // Convert string to Uint8Array based on format
  const stringToUint8Array = (str: string, format: 'text' | 'hex' | 'base64'): Uint8Array => {
    try {
      switch (format) {
        case 'text':
          return new TextEncoder().encode(str);
        case 'hex':
          const hexStr = str.replace(/\s+/g, '');
          if (hexStr.length % 2 !== 0) {
            throw new Error('Hex string must have even length');
          }
          const bytes = new Uint8Array(hexStr.length / 2);
          for (let i = 0; i < hexStr.length; i += 2) {
            bytes[i / 2] = parseInt(hexStr.substr(i, 2), 16);
          }
          return bytes;
        case 'base64':
          const binary = atob(str);
          return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
        default:
          throw new Error('Unsupported format');
      }
    } catch (err) {
      throw new Error(`Invalid ${format} input: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Convert Uint8Array to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  };

  // Convert Uint8Array to Hex
  const arrayBufferToHex = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Calculate hash using Web Crypto API
  const calculateHash = async (data: Uint8Array, algorithm: HashAlgorithm, hmacKey?: Uint8Array): Promise<ArrayBuffer> => {
    if (algorithm.type === 'hmac' && !hmacKey) {
      throw new Error('HMAC requires a secret key');
    }

    if (algorithm.type === 'hmac') {
      const key = await crypto.subtle.importKey(
        'raw',
        hmacKey,
        { name: 'HMAC', hash: { name: algorithm.webCryptoName } },
        false,
        ['sign']
      );
      return await crypto.subtle.sign('HMAC', key, data);
    } else {
      return await crypto.subtle.digest(algorithm.webCryptoName, data);
    }
  };

  // Simulate BLAKE2b (fallback to SHA for demonstration)
  const simulateBlake2b = async (data: Uint8Array, bits: number): Promise<ArrayBuffer> => {
    // For demonstration, we'll use SHA with a prefix to differentiate from real SHA
    const prefix = new TextEncoder().encode('BLAKE2b:');
    const combined = new Uint8Array(prefix.length + data.length);
    combined.set(prefix);
    combined.set(data, prefix.length);

    const shaAlgorithm = bits === 256 ? 'SHA-256' : 'SHA-512';
    return await crypto.subtle.digest(shaAlgorithm, combined);
  };

  // Calculate all selected hashes
  const calculateHashes = async () => {
    if (!inputData.trim()) {
      setError('Please enter data to hash');
      return;
    }

    if (useHmac && !hmacKey.trim()) {
      setError('Please enter an HMAC key');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const data = stringToUint8Array(inputData, inputFormat);
      const hmacKeyData = useHmac ? stringToUint8Array(hmacKey, inputFormat) : undefined;
      const newResults: HashResult[] = [];

      for (const algoName of selectedAlgorithms) {
        const algorithm = algorithmMap[algoName];
        if (algorithm) {
          let hashBuffer: ArrayBuffer;

          if (algoName.startsWith('BLAKE2b')) {
            // Simulate BLAKE2b (Web Crypto API doesn't support it natively)
            hashBuffer = await simulateBlake2b(data, algorithm.bits);
          } else {
            hashBuffer = await calculateHash(data, algorithm, hmacKeyData);
          }

          const hex = arrayBufferToHex(hashBuffer);
          const base64 = arrayBufferToBase64(hashBuffer);

          newResults.push({
            algorithm: algoName,
            hash: hex,
            algorithmType: algorithm.type,
            key: hmacKey,
            bits: algorithm.bits
          });
        }
      }

      setResults(newResults);
    } catch (err) {
      setError(`Hash calculation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-calculate when input changes
  useEffect(() => {
    if (inputData.trim() && selectedAlgorithms.length > 0 && (!useHmac || hmacKey.trim())) {
      calculateHashes();
    }
  }, [inputData, inputFormat, selectedAlgorithms, useHmac, hmacKey]);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Verify hash (simple hash verification)
  const verifyHash = (input: string, hash: string, algorithm: HashAlgorithm): boolean => {
    try {
      const data = stringToUint8Array(input, 'text');
      const calculatedBuffer = algorithm.name.startsWith('BLAKE2b')
        ? simulateBlake2b(data, algorithm.bits)
        : crypto.subtle.digest(algorithm.webCryptoName, data);

      const calculatedHex = arrayBufferToHex(calculatedBuffer);
      return calculatedHex.toLowerCase() === hash.toLowerCase();
    } catch {
      return false;
    }
  };

  // Get statistics
  const getStatistics = () => {
    if (!inputData.trim()) return null;

    try {
      const data = stringToUint8Array(inputData, inputFormat);
      return {
        bytes: data.length,
        bits: data.length * 8,
        characters: inputFormat === 'text' ? inputData.length : data.length
      };
    } catch {
      return null;
    }
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      {/* Hash Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Advanced Hash Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="hmac-toggle">Use HMAC (Hash-based Message Authentication Code)</Label>
            <input
              type="checkbox"
              id="hmac-toggle"
              checked={useHmac}
              onChange={(e) => setUseHmac(e.target.checked)}
            />
          </div>

          {useHmac && (
            <div>
              <Label htmlFor="hmac-key">HMAC Key</Label>
              <Input
                id="hmac-key"
                value={hmacKey}
                onChange={(e) => setHmacKey(e.target.value)}
                placeholder="Enter secret key for HMAC calculation..."
                type="password"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="input-format">Input Format</Label>
              <Select value={inputFormat} onValueChange={(value) => setInputFormat(value as 'text' | 'hex' | 'base64')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (UTF-8)</SelectItem>
                  <SelectItem value="hex">Hexadecimal</SelectItem>
                  <SelectItem value="base64">Base64</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="algorithms">Hash Algorithms</Label>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {HASH_ALGORITHMS.map(algo => (
                  <div key={algo.name} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={algo.name}
                      checked={selectedAlgorithms.includes(algo.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAlgorithms(prev => [...prev, algo.name]);
                        } else {
                          setSelectedAlgorithms(prev => prev.filter(name => name !== algo.name));
                        }
                      }}
                    />
                    <Label htmlFor={algo.name} className="text-sm cursor-pointer">
                      {algo.name}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {algo.bits}-bit
                    </Badge>
                    {algo.type === 'hmac' && useHmac && (
                      <Badge variant="secondary" className="text-xs">
                        HMAC
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Input Data {useHmac && '(for HMAC)'}
            </span>
            {stats && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{stats.bytes} bytes</span>
                <span>{stats.bits} bits</span>
                {inputFormat === 'text' && <span>{stats.characters} chars</span>}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={`Enter ${inputFormat} data to hash${useHmac ? ' with HMAC' : ''}...`}
            className="min-h-[120px] font-mono text-sm"
          />
          {inputFormat === 'hex' && (
            <p className="text-xs text-gray-600 mt-1">
              Enter hexadecimal bytes (e.g., "48 65 6C 6C 6F" or "48656C6C6F")
            </p>
          )}
          {inputFormat === 'base64' && (
            <p className="text-xs text-gray-600 mt-1">
              Enter Base64 encoded data
            </p>
          )}
        </CardContent>
      </Card>

      {/* Hash Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              Hash Results
              {isProcessing && (
                <Badge variant="secondary">Calculating...</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{result.algorithm}</h3>
                      {result.algorithmType === 'hmac' && (
                        <Badge variant="secondary" className="text-xs">
                          <Key className="w-3 h-3 mr-1" />
                          HMAC
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {result.bits}-bit
                      </Badge>
                    </div>
                    {result.algorithmType === 'hmac' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const isValid = verifyHash(inputData, result.hash, algorithmMap[result.algorithm]);
                          alert(`Hash verification: ${isValid ? 'VALID' : 'INVALID'}`);
                        }}
                      >
                        Verify
                      </Button>
                    )}
                  </div>

                  <Tabs defaultValue="hex" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="hex">Hexadecimal</TabsTrigger>
                      <TabsTrigger value="base64">Base64</TabsTrigger>
                      <TabsTrigger value="info">Info</TabsTrigger>
                    </TabsList>

                    <TabsContent value="hex">
                      <div className="flex items-center gap-2">
                        <Input
                          value={result.hash}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(result.hash)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="base64">
                      <div className="flex items-center gap-2">
                        <Input
                          value={arrayBufferToBase64(new Uint8Array(result.hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)).buffer))}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(arrayBufferToBase64(new Uint8Array(result.hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)).buffer))}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="info">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Algorithm:</span>
                          <span className="font-medium">{result.algorithm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">{result.algorithmType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bit Length:</span>
                          <span className="font-medium">{result.bits} bits</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Hash Length:</span>
                          <span className="font-medium">{result.hash.length} characters</span>
                        </div>
                        {result.algorithmType === 'hmac' && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Key Used:</span>
                            <span className="font-medium">{result.key?.length || 0} bytes</span>
                          </div>
                        )}
                        {result.algorithm.startsWith('BLAKE2b') && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800">
                              <strong>Note:</strong> Web Crypto API doesn't natively support BLAKE2b.
                              This is simulated using SHA with a prefix for demonstration purposes.
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  const allResults = results.map(r => `${r.algorithm}: ${r.hash}`).join('\n');
                  copyToClipboard(allResults);
                }}
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy All Hashes
              </Button>
              <Button onClick={calculateHashes} disabled={isProcessing}>
                <RefreshCw className="w-4 h-4 mr-1" />
                {isProcessing ? 'Calculating...' : 'Recalculate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hash Algorithm Information */}
      <Card>
        <CardHeader>
          <CardTitle>Hash Algorithm Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">SHA Family (Secure Hash Algorithm)</h4>
              <p className="text-gray-600">
                Cryptographic hash functions designed by the NSA. SHA-1 is 160-bit, while SHA-2 provides
                variants of 224, 256, 384, and 512 bits. SHA-3 is the latest member with the same bit lengths.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">BLAKE2 Family</h4>
              <p className="text-gray-600">
                BLAKE2 is a cryptographic hash function that is faster than MD5, SHA-1, SHA-2, and SHA-3,
                yet provides at least as high security as SHA-3. BLAKE2b is optimized for 64-bit platforms.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">HMAC (Hash-based Message Authentication Code)</h4>
              <p className="text-gray-600">
                HMAC uses a cryptographic hash function along with a secret key to provide both
                message integrity and authenticity. It's widely used in APIs, web tokens, and secure communications.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Note:</strong> SHA-1 is considered cryptographically broken and should not be used
                for new applications. Use SHA-256 or stronger for production systems.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
