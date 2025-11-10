import { describe, it, expect, beforeEach } from 'vitest';
import { Processor, processCode } from '@/lib/processing';

describe('Code Processing Utilities', () => {
  const sampleJavaScript = `// Sample JavaScript function
function greet(name) {
  console.log('Hello, ' + name + '!');
  return 'Welcome, ' + name;
}

const message = greet('World');`;

  const sampleCSS = `/* Sample CSS styles */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px;
  padding: 10px;
}

.button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
}`;

  const sampleHTML = `<!-- Sample HTML structure -->
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test Page</title>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <p>This is a test page.</p>
  </div>
</body>
</html>`;

  const sampleJSON = `{
  "name": "John Doe",
  "age": 30,
  "city": "New York"
}`;

  describe('JavaScript Code Processing', () => {
    describe('minification', () => {
      it('should minify JavaScript code', async () => {
        const result = await Processor.processCode(sampleJavaScript, 'javascript', 'minify');

        expect(result.success).toBe(true);
        expect(result.result).not.toContain('// Sample JavaScript function');
        expect(result.result).not.toContain('  '); // no indentation
        expect(result.result).toContain('function greet(name)');
        expect(result.metrics.compressionRatio).toBeLessThan(1);
      });

      it('should preserve comments when requested', async () => {
        const result = await Processor.processCode(sampleJavaScript, 'javascript', 'minify', {
          preserveComments: true,
        });

        expect(result.success).toBe(true);
        expect(result.result).toContain('// Sample JavaScript function');
      });

      it('should preserve indentation when requested', async () => {
        const result = await Processor.processCode(sampleJavaScript, 'javascript', 'minify', {
          preserveIndent: true,
        });

        expect(result.success).toBe(true);
        expect(result.result).toContain('  console.log');
      });
    });

    describe('obfuscation', () => {
      it('should obfuscate JavaScript code', async () => {
        const code = `const variable = 'test'; console.log(variable);`;
        const result = await Processor.processCode(code, 'javascript', 'obfuscate');

        expect(result.success).toBe(true);
        expect(result.result).not.toContain('variable');
        expect(result.metrics.compressionRatio).toBeGreaterThan(0);
      });

      it('should preserve API names when requested', async () => {
        const code = `console.log('test'); fetch('/api');`;
        const result = await Processor.processCode(code, 'javascript', 'obfuscate', {
          preserveAPI: true,
        });

        expect(result.success).toBe(true);
        expect(result.result).toContain('console');
        expect(result.result).toContain('fetch');
      });

      it('should apply different obfuscation levels', async () => {
        const code = `const message = 'Hello World'; console.log(message);`;

        const lowResult = await Processor.processCode(code, 'javascript', 'obfuscate', {
          obfuscationLevel: 'low',
        });

        const highResult = await Processor.processCode(code, 'javascript', 'obfuscate', {
          obfuscationLevel: 'high',
        });

        expect(lowResult.success).toBe(true);
        expect(highResult.success).toBe(true);
        // High level should be more obfuscated
        expect(highResult.result).not.toEqual(lowResult.result);
      });
    });

    describe('beautification', () => {
      it('should beautify minified JavaScript', async () => {
        const minified = 'function greet(name){console.log("Hello, "+name+"!");return "Welcome, "+name;}';
        const result = await Processor.processCode(minified, 'javascript', 'beautify');

        expect(result.success).toBe(true);
        expect(result.result).toContain('function greet(name) {');
        expect(result.result).toContain('  console.log');
        expect(result.result).toContain('  return');
      });

      it('should respect indentation settings', async () => {
        const minified = 'function test(){return true;}';
        const result = await Processor.processCode(minified, 'javascript', 'beautify', {
          indentSize: 4,
        });

        expect(result.success).toBe(true);
        expect(result.result).toContain('    return true;');
      });

      it('should use tabs when requested', async () => {
        const minified = 'function test(){return true;}';
        const result = await Processor.processCode(minified, 'javascript', 'beautify', {
          useTabs: true,
        });

        expect(result.success).toBe(true);
        expect(result.result).toContain('\treturn true;');
      });
    });

    describe('comparison', () => {
      it('should compare two JavaScript files', async () => {
        const code1 = 'function test() { return 1; }';
        const code2 = 'function test() { return 2; }';
        const result = await Processor.processCode(code1, 'javascript', 'compare', {
          compareWith: code2,
        });

        expect(result.success).toBe(true);
        const diff = JSON.parse(result.result);
        expect(diff).toHaveProperty('added');
        expect(diff).toHaveProperty('removed');
        expect(diff).toHaveProperty('modified');
        expect(diff).toHaveProperty('unchanged');
      });

      it('should ignore whitespace when requested', async () => {
        const code1 = 'function test() { return 1; }';
        const code2 = 'function test() {  return  1;  }';
        const result = await Processor.processCode(code1, 'javascript', 'compare', {
          compareWith: code2,
          ignoreWhitespace: true,
        });

        expect(result.success).toBe(true);
        const diff = JSON.parse(result.result);
        expect(diff.modified).toHaveLength(0);
        expect(diff.unchanged.length).toBeGreaterThan(0);
      });

      it('should show line numbers when requested', async () => {
        const code1 = 'line1\nline2\nline3';
        const code2 = 'line1\nmodified\nline3';
        const result = await Processor.processCode(code1, 'javascript', 'compare', {
          compareWith: code2,
          showLineNumbers: true,
        });

        expect(result.success).toBe(true);
        const diff = JSON.parse(result.result);
        expect(diff.modified[0].old).toContain('2:');
        expect(diff.modified[0].new).toContain('2:');
      });
    });

    describe('analysis', () => {
      it('should analyze JavaScript code', async () => {
        const result = await Processor.processCode(sampleJavaScript, 'javascript', 'analyze');

        expect(result.success).toBe(true);
        const analysis = JSON.parse(result.result);

        expect(analysis).toHaveProperty('language', 'javascript');
        expect(analysis).toHaveProperty('lines');
        expect(analysis).toHaveProperty('characters');
        expect(analysis).toHaveProperty('words');
        expect(analysis).toHaveProperty('complexity');
        expect(analysis).toHaveProperty('statistics');

        expect(analysis.statistics.functions).toBeGreaterThan(0);
        expect(analysis.statistics.variables).toBeGreaterThan(0);
      });
    });
  });

  describe('CSS Code Processing', () => {
    it('should minify CSS', async () => {
      const result = await Processor.processCode(sampleCSS, 'css', 'minify');

      expect(result.success).toBe(true);
      expect(result.result).not.toContain('/* Sample CSS styles */');
      expect(result.result).not.toContain('\n');
      expect(result.metrics.compressionRatio).toBeLessThan(1);
    });

    it('should beautify CSS', async () => {
      const minifiedCSS = '.container{display:flex;justify-content:center;}.button{background-color:#007bff;}';
      const result = await Processor.processCode(minifiedCSS, 'css', 'beautify');

      expect(result.success).toBe(true);
      expect(result.result).toContain('.container {');
      expect(result.result).toContain('  display: flex;');
      expect(result.result).toContain('}');
    });
  });

  describe('HTML Code Processing', () => {
    it('should minify HTML', async () => {
      const result = await Processor.processCode(sampleHTML, 'html', 'minify');

      expect(result.success).toBe(true);
      expect(result.result).not.toContain('<!-- Sample HTML structure -->');
      expect(result.result).not.toContain('\n');
      expect(result.metrics.compressionRatio).toBeLessThan(1);
    });

    it('should beautify HTML', async () => {
      const minifiedHTML = '<html><head><title>Test</title></head><body><div><h1>Hello</h1></div></body></html>';
      const result = await Processor.processCode(minifiedHTML, 'html', 'beautify');

      expect(result.success).toBe(true);
      expect(result.result).toContain('<html>');
      expect(result.result).toContain('  <head>');
      expect(result.result).toContain('    <title>');
    });
  });

  describe('JSON Code Processing', () => {
    it('should minify JSON', async () => {
      const result = await Processor.processCode(sampleJSON, 'json', 'minify');

      expect(result.success).toBe(true);
      expect(result.result).toBe('{"name":"John Doe","age":30,"city":"New York"}');
    });

    it('should beautify JSON', async () => {
      const minifiedJSON = '{"name":"John Doe","age":30}';
      const result = await Processor.processCode(minifiedJSON, 'json', 'beautify', {
        indentSize: 2,
      });

      expect(result.success).toBe(true);
      expect(result.result).toContain('{\n  "name": "John Doe",');
    });
  });

  describe('processCode convenience function', () => {
    it('should work as a convenience function', async () => {
      const result = await processCode(sampleJavaScript, 'javascript', 'minify');

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid operations', async () => {
      const result = await Processor.processCode(sampleJavaScript, 'javascript', 'invalid');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'CODE_PROCESSING_ERROR');
      expect(result.error).toHaveProperty('message');
    });

    it('should handle invalid JSON for beautification', async () => {
      const invalidJSON = '{"invalid": json}';
      const result = await Processor.processCode(invalidJSON, 'json', 'beautify');

      expect(result.success).toBe(false);
      expect(result.error).toHaveProperty('code', 'CODE_PROCESSING_ERROR');
    });

    it('should provide error metrics', async () => {
      const result = await Processor.processCode(sampleJavaScript, 'javascript', 'invalid');

      expect(result.success).toBe(false);
      expect(result.metrics).toHaveProperty('duration');
      expect(result.metrics).toHaveProperty('inputSize');
      expect(result.metrics).toHaveProperty('outputSize', 0);
    });
  });

  describe('Unsupported Languages', () => {
    it('should handle unsupported languages gracefully', async () => {
      const pythonCode = 'print("Hello World")';
      const result = await Processor.processCode(pythonCode, 'python', 'minify');

      expect(result.success).toBe(true);
      // Should apply basic minification
      expect(result.metrics.duration).toBeGreaterThan(0);
    });

    it('should handle obfuscation for unsupported languages', async () => {
      const pythonCode = 'print("Hello World")';
      const result = await Processor.processCode(pythonCode, 'python', 'obfuscate', {
        obfuscationLevel: 'high',
      });

      expect(result.success).toBe(true);
      // Should apply basic obfuscation (base64)
      expect(result.result).not.toBe(pythonCode);
    });
  });
});
