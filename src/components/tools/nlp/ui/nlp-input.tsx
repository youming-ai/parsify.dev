'use client'

import React, { useCallback, useRef, useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Link2, Settings, Info, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NLPInputOptions {
  minLength?: number
  maxLength?: number
  placeholder?: string
  allowFileUpload?: boolean
  allowUrlInput?: boolean
  showAdvancedOptions?: boolean
  defaultLanguage?: string
  supportedLanguages?: string[]
  preprocessOptions?: {
    normalizeText?: boolean
    removeStopwords?: boolean
    applyStemming?: boolean
    tokenizeSentences?: boolean
  }
}

export interface NLPInputValue {
  text: string
  source: 'manual' | 'file' | 'url'
  filename?: string
  url?: string
  language?: string
  preprocessing?: {
    normalizeText: boolean
    removeStopwords: boolean
    applyStemming: boolean
    tokenizeSentences: boolean
  }
  metadata?: {
    wordCount?: number
    charCount?: number
    sentenceCount?: number
    language?: string
    confidence?: number
  }
}

interface NLPInputProps {
  value?: NLPInputValue
  onChange?: (value: NLPInputValue) => void
  onSubmit?: (value: NLPInputValue) => void
  options?: NLPInputOptions
  disabled?: boolean
  loading?: boolean
  error?: string
  className?: string
  showPreview?: boolean
  onTextAnalysis?: (analysis: NLPInputValue['metadata']) => void
}

const DEFAULT_OPTIONS: Required<NLPInputOptions> = {
  minLength: 1,
  maxLength: 50000,
  placeholder: 'Enter or paste your text here for NLP analysis...',
  allowFileUpload: true,
  allowUrlInput: true,
  showAdvancedOptions: false,
  defaultLanguage: 'auto',
  supportedLanguages: ['auto', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ar', 'hi'],
  preprocessOptions: {
    normalizeText: true,
    removeStopwords: false,
    applyStemming: false,
    tokenizeSentences: false,
  },
}

export function NlpInput({
  value = { text: '', source: 'manual', preprocessing: DEFAULT_OPTIONS.preprocessOptions },
  onChange,
  onSubmit,
  options = {},
  disabled = false,
  loading = false,
  error,
  className,
  showPreview = true,
  onTextAnalysis,
}: NLPInputProps) {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'manual' | 'file' | 'url'>('manual')
  const [textStats, setTextStats] = useState<NLPInputValue['metadata']>()
  const [dragActive, setDragActive] = useState(false)

  // Analyze text and update stats
  const analyzeText = useCallback((text: string) => {
    if (!text.trim()) {
      setTextStats(undefined)
      onTextAnalysis?.(undefined)
      return
    }

    const words = text.trim().split(/\s+/).filter(word => word.length > 0)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    const stats = {
      wordCount: words.length,
      charCount: text.length,
      sentenceCount: sentences.length,
    }

    setTextStats(stats)
    onTextAnalysis?.(stats)
  }, [onTextAnalysis])

  // Analyze text on mount and changes
  useEffect(() => {
    analyzeText(value.text)
  }, [value.text, analyzeText])

  const handleTextChange = useCallback((newText: string) => {
    const newValue = { ...value, text: newText }
    onChange?.(newValue)
  }, [value, onChange])

  const handleSubmit = useCallback(() => {
    if (value.text.trim().length >= config.minLength &&
        value.text.trim().length <= config.maxLength) {
      onSubmit?.(value)
    }
  }, [value, onSubmit, config.minLength, config.maxLength])

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      const text = await file.text()
      const newValue = {
        text,
        source: 'file' as const,
        filename: file.name,
        preprocessing: value.preprocessing,
      }
      onChange?.(newValue)
      setActiveTab('manual')
    } catch (err) {
      console.error('Failed to read file:', err)
    }
  }, [value.preprocessing, onChange])

  const handleUrlFetch = useCallback(async (url: string) => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const text = await response.text()

      const newValue = {
        text,
        source: 'url' as const,
        url,
        preprocessing: value.preprocessing,
      }
      onChange?.(newValue)
      setActiveTab('manual')
    } catch (err) {
      console.error('Failed to fetch URL:', err)
    }
  }, [value.preprocessing, onChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        handleFileUpload(file)
      }
    }
  }, [handleFileUpload])

  const isTextValid = value.text.trim().length >= config.minLength &&
                     value.text.trim().length <= config.maxLength
  const charCount = value.text.length
  const isValidLength = charCount >= config.minLength && charCount <= config.maxLength

  return (
    <div className={cn('space-y-4', className)}>
      {/* Input Tabs */}
      <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Manual Input
          </TabsTrigger>
          {config.allowFileUpload && (
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Upload
            </TabsTrigger>
          )}
          {config.allowUrlInput && (
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              URL
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              dragActive ? 'border-primary bg-primary/5' : 'border-gray-200',
              'hover:border-primary hover:bg-primary/5'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop a text file here, or click to browse
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              Select File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,text/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              disabled={disabled}
            />
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="nlp-text-input">Text Input</Label>
            <Textarea
              id="nlp-text-input"
              value={value.text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={config.placeholder}
              className={cn(
                'min-h-[200px] resize-y',
                !isValidLength && 'border-red-300 focus:border-red-500'
              )}
              disabled={disabled}
              maxLength={config.maxLength}
            />

            {/* Character Count */}
            <div className="flex items-center justify-between text-sm">
              <span className={cn(
                isValidLength ? 'text-gray-500' : 'text-red-500'
              )}>
                {charCount} / {config.maxLength} characters
              </span>
              {charCount < config.minLength && (
                <span className="text-red-500">
                  Minimum {config.minLength} characters required
                </span>
              )}
            </div>
          </div>

          {/* Preview */}
          {showPreview && value.text && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Text Analysis</span>
                </div>
                {textStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Words:</span>
                      <div className="font-medium">{textStats.wordCount}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Characters:</span>
                      <div className="font-medium">{textStats.charCount}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Sentences:</span>
                      <div className="font-medium">{textStats.sentenceCount}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Source:</span>
                      <Badge variant="secondary" className="capitalize">
                        {value.source}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="file">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <div>
                  <h3 className="font-medium mb-2">Upload Text File</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Supported formats: .txt, .csv, .json, .xml
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                  >
                    Choose File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url-input">URL to fetch text from</Label>
                  <input
                    id="url-input"
                    type="url"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://example.com/text-file.txt"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget
                        if (input.value) {
                          handleUrlFetch(input.value)
                        }
                      }
                    }}
                    disabled={disabled}
                  />
                </div>
                <Button
                  onClick={() => {
                    const input = document.getElementById('url-input') as HTMLInputElement
                    if (input?.value) {
                      handleUrlFetch(input.value)
                    }
                  }}
                  disabled={disabled}
                  className="w-full"
                >
                  Fetch Text
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!isTextValid || disabled || loading}
          loading={loading}
          className="min-w-[120px]"
        >
          {loading ? 'Processing...' : 'Analyze Text'}
        </Button>
      </div>
    </div>
  )
}

export default NlpInput
