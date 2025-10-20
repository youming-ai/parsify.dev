'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  FileJson,
  Terminal,
  Code,
  FileText,
  Hash,
  Zap,
  Settings,
  ChevronRight,
  Star,
  Clock,
  Shield,
  Play,
  Cpu,
  Database,
  Lock,
  Globe,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MainLayout } from '@/components/layout/main-layout'
import { toolsData, categories } from '@/data/tools-data'
import type { Tool } from '@/types/tools'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileJson,
  Terminal,
  Code,
  FileText,
  Hash,
  Zap,
  Settings,
  Shield,
  Play,
  Cpu,
  Database,
  Lock,
  Globe,
  Clock,
  Star,
  ChevronRight,
  Search,
  Filter,
}

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Filter tools based on search, category, and tags
  const filteredTools = useMemo(() => {
    return toolsData.filter(tool => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory

      // Tags filter
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some(tag => tool.tags.includes(tag))

      return matchesSearch && matchesCategory && matchesTags
    })
  }, [searchQuery, selectedCategory, selectedTags])

  // Get all unique tags
  const allTags = useMemo(() => {
    return Array.from(new Set(toolsData.flatMap(tool => tool.tags))).sort()
  }, [])

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const getDifficultyColor = (difficulty: Tool['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
  }

  const getStatusColor = (status: Tool['status']) => {
    switch (status) {
      case 'stable':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'beta':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'experimental':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    }
  }

  const getStatusIcon = (processingType: Tool['processingType']) => {
    switch (processingType) {
      case 'client-side':
        return <Clock className="w-3 h-3" />
      case 'server-side':
        return <Zap className="w-3 h-3" />
      case 'hybrid':
        return <Settings className="w-3 h-3" />
    }
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Developer Tools
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
            Professional tools for JSON processing, code execution, file
            transformation, and more. All tools run securely in your browser
            with no data sent to servers.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search tools by name, description, or tags..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </Button>
              {categories.map(category => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Toggle Filters */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Tag Filters */}
          {showFilters && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Filter by Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="text-xs"
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-600 dark:text-gray-300">
            Showing {filteredTools.length} of {toolsData.length} tools
          </p>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedTags([])
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Tools Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map(tool => (
            <Card
              key={tool.id}
              className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      {iconMap[tool.icon] &&
                        React.createElement(iconMap[tool.icon], {
                          className: 'w-5 h-5 text-blue-600 dark:text-blue-300',
                        })}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        {tool.name}
                        {tool.isNew && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                        {tool.isPopular && (
                          <Badge
                            variant="default"
                            className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={`text-xs ${getStatusColor(tool.status)}`}
                        >
                          {tool.status}
                        </Badge>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          {getStatusIcon(tool.processingType!)}
                          <span className="ml-1">
                            {tool.processingType?.replace('-', ' ')}
                          </span>
                        </div>
                        {tool.security === 'secure-sandbox' && (
                          <div className="relative group">
                            <Shield className="w-3 h-3 text-green-500" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              Secure Sandbox
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-sm mt-3">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Features */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Features
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {tool.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {tool.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{tool.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {tool.tags.slice(0, 4).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <Badge
                    className={`text-xs ${getDifficultyColor(tool.difficulty)}`}
                  >
                    {tool.difficulty}
                  </Badge>
                  <Button size="sm" className="group" asChild>
                    <Link href={tool.href}>
                      Try Tool
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tools found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedTags([])
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
