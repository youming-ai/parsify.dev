import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Code, File, Database, Wrench } from 'lucide-react';

const featuredTools = [
  {
    id: 'json-formatter',
    title: 'JSON Formatter',
    description: 'Format and validate JSON data with syntax highlighting',
    category: 'json',
    icon: Code,
    slug: 'json/formatter',
  },
  {
    id: 'code-executor',
    title: 'Code Executor',
    description: 'Run JavaScript, Python, and other code snippets online',
    category: 'code',
    icon: Code,
    slug: 'code/executor',
  },
  {
    id: 'file-converter',
    title: 'File Converter',
    description: 'Convert between different file formats easily',
    category: 'file',
    icon: File,
    slug: 'file/converter',
  },
  {
    id: 'hash-generator',
    title: 'Hash Generator',
    description: 'Generate MD5, SHA-1, SHA-256 and other hashes',
    category: 'data',
    icon: Database,
    slug: 'security/hash-generator',
  },
];

const categories = [
  {
    id: 'json',
    name: 'JSON Tools',
    description: 'Format, validate, and transform JSON data',
    icon: Code,
    color: 'bg-blue-500',
  },
  {
    id: 'code',
    name: 'Code Execution',
    description: 'Run and test code in multiple languages',
    icon: Code,
    color: 'bg-green-500',
  },
  {
    id: 'file',
    name: 'File Processing',
    description: 'Convert and process various file formats',
    icon: File,
    color: 'bg-purple-500',
  },
  {
    id: 'data',
    name: 'Data Validation',
    description: 'Validate and transform data formats',
    icon: Database,
    color: 'bg-orange-500',
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'General purpose developer utilities',
    icon: Wrench,
    color: 'bg-gray-500',
  },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {t('home.title')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('home.description')}
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t('home.search.placeholder')}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Featured Tools */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">{t('home.featured.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {tool.title}
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/tools/${tool.slug}`}>
                    <Button variant="outline" className="w-full">
                      {t('common.view')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-6">
          <Link href="/tools">
            <Button variant="outline">
              {t('home.featured.viewAll')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">{t('home.categories.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {t(`categories.${category.id}.title`)}
                      </CardTitle>
                      <CardDescription>
                        {t(`categories.${category.id}.description`)}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href={`/tools/${category.id}`}>
                    <Button variant="outline" className="w-full">
                      {t('common.view')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
