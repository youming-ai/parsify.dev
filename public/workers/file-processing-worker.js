/**
 * File Processing Worker
 * Handles heavy file processing tasks in a separate thread
 */

/**
 * Process file conversion
 */
function convertFile(data) {
  const { fileData, sourceFormat, targetFormat, options = {} } = data;

  try {
    const startTime = performance.now();

    let result;
    let processingSteps = [];

    // Parse source format
    const parsedData = parseFileFormat(fileData, sourceFormat, options);
    processingSteps.push('parsed');

    // Convert to target format
    result = convertToTargetFormat(parsedData, targetFormat, options);
    processingSteps.push('converted');

    // Apply post-processing if needed
    if (options.postProcess) {
      result = postProcessFile(result, targetFormat, options.postProcess);
      processingSteps.push('post-processed');
    }

    const endTime = performance.now();

    return {
      success: true,
      data: {
        content: result.content,
        mimeType: result.mimeType,
        filename: generateFilename(options.originalFilename, sourceFormat, targetFormat),
        size: result.content.length
      },
      metadata: {
        processingTime: endTime - startTime,
        sourceFormat,
        targetFormat,
        processingSteps,
        originalSize: fileData.length,
        resultSize: result.content.length,
        compressionRatio: result.content.length / fileData.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FILE_CONVERSION_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Process batch file operations
 */
function processBatchFiles(data) {
  const { files, operation, options = {} } = data;

  try {
    const startTime = performance.now();
    const results = [];
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const result = processFileOperation(file, operation, options);
        results.push({
          index: i,
          success: true,
          data: result.data,
          metadata: result.metadata
        });
        processedCount++;

        // Report progress
        if (options.reportProgress) {
          self.postMessage({
            id: 'progress',
            type: 'task-progress',
            payload: {
              progress: (i + 1) / files.length * 100,
              message: `Processed ${i + 1} of ${files.length} files`
            },
            timestamp: new Date()
          });
        }
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: {
            code: 'BATCH_PROCESS_ERROR',
            message: error.message,
            recoverable: true
          }
        });
      }
    }

    const endTime = performance.now();

    return {
      success: true,
      data: {
        results,
        summary: {
          total: files.length,
          processed: processedCount,
          failed: files.length - processedCount,
          successRate: processedCount / files.length
        }
      },
      metadata: {
        processingTime: endTime - startTime,
        operation,
        averageTimePerFile: (endTime - startTime) / files.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'BATCH_OPERATION_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Extract text from various file types
 */
function extractText(data) {
  const { fileData, mimeType, options = {} } = data;

  try {
    const startTime = performance.now();

    let extractedText = '';
    let metadata = {};

    switch (mimeType) {
      case 'text/plain':
        extractedText = fileData;
        break;

      case 'application/pdf':
        const pdfResult = extractTextFromPDF(fileData);
        extractedText = pdfResult.text;
        metadata = pdfResult.metadata;
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        const docResult = extractTextFromDoc(fileData);
        extractedText = docResult.text;
        metadata = docResult.metadata;
        break;

      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        const excelResult = extractTextFromExcel(fileData);
        extractedText = excelResult.text;
        metadata = excelResult.metadata;
        break;

      case 'text/csv':
        const csvResult = extractTextFromCSV(fileData, options);
        extractedText = csvResult.text;
        metadata = csvResult.metadata;
        break;

      default:
        // Try to extract as text
        extractedText = new TextDecoder('utf-8', { fatal: false }).decode(fileData);
    }

    // Apply text cleaning if requested
    if (options.cleanText) {
      extractedText = cleanExtractedText(extractedText, options);
    }

    const endTime = performance.now();

    return {
      success: true,
      data: {
        text: extractedText,
        wordCount: countWords(extractedText),
        lineCount: countLines(extractedText),
        characterCount: extractedText.length
      },
      metadata: {
        processingTime: endTime - startTime,
        mimeType,
        extractionMethod: getExtractionMethod(mimeType),
        ...metadata
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'TEXT_EXTRACTION_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Optimize file size
 */
function optimizeFile(data) {
  const { fileData, mimeType, options = {} } = data;

  try {
    const startTime = performance.now();

    let optimizedData = fileData;
    let optimizationSteps = [];

    switch (mimeType) {
      case 'image/jpeg':
      case 'image/png':
      case 'image/webp':
        const imageResult = optimizeImage(fileData, mimeType, options);
        optimizedData = imageResult.data;
        optimizationSteps = imageResult.steps;
        break;

      case 'application/json':
        const jsonResult = optimizeJSON(fileData, options);
        optimizedData = jsonResult.data;
        optimizationSteps = jsonResult.steps;
        break;

      case 'text/csv':
        const csvResult = optimizeCSV(fileData, options);
        optimizedData = csvResult.data;
        optimizationSteps = csvResult.steps;
        break;

      default:
        // Apply generic compression
        optimizedData = compressGeneric(fileData, options);
        optimizationSteps = ['generic-compression'];
    }

    const compressionRatio = optimizedData.length / fileData.length;
    const sizeSaved = fileData.length - optimizedData.length;

    const endTime = performance.now();

    return {
      success: true,
      data: {
        content: optimizedData,
        size: optimizedData.length,
        originalSize: fileData.length,
        compressionRatio,
        sizeSaved
      },
      metadata: {
        processingTime: endTime - startTime,
        optimizationSteps,
        mimeType,
        compressionAlgorithm: getCompressionAlgorithm(options)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FILE_OPTIMIZATION_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

/**
 * Analyze file properties
 */
function analyzeFile(data) {
  const { fileData, mimeType, options = {} } = data;

  try {
    const startTime = performance.now();

    const analysis = {
      basic: analyzeBasicProperties(fileData, mimeType),
      content: analyzeContent(fileData, mimeType),
      structure: analyzeStructure(fileData, mimeType),
      security: analyzeSecurity(fileData, mimeType)
    };

    if (options.deepAnalysis) {
      analysis.deep = performDeepAnalysis(fileData, mimeType);
    }

    const endTime = performance.now();

    return {
      success: true,
      data: analysis,
      metadata: {
        processingTime: endTime - startTime,
        analysisLevel: options.deepAnalysis ? 'deep' : 'basic',
        fileSize: fileData.length,
        mimeType
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'FILE_ANALYSIS_ERROR',
        message: error.message,
        recoverable: true
      }
    };
  }
}

// Helper functions

/**
 * Parse file format based on MIME type
 */
function parseFileFormat(fileData, format, options) {
  switch (format) {
    case 'json':
      return JSON.parse(new TextDecoder().decode(fileData));
    case 'csv':
      return parseCSV(new TextDecoder().decode(fileData), options);
    case 'xml':
      return parseXML(new TextDecoder().decode(fileData));
    case 'yaml':
    case 'yml':
      return parseYAML(new TextDecoder().decode(fileData));
    case 'txt':
      return new TextDecoder().decode(fileData);
    default:
      throw new Error(`Unsupported source format: ${format}`);
  }
}

/**
 * Convert parsed data to target format
 */
function convertToTargetFormat(data, format, options) {
  switch (format) {
    case 'json':
      return {
        content: JSON.stringify(data, null, options.indent || 2),
        mimeType: 'application/json'
      };
    case 'csv':
      return {
        content: convertToCSV(data, options),
        mimeType: 'text/csv'
      };
    case 'xml':
      return {
        content: convertToXML(data, options),
        mimeType: 'application/xml'
      };
    case 'yaml':
      return {
        content: convertToYAML(data, options),
        mimeType: 'text/yaml'
      };
    case 'txt':
      return {
        content: convertToPlainText(data, options),
        mimeType: 'text/plain'
      };
    default:
      throw new Error(`Unsupported target format: ${format}`);
  }
}

/**
 * Generate new filename for converted file
 */
function generateFilename(originalFilename, sourceFormat, targetFormat) {
  if (!originalFilename) return `converted.${targetFormat}`;

  const nameWithoutExt = originalFilename.replace(/\.[^.]+$/, '');
  return `${nameWithoutExt}.${targetFormat}`;
}

/**
 * Process individual file operation
 */
function processFileOperation(file, operation, options) {
  switch (operation.type) {
    case 'convert':
      return convertFile({
        fileData: file.data,
        sourceFormat: operation.sourceFormat,
        targetFormat: operation.targetFormat,
        options: operation.options
      });
    case 'extract-text':
      return extractText({
        fileData: file.data,
        mimeType: file.mimeType,
        options: operation.options
      });
    case 'optimize':
      return optimizeFile({
        fileData: file.data,
        mimeType: file.mimeType,
        options: operation.options
      });
    case 'analyze':
      return analyzeFile({
        fileData: file.data,
        mimeType: file.mimeType,
        options: operation.options
      });
    default:
      throw new Error(`Unknown operation: ${operation.type}`);
  }
}

/**
 * Basic file analysis
 */
function analyzeBasicProperties(fileData, mimeType) {
  return {
    size: fileData.length,
    mimeType,
    lastModified: new Date().toISOString(),
    encoding: 'binary',
    hash: simpleHash(fileData)
  };
}

/**
 * Content analysis
 */
function analyzeContent(fileData, mimeType) {
  const content = new TextDecoder('utf-8', { fatal: false }).decode(fileData);

  return {
    textLength: content.length,
    lineCount: countLines(content),
    wordCount: countWords(content),
    characterCount: content.length,
    estimatedReadingTime: Math.ceil(countWords(content) / 200), // 200 WPM average
    language: detectLanguage(content)
  };
}

/**
 * Structure analysis
 */
function analyzeStructure(fileData, mimeType) {
  try {
    switch (mimeType) {
      case 'application/json':
        const jsonData = JSON.parse(new TextDecoder().decode(fileData));
        return analyzeJSONStructure(jsonData);
      case 'text/csv':
        const csvData = parseCSV(new TextDecoder().decode(fileData));
        return analyzeCSVStructure(csvData);
      default:
        return { type: 'unknown', structure: 'unstructured' };
    }
  } catch (error) {
    return { type: 'unknown', structure: 'unstructured', error: error.message };
  }
}

/**
 * Security analysis
 */
function analyzeSecurity(fileData, mimeType) {
  const content = new TextDecoder('utf-8', { fatal: false }).decode(fileData);

  return {
    containsScripts: /<script|javascript:|on\w+=/i.test(content),
    containsSuspiciousPatterns: /eval\(|exec\(|system\(|\$\(.*\)/i.test(content),
    containsPersonalInfo: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b|\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content),
    riskLevel: calculateRiskLevel(content)
  };
}

/**
 * Deep file analysis
 */
function performDeepAnalysis(fileData, mimeType) {
  // This would include more sophisticated analysis
  return {
    complexity: calculateComplexity(fileData, mimeType),
    quality: assessQuality(fileData, mimeType),
    recommendations: generateRecommendations(fileData, mimeType)
  };
}

/**
 * Utility functions
 */

function parseCSV(csvText, options = {}) {
  const lines = csvText.split('\n');
  const delimiter = options.delimiter || ',';
  const headers = options.headers !== false ? parseCSVLine(lines[0], delimiter) : null;

  const data = headers ?
    lines.slice(1).map(line => parseCSVLine(line, delimiter)) :
    lines.map(line => parseCSVLine(line, delimiter));

  return headers ? { headers, data } : data;
}

function parseCSVLine(line, delimiter) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseXML(xmlText) {
  // Simplified XML parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid XML format');
  }

  return xmlToJson(doc.documentElement);
}

function parseYAML(yamlText) {
  // Simplified YAML parsing
  const lines = yamlText.split('\n');
  const result = {};
  let currentSection = result;
  let indent = 0;

  for (const line of lines) {
    if (line.trim() === '') continue;

    const lineIndent = line.match(/^ */)[0].length;
    const trimmed = line.trim();

    if (trimmed.includes(':')) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();

      if (value) {
        currentSection[key] = parseValue(value);
      } else {
        currentSection[key] = {};
      }
    }
  }

  return result;
}

function parseValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (!isNaN(value) && value !== '') return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
}

function xmlToJson(xml) {
  const obj = {};

  if (xml.nodeType === 1) { // element
    if (xml.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < xml.attributes.length; i++) {
        const attribute = xml.attributes.item(i);
        obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType === 3) { // text
    obj = xml.nodeValue.trim();
  }

  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const child = xml.childNodes.item(i);
      const nodeName = child.nodeName;

      if (typeof obj[nodeName] === 'undefined') {
        obj[nodeName] = xmlToJson(child);
      } else {
        if (!Array.isArray(obj[nodeName])) {
          obj[nodeName] = [obj[nodeName]];
        }
        obj[nodeName].push(xmlToJson(child));
      }
    }
  }

  return obj;
}

function convertToCSV(data, options) {
  if (Array.isArray(data)) {
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const item of data) {
      const row = headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  return '';
}

function convertToXML(data, options) {
  const rootName = options.rootName || 'root';
  const indent = options.indent || 2;

  function toXml(obj, tagName, level = 0) {
    const spaces = ' '.repeat(level * indent);

    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      let xml = `${spaces}<${tagName}>\n`;

      for (const [key, value] of Object.entries(obj)) {
        xml += toXml(value, key, level + 1);
      }

      xml += `${spaces}</${tagName}>\n`;
      return xml;
    } else {
      return `${spaces}<${tagName}>${escapeXml(String(obj))}</${tagName}>\n`;
    }
  }

  return toXml(data, rootName).trim();
}

function convertToYAML(data, options = {}) {
  const indent = options.indent || 2;

  function toYaml(obj, level = 0) {
    const spaces = ' '.repeat(level * indent);

    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      const entries = Object.entries(obj);
      return entries.map(([key, value]) => {
        const valueYaml = toYaml(value, level + 1);
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:\n${valueYaml}`;
        }
        return `${spaces}${key}: ${valueYaml}`;
      }).join('\n');
    } else if (Array.isArray(obj)) {
      return obj.map(item => {
        const itemYaml = toYaml(item, level + 1);
        if (typeof item === 'object' && item !== null) {
          return `${spaces}-\n${itemYaml}`;
        }
        return `${spaces}- ${itemYaml}`;
      }).join('\n');
    } else {
      return String(obj);
    }
  }

  return toYaml(data);
}

function convertToPlainText(data, options) {
  if (typeof data === 'string') return data;
  if (typeof data === 'number') return String(data);
  if (typeof data === 'boolean') return data ? 'true' : 'false';
  if (data === null || data === undefined) return '';

  if (Array.isArray(data)) {
    return data.map(item => convertToPlainText(item, options)).join('\n');
  }

  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${convertToPlainText(value, options)}`)
      .join('\n');
  }

  return '';
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function countLines(text) {
  return text.split('\n').length;
}

function detectLanguage(text) {
  // Simple language detection based on common patterns
  const patterns = {
    en: /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/i,
    es: /\b(el|la|y|o|pero|en|de|para|con|por)\b/i,
    fr: /\b(le|la|et|ou|mais|dans|de|pour|avec|par)\b/i,
    de: /\b(der|die|das|und|oder|aber|in|an|zu|für|mit|von)\b/i
  };

  let maxScore = 0;
  let detectedLang = 'unknown';

  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    const score = matches ? matches.length : 0;

    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  }

  return detectedLang;
}

function simpleHash(data) {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

function calculateRiskLevel(content) {
  let riskScore = 0;

  // Check for suspicious patterns
  if (/eval\(|exec\(|system\(/.test(content)) riskScore += 3;
  if (/document\.cookie|localStorage|sessionStorage/.test(content)) riskScore += 2;
  if (/innerHTML|outerHTML/.test(content)) riskScore += 1;

  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  if (riskScore >= 1) return 'low';
  return 'none';
}

function analyzeJSONStructure(jsonData) {
  function analyze(obj, depth = 0) {
    if (depth > 10) return { maxDepth: depth };

    if (Array.isArray(obj)) {
      return {
        type: 'array',
        length: obj.length,
        maxDepth: Math.max(...obj.map(item => analyze(item, depth + 1).maxDepth || depth))
      };
    }

    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      const childDepths = keys.map(key => analyze(obj[key], depth + 1).maxDepth || depth);

      return {
        type: 'object',
        keyCount: keys.length,
        keys,
        maxDepth: Math.max(...childDepths)
      };
    }

    return { type: typeof obj, maxDepth: depth };
  }

  return analyze(jsonData);
}

function analyzeCSVStructure(csvData) {
  if (Array.isArray(csvData)) {
    return {
      type: 'array',
      rowCount: csvData.length,
      columnCount: csvData.length > 0 ? csvData[0].length : 0
    };
  }

  return {
    type: 'structured',
    rowCount: csvData.data.length,
    columnCount: csvData.headers.length,
    headers: csvData.headers
  };
}

function calculateComplexity(fileData, mimeType) {
  // Simplified complexity calculation
  const content = new TextDecoder('utf-8', { fatal: false }).decode(fileData);
  const lines = content.split('\n');

  return {
    linesOfCode: lines.length,
    cyclomaticComplexity: Math.min(10, lines.filter(line => line.includes('if') || line.includes('for') || line.includes('while')).length),
    maintainabilityIndex: Math.max(0, 100 - lines.length * 0.1)
  };
}

function assessQuality(fileData, mimeType) {
  const content = new TextDecoder('utf-8', { fatal: false }).decode(fileData);

  return {
    readabilityScore: Math.max(0, 100 - content.length * 0.01),
    duplicationScore: 0, // Would need more sophisticated analysis
    errorDensity: 0 // Would need parsing and error detection
  };
}

function generateRecommendations(fileData, mimeType) {
  const recommendations = [];
  const size = fileData.length;

  if (size > 1024 * 1024) {
    recommendations.push('Consider compressing large files');
  }

  if (mimeType === 'application/json') {
    recommendations.push('Consider using schema validation');
  }

  return recommendations;
}

// Placeholder functions for unsupported formats
function extractTextFromPDF(data) {
  return { text: 'PDF extraction not implemented', metadata: { pages: 0 } };
}

function extractTextFromDoc(data) {
  return { text: 'Document extraction not implemented', metadata: { type: 'docx' } };
}

function extractTextFromExcel(data) {
  return { text: 'Excel extraction not implemented', metadata: { sheets: 0 } };
}

function extractTextFromCSV(data, options) {
  const csvText = new TextDecoder().decode(data);
  return {
    text: csvText,
    metadata: {
      rows: csvText.split('\n').length,
      delimiter: options.delimiter || ','
    }
  };
}

function cleanExtractedText(text, options) {
  // Basic text cleaning
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function getExtractionMethod(mimeType) {
  const methods = {
    'text/plain': 'direct',
    'application/json': 'parsed',
    'text/csv': 'parsed',
    'application/pdf': 'pdf-extractor',
    'application/xml': 'xml-parser'
  };

  return methods[mimeType] || 'text-decoder';
}

function optimizeImage(data, mimeType, options) {
  return {
    data, // Would implement image optimization
    steps: ['image-optimization']
  };
}

function optimizeJSON(data, options) {
  const jsonText = new TextDecoder().decode(data);
  const minified = JSON.stringify(JSON.parse(jsonText));

  return {
    data: new TextEncoder().encode(minified),
    steps: ['json-minification']
  };
}

function optimizeCSV(data, options) {
  const csvText = new TextDecoder().decode(data);
  // Remove extra whitespace and empty lines
  const optimized = csvText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  return {
    data: new TextEncoder().encode(optimized),
    steps: ['csv-optimization']
  };
}

function compressGeneric(data, options) {
  // Would implement compression algorithm
  return data;
}

function getCompressionAlgorithm(options) {
  return options.algorithm || 'generic';
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
          case 'convert-file':
            result = convertFile(data);
            break;
          case 'process-batch':
            result = processBatchFiles(data);
            break;
          case 'extract-text':
            result = extractText(data);
            break;
          case 'optimize-file':
            result = optimizeFile(data);
            break;
          case 'analyze-file':
            result = analyzeFile(data);
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
  payload: { capabilities: ['convert-file', 'process-batch', 'extract-text', 'optimize-file', 'analyze-file'] },
  timestamp: new Date()
});
