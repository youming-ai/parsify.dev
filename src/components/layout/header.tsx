"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 !bg-transparent"
      style={{ backgroundColor: "transparent" }}
    >
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-full">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center space-x-3 text-lg font-bold text-gray-900 dark:text-white group"
        >
          <div className="relative">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                {/* Simplified logo */}
                <path d="M3 4L8 2L13 4L13 8L8 10L3 8L3 4Z" fill="currentColor" fillOpacity="0.9" />
                <path d="M3 8L8 10L8 14L3 12L3 8Z" fill="currentColor" fillOpacity="0.7" />
                <path d="M13 8L8 10L8 14L13 12L13 8Z" fill="currentColor" fillOpacity="0.5" />
              </svg>
            </div>
            {/* Subtle glow effect */}
            <div className="absolute -inset-0.5 bg-blue-600/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Parsify.dev
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
              26+ Tools
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
