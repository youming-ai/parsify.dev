import type { ToolDocumentation, DocumentationSection, CodeExample, BestPractice, FAQItem } from '@/types/documentation';
import type { Tool, ToolCategory } from '@/types/tools';

/**
 * Comprehensive documentation content generator for all 58 tools
 * Generates structured documentation with consistent formatting across all categories
 */
export class DocumentationContentGenerator {
  private static instance: DocumentationContentGenerator;
  private generatedContent: Map<string, ToolDocumentation> = new Map();

  private constructor() {}

  static getInstance(): DocumentationContentGenerator {
    if (!DocumentationContentGenerator.instance) {
      DocumentationContentGenerator.instance = new DocumentationContentGenerator();
    }
    return DocumentationContentGenerator.instance;
  }

  /**
   * Generate complete documentation for a tool based on its category and ID
   */
  public generateDocumentation(toolId: string, tool: Tool): ToolDocumentation {
    if (this.generatedContent.has(toolId)) {
      return this.generatedContent.get(toolId)!;
    }

    const documentation = this.createToolDocumentation(toolId, tool);
    this.generatedContent.set(toolId, documentation);
    return documentation;
  }

  /**
   * Create comprehensive documentation for a specific tool
   */
  private createToolDocumentation(toolId: string, tool: Tool): ToolDocumentation {
    const baseDocumentation = {
      toolId,
      toolName: tool.name,
      toolCategory: tool.category,
      version: '1.0.0',
      lastUpdated: new Date(),
      sections: this.generateDocumentationSections(toolId, tool),
      examples: this.generateExamples(toolId, tool),
      tutorials: this.generateRelatedTutorials(toolId, tool),
      bestPractices: this.generateBestPractices(toolId, tool),
      faq: this.generateFAQ(toolId, tool),
      relatedTools: this.getRelatedTools(toolId),
      tags: tool.tags,
      difficulty: tool.difficulty,
      estimatedReadTime: this.calculateReadTime(toolId, tool),
    };

    return baseDocumentation;
  }

  /**
   * Generate documentation sections for a tool
   */
  private generateDocumentationSections(toolId: string, tool: Tool): DocumentationSection[] {
    const categorySections = this.getCategorySpecificSections(tool.category, toolId);
    const commonSections = this.getCommonSections(toolId, tool);

    return [...commonSections, ...categorySections].sort((a, b) => a.order - b.order);
  }

  /**
   * Get common documentation sections that apply to all tools
   */
  private getCommonSections(toolId: string, tool: Tool): DocumentationSection[] {
    return [
      {
        id: 'overview',
        title: 'Overview',
        content: this.generateOverviewContent(toolId, tool),
        order: 1,
        isRequired: true,
      },
      {
        id: 'getting-started',
        title: 'Getting Started',
        content: this.generateGettingStartedContent(toolId, tool),
        order: 2,
        isRequired: true,
      },
      {
        id: 'features',
        title: 'Features',
        content: this.generateFeaturesContent(toolId, tool),
        order: 3,
        isRequired: true,
      },
      {
        id: 'examples',
        title: 'Examples',
        content: this.generateExamplesContent(toolId, tool),
        order: 4,
        isRequired: true,
        subsections: this.generateExampleSubsections(toolId, tool),
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        content: this.generateTroubleshootingContent(toolId, tool),
        order: 5,
        isRequired: false,
      },
    ];
  }

  /**
   * Get category-specific documentation sections
   */
  private getCategorySpecificSections(category: ToolCategory, toolId: string): DocumentationSection[] {
    switch (category) {
      case 'JSON Processing':
        return this.getJSONProcessingSections(toolId);
      case 'Code Execution':
        return this.getCodeExecutionSections(toolId);
      case 'File Processing':
        return this.getFileProcessingSections(toolId);
      case 'Network Utilities':
        return this.getNetworkUtilitiesSections(toolId);
      case 'Text Processing':
        return this.getTextProcessingSections(toolId);
      case 'Security & Encryption':
        return this.getSecuritySections(toolId);
      default:
        return [];
    }
  }

  /**
   * Generate JSON Processing specific sections
   */
  private getJSONProcessingSections(toolId: string): DocumentationSection[] {
    return [
      {
        id: 'json-standards',
        title: 'JSON Standards & Specifications',
        content: this.generateJSONStandardsContent(),
        order: 6,
        isRequired: true,
      },
      {
        id: 'performance-tips',
        title: 'Performance Tips',
        content: this.generatePerformanceTips(toolId, 'json'),
        order: 7,
        isRequired: false,
      },
    ];
  }

