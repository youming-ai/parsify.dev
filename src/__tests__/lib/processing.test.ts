import { describe, it, expect, beforeEach } from "vitest";
import { Processor, processCode } from "@/lib/processing";

describe("Code Processing Utilities", () => {
  const sampleJavaScript = `
    // This is a sample JavaScript function
    function calculateSum(a, b) {
      const result = a + b;
      return result;
    }

    // Another function
    function multiply(x, y) {
      return x * y;
    }
  `;

  const sampleCSS = `
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 20px;
      padding: 15px;
    }

    .button {
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
    }
  `;

  const sampleHTML = `
    <div class="container">
      <h1>Hello World</h1>
      <p>This is a sample HTML document.</p>
      <button class="button">Click me</button>
    </div>
  `;

  describe("processCode", () => {
    it("should minify JavaScript code", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "minify",
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();

      // Check that comments are removed
      expect(result.result).not.toContain("This is a sample");
      expect(result.result).not.toContain("Another function");

      // Check that whitespace is reduced
      expect(result.result).toContain("function calculateSum(a,b)");
      expect(result.result).toContain("function multiply(x,y)");

      expect(result.metrics).toBeDefined();
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.compressionRatio).toBeLessThan(1);
    });

    it("should minify CSS code", async () => {
      const result = await processCode(sampleCSS, "css", "minify");

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();

      // Check that whitespace is reduced
      expect(result.result).toContain(".container{display:flex");
      expect(result.result).toContain(".button{background-color:#007bff");

      expect(result.metrics).toBeDefined();
    });

    it("should minify HTML code", async () => {
      const result = await processCode(sampleHTML, "html", "minify");

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();

      // Check that whitespace is reduced
      expect(result.result).toContain('<div class="container">');
      expect(result.result).toContain("<h1>Hello World</h1>");

      expect(result.metrics).toBeDefined();
    });

    it("should obfuscate JavaScript code", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "obfuscate",
        {
          obfuscationLevel: "medium",
          preserveAPI: true,
        },
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();

      // Should contain obfuscated variable names
      expect(result.result).toMatch(/function\s+_\d+\s*\(/);

      expect(result.metrics).toBeDefined();
    });

    it("should preserve API names during obfuscation", async () => {
      const codeWithAPI = `
        function processData() {
          console.log("Processing data");
          const result = Math.max(1, 2, 3);
          return result;
        }
      `;

      const result = await processCode(codeWithAPI, "javascript", "obfuscate", {
        obfuscationLevel: "medium",
        preserveAPI: true,
      });

      expect(result.success).toBe(true);
      // API names should be preserved
      expect(result.result).toContain("console");
      expect(result.result).toContain("Math");
    });

    it("should compare two pieces of code", async () => {
      const code1 = "function test() { return 1; }";
      const code2 = "function test() { return 2; }";

      const result = await processCode(code1, "javascript", "compare", {
        compareWith: code2,
        showLineNumbers: true,
        ignoreWhitespace: true,
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();

      const diff = JSON.parse(result.result);
      expect(diff).toHaveProperty("modified");
      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0]).toHaveProperty("old");
      expect(diff.modified[0]).toHaveProperty("new");
    });

    it("should beautify JavaScript code", async () => {
      const minifiedJS = "function test(){return 42;}";

      const result = await processCode(minifiedJS, "javascript", "beautify", {
        indentSize: 2,
        useTabs: false,
      });

      expect(result.success).toBe(true);
      expect(result.result).toContain("function test() {\n  return 42;\n}");
    });

    it("should beautify CSS code", async () => {
      const minifiedCSS = ".test{color:red;font-size:14px;}";

      const result = await processCode(minifiedCSS, "css", "beautify", {
        indentSize: 2,
        useTabs: false,
      });

      expect(result.success).toBe(true);
      expect(result.result).toContain(
        ".test {\n  color: red;\n  font-size: 14px;\n}",
      );
    });

    it("should beautify HTML code", async () => {
      const minifiedHTML = "<div><p>test</p></div>";

      const result = await processCode(minifiedHTML, "html", "beautify", {
        indentSize: 2,
        useTabs: false,
      });

      expect(result.success).toBe(true);
      expect(result.result).toContain("<div>\n  <p>test</p>\n</div>");
    });

    it("should analyze code and provide statistics", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "analyze",
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();

      const analysis = JSON.parse(result.result);
      expect(analysis).toHaveProperty("language", "javascript");
      expect(analysis).toHaveProperty("lines");
      expect(analysis).toHaveProperty("characters");
      expect(analysis).toHaveProperty("complexity");
      expect(analysis).toHaveProperty("statistics");

      expect(analysis.statistics.functions).toBeGreaterThan(0);
      expect(analysis.statistics.variables).toBeGreaterThan(0);
    });

    it("should handle unsupported operations gracefully", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "unsupported",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe("CODE_PROCESSING_ERROR");
      expect(result.error.message).toContain("Unknown code operation");
    });

    it("should handle invalid code gracefully", async () => {
      const invalidJS = "function invalid( { return; }";

      const result = await processCode(invalidJS, "javascript", "beautify");

      // Should still attempt processing but might have issues
      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it("should handle empty code", async () => {
      const result = await processCode("", "javascript", "minify");

      expect(result.success).toBe(true);
      expect(result.result).toBe("");
    });

    it("should respect minification options", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "minify",
        {
          preserveComments: true,
          preserveIndent: true,
        },
      );

      expect(result.success).toBe(true);
      // With preserveComments: true, comments should remain
      expect(result.result).toContain("This is a sample");
    });

    it("should handle different language aliases", async () => {
      const jsResult = await processCode(sampleJavaScript, "js", "minify");
      const tsResult = await processCode(
        sampleJavaScript,
        "typescript",
        "minify",
      );

      expect(jsResult.success).toBe(true);
      expect(tsResult.success).toBe(true);

      // Both should produce similar results for JavaScript code
      expect(jsResult.result).toContain("function");
      expect(tsResult.result).toContain("function");
    });
  });

  describe("Code minification edge cases", () => {
    it("should handle code with strings containing punctuation", async () => {
      const codeWithStrings = `
        const message = "Hello, world! This is a test.";
        console.log(message);
      `;

      const result = await processCode(codeWithStrings, "javascript", "minify");

      expect(result.success).toBe(true);
      expect(result.result).toContain("Hello, world!");
      expect(result.result).toContain("console.log");
    });

    it("should handle code with regular expressions", async () => {
      const codeWithRegex = `
        const pattern = /test\\d+/g;
        const result = str.match(pattern);
      `;

      const result = await processCode(codeWithRegex, "javascript", "minify");

      expect(result.success).toBe(true);
      expect(result.result).toContain("/test\\d+/g");
    });

    it("should handle code with template literals", async () => {
      const codeWithTemplate = `
        const name = "World";
        const message = \`Hello, \${name}!\`;
      `;

      const result = await processCode(
        codeWithTemplate,
        "javascript",
        "minify",
      );

      expect(result.success).toBe(true);
      expect(result.result).toContain("Hello, ${name}!");
    });
  });

  describe("Code obfuscation edge cases", () => {
    it("should handle high-level obfuscation", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "obfuscate",
        {
          obfuscationLevel: "high",
          preserveAPI: true,
        },
      );

      expect(result.success).toBe(true);
      // High level should convert strings to character codes
      expect(result.result).toMatch(/String\.fromCharCode/);
    });

    it("should handle code with no variables to obfuscate", async () => {
      const simpleCode = 'console.log("Hello World");';

      const result = await processCode(simpleCode, "javascript", "obfuscate", {
        obfuscationLevel: "medium",
        preserveAPI: true,
      });

      expect(result.success).toBe(true);
      // Should still contain the same code since no variables to obfuscate
      expect(result.result).toContain("console.log");
    });
  });

  describe("Code comparison edge cases", () => {
    it("should handle identical code", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "compare",
        {
          compareWith: sampleJavaScript,
        },
      );

      expect(result.success).toBe(true);

      const diff = JSON.parse(result.result);
      expect(diff.unchanged).toHaveLength(1);
      expect(diff.modified).toHaveLength(0);
      expect(diff.added).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
    });

    it("should ignore whitespace when requested", async () => {
      const code1 = "function test() { return 1; }";
      const code2 = "function test() {\n  return 1;\n}";

      const result = await processCode(code1, "javascript", "compare", {
        compareWith: code2,
        ignoreWhitespace: true,
      });

      expect(result.success).toBe(true);

      const diff = JSON.parse(result.result);
      expect(diff.unchanged).toHaveLength(1);
      expect(diff.modified).toHaveLength(0);
    });

    it("should show line numbers when requested", async () => {
      const code1 = "function test() { return 1; }";
      const code2 = "function test() { return 2; }";

      const result = await processCode(code1, "javascript", "compare", {
        compareWith: code2,
        showLineNumbers: true,
      });

      expect(result.success).toBe(true);

      const diff = JSON.parse(result.result);
      expect(diff.modified[0].old).toContain("1:");
      expect(diff.modified[0].new).toContain("1:");
    });
  });

  describe("Performance metrics", () => {
    it("should provide accurate processing metrics", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "minify",
      );

      expect(result.metrics).toBeDefined();
      expect(result.metrics.duration).toBeGreaterThan(0);
      expect(result.metrics.inputSize).toBeGreaterThan(0);
      expect(result.metrics.outputSize).toBeGreaterThan(0);
      expect(result.metrics.compressionRatio).toBeDefined();

      // For minification, output should be smaller than input
      expect(result.metrics.compressionRatio).toBeLessThan(1);
    });

    it("should handle different input sizes efficiently", async () => {
      const largeCode = sampleJavaScript.repeat(100);

      const startTime = Date.now();
      const result = await processCode(largeCode, "javascript", "minify");
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe("Error handling", () => {
    it("should handle null inputs gracefully", async () => {
      const result = await processCode(null as any, "javascript", "minify");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should handle undefined inputs gracefully", async () => {
      const result = await processCode(
        undefined as any,
        "javascript",
        "minify",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should provide helpful error messages", async () => {
      const result = await processCode(
        sampleJavaScript,
        "javascript",
        "invalid-operation",
      );

      expect(result.success).toBe(false);
      expect(result.error.message).toContain("Unknown code operation");
      expect(result.error.suggestions).toBeDefined();
      expect(result.error.suggestions).toHaveLength(3);
    });
  });
});
