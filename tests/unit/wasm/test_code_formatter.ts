import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  CodeFormatter,
  BaseFormattingOptions,
  JavaScriptFormattingOptions,
  TypeScriptFormattingOptions,
  PythonFormattingOptions,
  JavaFormattingOptions,
  RustFormattingOptions,
  GoFormattingOptions,
  CssFormattingOptions,
  HtmlFormattingOptions,
  CodeFormattingError,
  UnsupportedLanguageError,
  CodeFormattingResult,
  codeFormatter,
  formatCode,
  formatJavaScript,
  formatTypeScript,
  formatPython,
  formatJava,
  formatRust,
  formatGo,
  formatCss,
  formatHtml,
  SUPPORTED_LANGUAGES,
  SupportedLanguage
} from '../../../apps/api/src/wasm/code_formatter'

describe('CodeFormatter', () => {
  let formatter: CodeFormatter

  beforeEach(async () => {
    formatter = new CodeFormatter()
    await formatter.initialize()
  })

  afterEach(() => {
    formatter.dispose()
  })

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newFormatter = new CodeFormatter()
      await newFormatter.initialize()
      expect(newFormatter.isReady()).toBe(true)
      newFormatter.dispose()
    })

    it('should handle multiple initialization calls', async () => {
      await formatter.initialize()
      await formatter.initialize()
      expect(formatter.isReady()).toBe(true)
    })

    it('should get supported languages', () => {
      const languages = formatter.getSupportedLanguages()
      expect(languages).toContain('javascript')
      expect(languages).toContain('typescript')
      expect(languages).toContain('python')
      expect(languages).toContain('java')
      expect(languages).toContain('rust')
      expect(languages).toContain('go')
      expect(languages).toContain('css')
      expect(languages).toContain('html')
    })

    it('should check if language is supported', () => {
      expect(formatter.isLanguageSupported('javascript')).toBe(true)
      expect(formatter.isLanguageSupported('typescript')).toBe(true)
      expect(formatter.isLanguageSupported('python')).toBe(true)
      expect(formatter.isLanguageSupported('unsupported')).toBe(false)
    })

    it('should get performance metrics', () => {
      const metrics = formatter.getMetrics()
      expect(metrics).toHaveProperty('totalFormattingTime')
      expect(metrics).toHaveProperty('successfulFormattings')
      expect(metrics).toHaveProperty('failedFormattings')
      expect(metrics).toHaveProperty('averageFormattingTime')
      expect(metrics).toHaveProperty('memoryUsage')
    })
  })

  describe('Basic code formatting', () => {
    it('should format JavaScript code', async () => {
      const code = 'const x=1;const y=2;console.log(x+y)'
      const options: JavaScriptFormattingOptions = {
        indentSize: 2,
        semicolons: true,
        quotes: 'single'
      }

      const result = await formatter.format(code, 'javascript', options)

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.formatted).not.toBe(code) // Should be different
      expect(result.original).toBe(code)
      expect(result.language).toBe('javascript')
      expect(result.metadata.formattingTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.linesProcessed).toBeGreaterThan(0)
    })

    it('should format TypeScript code', async () => {
      const code = 'interface User{name:string;age:number;}const user:User={name:"John",age:30}'
      const options: TypeScriptFormattingOptions = {
        indentSize: 2,
        strict: true,
        semicolons: true
      }

      const result = await formatter.format(code, 'typescript', options)

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.language).toBe('typescript')
    })

    it('should format Python code', async () => {
      const code = 'def hello():\nprint("Hello, World!")\nreturn True'
      const options: PythonFormattingOptions = {
        indentSize: 4,
        lineLength: 88,
        targetVersion: 'py311'
      }

      const result = await formatter.format(code, 'python', options)

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.language).toBe('python')
    })

    it('should format Java code', async () => {
      const code = 'public class Test{public static void main(String[] args){System.out.println("Hello");}}'
      const options: JavaFormattingOptions = {
        indentSize: 4,
        maxLineLength: 100,
        sortImports: true
      }

      const result = await formatter.format(code, 'java', options)

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.language).toBe('java')
    })

    it('should format Rust code', async () => {
      const code = 'fn main(){let x=1;let y=2;println!("{}",x+y)}'
      const options: RustFormattingOptions = {
        indentSize: 4,
        edition: '2021',
        maxWidth: 100
      }

      const result = await formatter.format(code, 'rust', options)

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.language).toBe('rust')
    })

    it('should format Go code', async () => {
      const code = 'package main;func main(){x:=1;y:=2;fmt.Println(x+y)}'
      const options: GoFormattingOptions = {
        tabWidth: 8,
        useTabs: true,
        maxWidth: 120
      }

      const result = await formatter.format(code, 'go', options)

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.language).toBe('go')
    })

    it('should format CSS code', async () => {
      const code = '.container{width:100%;height:auto;margin:0;padding:0}'
      const options: CssFormattingOptions = {
        indentSize: 2,
        singleQuote: false,
        sortProperties: false
      }

      const result = await formatter.format(code, 'css', options)

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.language).toBe('css')
    })

    it('should format HTML code', async () => {
      const code = '<div><h1>Title</h1><p>Content</p></div>'
      const options: HtmlFormattingOptions = {
        indentSize: 2,
        indentInnerHtml: false,
        wrapAttributes: 'auto'
      }

      const result = await formatter.format(code, 'html', options)

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.language).toBe('html')
    })
  })

  describe('JavaScript-specific formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle different quote styles', async () => {
      const code = 'const message = "Hello World";'

      const singleQuoteResult = await formatter.format(code, 'javascript', {
        quotes: 'single'
      })
      expect(singleQuoteResult.formatted).toContain("'Hello World'")

      const doubleQuoteResult = await formatter.format(code, 'javascript', {
        quotes: 'double'
      })
      expect(doubleQuoteResult.formatted).toContain('"Hello World"')

      const preserveResult = await formatter.format(code, 'javascript', {
        quotes: 'preserve'
      })
      expect(preserveResult.formatted).toContain('"Hello World"')
    })

    it('should handle semicolon options', async () => {
      const code = 'const x = 1\nconst y = 2\nconsole.log(x + y)'

      const withSemicolons = await formatter.format(code, 'javascript', {
        semicolons: true
      })
      expect(withSemicolons.formatted).toContain(';')

      const withoutSemicolons = await formatter.format(code, 'javascript', {
        semicolons: false
      })
      // The exact behavior depends on the formatter implementation
      expect(withoutSemicolons.formatted).toBeDefined()
    })

    it('should handle trailing comma options', async () => {
      const code = 'const arr = [1, 2, 3]'

      const es5Trailing = await formatter.format(code, 'javascript', {
        trailingCommas: 'es5'
      })
      expect(es5Trailing.formatted).toBeDefined()

      const allTrailing = await formatter.format(code, 'javascript', {
        trailingCommas: 'all'
      })
      expect(allTrailing.formatted).toBeDefined()

      const noneTrailing = await formatter.format(code, 'javascript', {
        trailingCommas: 'none'
      })
      expect(noneTrailing.formatted).toBeDefined()
    })

    it('should handle bracket placement', async () => {
      const code = 'if (true) { console.log("test") }'

      const sameLine = await formatter.format(code, 'javascript', {
        bracketSameLine: true
      })
      expect(sameLine.formatted).toBeDefined()

      const newLine = await formatter.format(code, 'javascript', {
        bracketSameLine: false
      })
      expect(newLine.formatted).toBeDefined()
    })

    it('should handle arrow function parentheses', async () => {
      const code = 'const add = (x, y) => x + y'

      const alwaysParens = await formatter.format(code, 'javascript', {
        arrowParens: 'always'
      })
      expect(alwaysParens.formatted).toBeDefined()

      const avoidParens = await formatter.format(code, 'javascript', {
        arrowParens: 'avoid'
      })
      expect(avoidParens.formatted).toBeDefined()
    })

    it('should handle JSX options', async () => {
      const jsxCode = 'const Component = () => <div className="test">Hello</div>'

      const jsxSingleQuote = await formatter.format(jsxCode, 'javascript', {
        jsxSingleQuote: true
      })
      expect(jsxSingleQuote.formatted).toBeDefined()

      const jsxBracketSameLine = await formatter.format(jsxCode, 'javascript', {
        jsxBracketSameLine: true
      })
      expect(jsxBracketSameLine.formatted).toBeDefined()
    })

    it('should handle quote props options', async () => {
      const code = 'const obj = { key: "value", "with-space": "value" }'

      const asNeeded = await formatter.format(code, 'javascript', {
        quoteProps: 'as-needed'
      })
      expect(asNeeded.formatted).toBeDefined()

      const consistent = await formatter.format(code, 'javascript', {
        quoteProps: 'consistent'
      })
      expect(consistent.formatted).toBeDefined()

      const preserve = await formatter.format(code, 'javascript', {
        quoteProps: 'preserve'
      })
      expect(preserve.formatted).toBeDefined()
    })
  })

  describe('TypeScript-specific formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle strict mode options', async () => {
      const code = 'function test(x: any) { return x }'

      const strictMode = await formatter.format(code, 'typescript', {
        strict: true,
        noImplicitAny: true
      })
      expect(strictMode.formatted).toBeDefined()

      const nonStrictMode = await formatter.format(code, 'typescript', {
        strict: false,
        noImplicitAny: false
      })
      expect(nonStrictMode.formatted).toBeDefined()
    })

    it('should handle implicit returns option', async () => {
      const code = 'function test(): number { return 42 }'

      const withImplicitReturns = await formatter.format(code, 'typescript', {
        noImplicitReturns: true
      })
      expect(withImplicitReturns.formatted).toBeDefined()

      const withoutImplicitReturns = await formatter.format(code, 'typescript', {
        noImplicitReturns: false
      })
      expect(withoutImplicitReturns.formatted).toBeDefined()
    })

    it('should handle unused locals and parameters', async () => {
      const code = 'function test(a: number, b: number) { const unused = a; return b }'

      const checkUnused = await formatter.format(code, 'typescript', {
        noUnusedLocals: true,
        noUnusedParameters: true
      })
      expect(checkUnused.formatted).toBeDefined()

      const ignoreUnused = await formatter.format(code, 'typescript', {
        noUnusedLocals: false,
        noUnusedParameters: false
      })
      expect(ignoreUnused.formatted).toBeDefined()
    })
  })

  describe('Python-specific formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle different Python versions', async () => {
      const code = 'def hello():\n    print("Hello")'

      const versions = ['py36', 'py38', 'py39', 'py310', 'py311', 'py312'] as const

      for (const version of versions) {
        const result = await formatter.format(code, 'python', {
          targetVersion: version
        })
        expect(result.success).toBe(true)
        expect(result.formatted).toBeDefined()
      }
    })

    it('should handle line length options', async () => {
      const longCode = 'def very_long_function_name_that_exceeds_normal_line_length(parameter_one, parameter_two, parameter_three): pass'

      const shortLine = await formatter.format(longCode, 'python', {
        lineLength: 40
      })
      expect(shortLine.formatted).toBeDefined()

      const longLine = await formatter.format(longCode, 'python', {
        lineLength: 120
      })
      expect(longLine.formatted).toBeDefined()
    })

    it('should handle string normalization', async () => {
      const code = 's = "double quotes"\ns2 = \'single quotes\''

      const withNormalization = await formatter.format(code, 'python', {
        skipStringNormalization: false
      })
      expect(withNormalization.formatted).toBeDefined()

      const withoutNormalization = await formatter.format(code, 'python', {
        skipStringNormalization: true
      })
      expect(withoutNormalization.formatted).toBeDefined()
    })

    it('should handle fast mode', async () => {
      const code = 'def test():\n    for i in range(100):\n        print(i)'

      const fastMode = await formatter.format(code, 'python', {
        fast: true
      })
      expect(fastMode.formatted).toBeDefined()

      const normalMode = await formatter.format(code, 'python', {
        fast: false
      })
      expect(normalMode.formatted).toBeDefined()
    })
  })

  describe('Java-specific formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle import ordering', async () => {
      const code = 'import com.example.*;\nimport java.util.*;\nimport javax.swing.*;'

      const customOrder = await formatter.format(code, 'java', {
        importOrder: ['javax', 'java', 'com'],
        sortImports: true
      })
      expect(customOrder.formatted).toBeDefined()

      const defaultOrder = await formatter.format(code, 'java', {
        sortImports: true
      })
      expect(defaultOrder.formatted).toBeDefined()
    })

    it('should handle blank lines configuration', async () => {
      const code = 'package test;\n\nimport java.util.*;\n\npublic class Test {\n    public void method() {}\n}'

      const customBlankLines = await formatter.format(code, 'java', {
        blankLinesBeforePackage: 2,
        blankLinesBeforeImports: 1,
        blankLinesBeforeClass: 3,
        blankLinesBeforeMethod: 2
      })
      expect(customBlankLines.formatted).toBeDefined()
    })

    it('should handle Javadoc formatting', async () => {
      const code = '/**\n * Test method\n * @param x parameter\n * @return result\n */\npublic int test(int x) { return x * 2; }'

      const withJavadoc = await formatter.format(code, 'java', {
        formatJavadoc: true
      })
      expect(withJavadoc.formatted).toBeDefined()

      const withoutJavadoc = await formatter.format(code, 'java', {
        formatJavadoc: false
      })
      expect(withoutJavadoc.formatted).toBeDefined()
    })
  })

  describe('Rust-specific formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle different Rust editions', async () => {
      const code = 'fn main() { let x = 42; println!("{}", x); }'

      const editions = ['2015', '2018', '2021'] as const

      for (const edition of editions) {
        const result = await formatter.format(code, 'rust', {
          edition
        })
        expect(result.success).toBe(true)
        expect(result.formatted).toBeDefined()
      }
    })

    it('should handle hard tabs vs spaces', async () => {
      const code = 'fn main() {\n    let x = 1;\n    let y = 2;\n}'

      const withTabs = await formatter.format(code, 'rust', {
        hardTabs: true,
        tabSpaces: 4
      })
      expect(withTabs.formatted).toBeDefined()

      const withSpaces = await formatter.format(code, 'rust', {
        hardTabs: false,
        tabSpaces: 4
      })
      expect(withSpaces.formatted).toBeDefined()
    })

    it('should handle comment formatting', async () => {
      const code = '// This is a comment\nfn main() { /* block comment */ }'

      const wrapComments = await formatter.format(code, 'rust', {
        wrapComments: true,
        commentWidth: 80
      })
      expect(wrapComments.formatted).toBeDefined()

      const normalizeComments = await formatter.format(code, 'rust', {
        normalizeComments: true
      })
      expect(normalizeComments.formatted).toBeDefined()
    })

    it('should handle import/module reordering', async () => {
      const code = 'use std::collections::HashMap;\nuse std::io;\nuse std::fmt;\n\nfn main() {}'

      const reorderImports = await formatter.format(code, 'rust', {
        reorderImports: true,
        mergeImports: true
      })
      expect(reorderImports.formatted).toBeDefined()

      const reorderModules = await formatter.format(code, 'rust', {
        reorderModules: true
      })
      expect(reorderModules.formatted).toBeDefined()
    })
  })

  describe('Go-specific formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle tab configuration', async () => {
      const code = 'package main\n\nfunc main() {\n\tx := 1\n\ty := 2\n}'

      const withTabs = await formatter.format(code, 'go', {
        useTabs: true,
        tabWidth: 8
      })
      expect(withTabs.formatted).toBeDefined()

      const withSpaces = await formatter.format(code, 'go', {
        useTabs: false,
        tabWidth: 4
      })
      expect(withSpaces.formatted).toBeDefined()
    })

    it('should handle simplification', async () => {
      const code = 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, World!")\n}'

      const simplify = await formatter.format(code, 'go', {
        simplify: true
      })
      expect(simplify.formatted).toBeDefined()

      const noSimplify = await formatter.format(code, 'go', {
        simplify: false
      })
      expect(noSimplify.formatted).toBeDefined()
    })
  })

  describe('CSS-specific formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle quote styles', async () => {
      const code = '.test { content: "Hello"; font-family: "Arial"; }'

      const singleQuote = await formatter.format(code, 'css', {
        singleQuote: true
      })
      expect(singleQuote.formatted).toBeDefined()

      const doubleQuote = await formatter.format(code, 'css', {
        singleQuote: false
      })
      expect(doubleQuote.formatted).toBeDefined()
    })

    it('should handle color case and shorthand', async () => {
      const code = '.test { color: #FF0000; background: #FFFFFF; border-color: #AABBCC; }'

      const lowerCase = await formatter.format(code, 'css', {
        colorCase: 'lower',
        colorShorthand: true
      })
      expect(lowerCase.formatted).toBeDefined()

      const upperCase = await formatter.format(code, 'css', {
        colorCase: 'upper',
        colorShorthand: false
      })
      expect(upperCase.formatted).toBeDefined()
    })

    it('should handle empty ruleset removal', async () => {
      const code = '.empty { }\n.not-empty { color: red; }'

      const removeEmpty = await formatter.format(code, 'css', {
        removeEmptyRulesets: true
      })
      expect(removeEmpty.formatted).toBeDefined()

      const keepEmpty = await formatter.format(code, 'css', {
        removeEmptyRulesets: false
      })
      expect(keepEmpty.formatted).toBeDefined()
    })

    it('should handle comment removal', async () => {
      const code = '/* This is a comment */\n.test { color: red; }'

      const removeComments = await formatter.format(code, 'css', {
        removeComments: true
      })
      expect(removeComments.formatted).toBeDefined()

      const keepComments = await formatter.format(code, 'css', {
        removeComments: false
      })
      expect(keepComments.formatted).toBeDefined()
    })

    it('should handle property and selector sorting', async () => {
      const code = '.test {\n    z-index: 1;\n    color: red;\n    background: blue;\n    margin: 0;\n}'

      const sortProperties = await formatter.format(code, 'css', {
        sortProperties: true
      })
      expect(sortProperties.formatted).toBeDefined()

      const sortSelectors = await formatter.format(code, 'css', {
        sortSelectors: true
      })
      expect(sortSelectors.formatted).toBeDefined()
    })
  })

  describe('HTML-specific formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle inner HTML indentation', async () => {
      const code = '<div><p>Content</p><span>More</span></div>'

      const indentInner = await formatter.format(code, 'html', {
        indentInnerHtml: true
      })
      expect(indentInner.formatted).toBeDefined()

      const noIndentInner = await formatter.format(code, 'html', {
        indentInnerHtml: false
      })
      expect(noIndentInner.formatted).toBeDefined()
    })

    it('should handle attribute wrapping', async () => {
      const code = '<div class="test" id="example" data-value="123" title="tooltip">Content</div>'

      const wrapOptions = ['auto', 'force', 'force-aligned', 'force-expand-multiline', 'preserve'] as const

      for (const wrapOption of wrapOptions) {
        const result = await formatter.format(code, 'html', {
          wrapAttributes: wrapOption
        })
        expect(result.success).toBe(true)
        expect(result.formatted).toBeDefined()
      }
    })

    it('should handle unformatted elements', async () => {
      const code = '<div><pre>    preformatted\n        text    </pre><code>code()</code></div>'

      const customUnformatted = await formatter.format(code, 'html', {
        unformatted: ['pre', 'code', 'textarea']
      })
      expect(customUnformatted.formatted).toBeDefined()
    })

    it('should handle closing slash options', async () => {
      const code = '<img src="test.jpg"><br>'

      const html5Slash = await formatter.format(code, 'html', {
        closingSlash: 'html5'
      })
      expect(html5Slash.formatted).toBeDefined()

      const xhtmlSlash = await formatter.format(code, 'html', {
        closingSlash: 'xhtml'
      })
      expect(xhtmlSlash.formatted).toBeDefined()

      const noneSlash = await formatter.format(code, 'html', {
        closingSlash: 'none'
      })
      expect(noneSlash.formatted).toBeDefined()
    })

    it('should handle attribute and class name sorting', async () => {
      const code = '<div class="z y x" data-c="3" data-a="1" data-b="2">Content</div>'

      const sortAttributes = await formatter.format(code, 'html', {
        sortAttributes: true
      })
      expect(sortAttributes.formatted).toBeDefined()

      const sortClassNames = await formatter.format(code, 'html', {
        sortClassName: true
      })
      expect(sortClassNames.formatted).toBeDefined()
    })
  })

  describe('Base formatting options', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle different indent sizes', async () => {
      const code = 'function test(){if(true){console.log("test")}}'

      for (const indentSize of [0, 2, 4, 8]) {
        const result = await formatter.format(code, 'javascript', {
          indentSize
        })
        expect(result.success).toBe(true)
        expect(result.formatted).toBeDefined()
      }
    })

    it('should handle tab vs space indentation', async () => {
      const code = 'function test(){console.log("test")}'

      const spaceIndent = await formatter.format(code, 'javascript', {
        indentStyle: 'space',
        indentSize: 2
      })
      expect(spaceIndent.formatted).toBeDefined()

      const tabIndent = await formatter.format(code, 'javascript', {
        indentStyle: 'tab',
        indentSize: 1
      })
      expect(tabIndent.formatted).toBeDefined()
    })

    it('should handle max width constraints', async () => {
      const longCode = 'function veryLongFunctionName(parameterOne, parameterTwo, parameterThree, parameterFour) { return parameterOne + parameterTwo + parameterThree + parameterFour }'

      const narrowWidth = await formatter.format(longCode, 'javascript', {
        maxWidth: 40
      })
      expect(narrowWidth.formatted).toBeDefined()

      const wideWidth = await formatter.format(longCode, 'javascript', {
        maxWidth: 120
      })
      expect(wideWidth.formatted).toBeDefined()
    })

    it('should handle final newline insertion', async () => {
      const code = 'function test() { console.log("hello") }'

      const withFinalNewline = await formatter.format(code, 'javascript', {
        insertFinalNewline: true
      })
      expect(withFinalNewline.formatted).toBeDefined()
      expect(withFinalNewline.formatted).toMatch(/\n$/)

      const withoutFinalNewline = await formatter.format(code, 'javascript', {
        insertFinalNewline: false
      })
      expect(withoutFinalNewline.formatted).toBeDefined()
    })

    it('should handle trailing whitespace trimming', async () => {
      const code = 'function test() { console.log("hello") }   \n   \n'

      const trimWhitespace = await formatter.format(code, 'javascript', {
        trimTrailingWhitespace: true
      })
      expect(trimWhitespace.formatted).toBeDefined()

      const keepWhitespace = await formatter.format(code, 'javascript', {
        trimTrailingWhitespace: false
      })
      expect(keepWhitespace.formatted).toBeDefined()
    })

    it('should handle newline preservation', async () => {
      const code = '\n\nfunction test() {\n\n\n    console.log("hello")\n\n}\n\n'

      const preserveNewlines = await formatter.format(code, 'javascript', {
        preserveNewlines: true
      })
      expect(preserveNewlines.formatted).toBeDefined()

      const ignoreNewlines = await formatter.format(code, 'javascript', {
        preserveNewlines: false
      })
      expect(ignoreNewlines.formatted).toBeDefined()
    })

    it('should handle different line endings', async () => {
      const code = 'function test() { console.log("hello") }'

      const lineEndings = ['lf', 'crlf', 'cr'] as const

      for (const lineEnding of lineEndings) {
        const result = await formatter.format(code, 'javascript', {
          lineEnding
        })
        expect(result.success).toBe(true)
        expect(result.formatted).toBeDefined()
      }
    })
  })

  describe('Error handling', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle unsupported languages', async () => {
      const code = 'some code'

      await expect(formatter.format(code, 'unsupported' as SupportedLanguage))
        .rejects.toThrow(UnsupportedLanguageError)
    })

    it('should handle empty code', async () => {
      await expect(formatter.format('', 'javascript'))
        .rejects.toThrow(CodeFormattingError)
    })

    it('should handle malformed code', async () => {
      const malformedCode = 'function test( { console.log("missing closing parenthesis")'

      const result = await formatter.format(malformedCode, 'javascript')

      // Should either succeed with best effort or fail gracefully
      expect(result).toBeDefined()
    })

    it('should handle syntax errors', async () => {
      const syntaxError = 'const = invalid syntax here'

      const result = await formatter.format(syntaxError, 'javascript')

      // Should handle syntax errors gracefully
      expect(result).toBeDefined()
    })

    it('should provide detailed error information', async () => {
      try {
        await formatter.format('', 'javascript')
      } catch (error) {
        expect(error).toBeInstanceOf(CodeFormattingError)
        expect(error.name).toBe('CodeFormattingError')
      }
    })
  })

  describe('Performance and metadata', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should provide accurate metadata', async () => {
      const code = 'function test() { console.log("hello"); return "world"; }'
      const result = await formatter.format(code, 'javascript')

      expect(result.metadata).toBeDefined()
      expect(result.metadata.formattingTime).toBeGreaterThanOrEqual(0)
      expect(result.metadata.linesProcessed).toBeGreaterThan(0)
      expect(result.metadata.charactersProcessed).toBeGreaterThan(0)
      expect(result.metadata.changes).toBeGreaterThanOrEqual(0)
    })

    it('should handle large files efficiently', async () => {
      const largeCode = []
      for (let i = 0; i < 1000; i++) {
        largeCode.push(`function test${i}() { return ${i}; }`)
      }
      const code = largeCode.join('\n')

      const startTime = performance.now()
      const result = await formatter.format(code, 'javascript')
      const endTime = performance.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(result.metadata.formattingTime).toBeLessThan(1000)
    })

    it('should track formatting statistics', async () => {
      const code = 'function test() { return "hello"; }'

      // Format multiple times to build up statistics
      await formatter.format(code, 'javascript')
      await formatter.format(code, 'javascript')
      await formatter.format(code, 'javascript')

      const metrics = formatter.getMetrics()
      expect(metrics.totalFormattingTime).toBeGreaterThan(0)
      expect(metrics.successfulFormattings).toBe(3)
      expect(metrics.failedFormattings).toBe(0)
      expect(metrics.averageFormattingTime).toBeGreaterThan(0)
    })
  })

  describe('Edge cases', () => {
    beforeEach(async () => {
      await formatter.initialize()
    })

    it('should handle minified code', async () => {
      const minifiedCode = 'function test(){if(true){console.log("test")}else{console.log("other")}}return'

      const result = await formatter.format(minifiedCode, 'javascript')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.formatted).not.toBe(minifiedCode)
    })

    it('should handle code with comments', async () => {
      const codeWithComments = `
        // This is a comment
        function test() {
          /* Block comment */
          console.log("hello"); // Line comment
          return "world";
        }
      `

      const result = await formatter.format(codeWithComments, 'javascript')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.formatted).toContain('//') // Comments should be preserved
    })

    it('should handle Unicode characters', async () => {
      const unicodeCode = 'function 你好() { console.log("🌍 Hello, 世界!"); return "✓ Success"; }'

      const result = await formatter.format(unicodeCode, 'javascript')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.formatted).toContain('你好')
      expect(result.formatted).toContain('🌍')
      expect(result.formatted).toContain('世界')
    })

    it('should handle different encodings', async () => {
      const code = 'function test() { console.log("café"); return "naïve"; }'

      const result = await formatter.format(code, 'javascript')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.formatted).toContain('café')
      expect(result.formatted).toContain('naïve')
    })

    it('should handle template literals', async () => {
      const templateLiteralCode = 'const name = "World"; const message = `Hello, ${name}! ${2 + 2}`;'

      const result = await formatter.format(templateLiteralCode, 'javascript')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.formatted).toContain('`')
    })

    it('should handle JSX syntax', async () => {
      const jsxCode = 'const Component = ({ name }) => <div className="container"><h1>Hello {name}</h1><p>Content</p></div>'

      const result = await formatter.format(jsxCode, 'javascript')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()
      expect(result.formatted).toContain('<div')
    })
  })

  describe('Configuration', () => {
    it('should allow setting default options', async () => {
      const customFormatter = new CodeFormatter()
      await customFormatter.initialize()

      const defaultOptions: JavaScriptFormattingOptions = {
        indentSize: 4,
        quotes: 'double',
        semicolons: false
      }

      customFormatter.setDefaultOptions('javascript', defaultOptions)

      const code = 'const x=1;const y=2;console.log(x+y)'
      const result = await customFormatter.format(code, 'javascript')

      expect(result.success).toBe(true)
      expect(result.formatted).toBeDefined()

      customFormatter.dispose()
    })

    it('should allow configuring limits', async () => {
      formatter.setMaxFileSize(1024) // 1KB
      formatter.setMaxFormattingTime(100) // 100ms

      const smallCode = 'function test() { return "small"; }'
      const result = await formatter.format(smallCode, 'javascript')

      expect(result.success).toBe(true)

      // Large code should timeout or fail
      const largeCode = 'x'.repeat(2000)
      try {
        await formatter.format(largeCode, 'javascript')
      } catch (error) {
        expect(error).toBeInstanceOf(CodeFormattingError)
      }
    })
  })

  describe('Resource management', () => {
    it('should dispose resources properly', async () => {
      expect(formatter.isReady()).toBe(true)

      formatter.dispose()
      expect(formatter.isReady()).toBe(false)
    })

    it('should handle concurrent formatting', async () => {
      const code = 'function test() { return "concurrent"; }'

      const promises = Array.from({ length: 10 }, () =>
        formatter.format(code, 'javascript')
      )

      const results = await Promise.all(promises)

      expect(results.length).toBe(10)
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.formatted).toBeDefined()
      })
    })
  })
})