  /**
   * Generate Code Execution specific sections
   */
  private getCodeExecutionSections(toolId: string): DocumentationSection[] {
    return [
      {
        id: 'supported-languages',
        title: 'Supported Languages',
        content: this.generateSupportedLanguagesContent(),
        order: 6,
        isRequired: true,
      },
      {
        id: 'security-sandbox',
        title: 'Security & Sandboxing',
        content: this.generateSecuritySandboxContent(),
        order: 7,
        isRequired: true,
      },
      {
        id: 'debugging',
        title: 'Debugging Tips',
        content: this.generateDebuggingContent(),
        order: 8,
        isRequired: false,
      },
    ];
  }

  /**
   * Generate File Processing specific sections
   */
  private getFileProcessingSections(toolId: string): DocumentationSection[] {
    return [
      {
        id: 'supported-formats',
        title: 'Supported File Formats',
        content: this.generateSupportedFormatsContent(),
        order: 6,
        isRequired: true,
      },
      {
        id: 'batch-processing',
        title: 'Batch Processing',
        content: this.generateBatchProcessingContent(),
        order: 7,
        isRequired: false,
      },
    ];
  }

  /**
   * Generate Network Utilities specific sections
   */
  private getNetworkUtilitiesSections(toolId: string): DocumentationSection[] {
    return [
      {
        id: 'api-usage',
        title: 'API Usage',
        content: this.generateAPIUsageContent(toolId),
        order: 6,
        isRequired: true,
      },
      {
        id: 'rate-limiting',
        title: 'Rate Limiting & Best Practices',
        content: this.generateRateLimitingContent(),
        order: 7,
        isRequired: false,
      },
    ];
  }

  /**
   * Generate Text Processing specific sections
   */
  private getTextProcessingSections(toolId: string): DocumentationSection[] {
    return [
      {
        id: 'encoding-support',
        title: 'Encoding Support',
        content: this.generateEncodingSupportContent(),
        order: 6,
        isRequired: true,
      },
      {
        id: 'unicode-handling',
        title: 'Unicode & Character Sets',
        content: this.generateUnicodeContent(),
        order: 7,
        isRequired: false,
      },
    ];
  }

  /**
   * Generate Security & Encryption specific sections
   */
  private getSecuritySections(toolId: string): DocumentationSection[] {
    return [
      {
        id: 'algorithms',
        title: 'Supported Algorithms',
        content: this.generateAlgorithmsContent(toolId),
        order: 6,
        isRequired: true,
      },
      {
        id: 'security-best-practices',
        title: 'Security Best Practices',
        content: this.generateSecurityBestPractices(),
        order: 7,
        isRequired: true,
      },
    ];
  }

  /**
   * Generate overview content for a tool
   */
  private generateOverviewContent(toolId: string, tool: Tool): string {
    return `# ${tool.name}

${tool.description}

## What is ${tool.name}?

${tool.name} is a professional-grade ${tool.category.toLowerCase()} tool designed for developers, data analysts, and technical users. This tool provides a reliable, secure, and efficient way to ${this.getActionPhrase(toolId)}.

## Key Benefits

- **🚀 Fast Processing**: Optimized algorithms for quick results
- **🔒 Secure**: All processing happens locally in your browser
- **🎯 Reliable**: Consistent results with comprehensive error handling
- **📱 Responsive**: Works perfectly on all device sizes
- **🛠️ Feature-Rich**: ${tool.features.length} powerful features included

## Common Use Cases

${this.generateUseCases(toolId, tool)}

## Why Choose Our ${tool.name}?

1. **Professional Quality**: Built with industry standards in mind
2. **Zero Setup Required**: No installation or configuration needed
3. **Privacy First**: Your data never leaves your browser
4. **Regular Updates**: Continuously improved with new features
5. **Cross-Platform**: Works on Windows, macOS, Linux, and mobile

## Technical Specifications

- **Category**: ${tool.category}
- **Difficulty Level**: ${tool.difficulty}
- **Processing Type**: ${tool.processingType}
- **Security Level**: ${tool.security}
- **Status**: ${tool.status}`;
  }

  /**
   * Generate getting started content
   */
  private generateGettingStartedContent(toolId: string, tool: Tool): string {
    return `# Getting Started with ${tool.name}

## Quick Start Guide

Getting started with ${tool.name} is simple and straightforward. Follow these steps to begin using the tool effectively:

### Step 1: Access the Tool
1. Navigate to the ${tool.name} page
2. The tool interface will load automatically
3. No installation or registration required

### Step 2: Prepare Your Input
${this.generateInputInstructions(toolId, tool)}

### Step 3: Configure Options (Optional)
${this.generateConfigurationInstructions(toolId, tool)}

### Step 4: Process Your Data
1. Click the "Process" or "Convert" button
2. Wait for the results to appear
3. Review the output for accuracy

### Step 5: Export or Copy Results
${this.generateExportInstructions(toolId, tool)}

## Interface Overview

The ${tool.name} interface is divided into several key areas:

### Input Area
- **Main Input Field**: Where you enter your data
- **File Upload**: Alternative input method for supported files
- **Paste Options**: Quick paste from clipboard

### Options Panel
- **Tool Settings**: Configure behavior and output format
- **Advanced Options**: Expert-level customization
- **Reset Button**: Clear all settings and input

### Output Area
- **Results Display**: Formatted output with syntax highlighting
- **Download Options**: Export in various formats
- **Copy Button**: Quick copy to clipboard

## Keyboard Shortcuts

${this.generateKeyboardShortcuts(toolId)}

## Pro Tips

${this.generateProTips(toolId, tool)}

## Next Steps

Now that you understand the basics, explore these advanced features:
- [Advanced Configuration](#features)
- [Real-world Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)`;
  }

