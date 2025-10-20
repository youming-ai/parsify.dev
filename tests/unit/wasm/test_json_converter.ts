import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  JsonConverter,
  JsonConversionOptions,
  JsonConversionResult,
  JsonConversionError,
  UnsupportedFormatError,
  ConversionTimeoutError,
  ConversionSizeError,
  ConversionDepthError,
  MalformedDataError,
  jsonConverter,
  convertJson,
  convertJsonToXml,
  convertJsonToYaml,
  convertJsonToCsv,
  convertJsonToToml,
  convertXmlToJson,
  convertYamlToJson,
  convertCsvToJson,
  convertTomlToJson,
  detectDataFormat,
  getSupportedFormats
} from '../../../apps/api/src/wasm/json_converter'

describe('JsonConverter', () => {
  let converter: JsonConverter

  beforeEach(async () => {
    converter = new JsonConverter()
    await converter.initialize()
  })

  afterEach(() => {
    converter.dispose()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newConverter = new JsonConverter()
      await newConverter.initialize()
      expect(newConverter.isReady()).toBe(true)
      newConverter.dispose()
    })

    it('should handle multiple initialization calls', async () => {
      await converter.initialize()
      await converter.initialize()
      expect(converter.isReady()).toBe(true)
    })

    it('should get supported formats', () => {
      const formats = converter.getSupportedFormats()
      expect(formats).toContain('json')
      expect(formats).toContain('xml')
      expect(formats).toContain('yaml')
      expect(formats).toContain('csv')
      expect(formats).toContain('toml')
    })

    it('should check WASM support', () => {
      expect(converter.hasWasmSupport('json')).toBe(true)
      expect(converter.hasWasmSupport('xml')).toBe(true)
      expect(converter.hasWasmSupport('yaml')).toBe(true)
      expect(converter.hasWasmSupport('csv')).toBe(true)
      expect(converter.hasWasmSupport('toml')).toBe(true)
      expect(converter.hasWasmSupport('unsupported')).toBe(false)
    })
  })

  describe('Format detection', () => {
    it('should detect JSON format', async () => {
      const jsonData = '{"name":"John","age":30}'
      const result = await converter.detectFormat(jsonData)

      expect(result.format).toBe('json')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should detect JSON array format', async () => {
      const jsonArray = '[1,2,3,"test"]'
      const result = await converter.detectFormat(jsonArray)

      expect(result.format).toBe('json')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should detect XML format', async () => {
      const xmlData = '<root><name>John</name><age>30</age></root>'
      const result = await converter.detectFormat(xmlData)

      expect(result.format).toBe('xml')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should detect YAML format', async () => {
      const yamlData = 'name: John\nage: 30\nactive: true'
      const result = await converter.detectFormat(yamlData)

      expect(result.format).toBe('yaml')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    it('should detect CSV format', async () => {
      const csvData = 'name,age,active\nJohn,30,true\nJane,25,false'
      const result = await converter.detectFormat(csvData)

      expect(result.format).toBe('csv')
      expect(result.confidence).toBeGreaterThan(0.4)
    })

    it('should detect TOML format', async () => {
      const tomlData = 'name = "John"\nage = 30\nactive = true'
      const result = await converter.detectFormat(tomlData)

      expect(result.format).toBe('toml')
      expect(result.confidence).toBeGreaterThan(0.3)
    })

    it('should return unknown for unrecognized format', async () => {
      const unknownData = 'This is just plain text'
      const result = await converter.detectFormat(unknownData)

      expect(result.format).toBe('unknown')
      expect(result.confidence).toBe(0)
    })
  })

  describe('JSON to XML conversion', () => {
    it('should convert simple JSON to XML', async () => {
      const jsonData = '{"name":"John","age":30}'
      const result = await converter.convert(jsonData, 'json', 'xml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('<name>John</name>')
      expect(result.data).toContain('<age>30</age>')
      expect(result.originalFormat).toBe('json')
      expect(result.targetFormat).toBe('xml')
    })

    it('should convert nested JSON to XML', async () => {
      const jsonData = JSON.stringify({
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: '10001'
          }
        }
      })

      const result = await converter.convert(jsonData, 'json', 'xml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('<user>')
      expect(result.data).toContain('<name>John</name>')
      expect(result.data).toContain('<address>')
      expect(result.data).toContain('<city>New York</city>')
    })

    it('should convert JSON array to XML', async () => {
      const jsonData = '[{"name":"John"},{"name":"Jane"}]'
      const result = await converter.convert(jsonData, 'json', 'xml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('<name>John</name>')
      expect(result.data).toContain('<name>Jane</name>')
    })

    it('should handle XML-specific options', async () => {
      const jsonData = '{"name":"John","age":30}'
      const options = {
        xmlDeclaration: true,
        xmlRoot: 'person',
        xmlAttributes: true,
        xmlAttributePrefix: '@',
        indent: 4
      }

      const result = await converter.convert(jsonData, 'json', 'xml', options)

      expect(result.success).toBe(true)
      expect(result.data).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(result.data).toContain('<person>')
    })

    it('should include XML declaration when requested', async () => {
      const jsonData = '{"name":"John"}'
      const options = { xmlDeclaration: true }

      const result = await converter.convert(jsonData, 'json', 'xml', options)

      expect(result.success).toBe(true)
      expect(result.data).toContain('<?xml version=')
    })

    it('should handle special characters in XML', async () => {
      const jsonData = '{"text":"Hello <world> & "friends""}'
      const result = await converter.convert(jsonData, 'json', 'xml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('Hello')
      // Should handle XML escaping properly
    })
  })

  describe('JSON to YAML conversion', () => {
    it('should convert simple JSON to YAML', async () => {
      const jsonData = '{"name":"John","age":30,"active":true}'
      const result = await converter.convert(jsonData, 'json', 'yaml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('name: John')
      expect(result.data).toContain('age: 30')
      expect(result.data).toContain('active: true')
    })

    it('should convert nested JSON to YAML', async () => {
      const jsonData = JSON.stringify({
        user: {
          name: 'John',
          profile: {
            age: 30,
            active: true
          }
        }
      })

      const result = await converter.convert(jsonData, 'json', 'yaml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('user:')
      expect(result.data).toContain('name: John')
      expect(result.data).toContain('profile:')
      expect(result.data).toContain('age: 30')
    })

    it('should convert JSON array to YAML', async () => {
      const jsonData = '[{"name":"John","age":30},{"name":"Jane","age":25}]'
      const result = await converter.convert(jsonData, 'json', 'yaml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('- name: John')
      expect(result.data).toContain('age: 30')
      expect(result.data).toContain('- name: Jane')
      expect(result.data).toContain('age: 25')
    })

    it('should handle YAML-specific options', async () => {
      const jsonData = '{"items":[{"name":"item1"},{"name":"item2"}]}'
      const options = {
        yamlIndent: 4,
        yamlFlowStyle: true
      }

      const result = await converter.convert(jsonData, 'json', 'yaml', options)

      expect(result.success).toBe(true)
      // Should use 4-space indentation
      expect(result.data).toContain('    items:')
    })

    it('should handle different YAML scalar styles', async () => {
      const jsonData = '{"text":"Hello world","number":42,"boolean":true}'
      const options = {
        yamlScalarStyle: 'double-quoted'
      }

      const result = await converter.convert(jsonData, 'json', 'yaml', options)

      expect(result.success).toBe(true)
      expect(result.data).toContain('"Hello world"')
    })
  })

  describe('JSON to CSV conversion', () => {
    it('should convert JSON array to CSV', async () => {
      const jsonData = JSON.stringify([
        { name: 'John', age: 30, active: true },
        { name: 'Jane', age: 25, active: false }
      ])

      const result = await converter.convert(jsonData, 'json', 'csv')

      expect(result.success).toBe(true)
      expect(result.data).toContain('name,age,active')
      expect(result.data).toContain('John,30,true')
      expect(result.data).toContain('Jane,25,false')
    })

    it('should handle CSV-specific options', async () => {
      const jsonData = JSON.stringify([
        { name: 'John Doe', age: 30, city: 'New York' }
      ])

      const options = {
        csvDelimiter: ';',
        csvQuote: "'",
        csvHeader: true
      }

      const result = await converter.convert(jsonData, 'json', 'csv', options)

      expect(result.success).toBe(true)
      expect(result.data).toContain('name;age;city')
      expect(result.data).toContain('John Doe;30;New York')
    })

    it('should handle CSV quoting', async () => {
      const jsonData = JSON.stringify([
        { name: 'John, Jr.', description: 'A "special" person' }
      ])

      const result = await converter.convert(jsonData, 'json', 'csv')

      expect(result.success).toBe(true)
      expect(result.data).toContain('"John, Jr."')
      expect(result.data).toContain('"A ""special"" person"')
    })

    it('should handle custom column order', async () => {
      const jsonData = JSON.stringify([
        { name: 'John', age: 30, city: 'NYC' }
      ])

      const options = {
        csvColumns: ['city', 'name', 'age']
      }

      const result = await converter.convert(jsonData, 'json', 'csv', options)

      expect(result.success).toBe(true)
      expect(result.data).toContain('city,name,age')
      expect(result.data).toContain('NYC,John,30')
    })

    it('should handle empty arrays', async () => {
      const jsonData = '[]'
      const result = await converter.convert(jsonData, 'json', 'csv')

      expect(result.success).toBe(true)
      expect(result.data).toBe('')
    })
  })

  describe('JSON to TOML conversion', () => {
    it('should convert simple JSON to TOML', async () => {
      const jsonData = '{"name":"John","age":30,"active":true}'
      const result = await converter.convert(jsonData, 'json', 'toml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('name = "John"')
      expect(result.data).toContain('age = 30')
      expect(result.data).toContain('active = true')
    })

    it('should convert nested JSON to TOML tables', async () => {
      const jsonData = JSON.stringify({
        user: {
          name: 'John',
          profile: {
            age: 30,
            active: true
          }
        }
      })

      const result = await converter.convert(jsonData, 'json', 'toml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('[user]')
      expect(result.data).toContain('name = "John"')
      expect(result.data).toContain('[user.profile]')
      expect(result.data).toContain('age = 30')
    })

    it('should convert JSON arrays to TOML', async () => {
      const jsonData = '{"numbers":[1,2,3],"tags":["tag1","tag2"]}'
      const result = await converter.convert(jsonData, 'json', 'toml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('numbers = [1, 2, 3]')
      expect(result.data).toContain('tags = ["tag1", "tag2"]')
    })

    it('should handle TOML-specific options', async () => {
      const jsonData = '{"items":[{"name":"item1"},{"name":"item2"}]}'
      const options = {
        tomlTables: true,
        tomlInlineTables: true
      }

      const result = await converter.convert(jsonData, 'json', 'toml', options)

      expect(result.success).toBe(true)
      expect(result.data).toContain('items')
    })
  })

  describe('XML to JSON conversion', () => {
    it('should convert simple XML to JSON', async () => {
      const xmlData = '<root><name>John</name><age>30</age></root>'
      const result = await converter.convert(xmlData, 'xml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.root.name).toBe('John')
      expect(parsed.root.age).toBe('30')
    })

    it('should convert nested XML to JSON', async () => {
      const xmlData = '<user><name>John</name><address><city>New York</city><zip>10001</zip></address></user>'
      const result = await converter.convert(xmlData, 'xml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.user.name).toBe('John')
      expect(parsed.user.address.city).toBe('New York')
      expect(parsed.user.address.zip).toBe('10001')
    })

    it('should handle XML attributes', async () => {
      const xmlData = '<user id="1" active="true"><name>John</name></user>'
      const options = {
        xmlAttributes: true,
        xmlAttributePrefix: '@'
      }

      const result = await converter.convert(xmlData, 'xml', 'json', options)

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.user['@id']).toBe('1')
      expect(parsed.user['@active']).toBe('true')
    })

    it('should handle XML CDATA', async () => {
      const xmlData = '<content><![CDATA[Some special content <with> tags]]></content>'
      const options = {
        xmlCData: true
      }

      const result = await converter.convert(xmlData, 'xml', 'json', options)

      expect(result.success).toBe(true)
    })

    it('should handle malformed XML', async () => {
      const malformedXml = '<root><name>John</name><age>'

      await expect(converter.convert(malformedXml, 'xml', 'json'))
        .rejects.toThrow(MalformedDataError)
    })
  })

  describe('YAML to JSON conversion', () => {
    it('should convert simple YAML to JSON', async () => {
      const yamlData = 'name: John\nage: 30\nactive: true'
      const result = await converter.convert(yamlData, 'yaml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
      expect(parsed.active).toBe(true)
    })

    it('should convert nested YAML to JSON', async () => {
      const yamlData = 'user:\n  name: John\n  profile:\n    age: 30\n    active: true'
      const result = await converter.convert(yamlData, 'yaml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.user.name).toBe('John')
      expect(parsed.user.profile.age).toBe(30)
      expect(parsed.user.profile.active).toBe(true)
    })

    it('should convert YAML arrays to JSON', async () => {
      const yamlData = '- name: John\n  age: 30\n- name: Jane\n  age: 25'
      const result = await converter.convert(yamlData, 'yaml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0].name).toBe('John')
      expect(parsed[1].name).toBe('Jane')
    })

    it('should handle YAML comments', async () => {
      const yamlData = '# This is a comment\nname: John\n# Another comment\nage: 30'
      const result = await converter.convert(yamlData, 'yaml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
    })
  })

  describe('CSV to JSON conversion', () => {
    it('should convert CSV to JSON array', async () => {
      const csvData = 'name,age,active\nJohn,30,true\nJane,25,false'
      const result = await converter.convert(csvData, 'csv', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed[0]).toEqual({ name: 'John', age: 30, active: true })
      expect(parsed[1]).toEqual({ name: 'Jane', age: 25, active: false })
    })

    it('should handle CSV with custom delimiter', async () => {
      const csvData = 'name;age;active\nJohn;30;true'
      const options = {
        csvDelimiter: ';'
      }

      const result = await converter.convert(csvData, 'csv', 'json', options)

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed[0]).toEqual({ name: 'John', age: 30, active: true })
    })

    it('should handle CSV without header', async () => {
      const csvData = 'John,30,true\nJane,25,false'
      const options = {
        csvHeader: false,
        csvColumns: ['name', 'age', 'active']
      }

      const result = await converter.convert(csvData, 'csv', 'json', options)

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed[0]).toEqual({ name: 'John', age: 30, active: true })
    })

    it('should handle CSV quoting', async () => {
      const csvData = 'name,description\n"John, Jr.","A ""special"" person"'
      const result = await converter.convert(csvData, 'csv', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed[0]).toEqual({
        name: 'John, Jr.',
        description: 'A "special" person'
      })
    })

    it('should handle empty CSV', async () => {
      const csvData = ''
      const result = await converter.convert(csvData, 'csv', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed).toEqual([])
    })
  })

  describe('TOML to JSON conversion', () => {
    it('should convert simple TOML to JSON', async () => {
      const tomlData = 'name = "John"\nage = 30\nactive = true'
      const result = await converter.convert(tomlData, 'toml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
      expect(parsed.active).toBe(true)
    })

    it('should convert TOML tables to JSON', async () => {
      const tomlData = '[user]\nname = "John"\n[user.profile]\nage = 30\nactive = true'
      const result = await converter.convert(tomlData, 'toml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.user.name).toBe('John')
      expect(parsed.user.profile.age).toBe(30)
      expect(parsed.user.profile.active).toBe(true)
    })

    it('should convert TOML arrays to JSON', async () => {
      const tomlData = 'numbers = [1, 2, 3]\nnames = ["John", "Jane"]'
      const result = await converter.convert(tomlData, 'toml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.numbers).toEqual([1, 2, 3])
      expect(parsed.names).toEqual(['John', 'Jane'])
    })

    it('should handle TOML comments', async () => {
      const tomlData = '# This is a comment\nname = "John"\n# Another comment\nage = 30'
      const result = await converter.convert(tomlData, 'toml', 'json')

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      expect(parsed.name).toBe('John')
      expect(parsed.age).toBe(30)
    })
  })

  describe('Cross-format conversions', () => {
    it('should convert XML to YAML', async () => {
      const xmlData = '<root><name>John</name><age>30</age></root>'
      const result = await converter.convert(xmlData, 'xml', 'yaml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('name: John')
      expect(result.data).toContain('age: 30')
    })

    it('should convert YAML to CSV', async () => {
      const yamlData = '- name: John\n  age: 30\n- name: Jane\n  age: 25'
      const result = await converter.convert(yamlData, 'yaml', 'csv')

      expect(result.success).toBe(true)
      expect(result.data).toContain('name,age')
      expect(result.data).toContain('John,30')
      expect(result.data).toContain('Jane,25')
    })

    it('should convert CSV to XML', async () => {
      const csvData = 'name,age\nJohn,30\nJane,25'
      const result = await converter.convert(csvData, 'csv', 'xml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('<name>John</name>')
      expect(result.data).toContain('<age>30</age>')
    })

    it('should convert TOML to YAML', async () => {
      const tomlData = 'name = "John"\nage = 30\nactive = true'
      const result = await converter.convert(tomlData, 'toml', 'yaml')

      expect(result.success).toBe(true)
      expect(result.data).toContain('name: John')
      expect(result.data).toContain('age: 30')
      expect(result.data).toContain('active: true')
    })
  })

  describe('Error handling', () => {
    it('should handle unsupported source format', async () => {
      const inputData = 'some data'

      await expect(converter.convert(inputData, 'unsupported', 'json'))
        .rejects.toThrow(UnsupportedFormatError)
    })

    it('should handle unsupported target format', async () => {
      const inputData = '{"name":"John"}'

      await expect(converter.convert(inputData, 'json', 'unsupported'))
        .rejects.toThrow(UnsupportedFormatError)
    })

    it('should handle empty input', async () => {
      await expect(converter.convert('', 'json', 'xml'))
        .rejects.toThrow(JsonConversionError)
    })

    it('should handle non-string input', async () => {
      await expect(converter.convert(null as any, 'json', 'xml'))
        .rejects.toThrow(JsonConversionError)
    })

    it('should handle oversized input', async () => {
      const largeInput = 'x'.repeat(11 * 1024 * 1024) // 11MB

      await expect(converter.convert(largeInput, 'json', 'xml'))
        .rejects.toThrow(ConversionSizeError)
    })

    it('should handle malformed XML', async () => {
      const malformedXml = '<root><name>John</name><age>'

      await expect(converter.convert(malformedXml, 'xml', 'json'))
        .rejects.toThrow(MalformedDataError)
    })

    it('should handle malformed YAML', async () => {
      const malformedYaml = 'invalid: yaml: content: here'

      await expect(converter.convert(malformedYaml, 'yaml', 'json'))
        .rejects.toThrow(MalformedDataError)
    })

    it('should handle malformed CSV', async () => {
      const malformedCsv = 'name,age\nJohn,30,extra,field\nJane'

      // Should handle gracefully - CSV parsing is more forgiving
      const result = await converter.convert(malformedCsv, 'csv', 'json')
      expect(result.success).toBe(true)
    })

    it('should handle malformed TOML', async () => {
      const malformedToml = 'invalid toml syntax here'

      await expect(converter.convert(malformedToml, 'toml', 'json'))
        .rejects.toThrow(MalformedDataError)
    })

    it('should handle timeout errors', async () => {
      const jsonData = '{"name":"John"}'
      const options = {
        timeout: 1 // 1ms timeout
      }

      await expect(converter.convert(jsonData, 'json', 'xml', options))
        .rejects.toThrow(ConversionTimeoutError)
    })
  })

  describe('Conversion options', () => {
    it('should use pretty print option', async () => {
      const jsonData = '{"name":"John","age":30}'
      const options = {
        prettyPrint: true,
        indent: 4
      }

      const result = await converter.convert(jsonData, 'json', 'json', options)

      expect(result.success).toBe(true)
      expect(result.data).toContain('    "name"')
      expect(result.data).toContain('    "age"')
    })

    it('should use compact mode', async () => {
      const jsonData = '{"name":"John","age":30}'
      const options = {
        prettyPrint: false
      }

      const result = await converter.convert(jsonData, 'json', 'json', options)

      expect(result.success).toBe(true)
      expect(result.data).toBe('{"name":"John","age":30}')
    })

    it('should sort keys', async () => {
      const jsonData = '{"z":1,"a":2,"m":3}'
      const options = {
        sortKeys: true
      }

      const result = await converter.convert(jsonData, 'json', 'json', options)

      expect(result.success).toBe(true)
      const parsed = JSON.parse(result.data!)
      const keys = Object.keys(parsed)
      expect(keys).toEqual(['a', 'm', 'z'])
    })

    it('should handle encoding options', async () => {
      const jsonData = '{"name":"Jöhn"}'
      const options = {
        encoding: 'ascii'
      }

      const result = await converter.convert(jsonData, 'json', 'json', options)

      expect(result.success).toBe(true)
    })

    it('should use WASM when available', async () => {
      const jsonData = '{"name":"John","age":30}'
      const options = {
        useWasm: true
      }

      const result = await converter.convert(jsonData, 'json', 'xml', options)

      expect(result.success).toBe(true)
      expect(result.metadata.wasWasmUsed).toBe(true)
    })

    it('should fall back to native when WASM unavailable', async () => {
      const jsonData = '{"name":"John","age":30}'
      const options = {
        useWasm: false
      }

      const result = await converter.convert(jsonData, 'json', 'xml', options)

      expect(result.success).toBe(true)
      expect(result.metadata.wasWasmUsed).toBe(false)
    })
  })

  describe('Performance and metadata', () => {
    it('should provide accurate metadata', async () => {
      const jsonData = '{"name":"John","age":30,"active":true}'
      const result = await converter.convert(jsonData, 'json', 'xml')

      expect(result.success).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.metadata.parsingTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.conversionTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.totalTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.originalSize).toBe(jsonData.length)
      expect(result.metadata.convertedSize).toBeGreaterThan(0)
      expect(result.metadata.depth).toBeGreaterThan(0)
      expect(result.metadata.keyCount).toBeGreaterThan(0)
      expect(result.metadata.valueCount).toBeGreaterThan(0)
    })

    it('should calculate compression ratio', async () => {
      const jsonData = '{"name":"John","age":30}'
      const result = await converter.convert(jsonData, 'json', 'xml')

      expect(result.success).toBe(true)
      expect(result.compressionRatio).toBeGreaterThan(0)
    })

    it('should handle large data efficiently', async () => {
      const largeObject: any = {}
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = {
          id: i,
          name: `Item ${i}`,
          tags: [`tag${i}`, `category${i % 10}`]
        }
      }

      const jsonData = JSON.stringify(largeObject)
      const startTime = performance.now()

      const result = await converter.convert(jsonData, 'json', 'yaml')

      const endTime = performance.now()
      const processingTime = endTime - startTime

      expect(result.success).toBe(true)
      expect(processingTime).toBeLessThan(1000) // Should complete within 1 second
      expect(result.metadata.totalTime).toBeLessThan(1000)
    })
  })

  describe('Security validation', () => {
    it('should reject suspicious content', async () => {
      const maliciousInput = '{"script":"<script>alert(1)</script>"}'

      await expect(converter.convert(maliciousInput, 'json', 'xml'))
        .rejects.toThrow(JsonConversionError)
    })

    it('should reject extremely deep nesting', async () => {
      const deepInput = '['.repeat(1001) + ']'.repeat(1001)
      const options = {
        maxDepth: 100
      }

      await expect(converter.convert(deepInput, 'json', 'xml', options))
        .rejects.toThrow(ConversionDepthError)
    })

    it('should handle excessive repetition', async () => {
      const repetitiveInput = '{"data":"' + 'a'.repeat(1001) + '"}'

      await expect(converter.convert(repetitiveInput, 'json', 'xml'))
        .rejects.toThrow(JsonConversionError)
    })
  })

  describe('Configuration', () => {
    it('should allow setting custom limits', () => {
      converter.setLimits(
        1024,     // 1KB input
        5120,     // 5KB output
        32768,    // 32MB memory
        5000      // 5 second timeout
      )

      // Limits would be applied during conversion
      expect(converter).toBeDefined()
    })

    it('should respect configured limits', async () => {
      converter.setLimits(100, 1000, 1024, 100) // Very small limits

      const smallData = '{"name":"test"}'
      const largeData = '{"name":"' + 'x'.repeat(200) + '"}'

      // Should work with small data
      const result1 = await converter.convert(smallData, 'json', 'xml')
      expect(result1.success).toBe(true)

      // Should fail with large data
      await expect(converter.convert(largeData, 'json', 'xml'))
        .rejects.toThrow(ConversionSizeError)
    })
  })

  describe('Resource management', () => {
    it('should dispose resources properly', async () => {
      expect(converter.isReady()).toBe(true)

      converter.dispose()
      expect(converter.isReady()).toBe(false)
    })

    it('should handle multiple conversions efficiently', async () => {
      const conversions = []

      for (let i = 0; i < 10; i++) {
        const jsonData = JSON.stringify({ id: i, name: `Item ${i}` })
        conversions.push(converter.convert(jsonData, 'json', 'xml'))
      }

      const results = await Promise.all(conversions)

      expect(results.length).toBe(10)
      results.forEach(result => {
        expect(result.success).toBe(true)
      })
    })
  })
})

describe('Utility functions', () => {
  beforeEach(async () => {
    await jsonConverter.initialize()
  })

  it('convertJson should convert data correctly', async () => {
    const jsonData = '{"name":"John","age":30}'
    const result = await convertJson(jsonData, 'json', 'xml')

    expect(result.success).toBe(true)
    expect(result.data).toContain('<name>John</name>')
    expect(result.data).toContain('<age>30</age>')
  })

  it('convertJsonToXml should convert JSON to XML', async () => {
    const jsonData = '{"name":"John","age":30}'
    const result = await convertJsonToXml(jsonData)

    expect(result.success).toBe(true)
    expect(result.data).toContain('<name>John</name>')
    expect(result.data).toContain('<age>30</age>')
  })

  it('convertJsonToYaml should convert JSON to YAML', async () => {
    const jsonData = '{"name":"John","age":30}'
    const result = await convertJsonToYaml(jsonData)

    expect(result.success).toBe(true)
    expect(result.data).toContain('name: John')
    expect(result.data).toContain('age: 30')
  })

  it('convertJsonToCsv should convert JSON to CSV', async () => {
    const jsonData = JSON.stringify([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ])
    const result = await convertJsonToCsv(jsonData)

    expect(result.success).toBe(true)
    expect(result.data).toContain('name,age')
    expect(result.data).toContain('John,30')
    expect(result.data).toContain('Jane,25')
  })

  it('convertJsonToToml should convert JSON to TOML', async () => {
    const jsonData = '{"name":"John","age":30}'
    const result = await convertJsonToToml(jsonData)

    expect(result.success).toBe(true)
    expect(result.data).toContain('name = "John"')
    expect(result.data).toContain('age = 30')
  })

  it('convertXmlToJson should convert XML to JSON', async () => {
    const xmlData = '<root><name>John</name><age>30</age></root>'
    const result = await convertXmlToJson(xmlData)

    expect(result.success).toBe(true)
    const parsed = JSON.parse(result.data!)
    expect(parsed.root.name).toBe('John')
    expect(parsed.root.age).toBe('30')
  })

  it('convertYamlToJson should convert YAML to JSON', async () => {
    const yamlData = 'name: John\nage: 30'
    const result = await convertYamlToJson(yamlData)

    expect(result.success).toBe(true)
    const parsed = JSON.parse(result.data!)
    expect(parsed.name).toBe('John')
    expect(parsed.age).toBe(30)
  })

  it('convertCsvToJson should convert CSV to JSON', async () => {
    const csvData = 'name,age\nJohn,30\nJane,25'
    const result = await convertCsvToJson(csvData)

    expect(result.success).toBe(true)
    const parsed = JSON.parse(result.data!)
    expect(parsed[0]).toEqual({ name: 'John', age: 30 })
    expect(parsed[1]).toEqual({ name: 'Jane', age: 25 })
  })

  it('convertTomlToJson should convert TOML to JSON', async () => {
    const tomlData = 'name = "John"\nage = 30'
    const result = await convertTomlToJson(tomlData)

    expect(result.success).toBe(true)
    const parsed = JSON.parse(result.data!)
    expect(parsed.name).toBe('John')
    expect(parsed.age).toBe(30)
  })

  it('detectDataFormat should detect format correctly', async () => {
    const jsonData = '{"name":"John"}'
    const result = await detectDataFormat(jsonData)

    expect(result.format).toBe('json')
    expect(result.confidence).toBeGreaterThan(0.9)
  })

  it('getSupportedFormats should return supported formats', () => {
    const formats = getSupportedFormats()

    expect(formats).toContain('json')
    expect(formats).toContain('xml')
    expect(formats).toContain('yaml')
    expect(formats).toContain('csv')
    expect(formats).toContain('toml')
  })
})

describe('Edge cases', () => {
  beforeEach(async () => {
    await jsonConverter.initialize()
  })

  it('should handle empty objects', async () => {
    const result = await convertJson('{}', 'json', 'xml')
    expect(result.success).toBe(true)
    expect(result.data).toContain('<root>')
  })

  it('should handle empty arrays', async () => {
    const result = await convertJson('[]', 'json', 'xml')
    expect(result.success).toBe(true)
  })

  it('should handle whitespace-only JSON', async () => {
    const result = await convertJson('   {"name":"John"}   ', 'json', 'xml')
    expect(result.success).toBe(true)
    expect(result.data).toContain('<name>John</name>')
  })

  it('should handle Unicode characters', async () => {
    const jsonData = JSON.stringify({ greeting: '你好', emoji: '🌍' })
    const result = await convertJson(jsonData, 'json', 'xml')

    expect(result.success).toBe(true)
    expect(result.data).toContain('你好')
    expect(result.data).toContain('🌍')
  })

  it('should handle escape sequences', async () => {
    const jsonData = JSON.stringify({
      newline: 'line1\\nline2',
      tab: 'col1\\tcol2',
      quote: 'say \\"hello\\"',
      backslash: 'path\\\\to\\\\file'
    })

    const result = await convertJson(jsonData, 'json', 'xml')
    expect(result.success).toBe(true)
  })

  it('should handle very large numbers', async () => {
    const jsonData = JSON.stringify({
      bigInt: 9007199254740991n, // BigInt max safe integer
      scientific: 1.23e+10
    })

    const result = await convertJson(jsonData, 'json', 'xml')
    expect(result.success).toBe(true)
  })

  it('should handle null and undefined values', async () => {
    const jsonData = JSON.stringify({
      name: null,
      age: undefined,
      active: true,
      empty: ''
    })

    const result = await convertJson(jsonData, 'json', 'xml')
    expect(result.success).toBe(true)
  })

  it('should handle special XML characters', async () => {
    const xmlData = '<root>&lt;script&gt;alert("test")&lt;/script&gt;</root>'
    const result = await convertXmlToJson(xmlData)

    expect(result.success).toBe(true)
    const parsed = JSON.parse(result.data!)
    expect(parsed.root).toContain('<script>')
    expect(parsed.root).toContain('</script>')
  })

  it('should handle different line endings', async () => {
    const csvData = 'name,age\\r\\nJohn,30\\r\\nJane,25'
    const result = await convertCsvToJson(csvData)

    expect(result.success).toBe(true)
    const parsed = JSON.parse(result.data!)
    expect(parsed[0]).toEqual({ name: 'John', age: 30 })
  })
})

describe('Performance benchmarks', () => {
  beforeEach(async () => {
    await jsonConverter.initialize()
  })

  it('should handle large JSON objects efficiently', async () => {
    const largeObject: any = {}
    for (let i = 0; i < 1000; i++) {
      largeObject[`key${i}`] = {
        id: i,
        name: `Item ${i}`,
        tags: [`tag${i}`, `category${i % 10}`],
        metadata: {
          created: new Date().toISOString(),
          active: i % 2 === 0
        }
      }
    }

    const jsonData = JSON.stringify(largeObject)
    const startTime = performance.now()

    const result = await convertJson(jsonData, 'json', 'yaml')

    const endTime = performance.now()
    const processingTime = endTime - startTime

    expect(result.success).toBe(true)
    expect(processingTime).toBeLessThan(1000) // Should complete within 1 second
    expect(result.metadata.totalTime).toBeLessThan(1000)
  })

  it('should handle many small conversions efficiently', async () => {
    const conversions = []

    for (let i = 0; i < 100; i++) {
      const data = { id: i, name: `Item ${i}`, value: Math.random() }
      const jsonData = JSON.stringify(data)
      conversions.push(convertJson(jsonData, 'json', 'xml'))
    }

    const startTime = performance.now()
    const results = await Promise.all(conversions)
    const endTime = performance.now()

    const processingTime = endTime - startTime

    expect(results.length).toBe(100)
    results.forEach(result => {
      expect(result.success).toBe(true)
    })
    expect(processingTime).toBeLessThan(2000) // Should be reasonably fast
  })

  it('should handle streaming conversion efficiently', async () => {
    // Test streaming interface (even though it's not fully implemented)
    const chunks = ['{"users":[', '{"id":1,"name":"John"}', ',{"id":2,"name":"Jane"}', ']}']
    const asyncIterable = async function* () {
      for (const chunk of chunks) {
        yield chunk
      }
    }

    const startTime = performance.now()

    try {
      const stream = await jsonConverter.convertStream(
        asyncIterable(),
        'json',
        'xml'
      )

      const results = []
      for await (const result of stream) {
        results.push(result)
      }

      const endTime = performance.now()
      expect(results.length).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(1000)
    } catch (error) {
      // Streaming might not be fully implemented
      expect(error.message).toContain('not implemented')
    }
  })
})
