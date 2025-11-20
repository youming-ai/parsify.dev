/**
 * Console Output Capture and Display System
 *
 * Provides comprehensive console output management for code executors with:
 * - Real-time output capture from multiple sources
 * - Structured logging with different levels (debug, info, warn, error)
 * - ANSI color code support and formatting
 * - Output buffering and streaming
 * - Search and filter capabilities
 * - Export functionality for logs
 * - Performance metrics for output processing
 * - Integration with execution sandbox
 */

import * as monaco from 'monaco-editor';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Output entry interface
interface OutputEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'stdout' | 'stderr';
  source: string; // executor name, language, etc.
  message: string;
  metadata?: {
    line?: number;
    column?: number;
    executionId?: string;
    language?: string;
    stackTrace?: string;
  };
  styles?: {
    color?: string;
    backgroundColor?: string;
    fontWeight?: string;
    textDecoration?: string;
  };
}

// Console configuration
interface ConsoleConfig {
  maxEntries: number;
  enableTimestamps: boolean;
  enableColors: boolean;
  enableLineNumbers: boolean;
  wordWrap: boolean;
  fontSize: number;
  fontFamily: string;
  theme: 'dark' | 'light' | 'auto';
  autoScroll: boolean;
  showLevel: boolean;
  showSource: boolean;
}

// Filter options
interface OutputFilter {
  levels: Set<string>;
  sources: Set<string>;
  searchText: string;
  regex: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Export format
type ExportFormat = 'txt' | 'json' | 'csv' | 'html' | 'md';

/**
 * Console Output Capture Hook
 */
export const useConsoleCapture = (source: string) => {
  const [entries, setEntries] = useState<OutputEntry[]>([]);
  const [isCapturing, setIsCapturing] = useState(true);
  const entryIdCounter = useRef(0);

  // Capture output
  const capture = useCallback((
    level: OutputEntry['level'],
    message: string,
    metadata?: OutputEntry['metadata']
  ) => {
    if (!isCapturing) return;

    const entry: OutputEntry = {
      id: `${source}-${entryIdCounter.current++}`,
      timestamp: Date.now(),
      level,
      source,
      message,
      metadata,
      styles: getDefaultStyles(level)
    };

    setEntries(prev => {
      const newEntries = [...prev, entry];
      // Keep only the last maxEntries entries
      const maxEntries = 10000; // Default limit
      return newEntries.slice(-maxEntries);
    });
  }, [isCapturing, source]);

  // Convenience methods
  const debug = useCallback((message: string, metadata?: OutputEntry['metadata']) => {
    capture('debug', message, metadata);
  }, [capture]);

  const info = useCallback((message: string, metadata?: OutputEntry['metadata']) => {
    capture('info', message, metadata);
  }, [capture]);

  const warn = useCallback((message: string, metadata?: OutputEntry['metadata']) => {
    capture('warn', message, metadata);
  }, [capture]);

  const error = useCallback((message: string, metadata?: OutputEntry['metadata']) => {
    capture('error', message, metadata);
  }, [capture]);

  const stdout = useCallback((message: string, metadata?: OutputEntry['metadata']) => {
    capture('stdout', message, metadata);
  }, [capture]);

  const stderr = useCallback((message: string, metadata?: OutputEntry['metadata']) => {
    capture('stderr', message, metadata);
  }, [capture]);

  // Clear entries
  const clear = useCallback(() => {
    setEntries([]);
    entryIdCounter.current = 0;
  }, []);

  // Filter entries
  const filter = useCallback((predicate: (entry: OutputEntry) => boolean) => {
    return entries.filter(predicate);
  }, [entries]);

  // Get entries by level
  const getEntriesByLevel = useCallback((level: OutputEntry['level']) => {
    return entries.filter(entry => entry.level === level);
  }, [entries]);

  // Export entries
  const exportEntries = useCallback((format: ExportFormat, filteredEntries?: OutputEntry[]) => {
    const data = filteredEntries || entries;

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        return exportToCSV(data);
      case 'html':
        return exportToHTML(data);
      case 'md':
        return exportToMarkdown(data);
      default:
        return exportToText(data);
    }
  }, [entries]);