  /**
   * Generate features content for a tool
   */
  private generateFeaturesContent(toolId: string, tool: Tool): string {
    return `# Features

## Core Features

${tool.features.map((feature, index) => `
### ${index + 1}. ${feature}

${this.generateFeatureDescription(feature, toolId)}
`).join('')}

## Advanced Features

### Real-time Processing
- **Live Preview**: See results as you type
- **Instant Validation**: Real-time error checking
- **Auto-save**: Preserve your work automatically

### Customization Options
- **Theme Selection**: Light, dark, and auto themes
- **Font Size Adjustment**: Improve readability
- **Export Settings**: Configure output formats

### Integration Features
- **API Access**: Programmatic usage
- **Webhook Support**: Automated workflows
- **Batch Operations**: Process multiple items

## ${tool.category} Specific Features

${this.generateCategoryFeatures(tool.category, toolId)}

## Performance Features

- **Optimized Algorithms**: Fast and efficient processing
- **Memory Management**: Handle large files gracefully
- **Parallel Processing**: Multiple operations simultaneously
- **Caching**: Faster subsequent operations

## Security Features

- **Client-side Processing**: Data never leaves your browser
- **Sandboxed Execution**: Isolated processing environment
- **Input Validation**: Comprehensive security checks
- **Error Handling**: Graceful failure management`;
  }

  /**
   * Generate examples content
   */
  private generateExamplesContent(toolId: string, tool: Tool): string {
    return `# Examples

Welcome to the examples section for ${tool.name}. Here you'll find practical examples and use cases to help you master this tool.

## Example Categories

${this.generateExampleCategories(toolId, tool)}

## Basic Examples

${this.generateBasicExamples(toolId, tool)}

## Intermediate Examples

${this.generateIntermediateExamples(toolId, tool)}

## Advanced Examples

${this.generateAdvancedExamples(toolId, tool)}

## Real-world Scenarios

${this.generateRealWorldExamples(toolId, tool)}

## Troubleshooting Examples

${this.generateTroubleshootingExamples(toolId, tool)}`;
  }

  /**
   * Generate troubleshooting content
   */
  private generateTroubleshootingContent(toolId: string, tool: Tool): string {
    return `# Troubleshooting

## Common Issues and Solutions

### Issue: "Invalid Input Format"
**Symptoms**: Error message about invalid format or structure
**Causes**:
- Incorrect input format
- Missing required fields
- Invalid syntax

**Solutions**:
1. Verify your input format matches the expected structure
2. Use the built-in validator to check syntax
3. Refer to the examples for proper formatting

### Issue: "Processing Failed"
**Symptoms**: Tool stops working or shows error messages
**Causes**:
- Large file size
- Network connectivity issues
- Browser limitations

**Solutions**:
1. Check file size limits
2. Refresh the page and try again
3. Try with a smaller file first

### Issue: "Slow Performance"
**Symptoms**: Tool takes too long to process data
**Causes**:
- Complex data structure
- Browser resource limitations
- Background processes

**Solutions**:
1. Close unnecessary browser tabs
2. Simplify your data structure
3. Use browser's developer tools to identify bottlenecks

## Browser Compatibility Issues

### Chrome/Chromium
- **Recommended Version**: 90+
- **Known Issues**: None major
- **Performance**: Excellent

### Firefox
- **Recommended Version**: 88+
- **Known Issues**: Some advanced features may be slower
- **Performance**: Good

### Safari
- **Recommended Version**: 14+
- **Known Issues**: File upload limitations
- **Performance**: Good

### Edge
- **Recommended Version**: 90+
- **Known Issues**: None major
- **Performance**: Excellent

## Getting Help

If you're still experiencing issues:

1. **Check the FAQ**: Browse our frequently asked questions
2. **Contact Support**: Reach out to our technical team
3. **Community Forum**: Get help from other users
4. **Documentation**: Review detailed guides and tutorials

## Reporting Bugs

When reporting bugs, please include:
- Tool name and version
- Browser information
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable`;
  }

