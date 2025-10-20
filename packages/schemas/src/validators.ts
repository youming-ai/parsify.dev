/**
 * Validation schemas and utilities
 */

// Basic validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validateUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export const validateJson = (jsonString: string): { valid: boolean; error?: string } => {
  try {
    JSON.parse(jsonString)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid JSON' }
  }
}
