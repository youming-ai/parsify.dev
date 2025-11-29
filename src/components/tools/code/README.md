# Code Execution Components

A comprehensive set of React components for building code execution and development tools in web applications.

## Overview

This package provides a complete code execution environment with support for multiple programming languages, syntax highlighting, formatting, and an interactive terminal interface.

## Components

### Core Components

- **CodeEditor** - CodeMirror integration with syntax highlighting
- **LanguageSelector** - Dropdown for selecting programming languages
- **CodeExecution** - Handles code execution with progress tracking
- **CodeFormatter** - Code formatting with customizable options
- **Terminal** - Interactive terminal with input/output support
- **ExecutionStatus** - Real-time status and progress indicators

### Main Component

- **CodeToolComplete** - Complete IDE-like interface integrating all components

## Features

- Multi-language support (JavaScript, TypeScript, Python, Java, C++, Go, Rust, and more)
- Real-time code execution with progress feedback
- Syntax highlighting and code completion
- Code formatting with preset configurations
- Interactive terminal with stdin support
- File upload/download capabilities
- Template library for common code patterns
- Execution history and statistics
- Responsive design with Tailwind CSS

## Usage

### Basic Usage

```tsx
import { CodeToolComplete } from '@/components/tools/code'

function MyCodeEditor() {
  return (
    <CodeToolComplete className="h-[600px]" />
  )
}
```

### Individual Components

```tsx
import { CodeEditor, LanguageSelector, CodeExecution } from '@/components/tools/code'
import { useState } from 'react'

function MyCustomEditor() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')

  return (
    <div className="space-y-4">
      <LanguageSelector
        selectedLanguage={language}
        onLanguageChange={setLanguage}
      />
      
      <CodeEditor
        value={code}
        language={language}
        onChange={setCode}
        height={400}
      />
      
      <CodeExecution
        request={{
          language,
          code,
          input: ''
        }}
        onExecutionStart={() => console.log('Started')}
        onExecutionComplete={(result) => console.log('Result:', result)}
        onExecutionError={(error) => console.error('Error:', error)}
      />
    </div>
  )
}
```

## API Integration

The components are designed to work with a backend API for code execution. The API endpoints expected are:

- `POST /api/code/execute` - Execute code
- `POST /api/code/format` - Format code
- `POST /api/code/validate` - Validate code syntax
- `GET /api/code/languages` - Get supported languages
- `POST /api/code/upload` - Upload code files

## Configuration

### Language Configuration

Language configurations are defined in `language-configs.ts` and include:

- Language name and version
- File extensions
- Compilation and execution settings
- CodeMirror language mapping
- Default code templates

### Format Options

Code formatting can be customized with:

- Indent size and type (spaces/tabs)
- Maximum line length
- Quote style (single/double)
- Semicolons usage
- Trailing comma policy

### Execution Settings

- Timeout limits
- Memory constraints
- Compilation options
- Standard input support

## Styling

Components use Tailwind CSS for styling and include:

- Dark/light theme support
- Responsive design
- Accessible color schemes
- Smooth animations and transitions

## TypeScript Support

Full TypeScript support with comprehensive type definitions for:

- Component props
- Language configurations
- Execution results
- Terminal interfaces
- API responses

## Dependencies

### Required Dependencies

- `react` - React framework
- `@uiw/react-codemirror` - CodeMirror React wrapper
- `@codemirror/lang-*` - CodeMirror language support packages
- `@radix-ui/react-*` - UI primitives
- `lucide-react` - Icon library
- `class-variance-authority` - Utility for variant styling
- `clsx` - Utility for conditional class names
- `tailwind-merge` - Utility for merging Tailwind classes

### Peer Dependencies

- `@types/react` - React type definitions
- `@types/react-dom` - React DOM type definitions
- `tailwindcss` - CSS framework
- `typescript` - TypeScript compiler

## Browser Support

- Modern browsers with ES6+ support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- Code splitting for optimized loading
- Lazy loading of language configurations
- Efficient terminal rendering with virtualization
- Debounced API calls to prevent spamming

## Security

- Input validation and sanitization
- Secure code execution sandboxing (backend responsibility)
- XSS prevention in output rendering
- Content Security Policy compatible

## Contributing

When adding new features:

1. Follow existing code patterns and conventions
2. Add TypeScript types for new props and interfaces
3. Include accessibility features
4. Write component documentation
5. Test with different languages and edge cases

## License

This component library is part of the Parsify.dev project.