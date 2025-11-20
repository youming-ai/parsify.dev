import { ChevronDown, ChevronRight, Copy, Download } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JsonViewerProps, TreeNode } from "./json-types";
import { copyToClipboard, downloadFile, parseJsonToTree } from "./json-utils";

interface JsonTreeItemProps {
  node: TreeNode;
  level: number;
  showLineNumbers: boolean;
  lineNumber: { current: number };
  onCopy: (path: string, value: unknown) => void;
}

function JsonTreeItem({ node, level, showLineNumbers, lineNumber, onCopy }: JsonTreeItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(node.isExpanded ?? level < 3);

  const hasChildren = node.children && node.children.length > 0;
  const _isLastChild =
    node.key.endsWith("]") && !Number.isNaN(Number.parseInt(node.key.split("[").pop() || "", 10));

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderValue = () => {
    if (hasChildren) {
      return null; // Will render children separately
    }

    let displayValue: string;
    let valueClass: string;

    switch (node.type) {
      case "string":
        displayValue = `"${String(node.value)}"`;
        valueClass = "text-green-600";
        break;
      case "number":
        displayValue = String(node.value);
        valueClass = "text-blue-600";
        break;
      case "boolean":
        displayValue = String(node.value);
        valueClass = "text-purple-600";
        break;
      case "null":
        displayValue = "null";
        valueClass = "text-gray-500";
        break;
      default:
        displayValue = String(node.value);
        valueClass = "text-gray-700";
    }

    return (
      <span
        className={cn("font-mono", valueClass, "cursor-pointer hover:opacity-70")}
        onClick={() => onCopy(node.path, node.value)}
        title="Click to copy value"
      >
        {displayValue}
      </span>
    );
  };

  const renderKey = () => {
    if (node.path === "root") {
      return null;
    }

    const keyName = node.key.includes("[") ? node.key : `"${node.key}"`;
    return (
      <span
        className={cn("cursor-pointer font-medium font-mono text-gray-700 hover:opacity-70")}
        onClick={() => onCopy(node.path, node.value)}
        title={`Copy ${node.path}`}
      >
        {keyName}:
      </span>
    );
  };

  return (
    <div className={cn("font-mono text-sm", "select-text")}>
      <div className={cn("flex items-start gap-1", "rounded px-1 hover:bg-gray-50")}>
        {showLineNumbers && (
          <span className="mr-2 w-8 select-none text-right text-gray-400 text-xs">
            {lineNumber.current++}
          </span>
        )}

        <div className="flex-1">
          {/* Indentation */}
          {level > 0 && <span className="inline-block" style={{ width: `${level * 20}px` }} />}

          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={toggleExpand}
              className={cn(
                "mr-1 inline-flex h-4 w-4 items-center justify-center",
                "text-gray-400 hover:text-gray-600",
                "focus:text-gray-600 focus:outline-none",
              )}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}

          {!hasChildren && <span className="mr-1 inline-block h-4 w-4" />}

          {/* Key */}
          {renderKey()}

          {/* Value */}
          {renderValue()}

          {/* Container brackets */}
          {hasChildren && (
            <>
              <span className="text-gray-600">{node.type === "object" ? "{" : "["}</span>
              {!isExpanded && (
                <>
                  <span className="mx-1 text-gray-400">
                    {node.children?.length} {node.type === "object" ? "properties" : "items"}
                  </span>
                  <span className="text-gray-600">{node.type === "object" ? "}" : "]"}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children?.map((child, _index) => (
            <JsonTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              showLineNumbers={showLineNumbers}
              lineNumber={lineNumber}
              onCopy={onCopy}
            />
          ))}

          {/* Closing bracket */}
          <div className={cn("flex items-start gap-1", "rounded px-1 hover:bg-gray-50")}>
            {showLineNumbers && (
              <span className="mr-2 w-8 select-none text-right text-gray-400 text-xs">
                {lineNumber.current++}
              </span>
            )}
            <div className="flex-1">
              <span className="inline-block" style={{ width: `${(level + 1) * 20}px` }} />
              <span className="text-gray-600">{node.type === "object" ? "}" : "]"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function JsonViewer({
  data,
  expandLevel = 3,
  showLineNumbers = false,
  copyable = true,
  className,
}: JsonViewerProps) {
  const [showCopyNotification, setShowCopyNotification] = React.useState(false);
  const [_copiedValue, setCopiedValue] = React.useState("");

  // Parse data to tree structure
  const treeData = React.useMemo(() => {
    return parseJsonToTree(data);
  }, [data]);

  const handleCopy = (_path: string, value: unknown) => {
    if (!copyable) return;

    const valueToCopy = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
    copyToClipboard(valueToCopy)
      .then(() => {
        setCopiedValue(valueToCopy);
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 2000);
      })
      .catch(console.error);
  };

  const handleCopyAll = () => {
    if (!copyable) return;

    const jsonString = JSON.stringify(data, null, 2);
    copyToClipboard(jsonString)
      .then(() => {
        setCopiedValue("All JSON data");
        setShowCopyNotification(true);
        setTimeout(() => setShowCopyNotification(false), 2000);
      })
      .catch(console.error);
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    downloadFile(jsonString, "formatted-json.json", "application/json");
  };

  const lineNumber = React.useRef(1);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-900 text-lg">JSON Viewer</h3>
          <span className="text-gray-500 text-sm">
            ({treeData.length} {treeData.length === 1 ? "item" : "items"})
          </span>
        </div>

        {copyable && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
              className="flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Download
            </Button>
          </div>
        )}
      </div>

      {/* JSON Tree */}
      <div className="max-h-96 overflow-auto rounded-lg border bg-gray-50 p-4">
        {treeData.map((node) => (
          <JsonTreeItem
            key={node.path}
            node={node}
            level={0}
            showLineNumbers={showLineNumbers}
            lineNumber={lineNumber}
            onCopy={handleCopy}
          />
        ))}

        {treeData.length === 0 && (
          <div className="py-8 text-center text-gray-500">No data to display</div>
        )}
      </div>

      {/* Copy notification */}
      {showCopyNotification && (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white shadow-lg">
          <span className="text-sm">Copied to clipboard</span>
        </div>
      )}
    </div>
  );
}
