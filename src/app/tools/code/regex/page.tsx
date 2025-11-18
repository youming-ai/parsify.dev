"use client";

import { RegexTester } from "@/components/tools/code/regex-tester";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code } from "lucide-react";
import Link from "next/link";

export default function RegexTesterPage() {
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
        <span className="font-medium text-gray-900">Regex Tester</span>
      </nav>

      {/* Tool Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <Code className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="font-bold text-3xl text-gray-900 dark:text-white">Regex Tester</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Intermediate</Badge>
              <Badge variant="default">Stable</Badge>
            </div>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Test and debug regular expressions with real-time matching and explanation
        </p>
      </div>

      {/* Tool Component */}
      <div className="space-y-6">
        <RegexTester />

        {/* Tool Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Real-time regex testing with instant feedback
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Common regex pattern library with examples
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Support for all regex flags (g, i, m, s, u, y)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Match highlighting and group extraction
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Detailed match information with indices
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Usage Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Enter Your Pattern</h4>
              <p className="text-gray-600 text-sm">
                Type your regular expression in the pattern field. Don't include the surrounding
                slashes (/).
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Select Flags</h4>
              <p className="text-gray-600 text-sm">
                Choose regex flags to modify behavior: g (global), i (ignore case), m (multiline),
                etc.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. Test Text</h4>
              <p className="text-gray-600 text-sm">
                Enter text to test your pattern against. Results update in real-time.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. View Results</h4>
              <p className="text-gray-600 text-sm">
                See matches, groups, and highlighted text. Switch between different result views.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Regex Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Character Classes</h4>
                <ul className="space-y-1 text-sm font-mono">
                  <li>
                    <code>.</code> - Any character except newline
                  </li>
                  <li>
                    <code>\d</code> - Any digit (0-9)
                  </li>
                  <li>
                    <code>\w</code> - Any word character (a-z, A-Z, 0-9, _)
                  </li>
                  <li>
                    <code>\s</code> - Any whitespace character
                  </li>
                  <li>
                    <code>[abc]</code> - Any character in set
                  </li>
                  <li>
                    <code>[^abc]</code> - Any character not in set
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Quantifiers</h4>
                <ul className="space-y-1 text-sm font-mono">
                  <li>
                    <code>*</code> - Zero or more times
                  </li>
                  <li>
                    <code>+</code> - One or more times
                  </li>
                  <li>
                    <code>?</code> - Zero or one time
                  </li>
                  <li>
                    <code>{`{n}`}</code> - Exactly n times
                  </li>
                  <li>
                    <code>{`{n,}`}</code> - n or more times
                  </li>
                  <li>
                    <code>{`{n,m}`}</code> - n to m times
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Anchors</h4>
                <ul className="space-y-1 text-sm font-mono">
                  <li>
                    <code>^</code> - Start of string
                  </li>
                  <li>
                    <code>$</code> - End of string
                  </li>
                  <li>
                    <code>\b</code> - Word boundary
                  </li>
                  <li>
                    <code>\B</code> - Not word boundary
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3">Groups</h4>
                <ul className="space-y-1 text-sm font-mono">
                  <li>
                    <code>(abc)</code> - Capturing group
                  </li>
                  <li>
                    <code>(?:abc)</code> - Non-capturing group
                  </li>
                  <li>
                    <code>(a|b)</code> - OR condition
                  </li>
                  <li>
                    <code>\1</code> - Backreference to group 1
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
