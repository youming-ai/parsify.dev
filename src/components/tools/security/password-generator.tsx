'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowsClockwise,
  CheckCircle,
  Clock,
  Copy,
  Database,
  Eye,
  EyeSlash,
  Info,
  Lock,
  Shield,
  ShieldCheck,
  ShieldSlash,
} from '@phosphor-icons/react';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customCharacters: string;
  useCustomOnly: boolean;
}

interface PasswordStrength {
  score: number;
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  color: string;
  feedback: string[];
  estimatedCrackTime: string;
  entropy: number;
}

const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordHistory, setPasswordHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
    customCharacters: '',
    useCustomOnly: false,
  });

  const similarChars = 'il1Lo0O';
  const ambiguousChars = '{}[]()/\\\'"`~,;.<>';

  const characterSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  };

  const generatePassword = useCallback(() => {
    let charset = '';

    if (options.useCustomOnly && options.customCharacters) {
      charset = options.customCharacters;
    } else {
      if (options.includeUppercase) charset += characterSets.uppercase;
      if (options.includeLowercase) charset += characterSets.lowercase;
      if (options.includeNumbers) charset += characterSets.numbers;
      if (options.includeSymbols) charset += characterSets.symbols;
    }

    if (options.excludeSimilar) {
      charset = charset
        .split('')
        .filter((char) => !similarChars.includes(char))
        .join('');
    }

    if (options.excludeAmbiguous) {
      charset = charset
        .split('')
        .filter((char) => !ambiguousChars.includes(char))
        .join('');
    }

    if (!charset) {
      setPassword('Error: No valid characters selected');
      return;
    }

    let newPassword = '';
    const array = new Uint32Array(options.length);
    crypto.getRandomValues(array);

    for (let i = 0; i < options.length; i++) {
      const randomValue = array[i];
      if (randomValue !== undefined) {
        const char = charset[randomValue % charset.length];
        if (char) newPassword += char;
      }
    }

    setPassword(newPassword);
    updatePasswordHistory(newPassword);
  }, [options]);

  const updatePasswordHistory = (newPassword: string) => {
    setPasswordHistory((prev) => {
      const updated = [newPassword, ...prev.filter((p) => p !== newPassword)].slice(0, 10);
      return updated;
    });
  };

  const analyzeStrength = useCallback((password: string): PasswordStrength => {
    if (!password || password.length === 0) {
      return {
        score: 0,
        level: 'Very Weak',
        color: 'bg-red-600',
        feedback: ['Please enter a password'],
        estimatedCrackTime: 'Instant',
        entropy: 0,
      };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length scoring
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 20;
    if (password.length >= 16) score += 20;
    if (password.length < 8) feedback.push('Password should be at least 8 characters long');

    // Character variety
    if (/[a-z]/.test(password)) score += 10;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 10;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 10;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 10;
    else feedback.push('Include special characters');

    // Pattern detection
    if (!/(.)\1{2,}/.test(password))
      score += 10; // No repeated characters
    else feedback.push('Avoid repeated characters');

    if (!/^[a-zA-Z]+$/.test(password) && !/^[0-9]+$/.test(password))
      score += 10; // Not just letters or numbers
    else feedback.push('Mix character types');

    // Common patterns
    const commonPatterns = ['123456', 'password', 'qwerty', 'admin', 'welcome'];
    const hasCommonPattern = commonPatterns.some((pattern) =>
      password.toLowerCase().includes(pattern.toLowerCase())
    );
    if (hasCommonPattern) {
      score -= 20;
      feedback.push('Avoid common patterns');
    }

    // Calculate entropy
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;

    const entropy = password.length * Math.log2(charsetSize);

    // Determine level and color
    let level: PasswordStrength['level'];
    let color: string;

    if (score >= 90) {
      level = 'Very Strong';
      color = 'bg-green-600';
    } else if (score >= 75) {
      level = 'Strong';
      color = 'bg-green-500';
    } else if (score >= 60) {
      level = 'Good';
      color = 'bg-yellow-600';
    } else if (score >= 45) {
      level = 'Fair';
      color = 'bg-yellow-500';
    } else if (score >= 30) {
      level = 'Weak';
      color = 'bg-orange-600';
    } else {
      level = 'Very Weak';
      color = 'bg-red-600';
    }

    // Estimate crack time
    const guessesPerSecond = 1000000000000; // 1 trillion guesses per second
    const combinations = charsetSize ** password.length;
    const secondsToCrack = combinations / (2 * guessesPerSecond);
    const crackTime = formatTime(secondsToCrack);

    return {
      score: Math.max(0, Math.min(100, score)),
      level,
      color,
      feedback: feedback.length > 0 ? feedback : ['Strong password!'],
      estimatedCrackTime: crackTime,
      entropy: Math.round(entropy),
    };
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds < 1) return 'Instant';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
    if (seconds < 315360000) return `${Math.round(seconds / 31536000)} years`;
    return 'Centuries';
  };

  useEffect(() => {
    generatePassword();
  }, []);

  useEffect(() => {
    if (password) {
      setStrength(analyzeStrength(password));
    }
  }, [password, analyzeStrength]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPasswordToClipboard = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Password Generator & Strength Checker
          </CardTitle>
          <CardDescription>
            Generate strong, secure passwords and analyze their strength in real-time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generated Password */}
          <div className="space-y-4">
            <Label className="font-medium text-lg">Generated Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-20 font-mono text-lg"
                  placeholder="Click Generate to create password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-translate-y-1/2 absolute top-1/2 right-1"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={copyToClipboard} className="px-4">
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button onClick={generatePassword} className="px-4">
                <ArrowsClockwise className="h-4 w-4" />
              </Button>
            </div>

            {/* Password Strength */}
            {strength && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Password Strength</span>
                  <Badge className={`${strength.color} border-0 text-white`}>
                    {strength.level}
                  </Badge>
                </div>
                <Progress value={strength.score} className="h-2 w-full" />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Crack Time: <strong>{strength.estimatedCrackTime}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Entropy: <strong>{strength.entropy} bits</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Score: <strong>{strength.score}/100</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback */}
            {strength && strength.feedback.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Recommendations:</strong>
                    <ul className="list-inside list-disc space-y-1">
                      {strength.feedback.map((feedback, index) => (
                        <li key={index} className="text-sm">
                          {feedback}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Configuration Options */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Options</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              {/* Length Slider */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Password Length</Label>
                  <Badge variant="outline">{options.length}</Badge>
                </div>
                <Slider
                  value={[options.length]}
                  onValueChange={(value) =>
                    setOptions((prev) => ({ ...prev, length: value[0] ?? prev.length }))
                  }
                  min={4}
                  max={128}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>4</span>
                  <span>16</span>
                  <span>32</span>
                  <span>64</span>
                  <span>128</span>
                </div>
              </div>

              {/* Character Types */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="uppercase"
                    checked={options.includeUppercase}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, includeUppercase: checked }))
                    }
                  />
                  <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="lowercase"
                    checked={options.includeLowercase}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, includeLowercase: checked }))
                    }
                  />
                  <Label htmlFor="lowercase">Lowercase (a-z)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="numbers"
                    checked={options.includeNumbers}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, includeNumbers: checked }))
                    }
                  />
                  <Label htmlFor="numbers">Numbers (0-9)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="symbols"
                    checked={options.includeSymbols}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, includeSymbols: checked }))
                    }
                  />
                  <Label htmlFor="symbols">Symbols (!@#$%)</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {/* Advanced Options */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="exclude-similar"
                    checked={options.excludeSimilar}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, excludeSimilar: checked }))
                    }
                  />
                  <Label htmlFor="exclude-similar">Exclude Similar ({similarChars})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="exclude-ambiguous"
                    checked={options.excludeAmbiguous}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, excludeAmbiguous: checked }))
                    }
                  />
                  <Label htmlFor="exclude-ambiguous">Exclude Ambiguous</Label>
                </div>
              </div>

              {/* Custom Characters */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="use-custom"
                    checked={options.useCustomOnly}
                    onCheckedChange={(checked) =>
                      setOptions((prev) => ({ ...prev, useCustomOnly: checked }))
                    }
                  />
                  <Label htmlFor="use-custom">Use Custom Characters Only</Label>
                </div>
                <Input
                  value={options.customCharacters}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, customCharacters: e.target.value }))
                  }
                  placeholder="Enter custom characters..."
                  disabled={!options.useCustomOnly}
                  className="font-mono"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Password History */}
      {passwordHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Passwords
            </CardTitle>
            <CardDescription>Click any password to copy it to clipboard</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {passwordHistory.map((pwd, index) => (
                  <div
                    key={index}
                    className="flex cursor-pointer items-center justify-between rounded-lg bg-muted p-2 transition-colors hover:bg-muted"
                    onClick={() => copyPasswordToClipboard(pwd)}
                  >
                    <code className="flex-1 truncate font-mono text-sm">{pwd}</code>
                    <div className="flex items-center gap-2">
                      {analyzeStrength(pwd).score >= 60 ? (
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                      ) : (
                        <ShieldSlash className="h-4 w-4 text-red-600" />
                      )}
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PasswordGenerator;
