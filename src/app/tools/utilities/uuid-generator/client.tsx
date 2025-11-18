"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Copy,
  RefreshCw,
  Hash,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
} from "lucide-react";

interface UUIDItem {
  id: string;
  value: string;
  version: "v1" | "v4" | "guid";
  timestamp: number;
}

export default function UUIDGeneratorClient() {
  const [version, setVersion] = useState<"v1" | "v4" | "guid">("v4");
  const [quantity, setQuantity] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [includeHyphens, setIncludeHyphens] = useState(true);
  const [uuids, setUuids] = useState<UUIDItem[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const generateUUIDv4 = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const generateUUIDv1 = (): string => {
    // Simplified UUID v1 implementation (time-based)
    const timestamp = Date.now();
    const timeHex = timestamp.toString(16).padStart(12, "0");
    const clockSeq = Math.random().toString(16).substr(2, 4);
    const node = Math.random().toString(16).substr(2, 12);

    return `${timeHex.substr(0, 8)}-${timeHex.substr(8, 4)}-1${timeHex.substr(12, 3)}-${clockSeq}-${node}`;
  };

  const generateGUID = (): string => {
    // GUID is essentially the same format as UUID
    return generateUUIDv4();
  };

  const generateUUID = (): string => {
    let uuid: string;

    switch (version) {
      case "v1":
        uuid = generateUUIDv1();
        break;
      case "guid":
        uuid = generateGUID();
        break;
      case "v4":
      default:
        uuid = generateUUIDv4();
        break;
    }

    if (uppercase) {
      uuid = uuid.toUpperCase();
    }

    if (!includeHyphens) {
      uuid = uuid.replace(/-/g, "");
    }

    return uuid;
  };

  const generateUUIDs = () => {
    const newUuids: UUIDItem[] = [];
    for (let i = 0; i < quantity; i++) {
      newUuids.push({
        id: Date.now().toString() + Math.random().toString(36),
        value: generateUUID(),
        version,
        timestamp: Date.now(),
      });
    }
    setUuids(newUuids);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const copyAll = async () => {
    const allUuids = uuids.map((uuid) => uuid.value).join("\n");
    if (allUuids) {
      await copyToClipboard(allUuids, "all");
    }
  };

  const validateUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const getVersionFromUUID = (uuid: string): string => {
    const parts = uuid.split("-");
    if (parts.length >= 3) {
      const versionChar = parts[2][0];
      return `v${versionChar}`;
    }
    return "Unknown";
  };

  useEffect(() => {
    generateUUIDs();
  }, []);

  const getVersionInfo = (ver: string) => {
    switch (ver) {
      case "v1":
        return {
          name: "UUID v1",
          description: "Time-based with MAC address",
          icon: Clock,
          color: "blue",
        };
      case "v4":
        return {
          name: "UUID v4",
          description: "Random numbers",
          icon: Hash,
          color: "green",
        };
      case "guid":
        return {
          name: "GUID",
          description: "Microsoft UUID variant",
          icon: Shield,
          color: "purple",
        };
      default:
        return {
          name: "UUID",
          description: "Universal Unique ID",
          icon: Hash,
          color: "gray",
        };
    }
  };

  const versionInfo = getVersionInfo(version);
  const VersionIcon = versionInfo.icon;

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <VersionIcon className="h-5 w-5" />
            Generator Configuration
          </CardTitle>
          <CardDescription>Customize your UUID generation settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>UUID Version</Label>
              <div className="flex gap-2">
                {(["v1", "v4", "guid"] as const).map((ver) => {
                  const info = getVersionInfo(ver);
                  const Icon = info.icon;
                  return (
                    <Button
                      key={ver}
                      variant={version === ver ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVersion(ver)}
                      className="flex items-center gap-1"
                    >
                      <Icon className="h-3 w-3" />
                      {info.name}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{versionInfo.description}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.min(100, quantity + 1))}
                  disabled={quantity >= 100}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Generate 1-100 UUIDs at once</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="uppercase" checked={uppercase} onCheckedChange={setUppercase} />
              <Label htmlFor="uppercase">Uppercase</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="hyphens" checked={includeHyphens} onCheckedChange={setIncludeHyphens} />
              <Label htmlFor="hyphens">Include Hyphens</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateUUIDs} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Generate {quantity} {versionInfo.name}
              {quantity !== 1 ? "s" : ""}
            </Button>
            {uuids.length > 0 && (
              <Button variant="outline" onClick={copyAll} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                {copied === "all" ? "Copied!" : "Copy All"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      {uuids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated UUIDs</span>
              <Badge variant="secondary">{uuids.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uuids.map((uuid) => (
                <div
                  key={uuid.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="text-xs">
                      {uuid.version.toUpperCase()}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {validateUUID(uuid.value) ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <code className="font-mono text-sm break-all">{uuid.value}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(uuid.value, uuid.id)}
                    >
                      <Copy className="h-3 w-3" />
                      {copied === uuid.id ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {uuids.length > 1 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-2">
                  All {uuids.length} UUIDs ready to copy:
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <code className="text-xs break-all">
                    {uuids.map((uuid) => uuid.value).join("\n")}
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>UUID Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Format</h4>
              <code className="text-sm text-muted-foreground">
                xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
              </code>
              <p className="text-xs text-muted-foreground mt-2">32 hexadecimal characters</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Uniqueness</h4>
              <p className="text-2xl font-bold text-blue-600">2¹²⁸</p>
              <p className="text-xs text-muted-foreground mt-2">Possible combinations</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Collision Chance</h4>
              <p className="text-lg font-bold text-green-600">~0%</p>
              <p className="text-xs text-muted-foreground mt-2">Practically impossible</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
