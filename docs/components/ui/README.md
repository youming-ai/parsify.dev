# UI Components

This section covers the basic UI components that form the foundation of the Parsify.dev interface. These components are built with accessibility, flexibility, and consistency in mind.

## Button

A versatile button component with multiple variants and sizes.

### Props

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}
```

### Variants

- **default**: Primary blue button with white text
- **destructive**: Red button for destructive actions
- **outline**: Outlined button with transparent background
- **secondary**: Gray button for secondary actions
- **ghost**: Transparent button that shows background on hover
- **link**: Styled as a link with underline

### Sizes

- **default**: Standard height (40px)
- **sm**: Small height (36px)
- **lg**: Large height (44px)
- **icon**: Square button sized for icons (40px)

### Usage Examples

```tsx
import { Button } from '@/components/ui/button'

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Edit</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Icon buttons
<Button size="icon">
  <PlusIcon className="h-4 w-4" />
</Button>

// With additional props
<Button disabled loading onClick={handleClick}>
  Submit
</Button>
```

## Input

A flexible input component for user text input.

### Props

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

### Usage Examples

```tsx
import { Input } from '@/components/ui/input'

// Basic text input
<Input placeholder="Enter your name" />

// Different input types
<Input type="email" placeholder="email@example.com" />
<Input type="password" placeholder="Password" />
<Input type="number" placeholder="Age" />

// With validation states
<Input className="border-red-500" />
<Input disabled />
<Input required />
```

## Card

A container component for grouping related content.

### Components

- **Card**: Main container
- **CardHeader**: Header section with title and description
- **CardTitle**: Title text
- **CardDescription**: Description text
- **CardContent**: Main content area
- **CardFooter**: Footer section for actions

### Usage Examples

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

// Basic card
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>

// Card with actions
<Card>
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
  </CardHeader>
  <CardContent>
    <p>User information and details</p>
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
    <Button variant="outline">Cancel</Button>
  </CardFooter>
</Card>
```

## Alert

A component for displaying important messages with different severity levels.

### Props

```tsx
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info'
}
```

### Components

- **Alert**: Main alert container
- **AlertTitle**: Alert title
- **AlertDescription**: Alert description

### Variants

- **default**: Gray border and background
- **destructive**: Red for errors
- **warning**: Yellow for warnings
- **success**: Green for success messages
- **info**: Blue for informational messages

### Usage Examples

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Basic alert
<Alert>
  <AlertDescription>This is an important message</AlertDescription>
</Alert>

// Alert with title and icon
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>

// Success alert
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    Your changes have been saved successfully.
  </AlertDescription>
</Alert>
```

## Tabs

A tabbed interface component for organizing content.

### Components

- **Tabs**: Main container with state management
- **TabsList**: Container for tab triggers
- **TabsTrigger**: Individual tab trigger
- **TabsContent**: Content panel for each tab

### Props

```tsx
interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
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

### Usage Examples

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

// Controlled tabs
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <p>Account settings content</p>
  </TabsContent>
  <TabsContent value="password">
    <p>Password settings content</p>
  </TabsContent>
  <TabsContent value="notifications">
    <p>Notification preferences</p>
  </TabsContent>
</Tabs>

// Uncontrolled tabs with default value
<Tabs defaultValue="preview">
  <TabsList>
    <TabsTrigger value="editor">Editor</TabsTrigger>
    <TabsTrigger value="preview">Preview</TabsTrigger>
  </TabsList>
  <TabsContent value="editor">
    <p>Editor content</p>
  </TabsContent>
  <TabsContent value="preview">
    <p>Preview content</p>
  </TabsContent>
</Tabs>
```

## Badge

A small component for displaying status or category information.

### Usage Examples

```tsx
import { Badge } from '@/components/ui/badge'

// Basic badge
<Badge>New</Badge>

// Badge with different styles
<Badge variant="secondary">Inactive</Badge>
<Badge variant="outline">Beta</Badge>

// Status badges
<Badge className="bg-green-100 text-green-800">Active</Badge>
<Badge className="bg-red-100 text-red-800">Error</Badge>
```

## Textarea

A multi-line text input component.

### Props

```tsx
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
```

### Usage Examples

```tsx
import { Textarea } from '@/components/ui/textarea'

// Basic textarea
<Textarea placeholder="Enter your message" />

// With constraints
<Textarea 
  rows={4} 
  maxLength={500}
  placeholder="Limited to 500 characters"
/>

// Disabled state
<Textarea disabled placeholder="Disabled textarea" />
```

## Label

A label component for form inputs.

### Props

```tsx
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
```

### Usage Examples

```tsx
import { Label } from '@/components/ui/label'

// Basic label
<Label htmlFor="email">Email Address</Label>
<Input id="email" type="email" />

// With required indicator
<Label htmlFor="password">
  Password <span className="text-red-500">*</span>
</Label>
<Input id="password" type="password" required />
```

## Switch

A toggle switch component for binary options.

### Usage Examples

```tsx
import { Switch } from '@/components/ui/switch'

// Basic switch
<Switch />

// Controlled switch
const [enabled, setEnabled] = useState(false)
<Switch checked={enabled} onCheckedChange={setEnabled} />

// With label
<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Enable notifications</Label>
</div>
```

## Progress

A progress bar component for displaying completion status.

### Usage Examples

```tsx
import { Progress } from '@/components/ui/progress'

// Basic progress bar
<Progress value={60} />

// With custom styling
<Progress value={75} className="w-60" />

// Indeterminate progress
<Progress />
```

## Spinner

A loading spinner component for indicating async operations.

### Usage Examples

```tsx
import { Spinner } from '@/components/ui/spinner'

// Basic spinner
<Spinner />

// With custom size
<Spinner className="h-8 w-8" />

// With text
<div className="flex items-center space-x-2">
  <Spinner />
  <span>Loading...</span>
</div>
```

## Best Practices

### 1. Accessibility
- Use semantic HTML elements
- Include proper ARIA labels
- Ensure keyboard navigation works
- Maintain sufficient color contrast

### 2. Consistency
- Use consistent spacing with Tailwind classes
- Follow established color patterns
- Maintain consistent interaction patterns

### 3. Composition
- Combine components to create complex interfaces
- Use composition over inheritance
- Keep components focused on single responsibilities

### 4. Performance
- Use React.memo for expensive components
- Implement proper key props for lists
- Avoid unnecessary re-renders

### 5. Testing
- Test all component variants
- Verify accessibility with screen readers
- Test keyboard navigation
- Test responsive behavior