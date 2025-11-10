'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle, Copy, History, Info, Lightbulb, Play, Search, Trash2, XCircle } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { type JsonValidationError, JsonValidationResult } from './json-types';
import { JsonViewer } from './json-viewer';

// JSONPath query interface
interface JsonPathQuery {
	id: string;
	expression: string;
	result: unknown;
	timestamp: Date;
	isValid: boolean;
	error?: string;
}

// Sample JSON data for demonstration
const SAMPLE_JSON = {
	store: {
		book: [
			{
				category: 'reference',
				author: 'Nigel Rees',
				title: 'Sayings of the Century',
				price: 8.95,
			},
			{
				category: 'fiction',
				author: 'Evelyn Waugh',
				title: 'Sword of Honour',
				price: 12.99,
			},
			{
				category: 'fiction',
				author: 'Herman Melville',
				title: 'Moby Dick',
				isbn: '0-553-21311-3',
				price: 8.99,
			},
			{
				category: 'fiction',
				author: 'J. R. R. Tolkien',
				title: 'The Lord of the Rings',
				isbn: '0-395-19395-8',
				price: 22.99,
			},
		],
		bicycle: {
			color: 'red',
			price: 19.95,
		},
	},
	expensive: 10,
};

// Common JSONPath examples
const EXAMPLE_QUERIES = [
	{
		name: 'Get all books',
		expression: '$.store.book[*]',
		description: 'Returns all books in the store',
	},
	{
		name: 'Get book titles',
		expression: '$.store.book[*].title',
		description: 'Returns all book titles',
	},
	{
		name: 'Books with price > 10',
		expression: '$.store.book[?(@.price > 10)]',
		description: 'Returns books priced over $10',
	},
	{
		name: 'Fiction books',
		expression: "$.store.book[?(@.category == 'fiction')]",
		description: 'Returns all fiction books',
	},
	{
		name: 'Book with ISBN',
		expression: '$.store.book[?(@.isbn)]',
		description: 'Returns books that have ISBN',
	},
	{
		name: 'All prices',
		expression: '$..price',
		description: 'Returns all prices using recursive descent',
	},
];

