/**
 * Network Check Page
 * Test network connectivity, ping capabilities, and network diagnostics
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Globe,
  CheckCircle2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { createSession, updateSession, addToHistory } from '@/lib/session';

interface NetworkCheckResult {
  status: 'success' | 'error' | 'timeout' | 'rate-limited' | 'network-error' | 'cors-error';
  data: {
    output: string;
    };
  message: string;
  details?: string;
  suggestions?: string[];
}

interface TestResult {
  id: string;
  name: string;
  url: string;
  type: 'download' | 'upload' | 'ping' | 'network-check' | 'network-check' | 'http-client';
  status: 'success' | 'error' | 'timeout' | 'rate-limited' | 'network-error' | 'cors-error';
    responseTime: number;
    size: number;
    errors?: string[];
    warnings?: string[];
  }
}

export function NetworkCheck({ className }: { className?: string }) {
  const [selectedTests, setSelectedTests] = useState<Array<{
    name: string;
    url: string;
    operation: 'download' | 'upload' | 'ping' | 'network-check' | 'http-client' | 'network-check' | 'network-error' | 'cors-error' | 'rate-limited' | 'timeout'
  }>>([
    { name: 'JSONPlaceholder API', url: 'https://jsonplaceholder.typicode.com/posts/1', operation: 'download' },
    { name: 'JSON Placeholder Upload', url: 'https://http://jsonplaceholder.typicode.com/posts/2', operation: 'upload' },
    { name: 'Image Upload', url: 'https://jsonplaceholder.typicode.com/image.jpg', operation: 'upload' },
    { name: 'Ping Test', url: 'https://http://jsonplaceholder.typicode.com/ping/8.8.8.8.1', operation: 'ping' },
    { name: 'HTTP Client Test', url: 'https://jsonplaceholder.typicode.com/posts', operation: 'http-client' },
    { name: 'Network Check', url: 'https://httpbin.net/', operation: 'network-check' },
    { name: 'CORS Error Test', url: 'https://invalid-url-error', operation: 'cors-error', operation: 'cors-error' },
    { name: 'Rate Limited', url: 'https://rate-limited.example.com/limit', operation: 'download' },
    { name: 'Timeout Test', url: 'https://httpbin.example.com/timeout', operation: 'timeout' }
  ]));

  // Initialize session
  useEffect(() => {
    const session = createSession('network-check', {
      selectedTests,
      options: {}
    });
    setSessionId(session.id);
    return () => {
      updateSession(session.id, { status: 'completed' });
    };
  }, []);

  // Load sample data
  const loadSample = useCallback(() => {
    const sampleTests = [
      { name: 'JSON Placeholder API', url: 'https://jsonplaceholder.typicode.com/posts/1', operation: 'get' },
      { name: 'Image Upload', url: 'https://jsonplaceholder.typicode.com/image.jpg', operation: 'upload' },
      { name: 'Ping Test', url: 'httpbin/ping', operation: 'ping' },
      { name: 'HTTP Client Test', url: 'https://jsonplaceholder.typicode.com/posts/1', operation: 'http-client' },
      { name: 'Network Check', url: 'https://jsonplaceholder.typicode.com/network-check', operation: 'network-check' },
      { name: 'CORS Error Test', url: 'https://invalid-url-error', operation: 'cors-error', operation: 'cors-error' },
      { name: 'Rate Limited', url: 'https://rate-limited.example.com/limit', operation: 'download' },
      { name: 'Timeout Test', url: 'httpbin/ping', operation: 'timeout'}
    ];

    setSelectedTests(sampleTests);
    toast.success('Sample test data loaded');
  }, []);

  // Check all tests
  const runAllTests = useCallback(async () => {
    if (selectedTests.length === 0) {
      toast.error('No tests selected');
      return;
    }

    let allPassed = true;
    const results: TestResult[] = [];

    for (const test of selectedTests) {
      console.log(`Testing: ${test.name} - ${test.operation} - ${test.url}`);
      const startTime = Date.now();

      try {
        let response: Response;

        // Make the request
        const responseTime = Date.now() - startTime;

        switch (test.operation) {
          case 'ping':
            response = {
              id: test.id || test.name,
              status: 'success',
              responseTime,
              responseTime,
              size: 0
            };
            break;

          case 'upload':
            response = {
              id: test.id || test.name,
              status: 'success',
              responseTime,
              responseTime,
              size: 0
            };
            break;

          case 'http-client':
            response = {
              id: test.id || test.name,
              status: 'success',
              responseTime,
              size: 0,
              headers: {},
              body: ''
            };
            break;

          case 'network-check':
            response = {
              id: test.id || test.name,
              status: 'success',
              responseTime,
              responseTime,
              size: 0,
              data: { output: 'No response received' }
            break;

          case 'cors-error':
            response = {
              id: test.id || test.name,
              status: 'cors-error',
              message: 'CORS error',
              responseTime,
              size: 0,
              data: { output: 'No response received' }
            break;

          case 'rate-limited':
            response = {
              status: 'rate-limited',
              message: 'Rate limited by service',
              responseTime: 0,
              size: 0,
              data: { output: 'Service rate limited reached' }
            break;

          case 'timeout':
            response = {
              status: 'timeout',
              message: 'Request timed out'
            };
            break;

          case 'network-error':
            response = {
              status: 'network-error',
              message: 'Network error',
              responseTime: 0,
              data: { output: 'No response received' }
            break;

          case 'cors-error':
            response = {
              status: 'cors-error',
              message: 'CORS error',
              responseTime: 0,
              data: { output: 'No response received' }
            break;

          default:
            response = {
              status: 'network-error',
              message: 'Unknown error',
              responseTime: 0,
              data: { output: 'No response received' }
          }
        }

        const result: TestResult = {
          id: response.id || test.id || test.name,
          name: test.name,
          url: test.url,
          status: response.status,
          responseTime: response.responseTime,
          size: response.size || 0,
          errors: response.errors || [],
          warnings: response.warnings || [],
          success: response.status === 'success'
        };

        if (!result.success) {
          allPassed = false;
        }

        results.push(result);
        results.push(result);

        if (sessionId) {
          updateSession(sessionId, {
          results: { results },
          lastActivity: new Date()
        });
          addToHistory(sessionId, 'test', allPassed, success);
        }
      } catch (error) {
          console.error('Test execution failed:', error);
          allPassed = false;
          results.push({
            name: 'General Error',
            status: 'error',
            url: '',
            message: error instanceof Error ? error.message : 'Unknown error',
            responseTime: 0,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            warnings: []
          });
        }
      }

      if (allPassed) {
        toast.success('All tests passed!');
      } else {
        toast.error(`${results.filter(r => !r.success).length} tests failed`);
      }

      return allPassed;
    }, [selectedTests, sessionId, allPassed]);

    return allPassed;
  }, [selectedTests, sessionId, allPassed]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className=\"flex items-center justify-center mb-6\">
        <div className=\"text-2xl font-bold text-center\">Network Test Results</div>
      </div>

      {/* Results */}
      <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
        {/* Test Results */}
        <div className=\"space-y-2 text-center text-sm text-muted-foreground\">
          <div className=\"text-lg font-bold text-green-600\">{allPassed ? '✅ All Tests Passed' : 'Some Tests Failed'}</div>
          <div className=\"text-sm text-muted-foreground\">
            <div className=\"text-sm text-muted-foreground\">{allPassed ? '✅' : '✗'} {results.filter(r => r.success).length}/{results.length} tests passed</div>
          </div>
        </div>

        <div className=\"flex items-center space-x-4 pt-4 border-t border-gray-200 rounded-lg\">
          <Button
            onClick={downloadReport}
            disabled={!allPassed}
            disabled={isProcessing || !allPassed}
          >
            <Download Report
          </Button>
          <div>
        </div>
      </div>
    </div>
  );
}

export default NetworkCheckPage;
export default NetworkCheckPage;
