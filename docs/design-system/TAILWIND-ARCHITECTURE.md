# Tailwind CSS Architektur - Die Struktur

## Übersicht

**Tailwind CSS** ist ein Utility-First CSS Framework. Statt vorgefertigter Komponenten (wie Bootstrap) nutzen Sie kleine, wiederverwendbare Klassen.

**Dateien**:
- `tailwind.config.ts` - Konfiguration
- `client/src/index.css` - Global Styles
- `client/index.html` - Tailwind Direktiven

---

## Warum Tailwind CSS?

### Problem mit traditionellem CSS

```css
/* ❌ Viel Code, schwer zu warten */
.button {
  padding: 12px 24px;
  background-color: #0066cc;
  color: white;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.button:hover {
  background-color: #0052a3;
}

.button-large {
  padding: 16px 32px;
  font-size: 18px;
}

.button-secondary {
  background-color: #666666;
}
```

### Lösung mit Tailwind

```typescript
// ✅ Kurz, wartbar, konsistent
<button className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
  Click me
</button>

// Mit Varianten
<button className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors lg:px-8 lg:py-4">
  Responsive
</button>
```

---

## Tailwind Config (tailwind.config.ts)

### Struktur

```typescript
import type { Config } from 'tailwindcss'

export default {
  // 1. Welche Dateien sollen gescannt werden?
  content: [
    './client/index.html',
    './client/src/**/*.{js,ts,jsx,tsx}',
  ],

  // 2. Dark Mode Strategie
  darkMode: 'class',

  // 3. Theme erweitern
  theme: {
    extend: {
      // Farben aus Design-Tokens
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: 'hsl(var(--primary) / <alpha-value>)',
        // ...
      },

      // Spacing aus Design-Tokens
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        // ...
      },

      // Typography
      fontSize: {
        xs: 'var(--text-xs)',
        sm: 'var(--text-sm)',
        base: 'var(--text-base)',
        lg: 'var(--text-lg)',
        // ...
      },

      // Border Radius
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },

      // Custom Utilities
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1rem',
          md: '1.5rem',
          lg: '2rem',
          xl: '3rem',
        },
      },
    },
  },

  // 4. Plugins
  plugins: [require('tailwindcss/plugin')],
} satisfies Config
```

---

## Global Styles (client/src/index.css)

### @layer Struktur

```css
/* 1. BASE LAYER - Reset, Variablen, Grundstile */
@layer base {
  :root {
    /* Design-Tokens hier definiert */
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --primary: 200 100% 50%;
    /* ... */
  }

  /* HTML Reset */
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
  }

  /* Semantische HTML */
  h1 {
    @apply text-3xl font-bold;
  }

  h2 {
    @apply text-2xl font-semibold;
  }

  /* ... weitere Resets */
}

/* 2. COMPONENTS LAYER - Wiederverwendbare Klassen */
@layer components {
  /* Custom Container */
  .container {
    @apply max-w-7xl mx-auto px-4;
  }

  /* Flex Defaults */
  .flex {
    @apply flex min-w-0 min-h-0;
  }

  /* Grid Defaults */
  .grid {
    @apply grid min-w-0 min-h-0;
  }

  /* Card Komponente */
  .card {
    @apply bg-card text-card-foreground rounded-lg border border-border p-6;
  }

  /* Button Basis */
  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-colors;
  }

  .btn-primary {
    @apply bg-primary text-primary-foreground hover:bg-primary/90;
  }

  .btn-secondary {
    @apply bg-secondary text-secondary-foreground hover:bg-secondary/90;
  }

  /* Input Basis */
  .input {
    @apply px-3 py-2 rounded-md border border-input bg-input;
    @apply focus:outline-none focus:ring-2 focus:ring-ring;
  }

  /* ... weitere Komponenten */
}

/* 3. UTILITIES LAYER - Tailwind Utilities (automatisch) */
@layer utilities {
  /* Hier können Sie Custom Utilities hinzufügen */
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
}
```

### Warum @layer?

```css
/* Ohne @layer - Konflikte! */
.my-class { color: red; }
.text-blue { color: blue; }  /* ← Gewinnt, weil später */

/* Mit @layer - Richtige Reihenfolge */
@layer base { /* Niedrigste Priorität */ }
@layer components { /* Mittlere Priorität */ }
@layer utilities { /* Höchste Priorität */ }
```

---

## Tailwind Klassen verwenden

### Spacing (Padding, Margin)

```typescript
/* Padding */
<div className="p-md">           {/* padding: var(--spacing-md) */}
<div className="px-lg py-md">    {/* padding-x: lg, padding-y: md */}
<div className="pt-sm pb-lg">    {/* padding-top: sm, padding-bottom: lg */}

/* Margin */
<div className="m-md">           {/* margin: var(--spacing-md) */}
<div className="mx-auto">        {/* margin-left/right: auto (zentrieren) */}
<div className="mb-lg">          {/* margin-bottom: lg */}

/* Gap (für Flex/Grid) */
<div className="flex gap-md">    {/* gap: var(--spacing-md) */}
```

### Farben

```typescript
/* Background */
<div className="bg-primary">              {/* background: var(--primary) */}
<div className="bg-primary/50">           {/* Mit Transparenz */}
<div className="dark:bg-card">            {/* Dark Mode */}

/* Text */
<div className="text-primary">           {/* color: var(--primary) */}
<div className="text-foreground">        {/* Semantische Farbe */}

/* Border */
<div className="border border-border">   {/* border: 1px solid var(--border) */}
<div className="border-b-2 border-primary"> {/* Bottom Border */}
```

### Typography

