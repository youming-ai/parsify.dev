'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  getLanguageDisplayName,
  getLanguageExtensions,
  supportedLanguages,
} from './language-configs';

export interface MonacoLanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
  showExtensions?: boolean;
  placeholder?: string;
  disabled?: boolean;
  popularLanguages?: string[];
}

const DEFAULT_POPULAR_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'rust',
  'go',
  'html',
  'css',
  'json',
  'sql',
  'markdown',
];

export function MonacoLanguageSelector({
  selectedLanguage,
  onLanguageChange,
  className,
  showExtensions = false,
  placeholder = 'Select language...',
  disabled = false,
  popularLanguages = DEFAULT_POPULAR_LANGUAGES,
}: MonacoLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Separate popular and other languages
  const popularLanguagesList = popularLanguages.filter((lang) => supportedLanguages.includes(lang));
  const otherLanguages = supportedLanguages.filter((lang) => !popularLanguagesList.includes(lang));

  const handleLanguageSelect = (language: string) => {
    onLanguageChange(language);
    setIsOpen(false);
  };

  const selectedLanguageName = getLanguageDisplayName(selectedLanguage);
  const selectedLanguageExtensions = getLanguageExtensions(selectedLanguage);

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedLanguage ? selectedLanguageName : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto">
          {/* Popular Languages */}
          {popularLanguagesList.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                Popular Languages
              </div>
              {popularLanguagesList.map((language) => (
                <DropdownMenuItem
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>{getLanguageDisplayName(language)}</span>
                    {language === selectedLanguage && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))}
              {otherLanguages.length > 0 && <div className="my-1 border-t border-border" />}
            </>
          )}

          {/* Other Languages */}
          {otherLanguages.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                All Languages
              </div>
              {otherLanguages.map((language) => (
                <DropdownMenuItem
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>{getLanguageDisplayName(language)}</span>
                    {language === selectedLanguage && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Show extensions if enabled */}
      {showExtensions && selectedLanguage && (
        <div className="mt-2">
          <div className="text-sm text-muted-foreground">File Extensions:</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {selectedLanguageExtensions.map((ext) => (
              <Badge key={ext} variant="secondary" className="text-xs">
                {ext}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for toolbars
export function MonacoLanguageSelectorCompact({
  selectedLanguage,
  onLanguageChange,
  className,
  disabled = false,
}: {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <MonacoLanguageSelector
      selectedLanguage={selectedLanguage}
      onLanguageChange={onLanguageChange}
      className={className}
      showExtensions={false}
      disabled={disabled}
    />
  );
}

// Dropdown version with search
export function MonacoLanguageSelectorDropdown({
  selectedLanguage,
  onLanguageChange,
  className,
  disabled = false,
  placeholder = 'Search language...',
}: {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLanguages = supportedLanguages.filter((language) =>
    getLanguageDisplayName(language).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className="w-full justify-between"
          >
            {selectedLanguage ? getLanguageDisplayName(selectedLanguage) : placeholder}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto p-0">
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <input
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Language list */}
          <div className="max-h-80 overflow-y-auto">
            {filteredLanguages.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No languages found
              </div>
            ) : (
              filteredLanguages.map((language) => (
                <DropdownMenuItem
                  key={language}
                  onClick={() => {
                    onLanguageChange(language);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>{getLanguageDisplayName(language)}</span>
                    {language === selectedLanguage && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default MonacoLanguageSelector;