  // Statistics
  const getStatistics = useCallback(() => {
    const stats = {
      total: entries.length,
      byLevel: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      oldest: entries.length > 0 ? entries[0].timestamp : null,
      newest: entries.length > 0 ? entries[entries.length - 1].timestamp : null
    };

    entries.forEach(entry => {
      stats.byLevel[entry.level] = (stats.byLevel[entry.level] || 0) + 1;
      stats.bySource[entry.source] = (stats.bySource[entry.source] || 0) + 1;
    });

    return stats;
  }, [entries]);

  return {
    entries,
    isCapturing,
    setIsCapturing,
    capture,
    debug,
    info,
    warn,
    error,
    stdout,
    stderr,
    clear,
    filter,
    getEntriesByLevel,
    exportEntries,
    getStatistics
  };
};

// Helper function to get default styles for different log levels
const getDefaultStyles = (level: OutputEntry['level']): OutputEntry['styles'] => {
  switch (level) {
    case 'debug':
      return { color: '#888' };
    case 'info':
      return { color: '#17a2b8' };
    case 'warn':
      return { color: '#ffc107', fontWeight: 'bold' };
    case 'error':
      return { color: '#dc3545', fontWeight: 'bold' };
    case 'stderr':
      return { color: '#dc3545' };
    default:
      return { color: '#fff' };
  }
};

// Export functions
const exportToText = (entries: OutputEntry[]): string => {
  return entries.map(entry => {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(7);
    const source = entry.source.padEnd(15);
    return `[${timestamp}] ${level} ${source} ${entry.message}`;
  }).join('\\n');
};

