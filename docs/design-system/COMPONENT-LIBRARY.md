# Component Library - shadcn/ui Best Practices

## Übersicht

**shadcn/ui** ist eine Sammlung von **kopierbaren, anpassbaren React-Komponenten** basierend auf Radix UI und Tailwind CSS.

**Wichtig**: shadcn/ui ist NICHT wie npm-Pakete. Sie kopieren den Code in Ihr Projekt - das gibt Ihnen volle Kontrolle.

**Dateien**: `client/src/components/ui/*`

---

## Warum shadcn/ui?

### Problem ohne Komponenten-Bibliothek

```typescript
// ❌ Überall unterschiedlich
// Seite 1
<button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
  Click
</button>

// Seite 2
<button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Click
</button>

// Seite 3
<button style={{ padding: '12px 24px', backgroundColor: '#0066cc' }}>
  Click
</button>
```

**Resultat**: Alles sieht unterschiedlich aus, schwer zu ändern

### Lösung mit shadcn/ui

```typescript
// ✅ Überall gleich
import { Button } from '@/components/ui/button';

<Button variant="primary">Click</Button>
<Button variant="secondary">Click</Button>
<Button variant="outline">Click</Button>
<Button size="lg">Large</Button>
<Button size="sm">Small</Button>
```

**Resultat**: Konsistent, einfach zu ändern

---

## Verfügbare Komponenten

### Basis-Komponenten

```typescript
/* Navigation & Layout */
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Tabs } from '@/components/ui/tabs';
import { Sidebar } from '@/components/ui/sidebar';

/* Forms */
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

/* Feedback */
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Toast } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';

/* Data Display */
import { Table } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
```

### Projekt-spezifische Komponenten

```typescript
/* Dashboard */
import { DashboardLayout } from '@/components/DashboardLayout';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';

/* Chat */
import { AIChatBox } from '@/components/AIChatBox';

/* Maps */
import { Map } from '@/components/Map';
```

---

## Button Komponente (Beispiel)

### Struktur

```typescript
// client/src/components/ui/button.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base Styles
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

### Nutzung

```typescript
import { Button } from '@/components/ui/button';

// Verschiedene Varianten
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Delete</Button>

// Verschiedene Größen
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>

// Kombinationen
<Button variant="outline" size="lg">
  Large Outline
</Button>

// Mit Icons
<Button>
  <ChevronRight className="mr-2 h-4 w-4" />
  Next
</Button>

// Loading State
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>
```

---

## Card Komponente (Beispiel)

### Struktur

```typescript
// client/src/components/ui/card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### Nutzung

```typescript
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

---

## Best Practices

### ✅ DO

1. **Nutze shadcn/ui Komponenten**
   ```typescript
   import { Button } from '@/components/ui/button';
   <Button>Click</Button>
   ```

2. **Nutze Varianten**
   ```typescript
   <Button variant="outline" size="lg">
     Large Outline
   </Button>
   ```

3. **Kombiniere Komponenten**
   ```typescript
   <Card>
     <CardHeader>
       <CardTitle>Title</CardTitle>
     </CardHeader>
     <CardContent>
       <Button>Action</Button>
     </CardContent>
   </Card>
   ```

4. **Nutze Tailwind für Layout**
   ```typescript
   <div className="flex gap-md">
     <Button>Button 1</Button>
     <Button>Button 2</Button>
   </div>
   ```

5. **Passe Komponenten an (wenn nötig)**
   ```typescript
   <Button className="w-full">Full Width</Button>
   ```

### ❌ DONT

1. **Schreibe custom Button CSS**
   ```typescript
   /* ❌ */
   <button style={{ padding: '12px 24px', backgroundColor: '#0066cc' }}>
     Click
   </button>
   ```

2. **Nutze Bootstrap oder andere UI Libs**
   ```typescript
   /* ❌ */
   <button className="btn btn-primary">Click</button>
   ```

3. **Mische verschiedene Komponenten-Systeme**
   ```typescript
   /* ❌ */
   <Button>shadcn</Button>
   <button className="custom-button">Custom</button>
   ```

4. **Überschreibe Komponenten-Styles komplett**
   ```typescript
   /* ❌ */
   <Button className="!bg-red-500 !text-yellow-200">
     Ugly
   </Button>
   ```

5. **Erstelle neue Komponenten statt Varianten zu nutzen**
   ```typescript
   /* ❌ */
   function MyButton() {
     return <button>...</button>
   }

   /* ✅ */
   <Button variant="custom">...</Button>
   ```

---

## Häufige Fehler

### Fehler 1: Komponente nicht importiert

```typescript
/* ❌ FALSCH */
<Button>Click</Button>  // Button nicht importiert

/* ✅ RICHTIG */
import { Button } from '@/components/ui/button';
<Button>Click</Button>
```

### Fehler 2: Falsche Prop-Namen

```typescript
/* ❌ FALSCH */
<Button color="blue" type="primary">  // Falsche Props

/* ✅ RICHTIG */
<Button variant="default">
```

### Fehler 3: Komponente nicht registriert

```typescript
/* ❌ FALSCH */
import { Button } from '@/components/button';  // Falsch

/* ✅ RICHTIG */
import { Button } from '@/components/ui/button';  // Richtig
```

### Fehler 4: Zu viel Custom CSS

```typescript
/* ❌ FALSCH */
<Button className="!p-10 !text-2xl !bg-purple-900">
  Over-customized
</Button>

/* ✅ RICHTIG */
<Button size="lg">
  Use variants
</Button>
```

### Fehler 5: Komponenten-Props ignorieren

```typescript
/* ❌ FALSCH */
<Button>
  <span className="mr-2">🔍</span>
  Search
</Button>

/* ✅ RICHTIG - Nutze Icon Props */
<Button>
  <Search className="mr-2 h-4 w-4" />
  Search
</Button>
```

---

## Komponenten erweitern

### Neue Variante hinzufügen

```typescript
// client/src/components/ui/button.tsx
const buttonVariants = cva(
  // ... base styles
  {
    variants: {
      variant: {
        // ... existing variants
        success: 'bg-green-600 text-white hover:bg-green-700',  // ← Neu
      },
    },
  }
)

// Nutzung
<Button variant="success">Success</Button>
```

### Wrapper-Komponente erstellen

```typescript
// client/src/components/PrimaryButton.tsx
import { Button } from '@/components/ui/button';

export function PrimaryButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}

// Nutzung
<PrimaryButton>Click</PrimaryButton>
```

---

## Zusammenfassung

| Aspekt | Beschreibung |
|--------|-------------|
| **Dateien** | `client/src/components/ui/*` |
| **Basis** | Radix UI + Tailwind CSS |
| **Strategie** | Kopierbar, anpassbar, vollständig kontrolliert |
| **Varianten** | Vordefinierte Stile (variant, size) |
| **Erweiterung** | Neue Varianten oder Wrapper-Komponenten |
| **Konsistenz** | Alle Komponenten nutzen Design-Tokens |

**Goldstandard**: shadcn/ui ist die Brücke zwischen Tailwind CSS und React Komponenten.

**Nächstes Dokument**: [RESPONSIVE-DESIGN.md](./RESPONSIVE-DESIGN.md)