  /**
   * Generate example subsections
   */
  private generateExampleSubsections(toolId: string, tool: Tool): any[] {
    const subsections = [];

    // Basic examples
    subsections.push({
      id: 'basic-examples',
      title: 'Basic Examples',
      content: 'Simple examples to get you started quickly',
      order: 1,
      codeExamples: this.generateBasicCodeExamples(toolId, tool),
    });

    // Advanced examples
    subsections.push({
      id: 'advanced-examples',
      title: 'Advanced Examples',
      content: 'Complex examples for experienced users',
      order: 2,
      codeExamples: this.generateAdvancedCodeExamples(toolId, tool),
    });

    return subsections;
  }

  /**
   * Generate examples for a tool
   */
  private generateExamples(toolId: string, tool: Tool): any[] {
    return [
      {
        title: 'Basic Usage',
        description: 'Simple example demonstrating core functionality',
        input: this.generateExampleInput(toolId, 'basic'),
        expectedOutput: this.generateExampleOutput(toolId, 'basic'),
        category: 'basic',
      },
      {
        title: 'Advanced Features',
        description: 'Example using advanced features and options',
        input: this.generateExampleInput(toolId, 'advanced'),
        expectedOutput: this.generateExampleOutput(toolId, 'advanced'),
        category: 'advanced',
      },
    ];
  }

  /**
   * Generate related tutorials
   */
  private generateRelatedTutorials(toolId: string, tool: Tool): any[] {
    return [
      {
        id: `${toolId}-basics`,
        title: `${tool.name} Basics`,
        description: `Learn the fundamentals of ${tool.name}`,
        duration: 10,
        difficulty: 'beginner',
        tags: ['basics', tool.category.toLowerCase()],
        tools: [toolId],
        steps: [],
      },
      {
        id: `${toolId}-advanced`,
        title: `Advanced ${tool.name}`,
        description: `Master advanced features of ${tool.name}`,
        duration: 20,
        difficulty: 'advanced',
        tags: ['advanced', tool.category.toLowerCase()],
        tools: [toolId],
        steps: [],
      },
    ];
  }

  /**
   * Generate best practices for a tool
   */
  private generateBestPractices(toolId: string, tool: Tool): BestPractice[] {
    return [
      {
        id: `${toolId}-input-validation`,
        title: 'Validate Input Data',
        description: 'Always validate your input data before processing',
        rationale: 'Valid input ensures reliable output and prevents errors',
        category: 'maintainability',
        applicableTo: [toolId],
      },
      {
        id: `${toolId}-performance`,
        title: 'Optimize for Performance',
        description: 'Use appropriate data structures and algorithms',
        rationale: 'Optimized code runs faster and uses fewer resources',
        category: 'performance',
        applicableTo: [toolId],
      },
      {
        id: `${toolId}-security`,
        title: 'Security Considerations',
        description: 'Be mindful of security when processing sensitive data',
        rationale: 'Protect sensitive information and follow security best practices',
        category: 'security',
        applicableTo: [toolId],
      },
    ];
  }

  /**
   * Generate FAQ for a tool
   */
  private generateFAQ(toolId: string, tool: Tool): FAQItem[] {
    return [
      {
        id: `${toolId}-what-is`,
        question: `What is ${tool.name} and how does it work?`,
        answer: `${tool.name} is a ${tool.category.toLowerCase()} tool that ${tool.description.toLowerCase()}. It works entirely in your browser for maximum privacy and security.`,
        category: 'general',
        tags: ['basics', 'overview'],
        helpfulCount: 25,
        notHelpfulCount: 1,
      },
      {
        id: `${toolId}-is-free`,
        question: `Is ${tool.name} free to use?`,
        answer: 'Yes, all tools on Parsify.dev are completely free to use. No registration or payment required.',
        category: 'pricing',
        tags: ['free', 'pricing'],
        helpfulCount: 18,
        notHelpfulCount: 0,
      },
      {
        id: `${toolId}-data-privacy`,
        question: 'How is my data protected?',
        answer: 'All processing happens locally in your browser. Your data never leaves your device or gets sent to any servers, ensuring complete privacy.',
        category: 'privacy',
        tags: ['privacy', 'security'],
        helpfulCount: 32,
        notHelpfulCount: 2,
      },
    ];
  }

  // Helper methods for generating specific content sections
  private generateActionPhrase(toolId: string): string {
    const actionPhrases: Record<string, string> = {
      'json-formatter': 'format and beautify JSON data',
      'json-validator': 'validate JSON syntax and structure',
      'json-converter': 'convert JSON to and from other formats',
      'code-executor': 'execute code in a secure environment',
      'code-formatter': 'format and beautify code in multiple languages',
      'regex-tester': 'test and debug regular expressions',
      'hash-generator': 'generate hash values for data integrity',
      'file-converter': 'convert files between different formats',
      'url-encoder': 'encode and decode URLs',
      'base64-converter': 'convert between text and Base64 encoding',
    };

    return actionPhrases[toolId] || 'perform various data processing tasks';
  }