describe('Utility functions', () => {
  beforeEach(async () => {
    await codeFormatter.initialize()
  })

  it('formatCode should format code correctly', async () => {
    const code = 'const x=1;const y=2;console.log(x+y)'
    const result = await formatCode(code, 'javascript', { indentSize: 2 })

    expect(result.success).toBe(true)
    expect(result.formatted).toBeDefined()
    expect(result.language).toBe('javascript')
  })

  it('formatJavaScript should format JS correctly', async () => {
    const code = 'const x=1;const y=2;console.log(x+y)'
    const result = await formatJavaScript(code, { indentSize: 2 })

    expect(result.success).toBe(true)
    expect(result.language).toBe('javascript')
  })

  it('formatTypeScript should format TS correctly', async () => {
    const code = 'const x:number=1;const y:number=2;console.log(x+y)'
    const result = await formatTypeScript(code, { indentSize: 2 })

    expect(result.success).toBe(true)
    expect(result.language).toBe('typescript')
  })

  it('formatPython should format Python correctly', async () => {
    const code = 'def hello():\nprint("Hello")'
    const result = await formatPython(code, { indentSize: 4 })

    expect(result.success).toBe(true)
    expect(result.language).toBe('python')
  })

  it('formatJava should format Java correctly', async () => {
    const code = 'public class Test{public static void main(String[] args){System.out.println("Hello");}}'
    const result = await formatJava(code, { indentSize: 4 })

    expect(result.success).toBe(true)
    expect(result.language).toBe('java')
  })

  it('formatRust should format Rust correctly', async () => {
    const code = 'fn main(){let x=1;println!("{}",x)}'
    const result = await formatRust(code, { indentSize: 4 })

    expect(result.success).toBe(true)
    expect(result.language).toBe('rust')
  })

  it('formatGo should format Go correctly', async () => {
    const code = 'package main;func main(){x:=1;fmt.Println(x)}'
    const result = await formatGo(code, { indentSize: 4 })

    expect(result.success).toBe(true)
    expect(result.language).toBe('go')
  })

  it('formatCss should format CSS correctly', async () => {
    const code = '.container{width:100%;height:auto;margin:0}'
    const result = await formatCss(code, { indentSize: 2 })

    expect(result.success).toBe(true)
    expect(result.language).toBe('css')
  })

  it('formatHtml should format HTML correctly', async () => {
    const code = '<div><h1>Title</h1><p>Content</p></div>'
    const result = await formatHtml(code, { indentSize: 2 })

    expect(result.success).toBe(true)
    expect(result.language).toBe('html')
  })
})

