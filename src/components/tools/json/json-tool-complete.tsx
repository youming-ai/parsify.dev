/**
 * JSON Tool Complete Component
 * Integrated JSON tools component that combines all JSON functionality
 * This is the main component that users interact with for JSON processing
 */

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { JsonHeroViewer } from "./json-hero-viewer";
import { JsonAdvancedEditor } from "./json-advanced-editor";
import { JsonSchemaGenerator } from "./json-schema-generator";
import { JsonToTypeScript } from "./json-code-generators/json-to-typescript";
import {
  FileJson,
  Code,
  TreePine,
  Settings,
  Zap,
  Eye,
  Edit,
  FileText,
  Terminal,
} from "lucide-react";

interface JsonToolCompleteProps {
  initialData?: string;
  className?: string;
}

export const JsonToolComplete: React.FC<JsonToolCompleteProps> = ({
  initialData = "{}",
  className,
}) => {
  const [jsonData, setJsonData] = useState(initialData);
  const [activeTab, setActiveTab] = useState("editor");

  const handleJsonChange = (newJsonData: string) => {
    setJsonData(newJsonData);
  };

  return (
    <div className={`w-full max-w-6xl mx-auto ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <FileJson className="w-6 h-6" />
              Complete JSON Tools Suite
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              33+ Tools Available
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            Comprehensive JSON processing toolkit with formatting, validation, schema generation,
            and more
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="viewer" className="flex items-center gap-2">
                <TreePine className="w-4 h-4" />
                Tree View
              </TabsTrigger>
              <TabsTrigger value="schema" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Schema
              </TabsTrigger>
              <TabsTrigger value="typescript" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                TypeScript
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="p-6">
              <JsonAdvancedEditor
                value={jsonData}
                onChange={handleJsonChange}
                height={600}
                showToolbar={true}
                showMinimap={true}
                showLineNumbers={true}
                enableValidation={true}
                enableAutoComplete={true}
                enableFolding={true}
              />
            </TabsContent>

            <TabsContent value="viewer" className="p-6">
              <JsonHeroViewer
                data={JSON.parse(jsonData || "{}")}
                height={600}
                showSearch={true}
                showTypes={true}
                showCopyButton={true}
                expandLevel={2}
              />
            </TabsContent>

            <TabsContent value="schema" className="p-6">
              <JsonSchemaGenerator
                jsonData={jsonData}
                showValidation={true}
                showExport={true}
                showExamples={true}
              />
            </TabsContent>

            <TabsContent value="typescript" className="p-6">
              <JsonToTypeScript
                jsonData={jsonData}
                showPreview={true}
                showValidation={true}
                showUtilities={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonToolComplete;
