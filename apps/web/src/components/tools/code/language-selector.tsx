import * as React from 'react'
import { LanguageSelectorProps, CodeLanguage } from './code-types'
import { getLanguageConfig, LANGUAGE_CONFIGS } from './language-configs'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ChevronDown,
  Code,
  Braces,
  Terminal,
  Database,
  FileCode
} from 'lucide-react'

// Language categories for organization
const LANGUAGE_CATEGORIES = {
  'Popular': ['javascript', 'typescript', 'python', 'java'],
  'Web': ['javascript', 'typescript', 'php'],
  'Systems': ['c', 'cpp', 'rust', 'go'],
  'Mobile': ['swift', 'kotlin'],
  'Enterprise': ['java', 'csharp', 'scala'],
  'Scripting': ['python', 'ruby', 'bash', 'powershell'],
  'Data': ['sql', 'python', 'r'],
  'Other': ['go', 'rust', 'scala']
}

const LANGUAGE_ICONS: Record<string, React.ReactNode> = {
  javascript: <Braces className="h-4 w-4" />,
  typescript: <Code className="h-4 w-4" />,
  python: <Terminal className="h-4 w-4" />,
  java: <FileCode className="h-4 w-4" />,
  cpp: <Code className="h-4 w-4" />,
  c: <Code className="h-4 w-4" />,
  csharp: <FileCode className="h-4 w-4" />,
  go: <Code className="h-4 w-4" />,
  rust: <Code className="h-4 w-4" />,
  php: <FileCode className="h-4 w-4" />,
  ruby: <Terminal className="h-4 w-4" />,
  swift: <Code className="h-4 w-4" />,
  kotlin: <Code className="h-4 w-4" />,
  bash: <Terminal className="h-4 w-4" />,
  powershell: <Terminal className="h-4 w-4" />,
  sql: <Database className="h-4 w-4" />
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  showVersion = true,
  compact = false,
  className
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All')

  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const selectedConfig = getLanguageConfig(selectedLanguage)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Filter languages based on search and category
  const filteredLanguages = React.useMemo(() => {
    const languages = Object.keys(LANGUAGE_CONFIGS) as CodeLanguage[]

    let filtered = languages

    // Filter by category
    if (selectedCategory !== 'All') {
      const categoryLanguages = LANGUAGE_CATEGORIES[selectedCategory as keyof typeof LANGUAGE_CATEGORIES] || []
      filtered = filtered.filter(lang => categoryLanguages.includes(lang))
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lang => {
        const config = getLanguageConfig(lang)
        return (
          config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lang.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    }

    return filtered
  }, [searchTerm, selectedCategory])

  const handleLanguageSelect = (language: CodeLanguage) => {
    onLanguageChange(language)
    setIsOpen(false)
    setSearchTerm('')
    setSelectedCategory('All')
  }

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
          <ChevronDown className="h-3 w-3" />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
            {filteredLanguages.map((language) => {
              const config = getLanguageConfig(language)
              return (
                <button
                  key={language}
                  onClick={() => handleLanguageSelect(language)}
                  className={cn(
                    'w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                    selectedLanguage === language && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  )}
                >
                  {LANGUAGE_ICONS[language]}
                  <span className="text-sm">{config.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 justify-between w-full"
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
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('All')}
              className={cn(
                'px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                selectedCategory === 'All'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              All Languages
            </button>
            {Object.keys(LANGUAGE_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  selectedCategory === category
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Language List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No languages found
              </div>
            ) : (
              <div className="p-2">
                {filteredLanguages.map((language) => {
                  const config = getLanguageConfig(language)
                  return (
                    <button
                      key={language}
                      onClick={() => handleLanguageSelect(language)}
                      className={cn(
                        'w-full px-3 py-2 rounded-md text-left flex items-center justify-between group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                        selectedLanguage === language && 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {LANGUAGE_ICONS[language]}
                        <div>
                          <div className="font-medium">{config.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
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
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Language quick selector for commonly used languages
export function QuickLanguageSelector({
  selectedLanguage,
  onLanguageChange,
  className
}: {
  selectedLanguage: CodeLanguage
  onLanguageChange: (language: CodeLanguage) => void
  className?: string
}) {
  const popularLanguages: CodeLanguage[] = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go']

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {popularLanguages.map((language) => {
        const config = getLanguageConfig(language)
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
        )
      })}
    </div>
  )
}
