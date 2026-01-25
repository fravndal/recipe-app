# UI Theme

## Overview

The app uses Tailwind CSS v4 with custom CSS variables for theming. The design follows shadcn/ui patterns with a green primary color and JetBrains Darcula-inspired dark mode.

## Tailwind CSS v4 Configuration

Tailwind v4 uses CSS-first configuration via `@theme` directive in `index.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #16a34a;
  /* ... other tokens */
}
```

## Color Palette

### Light Mode (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#ffffff` | Page background |
| `--color-foreground` | `#0a0a0a` | Primary text |
| `--color-muted` | `#f5f5f5` | Subtle backgrounds |
| `--color-muted-foreground` | `#737373` | Secondary text |
| `--color-border` | `#e5e5e5` | Borders, dividers |
| `--color-input` | `#e5e5e5` | Input borders |
| `--color-ring` | `#16a34a` | Focus rings |
| `--color-primary` | `#16a34a` | Primary actions (green-600) |
| `--color-primary-foreground` | `#ffffff` | Text on primary |
| `--color-secondary` | `#f5f5f5` | Secondary actions |
| `--color-secondary-foreground` | `#171717` | Text on secondary |
| `--color-destructive` | `#ef4444` | Delete/danger actions |
| `--color-destructive-foreground` | `#ffffff` | Text on destructive |
| `--color-accent` | `#f5f5f5` | Accent highlights |
| `--color-accent-foreground` | `#171717` | Text on accent |
| `--color-card` | `#ffffff` | Card backgrounds |
| `--color-card-foreground` | `#0a0a0a` | Card text |
| `--color-popover` | `#ffffff` | Dialog/popover backgrounds |
| `--color-popover-foreground` | `#0a0a0a` | Dialog text |

### Dark Mode (JetBrains Darcula)

Activated via `@media (prefers-color-scheme: dark)`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-background` | `#2B2B2B` | Darcula background |
| `--color-foreground` | `#fafafa` | Light text |
| `--color-muted` | `#3C3F41` | Darcula muted |
| `--color-muted-foreground` | `#a3a3a3` | Dimmed text |
| `--color-border` | `#3C3F41` | Subtle borders |
| `--color-primary` | `#22c55e` | Brighter green (green-500) |
| `--color-primary-foreground` | `#2B2B2B` | Dark text on green |
| `--color-card` | `#2B2B2B` | Card background |
| `--color-popover` | `#2B2B2B` | Dialog background |

## Border Radius

```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
```

## Typography

System font stack for optimal performance:

```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", 
             Roboto, "Helvetica Neue", Arial, sans-serif;
```

## Mobile-First Design

### Touch Targets

All interactive elements have minimum 44px height:

```css
button, a, input, select, textarea {
  min-height: 44px;
}
```

### Safe Areas

Utility classes for notched phones:

```css
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.safe-top {
  padding-top: env(safe-area-inset-top, 0);
}
```

## Component Styling Patterns

### Using Color Tokens

```jsx
// Background colors
className="bg-background"    // Page background
className="bg-muted"         // Subtle background
className="bg-card"          // Card background
className="bg-primary"       // Primary button

// Text colors
className="text-foreground"         // Primary text
className="text-muted-foreground"   // Secondary text
className="text-primary"            // Accent text
className="text-destructive"        // Error text

// Borders
className="border-border"    // Default border
className="border-input"     // Input border
```

### Class Merging with `cn()`

Always use `cn()` from `lib/utils.js` to merge classes:

```jsx
import { cn } from "@/lib/utils";

function Button({ className, variant, ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        variant === "destructive" && "bg-destructive text-destructive-foreground",
        className
      )}
      {...props}
    />
  );
}
```

## shadcn/ui Component Conventions

### Button Variants

```jsx
<Button variant="default" />      // bg-primary text-primary-foreground
<Button variant="destructive" />  // bg-destructive text-destructive-foreground
<Button variant="outline" />      // border bg-background hover:bg-accent
<Button variant="ghost" />        // hover:bg-accent hover:text-accent-foreground
```

### Button Sizes

```jsx
<Button size="default" />  // h-10 px-4 py-2
<Button size="sm" />       // h-9 rounded-md px-3
<Button size="lg" />       // h-11 rounded-md px-8
<Button size="icon" />     // h-10 w-10
```

### Card Structure

```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Dialog Structure

```jsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Avbryt
      </Button>
      <Button onClick={handleSubmit}>Bekreft</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Badge Variants

```jsx
<Badge variant="default" />      // bg-primary
<Badge variant="secondary" />    // bg-secondary
<Badge variant="destructive" />  // bg-destructive
<Badge variant="outline" />      // border, no fill
```

## Layout Patterns

### Page Layout with Shell

```jsx
<Shell title="Page Title" showBack={false} showNav={true}>
  <div className="p-4 max-w-lg mx-auto">
    {/* Page content */}
  </div>
</Shell>
```

### Loading State

```jsx
if (loading) {
  return (
    <Shell title="Page">
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    </Shell>
  );
}
```

### Empty State

```jsx
<EmptyState
  icon={PackageOpen}
  title="Ingen ingredienser"
  description="Du har ikke lagt til noen ingredienser ennå."
  action={
    <Button onClick={() => navigate("/ingredients/new")}>
      Legg til ingrediens
    </Button>
  }
/>
```

## Form Styling

### Input with Label

```jsx
<div className="space-y-2">
  <Label htmlFor="name">Navn</Label>
  <Input 
    id="name" 
    type="text" 
    placeholder="Skriv inn navn..." 
    className="w-full"
  />
</div>
```

### Select with Wrapper

```jsx
<div className="space-y-2">
  <Label htmlFor="category">Kategori</Label>
  <SelectWrapper>
    <Select id="category" value={value} onValueChange={setValue}>
      <option value="">Velg kategori...</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.name}>{cat.name}</option>
      ))}
    </Select>
  </SelectWrapper>
</div>
```

### Form Layout

```jsx
<form onSubmit={handleSubmit} className="space-y-6">
  {/* Form fields */}
  <div className="flex gap-3">
    <Button type="button" variant="outline" className="flex-1">
      Avbryt
    </Button>
    <Button type="submit" className="flex-1">
      Lagre
    </Button>
  </div>
</form>
```

## Responsive Breakpoints

Tailwind v4 default breakpoints:

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Example

```jsx
<div className="p-4 md:p-6 lg:p-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Cards */}
  </div>
</div>
```

## Animations

### Spinner

```jsx
<Spinner size="sm" />   // h-4 w-4
<Spinner />             // h-6 w-6 (default)
<Spinner size="lg" />   // h-8 w-8
```

### Transitions

Common transition utilities:

```jsx
className="transition-colors"    // Color changes
className="transition-opacity"   // Fade effects
className="transition-transform" // Scale/move
className="transition-all"       // Everything
```

## Accessibility

- Focus states use `--color-ring` for visibility
- Keyboard navigation supported in all interactive components
- Labels properly associated with inputs via `htmlFor`/`id`
- Dialog focus trap implemented
- Color contrast meets WCAG AA standards