  private generateUseCases(toolId: string, tool: Tool): string {
    return `
### For Developers
- **API Testing**: Validate and format API responses
- **Code Reviews**: Clean up code for better readability
- **Debugging**: Identify and fix data formatting issues

### For Data Analysts
- **Data Validation**: Ensure data quality and consistency
- **Format Conversion**: Transform data between different formats
- **Report Generation**: Prepare data for analysis and reporting

### For Students & Learners
- **Learning**: Understand data structures and formats
- **Practice**: Work with real-world data examples
- **Projects**: Complete assignments and projects efficiently

### For IT Professionals
- **System Administration**: Process configuration files
- **Data Migration**: Convert data between systems
- **Quality Assurance**: Validate data integrity`;
  }

  private generateInputInstructions(toolId: string, tool: Tool): string {
    return `
- **Text Input**: Copy and paste your data directly into the input field
- **File Upload**: Click the upload button or drag and drop files
- **Format Requirements**: Ensure your data follows the expected format
- **Size Limits**: Check the maximum file size allowed`;

    // Add specific instructions based on tool type
    if (toolId.includes('json')) {
      return `
- **Valid JSON**: Ensure your JSON is properly formatted
- **File Types**: .json, .txt files are supported
- **Encoding**: UTF-8 encoding recommended`;
    }

    return '';
  }

  private generateConfigurationInstructions(toolId: string, tool: Tool): string {
    return `
- **Indentation**: Choose the number of spaces for indentation
- **Sorting Options**: Enable/disable key sorting
- **Output Format**: Select your preferred output format
- **Validation**: Toggle real-time validation`;
  }

  private generateExportInstructions(toolId: string, tool: Tool): string {
    return `
- **Copy to Clipboard**: Quick copy with one click
- **Download File**: Save results to your device
- **Format Selection**: Choose from multiple export formats
- **Share Link**: Generate a shareable link (if available)`;
  }

  private generateKeyboardShortcuts(toolId: string): string {
    return `
- **Ctrl/Cmd + Enter**: Process input
- **Ctrl/Cmd + Shift + C**: Copy results
- **Ctrl/Cmd + S**: Save current work
- **Ctrl/Cmd + Z**: Undo last action
- **F11**: Toggle fullscreen mode`;
  }

  private generateProTips(toolId: string, tool: Tool): string {
    return `
- **Use Large Input**: Paste large amounts of data without performance issues
- **Batch Processing**: Process multiple items efficiently
- **Real-time Preview**: See changes as you type
- **Auto-save**: Your work is automatically saved
- **Error Recovery**: Easily recover from common errors`;
  }

  private generateFeatureDescription(feature: string, toolId: string): string {
    const descriptions: Record<string, string> = {
      'Real-time Validation': 'Instantly check your input for errors and inconsistencies as you type.',
      'Syntax Highlighting': 'Color-coded display makes your code easier to read and understand.',
      'Auto-format': 'Automatically format your content with optimal spacing and indentation.',
      'Error Detection': 'Identify and highlight errors with helpful suggestions for fixes.',
      'Multiple Formats': 'Support for various input and output formats for maximum flexibility.',
      'Batch Processing': 'Handle multiple items simultaneously for improved productivity.',
      'Custom Options': 'Fine-tune the tool behavior to match your specific requirements.',
      'Export Options': 'Download results in multiple formats for easy sharing and integration.',
    };

    return descriptions[feature] || 'A powerful feature that enhances your productivity and workflow.';
  }

  private generateCategoryFeatures(category: ToolCategory, toolId: string): string {
    switch (category) {
      case 'JSON Processing':
        return `
### JSON-Specific Features
- **Schema Validation**: Validate against JSON schemas
- **Path Queries**: Extract specific data using JSONPath
- **Conversion Options**: Convert to/from XML, CSV, YAML
- **Compression**: Reduce JSON file size`;

      case 'Code Execution':
        return `
### Code-Specific Features
- **Multi-language Support**: Execute JavaScript, Python, and more
- **Debug Console**: Built-in debugging tools and output
- **Code Templates**: Pre-built code snippets and examples
- **Performance Metrics**: Track execution time and resource usage`;

      case 'File Processing':
        return `
### File-Specific Features
- **Format Detection**: Automatic file format identification
- **Preview Mode**: See changes before applying them
- **Metadata Preservation**: Keep important file information
- **Batch Operations**: Process multiple files at once`;

      default:
        return 'Category-specific features to enhance your workflow.';
    }
  }

