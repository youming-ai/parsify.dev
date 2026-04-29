'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PrivacyNotice } from '@/components/ui/privacy-notice';
import { useState } from 'react';

interface APIKeyInputProps {
  provider: string;
  value: string;
  onValueChange: (value: string) => void;
}

export function APIKeyInput({ provider, value, onValueChange }: APIKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <PrivacyNotice
        message={`Your ${provider} API key never leaves your browser. It is stored in memory only and cleared when you close the tab.`}
      />
      <div className="space-y-2">
        <Label>{provider} API key</Label>
        <div className="flex gap-2">
          <Input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Key stays in your browser"
          />
          <Button type="button" variant="outline" onClick={() => setVisible((current) => !current)}>
            {visible ? 'Hide' : 'Show'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onValueChange('')}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
