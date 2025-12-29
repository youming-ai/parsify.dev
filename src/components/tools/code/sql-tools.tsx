'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Copy, Play, Sparkle, Trash } from '@phosphor-icons/react';
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

export function SqlTools() {
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
    formatted = formatted.replace(/\s+/g, ' ').trim();

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

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, keyword);
    }

    const lines = formatted.split('\n');
    const indentedLines: string[] = [];
    let indentLevel = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (/^(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|VALUES|SET)/.test(line)) {
        indentLevel = Math.max(0, indentLevel);
      }
      if (/^(AND|OR)/.test(line)) {
        indentLevel = 1;
      }

      indentedLines.push('  '.repeat(indentLevel) + line);

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

  const validateSQL = useCallback((input: string): { valid: boolean; message: string } => {
    if (!input.trim()) {
      return { valid: false, message: 'Empty SQL statement' };
    }

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

    const singleQuotes = (input.match(/'/g) || []).length;
    if (singleQuotes % 2 !== 0) {
      return { valid: false, message: 'Unmatched single quote' };
    }

    const normalized = input.toUpperCase().trim();
    const validStarts = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'WITH'];
    const startsWithValid = validStarts.some((start) => normalized.startsWith(start));

    if (!startsWithValid) {
      return { valid: false, message: 'SQL must start with a valid statement keyword' };
    }

    if (normalized.startsWith('SELECT') && !normalized.includes('FROM')) {
      return { valid: false, message: 'SELECT statement must include FROM clause' };
    }

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
    <div className="bg-card rounded-xl border shadow-sm">
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2 border rounded-lg bg-muted/30 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <Copy className="mr-1 h-4 w-4" />
            Paste
          </Button>
          <div className="h-6 w-px bg-border" />
          <span className="text-xs font-medium text-muted-foreground px-2">Samples:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSample('select')}
            className="hover:bg-primary/10 hover:text-primary font-mono text-xs"
          >
            SELECT
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSample('insert')}
            className="hover:bg-primary/10 hover:text-primary font-mono text-xs"
          >
            INSERT
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSample('create')}
            className="hover:bg-primary/10 hover:text-primary font-mono text-xs"
          >
            CREATE
          </Button>
          <div className="h-6 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <Trash className="mr-1 h-4 w-4" />
            Clear
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            className="text-primary hover:bg-primary/10"
          >
            <Play className="mr-1 h-4 w-4" />
            Validate
          </Button>
          <Button variant="default" size="sm" onClick={handleFormat} className="">
            <Sparkle className="mr-1 h-4 w-4" />
            Format
          </Button>
        </div>

        {validationResult && (
          <div
            className={`flex items-center gap-2 rounded-lg border p-3 ${
              validationResult.valid
                ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
                : 'bg-destructive/10 border-destructive/20 text-destructive dark:text-red-400'
            }`}
          >
            {validationResult.valid ? (
              <Check className="h-4 w-4" />
            ) : (
              <span className="font-bold">✗</span>
            )}
            <span className="text-xs font-mono">{validationResult.message}</span>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Input Queries</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(sql)}
                className="h-6 text-xs hover:bg-primary/10"
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
              className="min-h-64 font-mono text-sm resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Formatted Output</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(formattedSQL || sql)}
                className="h-6 text-xs hover:bg-primary/10"
                disabled={!formattedSQL && !sql}
              >
                Copy
              </Button>
            </div>
            <div className="min-h-64 overflow-auto rounded-md border bg-background p-4 font-mono text-sm text-green-400 shadow-inner">
              <pre className="whitespace-pre-wrap">
                {formattedSQL || sql || (
                  <span className="text-slate-500">{'> WAITING FOR INPUT...'}</span>
                )}
              </pre>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-mono text-muted-foreground border-t pt-4">
          <span className="bg-muted px-2 py-1 rounded">Chars: {sql.length}</span>
          <span className="bg-muted px-2 py-1 rounded">
            Lines: {sql.split('\n').filter(Boolean).length}
          </span>
          <span className="bg-muted px-2 py-1 rounded">
            Statements: {(sql.match(/;/g) || []).length}
          </span>
        </div>
      </div>
    </div>
  );
}