  private generateExampleCategories(toolId: string, tool: Tool): string {
    return `
1. **Basic Examples**: Simple, straightforward examples for beginners
2. **Intermediate Examples**: More complex scenarios and configurations
3. **Advanced Examples**: Expert-level use cases and optimizations
4. **Real-world Scenarios**: Practical applications and workflows`;
  }

  private generateBasicExamples(toolId: string, tool: Tool): string {
    return `
### Example 1: Getting Started
The simplest way to use ${tool.name} with minimal configuration.

### Example 2: Common Use Case
A frequently used scenario that demonstrates core functionality.

### Example 3: Error Handling
How to handle common errors and edge cases.`;
  }

  private generateIntermediateExamples(toolId: string, tool: Tool): string {
    return `
### Example 1: Custom Configuration
Using advanced options to customize the output.

### Example 2: Data Transformation
Complex data manipulation and formatting.

### Example 3: Integration
How to integrate with other tools and workflows.`;
  }

  private generateAdvancedExamples(toolId: string, tool: Tool): string {
    return `
### Example 1: Performance Optimization
Techniques for handling large datasets efficiently.

### Example 2: Custom Functions
Creating and using custom functions and logic.

### Example 3: Automation
Automating repetitive tasks and workflows.`;
  }

  private generateRealWorldExamples(toolId: string, tool: Tool): string {
    return `
### E-commerce Data Processing
Processing product catalogs and inventory data.

### API Response Handling
Validating and formatting API responses.

### Data Migration
Converting data between different systems.`;
  }

  private generateTroubleshootingExamples(toolId: string, tool: Tool): string {
    return `
### Common Error Solutions
Step-by-step solutions for frequently encountered errors.

### Debugging Techniques
Methods to identify and resolve issues.

### Performance Issues
How to handle performance-related problems.`;
  }

  private generateBasicCodeExamples(toolId: string, tool: Tool): CodeExample[] {
    return [
      {
        id: `${toolId}-basic-1`,
        title: 'Simple Example',
        description: 'A basic example to get you started',
        language: this.getToolLanguage(toolId),
        code: this.generateSampleCode(toolId, 'basic'),
        output: this.generateSampleOutput(toolId, 'basic'),
        isInteractive: true,
        explanation: 'This example demonstrates the basic usage of the tool.',
        difficulty: 'basic',
      },
    ];
  }

  private generateAdvancedCodeExamples(toolId: string, tool: Tool): CodeExample[] {
    return [
      {
        id: `${toolId}-advanced-1`,
        title: 'Advanced Example',
        description: 'A more complex example showing advanced features',
        language: this.getToolLanguage(toolId),
        code: this.generateSampleCode(toolId, 'advanced'),
        output: this.generateSampleOutput(toolId, 'advanced'),
        isInteractive: true,
        explanation: 'This example demonstrates advanced capabilities of the tool.',
        difficulty: 'advanced',
      },
    ];
  }

  private getToolLanguage(toolId: string): string {
    if (toolId.includes('json')) return 'json';
    if (toolId.includes('code') || toolId.includes('regex')) return 'javascript';
    if (toolId.includes('hash')) return 'plaintext';
    return 'plaintext';
  }

  private generateSampleCode(toolId: string, complexity: 'basic' | 'advanced'): string {
    const samples: Record<string, Record<string, string>> = {
      'json-formatter': {
        basic: '{\n  "name": "John",\n  "age": 30\n}',
        advanced: '{\n  "users": [\n    {"name": "John", "age": 30},\n    {"name": "Jane", "age": 25}\n  ]\n}',
      },
      'code-executor': {
        basic: 'console.log("Hello, World!");',
        advanced: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }',
      },
      'regex-tester': {
        basic: '/hello/i',
        advanced: '/^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$/',
      },
    };

