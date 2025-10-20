import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:
    'Parsify.dev - Online Developer Tools Platform | JSON & Code Processing',
  description:
    'Professional online tools for JSON processing, code execution, and file transformation. Secure, fast, and privacy-focused developer utilities.',
  keywords:
    'JSON formatter, code executor, developer tools, online utilities, WASM sandbox, TypeScript tools',
  openGraph: {
    title: 'Parsify.dev - Online Developer Tools Platform',
    description:
      'Professional online tools for JSON processing, code execution, and file transformation',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parsify.dev - Online Developer Tools Platform',
    description:
      'Professional online tools for JSON processing, code execution, and file transformation',
  },
}
import {
  Code,
  FileJson,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Play,
  CheckCircle,
  Terminal,
  Sparkles,
  Cpu,
  Lock,
} from 'lucide-react'

export default function Home() {
  const tools = [
    {
      title: 'JSON Tools',
      description:
        'Format, validate, and transform JSON data with advanced parsing capabilities',
      href: '/tools/json',
      icon: FileJson,
      features: [
        'Format & Beautify',
        'Validate & Error Detection',
        'Convert & Transform',
        'Path Queries',
      ],
      color: 'text-blue-600',
    },
    {
      title: 'Code Execution',
      description:
        'Execute code in a secure WASM sandbox with multiple language support',
      href: '/tools/code',
      icon: Terminal,
      features: [
        'Multi-language Support',
        'Secure Sandboxing',
        'Real-time Output',
        'Debug Mode',
      ],
      color: 'text-green-600',
    },
    {
      title: 'File Processing',
      description:
        'Process and transform various file formats with powerful tools',
      href: '/tools/file',
      icon: Code,
      features: [
        'Batch Processing',
        'Format Conversion',
        'Data Extraction',
        'Validation',
      ],
      color: 'text-purple-600',
    },
  ]

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Built for performance with modern web technologies and optimized algorithms',
    },
    {
      icon: Shield,
      title: 'Secure Execution',
      description:
        'Code runs in isolated WASM sandboxes ensuring complete security and isolation',
    },
    {
      icon: Globe,
      title: 'Browser Native',
      description:
        'No server required - all processing happens directly in your browser',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description:
        'Your data never leaves your browser. Complete privacy and data security',
    },
    {
      icon: Cpu,
      title: 'Modern Tech Stack',
      description:
        'Built with TypeScript, Next.js, and Cloudflare Workers for reliability',
    },
    {
      icon: Sparkles,
      title: 'Developer Experience',
      description:
        'Clean interface with powerful features designed for developers',
    },
  ]

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Sparkles className="w-3 h-3 mr-1" />
              Professional Developer Tools
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Powerful Tools for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}
                Modern Development
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform, validate, and execute your code with our suite of
              professional developer tools. Built for speed, security, and
              exceptional developer experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-3" asChild>
                <Link href="/tools">
                  <Play className="w-5 h-5 mr-2" />
                  Try Tools Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3"
                asChild
              >
                <Link href="/docs">View Documentation</Link>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                No Registration Required
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2 text-blue-500" />
                100% Secure
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                Instant Processing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16 lg:py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Professional Development Tools
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to process, transform, and execute your code
              efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 ${tool.color}`}
                  >
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {tool.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm text-gray-600 dark:text-gray-300"
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={tool.href}>
                      Try {tool.title}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Parsify.dev?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Built with modern technologies and developer-first principles
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Boost Your Productivity?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of developers who use our tools daily to streamline
            their workflow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-3"
              asChild
            >
              <Link href="/tools">
                Start Using Tools
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-gray-900"
              asChild
            >
              <Link href="/docs">Read the Docs</Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
