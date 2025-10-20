import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'
import { FileSelector } from './components/FileSelector/FileSelector'
import { JsonViewer } from './components/JsonViewer/JsonViewer'
import { useFileReader } from './hooks/useFileReader'
import { useJsonParser } from './hooks/useJsonParser'
import { LoadingSpinner } from './components/Loading/LoadingSpinner'
import { logError } from './lib/errorHandler'
import { queryClient } from './lib/queryClient'
import type { JsonFile, JsonDocument } from './lib/types'
import { LoadingStates } from './lib/types'
import './styles/globals.css'
import './styles/App.css'

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<JsonFile | null>(null)
  const [jsonDocuments, setJsonDocuments] = useState<JsonDocument[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const fileReader = useFileReader({
    onSuccess: (file) => {
      setSelectedFile(file)
      setErrors([])
      // Auto-parse JSON when file is selected
      parseJsonContent(file.content)
    },
    onError: (error) => {
      setErrors([error.message])
      setSelectedFile(null)
      setJsonDocuments([])
    }
  })

  const jsonParser = useJsonParser({
    onSuccess: (documents) => {
      setJsonDocuments(documents)
      const validDocuments = documents.filter(doc => doc.isValid)
      if (validDocuments.length === 0) {
        setErrors(['No valid JSON found in the file'])
      }
    },
    onError: (error) => {
      setErrors([error.message])
      setJsonDocuments([])
    }
  })

  const parseJsonContent = async (content: string) => {
    try {
      const documents = await jsonParser.parseJson(content, 'mixed')
      return documents
    } catch (error) {
      logError(error, 'App.parseJsonContent')
      return []
    }
  }

  const handleFileSelect = async (file: JsonFile, documents: JsonDocument[], fileErrors: any[]) => {
    setSelectedFile(file)
    setJsonDocuments(documents)
    setErrors(fileErrors.map((e: any) => e.message))
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setJsonDocuments([])
    setErrors([])
    fileReader.reset()
    jsonParser.reset()
  }

  const getPrimaryJsonDocument = (): JsonDocument | null => {
    return jsonDocuments.find(doc => doc.isValid) || null
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        onError={(error, errorInfo) => {
          logError(error, 'App.ErrorBoundary')
          console.error('Application Error:', error, errorInfo)
        }}
      >
        <div className="app">
          <header className="app-header">
            <h1>JSON.md Reader</h1>
            <p>Read and display JSON content from markdown files</p>
          </header>

          <main className="app-main">
            {!selectedFile ? (
              <section className="upload-section">
                <div className="upload-container">
                  <FileSelector
                    onFileSelect={handleFileSelect}
                    onError={(error) => setErrors([error.message])}
                    className="main-file-selector"
                  />
                </div>
              </section>
            ) : (
              <section className="viewer-section">
                <div className="viewer-header">
                  <div className="file-info">
                    <h2>{selectedFile.name}</h2>
                    <p>Size: {Math.round(selectedFile.size / 1024)}KB</p>
                  </div>
                  <div className="viewer-actions">
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="clear-button"
                    >
                      Clear File
                    </button>
                  </div>
                </div>

                {errors.length > 0 && (
                  <div className="error-section">
                    <h3>Errors:</h3>
                    <ul className="error-list">
                      {errors.map((error, index) => (
                        <li key={index} className="error-item">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {jsonDocuments.length > 0 && (
                  <div className="json-section">
                    <h3>JSON Content</h3>
                    {jsonDocuments.length > 1 && (
                      <p>Found {jsonDocuments.length} JSON document(s)</p>
                    )}
                    {jsonDocuments.map((doc, index) => (
                      <div key={doc.id} className="json-document">
                        {doc.lineNumber && (
                          <p className="json-location">
                            Line {doc.lineNumber} ({doc.extractionMethod})
                          </p>
                        )}
                        <JsonViewer
                          data={doc.parsedData || {}}
                          searchable={true}
                          copyable={true}
                          showLineNumbers={true}
                          className="json-viewer-component"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {jsonDocuments.length === 0 && errors.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <h3>No JSON Content Found</h3>
                    <p>The file doesn't contain any JSON content or it couldn't be parsed.</p>
                  </div>
                )}
              </section>
            )}

            {fileReader.isReading && (
              <div className="loading-overlay">
                <LoadingSpinner size="large" text="Uploading file..." />
              </div>
            )}
          </main>

          <footer className="app-footer">
            <p>Built with TanStack Ecosystem</p>
          </footer>
        </div>

      </ErrorBoundary>
    </QueryClientProvider>
  )
}

// Initialize the app
if (typeof window !== 'undefined') {
  const root = createRoot(document.getElementById('root')!)
  root.render(<App />)
}

export default App