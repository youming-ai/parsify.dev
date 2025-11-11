/**
 * Accessibility Tester Component
 * Interactive screen reader testing and validation interface
 */

import React, { useState, useEffect } from 'react';
import { ScreenReaderTestSuite, ScreenReaderTestSuiteResult, AccessibilityRecommendation } from '@/lib/screen-reader-testing';
import { useScreenReader } from '@/lib/screen-reader';

interface AccessibilityTesterProps {
	enableRealtimeTesting?: boolean;
	autoRunOnMount?: boolean;
	showRecommendations?: boolean;
	showDetailedResults?: boolean;
	className?: string;
}

export function AccessibilityTester({
	enableRealtimeTesting = false,
	autoRunOnMount = false,
	showRecommendations = true,
	showDetailedResults = true,
	className = '',
}: AccessibilityTesterProps) {
	const [isRunning, setIsRunning] = useState(false);
	const [lastResult, setLastResult] = useState<ScreenReaderTestSuiteResult | null>(null);
	const [realtimeResults, setRealtimeResults] = useState<ScreenReaderTestSuiteResult[]>([]);
	const [currentTestIndex, setCurrentTestIndex] = useState(0);
	const [testProgress, setTestProgress] = useState(0);
	const { announce } = useScreenReader();

	const testSuite = ScreenReaderTestSuite.getInstance();

	useEffect(() => {
		if (autoRunOnMount && !lastResult) {
			runFullTest();
		}
	}, [autoRunOnMount]);

	const runFullTest = async () => {
		setIsRunning(true);
		setTestProgress(0);

		try {
			announce('Starting accessibility test suite', { priority: 'polite' });

			const result = await testSuite.runFullTestSuite();

			setLastResult(result);
			setIsRunning(false);
			setTestProgress(100);

			announce(`Accessibility testing completed with score ${result.overallScore}/100`, { priority: 'polite' });
		} catch (error) {
			console.error('Test suite failed:', error);
			announceError('Accessibility testing failed. Please try again.');
			setIsRunning(false);
		}
	};

	const announceError = (message: string) => {
		announce(`Error: ${message}`, { priority: 'assertive' });
	};

	const getScoreColor = (score: number) => {
		if (score >= 90) return 'text-green-600';
		if (score >= 70) return 'text-yellow-600';
		return 'text-red-600';
	};

	const getScoreBgColor = (score: number) => {
		if (score >= 90) return 'bg-green-100';
		if (score >= 70) return 'bg-yellow-100';
		return 'bg-red-100';
	};

	const getComplianceBadge = (level: string, certified: boolean) => {
		const colors = {
			AAA: certified ? 'bg-purple-100 text-purple-800' : 'bg-purple-50 text-purple-600',
			AA: certified ? 'bg-blue-100 text-blue-800' : 'bg-blue-50 text-blue-600',
			A: certified ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-600',
		};

		return (
			<span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[level as keyof typeof colors]}`}>
				WCAG {level} {certified ? '✓' : ''}
			</span>
		);
	};

	return (
		<div className={`accessibility-tester ${className}`}>
			<div className="bg-white rounded-lg shadow-lg border border-gray-200">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold text-gray-900">Accessibility Testing</h2>
							<p className="text-sm text-gray-600 mt-1">
								Screen reader compatibility and WCAG compliance validation
							</p>
						</div>
						{enableRealtimeTesting && (
							<div className="flex items-center space-x-2">
								<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
								<span className="text-sm text-gray-600">Real-time testing enabled</span>
							</div>
						)}
					</div>
				</div>

				{/* Test Controls */}
				<div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
					<div className="flex items-center justify-between">
						<div className="flex space-x-3">
							<button
								onClick={runFullTest}
								disabled={isRunning}
								className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{isRunning ? 'Testing...' : 'Run Full Test Suite'}
							</button>

							{lastResult && (
								<button
									onClick={() => setLastResult(null)}
									className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
								>
									Clear Results
								</button>
							)}
						</div>

						{isRunning && (
							<div className="flex items-center space-x-3">
								<div className="text-sm text-gray-600">Testing in progress...</div>
								<div className="w-32 bg-gray-200 rounded-full h-2">
									<div
										className="bg-blue-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${testProgress}%` }}
									></div>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Results */}
				{lastResult && (
					<div className="px-6 py-4">
						{/* Overall Score */}
						<div className="mb-6">
							<div className="flex items-center justify-between mb-2">
								<h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
								<div className="flex items-center space-x-3">
									{getComplianceBadge(lastResult.complianceStatus.level, lastResult.complianceStatus.certified)}
									<span className={`text-2xl font-bold ${getScoreColor(lastResult.overallScore)}`}>
										{lastResult.overallScore}/100
									</span>
								</div>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-4">
								<div
									className={`h-4 rounded-full transition-all duration-500 ${
										lastResult.overallScore >= 90 ? 'bg-green-500' :
										lastResult.overallScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
									}`}
									style={{ width: `${lastResult.overallScore}%` }}
								></div>
							</div>
						</div>

						{/* Test Summary */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							<div className={`p-4 rounded-lg ${getScoreBgColor(lastResult.overallScore)}`}>
								<div className="text-2xl font-bold">{lastResult.summary.totalTests}</div>
								<div className="text-sm text-gray-600">Total Tests</div>
							</div>
							<div className="bg-green-50 p-4 rounded-lg">
								<div className="text-2xl font-bold text-green-600">{lastResult.summary.passedTests}</div>
								<div className="text-sm text-gray-600">Passed</div>
							</div>
							<div className="bg-red-50 p-4 rounded-lg">
								<div className="text-2xl font-bold text-red-600">{lastResult.summary.failedTests}</div>
								<div className="text-sm text-gray-600">Failed</div>
							</div>
							<div className="bg-yellow-50 p-4 rounded-lg">
								<div className="text-2xl font-bold text-yellow-600">{lastResult.summary.totalIssues}</div>
								<div className="text-sm text-gray-600">Issues Found</div>
							</div>
						</div>

						{/* Issue Breakdown */}
						{lastResult.summary.totalIssues > 0 && (
							<div className="mb-6">
								<h4 className="text-md font-semibold text-gray-900 mb-3">Issue Breakdown</h4>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="flex items-center space-x-2">
										<div className="w-3 h-3 bg-red-600 rounded-full"></div>
										<span className="text-sm">Critical: {lastResult.summary.criticalIssues}</span>
									</div>
									<div className="flex items-center space-x-2">
										<div className="w-3 h-3 bg-orange-600 rounded-full"></div>
										<span className="text-sm">Serious: {lastResult.summary.seriousIssues}</span>
									</div>
									<div className="flex items-center space-x-2">
										<div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
										<span className="text-sm">Moderate: {lastResult.summary.moderateIssues}</span>
									</div>
									<div className="flex items-center space-x-2">
										<div className="w-3 h-3 bg-blue-600 rounded-full"></div>
										<span className="text-sm">Minor: {lastResult.summary.minorIssues}</span>
									</div>
								</div>
							</div>
						)}

						{/* Recommendations */}
						{showRecommendations && lastResult.recommendations.length > 0 && (
							<div className="mb-6">
								<h4 className="text-md font-semibold text-gray-900 mb-3">Recommendations</h4>
								<div className="space-y-3">
									{lastResult.recommendations.slice(0, 5).map((rec) => (
										<div key={rec.id} className="border border-gray-200 rounded-lg p-4">
											<div className="flex items-start justify-between mb-2">
												<h5 className="font-medium text-gray-900">{rec.title}</h5>
												<div className="flex space-x-2">
													<span className={`px-2 py-1 text-xs font-medium rounded ${
														rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
														rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
														rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
														'bg-gray-100 text-gray-800'
													}`}>
														{rec.priority}
													</span>
													<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
														WCAG {rec.wcagLevel}
													</span>
												</div>
											</div>
											<p className="text-sm text-gray-600 mb-2">{rec.description}</p>
											<div className="flex items-center space-x-4 text-xs text-gray-500">
												<span>Impact: {rec.impact}</span>
												<span>Effort: {rec.effort}</span>
												<span>{rec.issues.length} issues</span>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Detailed Results */}
						{showDetailedResults && (
							<div>
								<h4 className="text-md font-semibold text-gray-900 mb-3">Test Results by Category</h4>
								<div className="space-y-4">
									{lastResult.categories.map((category) => {
										const categoryResults = lastResult.results.filter(r => r.category === category.id);
										const passed = categoryResults.filter(r => r.status === 'passed').length;
										const total = categoryResults.length;
										const score = total > 0 ? Math.round(categoryResults.reduce((sum, r) => sum + r.score, 0) / total) : 0;

										return (
											<div key={category.id} className="border border-gray-200 rounded-lg p-4">
												<div className="flex items-center justify-between mb-3">
													<div>
														<h5 className="font-medium text-gray-900">{category.name}</h5>
														<p className="text-sm text-gray-600">{category.description}</p>
													</div>
													<div className="text-right">
														<div className={`text-lg font-bold ${getScoreColor(score)}`}>
															{score}/100
														</div>
														<div className="text-sm text-gray-600">
															{passed}/{total} passed
														</div>
													</div>
												</div>
												<div className="w-full bg-gray-200 rounded-full h-2 mb-3">
													<div
														className={`h-2 rounded-full ${
															score >= 90 ? 'bg-green-500' :
															score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
														}`}
														style={{ width: `${score}%` }}
													></div>
												</div>
												{categoryResults.length > 0 && (
													<details className="text-sm">
														<summary className="cursor-pointer text-blue-600 hover:text-blue-800">
															View detailed results
														</summary>
														<div className="mt-2 space-y-2">
															{categoryResults.map((result) => (
																<div key={result.testId} className="pl-4 border-l-2 border-gray-200">
																	<div className="flex items-center justify-between">
																		<span className="font-medium">{result.testName}</span>
																		<span className={`text-xs px-2 py-1 rounded ${
																			result.status === 'passed' ? 'bg-green-100 text-green-800' :
																			result.status === 'failed' ? 'bg-red-100 text-red-800' :
																			'bg-gray-100 text-gray-800'
																		}`}>
																			{result.status}
																		</span>
																	</div>
																	{result.issues.length > 0 && (
																		<div className="mt-1 text-xs text-gray-600">
																			{result.issues.length} issue{result.issues.length !== 1 ? 's' : ''} found
																		</div>
																	)}
																</div>
															))}
														</div>
													</details>
												)}
											</div>
										);
									})}
								</div>
							</div>
						)}

						{/* Export Results */}
						<div className="mt-6 pt-4 border-t border-gray-200">
							<div className="flex items-center justify-between">
								<div className="text-sm text-gray-600">
									Test completed on {lastResult.timestamp.toLocaleString()}
								</div>
								<div className="flex space-x-2">
									<button
										onClick={() => exportResults('json')}
										className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
									>
										Export JSON
									</button>
									<button
										onClick={() => exportResults('csv')}
										className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
									>
										Export CSV
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Empty State */}
				{!lastResult && !isRunning && (
					<div className="px-6 py-12 text-center">
						<div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
							<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No Test Results Yet</h3>
						<p className="text-gray-600 mb-4">
							Run the accessibility test suite to evaluate screen reader compatibility and WCAG compliance
						</p>
						<button
							onClick={runFullTest}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Run Full Test Suite
						</button>
					</div>
				)}
			</div>

			{/* Testing Info Panel */}
			<div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h4 className="text-sm font-semibold text-blue-900 mb-2">About This Test</h4>
				<ul className="text-sm text-blue-800 space-y-1">
					<li>• Tests for WCAG 2.1 AA compliance</li>
					<li>• Evaluates screen reader compatibility</li>
					<li>• Checks for proper ARIA implementation</li>
					<li>• Validates focus management and keyboard navigation</li>
					<li>• Assesses form accessibility and live regions</li>
				</ul>
			</div>
		</div>
	);

	function exportResults(format: 'json' | 'csv') {
		if (!lastResult) return;

		if (format === 'json') {
			const dataStr = JSON.stringify(lastResult, null, 2);
			const dataBlob = new Blob([dataStr], { type: 'application/json' });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `accessibility-test-${Date.now()}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} else if (format === 'csv') {
			const headers = ['Test Name', 'Category', 'Status', 'Score', 'Issues'];
			const rows = lastResult.results.map(result => [
				result.testName,
				result.category,
				result.status,
				result.score.toString(),
				result.issues.length.toString()
			]);

			const csvContent = [
				headers.join(','),
				...rows.map(row => row.join(','))
			].join('\n');

			const dataBlob = new Blob([csvContent], { type: 'text/csv' });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `accessibility-test-${Date.now()}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}

		announce(`Test results exported as ${format.toUpperCase()}`, { priority: 'polite' });
	}
}

export default AccessibilityTester;
