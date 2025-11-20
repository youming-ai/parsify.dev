import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../ui/card";
import { Button } from "../../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { Badge } from "../../../ui/badge";
import { Switch } from "../../../ui/switch";
import { Label } from "../../../ui/label";
import { ScrollArea } from "../../../ui/scroll-area";
import { Copy, Download, Settings, RefreshCw, Database, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced type system for JSON to SQL conversion
interface SQLConversionOptions {
  database: "mysql" | "postgresql" | "sqlite" | "mssql" | "oracle";
  outputFormat: "create" | "insert" | "select" | "schema" | "full";
  tableName: string;
  primaryKeyStrategy: "auto_increment" | "uuid" | "none" | "composite";
  foreignKeyStrategy: "create" | "references" | "none";
  indexStrategy: "primary" | "unique" | "index" | "none";
  namingConvention: "snake_case" | "camelCase" | "PascalCase" | "UPPER_CASE";
  stringType: "VARCHAR(255)" | "TEXT" | "LONGTEXT" | "CLOB";
  numberType: "DECIMAL" | "FLOAT" | "DOUBLE";
  integerType: "INT" | "BIGINT" | "INTEGER";
  booleanType: "BOOLEAN" | "TINYINT(1)" | "BIT";
  jsonType: "JSON" | "JSONB" | "TEXT";
  datetimeType: "TIMESTAMP" | "DATETIME" | "DATE";
  nullHandling: "allow_null" | "not_null" | "default_null";
  constraints: boolean;
  comments: boolean;
  dropIfExists: boolean;
  batchInserts: boolean;
  batchSize: number;
}

interface SQLGenerationResult {
  success: boolean;
  sql?: string;
  error?: string;
  warnings: string[];
  metadata: SQLMetadata;
  tables: TableDefinition[];
}

interface SQLMetadata {
  originalJson: string;
  totalObjects: number;
  totalProperties: number;
  tablesGenerated: number;
  conversionTime: number;
  database: string;
  outputFormat: string;
}

interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: string;
  comment?: string;
  foreignKey?: ForeignKeyDefinition;
}

interface ForeignKeyDefinition {
  table: string;
  column: string;
  onDelete: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
  onUpdate: "CASCADE" | "SET NULL" | "RESTRICT" | "NO ACTION";
}

interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKey: string[];
  foreignKeys: ForeignKeyDefinition[];
  indexes: IndexDefinition[];
  comment?: string;
}

interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
  type: "BTREE" | "HASH" | "FULLTEXT";
}

const DEFAULT_SQL_OPTIONS: SQLConversionOptions = {
  database: "mysql",
  outputFormat: "full",
  tableName: "data",
  primaryKeyStrategy: "auto_increment",
  foreignKeyStrategy: "create",
  indexStrategy: "primary",
  namingConvention: "snake_case",
  stringType: "VARCHAR(255)",
  numberType: "DECIMAL",
  integerType: "INT",
  booleanType: "BOOLEAN",
  jsonType: "JSON",
  datetimeType: "TIMESTAMP",
  nullHandling: "allow_null",
  constraints: true,
  comments: true,
  dropIfExists: true,
  batchInserts: true,
  batchSize: 1000,
};

// Database-specific type mappings
const DATABASE_TYPE_MAPPINGS = {
  mysql: {
    string: "VARCHAR(255)",
    text: "TEXT",
    longText: "LONGTEXT",
    integer: "INT",
    bigInteger: "BIGINT",
    decimal: "DECIMAL(10,2)",
    float: "FLOAT",
    double: "DOUBLE",
    boolean: "BOOLEAN",
    date: "DATE",
    datetime: "DATETIME",
    timestamp: "TIMESTAMP",
    json: "JSON",
    uuid: "CHAR(36)",
  },
  postgresql: {
    string: "VARCHAR(255)",
    text: "TEXT",
    longText: "TEXT",
    integer: "INTEGER",
    bigInteger: "BIGINT",
    decimal: "DECIMAL(10,2)",
    float: "REAL",
    double: "DOUBLE PRECISION",
    boolean: "BOOLEAN",
    date: "DATE",
    datetime: "TIMESTAMP",
    timestamp: "TIMESTAMP",
    json: "JSONB",
    uuid: "UUID",
  },
  sqlite: {
    string: "TEXT",
    text: "TEXT",
    longText: "TEXT",
    integer: "INTEGER",
    bigInteger: "INTEGER",
    decimal: "REAL",
    float: "REAL",
    double: "REAL",
    boolean: "INTEGER",
    date: "TEXT",
    datetime: "TEXT",
    timestamp: "TEXT",
    json: "TEXT",
    uuid: "TEXT",
  },
  mssql: {
    string: "NVARCHAR(255)",
    text: "NVARCHAR(MAX)",
    longText: "NVARCHAR(MAX)",
    integer: "INT",
    bigInteger: "BIGINT",
    decimal: "DECIMAL(10,2)",
    float: "FLOAT",
    double: "FLOAT",
    boolean: "BIT",
    date: "DATE",
    datetime: "DATETIME",
    timestamp: "DATETIME2",
    json: "NVARCHAR(MAX)",
    uuid: "UNIQUEIDENTIFIER",
  },
  oracle: {
    string: "VARCHAR2(255)",
    text: "CLOB",
    longText: "CLOB",
    integer: "NUMBER",
    bigInteger: "NUMBER",
    decimal: "NUMBER(10,2)",
    float: "BINARY_FLOAT",
    double: "BINARY_DOUBLE",
    boolean: "NUMBER(1)",
    date: "DATE",
    datetime: "TIMESTAMP",
    timestamp: "TIMESTAMP",
    json: "CLOB",
    uuid: "VARCHAR2(36)",
  },
};

// Enhanced naming conversion functions
const convertNaming = (
  str: string,
  convention: SQLConversionOptions["namingConvention"],
): string => {
  switch (convention) {
    case "snake_case":
      return str
        .replace(/([A-Z])/g, "_$1")
        .replace(/^_/, "")
        .toLowerCase();
    case "camelCase":
      return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    case "PascalCase":
      return str
        .replace(/_([a-z])/g, (_, char) => char.toUpperCase())
        .replace(/^./, (char) => char.toUpperCase());
    case "UPPER_CASE":
      return str
        .replace(/([A-Z])/g, "_$1")
        .replace(/^_/, "")
        .toUpperCase();
    default:
      return str;
  }
};

// Infer SQL type from JSON value
const inferSQLType = (
  value: any,
  options: SQLConversionOptions,
): { type: string; nullable: boolean; length?: number } => {
  const typeMap = DATABASE_TYPE_MAPPINGS[options.database];

  if (value === null || value === undefined) {
    return { type: typeMap.text, nullable: true };
  }

  if (typeof value === "string") {
    // Check for special patterns
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return { type: typeMap.date, nullable: false };
    }
    if (value.match(/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/)) {
      return { type: typeMap.datetime, nullable: false };
    }
    if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return { type: typeMap.uuid, nullable: false };
    }

    const length = value.length;
    if (length > 4000) {
      return { type: typeMap.longText, nullable: false, length };
    } else if (length > 255) {
      return { type: typeMap.text, nullable: false, length };
    } else {
      const stringType =
        options.database === "mysql" ? `VARCHAR(${Math.max(length, 50)})` : typeMap.string;
      return { type: stringType, nullable: false, length };
    }
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      if (value > 2147483647 || value < -2147483648) {
        return { type: typeMap.bigInteger, nullable: false };
      } else {
        return { type: typeMap.integer, nullable: false };
      }
    } else {
      return { type: typeMap.decimal, nullable: false };
    }
  }

  if (typeof value === "boolean") {
    return { type: typeMap.boolean, nullable: false };
  }

  if (Array.isArray(value)) {
    return { type: typeMap.json, nullable: true };
  }

  if (typeof value === "object") {
    return { type: typeMap.json, nullable: true };
  }

  return { type: typeMap.text, nullable: true };
};

