export interface Tool {
  id: string
  name: string
  description: string
  category: string
  icon: string // Lucide icon name as string
  features: string[]
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  status: 'stable' | 'beta' | 'experimental'
  href: string
  isNew?: boolean
  isPopular?: boolean
  processingType?: 'client-side' | 'server-side' | 'hybrid'
  security?: 'local-only' | 'secure-sandbox' | 'network-required'
}

export type ToolCategory = string
export type ToolTag = string
export type ToolDifficulty = Tool['difficulty']
export type ToolStatus = Tool['status']
export type ProcessingType = Tool['processingType']
export type SecurityType = Tool['security']
