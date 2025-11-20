/**
 * CRC Calculator
 * Calculate CRC-16 and CRC-32 checksums for data integrity verification
 */

import React, { useState, useEffect } from "react";
import { Calculator, Copy, RefreshCw, FileText, Hash, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CRCResult {
  algorithm: string;
  hex: string;
  decimal: number;
  binary: string;
  reversed: boolean;
}

interface CRCAlgorithm {
  name: string;
  width: number;
  polynomial: number;
  initial: number;
  finalXor: number;
  inputReversed: boolean;
  outputReversed: boolean;
}

// CRC-16-CCITT (XModem)
const CRC16_CCITT: CRCAlgorithm = {
  name: "CRC-16-CCITT (XModem)",
  width: 16,
  polynomial: 0x1021,
  initial: 0x0000,
  finalXor: 0x0000,
  inputReversed: false,
  outputReversed: false,
};

// CRC-16-CCITT (Kermit)
const CRC16_KERMIT: CRCAlgorithm = {
  name: "CRC-16-CCITT (Kermit)",
  width: 16,
  polynomial: 0x1021,
  initial: 0x0000,
  finalXor: 0x0000,
  inputReversed: true,
  outputReversed: true,
};

// CRC-32 (IEEE 802.3)
const CRC32_IEEE: CRCAlgorithm = {
  name: "CRC-32 (IEEE 802.3)",
  width: 32,
  polynomial: 0x04c11db7,
  initial: 0xffffffff,
  finalXor: 0xffffffff,
  inputReversed: true,
  outputReversed: true,
};

// CRC-32C (Castagnoli)
const CRC32C: CRCAlgorithm = {
  name: "CRC-32C (Castagnoli)",
  width: 32,
  polynomial: 0x1edc6f41,
  initial: 0xffffffff,
  finalXor: 0xffffffff,
  inputReversed: true,
  outputReversed: true,
};

export const CRCCalculator: React.FC = () => {
  const [inputData, setInputData] = useState("");
  const [inputFormat, setInputFormat] = useState<"text" | "hex" | "base64">("text");
  const [results, setResults] = useState<CRCResult[]>([]);
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([
    "CRC-16-CCITT (XModem)",
    "CRC-32 (IEEE 802.3)",
  ]);
  const [error, setError] = useState<string | null>(null);

  const algorithms: CRCAlgorithm[] = [CRC16_CCITT, CRC16_KERMIT, CRC32_IEEE, CRC32C];

  const algorithmMap: Record<string, CRCAlgorithm> = algorithms.reduce(
    (map, algo) => {
      map[algo.name] = algo;
      return map;
    },
    {} as Record<string, CRCAlgorithm>,
  );

  // Convert string to Uint8Array based on format
  const stringToUint8Array = (str: string, format: "text" | "hex" | "base64"): Uint8Array => {
    try {
      switch (format) {
        case "text":
          return new TextEncoder().encode(str);
        case "hex":
          // Remove whitespace and convert hex to bytes
          const hexStr = str.replace(/\s+/g, "");
          if (hexStr.length % 2 !== 0) {
            throw new Error("Hex string must have even length");
          }
          const bytes = new Uint8Array(hexStr.length / 2);
          for (let i = 0; i < hexStr.length; i += 2) {
            bytes[i / 2] = parseInt(hexStr.substr(i, 2), 16);
          }
          return bytes;
        case "base64":
          const binary = atob(str);
          return new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
        default:
          throw new Error("Unsupported format");
      }
    } catch (err) {
      throw new Error(
        `Invalid ${format} input: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  // Reverse bits in a byte
  const reverseBits = (byte: number): number => {
    let result = 0;
    for (let i = 0; i < 8; i++) {
      result = (result << 1) | ((byte >> i) & 1);
    }
    return result;
  };

  // Calculate CRC using bit-by-bit algorithm
  const calculateCRC = (data: Uint8Array, algorithm: CRCAlgorithm): number => {
    const width = algorithm.width;
    const mask = (1 << width) - 1;
    let crc = algorithm.initial;

    // Process each byte
    for (let i = 0; i < data.length; i++) {
      let byte = data[i];

      // Reverse input bits if specified
      if (algorithm.inputReversed) {
        byte = reverseBits(byte);
      }

      // XOR byte into CRC (shift right by width bits)
      crc ^= (algorithm.inputReversed ? reverseBits(byte) : byte) << (32 - width);

      // Process 8 bits
      for (let j = 0; j < 8; j++) {
        if (crc & (1 << 31)) {
          crc = (crc << 1) ^ algorithm.polynomial;
        } else {
          crc = crc << 1;
        }
      }
    }

    // Apply final XOR
    crc ^= algorithm.finalXor;

    // Reverse output bits if specified
    if (algorithm.outputReversed) {
      crc = ((crc & 0x0000ffff) << 16) | ((crc & 0xffff0000) >>> 16);
      crc = ((crc & 0x00ff00ff) << 8) | ((crc & 0xff00ff00) >>> 8);
    }

    return crc & mask;
  };

  // Calculate all selected CRCs
  const calculateCRCs = () => {
    if (!inputData.trim()) {
      setError("Please enter data to calculate CRC");
      return;
    }

    setError(null);

    try {
      const data = stringToUint8Array(inputData, inputFormat);
      const newResults: CRCResult[] = [];

      for (const algoName of selectedAlgorithms) {
        const algorithm = algorithmMap[algoName];
        if (algorithm) {
          const crc = calculateCRC(data, algorithm);
          const hex = crc
            .toString(16)
            .toUpperCase()
            .padStart(algorithm.width / 4, "0");

          newResults.push({
            algorithm: algoName,
            hex,
            decimal: crc,
            binary: crc.toString(2).padStart(algorithm.width, "0"),
            reversed: algorithm.outputReversed,
          });
        }
      }

      setResults(newResults);
    } catch (err) {
      setError(`Calculation failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Auto-calculate when input changes
  useEffect(() => {
    if (inputData.trim() && selectedAlgorithms.length > 0) {
      calculateCRCs();
    }
  }, [inputData, inputFormat, selectedAlgorithms]);

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  // Format bytes for display
  const formatBytes = (bytes: Uint8Array): string => {
    const hexBytes = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0").toUpperCase());
    return hexBytes.join(" ");
  };

  // Calculate statistics
  const getStatistics = () => {
    if (!inputData.trim()) return null;

    try {
      const data = stringToUint8Array(inputData, inputFormat);
      return {
        bytes: data.length,
        bits: data.length * 8,
        characters: inputFormat === "text" ? inputData.length : data.length,
      };
    } catch {
      return null;
    }
  };

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      {/* Input Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            CRC Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="input-format">Input Format</Label>
              <Select
                value={inputFormat}
                onValueChange={(value) => setInputFormat(value as "text" | "hex" | "base64")}
              >
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
              <Label htmlFor="algorithms">CRC Algorithms</Label>
              <div className="space-y-2 mt-2">
                {algorithms.map((algo) => (
                  <div key={algo.name} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={algo.name}
                      checked={selectedAlgorithms.includes(algo.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAlgorithms((prev) => [...prev, algo.name]);
                        } else {
                          setSelectedAlgorithms((prev) =>
                            prev.filter((name) => name !== algo.name),
                          );
                        }
                      }}
                    />
                    <Label htmlFor={algo.name} className="text-sm">
                      {algo.name}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {algo.width}-bit
                    </Badge>
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
              Input Data
            </span>
            {stats && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{stats.bytes} bytes</span>
                <span>{stats.bits} bits</span>
                {inputFormat === "text" && <span>{stats.characters} chars</span>}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder={`Enter ${inputFormat} data to calculate CRC...`}
            className="min-h-[120px] font-mono text-sm"
          />
          {inputFormat === "hex" && (
            <p className="text-xs text-gray-600 mt-1">
              Enter hexadecimal bytes (e.g., "48 65 6C 6C 6F" or "48656C6C6F")
            </p>
          )}
          {inputFormat === "base64" && (
            <p className="text-xs text-gray-600 mt-1">Enter Base64 encoded data</p>
          )}
        </CardContent>
      </Card>

      {/* CRC Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="w-5 h-5" />
              CRC Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{result.algorithm}</h3>
                    <Badge variant="outline">{result.reversed ? "Reversed" : "Normal"}</Badge>
                  </div>

                  <Tabs defaultValue="hex" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="hex">Hexadecimal</TabsTrigger>
                      <TabsTrigger value="decimal">Decimal</TabsTrigger>
                      <TabsTrigger value="binary">Binary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="hex">
                      <div className="flex items-center gap-2">
                        <Input value={`0x${result.hex}`} readOnly className="font-mono" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`0x${result.hex}`)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="decimal">
                      <div className="flex items-center gap-2">
                        <Input value={result.decimal.toString()} readOnly className="font-mono" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(result.decimal.toString())}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="binary">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 font-mono text-xs break-all">{result.binary}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(result.binary)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  const allResults = results.map((r) => `${r.algorithm}: 0x${r.hex}`).join("\n");
                  copyToClipboard(allResults);
                }}
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy All Results
              </Button>
              <Button onClick={calculateCRCs}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Recalculate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CRC Information */}
      <Card>
        <CardHeader>
          <CardTitle>About CRC Algorithms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">CRC-16-CCITT (XModem)</h4>
              <p className="text-gray-600">
                16-bit CRC used in XModem protocol, YMODEM, and ZMODEM file transfer protocols.
                Polynomial: 0x1021, Initial: 0x0000
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">CRC-16-CCITT (Kermit)</h4>
              <p className="text-gray-600">
                16-bit CRC used in Kermit protocol with bit reversal for both input and output.
                Polynomial: 0x1021, Initial: 0x0000
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">CRC-32 (IEEE 802.3)</h4>
              <p className="text-gray-600">
                32-bit CRC used in Ethernet, ZIP, PNG, and many other protocols. Polynomial:
                0x04C11DB7, Initial: 0xFFFFFFFF
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">CRC-32C (Castagnoli)</h4>
              <p className="text-gray-600">
                32-bit CRC with better error detection properties, used in iSCSI and SCTP.
                Polynomial: 0x1EDC6F41, Initial: 0xFFFFFFFF
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                CRC (Cyclic Redundancy Check) is an error-detecting code used to detect accidental
                changes to digital data. It's commonly used in network protocols and file formats
                for data integrity verification.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
