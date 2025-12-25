'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowsClockwise, Copy } from '@phosphor-icons/react';
import { useState } from 'react';

export function NumberBaseConverter() {
  const [decimal, setDecimal] = useState('42');
  const [binary, setBinary] = useState('101010');
  const [octal, setOctal] = useState('52');
  const [hexadecimal, setHexadecimal] = useState('2A');

  const updateFromDecimal = (value: string) => {
    setDecimal(value);
    const num = Number.parseInt(value, 10);
    if (!Number.isNaN(num)) {
      setBinary(num.toString(2));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
    }
  };

  const updateFromBinary = (value: string) => {
    setBinary(value);
    const num = Number.parseInt(value, 2);
    if (!Number.isNaN(num)) {
      setDecimal(num.toString(10));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
    }
  };

  const updateFromOctal = (value: string) => {
    setOctal(value);
    const num = Number.parseInt(value, 8);
    if (!Number.isNaN(num)) {
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setHexadecimal(num.toString(16).toUpperCase());
    }
  };

  const updateFromHex = (value: string) => {
    setHexadecimal(value);
    const num = Number.parseInt(value, 16);
    if (!Number.isNaN(num)) {
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setOctal(num.toString(8));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const reset = () => {
    updateFromDecimal('0');
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Number Base Converter</CardTitle>
          <CardDescription>
            Convert numbers between binary, octal, decimal, and hexadecimal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {/* Decimal */}
            <div className="space-y-2">
              <Label htmlFor="decimal">Decimal (Base 10)</Label>
              <div className="flex gap-2">
                <Input
                  id="decimal"
                  value={decimal}
                  onChange={(e) => updateFromDecimal(e.target.value)}
                  placeholder="Enter decimal number"
                  className="font-mono"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(decimal)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Binary */}
            <div className="space-y-2">
              <Label htmlFor="binary">Binary (Base 2)</Label>
              <div className="flex gap-2">
                <Input
                  id="binary"
                  value={binary}
                  onChange={(e) => updateFromBinary(e.target.value)}
                  placeholder="Enter binary number"
                  className="font-mono"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(binary)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Octal */}
            <div className="space-y-2">
              <Label htmlFor="octal">Octal (Base 8)</Label>
              <div className="flex gap-2">
                <Input
                  id="octal"
                  value={octal}
                  onChange={(e) => updateFromOctal(e.target.value)}
                  placeholder="Enter octal number"
                  className="font-mono"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(octal)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Hexadecimal */}
            <div className="space-y-2">
              <Label htmlFor="hex">Hexadecimal (Base 16)</Label>
              <div className="flex gap-2">
                <Input
                  id="hex"
                  value={hexadecimal}
                  onChange={(e) => updateFromHex(e.target.value)}
                  placeholder="Enter hexadecimal number"
                  className="font-mono"
                />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(hexadecimal)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={reset}>
              <ArrowsClockwise className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NumberBaseConverter;
