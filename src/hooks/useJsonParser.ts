import { useMutation } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { logError } from '../lib/errorHandler'
import { JsonParsingService } from '../lib/services/jsonParsingService'
import type { FileParseRequest, JsonDocument } from '../lib/types'

interface UseJsonParserOptions {
  onSuccess?: (documents: JsonDocument[]) => void
  onError?: (error: Error) => void
}

interface UseJsonParserReturn {
  parseJson: (
    content: string,
    extractMode?: 'codeblock' | 'inline' | 'mixed'
  ) => Promise<JsonDocument[]>
  parseFile: (request: FileParseRequest) => Promise<JsonDocument[]>
  isParsing: boolean
  error: Error | null
  reset: () => void
}

export const useJsonParser = (options: UseJsonParserOptions = {}): UseJsonParserReturn => {
  const { onSuccess, onError } = options
  const [error, setError] = useState<Error | null>(null)

  const jsonParsingService = new JsonParsingService()

  const parseMutation = useMutation({
    mutationFn: async ({
      content,
      extractMode = 'mixed',
    }: {
      content: string
      extractMode?: 'codeblock' | 'inline' | 'mixed'
    }) => {
      try {
        setError(null)

        const request: FileParseRequest = {
          content,
          options: {
            extractMode,
            maxDepth: 20,
          },
        }

        const response = await jsonParsingService.parseFile(request)

        if (!response.success) {
          const errorMessages = response.errors.map(e => e.message).join('; ')
          throw new Error(errorMessages)
        }

        // Notify success callback
        if (onSuccess) {
          onSuccess(response.documents)
        }

        return response.documents
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
        setError(new Error(errorMessage))
        logError(error, 'useJsonParser.parse')

        // Notify error callback
        if (onError) {
          onError(new Error(errorMessage))
        }

        throw error
      }
    },
    onError: error => {
      setError(error)
      logError(error, 'useJsonParser.mutation')
    },
  })

  const parseJson = useCallback(
    async (
      content: string,
      extractMode: 'codeblock' | 'inline' | 'mixed' = 'mixed'
    ): Promise<JsonDocument[]> => {
      return parseMutation.mutateAsync({ content, extractMode })
    },
    [parseMutation]
  )

  const parseFile = useCallback(
    async (request: FileParseRequest): Promise<JsonDocument[]> => {
      try {
        setError(null)

        const response = await jsonParsingService.parseFile(request)

        if (!response.success) {
          const errorMessages = response.errors.map(e => e.message).join('; ')
          throw new Error(errorMessages)
        }

        // Notify success callback
        if (onSuccess) {
          onSuccess(response.documents)
        }

        return response.documents
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error'
        setError(new Error(errorMessage))
        logError(error, 'useJsonParser.parseFile')

        // Notify error callback
        if (onError) {
          onError(new Error(errorMessage))
        }

        throw error
      }
    },
    [jsonParsingService, onSuccess, onError]
  )

  const reset = useCallback(() => {
    setError(null)
    parseMutation.reset()
  }, [parseMutation])

  return {
    parseJson,
    parseFile,
    isParsing: parseMutation.isPending,
    error,
    reset,
  }
}

export default useJsonParser