describe('Supported languages', () => {
  it('should export supported languages array', () => {
    expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true)
    expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0)
    expect(SUPPORTED_LANGUAGES).toContain('javascript')
    expect(SUPPORTED_LANGUAGES).toContain('typescript')
    expect(SUPPORTED_LANGUAGES).toContain('python')
  })

  it('should include all major languages', () => {
    const majorLanguages = [
      'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'csharp',
      'go', 'rust', 'php', 'ruby', 'html', 'css', 'json', 'yaml', 'xml'
    ]

    majorLanguages.forEach(lang => {
      expect(SUPPORTED_LANGUAGES).toContain(lang)
    })
  })
})

describe('Performance benchmarks', () => {
  beforeEach(async () => {
    await codeFormatter.initialize()
  })

  it('should handle complex JavaScript efficiently', async () => {
    const complexCode = `
      class ComplexClass {
        constructor(options) {
          this.options = options || {};
          this.data = [];
        }

        async processData(items) {
          return items.map(item => ({
            id: item.id,
            processed: true,
            timestamp: Date.now()
          }));
        }

        *generator() {
          for (let i = 0; i < 100; i++) {
            yield i * 2;
          }
        }
      }

      const instance = new ComplexClass({ debug: true });
      const result = await instance.processData([{ id: 1 }, { id: 2 }]);
    `

    const startTime = performance.now()
    const result = await formatCode(complexCode, 'javascript', { indentSize: 2 })
    const endTime = performance.now()

    expect(result.success).toBe(true)
    expect(endTime - startTime).toBeLessThan(500) // Should complete within 500ms
    expect(result.metadata.formattingTime).toBeLessThan(500)
  })

  it('should handle large Python files efficiently', async () => {
    const pythonLines = []
    for (let i = 0; i < 500; i++) {
      pythonLines.push(`def function_${i}():`)
      pythonLines.push(`    """Docstring for function ${i}."""`)
      pythonLines.push(`    result = ${i} * 2`)
      pythonLines.push(`    return result`)
      pythonLines.push('')
    }
    const pythonCode = pythonLines.join('\n')

    const startTime = performance.now()
    const result = await formatPython(pythonCode, { indentSize: 4 })
    const endTime = performance.now()

    expect(result.success).toBe(true)
    expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
  })

  it('should handle concurrent formatting efficiently', async () => {
    const codes = [
      'function test1() { return 1; }',
      'def test2(): return 2',
      'public class Test3 { public int getValue() { return 3; } }',
      'fn test4() -> i32 { 4 }',
      '.test5 { color: red; margin: 0; }'
    ]

    const languages: SupportedLanguage[] = ['javascript', 'python', 'java', 'rust', 'css']

    const startTime = performance.now()
    const promises = codes.map((code, index) =>
      formatCode(code, languages[index])
    )
    const results = await Promise.all(promises)
    const endTime = performance.now()

    expect(results.length).toBe(5)
    results.forEach(result => {
      expect(result.success).toBe(true)
    })
    expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
  })
})

