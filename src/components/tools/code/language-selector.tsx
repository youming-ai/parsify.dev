'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BracketsCurly,
  CaretDown,
  Code,
  Database,
  FileCode,
  TerminalWindow,
} from '@phosphor-icons/react';
import * as React from 'react';
import type { CodeLanguage, LanguageSelectorProps } from './code-types';
import { LANGUAGE_CONFIGS, getLanguageConfig } from './language-configs';

// Language categories for organization
const LANGUAGE_CATEGORIES = {
  Popular: ['javascript', 'typescript', 'python', 'java'],
  Web: ['javascript', 'typescript', 'php'],
  Systems: ['c', 'cpp', 'rust', 'go'],
  Mobile: ['swift', 'kotlin'],
  Enterprise: ['java', 'csharp', 'scala'],
  Scripting: ['python', 'ruby', 'bash', 'powershell'],
  Data: ['sql', 'python', 'r'],
  Other: ['go', 'rust', 'scala'],
};

const LANGUAGE_ICONS: Record<string, React.ReactNode> = {
  javascript: <BracketsCurly className="h-4 w-4" />,
  typescript: <Code className="h-4 w-4" />,
  python: <TerminalWindow className="h-4 w-4" />,
  java: <FileCode className="h-4 w-4" />,
  cpp: <Code className="h-4 w-4" />,
  c: <Code className="h-4 w-4" />,
  csharp: <FileCode className="h-4 w-4" />,
  go: <Code className="h-4 w-4" />,
  rust: <Code className="h-4 w-4" />,
  php: <FileCode className="h-4 w-4" />,
  ruby: <TerminalWindow className="h-4 w-4" />,
  swift: <Code className="h-4 w-4" />,
  kotlin: <Code className="h-4 w-4" />,
  bash: <TerminalWindow className="h-4 w-4" />,
  powershell: <TerminalWindow className="h-4 w-4" />,
  sql: <Database className="h-4 w-4" />,
};

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  showVersion = true,
  compact = false,
  className,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedConfig = getLanguageConfig(selectedLanguage);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter languages based on search and category
  const filteredLanguages = React.useMemo(() => {
    const languages = Object.keys(LANGUAGE_CONFIGS) as CodeLanguage[];

    let filtered = languages;

    // Filter by category
    if (selectedCategory !== 'All') {
      const categoryLanguages =
        LANGUAGE_CATEGORIES[selectedCategory as keyof typeof LANGUAGE_CATEGORIES] || [];
      filtered = filtered.filter((lang) => categoryLanguages.includes(lang));
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((lang) => {
        const config = getLanguageConfig(lang);
        return (
          config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lang.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return filtered;
  }, [searchTerm, selectedCategory]);

  const handleLanguageSelect = (language: CodeLanguage) => {
    onLanguageChange(language);
    setIsOpen(false);
    setSearchTerm('');
    setSelectedCategory('All');
  };

  if (compact) {
    return (
      <div className={cn('relative', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2"
        >
          {LANGUAGE_ICONS[selectedLanguage]}
          <span>{selectedConfig.name}</span>
          <CaretDown className="h-3 w-3" />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-md border bg-white shadow-lg dark:bg-card">
            {filteredLanguages.map((language) => {
              const config = getLanguageConfig(language);
              return (
                <button
                  type="button"
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted dark:hover:bg-secondary',
                    selectedLanguage === language &&
                      'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  )}
                >
                  {LANGUAGE_ICONS[language]}
                  <span className="text-sm">{config.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2">
          {LANGUAGE_ICONS[selectedLanguage]}
          <span className="font-medium">{selectedConfig.name}</span>
          {showVersion && (
            <Badge variant="secondary" className="text-xs">
              v{selectedConfig.version}
            </Badge>
          )}
        </div>
        <CaretDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-96 overflow-hidden rounded-lg border bg-white shadow-lg dark:bg-card">
          {/* Search Bar */}
          <div className="border-b p-3">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex overflow-x-auto border-b">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={cn(
                'whitespace-nowrap border-b-2 px-3 py-2 font-medium text-sm transition-colors',
                selectedCategory === 'All'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200'
              )}
            >
              All Languages
            </button>
            {Object.keys(LANGUAGE_CATEGORIES).map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'whitespace-nowrap border-b-2 px-3 py-2 font-medium text-sm transition-colors',
                  selectedCategory === category
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-gray-200'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Language List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground dark:text-muted-foreground">
                No languages found
              </div>
            ) : (
              <div className="p-2">
                {filteredLanguages.map((language) => {
                  const config = getLanguageConfig(language);
                  return (
                    <button
                      type="button"
                      key={language}
                      onClick={() => handleLanguageSelect(language)}
                      className={cn(
                        'group flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-muted dark:hover:bg-secondary',
                        selectedLanguage === language &&
                          'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {LANGUAGE_ICONS[language]}
                        <div>
                          <div className="font-medium">{config.name}</div>
                          <div className="text-muted-foreground text-xs dark:text-muted-foreground">
                            {config.extensions.join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {showVersion && (
                          <Badge variant="outline" className="text-xs">
                            v{config.version}
                          </Badge>
                        )}
                        {config.supportsCompilation && (
                          <Badge variant="secondary" className="text-xs">
                            Compile
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Language quick selector for commonly used languages
export function QuickLanguageSelector({
  selectedLanguage,
  onLanguageChange,
  className,
}: {
  selectedLanguage: CodeLanguage;
  onLanguageChange: (language: CodeLanguage) => void;
  className?: string;
}) {
  const popularLanguages: CodeLanguage[] = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'go',
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {popularLanguages.map((language) => {
        const config = getLanguageConfig(language);
        return (
          <Button
            key={language}
            variant={selectedLanguage === language ? 'default' : 'outline'}
            size="sm"
            onClick={() => onLanguageChange(language)}
            className="flex items-center gap-1"
          >
            {LANGUAGE_ICONS[language]}
            <span className="text-xs">{config.name}</span>
          </Button>
        );
      })}
    </div>
  );
}
