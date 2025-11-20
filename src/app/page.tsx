"use client";

import {
  Code,
  Database,
  FileText,
  Hash,
  Image,
  Palette,
  Settings,
  Shield,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { toolsData } from "@/data/tools-data";
import type { Tool } from "@/types/tools";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileJson: Database,
  DataObject: Database,
  CheckCircle: Hash,
  Route: Database,
  Database,
  Code,
  Terminal,
  Pattern: Database,
  Http: Settings,
  Link: Database,
  BugReport: Code,
  Image,
  Palette,
  Password: Hash,
  Difference: FileText,
  FormatAlignLeft: FileText,
  TextFields: FileText,
  Schedule: Hash,
  Fingerprint: Hash,
  EnhancedEncryption: Shield,
  Hash: Shield,
  QrCode: Database,
};

export default function Home() {
  // Use all tools directly since search is removed
  const filteredTools = toolsData;

  // Get tools by category for display
  const getToolsForCategory = (categoryName: string) => {
    return filteredTools.filter((tool) => tool.category === categoryName);
  };

  // Get tools for subcategory
  const getToolsForSubcategory = (categoryName: string, subcategoryName: string) => {
    return filteredTools.filter(
      (tool) => tool.category === categoryName && tool.subcategory === subcategoryName,
    );
  };

  // Get tool count for display
  const getToolCount = (categoryName: string, subcategoryName?: string) => {
    if (subcategoryName) {
      return filteredTools.filter(
        (tool) => tool.category === categoryName && tool.subcategory === subcategoryName,
      ).length;
    }
    return filteredTools.filter((tool) => tool.category === categoryName).length;
  };

  const ToolCard = ({ tool }: { tool: Tool }) => {
    const IconComponent = iconMap[tool.icon] || Database;

    return (
      <Link
        href={tool.href}
        className="flex flex-1 gap-2 sm:gap-3 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 items-center hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-200 group"
      >
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 dark:text-white text-sm sm:text-base font-bold leading-tight truncate">
            {tool.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 truncate hidden sm:block">
            {tool.description}
          </p>
        </div>
        <div className="flex-shrink-0 ml-auto flex items-center gap-1">
          {tool.isNew && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              New
            </Badge>
          )}
          {tool.isPopular && (
            <Badge
              variant="outline"
              className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700"
            >
              Popular
            </Badge>
          )}
        </div>
      </Link>
    );
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <main className="flex flex-col gap-6 sm:gap-8">
            {/* JSON Tools Section */}
            <section>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full"></div>
                  <h2 className="text-gray-900 dark:text-white text-xl font-bold">JSON Tools</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    7 tools
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getToolsForCategory("JSON Tools").map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>

            {/* Common/Auxiliary Tools Section */}
            <section>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full"></div>
                  <h2 className="text-gray-900 dark:text-white text-xl font-bold">
                    Common/Auxiliary Tools
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {getToolCount("Common/Auxiliary Tools")} tools
                  </span>
                </div>
              </div>

              {/* Formatting Subcategory */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-3">
                  Formatting
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getToolsForSubcategory("Common/Auxiliary Tools", "Formatting").map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>

              {/* Online Language Support Subcategory */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-3">
                  Online Language Support
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getToolsForSubcategory("Common/Auxiliary Tools", "Online Language Support").map(
                    (tool) => (
                      <ToolCard key={tool.id} tool={tool} />
                    ),
                  )}
                </div>
              </div>

              {/* Other Tools Subcategory */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-3">
                  Other Tools
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getToolsForSubcategory("Common/Auxiliary Tools", "Other Tools").map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            </section>

            {/* Image/Media Tools Section */}
            <section>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full"></div>
                  <h2 className="text-gray-900 dark:text-white text-xl font-bold">
                    Image/Media Tools
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {getToolCount("Image/Media Tools")} tools
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getToolsForCategory("Image/Media Tools").map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>

            {/* Network/Ops/Encoding Tools Section */}
            <section>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full"></div>
                  <h2 className="text-gray-900 dark:text-white text-xl font-bold">
                    Network/Ops/Encoding Tools
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {getToolCount("Network/Ops/Encoding Tools")} tools
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getToolsForCategory("Network/Ops/Encoding Tools").map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>

            {/* Text Tools Section */}
            <section>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full"></div>
                  <h2 className="text-gray-900 dark:text-white text-xl font-bold">Text Tools</h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {getToolCount("Text Tools")} tools
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getToolsForCategory("Text Tools").map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>

            {/* Encryption/Hashing/Generation Section */}
            <section>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full"></div>
                  <h2 className="text-gray-900 dark:text-white text-xl font-bold">
                    Encryption/Hashing/Generation
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    {getToolCount("Encryption/Hashing/Generation")} tools
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getToolsForCategory("Encryption/Hashing/Generation").map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