const exportToCSV = (entries: OutputEntry[]): string => {
  const headers = ['timestamp', 'level', 'source', 'message', 'line', 'column', 'executionId'];
  const rows = entries.map(entry => [
    new Date(entry.timestamp).toISOString(),
    entry.level,
    entry.source,
    `"${entry.message.replace(/"/g, '""')}"`,
    entry.metadata?.line || '',
    entry.metadata?.column || '',
    entry.metadata?.executionId || ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\\n');
};

const exportToHTML = (entries: OutputEntry[]): string => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Console Output</title>
      <style>
        body { font-family: 'Monaco', 'Menlo', monospace; background: #1e1e1e; color: #fff; padding: 20px; }
        .entry { margin: 2px 0; padding: 2px 5px; border-radius: 2px; }
        .timestamp { color: #888; font-size: 0.9em; }
        .level { font-weight: bold; margin: 0 10px; }
        .source { color: #17a2b8; margin: 0 10px; }
        .message { white-space: pre-wrap; }
        .debug { background: #2a2a2a; }
        .info { background: rgba(23, 162, 184, 0.1); }
        .warn { background: rgba(255, 193, 7, 0.2); }
        .error { background: rgba(220, 53, 69, 0.2); }
      </style>
    </head>
    <body>
      <h1>Console Output</h1>
      <div class="entries">
        ${entries.map(entry => `
          <div class="entry ${entry.level}">
            <span class="timestamp">${new Date(entry.timestamp).toLocaleString()}</span>
            <span class="level">${entry.level.toUpperCase()}</span>
            <span class="source">${entry.source}</span>
            <span class="message">${entry.message}</span>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
  return html;
};

const exportToMarkdown = (entries: OutputEntry[]): string => {
  return `
# Console Output

${entries.map(entry => `
**[${new Date(entry.timestamp).toLocaleString()}]** **${entry.level.toUpperCase()}** **${entry.source}**
\`\`\`
${entry.message}
\`\`\`
`).join('\\n')}
  `.trim();
};

/**
 * Console Output Display Component
 */
interface ConsoleDisplayProps {
  entries: OutputEntry[];
  config?: Partial<ConsoleConfig>;
  onFilterChange?: (filter: OutputFilter) => void;
  onEntryClick?: (entry: OutputEntry) => void;
}

export const ConsoleDisplay: React.FC<ConsoleDisplayProps> = ({
  entries,
  config = {},
  onFilterChange,
  onEntryClick
}) => {
  // Configuration
  const defaultConfig: ConsoleConfig = {
    maxEntries: 1000,
    enableTimestamps: true,
    enableColors: true,
    enableLineNumbers: false,
    wordWrap: true,
    fontSize: 12,
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
    theme: 'dark',
    autoScroll: true,
    showLevel: true,
    showSource: true
  };

  const [currentConfig, _setCurrentConfig] = useState<ConsoleConfig>({ ...defaultConfig, ...config });
  const [filter, setFilter] = useState<OutputFilter>({
    levels: new Set(['debug', 'info', 'warn', 'error', 'stdout', 'stderr']),
    sources: new Set(),
    searchText: '',
    regex: false
  });
  const [filteredEntries, setFilteredEntries] = useState<OutputEntry[]>(entries);

  // Editor refs
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply filters
  useEffect(() => {
    let filtered = entries;

    // Level filter
    if (filter.levels.size > 0) {
      filtered = filtered.filter(entry => filter.levels.has(entry.level));
    }

    // Source filter
    if (filter.sources.size > 0) {
      filtered = filtered.filter(entry => filter.sources.has(entry.source));
    }

    // Text search filter
    if (filter.searchText) {
      try {
        const searchRegex = filter.regex
          ? new RegExp(filter.searchText, 'i')
          : new RegExp(filter.searchText.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'i');

        filtered = filtered.filter(entry =>
          searchRegex.test(entry.message) ||
          searchRegex.test(entry.source)
        );
      } catch (_error) {
        // Invalid regex, fall back to plain text search
        const searchTextLower = filter.searchText.toLowerCase();
        filtered = filtered.filter(entry =>
          entry.message.toLowerCase().includes(searchTextLower) ||
          entry.source.toLowerCase().includes(searchTextLower)
        );
      }
    }

    // Date range filter
    if (filter.dateRange) {
      filtered = filtered.filter(entry =>
        entry.timestamp >= filter.dateRange?.start.getTime() &&
        entry.timestamp <= filter.dateRange?.end.getTime()
      );
    }

    // Apply max entries limit
    if (currentConfig.maxEntries > 0) {
      filtered = filtered.slice(-currentConfig.maxEntries);
    }

    setFilteredEntries(filtered);
  }, [entries, filter, currentConfig.maxEntries]);

  // Initialize Monaco editor
  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: '',
        language: 'plaintext',
        theme: currentConfig.theme === 'dark' ? 'vs-dark' : 'vs-light',
        readOnly: true,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: currentConfig.fontSize,
        fontFamily: currentConfig.fontFamily,
        wordWrap: currentConfig.wordWrap ? 'on' : 'off',
        lineNumbers: currentConfig.enableLineNumbers ? 'on' : 'off',
        scrollBeyondLastLine: false,
        renderWhitespace: 'none',
        smoothScrolling: true,
        cursorBlinking: 'solid'
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, [currentConfig]);

  // Update editor content
  useEffect(() => {
    if (editorRef.current) {
      const content = filteredEntries.map(entry => {
        const timestamp = new Date(entry.timestamp).toISOString();
        const level = entry.level.toUpperCase().padEnd(7);
        const source = entry.source.padEnd(15);
        let line = '';

        if (currentConfig.enableTimestamps) {
          line += `[${timestamp}] `;
        }

        if (currentConfig.showLevel) {
          line += `${level} `;
        }

        if (currentConfig.showSource) {
          line += `${source} `;
        }

        line += entry.message;

        return line;
      }).join('\\n');

      editorRef.current.setValue(content);

      // Auto scroll to bottom
      if (currentConfig.autoScroll && filteredEntries.length > 0) {
        const model = editorRef.current.getModel();
        if (model) {
          const lineCount = model.getLineCount();
          editorRef.current.revealLine(lineCount);
        }
      }
    }
  }, [filteredEntries, currentConfig]);

  // Handle filter changes
  const updateFilter = useCallback((newFilter: Partial<OutputFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    onFilterChange?.(updatedFilter);
  }, [filter, onFilterChange]);

  // Toggle level filter
  const _toggleLevel = useCallback((level: string) => {
    const newLevels = new Set(filter.levels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    updateFilter({ levels: newLevels });
  }, [filter.levels, updateFilter]);

  // Get available sources
  const _availableSources = Array.from(new Set(entries.map(entry => entry.source))).sort();

  // Toggle source filter
  const _toggleSource = useCallback((source: string) => {
    const newSources = new Set(filter.sources);
    if (newSources.has(source)) {
      newSources.delete(source);
    } else {
      newSources.add(source);
    }
    updateFilter({ sources: newSources });
  }, [filter.sources, updateFilter]);

  return (
    <div className="console-display bg-gray-900 rounded-lg overflow-hidden">
      {/* Header with controls */}
      <div className="bg-gray-800 p-3 border-b border-gray-700">
        <div className="flex flex-wrap items-center gap-3">
          {/* Level filters */}
          <div className="flex gap-2">
            {(['debug', 'info', 'warn', 'error', 'stdout', 'stderr'] _as const).map(level => (
              <_button
                _key={level}
                _onClick={() => toggleLevel(level)}
                _className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filter.levels.has(level)
                    ? level === 'error' || level === 'stderr'
                      ? 'bg-red-600 text-white'
                      : level === 'warn'
                      ? 'bg-yellow-600 text-white'
                      : level === 'info'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={filter.searchText}
              onChange={(e) => updateFilter({ searchText: e.target.value })}
              placeholder="Search output..."
              className="w-full px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Regex toggle */}
          <label className="flex items-center gap-2 text-white text-sm">
            <input
              type="checkbox"
              checked={filter.regex}
              onChange={(e) => updateFilter({ regex: e.target.checked })}
              className="rounded"
            />
            Regex
          </label>

          {/* Entry count */}
          <span className="text-gray-400 text-sm">
            {filteredEntries.length} / {entries.length} entries
          </span>
        </div>

        {/* Source filters */}
        {availableSources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-gray-400 text-sm">Sources:</span>
            {availableSources.map(source => (
              <button
                key={source}
                onClick={() => toggleSource(source)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  filter.sources.has(source)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor container */}
      <div
        ref={containerRef}
        className="h-[500px] border-b border-gray-700"
        style={{ fontFamily: currentConfig.fontFamily }}
      />

      {/* Footer with stats */}
      <div className="bg-gray-800 p-3 border-t border-gray-700">
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>
            {filteredEntries.length > 0 && (
              <>
                Latest: {new Date(filteredEntries[filteredEntries.length - 1].timestamp).toLocaleString()}
                {' | '}
                Oldest: {new Date(filteredEntries[0].timestamp).toLocaleString()}
              </>
            )}
          </div>

          {/* Configuration buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentConfig(prev => ({ ...prev, autoScroll: !prev.autoScroll }))}
              className={`px-2 py-1 rounded text-xs ${
                currentConfig.autoScroll ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              Auto Scroll
            </button>

            <button
              onClick={() => setCurrentConfig(prev => ({ ...prev, wordWrap: !prev.wordWrap }))}
              className={`px-2 py-1 rounded text-xs ${
                currentConfig.wordWrap ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              Word Wrap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Console Manager Component (combines capture and display)
 */
export const ConsoleManager: React.FC<{ source: string }> = ({ source }) => {
  const {
    entries,
    isCapturing,
    setIsCapturing,
    clear,
    exportEntries,
    getStatistics
  } = useConsoleCapture(source);

  const [exportFormat, setExportFormat] = useState<ExportFormat>('txt');
  const [showStats, setShowStats] = useState(false);

  const stats = getStatistics();

  const handleExport = () => {
    const content = exportEntries(exportFormat);
    const blob = new Blob([content], {
      type: exportFormat === 'json' ? 'application/json' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-${source}-${Date.now()}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="console-manager space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={() => setIsCapturing(!isCapturing)}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isCapturing
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isCapturing ? '⏸ Pause' : '▶ Start'} Capture
        </button>

        <button
          onClick={clear}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
        >
          🗑️ Clear
        </button>

        <div className="flex items-center gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
          >
            <option value="txt">Text</option>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="html">HTML</option>
            <option value="md">Markdown</option>
          </select>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          >
            📥 Export
          </button>
        </div>

        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium"
        >
          📊 {showStats ? 'Hide' : 'Show'} Stats
        </button>

        <span className="text-gray-400 text-sm">
          Total: {stats.total} entries
        </span>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">📊 Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total Entries</div>
              <div className="text-white font-semibold">{stats.total}</div>
            </div>
            <div>
              <div className="text-gray-400">By Level</div>
              <div className="text-white">
                {Object.entries(stats.byLevel).map(([level, count]) => (
                  <span key={level} className="mr-3">
                    {level}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-gray-400">By Source</div>
              <div className="text-white">
                {Object.entries(stats.bySource).map(([src, count]) => (
                  <span key={src} className="mr-3">
                    {src}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Time Range</div>
              <div className="text-white text-xs">
                {stats.oldest && stats.newest && (
                  <>
                    {new Date(stats.oldest).toLocaleTimeString()} - {new Date(stats.newest).toLocaleTimeString()}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display */}
      <ConsoleDisplay entries={entries} />
    </div>
  );
};
