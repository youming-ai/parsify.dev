'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Check, ClipboardCopy, Database, Play, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

const SAMPLE_QUERIES = {
  select: `SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(o.id) as order_count,
    SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
    AND u.status = 'active'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC
LIMIT 10;`,
  insert: `INSERT INTO products (name, price, category, stock)
VALUES 
    ('Laptop Pro', 1299.99, 'Electronics', 50),
    ('Wireless Mouse', 29.99, 'Accessories', 200),
    ('USB-C Hub', 49.99, 'Accessories', 150);`,
  create: `CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id),
    salary DECIMAL(10, 2),
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department_id);`,
};

export default function SQLToolsPage() {
  const [sql, setSQL] = useState('');
  const [formattedSQL, setFormattedSQL] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleClear = useCallback(() => {
    setSQL('');
    setFormattedSQL('');
    setValidationResult(null);
  }, []);

  const handleSample = useCallback((type: keyof typeof SAMPLE_QUERIES) => {
    setSQL(SAMPLE_QUERIES[type]);
    setFormattedSQL('');
    setValidationResult(null);
  }, []);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setSQL(text);
    setFormattedSQL('');
    setValidationResult(null);
  }, []);

  // Simple SQL formatter
  const formatSQL = useCallback((input: string): string => {
    const keywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'AND',
      'OR',
      'JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'OUTER JOIN',
      'ON',
      'GROUP BY',
      'ORDER BY',
      'HAVING',
      'LIMIT',
      'OFFSET',
      'INSERT INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE FROM',
      'CREATE TABLE',
      'ALTER TABLE',
      'DROP TABLE',
      'CREATE INDEX',
      'PRIMARY KEY',
      'FOREIGN KEY',
      'REFERENCES',
      'NOT NULL',
      'UNIQUE',
      'DEFAULT',
      'AS',
      'DISTINCT',
      'COUNT',
      'SUM',
      'AVG',
      'MIN',
      'MAX',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'UNION',
      'EXCEPT',
      'INTERSECT',
      'EXISTS',
      'IN',
      'BETWEEN',
      'LIKE',
      'IS NULL',
      'IS NOT NULL',
      'ASC',
      'DESC',
      'NULLS FIRST',
      'NULLS LAST',
      'CASCADE',
      'SERIAL',
      'VARCHAR',
      'INT',
      'INTEGER',
      'BOOLEAN',
      'DATE',
      'TIMESTAMP',
      'DECIMAL',
      'TEXT',
    ];

    let formatted = input;

    // Normalize whitespace
    formatted = formatted.replace(/\s+/g, ' ').trim();

    // Add newlines before major keywords
    const majorKeywords = [
      'SELECT',
      'FROM',
      'WHERE',
      'AND',
      'OR',
      'JOIN',
      'LEFT JOIN',
      'RIGHT JOIN',
      'INNER JOIN',
      'GROUP BY',
      'ORDER BY',
      'HAVING',
      'LIMIT',
      'INSERT INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE FROM',
      'CREATE TABLE',
      'CREATE INDEX',
      'ALTER TABLE',
      'DROP TABLE',
      'UNION',
      'EXCEPT',
      'INTERSECT',
    ];

    for (const keyword of majorKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `\n${keyword}`);
    }

    // Uppercase keywords
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, keyword);
    }

    // Add indentation
    const lines = formatted.split('\n');
    const indentedLines: string[] = [];
    let indentLevel = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Decrease indent for certain keywords
      if (/^(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|VALUES|SET)/.test(line)) {
        indentLevel = Math.max(0, indentLevel);
      }
      if (/^(AND|OR)/.test(line)) {
        indentLevel = 1;
      }

      indentedLines.push('  '.repeat(indentLevel) + line);

      // Increase indent after certain keywords
      if (/^SELECT/.test(line)) {
        indentLevel = 1;
      }
      if (/\($/.test(line)) {
        indentLevel++;
      }
      if (/^\)/.test(line)) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
    }

    return indentedLines.join('\n').trim();
  }, []);

  // Simple SQL validator
  const validateSQL = useCallback((input: string): { valid: boolean; message: string } => {
    if (!input.trim()) {
      return { valid: false, message: 'Empty SQL statement' };
    }

    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of input) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) {
        return { valid: false, message: 'Unmatched closing parenthesis' };
      }
    }
    if (parenCount !== 0) {
      return { valid: false, message: 'Unmatched opening parenthesis' };
    }

    // Check for balanced quotes
    const singleQuotes = (input.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      return { valid: false, message: 'Unmatched single quote' };
    }

    // Check for basic SQL structure
    const normalized = input.toUpperCase().trim();
    const validStarts = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'WITH'];
    const startsWithValid = validStarts.some((start) => normalized.startsWith(start));

    if (!startsWithValid) {
      return { valid: false, message: 'SQL must start with a valid statement keyword' };
    }

    // Check SELECT has FROM
    if (normalized.startsWith('SELECT') && !normalized.includes('FROM')) {
      return { valid: false, message: 'SELECT statement must include FROM clause' };
    }

    // Check INSERT has VALUES or SELECT
    if (
      normalized.startsWith('INSERT') &&
      !normalized.includes('VALUES') &&
      !normalized.includes('SELECT')
    ) {
      return { valid: false, message: 'INSERT statement must include VALUES or SELECT' };
    }

    return { valid: true, message: 'SQL syntax appears valid' };
  }, []);

  const handleFormat = useCallback(() => {
    const formatted = formatSQL(sql);
    setFormattedSQL(formatted);
    const validation = validateSQL(sql);
    setValidationResult(validation);
  }, [sql, formatSQL, validateSQL]);

  const handleValidate = useCallback(() => {
    const validation = validateSQL(sql);
    setValidationResult(validation);
  }, [sql, validateSQL]);

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>SQL Tools</CardTitle>
                <CardDescription>
                  Format and validate SQL queries with syntax highlighting
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">SQL</Badge>
              <Badge variant="outline">Offline</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-slate-50 p-2 dark:bg-slate-800">
            <Button variant="ghost" size="sm" onClick={handlePaste}>
              <ClipboardCopy className="mr-1 h-4 w-4" />
              Paste
            </Button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <span className="text-sm text-slate-500">Samples:</span>
            <Button variant="ghost" size="sm" onClick={() => handleSample('select')}>
              SELECT
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleSample('insert')}>
              INSERT
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleSample('create')}>
              CREATE
            </Button>
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600" />
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 className="mr-1 h-4 w-4" />
              Clear
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleValidate}>
              <Play className="mr-1 h-4 w-4" />
              Validate
            </Button>
            <Button variant="default" size="sm" onClick={handleFormat}>
              <Sparkles className="mr-1 h-4 w-4" />
              Format
            </Button>
          </div>

          {/* Validation Result */}
          {validationResult && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 ${
                validationResult.valid
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}
            >
              {validationResult.valid ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-red-500">✗</span>
              )}
              <span className="text-sm font-medium">{validationResult.message}</span>
            </div>
          )}

          {/* Editor */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Input SQL
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(sql)}
                  className="h-6 text-xs"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <Textarea
                value={sql}
                onChange={(e) => {
                  setSQL(e.target.value);
                  setFormattedSQL('');
                  setValidationResult(null);
                }}
                placeholder="Enter your SQL query here..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Formatted SQL
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(formattedSQL || sql)}
                  className="h-6 text-xs"
                  disabled={!formattedSQL && !sql}
                >
                  Copy
                </Button>
              </div>
              <div className="min-h-[400px] overflow-auto rounded-lg border bg-slate-900 p-4 font-mono text-sm text-slate-100">
                <pre className="whitespace-pre-wrap">
                  {formattedSQL || sql || 'Formatted SQL will appear here...'}
                </pre>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>{sql.length} characters</span>
            <span>{sql.split('\n').filter(Boolean).length} lines</span>
            <span>{(sql.match(/;/g) || []).length} statements</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
