/**
 * JSON Hero Visualizer Component
 * Visualize JSON data in interactive graphs and tree structures
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  BubbleChart,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  Upload,
  TreePine,
  PieChart,
  BarChart3,
  Zap,
  Search,
  Settings,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';
import { validateInput } from '@/lib/validation';

interface TreeNode {
  key: string;
  value: any;
  type: string;
  children?: TreeNode[];
  depth: number;
  path: string;
  size?: number;
}

interface VisualizationData {
  nodes: TreeNode[];
  stats: {
    totalNodes: number;
    maxDepth: number;
    types: { [key: string]: number };
    size: number;
  };
}

export function JSONHeroVisualizer({ className }: { className?: string }) {
  const [jsonInput, setJsonInput] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [isValid, setIsValid] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [visualizationType, setVisualizationType] = useState<'tree' | 'bubble' | 'sunburst' | 'treemap'>('tree');
  const [maxDepth, setMaxDepth] = useState([10]);
  const [nodeSize, setNodeSize] = useState([5]);
  const [showTypes, setShowTypes] = useState(true);
  const [colorScheme, setColorScheme] = useState<'type' | 'depth' | 'value'>('type');
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize session
  useEffect(() => {
    const session = createSession('json-hero-visualizer', {
      initialInput: '',
      options: { visualizationType, maxDepth: maxDepth[0], showTypes, colorScheme }
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Validate and parse JSON
  const validateAndParseJSON = useCallback((text: string) => {
    if (!text.trim()) {
      setIsValid(true);
      setValidationError('');
      setParsedData(null);
      return true;
    }

    const validation = validateInput('json-formatter', text);
    if (validation.isValid) {
      try {
        const parsed = JSON.parse(text);
        setParsedData(parsed);
        setIsValid(true);
        setValidationError('');
        return true;
      } catch (error) {
        setIsValid(false);
        setValidationError(error instanceof Error ? error.message : 'Invalid JSON');
        setParsedData(null);
        return false;
      }
    } else {
      setIsValid(false);
      setValidationError(validation.errors[0]?.message || 'Invalid JSON');
      setParsedData(null);
      return false;
    }
  }, []);

  // Handle input change
  const handleInputChange = useCallback((value: string) => {
    setJsonInput(value);
    validateAndParseJSON(value);

    if (sessionId) {
      updateSession(sessionId, {
        inputs: { text: value, options: { visualizationType, maxDepth: maxDepth[0] } },
        lastActivity: new Date()
      });
    }
  }, [validateAndParseJSON, sessionId, visualizationType, maxDepth]);

  // Build tree structure from JSON data
  const buildTreeStructure = useCallback((data: any, key: string = 'root', depth: number = 0, path: string = ''): TreeNode => {
    const type = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;
    const currentPath = path ? `${path}.${key}` : key;

    const node: TreeNode = {
      key,
      value: data,
      type,
      depth,
      path: currentPath,
      size: typeof data === 'string' ? data.length : JSON.stringify(data).length
    };

    if (depth < maxDepth[0] && (Array.isArray(data) || (typeof data === 'object' && data !== null))) {
      const children: TreeNode[] = [];

      if (Array.isArray(data)) {
        data.forEach((item, index) => {
          children.push(buildTreeStructure(item, `[${index}]`, depth + 1, currentPath));
        });
      } else {
        Object.entries(data).forEach(([childKey, childValue]) => {
          children.push(buildTreeStructure(childValue, childKey, depth + 1, currentPath));
        });
      }

      node.children = children;
    }

    return node;
  }, [maxDepth]);

  // Calculate statistics
  const calculateStats = useCallback((node: TreeNode): any => {
    let totalNodes = 1;
    let maxDepth = node.depth;
    const types: { [key: string]: number } = { [node.type]: 1 };

    if (node.children) {
      for (const child of node.children) {
        const childStats = calculateStats(child);
        totalNodes += childStats.totalNodes;
        maxDepth = Math.max(maxDepth, childStats.maxDepth);

        Object.entries(childStats.types).forEach(([type, count]) => {
          types[type] = (types[type] || 0) + count;
        });
      }
    }

    return { totalNodes, maxDepth, types };
  }, []);

  // Process data for visualization
  const visualizationData = useMemo((): VisualizationData | null => {
    if (!parsedData) return null;

    const tree = buildTreeStructure(parsedData);
    const stats = calculateStats(tree);

    return {
      nodes: [tree],
      stats: {
        ...stats,
        size: JSON.stringify(parsedData).length
      }
    };
  }, [parsedData, buildTreeStructure, calculateStats]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!visualizationData || !searchTerm) return visualizationData.nodes;

    const filterNode = (node: TreeNode): TreeNode | null => {
      const matchesSearch = node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (typeof node.value === 'string' && node.value.toLowerCase().includes(searchTerm.toLowerCase()));

      if (matchesSearch) return node;

      if (node.children) {
        const filteredChildren = node.children
          .map(child => filterNode(child))
          .filter(Boolean) as TreeNode[];

        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
      }

      return null;
    };

    return visualizationData.nodes.map(node => filterNode(node)).filter(Boolean) as TreeNode[];
  }, [visualizationData, searchTerm]);

  // Get color for node based on scheme
  const getNodeColor = useCallback((node: TreeNode): string => {
    const colors = {
      type: {
        string: '#10b981',    // green
        number: '#3b82f6',    // blue
        boolean: '#f59e0b',   // amber
        object: '#8b5cf6',    // purple
        array: '#ec4899',     // pink
        null: '#6b7280'       // gray
      },
      depth: {
        0: '#dc2626',  // red
        1: '#ea580c',  // orange
        2: '#f59e0b',  // amber
        3: '#84cc16',  // lime
        4: '#10b981',  // green
        5: '#06b6d4',  // cyan
        6: '#3b82f6',  // blue
        7: '#6366f1',  // indigo
        8: '#8b5cf6',  // purple
        9: '#a855f7',  // fuchsia
        10: '#ec4899'  // pink
      },
      value: '#6b7280'  // gray for value-based
    };

    if (colorScheme === 'type') {
      return colors.type[node.type as keyof typeof colors.type] || '#6b7280';
    } else if (colorScheme === 'depth') {
      return colors.depth[node.depth as keyof typeof colors.depth] || '#6b7280';
    } else {
      return colors.value;
    }
  }, [colorScheme]);

  // Render tree visualization
  const renderTreeVisualization = useCallback((nodes: TreeNode[], level: number = 0) => {
    return (
      <div className=\"space-y-1\" style={{ marginLeft: `${level * 20}px` }}>
        {nodes.map((node, index) => (
          <div key={`${node.path}-${index}`} className=\"flex items-start space-x-2\">
            <div
              className=\"w-3 h-3 rounded-full flex-shrink-0 mt-1\"
              style={{ backgroundColor: getNodeColor(node) }}
            />
            <div className=\"flex-1 min-w-0\">
              <div className=\"flex items-center space-x-2\">
                <span className=\"font-mono text-sm font-medium truncate\">{node.key}</span>
                {showTypes && (
                  <Badge variant=\"outline\" className=\"text-xs\">
                    {node.type}
                  </Badge>
                )}
              </div>
              {node.type !== 'object' && node.type !== 'array' && (
                <div className=\"text-xs text-muted-foreground truncate\">
                  {typeof node.value === 'string' ? `\"${node.value}\"` : String(node.value)}
                </div>
              )}
              {node.children && (
                <div className=\"mt-1\">
                  {renderTreeVisualization(node.children.slice(0, 10), level + 1)}
                  {node.children.length > 10 && (
                    <div className=\"text-xs text-muted-foreground ml-6\">
                      ... and {node.children.length - 10} more items
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }, [getNodeColor, showTypes]);

  // Render bubble visualization
  const renderBubbleVisualization = useCallback(() => {
    if (!filteredNodes.length) return null;

    const calculateBubbles = (nodes: TreeNode[], parentSize: number = 100, parentX: number = 50, parentY: number = 50): any[] => {
      const bubbles: any[] = [];

      nodes.forEach((node, index) => {
        const size = nodeSize[0] * (1 + node.depth * 0.8);
        const angle = (index / nodes.length) * 2 * Math.PI;
        const distance = parentSize / 4;

        const x = parentX + Math.cos(angle) * distance;
        const y = parentY + Math.sin(angle) * distance;

        bubbles.push({
          id: node.path,
          x,
          y,
          r: Math.max(size, 5),
          color: getNodeColor(node),
          label: node.key,
          type: node.type,
          value: node.type === 'object' || node.type === 'array'
            ? `${node.children?.length || 0} items`
            : String(node.value)
        });

        if (node.children) {
          bubbles.push(...calculateBubbles(node.children.slice(0, 5), size, x, y));
        }
      });

      return bubbles;
    };

    const bubbles = calculateBubbles(filteredNodes);

    return (
      <div className=\"relative w-full h-96 bg-muted/20 rounded-lg overflow-hidden\">
        <svg className=\"w-full h-full\" viewBox=\"0 0 100 100\">
          {bubbles.map((bubble) => (
            <g key={bubble.id}>
              <circle
                cx={bubble.x}
                cy={bubble.y}
                r={bubble.r}
                fill={bubble.color}
                fillOpacity={0.7}
                stroke={bubble.color}
                strokeWidth=\"0.2\"
              />
              <text
                x={bubble.x}
                y={bubble.y}
                textAnchor=\"middle\"
                dominantBaseline=\"middle\"
                fontSize={Math.max(bubble.r / 3, 0.5)}
                fill=\"white\"
                pointerEvents=\"none\"
              >
                {bubble.label.length > 8 ? bubble.label.substring(0, 8) + '...' : bubble.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }, [filteredNodes, nodeSize, getNodeColor]);

  // Copy to clipboard
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(jsonInput).then(() => {
      toast.success('JSON copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  }, [jsonInput]);

  // Download visualization as image
  const downloadVisualization = useCallback(() => {
    // This is a simplified implementation
    // In a real app, you'd use a library like html2canvas or dom-to-image
    toast.success('Visualization download feature coming soon!');
  }, []);

  // Upload JSON file
  const uploadJSON = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      validateAndParseJSON(content);
      toast.success('File uploaded successfully');

      if (sessionId) {
        updateSession(sessionId, {
          inputs: { text: content, fileName: file.name },
          lastActivity: new Date()
        });
        addToHistory(sessionId, 'upload', true);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
      if (sessionId) addToHistory(sessionId, 'upload', false);
    };
    reader.readAsText(file);
  }, [validateAndParseJSON, sessionId]);

  // Load sample JSON
  const loadSample = useCallback(() => {
    const sample = {
      "user": {
        "id": 12345,
        "name": "John Doe",
        "email": "john@example.com",
        "active": true,
        "roles": ["user", "admin"],
        "preferences": {
          "theme": "dark",
          "notifications": true,
          "language": "en"
        },
        "stats": {
          "loginCount": 42,
          "lastLogin": "2024-01-15T10:30:00Z",
          "sessionDuration": 3600
        }
      },
      "permissions": {
        "read": true,
        "write": true,
        "delete": false
      },
      "metadata": {
        "version": "1.0.0",
        "created": "2024-01-01T00:00:00Z",
        "updated": "2024-01-15T10:30:00Z"
      }
    };

    const jsonString = JSON.stringify(sample, null, 2);
    setJsonInput(jsonString);
    validateAndParseJSON(jsonString);
    toast.success('Sample JSON loaded');
  }, [validateAndParseJSON]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className=\"flex items-center justify-between\">
        <div className=\"flex items-center space-x-2\">
          <BubbleChart className=\"h-6 w-6\" />
          <h1 className=\"text-2xl font-bold\">JSON Hero Visualizer</h1>
        </div>

        <div className=\"flex items-center space-x-2\">
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={loadSample}
          >
            Load Sample
          </Button>
          <Button
            variant=\"outline\"
            size=\"sm\"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className=\"h-4 w-4 mr-2\" />
            Upload
          </Button>
          <input
            id=\"file-upload\"
            type=\"file\"
            accept=\".json\"
            onChange={uploadJSON}
            className=\"hidden\"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* JSON Input */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <TreePine className=\"h-5 w-5 mr-2\" />
                JSON Input
              </div>
              <div className=\"flex items-center space-x-2\">
                {isValid ? (
                  <CheckCircle2 className=\"h-5 w-5 text-green-500\" />
                ) : (
                  <XCircle className=\"h-5 w-5 text-red-500\" />
                )}
                <Button
                  variant=\"ghost\"
                  size=\"sm\"
                  onClick={copyToClipboard}
                >
                  <Copy className=\"h-4 w-4\" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={jsonInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder=\"Paste your JSON here...\"
              className=\"min-h-[400px] font-mono text-sm\"
            />
            {validationError && (
              <div className=\"mt-2 text-sm text-red-600 dark:text-red-400\">
                {validationError}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className=\"flex items-center justify-between\">
              <div className=\"flex items-center\">
                <PieChart className=\"h-5 w-5 mr-2\" />
                Visualization
              </div>
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={downloadVisualization}
              >
                <Download className=\"h-4 w-4 mr-2\" />
                Download
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-4\">
              {/* Visualization Type Selector */}
              <div className=\"flex items-center space-x-4\">
                <span className=\"text-sm font-medium\">Type:</span>
                <div className=\"flex space-x-2\">
                  {[
                    { value: 'tree', icon: TreePine, label: 'Tree' },
                    { value: 'bubble', icon: BubbleChart, label: 'Bubble' },
                    { value: 'sunburst', icon: Zap, label: 'Sunburst' },
                    { value: 'treemap', icon: BarChart3, label: 'Treemap' }
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={visualizationType === value ? \"default\" : \"outline\"}
                      size=\"sm\"
                      onClick={() => setVisualizationType(value as any)}
                      className=\"flex items-center space-x-1\"
                    >
                      <Icon className=\"h-3 w-3\" />
                      <span>{label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Visualization Display */}
              <div className=\"min-h-[350px] border rounded-lg bg-muted/20 flex items-center justify-center\">
                {visualizationData ? (
                  visualizationType === 'tree' ? (
                    <div className=\"w-full p-4 max-h-80 overflow-auto\">
                      {renderTreeVisualization(filteredNodes)}
                    </div>
                  ) : visualizationType === 'bubble' ? (
                    renderBubbleVisualization()
                  ) : (
                    <div className=\"text-center text-muted-foreground\">
                      <Settings className=\"h-12 w-12 mx-auto mb-2\" />
                      <p>Advanced visualizations coming soon!</p>
                    </div>
                  )
                ) : (
                  <div className=\"text-center text-muted-foreground\">
                    <BubbleChart className=\"h-12 w-12 mx-auto mb-2\" />
                    <p>Visualization will appear here...</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Visualization Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue=\"basic\" className=\"w-full\">
            <TabsList className=\"grid w-full grid-cols-3\">
              <TabsTrigger value=\"basic\">Basic</TabsTrigger>
              <TabsTrigger value=\"advanced\">Advanced</TabsTrigger>
              <TabsTrigger value=\"search\">Search</TabsTrigger>
            </TabsList>

            <TabsContent value=\"basic\" className=\"space-y-4 mt-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
                <div className=\"space-y-2\">
                  <Label>Max Depth: {maxDepth[0]}</Label>
                  <Slider
                    value={maxDepth}
                    onValueChange={setMaxDepth}
                    max={20}
                    min={1}
                    step={1}
                    className=\"w-full\"
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label>Node Size: {nodeSize[0]}</Label>
                  <Slider
                    value={nodeSize}
                    onValueChange={setNodeSize}
                    max={20}
                    min={1}
                    step={1}
                    className=\"w-full\"
                  />
                </div>

                <div className=\"space-y-2\">
                  <Label>Color Scheme</Label>
                  <Select value={colorScheme} onValueChange={(value: any) => setColorScheme(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=\"type\">By Type</SelectItem>
                      <SelectItem value=\"depth\">By Depth</SelectItem>
                      <SelectItem value=\"value\">By Value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className=\"flex items-center space-x-2\">
                <Switch
                  id=\"show-types\"
                  checked={showTypes}
                  onCheckedChange={setShowTypes}
                />
                <Label htmlFor=\"show-types\">Show type badges</Label>
              </div>
            </TabsContent>

            <TabsContent value=\"advanced\" className=\"space-y-4 mt-4\">
              <div className=\"text-sm text-muted-foreground\">
                Advanced visualization options coming soon, including:
                <ul className=\"list-disc list-inside mt-2 space-y-1\">
                  <li>Sunburst chart visualization</li>
                  <li>Treemap visualization</li>
                  <li>Interactive node editing</li>
                  <li>Export to multiple formats</li>
                  <li>Real-time collaboration</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value=\"search\" className=\"space-y-4 mt-4\">
              <div className=\"flex items-center space-x-2\">
                <Search className=\"h-4 w-4\" />
                <input
                  type=\"text\"
                  placeholder=\"Search keys and values...\"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className=\"flex-1 px-3 py-2 border rounded-md text-sm\"
                />
              </div>
              {searchTerm && (
                <div className=\"text-sm text-muted-foreground\">
                  Found {filteredNodes.length} matching nodes
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Statistics */}
      {visualizationData && (
        <Card>
          <CardHeader>
            <CardTitle>Data Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"grid grid-cols-2 md:grid-cols-5 gap-4 text-center\">
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-blue-600\">{visualizationData.stats.totalNodes}</div>
                <div className=\"text-sm text-muted-foreground\">Total Nodes</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-green-600\">{visualizationData.stats.maxDepth}</div>
                <div className=\"text-sm text-muted-foreground\">Max Depth</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-purple-600\">{visualizationData.stats.size}</div>
                <div className=\"text-sm text-muted-foreground\">Size (bytes)</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-orange-600\">{Object.keys(visualizationData.stats.types).length}</div>
                <div className=\"text-sm text-muted-foreground\">Data Types</div>
              </div>
              <div className=\"p-4 bg-muted/50 rounded-lg\">
                <div className=\"text-2xl font-bold text-pink-600\">{filteredNodes.length}</div>
                <div className=\"text-sm text-muted-foreground\">Visible Nodes</div>
              </div>
            </div>

            {/* Type Distribution */}
            <div className=\"mt-4 pt-4 border-t\">
              <h4 className=\"text-sm font-medium mb-3\">Type Distribution</h4>
              <div className=\"flex flex-wrap gap-2\">
                {Object.entries(visualizationData.stats.types).map(([type, count]) => (
                  <Badge key={type} variant=\"outline\" className=\"flex items-center space-x-1\">
                    <div
                      className=\"w-2 h-2 rounded-full\"
                      style={{ backgroundColor: getNodeColor({ type } as TreeNode) }}
                    />
                    <span>{type}: {count}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
