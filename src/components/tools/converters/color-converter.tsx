'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy } from 'lucide-react';
import { useState } from 'react';

export function ColorConverter() {
  const [hex, setHex] = useState('#2A9D8F');
  const [rgb, setRgb] = useState({ r: 42, g: 157, b: 143 });
  const [hsl, setHsl] = useState({ h: 174, s: 58, l: 39 });

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${[r, g, b]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()}`;
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;
    let r;
    let g;
    let b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  const updateFromHex = (value: string) => {
    setHex(value);
    const rgbValue = hexToRgb(value);
    setRgb(rgbValue);
    setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    setRgb({ r, g, b });
    setHex(rgbToHex(r, g, b));
    setHsl(rgbToHsl(r, g, b));
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    setHsl({ h, s, l });
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Converter</CardTitle>
          <CardDescription>Convert colors between HEX, RGB, and HSL formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Preview */}
          <div className="space-y-2">
            <Label>Color Preview</Label>
            <div
              className="h-32 w-full rounded-lg border-2 border-border"
              style={{ backgroundColor: hex }}
            />
          </div>

          {/* HEX */}
          <div className="space-y-2">
            <Label htmlFor="hex">HEX</Label>
            <div className="flex gap-2">
              <Input
                id="hex"
                value={hex}
                onChange={(e) => updateFromHex(e.target.value)}
                placeholder="#000000"
                className="font-mono"
              />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(hex)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* RGB */}
          <div className="space-y-2">
            <Label>RGB</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="r" className="text-xs">
                  R
                </Label>
                <Input
                  id="r"
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.r}
                  onChange={(e) =>
                    updateFromRgb(Number.parseInt(e.target.value) || 0, rgb.g, rgb.b)
                  }
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="g" className="text-xs">
                  G
                </Label>
                <Input
                  id="g"
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.g}
                  onChange={(e) =>
                    updateFromRgb(rgb.r, Number.parseInt(e.target.value) || 0, rgb.b)
                  }
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="b" className="text-xs">
                  B
                </Label>
                <Input
                  id="b"
                  type="number"
                  min="0"
                  max="255"
                  value={rgb.b}
                  onChange={(e) =>
                    updateFromRgb(rgb.r, rgb.g, Number.parseInt(e.target.value) || 0)
                  }
                  className="font-mono"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy RGB
            </Button>
          </div>

          {/* HSL */}
          <div className="space-y-2">
            <Label>HSL</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="h" className="text-xs">
                  H
                </Label>
                <Input
                  id="h"
                  type="number"
                  min="0"
                  max="360"
                  value={hsl.h}
                  onChange={(e) =>
                    updateFromHsl(Number.parseInt(e.target.value) || 0, hsl.s, hsl.l)
                  }
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="s" className="text-xs">
                  S (%)
                </Label>
                <Input
                  id="s"
                  type="number"
                  min="0"
                  max="100"
                  value={hsl.s}
                  onChange={(e) =>
                    updateFromHsl(hsl.h, Number.parseInt(e.target.value) || 0, hsl.l)
                  }
                  className="font-mono"
                />
              </div>
              <div>
                <Label htmlFor="l" className="text-xs">
                  L (%)
                </Label>
                <Input
                  id="l"
                  type="number"
                  min="0"
                  max="100"
                  value={hsl.l}
                  onChange={(e) =>
                    updateFromHsl(hsl.h, hsl.s, Number.parseInt(e.target.value) || 0)
                  }
                  className="font-mono"
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy HSL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ColorConverter;
