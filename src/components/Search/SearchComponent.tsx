import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { JsonNodeModel } from '../../lib/models/JsonNode'
import type { JsonNode } from '../../lib/types'

interface SearchResult {
  path: string
  node: JsonNode
  match: string
  highlightedValue?: string
}

interface SearchComponentProps {
  data: JsonNode
  onResultSelect?: (path: string, node: JsonNode) => void
  placeholder?: string
  className?: string
  showPath?: boolean
  maxResults?: number
  debounceMs?: number
}

export const SearchComponent: React.FC<SearchComponentProps> = ({
  data,
  onResultSelect,
  placeholder = 'Search JSON...',
  className = '',
  showPath = true,
  maxResults = 50,
  debounceMs = 300,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [showResults, setShowResults] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()

  // Debounced search function
  const performSearch = useCallback(
    (term: string) => {
      if (!term.trim()) {
        setResults([])
        setShowResults(false)
        setSelectedIndex(-1)
        return
      }

      setIsSearching(true)

      try {
        const searchResults = JsonNodeModel.search(data, term.toLowerCase())

        // Highlight matches in values
        const highlightedResults = searchResults.slice(0, maxResults).map(result => ({
          ...result,
          highlightedValue: highlightMatch(result.node, term.toLowerCase()),
        }))

        setResults(highlightedResults)
        setShowResults(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [data, maxResults, highlightMatch]
  )

  // Highlight matching text
  const highlightMatch = (node: JsonNode, searchTerm: string): string => {
    if (typeof node === 'string') {
      const regex = new RegExp(`(${searchTerm})`, 'gi')
      return node.replace(regex, '<mark>$1</mark>')
    }
    if (typeof node === 'number' || typeof node === 'boolean') {
      const strValue = String(node)
      const regex = new RegExp(`(${searchTerm})`, 'gi')
      return strValue.replace(regex, '<mark>$1</mark>')
    }
    return String(node)
  }

  // Handle search input change with debouncing
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const term = event.target.value
      setSearchTerm(term)

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        performSearch(term)
      }, debounceMs)
    },
    [performSearch, debounceMs]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!showResults || results.length === 0) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleResultSelect(results[selectedIndex])
          }
          break
        case 'Escape':
          setShowResults(false)
          setSelectedIndex(-1)
          searchInputRef.current?.blur()
          break
      }
    },
    [showResults, results, selectedIndex, handleResultSelect]
  )

  // Handle result selection
  const handleResultSelect = useCallback(
    (result: SearchResult) => {
      setSearchTerm(result.match)
      setShowResults(false)
      setSelectedIndex(-1)
      onResultSelect?.(result.path, result.node)
    },
    [onResultSelect]
  )

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setResults([])
    setShowResults(false)
    setSelectedIndex(-1)
    searchInputRef.current?.focus()
  }, [])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Scroll selected result into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-result-index="${selectedIndex}"]`
      )
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  const formatPath = (path: string): string => {
    if (path.startsWith('[')) {
      return path // Array path like [0], [1], etc.
    }
    if (path === 'root') {
      return 'root'
    }
    return path
  }

  const getValuePreview = (node: JsonNode): string => {
    if (node === null) return 'null'
    if (typeof node === 'boolean') return String(node)
    if (typeof node === 'number') return String(node)
    if (typeof node === 'string') {
      return node.length > 50 ? `"${node.substring(0, 47)}..."` : `"${node}"`
    }
    if (Array.isArray(node)) return `Array[${node.length}]`
    if (typeof node === 'object') return `Object{${Object.keys(node).length}}`
    return String(node)
  }

  return (
    <div className={`search-component ${className}`}>
      <div className="search-input-wrapper">
        <div className="search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className="search-input"
            aria-label="Search JSON content"
            aria-expanded={showResults}
            aria-autocomplete="list"
            aria-activedescendant={
              selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
            }
          />

          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="search-clear-button"
              aria-label="Clear search"
            >
              ×
            </button>
          )}

          {isSearching && (
            <div className="search-loading" aria-hidden="true">
              <div className="search-spinner"></div>
            </div>
          )}
        </div>

        {showResults && results.length > 0 && (
          <div
            ref={resultsRef}
            className="search-results"
            role="listbox"
            aria-label="Search results"
          >
            <div className="search-results-header">
              <span className="results-count">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            <ul className="search-results-list">
              {results.map((result, index) => (
                <li
                  key={`${result.path}-${index}`}
                  data-result-index={index}
                  id={`search-result-${index}`}
                  aria-selected={selectedIndex === index}
                  className={`search-result-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleResultSelect(result)}
                >
                  <div className="result-content">
                    {showPath && <div className="result-path">{formatPath(result.path)}</div>}
                    <div
                      className="result-value"
                      dangerouslySetInnerHTML={{
                        __html: result.highlightedValue || getValuePreview(result.node),
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            {results.length >= maxResults && (
              <div className="search-results-footer">
                <span className="results-limit">Showing first {maxResults} results</span>
              </div>
            )}
          </div>
        )}

        {showResults && searchTerm && results.length === 0 && !isSearching && (
          <div className="search-no-results">
            <div className="no-results-icon" aria-hidden="true">
              🔍
            </div>
            <p>No results found for "{searchTerm}"</p>
            <p className="no-results-hint">Try different keywords or check your spelling</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchComponent
