import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { getToolById, toolsData } from '@/data/tools-data'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  FileJson,
  Terminal,
  FileText,
  Hash,
  Shield,
  Settings,
  Zap,
  Star,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Download,
  Copy,
} from 'lucide-react'
import Link from 'next/link'
import { JsonToolComplete } from '@/components/tools/json/json-tool-complete'
import { CodeToolComplete } from '@/components/tools/code/code-tool-complete'

interface ToolPageProps {
  params: {
    slug: string
  }
}

// Generate static params for all tools
export async function generateStaticParams(): Promise<
  ToolPageProps['params'][]
> {
  return toolsData.map(tool => ({
    slug: tool.id,
  }))
}

// Generate metadata for each tool
export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const tool = getToolById(params.slug)

  if (!tool) {
    return {
      title: 'Tool Not Found - Parsify.dev',
      description: 'The requested tool could not be found.',
    }
  }

  const title = `${tool.name} - ${tool.category} Tools | Parsify.dev`
  const description = tool.description

  return {
    title,
    description,
    keywords: [
      tool.name.toLowerCase(),
      ...tool.tags.map(tag => tag.toLowerCase()),
      tool.category.toLowerCase(),
      'parsify.dev',
      'online tools',
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      images: [
        {
          url: `/og-${tool.id}.png`,
          width: 1200,
          height: 630,
          alt: `${tool.name} - Professional ${tool.category} Tool`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`/og-${tool.id}.png`],
    },
    alternates: {
      canonical: `/tools/${tool.id}`,
    },
  }
}

// Tool component mapping based on tool category
const getToolComponent = (
  tool: NonNullable<ReturnType<typeof getToolById>>
) => {
  switch (tool.category) {
    case 'JSON Processing':
      return <JsonToolComplete />
    case 'Code Execution':
      return <CodeToolComplete />
    default:
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tool Coming Soon
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            This tool is currently under development. Check back soon for the
            full implementation.
          </p>
        </div>
      )
  }
}

// Get tool icon component
const getToolIcon = (iconName: string) => {
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

// Get difficulty color
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'intermediate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'advanced':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'stable':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'beta':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'experimental':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function ToolPage({ params }: ToolPageProps) {
  const tool = getToolById(params.slug)

  if (!tool) {
    notFound()
  }

  const Icon = getToolIcon(tool.icon)
  const ToolComponent = getToolComponent(tool)

  return (
    <MainLayout>
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
          <Link
            href={`/tools?category=${encodeURIComponent(tool.category)}`}
            className="hover:text-gray-900"
          >
            {tool.category}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{tool.name}</span>
        </nav>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/tools" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Icon className="w-6 h-6 text-blue-600" />
              <Badge variant="secondary" className="text-xs">
                {tool.category}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs border ${getDifficultyColor(tool.difficulty)}`}
              >
                {tool.difficulty}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs border ${getStatusColor(tool.status)}`}
              >
                {tool.status}
              </Badge>
              {tool.isPopular && (
                <Badge
                  variant="default"
                  className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200"
                >
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}
              {tool.isNew && (
                <Badge
                  variant="default"
                  className="text-xs bg-green-100 text-green-800 border-green-200"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  New
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {tool.name}
              </h1>
              <p className="text-gray-600 text-lg max-w-3xl mb-4">
                {tool.description}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Documentation
              </Button>
            </div>
          </div>

          {/* Feature badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {tool.features.map(feature => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Processing and Security Info */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>
              <strong>Security:</strong>{' '}
              {tool.security
                ?.replace('-', ' ')
                .replace(/\b\w/g, l => l.toUpperCase()) || 'Local Only'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              <strong>Processing:</strong>{' '}
              {tool.processingType
                ?.replace('-', ' ')
                .replace(/\b\w/g, l => l.toUpperCase()) || 'Client Side'}
            </span>
          </div>
        </div>

        {/* Main Tool Component */}
        <div className="mb-12">{ToolComponent}</div>

        {/* Additional Information Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage Guide</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tool Overview</CardTitle>
                <CardDescription>
                  Learn more about {tool.name} and its capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Key Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {tool.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {tool.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Tool Information</h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="font-medium text-gray-900">Category</dt>
                      <dd className="text-gray-600">{tool.category}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Difficulty</dt>
                      <dd className="text-gray-600 capitalize">
                        {tool.difficulty}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Status</dt>
                      <dd className="text-gray-600 capitalize">
                        {tool.status}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Processing</dt>
                      <dd className="text-gray-600 capitalize">
                        {tool.processingType?.replace('-', ' ') ||
                          'Client Side'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Guide</CardTitle>
                <CardDescription>
                  Step-by-step instructions for using {tool.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-medium text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Input Your Data</h4>
                      <p className="text-sm text-gray-600">
                        Enter or paste your data into the input area. The tool
                        supports various input formats depending on the tool
                        type.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-medium text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Configure Options</h4>
                      <p className="text-sm text-gray-600">
                        Adjust the tool settings and options according to your
                        needs. Each tool offers different customization options.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-medium text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Process & Review</h4>
                      <p className="text-sm text-gray-600">
                        Click the process button to transform your data. Review
                        the output and make any necessary adjustments.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-medium text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Export Results</h4>
                      <p className="text-sm text-gray-600">
                        Copy or download the processed results in your preferred
                        format.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Examples</CardTitle>
                <CardDescription>
                  Sample inputs and outputs for {tool.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>Examples for this tool will be available soon.</p>
                  <p className="text-sm">
                    Check back later for sample data and use cases.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>
                  Technical details and API documentation for developers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>API documentation is currently in development.</p>
                  <p className="text-sm">
                    Check the source code repository for technical details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Tools */}
        {toolsData.filter(t => t.category === tool.category && t.id !== tool.id)
          .length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Related Tools</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {toolsData
                .filter(t => t.category === tool.category && t.id !== tool.id)
                .slice(0, 6)
                .map(relatedTool => {
                  const RelatedIcon = getToolIcon(relatedTool.icon)
                  return (
                    <Card
                      key={relatedTool.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <RelatedIcon className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">
                            {relatedTool.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                          {relatedTool.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Link href={relatedTool.href}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Open Tool
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