describe('Error scenarios and edge cases', () => {
  beforeEach(async () => {
    await codeFormatter.initialize()
  })

  it('should handle code with mixed line endings', async () => {
    const mixedLineEndings = 'function test() {\r\n  console.log("Windows");\n  return "mixed";\r\n}'

    const result = await formatCode(mixedLineEndings, 'javascript', {
      lineEnding: 'lf'
    })

    expect(result.success).toBe(true)
    expect(result.formatted).toBeDefined()
  })

  it('should handle code with BOM', async () => {
    const bomCode = '\uFEFFfunction test() { console.log("with BOM"); }'

    const result = await formatCode(bomCode, 'javascript')

    expect(result.success).toBe(true)
    expect(result.formatted).toBeDefined()
    expect(result.formatted).not.toContain('\uFEFF') // BOM should be removed
  })

  it('should handle very long lines', async () => {
    const longLine = 'const veryLongVariableName = "this is a very long string that exceeds normal line length limits and should be wrapped by the formatter";'

    const result = await formatCode(longLine, 'javascript', {
      maxWidth: 80
    })

    expect(result.success).toBe(true)
    expect(result.formatted).toBeDefined()
  })

  it('should handle deeply nested code', async () => {
    let nestedCode = 'function test() {\n'
    for (let i = 0; i < 20; i++) {
      nestedCode += '  '.repeat(i) + 'if (true) {\n'
    }
    for (let i = 19; i >= 0; i--) {
      nestedCode += '  '.repeat(i) + '}\n'
    }
    nestedCode += '}'

    const result = await formatCode(nestedCode, 'javascript', {
      indentSize: 2
    })

    expect(result.success).toBe(true)
    expect(result.formatted).toBeDefined()
  })

  it('should handle malformed language options', async () => {
    const code = 'function test() { return "hello"; }'

    // Should handle invalid options gracefully
    const result = await formatCode(code, 'javascript', {
      indentSize: -1, // Invalid
      maxWidth: 1000, // Valid but large
      quotes: 'invalid' as any // Invalid
    })

    expect(result.success).toBe(true)
    expect(result.formatted).toBeDefined()
  })

  it('should handle code with special characters', async () => {
    const specialChars = 'function test() {\n  console.log("Special chars: \\\\t\\\\n\\\\r\\\\\\"\\\\\'");\n  return null;\n}'

    const result = await formatCode(specialChars, 'javascript')

    expect(result.success).toBe(true)
    expect(result.formatted).toBeDefined()
    expect(result.formatted).toContain('\\t')
    expect(result.formatted).toContain('\\n')
  })
})
