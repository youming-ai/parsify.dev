import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import { ToolWrapper } from "../tool-wrapper";
import { JsonConverter } from "./json-converter";
import { JsonFormatter } from "./json-formatter";
import { JsonInputEditor } from "./json-input-editor";
import type { JsonConversionOptions, JsonFormatOptions, JsonValidationResult } from "./json-types";
import { JsonValidator } from "./json-validator";
import { JsonViewer } from "./json-viewer";

interface JsonToolCompleteProps {
  className?: string;
}

export function JsonToolComplete({ className }: JsonToolCompleteProps) {
  const [jsonInput, setJsonInput] = React.useState("");
  const [validationResult, setValidationResult] = React.useState<JsonValidationResult>({
    isValid: false,
    errors: [],
  });
  const [_formattedOutput, setFormattedOutput] = React.useState("");
  const [_convertedOutput, setConvertedOutput] = React.useState("");
  const [formatError, setFormatError] = React.useState("");
  const [convertError, setConvertError] = React.useState("");
  const [parsedData, setParsedData] = React.useState<unknown>(null);

  // Format options
  const [formatOptions, _setFormatOptions] = React.useState<JsonFormatOptions>({
    indent: 2,
    sortKeys: false,
    compact: false,
    trailingComma: false,
  });

  // Conversion options
  const [conversionOptions, _setConversionOptions] = React.useState<JsonConversionOptions>({
    targetFormat: "xml",
    rootElement: "root",
    arrayItemName: "item",
    flatten: false,
    csvDelimiter: ",",
  });

  // Parse JSON when it's valid
  React.useEffect(() => {
    if (validationResult.isValid && jsonInput.trim()) {
      try {
        const parsed = JSON.parse(jsonInput);
        setParsedData(parsed);
      } catch (_error) {
        setParsedData(null);
      }
    } else {
      setParsedData(null);
    }
  }, [jsonInput, validationResult]);

  const handleValidationChange = (result: JsonValidationResult) => {
    setValidationResult(result);
    // Clear outputs when validation fails
    if (!result.isValid) {
      setFormattedOutput("");
      setConvertedOutput("");
      setParsedData(null);
    }
  };

  const handleFormat = (formatted: string) => {
    setFormattedOutput(formatted);
    setFormatError("");
  };

  const handleFormatError = (error: string) => {
    setFormatError(error);
    setFormattedOutput("");
  };

  const handleConvert = (converted: string) => {
    setConvertedOutput(converted);
    setConvertError("");
  };

  const handleConvertError = (error: string) => {
    setConvertError(error);
    setConvertedOutput("");
  };

  const sampleJson = `{
  "user": {
    "id": 12345,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "active": true,
    "roles": ["admin", "user"],
    "profile": {
      "age": 30,
      "location": {
        "city": "New York",
        "country": "USA"
      }
    }
  },
  "lastLogin": "2024-01-15T10:30:00Z",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}`;

  return (
    <ToolWrapper
      title="JSON Tools"
      description="Comprehensive JSON toolkit for formatting, validation, conversion, and visualization"
      category="Data Processing"
      status={validationResult.isValid ? "success" : jsonInput.trim() ? "error" : "idle"}
      error={formatError || convertError}
      features={[
        "JSON Validation",
        "JSON Formatting",
        "JSON to XML/YAML/CSV Conversion",
        "Interactive JSON Tree Viewer",
        "Real-time Syntax Highlighting",
        "Copy & Download Functionality",
      ]}
      className={className}
    >
      <Tabs defaultValue="editor" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="viewer">Viewer</TabsTrigger>
          <TabsTrigger value="validator">Validator</TabsTrigger>
          <TabsTrigger value="formatter">Formatter</TabsTrigger>
          <TabsTrigger value="converter">Converter</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-lg">JSON Editor</h3>
              <button
                onClick={() => setJsonInput(sampleJson)}
                className="text-blue-600 text-sm hover:text-blue-800"
              >
                Load Sample
              </button>
            </div>
            <JsonInputEditor
              value={jsonInput}
              onChange={setJsonInput}
              onValidate={handleValidationChange}
              height={500}
            />
          </div>
        </TabsContent>

        <TabsContent value="viewer" className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">JSON Tree Viewer</h3>
            {parsedData ? (
              <JsonViewer
                data={parsedData}
                expandLevel={3}
                showLineNumbers={true}
                copyable={true}
              />
            ) : (
              <div className="rounded-lg border-2 border-gray-300 border-dashed py-12 text-center text-gray-500">
                <div className="space-y-2">
                  <p>No valid JSON data to display</p>
                  <p className="text-sm">Enter valid JSON in the Editor tab to see the tree view</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="validator" className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">JSON Validator</h3>
            <JsonValidator
              input={jsonInput}
              onValidationChange={handleValidationChange}
              showLineNumbers={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="formatter" className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">JSON Formatter</h3>
            <JsonFormatter
              input={jsonInput}
              options={formatOptions}
              onFormat={handleFormat}
              onError={handleFormatError}
            />
          </div>
        </TabsContent>

        <TabsContent value="converter" className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">JSON Converter</h3>
            <JsonConverter
              input={jsonInput}
              options={conversionOptions}
              onConvert={handleConvert}
              onError={handleConvertError}
            />
          </div>
        </TabsContent>
      </Tabs>
    </ToolWrapper>
  );
}
