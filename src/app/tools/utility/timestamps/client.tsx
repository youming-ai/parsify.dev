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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowRightLeft,
  Calendar,
  CheckCircle,
  Clock,
  Copy,
  Download,
  Globe,
  RefreshCw,
  TrendingUp,
  Upload,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ConversionResult {
  timestamp: number;
  date: string;
  timezone: string;
  isValid: boolean;
  error?: string;
  inputType: 'timestamp' | 'date';
}

interface BatchResult {
  original: string;
  converted: string;
  isValid: boolean;
  error?: string;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC', offset: 0 },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: -5 },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: -6 },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: -7 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -8 },
  { value: 'Europe/London', label: 'London', offset: 0 },
  { value: 'Europe/Paris', label: 'Paris', offset: 1 },
  { value: 'Europe/Berlin', label: 'Berlin', offset: 1 },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: 9 },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: 8 },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 10 },
];

export default function TimestampConverterClient() {
  const [timestamp, setTimestamp] = useState('');
  const [date, setDate] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timezone, setTimezone] = useState('UTC');
  const [dateFormat, setDateFormat] = useState('iso');
  const [useMilliseconds, setUseMilliseconds] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [batchInput, setBatchInput] = useState('');
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [_copied, setCopied] = useState(false);
  const [_isProcessing, _setIsProcessing] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getCurrentTimestamp = (): number => {
    return useMilliseconds ? Date.now() : Math.floor(Date.now() / 1000);
  };

  const formatDate = (date: Date, format: string, tz: string): string => {
    try {
      const options: Intl.DateTimeFormatOptions = {};

      switch (format) {
        case 'iso':
          return date.toISOString();
        case 'local':
          options.year = 'numeric';
          options.month = '2-digit';
          options.day = '2-digit';
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.second = '2-digit';
          options.timeZone = tz;
          break;
        case 'readable':
          options.year = 'numeric';
          options.month = 'long';
          options.day = 'numeric';
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.second = '2-digit';
          options.timeZoneName = 'short';
          options.timeZone = tz;
          break;
        case 'custom':
          options.year = 'numeric';
          options.month = '2-digit';
          options.day = '2-digit';
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.second = '2-digit';
          options.timeZone = tz;
          break;
        default:
          return date.toISOString();
      }

      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch (_error) {
      return date.toISOString();
    }
  };

  const parseTimestamp = (input: string): number | null => {
    const cleanInput = input.trim();

    if (!cleanInput) return null;

    const num = Number.parseInt(cleanInput, 10);
    if (Number.isNaN(num)) return null;

    // Determine if it's milliseconds or seconds
    if (useMilliseconds) {
      return num;
    }
    // Check if it looks like milliseconds (13+ digits)
    return cleanInput.length >= 13 ? num : num;
  };

  const parseDate = (input: string): Date | null => {
    try {
      const cleanInput = input.trim();
      if (!cleanInput) return null;

      // Try parsing as ISO string first
      let date = new Date(cleanInput);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }

      // Try parsing as MM/DD/YYYY, DD/MM/YYYY, etc.
      const dateRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
      const match = cleanInput.match(dateRegex);

      if (match) {
        const [, month, day, year, hour, minute, second] = match;
        date = new Date(
          Number.parseInt(year, 10),
          Number.parseInt(month, 10) - 1,
          Number.parseInt(day, 10),
          hour ? Number.parseInt(hour, 10) : 0,
          minute ? Number.parseInt(minute, 10) : 0,
          second ? Number.parseInt(second, 10) : 0
        );

        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }

      return null;
    } catch (_error) {
      return null;
    }
  };

  const convertTimestampToDate = () => {
    const ts = parseTimestamp(timestamp);
    if (ts === null) {
      setResult({
        timestamp: 0,
        date: '',
        timezone,
        isValid: false,
        error: 'Invalid timestamp format',
        inputType: 'timestamp',
      });
      return;
    }

    const date = new Date(ts * (useMilliseconds ? 1 : 1000));
    const formattedDate = formatDate(date, dateFormat, timezone);

    setResult({
      timestamp: ts,
      date: formattedDate,
      timezone,
      isValid: true,
      inputType: 'timestamp',
    });
  };

  const convertDateToTimestamp = () => {
    const parsedDate = parseDate(date);
    if (parsedDate === null) {
      setResult({
        timestamp: 0,
        date: '',
        timezone,
        isValid: false,
        error: 'Invalid date format',
        inputType: 'date',
      });
      return;
    }

    const ts = useMilliseconds ? parsedDate.getTime() : Math.floor(parsedDate.getTime() / 1000);

    setResult({
      timestamp: ts,
      date: formatDate(parsedDate, dateFormat, timezone),
      timezone,
      isValid: true,
      inputType: 'date',
    });
  };

  const useCurrentTime = () => {
    const ts = getCurrentTimestamp();
    const date = new Date(ts * (useMilliseconds ? 1 : 1000));

    setTimestamp(ts.toString());
    setDate(formatDate(date, 'local', timezone));

    setResult({
      timestamp: ts,
      date: formatDate(date, dateFormat, timezone),
      timezone,
      isValid: true,
      inputType: 'timestamp',
    });
  };

  const _swapInputs = () => {
    setTimestamp(date);
    setDate(timestamp);
    setResult(null);
  };

  const processBatch = () => {
    const lines = batchInput.split('\n').filter((line) => line.trim());
    const results: BatchResult[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Try to parse as timestamp first
      const ts = parseTimestamp(trimmedLine);
      if (ts !== null) {
        const date = new Date(ts * (useMilliseconds ? 1 : 1000));
        results.push({
          original: trimmedLine,
          converted: formatDate(date, dateFormat, timezone),
          isValid: true,
        });
        continue;
      }

      // Try to parse as date
      const date = parseDate(trimmedLine);
      if (date !== null) {
        const ts = useMilliseconds ? date.getTime() : Math.floor(date.getTime() / 1000);
        results.push({
          original: trimmedLine,
          converted: ts.toString(),
          isValid: true,
        });
        continue;
      }

      results.push({
        original: trimmedLine,
        converted: '',
        isValid: false,
        error: 'Invalid format',
      });
    }

    setBatchResults(results);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getCurrentTimeDisplay = () => {
    return formatDate(currentTime, 'readable', timezone);
  };

  const getCurrentTimestampDisplay = () => {
    return useMilliseconds ? currentTime.getTime() : Math.floor(currentTime.getTime() / 1000);
  };

  const getRelativeTime = (ts: number): string => {
    const now = Date.now();
    const diff = ts - now;
    const absDiff = Math.abs(diff);

    if (absDiff < 60000) {
      // Less than 1 minute
      return diff < 0
        ? `${Math.floor(absDiff / 1000)} seconds ago`
        : `in ${Math.floor(absDiff / 1000)} seconds`;
    }
    if (absDiff < 3600000) {
      // Less than 1 hour
      return diff < 0
        ? `${Math.floor(absDiff / 60000)} minutes ago`
        : `in ${Math.floor(absDiff / 60000)} minutes`;
    }
    if (absDiff < 86400000) {
      // Less than 1 day
      return diff < 0
        ? `${Math.floor(absDiff / 3600000)} hours ago`
        : `in ${Math.floor(absDiff / 3600000)} hours`;
    }
    return diff < 0
      ? `${Math.floor(absDiff / 86400000)} days ago`
      : `in ${Math.floor(absDiff / 86400000)} days`;
  };

  return (
    <div className="space-y-6">
      {/* Current Time Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Current Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-muted p-4">
              <div className="mb-1 font-medium text-muted-foreground text-sm">Timestamp</div>
              <div className="font-mono text-lg">{getCurrentTimestampDisplay()}</div>
              <div className="text-muted-foreground text-xs">
                {useMilliseconds ? 'milliseconds' : 'seconds'} since epoch
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="mb-1 font-medium text-muted-foreground text-sm">Human Time</div>
              <div className="text-lg">{getCurrentTimeDisplay()}</div>
              <div className="text-muted-foreground text-xs">{timezone}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={useCurrentTime} className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Use Current Time
            </Button>
            <Button
              variant="outline"
              onClick={() => setUseMilliseconds(!useMilliseconds)}
              className="flex items-center gap-2"
            >
              {useMilliseconds ? 'Switch to Seconds' : 'Switch to Milliseconds'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Tools */}
      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single Conversion</TabsTrigger>
          <TabsTrigger value="batch">Batch Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Timestamp to Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timestamp to Date
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Unix Timestamp</Label>
                  <Input
                    placeholder="Enter timestamp..."
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-muted-foreground text-xs">
                    {useMilliseconds ? 'Milliseconds since epoch' : 'Seconds since epoch'}
                  </p>
                </div>
                <Button
                  onClick={convertTimestampToDate}
                  disabled={!timestamp.trim()}
                  className="w-full"
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Convert to Date
                </Button>
              </CardContent>
            </Card>

            {/* Date to Timestamp */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Date to Timestamp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-muted-foreground text-xs">
                    Format: YYYY-MM-DD HH:MM:SS or ISO format
                  </p>
                </div>
                <Button onClick={convertDateToTimestamp} disabled={!date.trim()} className="w-full">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Convert to Timestamp
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Conversion Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iso">ISO 8601</SelectItem>
                      <SelectItem value="local">Local Format</SelectItem>
                      <SelectItem value="readable">Human Readable</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <Switch
                  id="milliseconds"
                  checked={useMilliseconds}
                  onCheckedChange={setUseMilliseconds}
                />
                <Label htmlFor="milliseconds">Use Milliseconds</Label>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Result */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {result.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Conversion Result
                  </span>
                  <Badge variant={result.isValid ? 'default' : 'destructive'}>
                    {result.isValid ? 'Success' : 'Error'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.isValid ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-muted p-4">
                        <div className="mb-1 font-medium text-muted-foreground text-sm">
                          {result.inputType === 'timestamp'
                            ? 'Input Timestamp'
                            : 'Output Timestamp'}
                        </div>
                        <div className="font-mono text-lg">{result.timestamp}</div>
                        <div className="text-muted-foreground text-xs">
                          {useMilliseconds ? 'milliseconds' : 'seconds'}
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted p-4">
                        <div className="mb-1 font-medium text-muted-foreground text-sm">
                          {result.inputType === 'date' ? 'Input Date' : 'Output Date'}
                        </div>
                        <div className="break-all font-mono text-lg">{result.date}</div>
                        <div className="text-muted-foreground text-xs">{result.timezone}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        {getRelativeTime(result.timestamp * (useMilliseconds ? 1 : 1000))}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(result.timestamp.toString())}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Timestamp
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(result.date)}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Date
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Conversion Error:</strong> {result.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Batch Conversion
              </CardTitle>
              <CardDescription>
                Convert multiple timestamps or dates at once. One per line.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Input (one per line)</Label>
                <Textarea
                  placeholder="Enter timestamps or dates, one per line..."
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value)}
                  className="min-h-32 font-mono text-sm"
                />
              </div>
              <Button onClick={processBatch} disabled={!batchInput.trim()} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Process Batch
              </Button>
            </CardContent>
          </Card>

          {batchResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Batch Results</span>
                  <Badge variant="secondary">
                    {batchResults.filter((r) => r.isValid).length}/{batchResults.length} successful
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {batchResults.map((result) => (
                    <div
                      key={result.original}
                      className={`rounded-lg border p-3 ${result.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="break-all font-mono text-sm">{result.original}</div>
                          {result.converted && (
                            <div className="mt-1 break-all font-mono text-muted-foreground text-sm">
                              → {result.converted}
                            </div>
                          )}
                          {result.error && (
                            <div className="mt-1 text-red-600 text-sm">Error: {result.error}</div>
                          )}
                        </div>
                        {result.isValid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.converted)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(
                        batchResults
                          .filter((r) => r.isValid)
                          .map((r) => `${r.original} → ${r.converted}`)
                          .join('\n')
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Copy All Results
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
