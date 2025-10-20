'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileJson,
  Code,
  Wrench,
  Hash,
  FileText,
  Clock,
  Star,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const toolCategories = [
  {
    title: 'JSON Tools',
    icon: FileJson,
    items: [
      { name: 'JSON Formatter', href: '/tools/json/format', description: 'Format and prettify JSON data' },
      { name: 'JSON Validator', href: '/tools/json/validate', description: 'Validate JSON syntax' },
      { name: 'JSON Converter', href: '/tools/json/convert', description: 'Convert JSON to other formats' },
      { name: 'JSON Minifier', href: '/tools/json/minify', description: 'Compress JSON data' },
      { name: 'JSON to CSV', href: '/tools/json/to-csv', description: 'Convert JSON to CSV' },
      { name: 'CSV to JSON', href: '/tools/json/from-csv', description: 'Convert CSV to JSON' },
    ]
  },
  {
    title: 'Code Tools',
    icon: Code,
    items: [
      { name: 'Code Formatter', href: '/tools/code/format', description: 'Format code in multiple languages' },
      { name: 'Code Executor', href: '/tools/code/execute', description: 'Run JavaScript and Python code' },
      { name: 'Code Minifier', href: '/tools/code/minify', description: 'Minify JavaScript/CSS code' },
    ]
  },
  {
    title: 'Text Tools',
    icon: FileText,
    items: [
      { name: 'Base64 Encoder', href: '/tools/text/base64', description: 'Encode/decode Base64' },
      { name: 'URL Encoder', href: '/tools/text/url', description: 'Encode/decode URLs' },
      { name: 'Hash Generator', href: '/tools/text/hash', description: 'Generate MD5, SHA hashes' },
      { name: 'UUID Generator', href: '/tools/text/uuid', description: 'Generate UUIDs' },
      { name: 'Timestamp Converter', href: '/tools/text/timestamp', description: 'Convert Unix timestamps' },
    ]
  }
]

const quickActions = [
  { name: 'Recent Tools', href: '/tools/recent', icon: Clock },
  { name: 'Favorites', href: '/tools/favorites', icon: Star },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['JSON Tools'])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="">Tools</span>
          </Link>
        </div>

        <ScrollArea className="flex-1 px-3 py-2">
          <div className="space-y-2">
            {/* Quick Actions */}
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Quick Access
              </h2>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <Button
                    key={action.href}
                    variant={pathname === action.href ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href={action.href}>
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            {/* Tool Categories */}
            {toolCategories.map((category) => (
              <div key={category.title} className="px-3 py-2">
                <Button
                  variant="ghost"
                  className="w-full justify-between px-4"
                  onClick={() => toggleCategory(category.title)}
                >
                  <div className="flex items-center">
                    <category.icon className="mr-2 h-4 w-4" />
                    <span className="font-medium">{category.title}</span>
                  </div>
                  {expandedCategories.includes(category.title) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                {expandedCategories.includes(category.title) && (
                  <div className="mt-1 space-y-1 pl-10">
                    {category.items.map((item) => (
                      <Button
                        key={item.href}
                        variant={pathname === item.href ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-sm h-8"
                        asChild
                      >
                        <Link href={item.href} title={item.description}>
                          {item.name}
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-auto p-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="text-sm font-medium">Pro Features</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Unlock advanced tools and higher limits with our Pro plan.
            </p>
            <Button size="sm" className="mt-2 w-full" asChild>
              <Link href="/pricing">Upgrade Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}