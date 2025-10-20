import type { JsonNode, JsonObject, JsonArray, JsonPrimitive } from '../types'

export class JsonNodeModel {
  static getType(node: JsonNode): string {
    if (node === null) return 'null'
    if (Array.isArray(node)) return 'array'
    if (typeof node === 'object') return 'object'
    if (typeof node === 'string') return 'string'
    if (typeof node === 'number') return 'number'
    if (typeof node === 'boolean') return 'boolean'
    return 'unknown'
  }

  static getValue(node: JsonNode): any {
    return node
  }

  static getPath(path: string, node: JsonNode): JsonNode | null {
    if (!node || typeof node !== 'object') {
      return null
    }

    try {
      const parts = path.split('.').filter(part => part.length > 0)
      let current: JsonNode = node

      for (const part of parts) {
        // Handle array indices like "items[0]"
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)
        if (arrayMatch) {
          const [, key, index] = arrayMatch
          if (current && typeof current === 'object' && !Array.isArray(current)) {
            const obj = current as JsonObject
            if (key in obj && Array.isArray(obj[key])) {
              current = obj[key][parseInt(index)]
            } else {
              return null
            }
          } else {
            return null
          }
        } else {
          if (current && typeof current === 'object') {
            if (Array.isArray(current)) {
              const index = parseInt(part)
              if (!isNaN(index) && index >= 0 && index < current.length) {
                current = current[index]
              } else {
                return null
              }
            } else {
              const obj = current as JsonObject
              if (part in obj) {
                current = obj[part]
              } else {
                return null
              }
            }
          } else {
            return null
          }
        }
      }

      return current
    } catch {
      return null
    }
  }

  static setPath(path: string, node: JsonNode, value: JsonNode): JsonNode | null {
    if (!node || typeof node !== 'object') {
      return null
    }

    try {
      const parts = path.split('.').filter(part => part.length > 0)
      const lastPart = parts.pop()!
      let current: any = JSON.parse(JSON.stringify(node)) // Deep clone

      // Navigate to the parent
      for (const part of parts) {
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/)
        if (arrayMatch) {
          const [, key, index] = arrayMatch
          if (current && typeof current === 'object' && !Array.isArray(current)) {
            if (key in current && Array.isArray(current[key])) {
              current = current[key][parseInt(index)]
            } else {
              return null
            }
          } else {
            return null
          }
        } else {
          if (current && typeof current === 'object') {
            if (Array.isArray(current)) {
              const index = parseInt(part)
              if (!isNaN(index) && index >= 0 && index < current.length) {
                current = current[index]
              } else {
                return null
              }
            } else {
              if (!(part in current)) {
                current[part] = {}
              }
              current = current[part]
            }
          } else {
            return null
          }
        }
      }

      // Set the value
      if (current && typeof current === 'object') {
        if (Array.isArray(current)) {
          const index = parseInt(lastPart)
          if (!isNaN(index) && index >= 0) {
            current[index] = value
          } else {
            return null
          }
        } else {
          current[lastPart] = value
        }
        return current
      }

      return null
    } catch {
      return null
    }
  }

  static search(node: JsonNode, searchTerm: string, path: string = ''): Array<{ path: string; node: JsonNode; match: string }> {
    const results: Array<{ path: string; node: JsonNode; match: string }> = []
    const term = searchTerm.toLowerCase()

    const searchRecursive = (current: JsonNode, currentPath: string): void => {
      if (current === null || current === undefined) {
        return
      }

      if (typeof current === 'string') {
        if (current.toLowerCase().includes(term)) {
          results.push({
            path: currentPath,
            node: current,
            match: current
          })
        }
      } else if (typeof current === 'number' || typeof current === 'boolean') {
        const strValue = String(current)
        if (strValue.includes(term)) {
          results.push({
            path: currentPath,
            node: current,
            match: strValue
          })
        }
      } else if (Array.isArray(current)) {
        current.forEach((item, index) => {
          searchRecursive(item, `${currentPath}[${index}]`)
        })
      } else if (typeof current === 'object') {
        Object.entries(current).forEach(([key, value]) => {
          // Check if key matches
          if (key.toLowerCase().includes(term)) {
            results.push({
              path: `${currentPath}.${key}`,
              node: value,
              match: key
            })
          }
          // Recursively search value
          searchRecursive(value, `${currentPath}.${key}`)
        })
      }
    }

    searchRecursive(node, path)
    return results
  }

  static getDepth(node: JsonNode, currentDepth: number = 0): number {
    if (node === null || typeof node !== 'object') {
      return currentDepth
    }

    if (Array.isArray(node)) {
      if (node.length === 0) {
        return currentDepth
      }
      return Math.max(...node.map(item => this.getDepth(item, currentDepth + 1)))
    }

    const keys = Object.keys(node)
    if (keys.length === 0) {
      return currentDepth
    }

    return Math.max(...keys.map(key => this.getDepth((node as JsonObject)[key], currentDepth + 1)))
  }

  static getSize(node: JsonNode): number {
    if (node === null || typeof node !== 'object') {
      return 1
    }

    if (Array.isArray(node)) {
      return node.reduce((total, item) => total + this.getSize(item), 1)
    }

    return Object.keys(node).reduce((total, key) => {
      return total + this.getSize((node as JsonObject)[key])
    }, 1)
  }

  static formatValue(node: JsonNode, indent: number = 0): string {
    const spaces = '  '.repeat(indent)

    if (node === null) {
      return 'null'
    }

    if (typeof node === 'string') {
      return `"${node}"`
    }

    if (typeof node === 'number' || typeof node === 'boolean') {
      return String(node)
    }

    if (Array.isArray(node)) {
      if (node.length === 0) {
        return '[]'
      }

      const items = node.map(item => {
        const formatted = this.formatValue(item, indent + 1)
        return `${spaces}  ${formatted}`
      }).join(',\n')

      return `[\n${items}\n${spaces}]`
    }

    if (typeof node === 'object') {
      const keys = Object.keys(node)
      if (keys.length === 0) {
        return '{}'
      }

      const items = keys.map(key => {
        const value = (node as JsonObject)[key]
        const formatted = this.formatValue(value, indent + 1)
        return `${spaces}  "${key}": ${formatted}`
      }).join(',\n')

      return `{\n${items}\n${spaces}}`
    }

    return String(node)
  }

  static isValidJsonNode(value: any): value is JsonNode {
    return (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      Array.isArray(value) ||
      (typeof value === 'object' && value !== null && !Array.isArray(value))
    )
  }

  static clone(node: JsonNode): JsonNode {
    return JSON.parse(JSON.stringify(node))
  }
}