// Analyze JSON structure to determine table schema
const analyzeJSONStructure = (
  data: any,
  tableName: string,
  options: SQLConversionOptions,
  depth: number = 0,
): TableDefinition[] => {
  const tables: TableDefinition[] = [];
  const warnings: string[] = [];

  // Prevent infinite recursion
  if (depth > 10) {
    warnings.push("Maximum nesting depth reached");
    return tables;
  }

  if (Array.isArray(data)) {
    // Handle array of objects
    if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
      return analyzeJSONStructure(data[0], tableName, options, depth);
    }
  } else if (typeof data === "object" && data !== null) {
    const columns: ColumnDefinition[] = [];
    const foreignKeys: ForeignKeyDefinition[] = [];
    const relatedTables: TableDefinition[] = [];

    // Add primary key based on strategy
    let primaryKeyColumn: ColumnDefinition | undefined;
    const primaryKeyName = convertNaming("id", options.namingConvention);

    switch (options.primaryKeyStrategy) {
      case "auto_increment":
        const typeMap = DATABASE_TYPE_MAPPINGS[options.database];
        primaryKeyColumn = {
          name: primaryKeyName,
          type: typeMap.bigInteger,
          nullable: false,
          primaryKey: true,
          unique: true,
          comment: "Auto-generated primary key",
        };
        break;
      case "uuid":
        primaryKeyColumn = {
          name: primaryKeyName,
          type: DATABASE_TYPE_MAPPINGS[options.database].uuid,
          nullable: false,
          primaryKey: true,
          unique: true,
          defaultValue: options.database === "postgresql" ? "gen_random_uuid()" : undefined,
          comment: "UUID primary key",
        };
        break;
    }

    if (primaryKeyColumn) {
      columns.unshift(primaryKeyColumn);
    }

    // Analyze each property
    let index = 0;
    for (const [key, value] of Object.entries(data)) {
      if (key === "__comment__") continue;

      const columnName = convertNaming(key, options.namingConvention);
      const typeInfo = inferSQLType(value, options);

      // Handle nested objects
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const relatedTableName = convertNaming(key, options.namingConvention);

        // Create foreign key relationship
        if (options.foreignKeyStrategy === "create" && primaryKeyColumn) {
          const foreignKey: ForeignKeyDefinition = {
            table: relatedTableName,
            column: primaryKeyName,
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          };

          columns.push({
            name: `${columnName}_id`,
            type: DATABASE_TYPE_MAPPINGS[options.database].bigInteger,
            nullable: true,
            primaryKey: false,
            unique: false,
            foreignKey,
            comment: `Foreign key to ${relatedTableName}`,
          });
        }

        // Recursively analyze nested object
        const nestedTables = analyzeJSONStructure(value, relatedTableName, options, depth + 1);
        relatedTables.push(...nestedTables);
      } else if (Array.isArray(value)) {
        // Handle arrays - could be separate table or JSON type
        if (options.jsonType === "JSON") {
          columns.push({
            name: columnName,
            type: DATABASE_TYPE_MAPPINGS[options.database].json,
            nullable: typeInfo.nullable,
            primaryKey: false,
            unique: false,
            comment: `Array data for ${key}`,
          });
        } else {
          // Create junction table for many-to-many relationship
          const junctionTableName = `${tableName}_${columnName}`;
          const junctionColumns: ColumnDefinition[] = [
            {
              name: `${tableName}_id`,
              type: DATABASE_TYPE_MAPPINGS[options.database].bigInteger,
              nullable: false,
              primaryKey: true,
              unique: false,
            },
            {
              name: `${columnName}_id`,
              type: DATABASE_TYPE_MAPPINGS[options.database].bigInteger,
              nullable: false,
              primaryKey: true,
              unique: false,
            },
          ];

          tables.push({
            name: junctionTableName,
            columns: junctionColumns,
            primaryKey: [junctionTableName[0].name, junctionTableName[1].name],
            foreignKeys: [],
            indexes: [],
            comment: `Junction table for ${tableName} to ${key}`,
          });
        }
      } else {
        // Simple column
        const nullable = options.nullHandling === "allow_null" || typeInfo.nullable;
        columns.push({
          name: columnName,
          type: typeInfo.type,
          nullable,
          primaryKey: false,
          unique: false,
          comment: options.comments ? `Property from JSON: ${key}` : undefined,
        });
      }

      index++;
    }

    // Create table definition
    const table: TableDefinition = {
      name: tableName,
      columns,
      primaryKey: primaryKeyColumn ? [primaryKeyColumn.name] : [],
      foreignKeys,
      indexes: [],
      comment: options.comments ? `Generated from JSON structure` : undefined,
    };

    tables.push(table, ...relatedTables);
  }

  return tables;
};

