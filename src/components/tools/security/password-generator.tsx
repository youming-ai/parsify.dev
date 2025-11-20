/**
 * Password Generator
 * Generate secure passwords with customizable complexity, length, and character sets
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Copy, Shield, Eye, EyeOff, Settings, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  customCharacters: string;
}

interface PasswordStrength {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  entropy: number;
}

const DEFAULT_OPTIONS: PasswordOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: false,
  excludeSimilar: false,
  excludeAmbiguous: false,
  customCharacters: '',
};

const PASSWORD_PRESETS = [
  {
    name: 'PIN Code',
    options: { ...DEFAULT_OPTIONS, length: 4, includeUppercase: false, includeLowercase: false, includeSymbols: false },
  },
  {
    name: 'Simple',
    options: { ...DEFAULT_OPTIONS, length: 8, includeSymbols: false, excludeSimilar: false, excludeAmbiguous: false },
  },
  {
    name: 'Strong',
    options: { ...DEFAULT_OPTIONS, length: 16, includeSymbols: true, excludeSimilar: true, excludeAmbiguous: false },
  },
  {
    name: 'Very Strong',
    options: { ...DEFAULT_OPTIONS, length: 24, includeSymbols: true, excludeSimilar: true, excludeAmbiguous: true },
  },
  {
    name: 'Maximum Security',
    options: { ...DEFAULT_OPTIONS, length: 32, includeSymbols: true, excludeSimilar: true, excludeAmbiguous: true },
  }
];

const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'ilLo01O',
  ambiguous: '{}[]()<>;/\\\'"`~',
};

export const PasswordGenerator: React.FC = () => {
  const [password, setPassword] = useState('');
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);
  const [passwordHistory, setPasswordHistory] = useState<string[]>([]);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customCharset, setCustomCharset] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Generate random bytes using Web Crypto API
  const getRandomBytes = (length: number): Uint8Array => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  };

  // Calculate password entropy
  const calculateEntropy = useCallback((password: string, opts: PasswordOptions): number => {
    let charsetSize = 0;

    if (opts.includeUppercase) charsetSize += CHARACTER_SETS.uppercase.length;
    if (opts.includeLowercase) charsetSize += CHARACTER_SETS.lowercase.length;
    if (opts.includeNumbers) charsetSize += CHARACTER_SETS.numbers.length;
    if (opts.includeSymbols) charsetSize += CHARACTER_SETS.symbols.length;
    if (opts.customCharacters) charsetSize += opts.customCharacters.length;

    if (charsetSize === 0) return 0;

    const entropy = password.length * Math.log2(charsetSize);
    return Math.round(entropy * 100) / 100; // Round to 2 decimal places
  }, []);

  // Analyze password strength
  const analyzeStrength = useCallback((password: string, opts: PasswordOptions): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    // Length scoring
    if (password.length < 8) {
      feedback.push('Password is too short (minimum 8 characters recommended)');
      score += 10;
    } else if (password.length < 12) {
      feedback.push('Consider using a longer password (12+ characters recommended)');
      score += 30;
    } else if (password.length >= 16) {
      score += 40;
    } else {
      score += 35;
    }

    // Character variety scoring
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[^A-Za-z0-9]/.test(password);

    const varietyCount = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;

    if (varietyCount === 4) {
      score += 30;
    } else if (varietyCount === 3) {
      score += 25;
    } else if (varietyCount === 2) {
      score += 15;
      feedback.push('Add more character types for better security');
    } else {
      feedback.push('Use multiple character types (uppercase, lowercase, numbers, symbols)');
      score += 5;
    }

    // Common patterns
    const commonPatterns = [
      /123/i, /abc/i, /qwerty/i, /password/i, /admin/i,
      /(.)\1{2,}/i, // Repeated characters
      /^(.)\1+$/i, // All same character
      /012/i, /987/i
    ];

    for (const pattern of commonPatterns) {
      if (pattern.test(password)) {
        score -= 20;
        feedback.push('Avoid common patterns and sequences');
        break;
      }
    }

    // Entropy calculation
    const entropy = calculateEntropy(password, opts);

    let level: PasswordStrength['level'];
    if (score >= 80 || entropy >= 60) {
      level = 'very-strong';
    } else if (score >= 65 || entropy >= 50) {
      level = 'strong';
    } else if (score >= 45 || entropy >= 35) {
      level = 'good';
    } else if (score >= 25 || entropy >= 20) {
      level = 'fair';
    } else {
      level = 'weak';
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      level,
      feedback,
      entropy
    };
  }, [calculateEntropy]);

  // Build character set based on options
  const buildCharacterSet = useCallback((opts: PasswordOptions): string => {
    let charset = '';

    if (opts.includeUppercase) {
      charset += CHARACTER_SETS.uppercase;
    }
    if (opts.includeLowercase) {
      charset += CHARACTER_SETS.lowercase;
    }
    if (opts.includeNumbers) {
      charset += CHARACTER_SETS.numbers;
    }
    if (opts.includeSymbols) {
      charset += CHARACTER_SETS.symbols;
    }
    if (opts.customCharacters) {
      charset += opts.customCharacters;
    }

    if (opts.excludeSimilar) {
      charset = charset.split('').filter(char => !CHARACTER_SETS.similar.includes(char)).join('');
    }

    if (opts.excludeAmbiguous) {
      charset = charset.split('').filter(char => !CHARACTER_SETS.ambiguous.includes(char)).join('');
    }

    return charset;
  }, []);

  // Generate password
  const generatePassword = useCallback(() => {
    const charset = buildCharacterSet(options);

    if (charset.length === 0) {
      setStrength({
        score: 0,
        level: 'weak',
        feedback: ['No character sets selected'],
        entropy: 0
      });
      return;
    }

    const randomBytes = getRandomBytes(options.length);
    let newPassword = '';

    for (let i = 0; i < options.length; i++) {
      const randomIndex = randomBytes[i] % charset.length;
      newPassword += charset[randomIndex];
    }

    setPassword(newPassword);
    const newStrength = analyzeStrength(newPassword, options);
    setStrength(newStrength);

    // Add to history (keep last 10)
    setPasswordHistory(prev => {
      const updated = [newPassword, ...prev.filter(p => p !== newPassword)].slice(0, 10);
      return updated;
    });
  }, [options, buildCharacterSet, analyzeStrength]);

  // Generate password on mount and when options change
  useEffect(() => {
    generatePassword();
  }, [options.length]); // Only regenerate when length changes

  // Copy password to clipboard
  const copyToClipboard = async (text: string, index?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index ?? null);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Apply preset
  const applyPreset = (preset: typeof PASSWORD_PRESETS[0]) => {
    setOptions(preset.options);
  };

  // Get strength color
  const getStrengthColor = (level: PasswordStrength['level']) => {
    switch (level) {
      case 'very-strong': return 'text-green-600';
      case 'strong': return 'text-blue-600';
      case 'good': return 'text-yellow-600';
      case 'fair': return 'text-orange-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get strength badge variant
  const getStrengthBadgeVariant = (level: PasswordStrength['level']) => {
    switch (level) {
      case 'very-strong': return 'default';
      case 'strong': return 'secondary';
      case 'good': return 'outline';
      case 'fair': return 'secondary';
      case 'weak': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Generated Password
            </span>
            <div className="flex items-center gap-2">
              {strength && (
                <Badge variant={getStrengthBadgeVariant(strength.level)} className={getStrengthColor(strength.level)}>
                  {strength.level.replace('-', ' ')} ({strength.score}/100)
                </Badge>
              )}
              {strength && (
                <Badge variant="outline">
                  {strength.entropy} bits entropy
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  readOnly
                  className="font-mono text-lg pr-10"
                  placeholder="Click Generate to create a password"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(password)}
              >
                {copiedIndex === null ? (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                )}
              </Button>
              <Button onClick={generatePassword} className="bg-blue-600 hover:bg-blue-700">
                <RefreshCw className="w-4 h-4 mr-1" />
                Generate
              </Button>
            </div>

            {strength && strength.feedback.length > 0 && (
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {strength.feedback.map((feedback, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <X className="h-3 w-3 text-orange-500" />
                        {feedback}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="options" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Options Tab */}
        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Password Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Length Slider */}
              <div>
                <Label>Length: {options.length}</Label>
                <Slider
                  value={[options.length]}
                  onValueChange={([value]) => setOptions(prev => ({ ...prev, length: value }))}
                  min={4}
                  max={64}
                  step={1}
                  className="mt-2"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>4</span>
                  <span>64</span>
                </div>
              </div>

              {/* Character Options */}
              <div className="space-y-4">
                <Label>Character Types</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
                    <Switch
                      id="uppercase"
                      checked={options.includeUppercase}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeUppercase: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lowercase">Lowercase (a-z)</Label>
                    <Switch
                      id="lowercase"
                      checked={options.includeLowercase}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLowercase: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="numbers">Numbers (0-9)</Label>
                    <Switch
                      id="numbers"
                      checked={options.includeNumbers}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="symbols">Symbols (!@#$%^&*)</Label>
                    <Switch
                      id="symbols"
                      checked={options.includeSymbols}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSymbols: checked }))}
                    />
                  </div>
                </div>
              </div>

              {/* Custom Characters */}
              <div>
                <Label htmlFor="custom-chars">Custom Characters</Label>
                <Input
                  id="custom-chars"
                  value={customCharset}
                  onChange={(e) => setCustomCharset(e.target.value)}
                  onBlur={(e) => setOptions(prev => ({ ...prev, customCharacters: e.target.value }))}
                  placeholder="Enter custom characters to include..."
                  className="font-mono text-sm"
                />
              </div>

              {/* Exclusions */}
              <div className="space-y-4">
                <Label>Exclusions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="exclude-similar">Exclude Similar (i, l, L, 1, 0, O)</Label>
                    <Switch
                      id="exclude-similar"
                      checked={options.excludeSimilar}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeSimilar: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="exclude-ambiguous">Exclude Ambiguous ({, }, [ ], ( ), <, >)</Label>
                    <Switch
                      id="exclude-ambiguous"
                      checked={options.excludeAmbiguous}
                      onCheckedChange={(checked) => setOptions(prev => ({ ...prev, excludeAmbiguous: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOptions(DEFAULT_OPTIONS)}>
                  Reset to Default
                </Button>
                <Button onClick={generatePassword}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Generate New Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets">
          <Card>
            <CardHeader>
              <CardTitle>Password Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PASSWORD_PRESETS.map((preset) => (
                  <Card key={preset.name} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{preset.name}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>Length: {preset.options.length}</div>
                        <div>Uppercase: {preset.options.includeUppercase ? 'Yes' : 'No'}</div>
                        <div>Lowercase: {preset.options.includeLowercase ? 'Yes' : 'No'}</div>
                        <div>Numbers: {preset.options.includeNumbers ? 'Yes' : 'No'}</div>
                        <div>Symbols: {preset.options.includeSymbols ? 'Yes' : 'No'}</div>
                        <div>Exclude Similar: {preset.options.excludeSimilar ? 'Yes' : 'No'}</div>
                      </div>
                      <Button
                        className="w-full mt-3"
                        variant="outline"
                        onClick={() => applyPreset(preset)}
                      >
                        Apply Preset
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Password History</CardTitle>
            </CardHeader>
            <CardContent>
              {passwordHistory.length > 0 ? (
                <div className="space-y-2">
                  {passwordHistory.map((pass, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <code className="flex-1 font-mono text-sm truncate">{pass}</code>
                      <Badge variant="outline" className="text-xs">
                        {pass.length} chars
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(pass, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPassword(pass)}
                      >
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No passwords generated yet. Click "Generate" to create your first password.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
