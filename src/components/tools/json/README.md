# JSON 工具组件

完整的 JSON 处理工具集，提供格式化、验证、转换和查询功能。

## 📦 组件列表

### 核心组件

#### `JsonToolComplete`
完整的 JSON 工具组合组件，集成所有功能。

```tsx
import { JsonToolComplete } from '@/components/tools/json';

<JsonToolComplete />
```

#### `JsonFormatter`
JSON 格式化工具，支持美化和压缩。

```tsx
import { JsonFormatter } from '@/components/tools/json';

<JsonFormatter
  defaultValue='{"name":"test"}'
  onFormat={(formatted) => console.log(formatted)}
/>
```

#### `JsonValidator`
JSON 语法验证工具，提供详细错误信息。

```tsx
import { JsonValidator } from '@/components/tools/json';

<JsonValidator
  defaultValue='{"key": "value"}'
  onValidate={(isValid, errors) => {
    if (!isValid) console.error(errors);
  }}
/>
```

#### `JsonConverter`
JSON 格式转换工具，支持多种输出格式。

```tsx
import { JsonConverter } from '@/components/tools/json';

<JsonConverter
  defaultFormat="yaml"
  onConvert={(converted, format) => {
    console.log(`Converted to ${format}:`, converted);
  }}
/>
```

#### `JsonViewer`
可交互的 JSON 树形视图。

```tsx
import { JsonViewer } from '@/components/tools/json';

<JsonViewer
  data={{ name: 'test', nested: { key: 'value' } }}
  expandLevel={2}
/>
```

### 辅助组件

#### `JsonInputEditor`
JSON 输入编辑器。

```tsx
import { JsonInputEditor } from '@/components/tools/json';

<JsonInputEditor
  value={jsonString}
  onChange={setJsonString}
  placeholder="Enter JSON here..."
/>
```

#### `JsonErrorDisplay`
JSON 错误信息显示组件。

```tsx
import { JsonErrorDisplay } from '@/components/tools/json';

<JsonErrorDisplay
  errors={[
    { line: 1, column: 5, message: 'Unexpected token' }
  ]}
/>
```

## 🛠️ 工具函数

### JSON 解析与验证

```typescript
import {
  parseJSON,
  isValidJSON,
  formatJSON,
  minifyJSON,
  validateJSONSchema,
} from '@/components/tools/json/json-utils';

// 解析 JSON
const data = parseJSON('{"key": "value"}');
// => { key: "value" }

// 验证 JSON 字符串
const isValid = isValidJSON('{"key": "value"}');
// => true

// 格式化 JSON
const formatted = formatJSON('{"key":"value"}', 2);
// => {
//      "key": "value"
//    }

// 压缩 JSON
const minified = minifyJSON(`{
  "key": "value"
}`);
// => {"key":"value"}

// Schema 验证
const errors = validateJSONSchema(data, schema);
```

### JSON 转换

```typescript
import {
  jsonToYaml,
  jsonToXml,
  jsonToCSV,
  jsonToToml,
} from '@/components/tools/json/json-utils';

const data = { name: 'test', value: 123 };

// 转换为 YAML
const yaml = jsonToYaml(data);
// => name: test
//    value: 123

// 转换为 XML
const xml = jsonToXml(data);
// => <root><name>test</name><value>123</value></root>

// 转换为 CSV
const csv = jsonToCSV([data]);
// => name,value
//    test,123

// 转换为 TOML
const toml = jsonToToml(data);
// => name = "test"
//    value = 123
```

### JSON 路径查询

```typescript
import { queryJSONPath } from '@/components/tools/json/json-utils';

const data = {
  users: [
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ]
};

// JSONPath 查询
const result = queryJSONPath(data, '$.users[?(@.age > 25)].name');
// => ["Alice"]
```

## 📝 类型定义

```typescript
interface JsonFormatterProps {
  defaultValue?: string;
  onFormat?: (formatted: string) => void;
  indentSize?: number;
}

interface JsonValidatorProps {
  defaultValue?: string;
  onValidate?: (isValid: boolean, errors?: ValidationError[]) => void;
}

interface JsonConverterProps {
  defaultFormat?: 'yaml' | 'xml' | 'csv' | 'toml';
  onConvert?: (converted: string, format: string) => void;
}

interface JsonViewerProps {
  data: any;
  expandLevel?: number;
  theme?: 'light' | 'dark';
}

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}
```

