# Component API Reference

This document provides a comprehensive API reference for all components in the Parsify.dev component library. Each component includes TypeScript interfaces, prop descriptions, and usage examples.

## Table of Contents

- [UI Components](#ui-components)
  - [Button](#button)
  - [Input](#input)
  - [Card](#card)
  - [Alert](#alert)
  - [Tabs](#tabs)
  - [Badge](#badge)
  - [Textarea](#textarea)
  - [Label](#label)
  - [Switch](#switch)
  - [Progress](#progress)
  - [Spinner](#spinner)
- [Tool Components](#tool-components)
  - [Tool Layout](#tool-layout)
  - [JSON Tools](#json-tools)
  - [Code Tools](#code-tools)
- [Authentication Components](#authentication-components)
  - [Auth Context](#auth-context)
  - [Login Form](#login-form)
  - [User Profile](#user-profile)
  - [User Avatar](#user-avatar)
- [File Upload Components](#file-upload-components)
  - [File Upload Component](#file-upload-component)
  - [File Drop Zone](#file-drop-zone)
  - [File Preview](#file-preview)
- [Layout Components](#layout-components)
  - [Main Layout](#main-layout)
  - [Header](#header)
  - [Sidebar](#sidebar)
  - [Footer](#footer)
  - [Theme Toggle](#theme-toggle)

## UI Components

### Button

A versatile button component with multiple variants and sizes.

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | Button style variant |
| size | `'default' \| 'sm' \| 'lg' \| 'icon'` | `'default'` | Button size |
| className | `string` | - | Additional CSS classes |
| disabled | `boolean` | `false` | Whether the button is disabled |
| children | `ReactNode` | - | Button content |
| onClick | `(event: MouseEvent) => void` | - | Click handler |

**Examples:**

```tsx
// Basic button
<Button>Click me</Button>

// With variant
<Button variant="destructive">Delete</Button>

// With size
<Button size="sm">Small</Button>

// Icon button
<Button size="icon">
  <PlusIcon className="h-4 w-4" />
</Button>
```

### Input

A flexible input component for user text input.

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| type | `string` | `'text'` | Input type |
| placeholder | `string` | - | Placeholder text |
| value | `string` | - | Input value |
| onChange | `(event: ChangeEvent) => void` | - | Change handler |
| disabled | `boolean` | `false` | Whether input is disabled |
| required | `boolean` | `false` | Whether input is required |
| className | `string` | - | Additional CSS classes |

**Examples:**

```tsx
// Basic input
<Input placeholder="Enter your name" />

// Different types
<Input type="email" placeholder="email@example.com" />
<Input type="password" placeholder="Password" />
```

### Card

A container component for grouping related content.

```tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
```

**Props:**

All components accept standard HTML attributes and `className` for styling.

**Examples:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Alert

A component for displaying important messages with different severity levels.

```tsx
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info'
}

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'default' \| 'destructive' \| 'warning' \| 'success' \| 'info'` | `'default'` | Alert style variant |

**Examples:**

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>
```

### Tabs

A tabbed interface component for organizing content.

```tsx
interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}
```

**Props:**

| Component | Prop | Type | Default | Description |
|-----------|------|------|---------|-------------|
| Tabs | defaultValue | `string` | - | Default active tab |
| Tabs | value | `string` | - | Controlled active tab value |
| Tabs | onValueChange | `(value: string) => void` | - | Tab change handler |
| TabsTrigger | value | `string` | - | Tab identifier |
| TabsContent | value | `string` | - | Content identifier |

**Examples:**

```tsx
<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <p>Account settings</p>
  </TabsContent>
  <TabsContent value="password">
    <p>Password settings</p>
  </TabsContent>
</Tabs>
```

### Badge

A small component for displaying status or category information.

```tsx
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` | Badge style variant |
| className | `string` | - | Additional CSS classes |
| children | `ReactNode` | - | Badge content |

**Examples:**

```tsx
<Badge>New</Badge>
<Badge variant="secondary">Inactive</Badge>
<Badge variant="destructive">Error</Badge>
```

### Textarea

A multi-line text input component.

```tsx
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| placeholder | `string` | - | Placeholder text |
| value | `string` | - | Textarea value |
| onChange | `(event: ChangeEvent) => void` | - | Change handler |
| rows | `number` | - | Number of visible rows |
| disabled | `boolean` | `false` | Whether textarea is disabled |
| className | `string` | - | Additional CSS classes |

**Examples:**

```tsx
<Textarea placeholder="Enter your message" rows={4} />
```

### Label

A label component for form inputs.

```tsx
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| htmlFor | `string` | - | ID of associated input |
| className | `string` | - | Additional CSS classes |
| children | `ReactNode` | - | Label content |

**Examples:**

```tsx
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />
```

### Switch

A toggle switch component for binary options.

```tsx
interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | `boolean` | `false` | Whether switch is checked |
| onCheckedChange | `(checked: boolean) => void` | - | Change handler |
| disabled | `boolean` | `false` | Whether switch is disabled |
| className | `string` | - | Additional CSS classes |

**Examples:**

```tsx
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

### Progress

A progress bar component for displaying completion status.

```tsx
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `number` | - | Current progress value |
| max | `number` | `100` | Maximum progress value |
| className | `string` | - | Additional CSS classes |

**Examples:**

```tsx
<Progress value={60} />
<Progress value={75} className="w-60" />
```

### Spinner

A loading spinner component for indicating async operations.

```tsx
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner size |
| className | `string` | - | Additional CSS classes |

**Examples:**

```tsx
<Spinner />
<Spinner size="lg" className="text-blue-500" />
```

## Tool Components

### Tool Layout

A consistent layout wrapper for all tool pages with optional tabs and feature badges.

```tsx
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
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | `string` | - | Tool title |
| description | `string` | - | Tool description |
| category | `string` | - | Tool category |
| children | `ReactNode` | - | Tool content |
| tabs | `Array<{value: string, label: string, content: ReactNode}>` | - | Optional tabs |
| features | `string[]` | - | Feature badges |
| version | `string` | - | Version badge |

**Examples:**

```tsx
<ToolLayout
  title="JSON Validator"
  description="Validate and format JSON data"
  category="JSON Tools"
  features={["Real-time validation", "Error highlighting"]}
>
  <JsonValidator input={jsonInput} />
</ToolLayout>
```

### JSON Tools

#### JSON Validator

```tsx
interface JsonValidatorProps {
  input: string
  onValidationChange: (result: JsonValidationResult) => void
  showLineNumbers?: boolean
  className?: string
}

interface JsonValidationResult {
  isValid: boolean
  errors: JsonValidationError[]
  lineNumbers?: number[]
}

interface JsonValidationError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| input | `string` | - | JSON string to validate |
| onValidationChange | `(result: JsonValidationResult) => void` | - | Validation result handler |
| showLineNumbers | `boolean` | `true` | Show line numbers |
| className | `string` | - | Additional CSS classes |

#### JSON Formatter

```tsx
interface JsonFormatterProps {
  input: string
  options?: JsonFormatOptions
  onFormat: (formatted: string) => void
  onError: (error: string) => void
  className?: string
}

interface JsonFormatOptions {
  indent: number
  sortKeys: boolean
  compact: boolean
  trailingComma: boolean
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| input | `string` | - | JSON string to format |
| options | `JsonFormatOptions` | - | Formatting options |
| onFormat | `(formatted: string) => void` | - | Format result handler |
| onError | `(error: string) => void` | - | Error handler |

#### JSON Viewer

```tsx
interface JsonViewerProps {
  data: unknown
  expandLevel?: number
  showLineNumbers?: boolean
  copyable?: boolean
  className?: string
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `unknown` | - | JSON data to display |
| expandLevel | `number` | - | Initial expansion level |
| showLineNumbers | `boolean` | `true` | Show line numbers |
| copyable | `boolean` | `true` | Allow copying |
| className | `string` | - | Additional CSS classes |

### Code Tools

#### Code Editor

```tsx
interface CodeEditorProps {
  value: string
  language: CodeLanguage
  onChange: (value: string) => void
  onLanguageChange: (language: CodeLanguage) => void
  height?: string | number
  width?: string | number
  readOnly?: boolean
  theme?: 'light' | 'dark' | 'high-contrast'
  fontSize?: number
  wordWrap?: boolean
  showLineNumbers?: boolean
  minimap?: boolean
  className?: string
}

type CodeLanguage =
  | 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'c'
  | 'csharp' | 'go' | 'rust' | 'php' | 'ruby' | 'swift' | 'kotlin'
  | 'scala' | 'bash' | 'powershell' | 'sql'
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | - | Editor content |
| language | `CodeLanguage` | - | Programming language |
| onChange | `(value: string) => void` | - | Content change handler |
| onLanguageChange | `(language: CodeLanguage) => void` | - | Language change handler |
| height | `string \| number` | - | Editor height |
| width | `string \| number` | - | Editor width |
| readOnly | `boolean` | `false` | Read-only mode |
| theme | `'light' \| 'dark' \| 'high-contrast'` | - | Editor theme |
| fontSize | `number` | - | Font size |
| wordWrap | `boolean` | - | Word wrapping |
| showLineNumbers | `boolean` | - | Show line numbers |
| minimap | `boolean` | - | Show minimap |

#### Code Execution

```tsx
interface CodeExecutionProps {
  request: CodeExecutionRequest
  onExecutionStart: () => void
  onExecutionComplete: (result: CodeExecutionResult) => void
  onExecutionError: (error: string) => void
  onCancel?: () => void
  showProgress?: boolean
  showStats?: boolean
  className?: string
}

interface CodeExecutionRequest {
  language: CodeLanguage
  code: string
  input?: string
  version?: string
  compilerOptions?: Record<string, any>
}

interface CodeExecutionResult {
  output: string
  error?: string
  exitCode: number
  executionTime: number
  memoryUsage: number
  compileTime?: number
  compileOutput?: string
  signal?: string
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| request | `CodeExecutionRequest` | - | Execution request |
| onExecutionStart | `() => void` | - | Start handler |
| onExecutionComplete | `(result: CodeExecutionResult) => void` | - | Completion handler |
| onExecutionError | `(error: string) => void` | - | Error handler |
| onCancel | `() => void` | - | Cancel handler |
| showProgress | `boolean` | - | Show progress |
| showStats | `boolean` | - | Show statistics |

## Authentication Components

### Auth Context

The authentication system provides global state management.

```tsx
interface AuthContextType extends AuthState {
  login: (provider: 'google' | 'github' | 'email', credentials?: any) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  clearError: () => void
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  provider: 'google' | 'github' | 'email'
}
```

**Hook Usage:**

```tsx
import { useAuth } from '@/components/auth/auth-context'

const { user, isAuthenticated, isLoading, error, login, logout } = useAuth()
```

### Login Form

A comprehensive login form supporting OAuth and email/password authentication.

```tsx
interface LoginFormProps {
  onSuccess?: () => void
  redirectTo?: string
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onSuccess | `() => void` | - | Success callback |
| redirectTo | `string` | - | Redirect URL after login |

**Examples:**

```tsx
<LoginForm 
  onSuccess={() => router.push('/dashboard')}
  redirectTo="/dashboard"
/>
```

### User Profile

A flexible user profile component with multiple display variants.

```tsx
interface UserProfileProps {
  variant?: 'card' | 'dropdown' | 'sidebar'
  showEmail?: boolean
  showProvider?: boolean
  className?: string
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'card' \| 'dropdown' \| 'sidebar'` | `'card'` | Display variant |
| showEmail | `boolean` | `true` | Show email address |
| showProvider | `boolean` | `true` | Show auth provider |
| className | `string` | - | Additional CSS classes |

**Examples:**

```tsx
<UserProfile variant="card" />
<UserProfile variant="dropdown" showProvider={false} />
<UserProfile variant="sidebar" />
```

### User Avatar

A customizable avatar component that displays user images or initials.

```tsx
interface UserAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| user | `User` | - | User object |
| size | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Avatar size |
| className | `string` | - | Additional CSS classes |

**Examples:**

```tsx
<UserAvatar user={user} size="lg" />
```

## File Upload Components

### File Upload Component

A comprehensive file upload component that combines all file upload functionality.

```tsx
interface FileUploadComponentProps {
  config?: Partial<FileUploadConfig>
  className?: string
  showDropZone?: boolean
  showFileList?: boolean
  showProgress?: boolean
  showPreview?: boolean
  maxFiles?: number
  layout?: 'vertical' | 'horizontal' | 'grid'
  onFilesChange?: (files: UploadedFile[]) => void
  onUploadComplete?: (files: UploadedFile[]) => void
  onError?: (error: Error) => void
}

interface FileUploadConfig {
  maxSize?: number
  accept?: string[]
  multiple?: boolean
  autoUpload?: boolean
  endpoint?: string
  headers?: Record<string, string>
  validator?: (file: File) => string | null
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  lastModified: number
  url?: string
  preview?: string
  status: FileUploadStatus
  progress: number
  error?: string
  metadata?: Record<string, any>
}

type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error' | 'cancelled'
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| config | `Partial<FileUploadConfig>` | - | Upload configuration |
| className | `string` | - | Additional CSS classes |
| showDropZone | `boolean` | `true` | Show drop zone |
| showFileList | `boolean` | `true` | Show file list |
| showProgress | `boolean` | `true` | Show progress |
| showPreview | `boolean` | `false` | Show preview |
| maxFiles | `number` | - | Maximum files to display |
| layout | `'vertical' \| 'horizontal' \| 'grid'` | `'vertical'` | Layout mode |
| onFilesChange | `(files: UploadedFile[]) => void` | - | Files change handler |
| onUploadComplete | `(files: UploadedFile[]) => void` | - | Upload complete handler |
| onError | `(error: Error) => void` | - | Error handler |

### File Drop Zone

A drag-and-drop zone for file selection with visual feedback.

```tsx
interface FileDropZoneProps {
  disabled?: boolean
  multiple?: boolean
  accept?: string[]
  maxSize?: number
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  onDrop?: (files: File[]) => void
  onDragOver?: (event: DragOverEvent) => void
  onDragLeave?: (event: DragOverEvent) => void
  onFilesSelected?: (files: File[]) => void
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| disabled | `boolean` | `false` | Whether disabled |
| multiple | `boolean` | `false` | Allow multiple files |
| accept | `string[]` | - | Accepted file types |
| maxSize | `number` | - | Maximum file size |
| className | `string` | - | Additional CSS classes |
| children | `ReactNode` | - | Custom content |
| onDrop | `(files: File[]) => void` | - | Drop handler |
| onFilesSelected | `(files: File[]) => void` | - | File selection handler |

### File Preview

A component for previewing file content before and after upload.

```tsx
interface FilePreviewProps {
  file: UploadedFile | File
  options?: FilePreviewOptions
  className?: string
  maxHeight?: number
  showCopyButton?: boolean
  showDownloadButton?: boolean
  onCopy?: (content: string) => void
  onDownload?: (file: UploadedFile | File) => void
}

interface FilePreviewOptions {
  maxLength?: number
  showLineNumbers?: boolean
  theme?: 'light' | 'dark'
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| file | `UploadedFile \| File` | - | File to preview |
| options | `FilePreviewOptions` | - | Preview options |
| className | `string` | - | Additional CSS classes |
| maxHeight | `number` | `400` | Maximum preview height |
| showCopyButton | `boolean` | `true` | Show copy button |
| showDownloadButton | `boolean` | `true` | Show download button |
| onCopy | `(content: string) => void` | - | Copy handler |
| onDownload | `(file: UploadedFile \| File) => void` | - | Download handler |

## Layout Components

### Main Layout

The primary layout wrapper that combines header, sidebar, and footer components.

```tsx
interface MainLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `ReactNode` | - | Layout content |
| showSidebar | `boolean` | `false` | Show sidebar navigation |

**Examples:**

```tsx
<MainLayout showSidebar={true}>
  <div>Dashboard content</div>
</MainLayout>
```

### Header

The main application header with navigation and user menu.

The Header component doesn't require props and manages its own state internally.

### Sidebar

A collapsible sidebar navigation for organizing tools and categories.

The Sidebar component manages its own state for expanded categories and active routes.

### Footer

The application footer with navigation links and legal information.

The Footer component doesn't require props.

### Theme Toggle

A button component for switching between light and dark themes.

The ThemeToggle component doesn't require props and uses the `next-themes` hook internally.

**Examples:**

```tsx
<ThemeToggle />
```

## Type Definitions

### Common Types

```tsx
// Event types
type DragOverEvent = React.DragEvent<HTMLDivElement>
type FileChangeEvent = React.ChangeEvent<HTMLInputElement>

// File types
interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
  speed?: number
  timeRemaining?: number
}

interface FileValidationError {
  code: 'size' | 'type' | 'count' | 'custom'
  message: string
  file?: File
}

// Auth types
interface LoginCredentials {
  email: string
  password: string
}

interface RegisterCredentials {
  email: string
  password: string
  name: string
}

// Tool types
interface CodeFormatOptions {
  indentSize: number
  indentType: 'spaces' | 'tabs'
  maxLineLength: number
  semicolons: boolean
  quotes: 'single' | 'double'
  trailingComma: boolean
}
```

## Utility Functions

### File Validation

```tsx
function validateFiles(files: File[], config: FileValidationConfig): ValidationResult

interface FileValidationConfig {
  maxSize?: number
  accept?: string[]
  multiple?: boolean
  validator?: (file: File) => string | null
}

interface ValidationResult {
  validFiles: File[]
  errors: FileValidationError[]
}
```

### File Size Formatting

```tsx
function formatFileSize(bytes: number): string
```

### Language Detection

```tsx
function getLanguageFromFileName(fileName: string): string
```

## CSS Classes and Styling

### Tailwind CSS Classes

Components use Tailwind CSS classes for styling. Common patterns include:

```tsx
// Layout
.container.mx-auto.py-6
.flex.flex-col.items-center.justify-center
.grid.grid-cols-1.md:grid-cols-2.gap-6

// Colors
.bg-blue-500.text-white
.border-gray-200
.text-gray-900

// States
.hover:bg-gray-100
.focus-visible:outline-none.focus-visible:ring-2
.disabled:opacity-50.disabled:cursor-not-allowed

// Responsive
.hidden.md:block
.text-sm.md:text-base
.p-4.md:p-6
```

### Custom CSS Variables

Components use CSS custom properties for theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
}
```