    return samples[toolId]?.[complexity] || '// Example code';
  }

  private generateSampleOutput(toolId: string, complexity: 'basic' | 'advanced'): string {
    const outputs: Record<string, Record<string, string>> = {
      'json-formatter': {
        basic: 'Formatted JSON with proper indentation',
        advanced: 'Complex JSON with nested structures formatted',
      },
      'code-executor': {
        basic: 'Hello, World!',
        advanced: '55', // fibonacci(10)
      },
      'regex-tester': {
        basic: 'Matches variations of "hello"',
        advanced: 'Validates URL format',
      },
    };

    return outputs[toolId]?.[complexity] || 'Output will be displayed here';
  }

  private generateExampleInput(toolId: string, complexity: 'basic' | 'advanced'): string {
    return this.generateSampleCode(toolId, complexity);
  }

  private generateExampleOutput(toolId: string, complexity: 'basic' | 'advanced'): string {
    return this.generateSampleOutput(toolId, complexity);
  }

  private calculateReadTime(toolId: string, tool: Tool): number {
    // Estimate reading time based on tool complexity
    const baseTime = 5; // 5 minutes for basic documentation
    const complexityMultiplier = tool.difficulty === 'beginner' ? 1 : tool.difficulty === 'intermediate' ? 1.5 : 2;
    const featureMultiplier = tool.features.length * 0.2;

    return Math.round(baseTime * complexityMultiplier + featureMultiplier);
  }

  private getRelatedTools(toolId: string): string[] {
    const relatedMap: Record<string, string[]> = {
      'json-formatter': ['json-validator', 'json-converter', 'json-minifier'],
      'json-validator': ['json-formatter', 'json-converter', 'json-schema-generator'],
      'code-executor': ['code-formatter', 'code-minifier', 'regex-tester'],
      'hash-generator': ['password-generator', 'uuid-generator', 'file-encryptor'],
      'file-converter': ['text-processor', 'csv-processor', 'image-compressor'],
      'base64-converter': ['url-encoder', 'text-encoder', 'file-encryptor'],
    };

    return relatedMap[toolId] || [];
  }

  // Additional content generation methods for specific sections
  private generateJSONStandardsContent(): string {
    return `# JSON Standards & Specifications

## Official Specifications
- [RFC 8259 - The JavaScript Object Notation (JSON) Data Interchange Format](https://tools.ietf.org/html/rfc8259)
- [ECMA-404 - The JSON Data Interchange Format](https://www.ecma-international.org/publications/standards/Ecma-404.htm)

## JSON Syntax Rules
- Data is in name/value pairs
- Data is separated by commas
- Curly braces hold objects
- Square brackets hold arrays

## Data Types
- String
- Number
- Object (JSON object)
- Array
- Boolean
- Null`;
  }

  private generatePerformanceTips(toolId: string, category: string): string {
    return `# Performance Tips

## General Optimization
- Use appropriate data structures
- Minimize memory usage
- Leverage browser caching
- Process data in chunks for large files

## ${category.charAt(0).toUpperCase() + category.slice(1)} Specific Tips
${this.generateCategoryPerformanceTips(category)}`;
  }

  private generateCategoryPerformanceTips(category: string): string {
    switch (category) {
      case 'json':
        return `
- Use streaming parsers for large JSON files
- Validate before processing to avoid errors
- Consider JSON compression for network transmission`;
      case 'code':
        return `
- Use efficient algorithms
- Avoid unnecessary loops
- Leverage built-in browser APIs`;
      default:
        return '- Follow general best practices for optimal performance';
    }
  }

  private generateSupportedLanguagesContent(): string {
    return `# Supported Languages

## Web Technologies
- **JavaScript (ES6+)**: Full modern JavaScript support
- **TypeScript**: TypeScript compilation and execution
- **HTML**: HTML parsing and manipulation
- **CSS**: CSS processing and validation

## Backend Languages
- **Python (3.x)**: Full standard library support
- **Node.js**: Server-side JavaScript execution
- **PHP**: PHP script execution
- **Ruby**: Ruby interpreter support

## Other Languages
- **SQL**: Database query execution
- **Bash**: Shell command execution
- **Markdown**: Markdown parsing and rendering`;
  }

  private generateSecuritySandboxContent(): string {
    return `# Security & Sandboxing

## Execution Environment
All code execution occurs in a secure WebAssembly (WASM) sandbox with the following security measures:

### Network Restrictions
- ❌ No external network requests
- ❌ No API calls to external services
- ❌ No server communication

### File System Access
- ❌ No file system reading or writing
- ❌ No access to local files
- ✅ In-memory data processing only

### Resource Limitations
- Limited CPU usage
- Memory constraints
- Execution time limits
- No direct hardware access`;
  }

  private generateDebuggingContent(): string {
    return `# Debugging Tips

## Common Issues
- **Syntax Errors**: Check for typos and missing punctuation
- **Runtime Errors**: Verify logic and data types
- **Performance Issues**: Optimize algorithms and data structures

## Debugging Techniques
- Use console.log statements for debugging
- Check browser developer tools
- Validate input data
- Test with simple cases first`;
  }

  private generateSupportedFormatsContent(): string {
    return `# Supported File Formats

## Input Formats
- **Text Files**: .txt, .md, .csv
- **Data Files**: .json, .xml, .yaml
- **Code Files**: .js, .py, .java, .cpp
- **Documents**: .pdf (limited support)

## Output Formats
- **Text**: Plain text output
- **JSON**: Structured JSON format
- **CSV**: Comma-separated values
- **Custom**: User-defined formats`;
  }

  private generateBatchProcessingContent(): string {
    return `# Batch Processing

## Features
- Process multiple files simultaneously
- Queue management for large batches
- Progress tracking and status updates
- Error handling for individual files

## Best Practices
- Group similar files together
- Monitor system resources
- Use appropriate batch sizes
- Implement error recovery`;
  }

  private generateAPIUsageContent(toolId: string): string {
    return `# API Usage

## REST API
Our tools provide REST API access for programmatic usage:

### Authentication
- API Key required for access
- OAuth 2.0 support
- Rate limiting applies

### Endpoints
- **POST** /api/tools/${toolId}/process
- **GET** /api/tools/${toolId}/status
- **DELETE** /api/tools/${toolId}/cancel

## Example Usage
\`\`\`javascript
const response = await fetch('/api/tools/${toolId}/process', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({ data: 'your data here' })
});
\`\`\``;
  }

  private generateRateLimitingContent(): string {
    return `# Rate Limiting & Best Practices

## Rate Limits
- **Free Tier**: 100 requests per hour
- **Pro Tier**: 1000 requests per hour
- **Enterprise**: Custom limits

## Best Practices
- Implement exponential backoff
- Cache responses when appropriate
- Use batch operations when possible
- Monitor your usage metrics`;
  }

  private generateEncodingSupportContent(): string {
    return `# Encoding Support

## Supported Encodings
- **UTF-8**: Universal Unicode encoding
- **ASCII**: Basic ASCII characters
- **UTF-16**: 16-bit Unicode encoding
- **ISO-8859-1**: Latin-1 character set

## Character Sets
- **Unicode**: Full Unicode support
- **Latin**: Latin character sets
- **Cyrillic**: Cyrillic character support
- **Asian**: CJK character support`;
  }

  private generateUnicodeContent(): string {
    return `# Unicode & Character Sets

## Unicode Support
- Complete Unicode character support
- Emoji and special characters
- Right-to-left text support
- Combining characters

## Character Set Detection
- Automatic encoding detection
- Manual charset specification
- Conversion between character sets
- Validation and error handling`;
  }

  private generateAlgorithmsContent(toolId: string): string {
    const algorithms: Record<string, string> = {
      'hash-generator': `# Supported Hash Algorithms

## Cryptographic Hashes
- **SHA-256**: Secure Hash Algorithm 256-bit
- **SHA-512**: Secure Hash Algorithm 512-bit
- **MD5**: Message Digest 5 (deprecated)
- **SHA-1**: Secure Hash Algorithm 1 (deprecated)

## Checksums
- **CRC32**: Cyclic Redundancy Check
- **Adler32**: Adler-32 checksum
- **Fletcher-32**: Fletcher checksum

## Usage Recommendations
- Use SHA-256 for new applications
- Avoid MD5 and SHA-1 for security-critical applications
- Consider performance vs security requirements`,

      'file-encryptor': `# Supported Encryption Algorithms

## Symmetric Encryption
- **AES-256**: Advanced Encryption Standard
- **AES-192**: 192-bit AES encryption
- **AES-128**: 128-bit AES encryption

## Key Derivation
- **PBKDF2**: Password-Based Key Derivation Function 2
- **Scrypt**: Memory-hard key derivation
- **Argon2**: Modern key derivation algorithm

## Best Practices
- Use strong passwords
- Implement proper key management
- Consider key rotation strategies`,
    };

    return algorithms[toolId] || '# Supported Algorithms\n\nStandard algorithms applicable to this tool.';
  }

  private generateSecurityBestPractices(): string {
    return `# Security Best Practices

## Data Protection
- Never process sensitive data on public computers
- Use HTTPS for data transmission
- Implement proper access controls
- Regular security audits

## Password Security
- Use strong, unique passwords
- Implement multi-factor authentication
- Regular password rotation
- Avoid password reuse

## Code Security
- Input validation and sanitization
- Output encoding
- SQL injection prevention
- Cross-site scripting (XSS) prevention`;
  }

  /**
   * Generate documentation for all tools in bulk
   */
  public generateAllDocumentation(tools: Tool[]): Record<string, ToolDocumentation> {
    const allDocumentation: Record<string, ToolDocumentation> = {};

    for (const tool of tools) {
      allDocumentation[tool.id] = this.generateDocumentation(tool.id, tool);
    }

    return allDocumentation;
  }

  /**
   * Get documentation generation statistics
   */
  public getGenerationStats(): {
    totalGenerated: number;
    categories: Record<string, number>;
    lastGenerated: Date;
  } {
    const categories: Record<string, number> = {};

    for (const [toolId, documentation] of this.generatedContent) {
      const category = documentation.toolCategory;
      categories[category] = (categories[category] || 0) + 1;
    }

    return {
      totalGenerated: this.generatedContent.size,
      categories,
      lastGenerated: new Date(),
    };
  }
}

export const documentationContentGenerator = DocumentationContentGenerator.getInstance();