## 🎨 使用示例

### 完整的 JSON 处理流程

```tsx
'use client';

import { useState } from 'react';
import {
  JsonFormatter,
  JsonValidator,
  JsonConverter,
  JsonViewer,
  parseJSON,
  formatJSON,
} from '@/components/tools/json';

export default function JsonProcessingPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isValid, setIsValid] = useState(false);

  const handleFormat = () => {
    const formatted = formatJSON(jsonInput, 2);
    setJsonInput(formatted);
  };

  const handleValidate = (valid: boolean, errors?: any[]) => {
    setIsValid(valid);
    if (valid) {
      setParsedData(parseJSON(jsonInput));
    }
  };

  return (
    <div className="space-y-4">
      <JsonFormatter
        defaultValue={jsonInput}
        onFormat={handleFormat}
      />
      
      <JsonValidator
        defaultValue={jsonInput}
        onValidate={handleValidate}
      />
      
      {isValid && parsedData && (
        <>
          <JsonViewer data={parsedData} expandLevel={2} />
          
          <JsonConverter
            defaultFormat="yaml"
            onConvert={(converted, format) => {
              console.log(`Converted to ${format}`);
            }}
          />
        </>
      )}
    </div>
  );
}
```

### 自定义 JSON 编辑器

```tsx
import { JsonInputEditor, JsonErrorDisplay } from '@/components/tools/json';
import { isValidJSON } from '@/components/tools/json/json-utils';
import { useState } from 'react';

export function CustomJsonEditor() {
  const [value, setValue] = useState('');
  const [errors, setErrors] = useState([]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    
    if (!isValidJSON(newValue)) {
      setErrors([
        { line: 1, column: 1, message: 'Invalid JSON syntax' }
      ]);
    } else {
      setErrors([]);
    }
  };

  return (
    <>
      <JsonInputEditor
        value={value}
        onChange={handleChange}
      />
      {errors.length > 0 && (
        <JsonErrorDisplay errors={errors} />
      )}
    </>
  );
}
```

## 🚀 高级功能

### JSON Schema 验证

```typescript
import { validateJSONSchema } from '@/components/tools/json/json-utils';

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number', minimum: 0 }
  },
  required: ['name']
};

const data = { name: 'Alice', age: 30 };
const errors = validateJSONSchema(data, schema);

if (errors.length === 0) {
  console.log('Valid!');
} else {
  console.error('Validation errors:', errors);
}
```

### 批量 JSON 处理

```typescript
import { formatJSON, minifyJSON } from '@/components/tools/json/json-utils';

const jsonFiles = [
  '{"name":"file1"}',
  '{"name":"file2"}',
  '{"name":"file3"}'
];

// 批量格式化
const formatted = jsonFiles.map(json => formatJSON(json, 2));

// 批量压缩
const minified = jsonFiles.map(json => minifyJSON(json));
```

## 🎯 最佳实践

1. **性能优化**
   - 大型 JSON 文件使用流式处理
   - JsonViewer 限制默认展开层级
   - 使用 Web Worker 处理复杂转换

2. **错误处理**
   - 始终验证用户输入的 JSON
   - 提供清晰的错误提示
   - 处理边界情况（空值、特殊字符等）

3. **用户体验**
   - 提供实时验证反馈
   - 支持撤销/重做功能
   - 添加快捷键支持

## 📚 相关文档

- [JSON Specification](https://www.json.org/)
- [JSONPath Documentation](https://goessner.net/articles/JsonPath/)
- [JSON Schema](https://json-schema.org/)

## 🐛 常见问题

### Q: 如何处理大型 JSON 文件？

A: 使用虚拟化渲染或分页加载：

```tsx
<JsonViewer
  data={largeData}
  expandLevel={1}
  virtualized={true}
  pageSize={100}
/>
```

### Q: 如何自定义格式化样式？

A: 传入自定义配置：

```typescript
const formatted = formatJSON(json, {
  indent: 4,
  quotes: 'single',
  trailingComma: true
});
```

### Q: 支持哪些转换格式？

A: 目前支持：
- YAML
- XML
- CSV
- TOML
- URL Query String
- Form Data