```typescript
/* Font Size */
<h1 className="text-3xl">       {/* font-size: var(--text-3xl) */}
<p className="text-sm">         {/* font-size: var(--text-sm) */}

/* Font Weight */
<span className="font-bold">   {/* font-weight: 700 */}
<span className="font-semibold"> {/* font-weight: 600 */}

/* Line Height */
<p className="leading-relaxed"> {/* line-height: var(--leading-relaxed) */}
```

### Layout

```typescript
/* Flex */
<div className="flex items-center justify-between gap-md">
  {/* display: flex, align-items: center, justify-content: space-between */}

/* Grid */
<div className="grid grid-cols-3 gap-md">
  {/* display: grid, grid-template-columns: repeat(3, minmax(0, 1fr)) */}

/* Container */
<div className="container">
  {/* max-width: 7xl, margin: 0 auto, padding: 1rem */}
```

### Responsive Design

```typescript
/* Mobile First */
<div className="text-sm md:text-base lg:text-lg">
  {/* Breakpoints: md (768px), lg (1024px) */}

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 Spalte Mobile, 2 Spalten Tablet, 3 Spalten Desktop */}

<div className="hidden md:block">
  {/* Versteckt auf Mobile, sichtbar ab Tablet */}
```

---

## Breakpoints

```typescript
/* Tailwind Standard Breakpoints */
sm: 640px    /* Kleine Geräte */
md: 768px    /* Tablets */
lg: 1024px   /* Laptops */
xl: 1280px   /* Große Monitore */
2xl: 1536px  /* Sehr große Monitore */
```

**Nutzung**:
```typescript
<div className="text-sm md:text-base lg:text-lg xl:text-xl">
  Responsive Text
</div>
```

---

## Best Practices

### ✅ DO

1. **Nutze Tailwind Klassen**
   ```typescript
   <div className="p-md bg-primary text-white rounded-md">
   ```

2. **Mobile-First Responsive**
   ```typescript
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

3. **Nutze @apply für wiederholte Klassen**
   ```css
   @layer components {
     .card {
       @apply bg-card rounded-lg border border-border p-6;
     }
   }
   ```

4. **Nutze Design-Tokens**
   ```typescript
   <div className="p-md">  /* Nutze Token */
   ```

5. **Arbitrary Values nur wenn nötig**
   ```typescript
   <div className="w-[500px]">  /* Nur wenn kein Token passt */
   ```

### ❌ DONT

1. **Inline Styles**
   ```typescript
   <div style={{ padding: '16px', color: 'blue' }}>  /* ❌ */
   ```

2. **Hardcodierte Werte**
   ```typescript
   <div className="p-4">  /* ❌ Nutze p-md statt */
   ```

3. **Custom CSS**
   ```css
   .my-button { padding: 12px; }  /* ❌ Nutze Tailwind */
   ```

4. **Gemischte Systeme**
   ```typescript
   <div className="p-4" style={{ color: 'blue' }}>  /* ❌ */
   ```

5. **Zu viele Klassen**
   ```typescript
   {/* ❌ Zu lang */}
   <div className="p-4 m-2 bg-white text-black border border-gray-200 rounded-md shadow-md hover:shadow-lg transition-shadow">

   {/* ✅ Nutze @layer components statt */}
   <div className="card">
   ```

---

## Häufige Fehler

### Fehler 1: Falsche Spacing-Klasse

```typescript
/* ❌ FALSCH */
<div className="p-4">  /* Tailwind Default, nicht unser Token */

/* ✅ RICHTIG */
<div className="p-md">  /* Unser Token */
```

### Fehler 2: Hardcodierte Farben

```typescript
/* ❌ FALSCH */
<div className="text-blue-500">  /* Nicht unser Farbschema */

/* ✅ RICHTIG */
<div className="text-primary">  /* Unser Token */
```

### Fehler 3: Desktop-First Responsive

```typescript
/* ❌ FALSCH - Desktop-First */
<div className="grid grid-cols-3 sm:grid-cols-2 xs:grid-cols-1">

/* ✅ RICHTIG - Mobile-First */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Fehler 4: Flex/Grid Overflow

```typescript
/* ❌ FALSCH - Kinder quetschen sich */
<div className="flex">
  <div className="w-full">...</div>
  <div className="w-full">...</div>
</div>

/* ✅ RICHTIG - min-w-0 verhindert Overflow */
<div className="flex">
  <div className="min-w-0 flex-1">...</div>
  <div className="min-w-0 flex-1">...</div>
</div>
```

---

## Debugging

### Tailwind Klassen prüfen

```bash
# Tailwind generierte CSS anschauen
npx tailwindcss -i client/src/index.css -o /tmp/tailwind.css

# Dann anschauen
cat /tmp/tailwind.css | grep "p-md"
```

### Browser DevTools

```javascript
// In Browser Console
getComputedStyle(document.querySelector('.p-md')).padding
// Output: "1rem"
```

---

## Zusammenfassung

| Aspekt | Beschreibung |
|--------|-------------|
| **Datei** | `tailwind.config.ts` + `client/src/index.css` |
| **Strategie** | Utility-First (kleine Klassen) |
| **Struktur** | @layer base/components/utilities |
| **Responsive** | Mobile-First mit Breakpoints |
| **Tokens** | CSS-Variablen in Tailwind integriert |
| **Wartbarkeit** | Zentrale Kontrolle, keine Duplikate |

**Goldstandard**: Tailwind ist die Brücke zwischen Design-Tokens und React Komponenten.

**Nächstes Dokument**: [COMPONENT-LIBRARY.md](./COMPONENT-LIBRARY.md)
