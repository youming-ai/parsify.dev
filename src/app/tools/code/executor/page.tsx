"use client";

import { CodeToolComplete } from "@/components/tools/code/code-tool-complete";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal } from "lucide-react";
import Link from "next/link";

export default function CodeExecutorPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center space-x-2 text-gray-600 text-sm">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-gray-900">
          Tools
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">Code Executor</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Terminal className="h-8 w-8 text-green-600" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900 dark:text-white">Code Executor</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Intermediate</Badge>
              <Badge variant="default">Stable</Badge>
              <Badge variant="outline">Popular</Badge>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Execute code in a secure WASM sandbox with multiple language support
        </p>
      </div>

      {/* Tool Component */}
      <CodeToolComplete />

      {/* Tool Features */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Multi-language Support</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Secure Sandboxing</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Real-time Output</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-green-600"></div>
                <span className="text-gray-700 dark:text-gray-300">Debug Mode</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Category:</span>{" "}
              <span className="text-gray-600 dark:text-gray-400">Code Execution</span>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Processing:</span>{" "}
              <span className="text-gray-600 dark:text-gray-400">Client Side</span>
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Security:</span>{" "}
              <span className="text-gray-600 dark:text-gray-400">Secure Sandbox</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/tools/code/formatter"
                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <Terminal className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">Code Formatter</h4>
                    <p className="text-gray-600 text-sm dark:text-gray-400">
                      Format and beautify code in multiple programming languages
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
