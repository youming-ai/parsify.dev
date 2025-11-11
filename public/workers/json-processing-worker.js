/**
 * JSON Processing Worker
 * Handles heavy JSON processing tasks in a separate thread
 */

// Import JSON processing utilities
// Note: In a real implementation, these would be imported from the main codebase

/**
 * Parse and validate JSON data
 */
function parseAndValidate(data) {
  const { jsonString, options = {} } = data;

  try {
    const startTime = performance.now();

    // Parse JSON
    const parsed = JSON.parse(jsonString);

    // Validate structure if schema provided
    if (options.schema) {
      const validation = validateJsonSchema(parsed, options.schema);
      if (!validation.valid) {
        throw new Error(`JSON validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Format if requested
    let result = parsed;
    if (options.format) {
      result = formatJson(parsed, options.indent || 2);
    }

    const endTime = performance.now();

    return {
      success: true,
      data: result,
      metadata: {
        processingTime: endTime - startTime,
        size: JSON.stringify(parsed).length,
        parseTime: endTime - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'JSON_PARSE_ERROR',
        message: error.message,
        line: extractErrorLine(error.message),
        recoverable: true
      }
    };
  }
}

/**
 * Transform JSON data
 */
function transformJson(data) {
  const { input, transformation, options = {} } = data;

  try {
    const startTime = performance.now();

    let result = input;

    switch (transformation.type) {
      case 'filter':
        result = filterJson(input, transformation.rules);
        break;
      case 'map':
        result = mapJson(input, transformation.rules);
        break;
      case 'sort':
        result = sortJson(input, transformation.rules);
        break;
      case 'groupBy':
        result = groupJson(input, transformation.rules);
        break;
      case 'flatten':
        result = flattenJson(input, options.depth);
        break;
      case 'merge':
        result = mergeJson(input, transformation.other, transformation.options);
        break;
      default:
        throw new Error(`Unknown transformation type: ${transformation.type}`);
    }

    const endTime = performance.now();

    return {
      success: true,
      data: result,
      metadata: {
        processingTime: endTime - startTime,
        transformation: transformation.type,
        originalSize: JSON.stringify(input).length,
        resultSize: JSON.stringify(result).length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'TRANSFORMATION_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Query JSON using JSONPath
 */
function queryJson(data) {
  const { input, query, options = {} } = data;

  try {
    const startTime = performance.now();

    // Simple JSONPath implementation
    const results = jsonPathQuery(input, query);

    const endTime = performance.now();

    return {
      success: true,
      data: results,
      metadata: {
        processingTime: endTime - startTime,
        query,
        resultCount: Array.isArray(results) ? results.length : 1
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'JSONPATH_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Compare two JSON objects
 */
function compareJson(data) {
  const { left, right, options = {} } = data;

  try {
    const startTime = performance.now();

    const differences = deepDiff(left, right, options);

    const endTime = performance.now();

    return {
      success: true,
      data: {
        equal: differences.length === 0,
        differences,
        summary: {
          leftSize: JSON.stringify(left).length,
          rightSize: JSON.stringify(right).length,
          diffCount: differences.length
        }
      },
      metadata: {
        processingTime: endTime - startTime
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'COMPARISON_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Convert JSON to other formats
 */
function convertJson(data) {
  const { input, targetFormat, options = {} } = data;

  try {
    const startTime = performance.now();

    let result;
    let mimeType;

    switch (targetFormat) {
      case 'csv':
        result = jsonToCsv(input, options);
        mimeType = 'text/csv';
        break;
      case 'xml':
        result = jsonToXml(input, options);
        mimeType = 'application/xml';
        break;
      case 'yaml':
        result = jsonToYaml(input, options);
        mimeType = 'text/yaml';
        break;
      case 'properties':
        result = jsonToProperties(input, options);
        mimeType = 'text/plain';
        break;
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }

    const endTime = performance.now();

    return {
      success: true,
      data: {
        content: result,
        mimeType,
        size: result.length
      },
      metadata: {
        processingTime: endTime - startTime,
        sourceFormat: 'json',
        targetFormat,
        originalSize: JSON.stringify(input).length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'CONVERSION_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Validate JSON schema
 */
function validateJsonSchema(data, schema) {
  // Simplified schema validation
  const errors = [];

  function validate(value, schemaPart, path = '') {
    if (schemaPart.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schemaPart.type) {
        errors.push(`Type mismatch at ${path}: expected ${schemaPart.type}, got ${actualType}`);
      }
    }

    if (schemaPart.required && (value === null || value === undefined)) {
      errors.push(`Required property missing at ${path}`);
    }

    if (schemaPart.properties && typeof value === 'object' && value !== null) {
      for (const [key, subSchema] of Object.entries(schemaPart.properties)) {
        validate(value[key], subSchema, path ? `${path}.${key}` : key);
      }
    }

    if (schemaPart.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        validate(item, schemaPart.items, `${path}[${index}]`);
      });
    }
  }

  validate(data, schema);

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format JSON with proper indentation
 */
function formatJson(obj, indent = 2) {
  return JSON.stringify(obj, null, indent);
}

/**
 * Extract line number from JSON parse error
 */
function extractErrorLine(errorMessage) {
  const match = errorMessage.match(/line (\d+)/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Filter JSON data based on rules
 */
function filterJson(input, rules) {
  if (!Array.isArray(input)) {
    return input;
  }

  return input.filter(item => {
    return rules.every(rule => {
      const { field, operator, value } = rule;
      const itemValue = getNestedValue(item, field);

      switch (operator) {
        case 'eq': return itemValue === value;
        case 'ne': return itemValue !== value;
        case 'gt': return itemValue > value;
        case 'gte': return itemValue >= value;
        case 'lt': return itemValue < value;
        case 'lte': return itemValue <= value;
        case 'contains': return String(itemValue).includes(value);
        case 'startsWith': return String(itemValue).startsWith(value);
        case 'endsWith': return String(itemValue).endsWith(value);
        default: return true;
      }
    });
  });
}

/**
 * Map JSON data based on rules
 */
function mapJson(input, rules) {
  if (!Array.isArray(input)) {
    return applyMappingRules(input, rules);
  }

  return input.map(item => applyMappingRules(item, rules));
}

/**
 * Apply mapping rules to an object
 */
function applyMappingRules(obj, rules) {
  const result = {};

  for (const [targetPath, sourcePath] of Object.entries(rules)) {
    if (typeof sourcePath === 'string') {
      setNestedValue(result, targetPath, getNestedValue(obj, sourcePath));
    } else if (typeof sourcePath === 'function') {
      setNestedValue(result, targetPath, sourcePath(obj));
    }
  }

  return result;
}

/**
 * Sort JSON data
 */
function sortJson(input, rules) {
  if (!Array.isArray(input)) {
    return input;
  }

  return [...input].sort((a, b) => {
    for (const rule of rules) {
      const { field, direction = 'asc' } = rule;
      const aVal = getNestedValue(a, field);
      const bVal = getNestedValue(b, field);

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Group JSON data
 */
function groupJson(input, rules) {
  if (!Array.isArray(input)) {
    return input;
  }

  const { field } = rules;
  const groups = {};

  input.forEach(item => {
    const key = getNestedValue(item, field);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  return groups;
}

/**
 * Flatten JSON object
 */
function flattenJson(obj, depth = Infinity) {
  const result = {};

  function flatten(current, prefix = '', currentDepth = 0) {
    if (currentDepth >= depth) {
      result[prefix || 'root'] = current;
      return;
    }

    for (const [key, value] of Object.entries(current)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        flatten(value, newPrefix, currentDepth + 1);
      } else {
        result[newPrefix] = value;
      }
    }
  }

  flatten(obj);
  return result;
}

/**
 * Merge JSON objects
 */
function mergeJson(left, right, options = {}) {
  const { strategy = 'overwrite' } = options;

  function merge(target, source) {
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        merge(target[key], value);
      } else {
        target[key] = value;
      }
    }
    return target;
  }

  if (strategy === 'merge') {
    return merge(JSON.parse(JSON.stringify(left)), right);
  } else {
    return { ...left, ...right };
  }
}

/**
 * Simple JSONPath query implementation
 */
function jsonPathQuery(obj, path) {
  // Simplified JSONPath - only supports basic dot notation
  const parts = path.replace(/^\$\.?/, '').split('.');
  let current = obj;

  for (const part of parts) {
    if (part === '*') {
      // Wildcard - return all values at this level
      if (Array.isArray(current)) {
        return current.map(item => jsonPathQuery(item, parts.slice(parts.indexOf(part) + 1).join('.')));
      } else if (typeof current === 'object' && current !== null) {
        return Object.values(current);
      }
    } else if (Array.isArray(current)) {
      const index = parseInt(part);
      if (!isNaN(index)) {
        current = current[index];
      } else {
        // Property access on array items
        return current.map(item => jsonPathQuery(item, parts.join('.')));
      }
    } else if (typeof current === 'object' && current !== null) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Deep diff two objects
 */
function deepDiff(left, right, options = {}) {
  const { path = [] } = options;
  const differences = [];

  if (left === right) {
    return differences;
  }

  if (typeof left !== typeof right) {
    differences.push({
      path: path.join('.'),
      type: 'type_change',
      left,
      right
    });
    return differences;
  }

  if (left === null || right === null || typeof left !== 'object') {
    differences.push({
      path: path.join('.'),
      type: 'value_change',
      left,
      right
    });
    return differences;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  const allKeys = new Set([...leftKeys, ...rightKeys]);

  for (const key of allKeys) {
    const currentPath = [...path, key];

    if (!(key in left)) {
      differences.push({
        path: currentPath.join('.'),
        type: 'added',
        right: right[key]
      });
    } else if (!(key in right)) {
      differences.push({
        path: currentPath.join('.'),
        type: 'removed',
        left: left[key]
      });
    } else {
      differences.push(...deepDiff(left[key], right[key], { path: currentPath }));
    }
  }

  return differences;
}

/**
 * Get nested value from object
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Set nested value in object
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * Convert JSON to CSV
 */
function jsonToCsv(data, options = {}) {
  const { delimiter = ',', headers = true } = options;

  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const allKeys = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const keys = Array.from(allKeys);
  let csv = '';

  if (headers) {
    csv += keys.join(delimiter) + '\n';
  }

  data.forEach(item => {
    const row = keys.map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(delimiter)) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csv += row.join(delimiter) + '\n';
  });

  return csv;
}

/**
 * Convert JSON to XML
 */
function jsonToXml(obj, options = {}) {
  const { rootName = 'root', indent = 2 } = options;

  function toXml(value, tagName, level = 0) {
    const spaces = ' '.repeat(level * indent);

    if (value === null || value === undefined) {
      return `${spaces}<${tagName} />\n`;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      let xml = `${spaces}<${tagName}>\n`;
      for (const [key, val] of Object.entries(value)) {
        xml += toXml(val, key, level + 1);
      }
      xml += `${spaces}</${tagName}>\n`;
      return xml;
    }

    if (Array.isArray(value)) {
      let xml = `${spaces}<${tagName}>\n`;
      value.forEach((item, index) => {
        xml += toXml(item, 'item', level + 1);
      });
      xml += `${spaces}</${tagName}>\n`;
      return xml;
    }

    return `${spaces}<${tagName}>${escapeXml(String(value))}</${tagName}>\n`;
  }

  return toXml(obj, rootName);
}

/**
 * Convert JSON to YAML
 */
function jsonToYaml(obj, options = {}) {
  const { indent = 2 } = options;

  function toYaml(value, level = 0) {
    const spaces = ' '.repeat(level * indent);

    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '\\"')}"`;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.map(item => {
        const itemYaml = toYaml(item, level + 1);
        if (typeof item === 'object' && item !== null) {
          return `${spaces}-\n${itemYaml}`;
        }
        return `${spaces}- ${itemYaml}`;
      }).join('\n');
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      return entries.map(([key, val]) => {
        const valYaml = toYaml(val, level + 1);
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return `${spaces}${key}:\n${valYaml}`;
        }
        return `${spaces}${key}: ${valYaml}`;
      }).join('\n');
    }

    return String(value);
  }

  return toYaml(obj);
}

/**
 * Convert JSON to Properties format
 */
function jsonToProperties(obj, options = {}) {
  const { prefix = '', separator = '.' } = options;

  function flatten(current, currentPrefix = '') {
    const result = [];

    for (const [key, value] of Object.entries(current)) {
      const fullKey = currentPrefix ? `${currentPrefix}${separator}${key}` : key;

      if (value === null || value === undefined) {
        result.push(`${prefix}${fullKey}=`);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        result.push(...flatten(value, fullKey));
      } else {
        result.push(`${prefix}${fullKey}=${String(value)}`);
      }
    }

    return result;
  }

  return flatten(obj).join('\n');
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Message handling
self.onmessage = function(event) {
  const { id, type, payload } = event.data;

  try {
    let result;

    switch (type) {
      case 'task-execute':
        const { taskId, type: taskType, data } = payload;

        switch (taskType) {
          case 'parse-and-validate':
            result = parseAndValidate(data);
            break;
          case 'transform':
            result = transformJson(data);
            break;
          case 'query':
            result = queryJson(data);
            break;
          case 'compare':
            result = compareJson(data);
            break;
          case 'convert':
            result = convertJson(data);
            break;
          default:
            throw new Error(`Unknown task type: ${taskType}`);
        }

        self.postMessage({
          id,
          type: 'task-complete',
          taskId,
          payload: result,
          timestamp: new Date()
        });
        break;

      case 'task-cancel':
        // Handle task cancellation
        self.postMessage({
          id,
          type: 'task-complete',
          taskId: payload.taskId,
          payload: {
            success: false,
            error: {
              code: 'TASK_CANCELLED',
              message: 'Task was cancelled',
              recoverable: false
            }
          },
          timestamp: new Date()
        });
        break;

      case 'ping':
        self.postMessage({
          id,
          type: 'pong',
          payload: { timestamp: new Date() },
          timestamp: new Date()
        });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'task-error',
      taskId: payload?.taskId,
      payload: {
        code: 'WORKER_ERROR',
        message: error.message,
        stack: error.stack,
        recoverable: true
      },
      timestamp: new Date()
    });
  }
};

// Send ready message
self.postMessage({
  id: 'init',
  type: 'worker-ready',
  payload: { capabilities: ['parse-and-validate', 'transform', 'query', 'compare', 'convert'] },
  timestamp: new Date()
});
