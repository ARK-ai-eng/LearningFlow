# Design-Tokens - Das Fundament der Konsistenz

## Übersicht

**Design-Tokens** sind zentral definierte Werte (Farben, Abstände, Schriftgrößen), die überall im Projekt verwendet werden. Sie sind das **Fundament** für konsistentes Design.

**Datei**: `client/src/index.css` (Zeilen 1-50)

---

## Warum Design-Tokens?

### Problem ohne Tokens

```typescript
// ❌ FALSCH - Überall unterschiedlich
<div style={{ padding: '16px', color: '#3b82f6' }}>...</div>
<div className="px-4 text-blue-500">...</div>
<div className="p-2 text-blue-600">...</div>
```

**Resultat**: Alles sieht unterschiedlich aus, schwer zu ändern

### Lösung mit Tokens

```typescript
// ✅ RICHTIG - Überall gleich
<div className="p-md text-primary">...</div>
<div className="p-md text-primary">...</div>
<div className="p-md text-primary">...</div>
```

**Resultat**: Konsistent, leicht zu ändern (eine Stelle)

---

## Alle Design-Tokens

### 1. Farben (OKLCH Format)

```css
/* Light Mode (Default) */
:root {
  /* Semantische Farben */
  --background: 0 0% 100%;           /* Weiß */
  --foreground: 0 0% 3.6%;           /* Dunkelgrau */
  
  --card: 0 0% 100%;                 /* Weiß */
  --card-foreground: 0 0% 3.6%;      /* Dunkelgrau */
  
  --primary: 200 100% 50%;           /* Cyan/Blau */
  --primary-foreground: 0 0% 100%;   /* Weiß */
  
  --secondary: 160 100% 50%;         /* Grün */
  --secondary-foreground: 0 0% 100%; /* Weiß */
  
  --accent: 40 100% 50%;             /* Orange */
  --accent-foreground: 0 0% 100%;    /* Weiß */
  
  --destructive: 0 100% 50%;         /* Rot */
  --destructive-foreground: 0 0% 100%; /* Weiß */
  
  --muted: 0 0% 89.8%;               /* Hellgrau */
  --muted-foreground: 0 0% 45.3%;    /* Mittelgrau */
  
  --border: 0 0% 89.8%;              /* Hellgrau */
  --input: 0 0% 100%;                /* Weiß */
  --ring: 200 100% 50%;              /* Cyan (Primary) */
  
  --popover: 0 0% 100%;              /* Weiß */
  --popover-foreground: 0 0% 3.6%;   /* Dunkelgrau */
}

/* Dark Mode */
.dark {
  --background: 0 0% 3.6%;           /* Dunkelgrau */
  --foreground: 0 0% 98%;            /* Fast Weiß */
  
  --card: 0 0% 10%;                  /* Dunkelgrau */
  --card-foreground: 0 0% 98%;       /* Fast Weiß */
  
  --primary: 200 100% 50%;           /* Cyan (gleich) */
  --primary-foreground: 0 0% 3.6%;   /* Dunkelgrau */
  
  /* ... weitere Farben für Dark Mode */
}
```

**Format: OKLCH** (nicht HSL!)
- **O**: Okta (Lightness) - 0-100%
- **L**: Chroma (Sättigung) - 0-150
- **C**: Hue (Farbton) - 0-360°

**Warum OKLCH?**
- Wahrnehmungsgerecht (Farben sehen in Light/Dark gleich aus)
- Bessere Kontraste
- Moderne Standard

