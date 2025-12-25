'use client';

import { fontConfig, getAvailableFonts } from '@/lib/monaco-config';
import { CaretDown, Check, TextT } from '@phosphor-icons/react';
import { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

export interface FontSelectorProps {
  selectedFont: keyof typeof fontConfig;
  onFontChange: (font: keyof typeof fontConfig) => void;
  className?: string;
  showPreview?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function FontSelector({
  selectedFont,
  onFontChange,
  className,
  showPreview = true,
  disabled = false,
  placeholder = 'Select font...',
}: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const availableFonts = getAvailableFonts();

  const handleFontSelect = (font: keyof typeof fontConfig) => {
    onFontChange(font);
    setIsOpen(false);
  };

  const getFontDisplayName = (font: keyof typeof fontConfig): string => {
    const displayNames: Record<keyof typeof fontConfig, string> = {
      paperMono: 'Paper Mono',
      firaCode: 'Fira Code',
      jetbrainsMono: 'JetBrains Mono',
      cascadiaCode: 'Cascadia Code',
      compact: 'Compact',
      large: 'Large',
    };
    return displayNames[font] || font;
  };

  const getFontDescription = (font: keyof typeof fontConfig): string => {
    const descriptions: Record<keyof typeof fontConfig, string> = {
      paperMono: 'Project default monospace font',
      firaCode: 'Programming font with ligatures',
      jetbrainsMono: 'TypeScript IDE font',
      cascadiaCode: 'Microsoft terminal font',
      compact: 'Smaller size for more code visibility',
      large: 'Larger size for better readability',
    };
    return descriptions[font] || '';
  };

  const selectedConfig = fontConfig[selectedFont];

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <TextT className="h-4 w-4" />
              <span className="truncate">{getFontDisplayName(selectedFont)}</span>
            </div>
            <CaretDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72">
          {availableFonts.map((font) => (
            <DropdownMenuItem
              key={font}
              onClick={() => handleFontSelect(font)}
              className="flex flex-col items-start p-3 cursor-pointer"
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getFontDisplayName(font)}</span>
                  {font === selectedFont && <Check className="h-4 w-4 text-primary" />}
                </div>
                <Badge variant="outline" className="text-xs ml-auto">
                  {fontConfig[font].fontSize}px
                </Badge>
              </div>
              {showPreview && (
                <div className="mt-1 text-xs text-muted-foreground">{getFontDescription(font)}</div>
              )}
              {showPreview && (
                <div
                  className="mt-2 text-xs border rounded p-1 bg-muted"
                  style={{
                    fontFamily: fontConfig[font].fontFamily,
                    fontSize: '11px',
                    lineHeight: fontConfig[font].lineHeight,
                  }}
                >
                  function example() {'{'} return "Hello World!"; {'}'}
                </div>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font details display */}
      {showPreview && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Size:</span>
            <Badge variant="secondary">{selectedConfig.fontSize}px</Badge>
            <span>Line Height:</span>
            <Badge variant="secondary">{selectedConfig.lineHeight}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for toolbars
export function FontSelectorCompact({
  selectedFont,
  onFontChange,
  className,
  disabled = false,
}: {
  selectedFont: keyof typeof fontConfig;
  onFontChange: (font: keyof typeof fontConfig) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <FontSelector
      selectedFont={selectedFont}
      onFontChange={onFontChange}
      className={className}
      showPreview={false}
      disabled={disabled}
    />
  );
}

// Quick font size selector
export function FontSizeSelector({
  fontSize,
  onFontSizeChange,
  className,
  availableSizes = [12, 14, 16, 18, 20],
}: {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  className?: string;
  availableSizes?: number[];
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-sm text-muted-foreground">Size:</span>
      <div className="flex gap-1">
        {availableSizes.map((size) => (
          <Button
            key={size}
            variant={fontSize === size ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFontSizeChange(size)}
            className="h-7 w-7 p-0 text-xs"
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default FontSelector;
