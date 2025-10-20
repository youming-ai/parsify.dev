import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertCircle,
  ArrowLeft,
  Search,
  FileText,
  FileJson,
  Terminal,
  Shield,
  Settings,
} from 'lucide-react'
import { getPopularTools, getToolsByCategory } from '@/data/tools-data'

export default function ToolNotFound() {
  const popularTools = getPopularTools()
  const categories = Array.from(
    new Set([
      'JSON Processing',
      'Code Execution',
      'File Processing',
      'Data Validation',
      'Utilities',
    ])
  )

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link href="/" className="hover:text-gray-900">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-gray-900">
          Tools
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Not Found</span>
      </nav>

      {/* 404 Content */}
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tool Not Found
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
          The tool you're looking for doesn't exist or has been moved. Browse
          our available tools below or search for what you need.
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <Link href="/tools">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tools
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>

      {/* Popular Tools Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Popular Tools</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularTools.map(tool => {
            const Icon = getToolIcon(tool.icon)
            return (
              <Card key={tool.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={tool.href}>
                    <Button variant="outline" size="sm" className="w-full">
                      Open Tool
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => {
            const toolsInCategory = getToolsByCategory(category)
            const Icon = getCategoryIcon(category)
            return (
              <Card
                key={category}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <Link href={`/tools?category=${encodeURIComponent(category)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {toolsInCategory.length} tools available
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Search Section */}
      <div className="text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              Can't find what you're looking for?
            </CardTitle>
            <CardDescription>
              Try searching for a specific tool or browse our complete
              collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tools">
              <Button className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Browse All Tools
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper functions
function getToolIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    FileJson,
    Terminal,
    FileText,
    Hash,
    Shield,
    Settings,
    Zap,
  }
  return icons[iconName] || Settings
}

function getCategoryIcon(category: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    'JSON Processing': FileJson,
    'Code Execution': Terminal,
    'File Processing': FileText,
    'Data Validation': Shield,
    Utilities: Settings,
  }
  return icons[category] || FileText
}
