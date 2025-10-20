import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface ToolLayoutProps {
  title: string
  description: string
  category: string
  children: ReactNode
  tabs?: Array<{
    value: string
    label: string
    content: ReactNode
  }>
  features?: string[]
  version?: string
}

export function ToolLayout({
  title,
  description,
  category,
  children,
  tabs,
  features = [],
  version
}: ToolLayoutProps) {
  const hasTabs = tabs && tabs.length > 0

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{category}</Badge>
          {version && (
            <Badge variant="outline">v{version}</Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-2">{description}</p>

        {features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {features.map((feature) => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {hasTabs ? (
          <Tabs defaultValue={tabs[0].value} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-6">
              {children}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}