// Generate CREATE TABLE statements
const generateCreateTableSQL = (table: TableDefinition, options: SQLConversionOptions): string => {
  const typeMap = DATABASE_TYPE_MAPPINGS[options.database];
  const statements: string[] = [];

  // DROP IF EXISTS
  if (options.dropIfExists) {
    switch (options.database) {
      case "mysql":
        statements.push(`DROP TABLE IF EXISTS \`${table.name}\`;`);
        break;
      case "postgresql":
        statements.push(`DROP TABLE IF EXISTS "${table.name}" CASCADE;`);
        break;
      case "sqlite":
        statements.push(`DROP TABLE IF EXISTS "${table.name}";`);
        break;
      case "mssql":
        statements.push(
          `IF OBJECT_ID('${table.name}', 'U') IS NOT NULL DROP TABLE "${table.name}";`,
        );
        break;
      case "oracle":
        statements.push(
          `BEGIN EXECUTE IMMEDIATE 'DROP TABLE "${table.name}"'; EXCEPTION WHEN OTHERS THEN NULL; END;`,
        );
        break;
    }
    statements.push("");
  }

  // CREATE TABLE
  const quoteChar = options.database === "mysql" ? "`" : '"';
  statements.push(`CREATE TABLE ${quoteChar}${table.name}${quoteChar} (`);

  // Columns
  const columnDefinitions = table.columns.map((column) => {
    let definition = `  ${quoteChar}${column.name}${quoteChar} ${column.type}`;

    // Constraints
    if (options.constraints) {
      if (!column.nullable) {
        definition += " NOT NULL";
      }

      if (column.defaultValue) {
        definition += ` DEFAULT ${column.defaultValue}`;
      }

      if (column.primaryKey && table.primaryKey.length === 1) {
        definition += " PRIMARY KEY";
      }

      if (column.unique) {
        definition += " UNIQUE";
      }
    }

    // Comment (MySQL and PostgreSQL)
    if (column.comment && options.comments) {
      switch (options.database) {
        case "mysql":
          definition += ` COMMENT '${column.comment}'`;
          break;
        case "postgresql":
          // Handled separately with COMMENT ON COLUMN
          break;
      }
    }

    return definition;
  });

  // Composite primary key
  if (table.primaryKey.length > 1 && options.constraints) {
    const pkColumns = table.primaryKey.map((col) => `${quoteChar}${col}${quoteChar}`).join(", ");
    columnDefinitions.push(`  PRIMARY KEY (${pkColumns})`);
  }

  statements.push(columnDefinitions.join(",\n"));
  statements.push(");");

  // Table comment (PostgreSQL)
  if (table.comment && options.comments && options.database === "postgresql") {
    statements.push(`COMMENT ON TABLE "${table.name}" IS '${table.comment}';`);
  }

  // Column comments (PostgreSQL)
  table.columns.forEach((column) => {
    if (column.comment && options.comments && options.database === "postgresql") {
      statements.push(`COMMENT ON COLUMN "${table.name}"."${column.name}" IS '${column.comment}';`);
    }
  });

  // Foreign keys
  if (options.foreignKeyStrategy === "create") {
    table.foreignKeys.forEach((fk) => {
      statements.push(
        `ALTER TABLE ${quoteChar}${table.name}${quoteChar} ADD CONSTRAINT fk_${table.name}_${fk.column} FOREIGN KEY (${quoteChar}${fk.column}${quoteChar}) REFERENCES ${quoteChar}${fk.table}${quoteChar}(${quoteChar}${fk.column}${quoteChar}) ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate};`,
      );
    });
  }

  // Indexes
  table.indexes.forEach((index) => {
    const indexColumns = index.columns.map((col) => `${quoteChar}${col}${quoteChar}`).join(", ");
    const indexType = index.unique ? "UNIQUE INDEX" : "INDEX";
    statements.push(
      `CREATE ${indexType} ${quoteChar}${index.name}${quoteChar} ON ${quoteChar}${table.name}${quoteChar} (${indexColumns});`,
    );
  });

  return statements.join("\n") + "\n\n";
};

