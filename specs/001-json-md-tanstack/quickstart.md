# Quick Start Guide: JSON.md Reader

## Overview
The JSON.md Reader is a web application built with TanStack ecosystem that allows users to read, parse, and display JSON content embedded within markdown files.

## Prerequisites
- Node.js 18+ installed
- Modern web browser with File API support
- Basic understanding of JSON and markdown formats

## Installation and Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd json-md-reader
npm install
```

### 2. Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### 3. Build for Production
```bash
npm run build
npm start
```

## Basic Usage

### 1. Prepare Your JSON.md File
Create a markdown file with JSON content. JSON can be included in several ways:

**Code blocks (recommended):**
```markdown
# My Data

Here's some configuration data:

```json
{
  "name": "application",
  "version": "1.0.0",
  "settings": {
    "theme": "dark",
    "autoSave": true
  }
}
```

Additional content here...
```

**Inline JSON:**
```markdown
Settings: {"theme": "dark", "autoSave": true}
```

### 2. Load the File
1. Open the application in your browser
2. Click "Select File" or drag and drop your `.md` file
3. The application will automatically parse and display the JSON content

### 3. Navigate JSON Data
- **Expand/Collapse**: Click on objects and arrays to expand or collapse them
- **Search**: Use the search box to find specific keys or values
- **Copy**: Click the copy button to copy JSON paths or values
- **View Raw**: Toggle between formatted view and raw JSON

## Features

### JSON Viewer
- **Tree View**: Hierarchical display of nested JSON structures
- **Syntax Highlighting**: Color-coded keys, strings, numbers, and booleans
- **Collapsible Nodes**: Expand/collapse objects and arrays for better navigation
- **Path Display**: Shows JSON path for each node (e.g., `config.settings.theme`)

### File Processing
- **Multiple Formats**: Supports both `.md` and `.txt` files
- **Mixed Content**: Handles files with both JSON and markdown content
- **Error Handling**: Clear error messages for invalid JSON
- **Performance**: Optimized for files up to 1MB

### Search and Navigation
- **Key Search**: Find specific JSON keys
- **Value Search**: Search across all JSON values
- **Path Navigation**: Jump to specific JSON paths
- **Highlight**: Search results are highlighted in the tree view

## File Format Support

### Supported JSON Formats
```json
// Objects
{
  "key": "value",
  "nested": {
    "array": [1, 2, 3]
  }
}

// Arrays
[
  {"name": "item1"},
  {"name": "item2"}
]

// Primitives
"string"
123
true
null
```

### Markdown Integration
- **Code blocks**: JSON inside ```json blocks
- **Inline JSON**: JSON embedded in regular text
- **Multiple JSON**: Files can contain multiple JSON sections
- **Mixed content**: Regular markdown content is preserved

## Error Handling

### Common Errors and Solutions

**Invalid JSON Syntax**
```
Error: Invalid JSON syntax at line 5, column 12
```
- Check for missing commas, quotes, or brackets
- Use a JSON validator to fix syntax errors
- The application shows the exact location of syntax errors

**File Too Large**
```
Error: File size exceeds 1MB limit
```
- Split large JSON into smaller files
- Remove unnecessary content from markdown
- Consider using a JSON-specific tool for very large files

**No JSON Found**
```
Warning: No JSON content found in file
```
- Ensure JSON is properly formatted in code blocks
- Check that file contains valid JSON syntax
- Verify file extension is .md or .txt

## Performance Tips

### For Large Files
- Use collapsible sections to reduce rendering load
- Search before expanding large objects
- Consider splitting very large JSON files

### For Better UX
- Use descriptive keys in your JSON
- Organize JSON structure logically
- Keep JSON depth reasonable (<10 levels)

## Troubleshooting

### Browser Compatibility
- **Required**: File API support (all modern browsers)
- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+
- **Not Supported**: Internet Explorer

### Common Issues
1. **File not loading**: Check file size and format
2. **JSON not displaying**: Verify JSON syntax validation
3. **Performance issues**: Try with smaller files first
4. **Display problems**: Refresh the page and try again

## Advanced Features

### Keyboard Shortcuts
- `Ctrl+F` / `Cmd+F`: Open search
- `Ctrl+C` / `Cmd+C`: Copy selected node
- `Escape`: Clear search
- `Space`: Toggle expand/collapse

### URL Parameters
- `?file=example.md`: Auto-load specific file
- `?theme=dark`: Force dark theme
- `?expand=all`: Expand all nodes by default

## Development

### Project Structure
```
src/
├── components/     # React components
├── lib/           # Utility functions
├── hooks/         # Custom React hooks
├── pages/         # Page components
└── styles/        # CSS styles
```

### Key Technologies
- **TanStack Start**: SSR framework
- **TanStack Router**: Routing solution
- **TanStack Query**: Data fetching and caching
- **React**: UI framework
- **TypeScript**: Type safety

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Support

For issues and questions:
1. Check this guide first
2. Review the error messages carefully
3. Test with smaller JSON files
4. Report issues with file examples if possible