### 2. Abstände (Spacing)

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */
}
```

**Nutzung**:
```css
padding: var(--spacing-md);     /* 16px */
margin-bottom: var(--spacing-lg); /* 24px */
gap: var(--spacing-sm);         /* 8px */
```

**Nicht nutzen**:
```css
padding: 16px;        /* ❌ Hardcodiert */
padding: 1rem;        /* ❌ Nicht konsistent */
padding: var(--p-4);  /* ❌ Falscher Name */
```

### 3. Typographie

```css
:root {
  /* Font Families */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

**Nutzung**:
```css
font-size: var(--text-lg);
line-height: var(--leading-normal);
font-weight: var(--font-semibold);
```

### 4. Border & Radius

```css
:root {
  --radius: 0.5rem;      /* 8px - Standard */
  --radius-sm: 0.25rem;  /* 4px - Klein */
  --radius-md: 0.5rem;   /* 8px - Mittel */
  --radius-lg: 1rem;     /* 16px - Groß */
  --radius-full: 9999px; /* Vollständig rund */
  
  --border-width: 1px;
}
```

**Nutzung**:
```css
border-radius: var(--radius-md);
border: var(--border-width) solid var(--border);
```

### 5. Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

**Nutzung**:
```css
box-shadow: var(--shadow-md);
```

### 6. Transitions & Animations

```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  
  --easing-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Nutzung**:
```css
transition: all var(--duration-normal) var(--easing-ease-in-out);
```

---

## Wie Tokens verwendet werden

### In Tailwind CSS

```typescript
// tailwind.config.ts
export default {
  theme: {
    colors: {
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
      primary: 'hsl(var(--primary))',
      'primary-foreground': 'hsl(var(--primary-foreground))',
      // ...
    },
    spacing: {
      xs: 'var(--spacing-xs)',
      sm: 'var(--spacing-sm)',
      md: 'var(--spacing-md)',
      lg: 'var(--spacing-lg)',
      xl: 'var(--spacing-xl)',
      // ...
    },
    fontSize: {
      xs: 'var(--text-xs)',
      sm: 'var(--text-sm)',
      base: 'var(--text-base)',
      lg: 'var(--text-lg)',
      // ...
    },
  },
}
```

### In React Komponenten

```typescript
// ✅ RICHTIG - Nutze Tailwind Klassen
<div className="p-md bg-primary text-primary-foreground rounded-md">
  Content
</div>

// ✅ RICHTIG - Nutze CSS-Variablen
<div style={{ padding: 'var(--spacing-md)', color: 'var(--primary)' }}>
  Content
</div>

// ❌ FALSCH - Hardcodierte Werte
<div style={{ padding: '16px', color: '#0066cc' }}>
  Content
</div>

// ❌ FALSCH - Gemischte Systeme
<div className="p-4" style={{ color: 'blue' }}>
  Content
</div>
```

---

## Token-Hierarchie

```
Globale Tokens (index.css)
  ↓
Tailwind Config (tailwind.config.ts)
  ↓
Tailwind Klassen (className="p-md bg-primary")
  ↓
React Komponenten (shadcn/ui Button, etc.)
  ↓
Seiten & Features
```

**Wichtig**: Jede Ebene nutzt die Ebene darunter - nicht überspringen!

---

## Tokens ändern (Zentrale Kontrolle)

### Szenario: Primärfarbe ändern

**Alt**: Überall `#0066cc` suchen und ersetzen (100+ Stellen)

**Mit Tokens**: Eine Stelle ändern

```css
/* client/src/index.css */
:root {
  --primary: 200 100% 50%;  /* ← Hier ändern */
}
```

**Resultat**: Alle Komponenten nutzen die neue Farbe automatisch

---

## Best Practices

### ✅ DO

1. **Nutze Tokens überall**
   ```css
   padding: var(--spacing-md);
   color: var(--primary);
   ```

2. **Nutze Tailwind Klassen**
   ```typescript
   <div className="p-md text-primary bg-card">
   ```

3. **Konsistente Naming**
   ```css
   --spacing-md  /* Gut */
   --space-m     /* Schlecht */
   --p-4         /* Schlecht */
   ```

4. **Dokumentiere neue Tokens**
   ```css
   --custom-token: value; /* Beschreibung */
   ```

### ❌ DONT

1. **Hardcodierte Werte**
   ```css
   padding: 16px;        /* ❌ */
   color: #0066cc;       /* ❌ */
   ```

2. **Gemischte Systeme**
   ```typescript
   <div className="p-4" style={{ color: '#0066cc' }}>
   /* ❌ Tailwind + Inline Styles */
   ```

3. **Eigene Variablen**
   ```css
   --my-custom-color: blue;  /* ❌ Nutze --primary statt */
   ```

4. **Magische Zahlen**
   ```css
   margin-top: 23px;  /* ❌ Warum 23? */
   margin-top: var(--spacing-lg); /* ✅ */
   ```

---

## Tokens erweitern (Wenn nötig)

### Neuen Token hinzufügen

1. **Definieren** in `client/src/index.css`:
   ```css
   :root {
     --spacing-4xl: 5rem; /* Neuer Token */
   }
   ```

2. **In Tailwind registrieren** (tailwind.config.ts):
   ```typescript
   spacing: {
     '4xl': 'var(--spacing-4xl)',
   }
   ```

3. **Verwenden**:
   ```typescript
   <div className="p-4xl">...</div>
   ```

4. **Dokumentieren** (dieses Dokument aktualisieren)

---

## Tokens in verschiedenen Kontexten

### Light Mode (Standard)

```css
:root {
  --background: 0 0% 100%;      /* Weiß */
  --foreground: 0 0% 3.6%;      /* Dunkelgrau */
}
```

### Dark Mode

```css
.dark {
  --background: 0 0% 3.6%;      /* Dunkelgrau */
  --foreground: 0 0% 98%;       /* Fast Weiß */
}
```

**Wichtig**: Tokens ändern sich automatisch, Komponenten bleiben gleich!

---

## Debugging

### Tokens prüfen (Browser DevTools)

```javascript
// In Browser Console
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// Output: "200 100% 50%"
```

### Tokens in Tailwind prüfen

```bash
# Tailwind Config anschauen
npx tailwindcss -i client/src/index.css -o /tmp/out.css --watch
```

---

## Zusammenfassung

| Aspekt | Beschreibung |
|--------|-------------|
| **Datei** | `client/src/index.css` |
| **Format** | CSS-Variablen (--name) |
| **Farbformat** | OKLCH (nicht HSL) |
| **Spacing** | xs, sm, md, lg, xl, 2xl, 3xl |
| **Zentrale Kontrolle** | Eine Stelle ändern = überall ändern |
| **Nutzen** | Konsistenz, Wartbarkeit, Skalierbarkeit |

**Goldstandard**: Tokens sind das Fundament - alles andere baut darauf auf.

**Nächstes Dokument**: [TAILWIND-ARCHITECTURE.md](./TAILWIND-ARCHITECTURE.md)