// Generate INSERT statements
const generateInsertSQL = (
  table: TableDefinition,
  data: any,
  options: SQLConversionOptions,
): string => {
  if (!Array.isArray(data)) {
    data = [data];
  }

  const quoteChar = options.database === "mysql" ? "`" : '"';
  const statements: string[] = [];

  // Process in batches
  for (let i = 0; i < data.length; i += options.batchSize) {
    const batch = data.slice(i, i + options.batchSize);

    batch.forEach((item) => {
      const columns = table.columns.map((col) => col.name);
      const values = table.columns.map((col) => {
        const value = item[col.name.replace(/_id$/, "")]; // Reverse naming for lookup

        if (value === null || value === undefined) {
          return "NULL";
        }

        if (typeof value === "string") {
          return `'${value.replace(/'/g, "''")}'`;
        }

        if (typeof value === "boolean") {
          return options.database === "mysql" ? (value ? "1" : "0") : value.toString();
        }

        if (typeof value === "object") {
          return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        }

        return value.toString();
      });

      statements.push(
        `INSERT INTO ${quoteChar}${table.name}${quoteChar} (${columns.map((col) => `${quoteChar}${col}${quoteChar}`).join(", ")}) VALUES (${values.join(", ")});`,
      );
    });
  }

  return statements.join("\n") + "\n\n";
};

// Generate SELECT statements
const generateSelectSQL = (tables: TableDefinition[], options: SQLConversionOptions): string => {
  const quoteChar = options.database === "mysql" ? "`" : '"';
  const statements: string[] = [];

  tables.forEach((table) => {
    const columns = table.columns
      .map((col) => `${quoteChar}${table.name}${quoteChar}.${quoteChar}${col.name}${quoteChar}`)
      .join(", ");
    statements.push(`SELECT ${columns} FROM ${quoteChar}${table.name}${quoteChar};`);
  });

  return statements.join("\n") + "\n";
};

// Main conversion function
const convertJSONToSQL = (jsonData: string, options: SQLConversionOptions): SQLGenerationResult => {
  const startTime = performance.now();
  const warnings: string[] = [];

  try {
    const data = JSON.parse(jsonData);
    const tables = analyzeJSONStructure(data, options.tableName, options);

    let sql = "";
    let totalObjects = 0;
    let totalProperties = 0;

    tables.forEach((table) => {
      totalProperties += table.columns.length;
    });

    // Count objects in arrays
    if (Array.isArray(data)) {
      totalObjects = data.length;
    } else if (typeof data === "object" && data !== null) {
      totalObjects = 1;
    }

    switch (options.outputFormat) {
      case "create":
        tables.forEach((table) => {
          sql += generateCreateTableSQL(table, options);
        });
        break;

      case "insert":
        if (Array.isArray(data)) {
          tables.forEach((table, index) => {
            sql += generateInsertSQL(table, data, options);
          });
        }
        break;

      case "select":
        sql += generateSelectSQL(tables, options);
        break;

      case "schema":
        // Just table definitions without SQL
        sql = JSON.stringify(tables, null, 2);
        break;

      case "full":
      default:
        // CREATE TABLE statements
        tables.forEach((table) => {
          sql += generateCreateTableSQL(table, options);
        });

        // INSERT statements if data is an array
        if (Array.isArray(data)) {
          tables.forEach((table, index) => {
            if (index < data.length) {
              sql += generateInsertSQL(table, data[index], options);
            }
          });
        }

        // SELECT statements
        sql += generateSelectSQL(tables, options);
        break;
    }

    const conversionTime = performance.now() - startTime;

    return {
      success: true,
      sql,
      warnings,
      metadata: {
        originalJson: jsonData,
        totalObjects,
        totalProperties,
        tablesGenerated: tables.length,
        conversionTime,
        database: options.database,
        outputFormat: options.outputFormat,
      },
      tables,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      warnings,
      metadata: {
        originalJson: jsonData,
        totalObjects: 0,
        totalProperties: 0,
        tablesGenerated: 0,
        conversionTime: performance.now() - startTime,
        database: options.database,
        outputFormat: options.outputFormat,
      },
      tables: [],
    };
  }
};

// Main component props
interface JSONToSQLConverterProps {
  jsonData?: string;
  onSQLChange?: (sql: string) => void;
  onConversionResultChange?: (result: SQLGenerationResult) => void;
  className?: string;
  readOnly?: boolean;
  showPreview?: boolean;
  initialOptions?: Partial<SQLConversionOptions>;
}

