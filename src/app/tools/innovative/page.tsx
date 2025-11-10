"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon, ICONS } from "@/components/ui/material-symbols";
import { toolsData } from "@/data/tools-data";
import type { Tool } from "@/types/tools";

// Tool categories organized as specified
const toolCategories = {
  "JSON Tools": {
    description: "JSON processing, validation, and conversion utilities",
    icon: "JSON",
    color: "blue",
    tools: [
      "json-formatter",
      "json-validator",
      "json-converter",
      "json-path-queries",
      "json-editor",
      "json-sorter",
      "jwt-decoder",
      "json-schema-generator",
      "json5-parser",
      "json-hero-visualizer",
      "json-minifier",
    ],
  },
  "Common/Auxiliary Tools": {
    description: "Formatting tools and language support utilities",
    icon: "FORMATTER",
    color: "green",
    subcategories: {
      Formatting: ["code-formatter", "text-formatter"],
      "Online Language Support": [
        "code-executor",
        "regex-tester",
        "code-editor",
      ],
      "Other Tools": ["url-parser", "jwt-debugger", "meta-tag-generator"],
    },
  },
  "Image/Media Tools": {
    description: "Image processing and media conversion tools",
    icon: "IMAGE",
    color: "purple",
    tools: [
      "base64-converter",
      "color-converter",
      "image-compressor",
      "qr-generator",
      "ocr-tool",
    ],
  },
  "Network/Ops/Encoding Tools": {
    description: "Network utilities and encoding/decoding tools",
    icon: "NETWORK",
    color: "cyan",
    tools: [
      "url-encoder",
      "base64-converter",
      "http-client",
      "ip-lookup",
      "network-check",
      "meta-tag-generator",
    ],
  },
  "Text Tools": {
    description: "Text processing and manipulation utilities",
    icon: "TEXT",
    color: "orange",
    tools: [
      "text-processor",
      "text-encoder",
      "text-formatter",
      "text-comparator",
      "text-generator",
      "code-comparator",
    ],
  },
  "Encryption/Hashing/Generation": {
    description: "Security, encryption, and data generation tools",
    icon: "SECURITY",
    color: "red",
    tools: [
      "hash-generator",
      "password-generator",
      "file-encryptor",
      "uuid-generator",
      "code-obfuscator",
    ],
  },
};

// Helper function to get tools by IDs
const getToolsByIds = (ids: string[]): Tool[] => {
  return ids
    .map((id) => toolsData.find((tool) => tool.id === id))
    .filter(Boolean) as Tool[];
};

export default function InnovativeToolsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [filteredTools, setFilteredTools] = useState<Tool[]>(toolsData);

  // Check system dark mode preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDarkMode =
        localStorage.getItem("darkMode") === "true" ||
        (!localStorage.getItem("darkMode") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setDarkMode(isDarkMode);
      if (isDarkMode) {
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("darkMode", newDarkMode.toString());
      if (newDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  // Search functionality
  useEffect(() => {
    if (!searchQuery) {
      setFilteredTools(toolsData);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = toolsData.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        tool.category.toLowerCase().includes(query),
    );
    setFilteredTools(filtered);
  }, [searchQuery]);

  // Navigate to tool
  const navigateToTool = (href: string) => {
    router.push(href);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo and Site Name */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Icon name="CODE" className="text-white text-2xl" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Parsify.dev
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Developer Tools
                  </p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                  <Icon
                    name="SEARCH"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <Input
                    type="text"
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle dark mode"
              >
                <Icon
                  name={darkMode ? "LIGHT_MODE" : "DARK_MODE"}
                  className="text-xl"
                />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Title and Description */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Professional Developer Tools
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Comprehensive suite of browser-based developer tools for JSON
              processing, code execution, file conversion, and more. All tools
              run securely in your browser with complete privacy.
            </p>
            <div className="flex justify-center items-center space-x-4 mt-6">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {toolsData.length}+ Tools
              </Badge>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                100% Client-side
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                No Data Tracking
              </Badge>
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">
                Search Results ({filteredTools.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
                    onClick={() => navigateToTool(tool.href)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Icon
                            name={tool.icon as keyof typeof ICONS}
                            className="text-white text-sm"
                          />
                        </div>
                        <CardTitle className="text-sm">{tool.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs">
                        {tool.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tool.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tool Categories */}
          {!searchQuery && (
            <div className="space-y-12">
              {Object.entries(toolCategories).map(
                ([categoryName, categoryData]) => (
                  <div key={categoryName}>
                    {/* Category Header */}
                    <div className="flex items-center space-x-3 mb-6">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${categoryData.color === "blue" ? "bg-blue-500" : categoryData.color === "green" ? "bg-green-500" : categoryData.color === "purple" ? "bg-purple-500" : categoryData.color === "cyan" ? "bg-cyan-500" : categoryData.color === "orange" ? "bg-orange-500" : "bg-red-500"}`}
                      >
                        <Icon
                          name={categoryData.icon as keyof typeof ICONS}
                          className="text-white text-xl"
                        />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {categoryName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {categoryData.description}
                        </p>
                      </div>
                    </div>

                    {/* Tools Grid */}
                    {"tools" in categoryData ? (
                      // Regular category with tools
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {getToolsByIds(categoryData.tools as string[]).map(
                          (tool) => (
                            <Card
                              key={tool.id}
                              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
                              onClick={() => navigateToTool(tool.href)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <Icon
                                      name={tool.icon as keyof typeof ICONS}
                                      className="text-white text-sm"
                                    />
                                  </div>
                                  <CardTitle className="text-sm">
                                    {tool.name}
                                  </CardTitle>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <CardDescription className="text-xs">
                                  {tool.description}
                                </CardDescription>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {tool.tags.slice(0, 2).map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ),
                        )}
                      </div>
                    ) : (
                      // Category with subcategories
                      <div className="space-y-8">
                        {Object.entries(categoryData.subcategories).map(
                          ([subcatName, subcatTools]) => (
                            <div key={subcatName}>
                              <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                                {subcatName}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {getToolsByIds(subcatTools as string[]).map(
                                  (tool) => (
                                    <Card
                                      key={tool.id}
                                      className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10"
                                      onClick={() => navigateToTool(tool.href)}
                                    >
                                      <CardHeader className="pb-3">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <Icon
                                              name={
                                                tool.icon as keyof typeof ICONS
                                              }
                                              className="text-white text-sm"
                                            />
                                          </div>
                                          <CardTitle className="text-sm">
                                            {tool.name}
                                          </CardTitle>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="pt-0">
                                        <CardDescription className="text-xs">
                                          {tool.description}
                                        </CardDescription>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {tool.tags.slice(0, 2).map((tag) => (
                                            <Badge
                                              key={tag}
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ),
                                )}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Icon name="CODE" className="text-white text-sm" />
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">
                    Parsify.dev
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Professional developer tools that respect your privacy.
                </p>
              </div>

              {/* Tools */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Tools
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/tools"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      All Tools
                    </a>
                  </li>
                  <li>
                    <a
                      href="/tools/json/formatter"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      JSON Tools
                    </a>
                  </li>
                  <li>
                    <a
                      href="/tools/code/executor"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Code Tools
                    </a>
                  </li>
                  <li>
                    <a
                      href="/tools/file/converter"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      File Tools
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Resources
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/docs"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a
                      href="/api"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a
                      href="/examples"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Examples
                    </a>
                  </li>
                  <li>
                    <a
                      href="/blog"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Blog
                    </a>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Company
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/about"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      About
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="/terms"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="/contact"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2024 Parsify.dev. All rights reserved. Built with ❤️ for
                developers.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
