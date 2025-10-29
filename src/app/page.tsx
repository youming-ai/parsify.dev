import { MainLayout } from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Parsify.dev - Online Developer Tools Platform | JSON & Code Processing",
  description:
    "Professional online tools for JSON processing, code execution, and file transformation. Secure, fast, and privacy-focused developer utilities.",
  keywords:
    "JSON formatter, code executor, developer tools, online utilities, WASM sandbox, TypeScript tools",
  openGraph: {
    title: "Parsify.dev - Online Developer Tools Platform",
    description:
      "Professional online tools for JSON processing, code execution, and file transformation",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Parsify.dev - Online Developer Tools Platform",
    description:
      "Professional online tools for JSON processing, code execution, and file transformation",
  },
};

import {
  ArrowRight,
  CheckCircle,
  Code,
  Cpu,
  FileJson,
  Globe,
  Lock,
  Play,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";

export default function Home() {
  const tools = [
    {
      id: "json-tools",
      title: "JSON Tools",
      description:
        "Format, validate, and transform JSON data with advanced parsing capabilities",
      href: "/tools/json",
      icon: FileJson,
      features: [
        "Format & Beautify",
        "Validate & Error Detection",
        "Convert & Transform",
        "Path Queries",
      ],
      color: "text-blue-600",
    },
    {
      id: "code-execution",
      title: "Code Execution",
      description:
        "Execute code in a secure WASM sandbox with multiple language support",
      href: "/tools/code",
      icon: Terminal,
      features: [
        "Multi-language Support",
        "Secure Sandboxing",
        "Real-time Output",
        "Debug Mode",
      ],
      color: "text-green-600",
    },
    {
      id: "file-processing",
      title: "File Processing",
      description:
        "Process and transform various file formats with powerful tools",
      href: "/tools/file",
      icon: Code,
      features: [
        "Batch Processing",
        "Format Conversion",
        "Data Extraction",
        "Validation",
      ],
      color: "text-purple-600",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Built for performance with modern web technologies and optimized algorithms",
    },
    {
      icon: Shield,
      title: "Secure Execution",
      description:
        "Code runs in isolated WASM sandboxes ensuring complete security and isolation",
    },
    {
      icon: Globe,
      title: "Browser Native",
      description:
        "No server required - all processing happens directly in your browser",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description:
        "Your data never leaves your browser. Complete privacy and data security",
    },
    {
      icon: Cpu,
      title: "Modern Tech Stack",
      description:
        "Built with TypeScript, Next.js, and Cloudflare Workers for reliability",
    },
    {
      icon: Sparkles,
      title: "Developer Experience",
      description:
        "Clean interface with powerful features designed for developers",
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Sparkles className="mr-1 h-3 w-3" />
              Professional Developer Tools
            </Badge>
            <h1 className="mb-6 font-bold text-4xl text-gray-900 lg:text-6xl dark:text-white">
              Powerful Tools for
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                Modern Development
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-gray-600 text-xl dark:text-gray-300">
              Transform, validate, and execute your code with our suite of
              professional developer tools. Built for speed, security, and
              exceptional developer experience.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/tools">
                <Button size="lg" className="px-8 py-3 text-lg">
                  <Play className="mr-2 h-5 w-5" />
                  Try Tools Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-3 text-lg"
                >
                  View Documentation
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-500 text-sm dark:text-gray-400">
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                No Registration Required
              </div>
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4 text-blue-500" />
                100% Secure
              </div>
              <div className="flex items-center">
                <Zap className="mr-2 h-4 w-4 text-yellow-500" />
                Instant Processing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="bg-white py-16 lg:py-24 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl text-gray-900 lg:text-4xl dark:text-white">
              Professional Development Tools
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 text-lg dark:text-gray-300">
              Everything you need to process, transform, and execute your code
              efficiently
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Card
                key={tool.id || tool.name}
                className="group border-gray-200 transition-all duration-300 hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:hover:border-blue-600"
              >
                <CardHeader>
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 ${tool.color}`}
                  >
                    <tool.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-2">
                    {tool.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center text-gray-600 text-sm dark:text-gray-300"
                      >
                        <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={tool.href}>
                    <Button className="w-full" variant="outline">
                      Try {tool.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-16 lg:py-24 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-bold text-3xl text-gray-900 lg:text-4xl dark:text-white">
              Why Choose Parsify.dev?
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 text-lg dark:text-gray-300">
              Built with modern technologies and developer-first principles
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 text-xl dark:text-white">
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
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 text-white lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 font-bold text-3xl lg:text-4xl">
            Ready to Boost Your Productivity?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
            Join thousands of developers who use our tools daily to streamline
            their workflow
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/tools">
              <Button
                size="lg"
                variant="secondary"
                className="px-8 py-3 text-lg"
              >
                Start Using Tools
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                size="lg"
                variant="outline"
                className="border-white px-8 py-3 text-lg text-white hover:bg-white hover:text-gray-900"
              >
                Read the Docs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