export const JSONToSQLConverter: React.FC<JSONToSQLConverterProps> = ({
  jsonData = "",
  onSQLChange,
  onConversionResultChange,
  className: propsClassName,
  readOnly = false,
  showPreview = true,
  initialOptions = {},
}) => {
  const [jsonInput, setJsonInput] = useState(jsonData);
  const [options, setOptions] = useState<SQLConversionOptions>({
    ...DEFAULT_SQL_OPTIONS,
    ...initialOptions,
  });
  const [conversionResult, setConversionResult] = useState<SQLGenerationResult | null>(null);
  const [isAutoConverting, setIsAutoConverting] = useState(true);

  // Memoized conversion
  const result = useMemo(() => {
    if (!jsonInput.trim()) return null;
    return convertJSONToSQL(jsonInput, options);
  }, [jsonInput, options]);

  // Handle input change
  const handleInputChange = (value: string) => {
    setJsonInput(value);
  };

  // Handle manual conversion
  const handleConvert = () => {
    const result = convertJSONToSQL(jsonInput, options);
    setConversionResult(result);
    onConversionResultChange?.(result);
    if (result.success && result.sql) {
      onSQLChange?.(result.sql);
    }
  };

  // Update result when dependencies change
  useEffect(() => {
    if (isAutoConverting) {
      setConversionResult(result);
      onConversionResultChange?.(result);
      if (result?.success && result.sql) {
        onSQLChange?.(result.sql);
      }
    }
  }, [result, isAutoConverting, onConversionResultChange, onSQLChange]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      if (conversionResult?.success && conversionResult.sql) {
        await navigator.clipboard.writeText(conversionResult.sql);
      }
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Download as .sql file
  const handleDownload = () => {
    if (conversionResult?.success && conversionResult.sql) {
      const blob = new Blob([conversionResult.sql], { type: "text/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${options.tableName}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Reset
  const handleReset = () => {
    setJsonInput("");
    setConversionResult(null);
    setOptions(DEFAULT_SQL_OPTIONS);
  };

  // Load sample JSON
  const loadSample = () => {
    const sampleJSON = `{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "age": 30,
      "is_active": true,
      "created_at": "2024-01-15T10:30:00Z",
      "profile": {
        "bio": "Software developer",
        "location": "New York",
        "website": "https://johndoe.com"
      },
      "tags": ["developer", "javascript", "react"],
      "orders": [
        {
          "id": 101,
          "total": 99.99,
          "status": "completed"
        }
      ]
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "age": 25,
      "is_active": false,
      "created_at": "2024-01-20T14:45:00Z",
      "profile": {
        "bio": "UX Designer",
        "location": "San Francisco",
        "website": "https://janesmith.com"
      },
      "tags": ["designer", "ui", "ux"],
      "orders": [
        {
          "id": 102,
          "total": 149.99,
          "status": "pending"
        }
      ]
    }
  ]
}`;
    setJsonInput(sampleJSON);
  };

  const className = cn("w-full max-w-6xl mx-auto p-6 space-y-6", propsClassName);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                JSON to SQL Converter
                <Badge variant="outline">Bidirectional</Badge>
              </CardTitle>
              <CardDescription>
                Convert JSON data to SQL schema and insert statements with configurable options
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleConvert}
                disabled={!jsonInput.trim() || readOnly}
              >
                <Database className="h-4 w-4 mr-2" />
                Convert
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!conversionResult?.success || readOnly}
              >
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!conversionResult?.success || readOnly}
              >
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} disabled={readOnly}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            {/* Input Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="json-input">JSON Input</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-convert"
                    checked={isAutoConverting}
                    onCheckedChange={setIsAutoConverting}
                    disabled={readOnly}
                  />
                  <Label htmlFor="auto-convert">Auto Convert</Label>
                  <Button variant="outline" size="sm" onClick={loadSample} disabled={readOnly}>
                    Load Sample
                  </Button>
                </div>
              </div>
              <textarea
                id="json-input"
                className={cn(
                  "w-full h-64 p-3 font-mono text-sm border rounded-md resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  !conversionResult?.success && conversionResult && "border-red-500",
                )}
                placeholder="Paste your JSON here..."
                value={jsonInput}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={readOnly}
              />
            </div>

            {/* Conversion Options */}
            <Tabs defaultValue="basic" className="w-full">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="schema">Schema</TabsTrigger>
                  <TabsTrigger value="output">Output</TabsTrigger>
                </TabsList>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="database">Database</Label>
                    <select
                      id="database"
                      className="w-full p-2 border rounded-md"
                      value={options.database}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          database: e.target.value as SQLConversionOptions["database"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="mysql">MySQL</option>
                      <option value="postgresql">PostgreSQL</option>
                      <option value="sqlite">SQLite</option>
                      <option value="mssql">SQL Server</option>
                      <option value="oracle">Oracle</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="table-name">Table Name</Label>
                    <input
                      id="table-name"
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={options.tableName}
                      onChange={(e) =>
                        setOptions((prev) => ({ ...prev, tableName: e.target.value }))
                      }
                      disabled={readOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="output-format">Output Format</Label>
                    <select
                      id="output-format"
                      className="w-full p-2 border rounded-md"
                      value={options.outputFormat}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          outputFormat: e.target.value as SQLConversionOptions["outputFormat"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="full">Full (CREATE + INSERT + SELECT)</option>
                      <option value="create">CREATE TABLE Only</option>
                      <option value="insert">INSERT Only</option>
                      <option value="select">SELECT Only</option>
                      <option value="schema">Schema Definition</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="naming-convention">Naming Convention</Label>
                    <select
                      id="naming-convention"
                      className="w-full p-2 border rounded-md"
                      value={options.namingConvention}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          namingConvention: e.target
                            .value as SQLConversionOptions["namingConvention"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="snake_case">snake_case</option>
                      <option value="camelCase">camelCase</option>
                      <option value="PascalCase">PascalCase</option>
                      <option value="UPPER_CASE">UPPER_CASE</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-key-strategy">Primary Key Strategy</Label>
                    <select
                      id="primary-key-strategy"
                      className="w-full p-2 border rounded-md"
                      value={options.primaryKeyStrategy}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          primaryKeyStrategy: e.target
                            .value as SQLConversionOptions["primaryKeyStrategy"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="auto_increment">Auto Increment</option>
                      <option value="uuid">UUID</option>
                      <option value="none">No Primary Key</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foreign-key-strategy">Foreign Key Strategy</Label>
                    <select
                      id="foreign-key-strategy"
                      className="w-full p-2 border rounded-md"
                      value={options.foreignKeyStrategy}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          foreignKeyStrategy: e.target
                            .value as SQLConversionOptions["foreignKeyStrategy"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="create">Create Foreign Keys</option>
                      <option value="references">Add References</option>
                      <option value="none">No Foreign Keys</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="index-strategy">Index Strategy</Label>
                    <select
                      id="index-strategy"
                      className="w-full p-2 border rounded-md"
                      value={options.indexStrategy}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          indexStrategy: e.target.value as SQLConversionOptions["indexStrategy"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="primary">Primary Keys Only</option>
                      <option value="unique">Unique Indexes</option>
                      <option value="index">All Indexes</option>
                      <option value="none">No Indexes</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <input
                      id="batch-size"
                      type="number"
                      className="w-full p-2 border rounded-md"
                      value={options.batchSize}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          batchSize: parseInt(e.target.value) || 1000,
                        }))
                      }
                      disabled={readOnly}
                      min="1"
                      max="10000"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="constraints"
                      checked={options.constraints}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, constraints: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="constraints">Add Constraints</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="comments"
                      checked={options.comments}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, comments: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="comments">Add Comments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="drop-if-exists"
                      checked={options.dropIfExists}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, dropIfExists: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="drop-if-exists">DROP IF EXISTS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="batch-inserts"
                      checked={options.batchInserts}
                      onCheckedChange={(checked) =>
                        setOptions((prev) => ({ ...prev, batchInserts: checked }))
                      }
                      disabled={readOnly}
                    />
                    <Label htmlFor="batch-inserts">Batch Inserts</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schema" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="string-type">String Type</Label>
                    <select
                      id="string-type"
                      className="w-full p-2 border rounded-md"
                      value={options.stringType}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          stringType: e.target.value as SQLConversionOptions["stringType"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="VARCHAR(255)">VARCHAR(255)</option>
                      <option value="TEXT">TEXT</option>
                      <option value="LONGTEXT">LONGTEXT</option>
                      <option value="CLOB">CLOB</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number-type">Number Type</Label>
                    <select
                      id="number-type"
                      className="w-full p-2 border rounded-md"
                      value={options.numberType}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          numberType: e.target.value as SQLConversionOptions["numberType"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="DECIMAL">DECIMAL</option>
                      <option value="FLOAT">FLOAT</option>
                      <option value="DOUBLE">DOUBLE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="json-type">JSON Type</Label>
                    <select
                      id="json-type"
                      className="w-full p-2 border rounded-md"
                      value={options.jsonType}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          jsonType: e.target.value as SQLConversionOptions["jsonType"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="JSON">JSON</option>
                      <option value="JSONB">JSONB</option>
                      <option value="TEXT">TEXT</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="datetime-type">Date/Time Type</Label>
                    <select
                      id="datetime-type"
                      className="w-full p-2 border rounded-md"
                      value={options.datetimeType}
                      onChange={(e) =>
                        setOptions((prev) => ({
                          ...prev,
                          datetimeType: e.target.value as SQLConversionOptions["datetimeType"],
                        }))
                      }
                      disabled={readOnly}
                    >
                      <option value="TIMESTAMP">TIMESTAMP</option>
                      <option value="DATETIME">DATETIME</option>
                      <option value="DATE">DATE</option>
                    </select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="output" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="null-handling">Null Handling</Label>
                  <select
                    id="null-handling"
                    className="w-full p-2 border rounded-md"
                    value={options.nullHandling}
                    onChange={(e) =>
                      setOptions((prev) => ({
                        ...prev,
                        nullHandling: e.target.value as SQLConversionOptions["nullHandling"],
                      }))
                    }
                    disabled={readOnly}
                  >
                    <option value="allow_null">Allow NULL</option>
                    <option value="not_null">NOT NULL</option>
                    <option value="default_null">Default NULL</option>
                  </select>
                </div>
              </TabsContent>
            </Tabs>

            {/* Results */}
            {conversionResult && (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {conversionResult.success ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-green-600 font-medium">Conversion Successful</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-red-600 font-medium">Conversion Failed</span>
                      </div>
                    )}
                    {conversionResult.warnings.length > 0 && (
                      <Badge variant="outline" className="text-yellow-600">
                        {conversionResult.warnings.length} warning(s)
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" />
                    {conversionResult.metadata.database.toUpperCase()}
                    <ArrowUpDown className="h-4 w-4 ml-2" />
                    {conversionResult.metadata.conversionTime.toFixed(2)}ms
                  </div>
                </div>

                {/* Error */}
                {!conversionResult.success && conversionResult.error && (
                  <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {conversionResult.error}
                    </p>
                  </div>
                )}

                {/* Warnings */}
                {conversionResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-yellow-600">Warnings</Label>
                    <div className="space-y-1">
                      {conversionResult.warnings.map((warning, index) => (
                        <div
                          key={index}
                          className="text-sm text-yellow-600 p-2 border border-yellow-200 rounded-md"
                        >
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
                  <div className="text-sm">
                    <span className="font-medium">Objects:</span>{" "}
                    {conversionResult.metadata.totalObjects}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Properties:</span>{" "}
                    {conversionResult.metadata.totalProperties}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Tables:</span>{" "}
                    {conversionResult.metadata.tablesGenerated}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Format:</span>{" "}
                    {conversionResult.metadata.outputFormat}
                  </div>
                </div>

                {/* Generated SQL */}
                {conversionResult.success && conversionResult.sql && showPreview && (
                  <div className="space-y-2">
                    <Label>Generated SQL</Label>
                    <ScrollArea className="h-96 w-full border rounded-md">
                      <pre className="p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900">
                        <code>{conversionResult.sql}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {/* Table Structure */}
                {conversionResult.success && conversionResult.tables.length > 0 && (
                  <div className="space-y-2">
                    <Label>Generated Tables</Label>
                    <div className="space-y-2">
                      {conversionResult.tables.map((table, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded-md bg-gray-50 dark:bg-gray-900"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{table.name}</span>
                            <Badge variant="outline">{table.columns.length} columns</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {table.columns.slice(0, 4).map((column, colIndex) => (
                              <div key={colIndex} className="flex items-center gap-2">
                                <span className="font-mono text-xs">{column.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {column.type}
                                </Badge>
                                {column.primaryKey && (
                                  <Badge variant="default" className="text-xs">
                                    PK
                                  </Badge>
                                )}
                                {column.nullable && (
                                  <Badge variant="secondary" className="text-xs">
                                    NULL
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {table.columns.length > 4 && (
                              <div className="text-xs text-muted-foreground">
                                +{table.columns.length - 4} more columns
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JSONToSQLConverter;
