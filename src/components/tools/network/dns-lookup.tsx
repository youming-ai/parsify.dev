'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { CircleNotch, Globe, HardDrives } from '@phosphor-icons/react';
import { useState } from 'react';

type RecordType = 'A' | 'AAAA' | 'MX' | 'TXT' | 'CNAME';

interface DNSAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export const DNSLookup = () => {
  const [domain, setDomain] = useState('example.com');
  const [recordType, setRecordType] = useState<RecordType>('A');
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<DNSAnswer[]>([]);
  const [error, setError] = useState('');

  const queryDns = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    setError('');
    try {
      const url = `https://dns.google/resolve?name=${encodeURIComponent(domain.trim())}&type=${recordType}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const payload = await response.json();
      setAnswers(payload.Answer || []);
      if (!payload.Answer || payload.Answer.length === 0) {
        setError('No records returned for this query.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
      setAnswers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <HardDrives className="h-5 w-5" /> DNS Lookup
        </CardTitle>
        <CardDescription>
          Resolve DNS records (A, AAAA, MX, TXT, CNAME) with one click.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Record Type</Label>
            <Select
              value={recordType}
              onValueChange={(value) => setRecordType(value as RecordType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Record" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="AAAA">AAAA</SelectItem>
                <SelectItem value="MX">MX</SelectItem>
                <SelectItem value="TXT">TXT</SelectItem>
                <SelectItem value="CNAME">CNAME</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={queryDns} disabled={loading}>
          {loading ? (
            <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Globe className="mr-2 h-4 w-4" />
          )}
          Lookup
        </Button>

        {error && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label>Results</Label>
          <Textarea
            readOnly
            className="min-h-[220px] font-mono"
            value={
              answers.length === 0
                ? 'No results yet'
                : answers
                    .map((answer) => `${answer.name} ${answer.TTL}s -> ${answer.data}`)
                    .join('\n')
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DNSLookup;
