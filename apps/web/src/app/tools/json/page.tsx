import type { Metadata } from 'next'
import { MainLayout } from '@/components/layout/main-layout'
import { JsonToolComplete } from '@/components/tools/json/json-tool-complete'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileJson,
  CheckCircle,
  Info,
  Lightbulb,
  Code,
  Zap,
  Shield,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'JSON Tools - Online JSON Formatter, Validator & Converter | Parsify.dev',
  description:
    'Professional JSON toolkit for formatting, validation, conversion, and visualization. Format, validate, convert JSON to XML/YAML/CSV with advanced parsing capabilities.',
  keywords:
    'JSON formatter, JSON validator, JSON converter, JSON parser, JSON viewer, JSON beautifier, JSON tools, online JSON utilities, JSON to XML, JSON to YAML, JSON to CSV',
  openGraph: {
    title: 'JSON Tools - Professional JSON Processing Suite',
    description:
      'Comprehensive JSON toolkit for formatting, validation, conversion, and visualization',
    type: 'website',
    images: [
      {
        url: '/og-json-tools.png',
        width: 1200,
        height: 630,
        alt: 'JSON Tools - Professional JSON Processing Suite',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Tools - Professional JSON Processing Suite',
    description:
      'Format, validate, and convert JSON data with advanced parsing capabilities',
    images: ['/og-json-tools.png'],
  },
  alternates: {
    canonical: '/tools/json',
  },
}

const jsonExamples = [
  {
    name: 'API Response',
    description: 'Sample API response with user data',
    json: `{
  "status": "success",
  "data": {
    "user": {
      "id": 12345,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "active": true,
      "roles": ["admin", "user"],
      "profile": {
        "age": 30,
        "location": {
          "city": "New York",
          "country": "USA"
        }
      }
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`,
  },
  {
    name: 'Product Catalog',
    description: 'E-commerce product listing',
    json: `{
  "products": [
    {
      "id": "prod_001",
      "name": "Wireless Headphones",
      "price": 99.99,
      "category": "Electronics",
      "inStock": true,
      "tags": ["audio", "wireless", "bluetooth"]
    },
    {
      "id": "prod_002",
      "name": "Smart Watch",
      "price": 249.99,
      "category": "Electronics",
      "inStock": false,
      "tags": ["wearable", "fitness", "smart"]
    }
  ],
  "total": 2,
  "page": 1
}`,
  },
  {
    name: 'Configuration File',
    description: 'Application settings configuration',
    json: `{
  "app": {
    "name": "MyApp",
    "version": "1.0.0",
    "environment": "production"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db",
    "ssl": true
  },
  "features": {
    "authentication": true,
    "analytics": false,
    "beta_features": ["dark_mode", "api_v2"]
  }
}`,
  },
]

const toolFeatures = [
  {
    icon: CheckCircle,
    title: 'JSON Validation',
    description: 'Validate JSON syntax with detailed error reporting and line numbers',
  },
  {
    icon: Code,
    title: 'Smart Formatting',
    description: 'Format JSON with customizable indentation, sorting, and compression options',
  },
  {
    icon: Zap,
    title: 'Format Conversion',
    description: 'Convert JSON to XML, YAML, CSV, and other formats seamlessly',
  },
  {
    icon: Shield,
    title: 'Secure Processing',
    description: 'All processing happens in your browser - your data never leaves your device',
  },
]

export default function JsonToolsPage() {
  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">
              <FileJson className="w-3 h-3 mr-1" />
              Data Processing
            </Badge>
            <Badge variant="outline" className="text-xs">
              Browser Native
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            JSON Tools
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl">
            Professional JSON toolkit for formatting, validation, conversion, and
            visualization. Process JSON data securely in your browser with
            advanced parsing capabilities.
          </p>

          {/* Feature badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              'Real-time Validation',
              'Syntax Highlighting',
              'Format Conversion',
              'Tree Viewer',
              'Error Detection',
              'Copy & Download',
            ].map(feature => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Main Tool Component */}
        <JsonToolComplete />

        {/* Documentation Section */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          {/* Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Key Features
              </CardTitle>
              <CardDescription>
                Discover what makes our JSON tools powerful and developer-friendly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {toolFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <feature.icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Examples Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Sample JSON Data
              </CardTitle>
              <CardDescription>
                Click to load sample JSON data for testing and exploration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="api" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="api" className="text-xs">
                    API Response
                  </TabsTrigger>
                  <TabsTrigger value="products" className="text-xs">
                    Products
                  </TabsTrigger>
                  <TabsTrigger value="config" className="text-xs">
                    Config
                  </TabsTrigger>
                </TabsList>
                {jsonExamples.map((example) => (
                  <TabsContent
                    key={example.name}
                    value={example.name.toLowerCase().replace(' ', '_')}
                    className="mt-4"
                  >
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">{example.name}</h4>
                        <p className="text-sm text-gray-600">
                          {example.description}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                          {example.json}
                        </pre>
                      </div>
                      <button
                        onClick={() => {
                          // This would be handled by the JsonToolComplete component
                          navigator.clipboard.writeText(example.json)
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Copy JSON to Clipboard
                      </button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Tips & Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Validation Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Always validate JSON before processing to catch syntax errors early
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Use the tree viewer to understand complex nested structures
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Check for common issues like trailing commas and missing quotes
                    </span>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Formatting Best Practices</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Use 2 spaces for indentation in most cases for better readability
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Enable key sorting for configuration files to maintain consistency
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      Use compact format for transmission and formatted for storage
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
