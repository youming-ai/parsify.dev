/**
 * JSON Tool Complete Component
 * Integrated JSON tools component that combines all JSON functionality
 * This is the main component that users interact with for JSON processing
 */

'use client';

import { Code, Edit, Eye, FileJson } from 'lucide-react';
import dynamic from 'next/dynamic';
import type React from 'react';
import { useState } from 'react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { JsonHeroViewer } from './json-hero-viewer';

const JsonSimpleEditor = dynamic(
  () => import('./json-simple-editor').then((mod) => mod.JsonSimpleEditor),
  {
    ssr: false,
    loading: () => (
      <div className="gap 2 flex flex-col items-center justify-center py-10 text-muted-foreground">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        <span>Loading editor...</span>
      </div>
    ),
  }
);

interface JsonToolCompleteProps {
  initialData?: string;
  className?: string;
  showHeader?: boolean;
}

export const JsonToolComplete: React.FC<JsonToolCompleteProps> = ({
  initialData = '{}',
  className,
  showHeader = true,
}) => {
  const [jsonData, setJsonData] = useState(initialData);
  const [activeTab, setActiveTab] = useState('editor');
  const [isValidJson, setIsValidJson] = useState(true);

  const handleJsonChange = (newJsonData: string) => {
    try {
      setJsonData(newJsonData);
      // Check if JSON is valid
      try {
        JSON.parse(newJsonData || '{}');
        setIsValidJson(true);
      } catch {
        setIsValidJson(false);
      }
    } catch (error) {
      console.warn('Error in handleJsonChange:', error);
    }
  };

  return (
    <div className={`mx-auto w-full ${className}`}>
      <Card className={showHeader ? '' : 'border-0 shadow-none'}>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-bold text-2xl">
                <FileJson className="h-6 w-6" />
                Complete JSON Tools Suite
              </CardTitle>
              <Badge variant="secondary" className="text-sm">
                33+ Tools Available
              </Badge>
            </div>

            <div className="text-muted-foreground text-sm">
              Comprehensive JSON processing toolkit with formatting, validation, schema generation,
              and more
            </div>
          </CardHeader>
        )}

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="viewer" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Tree View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="p-6">
              <JsonSimpleEditor
                value={jsonData}
                onChange={handleJsonChange}
                height={600}
                showToolbar={true}
              />
            </TabsContent>

            <TabsContent value="viewer" className="p-6">
              {isValidJson ? (
                <JsonHeroViewer
                  data={JSON.parse(jsonData || '{}')}
                  showSearch={true}
                  showTypes={true}
                  showCopyButton={true}
                  expandLevel={2}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="mb-4 text-4xl">⚠️</div>
                  <h3 className="mb-2 text-lg font-semibold">Invalid JSON</h3>
                  <p className="text-muted-foreground mb-4">
                    Cannot display tree view. Please fix the JSON errors first.
                  </p>
                  <Button
                    onClick={() => setActiveTab('editor')}
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Go to Editor
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default JsonToolComplete;
