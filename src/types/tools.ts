export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string; // For nested categories like "Common/Auxiliary Tools"
  icon: string; // Lucide icon name as string
  features: string[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'stable' | 'beta' | 'experimental';
  href: string;
  isNew?: boolean;
  isPopular?: boolean;
  processingType?: 'client-side' | 'server-side' | 'hybrid';
  security?: 'local-only' | 'secure-sandbox' | 'network-required';
}

export interface ToolCategoryData {
  id: string;
  name: string;
  description?: string;
  subcategories?: ToolSubcategory[];
}

export interface ToolSubcategory {
  id: string;
  name: string;
  description?: string;
}

export type ToolCategory = string;
export type ToolTag = string;
export type ToolDifficulty = Tool['difficulty'];
export type ToolStatus = Tool['status'];
export type ProcessingType = Tool['processingType'];
export type SecurityType = Tool['security'];