export function JsonPathQueries() {
	const [jsonInput, setJsonInput] = useState(JSON.stringify(SAMPLE_JSON, null, 2));
	const [currentExpression, setCurrentExpression] = useState('$.store.book[*]');
	const [queryHistory, setQueryHistory] = useState<JsonPathQuery[]>([]);
	const [currentResult, setCurrentResult] = useState<unknown>(null);
	const [isQuerying, setIsQuerying] = useState(false);
	const [queryError, setQueryError] = useState<string>('');
	const [jsonError, setJsonError] = useState<JsonValidationError[]>([]);

	// Parse JSON and validate
	const parseJson = useCallback((jsonString: string): unknown | null => {
		try {
			const parsed = JSON.parse(jsonString);
			setJsonError([]);
			return parsed;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
			setJsonError([
				{
					line: 1,
					column: 1,
					message: errorMessage,
					severity: 'error',
				},
			]);
			return null;
		}
	}, []);

	// Simple JSONPath evaluator (basic implementation)
	const evaluateJsonPath = useCallback((expression: string, data: unknown): unknown => {
		if (!data || typeof data !== 'object') return null;

		// Remove the root selector if present
		const cleanExpression = expression.replace(/^\$\./, '');

		try {
			// This is a simplified JSONPath implementation
			// For production, consider using a library like 'jsonpath-plus'
			const result = jsonPathQuery(cleanExpression, data);
			return result;
		} catch (error) {
			throw new Error(`Invalid JSONPath expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}, []);

	// Basic JSONPath query implementation
	const jsonPathQuery = (path: string, data: unknown): unknown => {
		if (!path) return data;

		const parts = path.split('.');
		let current: unknown = data;

		for (const part of parts) {
			if (typeof current !== 'object' || current === null) {
				return null;
			}

			// Handle array notation [*]
			if (part === '[*]') {
				if (Array.isArray(current)) {
					return current;
				}
				return null;
			}

			// Handle array with index [n]
			const arrayMatch = part.match(/^\[(\d+)\]$/);
			if (arrayMatch) {
				const index = Number.parseInt(arrayMatch[1]);
				if (Array.isArray(current) && index >= 0 && index < current.length) {
					current = current[index];
				} else {
					return null;
				}
				continue;
			}

			// Handle recursive descent ..
			if (part.startsWith('..')) {
				const propName = part.substring(2);
				const results: unknown[] = [];

				const findRecursive = (obj: unknown): void => {
					if (typeof obj === 'object' && obj !== null) {
						for (const [key, value] of Object.entries(obj)) {
							if (key === propName) {
								results.push(value);
							}
							findRecursive(value);
						}
					}
				};

				findRecursive(current);
				return results.length === 1 ? results[0] : results;
			}

			// Handle filter expressions [?(condition)]
			const filterMatch = part.match(/^\[\?\((.+)\)\]$/);
			if (filterMatch) {
				const condition = filterMatch[1];
				if (Array.isArray(current)) {
					return current.filter((item) => {
						if (typeof item !== 'object' || item === null) return false;
						return evaluateFilter(condition, item);
					});
				}
				return null;
			}

			// Regular property access
			if (part in (current as Record<string, unknown>)) {
				current = (current as Record<string, unknown>)[part];
			} else {
				return null;
			}
		}

		return current;
	};

	// Simple filter evaluator for JSONPath conditions
	const evaluateFilter = (condition: string, item: Record<string, unknown>): boolean => {
		// This is a very basic filter implementation
		// Real implementation would need proper parsing

		// Handle equality condition
		const equalityMatch = condition.match(/^@\.(\w+)\s*==\s*['"]([^'"]+)['"]$/);
		if (equalityMatch) {
			const [_, prop, value] = equalityMatch;
			return item[prop] === value;
		}

		// Handle greater than condition
		const greaterMatch = condition.match(/^@\.(\w+)\s*>\s*(\d+(?:\.\d+)?)$/);
		if (greaterMatch) {
			const [_, prop, value] = greaterMatch;
			const itemValue = item[prop];
			return typeof itemValue === 'number' && itemValue > Number.parseFloat(value);
		}

		// Handle existence condition
		const existenceMatch = condition.match(/^@\.(\w+)$/);
		if (existenceMatch) {
			const [_, prop] = existenceMatch;
			return prop in item && item[prop] !== undefined;
		}

		return false;
	};

	// Execute JSONPath query
	const executeQuery = useCallback(() => {
		const data = parseJson(jsonInput);
		if (!data) {
			setQueryError('Invalid JSON input');
			return;
		}

		setIsQuerying(true);
		setQueryError('');

		try {
			const result = evaluateJsonPath(currentExpression, data);
			setCurrentResult(result);

			// Add to history
			const query: JsonPathQuery = {
				id: Date.now().toString(),
				expression: currentExpression,
				result,
				timestamp: new Date(),
				isValid: true,
			};

			setQueryHistory((prev) => [query, ...prev.slice(0, 9)]); // Keep last 10 queries
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Query failed';
			setQueryError(errorMessage);

			// Add failed query to history
			const query: JsonPathQuery = {
				id: Date.now().toString(),
				expression: currentExpression,
				result: null,
				timestamp: new Date(),
				isValid: false,
				error: errorMessage,
			};

			setQueryHistory((prev) => [query, ...prev.slice(0, 9)]);
		} finally {
			setIsQuerying(false);
		}
	}, [jsonInput, currentExpression, parseJson, evaluateJsonPath]);

	// Clear history
	const clearHistory = useCallback(() => {
		setQueryHistory([]);
	}, []);

	// Copy result to clipboard
	const copyResult = useCallback(() => {
		if (currentResult !== null) {
			navigator.clipboard.writeText(JSON.stringify(currentResult, null, 2));
		}
	}, [currentResult]);

	// Load example
	const loadExample = useCallback((example: (typeof EXAMPLE_QUERIES)[0]) => {
		setCurrentExpression(example.expression);
	}, []);

	// Load history query
	const loadHistoryQuery = useCallback((query: JsonPathQuery) => {
		setCurrentExpression(query.expression);
		if (query.isValid) {
			setCurrentResult(query.result);
		}
	}, []);

	// Initialize with default query
	useEffect(() => {
		const data = parseJson(jsonInput);
		if (data) {
			try {
				const result = evaluateJsonPath(currentExpression, data);
				setCurrentResult(result);
			} catch (error) {
				// Ignore initial errors
			}
		}
	}, []);

	return (
		<div className="space-y-6">
			{/* Input Section */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* JSON Input */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Info className="h-5 w-5" />
							JSON Input
						</CardTitle>
						<CardDescription>Enter or paste your JSON data to query</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="relative">
								<textarea
									value={jsonInput}
									onChange={(e) => setJsonInput(e.target.value)}
									placeholder="Enter JSON data..."
									className="w-full h-64 p-3 font-mono text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								{jsonError.length > 0 && (
									<div className="absolute top-2 right-2">
										<XCircle className="h-5 w-5 text-red-500" />
									</div>
								)}
							</div>
							{jsonError.length > 0 && (
								<Alert variant="destructive">
									<XCircle className="h-4 w-4" />
									<AlertDescription>{jsonError[0]?.message || 'Invalid JSON'}</AlertDescription>
								</Alert>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Query Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Search className="h-5 w-5" />
							JSONPath Query
						</CardTitle>
						<CardDescription>Enter JSONPath expression to query your data</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="expression">Expression</Label>
								<div className="flex gap-2">
									<Input
										id="expression"
										value={currentExpression}
										onChange={(e) => setCurrentExpression(e.target.value)}
										placeholder="$.store.book[*]"
										className="font-mono"
									/>
									<Button onClick={executeQuery} disabled={isQuerying || !jsonInput.trim()}>
										{isQuerying ? (
											<div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
										) : (
											<Play className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>

							{queryError && (
								<Alert variant="destructive">
									<XCircle className="h-4 w-4" />
									<AlertDescription>{queryError}</AlertDescription>
								</Alert>
							)}

							{/* Quick Examples */}
							<div className="space-y-2">
								<Label>Quick Examples</Label>
								<div className="grid gap-2">
									{EXAMPLE_QUERIES.slice(0, 3).map((example) => (
										<div key={example.name} className="flex items-center gap-2 p-2 border rounded">
											<Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
											<div className="flex-1 min-w-0">
												<div className="font-medium text-sm">{example.name}</div>
												<div className="text-xs text-gray-500 truncate">{example.expression}</div>
											</div>
											<Button size="sm" variant="outline" onClick={() => loadExample(example)}>
												Use
											</Button>
										</div>
									))}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Results Section */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5" />
							Query Result
						</div>
						{currentResult !== null && (
							<Button size="sm" variant="outline" onClick={copyResult}>
								<Copy className="h-4 w-4 mr-2" />
								Copy
							</Button>
						)}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{currentResult !== null ? (
						<ScrollArea className="h-64 border rounded-lg p-4">
							<JsonViewer data={currentResult} />
						</ScrollArea>
					) : (
						<div className="text-center py-8 text-gray-500">
							Enter a JSONPath expression and click Execute to see results
						</div>
					)}
				</CardContent>
			</Card>

			{/* Additional Tabs */}
			<Tabs defaultValue="examples" className="w-full">
				<TabsList>
					<TabsTrigger value="examples">Examples</TabsTrigger>
					<TabsTrigger value="history">History</TabsTrigger>
					<TabsTrigger value="reference">Reference</TabsTrigger>
				</TabsList>

				<TabsContent value="examples" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BookOpen className="h-5 w-5" />
								JSONPath Examples
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3">
								{EXAMPLE_QUERIES.map((example) => (
									<div key={example.name} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
										<div className="flex-1">
											<div className="font-medium">{example.name}</div>
											<div className="text-sm text-gray-600">{example.description}</div>
											<div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">{example.expression}</div>
										</div>
										<Button size="sm" onClick={() => loadExample(example)}>
											<Play className="h-4 w-4 mr-2" />
											Run
										</Button>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<History className="h-5 w-5" />
									Query History
								</div>
								{queryHistory.length > 0 && (
									<Button size="sm" variant="outline" onClick={clearHistory}>
										<Trash2 className="h-4 w-4 mr-2" />
										Clear
									</Button>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{queryHistory.length > 0 ? (
								<div className="space-y-3">
									{queryHistory.map((query) => (
										<div
											key={query.id}
											className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
											onClick={() => loadHistoryQuery(query)}
										>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<Badge variant={query.isValid ? 'default' : 'destructive'}>
														{query.isValid ? 'Success' : 'Error'}
													</Badge>
													<span className="font-mono text-sm truncate">{query.expression}</span>
												</div>
												<div className="text-xs text-gray-500">{query.timestamp.toLocaleTimeString()}</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-center py-8 text-gray-500">
									No queries yet. Execute some queries to see history.
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="reference" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BookOpen className="h-5 w-5" />
								JSONPath Reference
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<h4 className="font-semibold mb-2">Basic Operators</h4>
									<div className="space-y-2 text-sm">
										<div className="font-mono bg-gray-100 p-2 rounded">$ - Root node</div>
										<div className="font-mono bg-gray-100 p-2 rounded">. - Child operator</div>
										<div className="font-mono bg-gray-100 p-2 rounded">.. - Recursive descent</div>
										<div className="font-mono bg-gray-100 p-2 rounded">[*] - Wildcard for array elements</div>
									</div>
								</div>

								<Separator />

								<div>
									<h4 className="font-semibold mb-2">Filter Expressions</h4>
									<div className="space-y-2 text-sm">
										<div className="font-mono bg-gray-100 p-2 rounded">[?(@.property == 'value')] - Equality</div>
										<div className="font-mono bg-gray-100 p-2 rounded">[?(@.price {'>'} 10)] - Greater than</div>
										<div className="font-mono bg-gray-100 p-2 rounded">[?(@.property)] - Property exists</div>
									</div>
								</div>

								<Separator />

								<div>
									<h4 className="font-semibold mb-2">Array Access</h4>
									<div className="space-y-2 text-sm">
										<div className="font-mono bg-gray-100 p-2 rounded">[0] - First element</div>
										<div className="font-mono bg-gray-100 p-2 rounded">[-1] - Last element</div>
										<div className="font-mono bg-gray-100 p-2 rounded">[0,1] - Multiple elements</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
