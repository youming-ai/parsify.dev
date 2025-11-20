import {
  AlertCircle,
  ArrowLeft,
  Code,
  Database,
  FileText,
  Hash,
  Image,
  Palette,
  Search,
  Settings,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { categories, getPopularTools, getToolsByCategory } from "@/data/tools-data";

export default function ToolNotFound() {
  const popularTools = getPopularTools();

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex items-center space-x-2 text-gray-600 text-sm">
        <Link href="/tools" className="hover:text-gray-900">
          Tools
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-900">Not Found</span>
      </nav>

      {/* 404 Content */}
      <div className="py-16 text-center">
        <AlertCircle className="mx-auto mb-6 h-16 w-16 text-gray-400" />
        <h1 className="mb-4 font-bold text-3xl text-gray-900">Tool Not Found</h1>
        <p className="mx-auto mb-8 max-w-2xl text-gray-600 text-lg">
          The tool you're looking for doesn't exist or has been moved. Browse our available tools
          below or search for what you need.
        </p>

        <div className="mb-12 flex justify-center gap-4">
          <Link href="/tools">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
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
        <h2 className="mb-6 font-bold text-2xl">Popular Tools</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {popularTools.map((tool) => {
            const Icon = getToolIcon(tool.icon);
            return (
              <Card key={tool.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={tool.href}>
                    <Button variant="outline" size="sm" className="w-full">
                      Open Tool
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Categories Section */}
      <div className="mb-12">
        <h2 className="mb-6 font-bold text-2xl">Browse by Category</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const toolsInCategory = getToolsByCategory(category);
            const Icon = getCategoryIcon(category);
            return (
              <Card key={category} className="cursor-pointer transition-shadow hover:shadow-md">
                <Link href={`/tools?category=${encodeURIComponent(category)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {toolsInCategory.length} tools available
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Search Section */}
      <div className="text-center">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Search className="h-5 w-5" />
              Can't find what you're looking for?
            </CardTitle>
            <CardDescription>
              Try searching for a specific tool or browse our complete collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/tools">
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Browse All Tools
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function getToolIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    FileJson: Database,
    DataObject: Database,
    Terminal,
    FileText,
    Hash,
    Shield,
    Settings,
    Zap,
    Code,
    Image,
    Http: Settings,
    Palette,
    FormatAlignLeft: FileText,
    EnhancedEncryption: Shield,
  };
  return icons[iconName] || Settings;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    "JSON Tools": Database,
    "Common/Auxiliary Tools": Code,
    "Image/Media Tools": Image,
    "Network/Ops/Encoding Tools": Settings,
    "Text Tools": FileText,
    "Encryption/Hashing/Generation": Shield,
  };
  return icons[category] || Code;
}
