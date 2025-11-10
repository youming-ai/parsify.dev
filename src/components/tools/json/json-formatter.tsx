"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/components/ui/material-symbols";
import { useInputValidator, useSessionManager } from "@/lib/hooks";

interface JSONFormatterProps {
  initialData?: string;
  onFormattedData?: (data: any) => void;
}

export function JSONFormatter({ initialData = "", onFormattedData }: JSONFormatterProps) {
  const [input, setInput] = useState(initialData);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [formatOptions, setFormatOptions] = useState({
    indentation: 2,
    sortKeys: false,
    sortKeysAlphabetically: true,
    sortKeysByType: false,
    sortKeysCustomOrder: "",
    trailingComma: false,
    quoteStyle: "double" as "double" | "single",
    objectBraceStyle: "same-line" as "same-line" | "new-line",
    arrayBraceStyle: "same-line" as "same-line" | "new-line",
    maxLineLength: 120,
    preserveOrder: false
  });
  const [stats, setStats] = useState({
    lines: 0,
    characters: 0,
    formattedLines: 0,
    formattedCharacters: 0
  });

  const { validateJSON } = useInputValidator();
  const { saveSession, getSession } = useSessionManager();

  // Load session data on mount
  useEffect(() => {
    const session = getSession("json-formatter");
    if (session?.inputs?.data) {
      setInput(session.inputs.data);
      setFormatOptions(session.inputs.options || formatOptions);
    }
  }, [getSession]);

  // Save session when data changes
  useEffect(() => {
    saveSession("json-formatter", {
      data: input,
      options: formatOptions
    });
  }, [input, formatOptions, saveSession]);

  const sortObjectKeys = useCallback((obj: any, options = formatOptions): any => {
    const sortKeysByType = (obj: any): string[] => {
      const typeOrder = ['object', 'array', 'string', 'number', 'boolean', 'null', 'undefined'];
      return Object.keys(obj).sort((a, b) => {
        const typeA = typeof obj[a];
        const typeB = typeof obj[b];
        const typeAIndex = typeOrder.indexOf(typeA);
        const typeBIndex = typeOrder.indexOf(typeB);

        if (typeAIndex !== typeBIndex) {
          return typeAIndex - typeBIndex;
        }

        // Same type, sort alphabetically
        return a.localeCompare(b);
      });
    };

    if (Array.isArray(obj)) {
      return obj.map(item => sortObjectKeys(item, options));
    } else if (typeof obj === 'object' && obj !== null) {
      let sorted: any = {};

      if (options.sortKeysAlphabetically) {
        const keys = Object.keys(obj).sort((a, b) => {
          const compareA = options.caseSensitive ? a : a.toLowerCase();
          const compareB = options.caseSensitive ? b : b.toLowerCase();
          return compareA.localeCompare(compareB);
        });

        for (const key of keys) {
          sorted[key] = sortObjectKeys(obj[key], options);
        }
      } else if (options.sortKeysByType) {
        const keys = sortKeysByType(obj);

        for (const key of keys) {
          sorted[key] = sortObjectKeys(obj[key], options);
        }
      } else if (options.sortKeys && options.sortKeysCustomOrder) {
        const customOrder = options.sortKeysCustomOrder.split(',').map(s => s.trim()).filter(s => s);
        const keys = Object.keys(obj);

        const sorted: any = {};
        const usedKeys = new Set();

        // Add keys in custom order first
        for (const customKey of customOrder) {
          if (obj.hasOwnProperty(customKey)) {
            sorted[customKey] = sortObjectKeys(obj[customKey], options);
            usedKeys.add(customKey);
          }
        }

        // Add remaining keys alphabetically
        const remainingKeys = keys.filter(key => !usedKeys.has(key));
        remainingKeys.sort((a, b) => {
          const compareA = options.caseSensitive ? a : a.toLowerCase();
          const compareB = options.caseSensitive ? b : b.toLowerCase();
          return compareA.localeCompare(compareB);
        });

        for (const key of remainingKeys) {
          sorted[key] = sortObjectKeys(obj[key], options);
        }
      } else {
        sorted = { ...obj };
      }

      return sorted;
    }

    return obj;
  }, [formatOptions]);

  const formatJSON = useCallback((data: string, options = formatOptions): string => {
    try {
      const parsed = JSON.parse(data);
      let sorted = parsed;

      // Apply sorting if enabled
      if (options.sortKeys) {
        sorted = sortObjectKeys(parsed, options);
      }

      let formatted = JSON.stringify(sorted, null, options.indentation);

      // Add trailing commas if requested
      if (options.trailingComma) {
        formatted = formatted.replace(/([}\]])/g, '$1,');
      }

      // Handle quote style
      if (options.quoteStyle === 'single') {
        formatted = formatted.replace(/"/g, "'");
      }

      // Handle brace styles
      if (options.objectBraceStyle === 'new-line') {
        formatted = formatted.replace(/{/g, '{\n  ').replace(/}/g, '\n}');
        formatted = formatted.replace(/\\n  ([^\\n}]+)\\n  /g, '$1');
      }

      if (options.arrayBraceStyle === 'new-line') {
        formatted = formatted.replace(/\[/g, '[\n  ').replace(/\]/g, '\n]');
        formatted = formatted.replace(/\\n  ([^\\n\\]]+)\\n  /g, '$1');
      }

      // Apply line length limit if specified
      if (options.maxLineLength > 0) {
        formatted = formatWithLineLimit(formatted, options.maxLineLength);
      }

      return formatted;
    } catch (error) {
      throw new Error(`Formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [formatOptions, sortObjectKeys]);

  const formatWithLineLimit = (json: string, maxLength: number): string => {
    const lines = json.split('\n');
    const formattedLines: string[] = [];

    for (const line of lines) {
      if (line.length <= maxLength) {
        formattedLines.push(line);
      } else {
        // Break long lines
        const words = line.split(' ');
        let currentLine = '';

        for (const word of words) {
          if ((currentLine + word).length + 1 <= maxLength) {
            currentLine += (currentLine ? ' ' : '') + word;
          } else {
            if (currentLine) {
              formattedLines.push(currentLine);
            }
            currentLine = word;
          }
        }

        if (currentLine) {
          formattedLines.push(currentLine);
        }
      }

      return formattedLines.join('\n');
    };

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      setError("Please enter JSON data");
      setOutput("");
      setIsValid(false);
      return;
    }

    const validation = validateJSON(input);

    if (!validation.valid) {
      setError(validation.error || "Invalid JSON");
      setIsValid(false);
      setOutput("");
      return;
    }

    try {
      const formatted = formatJSON(input);

      const inputLines = input.split('\n').length;
      const inputChars = input.length;
      const outputLines = formatted.split('\n').length;
      const outputChars = formatted.length;

      setOutput(formatted);
      setError(null);
      setIsValid(true);
      setStats({
        lines: inputLines,
        characters: inputChars,
        formattedLines,
        formattedCharacters: outputChars
      });
      onFormattedData?.( JSON.parse(formatted));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Formatting error");
      setIsValid(false);
    }
  }, [input, formatJSON, validateJSON, onFormattedData]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    setIsValid(true);
    setStats({ lines: 0, characters: 0, formattedLines: 0, formattedCharacters: 0 });
  };

  const handleLoadSample = (sample: string) => {
    setInput(sample);
  };

  const handlePrettify = () => {
    try {
      // Use Prettier if available, otherwise fallback to basic formatting
      if (typeof window !== 'undefined' && 'prettier' in window) {
        // Would use Prettier here in production
        handleFormat();
      } else {
        handleFormat();
      }
    } catch (err) {
      console.error("Prettier not available:", err);
    }
  };

  const handleCompress = () => {
    handleFormat();
    setFormatOptions(prev => ({ ...prev, indentation: 0 }));
  };

  const samples = {
    unformatted: `{"name":"John Doe","age":30,"city":"New York","hobbies":["reading","coding","gaming"],"address":{"street":"123 Main St","city":"New York","zip":"10001"}}`,
    nested: `{"company":{"name":"Tech Corp","employees":[{"id":1,"name":"Alice Johnson","department":"Engineering","skills":["JavaScript","React","Node.js","TypeScript"],"contact":{"email":"alice@example.com","phone":"+1-555-0123"}}],"revenue":{"2023":1500000,"2024":2100000}}}`,
    large: `{"products":[{"id":1,"name":"Laptop Pro 16","category":"Electronics","price":1999.99,"inStock":true,"specifications":{"processor":"Intel Core i7-13700H","ram":"16GB","storage":"512GB SSD","display":"16-inch Retina Display","graphics":"AMD Radeon Pro 5500M"},"features":["Touch Bar","Force Touch trackpad","Thunderbolt 4","Wi-Fi 6E","Bluetooth 5.0"],"images":["https://example.com/laptop1.jpg","https://example.com/laptop2.jpg"]}]},{"id":2,"name":"Wireless Mouse","category":"Accessories","price":79.99,"inStock":true,"specifications":{"connectivity":"Bluetooth 5.0","battery":"AA battery (2 months)","dpi":"1600","buttons":7},"compatibility":["Windows","macOS","Linux"]}]},{"id":3,"name":"USB-C Hub","category":"Accessories","price":49.99,"inStock":true,"ports":4,"compatibility":["USB 3.0","USB 2.0"]}]},{"id":4,"name":"Webcam HD","category":"Electronics","price":129.99,"inStock":true,"resolution":"1080p","features":["Auto-focus","Noise reduction","Wide-angle lens"],"compatibility":["Windows","macOS","Linux"]}]},{"id":5,"name":"Mechanical Keyboard","category":"Accessories","price":149.99,"inStock":true,"layout":"TKL","backlighting":"RGB","features":["Hot-swappable keys","Programmable keys","Anti-ghosting"],"compatibility":["Windows","macOS","Linux"]}]},{"id":6,"name":"External SSD","category":"Storage","price":89.99,"inStock":true,"capacity":"1TB","interface":"USB 3.2 Gen 2","read_speed":"550 MB/s","write_speed":"520 MB/s","compatibility":["Windows","macOS","Linux"]}]},{"id":7,"name":"Monitor Stand","category":"Electronics","price": "199.99","inStock":true,"size":"27-inch","resolution":"4K UHD","refresh_rate":"60Hz","features":["Adjustable height","VESA mount","HDR support"],"compatibility":["Windows","macOS","Linux"]}]},{"id":8,"name":"Gaming Headset","category":"Electronics","price": "299.99","inStock":true,"connectivity":"Wireless","compatibility":["PC","PlayStation","Xbox","Nintendo Switch"]},{"id":9,"name":"Graphics Tablet","category":"Electronics","price": "899.99","inStock":true,"size":"11-inch","display":"LCD","stylus":"Included","compatibility":["Windows","macOS","Android"]},{"id":10,"name":"Smart Speaker","category":"Electronics","price": "129.99","inStock":true,"assistant":"Alexa","sound":"360° audio","compatibility":["iOS","Android","Amazon Echo"]}]},{"id":11,"name":"Fitness Tracker","category":"Electronics","price": "199.99","inStock":true,"features":["Heart rate monitor","Sleep tracking","Water resistant","GPS"],"compatibility":["iOS","Android"]},{"id":12,"name":"Digital Camera","category":"Electronics","price": "599.99","inStock":true,"resolution":"24MP","features":["4K video","Image stabilization","Night mode"],"compatibility":["iOS","Android"]}]},{"id":13,"name":"Streaming Device","category":"Electronics","price": "49.99","inStock":true,"resolution":"1080p","services":["Netflix","Hulu","Disney+","Prime Video"],"compatibility":["Smart TV","Roku","Fire TV"]}]},{"id":14,"name":"Smart Home Hub","category":"Electronics","price": "149.99","inStock":true,"protocol":"Matter","devices":[],"compatibility":["Alexa","Google Home","Apple HomeKit"]}]},{"id":15,"name":"Wireless Charger","category":"Accessories","price": "39.99","inStock":true,"power":"15W","compatibility":["Qi-certified","USB-C PD","iPhone","Android"]}]},{"id":16,"name":"Bluetooth Earbuds","category":"Accessories","price": "199.99","inStock":true,"noise-cancellation":true,"battery_life":"6 hours","compatibility":["iOS","Android","Windows"]}]},{"id":17,"name":"USB-C Docking Station","category":"Accessories","price": "99.99","inStock":true,"ports":7,"features":["4K HDMI output","SD card reader","Ethernet","Thunderbolt 4"],"compatibility":["MacBook","iPad Pro","Windows"]}]},{"id":18,"name":"External Hard Drive","category":"Storage","price": "79.99","inStock":true,"capacity":"2TB","interface":"USB 3.0","speed":"7200 RPM","compatibility":["Windows","macOS","Linux"]}]},{"id":19,"name":"Graphics Card","category":"Electronics","price": "699.99","inStock":true,"vram":"8GB","memory":"16GB","chipset":"RTX 3070","features":["Ray tracing","DLSS","DirectX 12 Ultimate"],"compatibility":["Windows","Linux"]}]},{"id":20,"name":"Gaming Mouse","category":"Accessories","price": "79.99","inStock":true,"dpi":"16000","programmable":true,"buttons":6,"wireless":true,"rgb":true,"compatibility":["PC","Mac","Linux"]}]},{"id":21,"name":"Mechanical Keyboard","category":"Accessories","price": "149.99","inStock":true,"layout":"TKL","switches":"Brown switches","backlighting":"RGB","features":["Hot-swappable","Programmable","Anti-ghosting"],"compatibility":["Windows","macOS","Linux"]}]},{"id":22,"name":"Monitor 4K Ultra HD","category":"Electronics","price": "1299.99","inStock":true,"size":"32-inch","refresh_rate":"144Hz","panel":"OLED","HDR":true,"compatibility":["Windows","macOS","Linux"]}]},{"id":23,"name":"Tablet Pro 12.9","category":"Electronics","price": "999.99","inStock":true,"screen":"Liquid Retina","processor":"M2 chip","storage":"256GB","stylus":"Apple Pencil","compatibility":["iOS","iPadOS"]},{"id":24,"name":"Smart TV 65","category":"Electronics","price": "449.99","inStock":true,"resolution":"4K UHD","platform":["Roku","Amazon Fire TV","Google TV"],"hdr":true,"compatibility":["All major brands"]}]},{"id":25,"name":"Echo Show 8","category":"Electronics","price": "129.99","inStock":true,"display":"HD","screen":"10.1\"","voice_control":true,"compatibility":["Alexa","Amazon Echo","Google Assistant"]}]},{"id":26,"name":"Home Security System","category":"Electronics","price": "249.99","inStock":true,"includes":["Camera","Doorbell","Motion sensors","Siren"],"connectivity":["Wi-Fi","Ethernet","Cellular backup"],"compatibility":["Amazon","Ring","Nest","Arlo"]}]},{"id":27,"name":"Smart Thermostat","category":"Electronics","price": "149.99","inStock":true,"energy_efficient":true,"learning":true,"voice_control":true,"compatibility":["Nest","Ecobee","Honeywell"]},{"id":28,"name":"Video Doorbell","category":"Electronics","price": "99.99","inStock":true,"resolution":"1080p","two_way_audio":true,"motion_detection":true,"night_vision":true,"compatibility":["Ring","Nest","Arlo","Wyze"]},{"id":29,"name":"Robot Vacuum","category":"Electronics","price": "399.99","inStock":true","navigation":true,"app_support": true,"auto_charging":true,"compatibility":["iRobot","Shark","Roborock"]}]},{"id":30,"name":"Air Purifier","category":"Electronics","price": "199.99","inStock":true,"coverage": "500 sq ft","air_quality":true","app_control":true,"timer":true,"compatibility":["Dyson","Levoit","Blueair"]}]
}`
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="CODE" size="lg" />
            <div>
              <CardTitle>JSON Formatter</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Format, beautify, and validate JSON data with customizable options
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isValid && output && (
              <Badge variant="default" className="bg-green-500">
                <Icon name="CHECK_CIRCLE" size="sm" className="mr-1" />
                Formatted
              </Badge>
            )}
            {error && (
              <Badge variant="destructive">
                <Icon name="ERROR" size="sm" className="mr-1" />
                Error
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Format Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="indentation">Indentation: {formatOptions.indentation} spaces</Label>
              <Slider
                id="indentation"
                min={0}
                max={8}
                step={1}
                value={[formatOptions.indentation]}
                onValueChange={([value]) => setFormatOptions(prev => ({ ...prev, indentation: value[0] }))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-line-length">Max Line Length</Label>
              <input
                id="max-line-length"
                type="number"
                min={20}
                max={200}
                value={formatOptions.maxLineLength}
                onChange={(e) => setFormatOptions(prev => ({ ...prev, maxLineLength: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="space-y-4">
              <Label>Key Sorting</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sort-keys"
                    checked={formatOptions.sortKeys}
                    onCheckedChange={(checked) => setFormatOptions(prev => ({ ...prev, sortKeys: checked }))}
                  />
                  <Label htmlFor="sort-keys">Enable Key Sorting</Label>
                </div>

                {formatOptions.sortKeys && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sort-alphabetically"
                        checked={formatOptions.sortKeysAlphabetically}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, sortKeysAlphabetically: checked }))}
                      />
                      <Label htmlFor="sort-alphabetically">Alphabetical</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sort-by-type"
                        checked={formatOptions.sortKeysByType}
                        onCheckedChange={(checked) => setOptions(prev => ({ ...prev, sortKeysByType: checked }))}
                      />
                      <Label htmlFor="sort-by-type">By Type</Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-order">Custom Order (comma-separated)</Label>
                      <input
                        id="custom-order"
                        type="text"
                        value={formatOptions.sortKeysCustomOrder}
                        onChange={(e) => setOptions(prev => ({ ...prev, sortKeysCustomOrder: e.target.value }))}
                        placeholder="e.g., id, name, status, created"
                        className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Advanced Options</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="trailing-comma"
                    checked={formatOptions.trailingComma}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, trailingComma: checked }))}
                  />
                  <Label htmlFor="trailing-comma">Trailing Commas</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="quote-style"
                    checked={formatOptions.quoteStyle === 'single'}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, quoteStyle: checked ? 'single' : 'double' }))}
                  />
                  <Label htmlFor="quote-style">Single Quotes</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="object-brace-style"
                    checked={formatOptions.objectBraceStyle === 'new-line'}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, objectBraceStyle: checked ? 'new-line' : 'same-line' }))}
                  />
                  <Label htmlFor="object-brace-style">Object Brace Style</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="array-brace-style"
                    checked={formatOptions.arrayBraceStyle === 'new-line'}
                    onCheckedChange={(checked) => setOptions(prev => ({ ...prev, arrayBraceStyle: checked ? 'new-line' : 'same-line' }))}
                  />
                  <Label htmlFor="array-brace-style">Array Brace Style</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Editor and Output */}
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Input JSON</TabsTrigger>
              <TabsTrigger value="formatted">Formatted Output</TabsTrigger>
              <TabsTrigger value="samples">Samples</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="json-input">JSON Input</Label>
                <Textarea
                  id="json-input"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter JSON data to format..."
                  className="font-mono text-sm min-h-[400px]"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <Icon name="ERROR" size="sm" />
                  <AlertDescription>
                    <strong>Validation Error:</strong> {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleFormat} className="flex items-center gap-2">
                  <Icon name="FORMAT_ALIGN_LEFT" size="sm" />
                  Format JSON
                </Button>
                <Button onClick={handlePrettify} variant="outline" className="flex items-center gap-2">
                  <Icon name="AUTO_FIX_HIGH" size="sm" />
                  Prettify
                </Button>
                <Button onClick={handleCompress} variant="outline" className="flex items-center gap-2">
                  <Icon name="COMPRESS" size="sm" />
                  Compress
                </Button>
                <Button onClick={handleClear} variant="outline" className="flex items-center gap-2">
                  <Icon name="CLEAR" size="sm" />
                  Clear
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="formatted" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="json-output">Formatted Output</Label>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={!output}
                  >
                    <Icon name="CONTENT_COPY" size="sm" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  id="json-output"
                  value={output}
                  readOnly
                  placeholder="Formatted JSON will appear here..."
                  className="font-mono text-sm min-h-[400px]"
                />
              </div>

              {stats.formattedCharacters > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{stats.formattedLines}</div>
                      <p className="text-sm text-muted-foreground">Lines</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{formatFileSize(stats.formattedCharacters)}</div>
                      <p className="text-sm text-muted-foreground">Characters</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
              )}
            </TabsContent>

            <TabsContent value="samples" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sample JSON Data</h3>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Unformatted JSON</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Compact JSON without formatting
                      </p>
                      <Button
                        onClick={() => handleLoadSample(samples.unformatted)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Load Sample
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Nested Object</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Nested structure with properties and arrays
                      </p>
                      <Button
                        onClick={() => handleLoadSample(samples.nested)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Load Sample
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Large Dataset</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Large object with many properties
                      </p>
                      <Button
                        onClick={() => handleLoadSample(samples.large)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Load Sample
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
      </CardContent>
    </Card>
  );
}
