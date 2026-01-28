# Responsive Design & Layout Patterns

## Übersicht

**Responsive Design** bedeutet: Eine Website funktioniert auf allen Geräten (Mobile, Tablet, Desktop) ohne Probleme.

**Strategie**: Mobile-First (nicht Desktop-First)

---

## Warum Mobile-First?

### Desktop-First (❌ Falsch)

```typescript
/* Schreibe zuerst für Desktop */
<div className="grid grid-cols-3 gap-4">  {/* 3 Spalten */}
  {/* Dann: Wie mache ich das auf Mobile? */}
  {/* Kompliziert! */}
</div>
```

### Mobile-First (✅ Richtig)

```typescript
/* Schreibe zuerst für Mobile */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 Spalte */}
  {/* Tablet: 2 Spalten */}
  {/* Desktop: 3 Spalten */}
</div>
```

**Warum besser?**
- Einfacher zu denken (klein → groß)
- Mobile funktioniert immer
- Desktop ist "Bonus"
- Bessere Performance

---

## Breakpoints

```typescript
/* Tailwind Standard Breakpoints */
(kein Prefix)  0px      /* Mobile (Standard) */
sm:            640px    /* Kleine Geräte */
md:            768px    /* Tablets */
lg:            1024px   /* Laptops */
xl:            1280px   /* Große Monitore */
2xl:           1536px   /* Sehr große Monitore */
```

**Nutzung**:
```typescript
<div className="text-sm md:text-base lg:text-lg">
  {/* Mobile: text-sm (14px) */}
  {/* Tablet: text-base (16px) */}
  {/* Desktop: text-lg (18px) */}
</div>
```

---

## Layout Patterns

### 1. Hero Section (Mit Divider)

```typescript
// ✅ RICHTIG - Responsive Hero
<section className="relative bg-gradient-to-r from-primary to-secondary">
  <div className="container py-12 md:py-20 lg:py-32">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      {/* Text Content */}
      <div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
          Welcome
        </h1>
        <p className="mt-4 text-lg text-white/80">
          Description here
        </p>
        <Button className="mt-6">Get Started</Button>
      </div>

      {/* Image/Visual */}
      <div className="hidden md:block">
        <img src="hero.png" alt="Hero" className="w-full" />
      </div>
    </div>
  </div>

  {/* SVG Divider */}
  <svg
    className="w-full"
    viewBox="0 0 1200 100"
    preserveAspectRatio="none"
  >
    <path
      d="M0,50 Q300,0 600,50 T1200,50 L1200,100 L0,100 Z"
      fill="white"
    />
  </svg>
</section>
```

**Wichtig bei Divider**:
- Flat/closing edge muss am Boundary sein
- Padding/Margin kompensieren für Clipping
- Nutze `preserveAspectRatio="none"` für responsive SVG

### 2. Card Grid (Responsive)

```typescript
// ✅ RICHTIG - Responsive Card Grid
<div className="container py-12">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map((item) => (
      <Card key={item.id}>
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {item.description}
        </CardContent>
      </Card>
    ))}
  </div>
</div>

{/* Mobile: 1 Spalte */}
{/* Tablet: 2 Spalten */}
{/* Desktop: 3 Spalten */}
```

### 3. Sidebar Layout (Dashboard)

```typescript
// ✅ RICHTIG - Responsive Sidebar
<div className="flex flex-col md:flex-row gap-6">
  {/* Sidebar */}
  <aside className="w-full md:w-64 flex-shrink-0">
    <nav className="space-y-2">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/courses">Courses</Link>
      <Link href="/certificates">Certificates</Link>
    </nav>
  </aside>

  {/* Main Content */}
  <main className="flex-1 min-w-0">
    {/* Content */}
  </main>
</div>

{/* Mobile: Sidebar oben, Content unten (flex-col) */}
{/* Desktop: Sidebar links, Content rechts (flex-row) */}
```

### 4. Form Layout (Responsive)

```typescript
// ✅ RICHTIG - Responsive Form
<form className="space-y-6 max-w-2xl">
  {/* Single Column */}
  <div>
    <label className="block text-sm font-medium mb-2">Email</label>
    <Input type="email" placeholder="your@email.com" />
  </div>

  {/* Two Columns (Desktop) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-2">First Name</label>
      <Input placeholder="First" />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Last Name</label>
      <Input placeholder="Last" />
    </div>
  </div>

  {/* Buttons */}
  <div className="flex flex-col sm:flex-row gap-4">
    <Button className="flex-1">Submit</Button>
    <Button variant="outline" className="flex-1">Cancel</Button>
  </div>
</form>

{/* Mobile: Alles untereinander */}
{/* Desktop: 2 Spalten für Name-Felder */}
```

### 5. Navigation (Responsive)

```typescript
// ✅ RICHTIG - Responsive Navigation
<nav className="bg-card border-b border-border">
  <div className="container flex items-center justify-between py-4">
    {/* Logo */}
    <div className="font-bold text-lg">Logo</div>

    {/* Menu (Hidden on Mobile) */}
    <div className="hidden md:flex gap-6">
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/contact">Contact</Link>
    </div>

    {/* Mobile Menu Button */}
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="h-6 w-6" />
    </Button>
  </div>
</nav>

{/* Mobile: Menu Button */}
{/* Desktop: Full Menu */}
```

### 6. Table (Responsive)

```typescript
// ✅ RICHTIG - Responsive Table
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-border">
        <th className="text-left py-3 px-4">Name</th>
        <th className="text-left py-3 px-4 hidden md:table-cell">Email</th>
        <th className="text-left py-3 px-4">Status</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item) => (
        <tr key={item.id} className="border-b border-border hover:bg-muted">
          <td className="py-3 px-4">{item.name}</td>
          <td className="py-3 px-4 hidden md:table-cell">{item.email}</td>
          <td className="py-3 px-4">
            <Badge>{item.status}</Badge>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

{/* Mobile: Email versteckt */}
{/* Desktop: Email sichtbar */}
```

---

## Best Practices

### ✅ DO

1. **Mobile-First denken**
   ```typescript
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

2. **Nutze Breakpoints richtig**
   ```typescript
   <div className="text-sm md:text-base lg:text-lg">
   ```

3. **Verstecke/Zeige Elemente responsive**
   ```typescript
   <div className="hidden md:block">Desktop only</div>
   <div className="md:hidden">Mobile only</div>
   ```

4. **Nutze Flex/Grid für Layout**
   ```typescript
   <div className="flex flex-col md:flex-row">
   ```

5. **Teste auf echten Geräten**
   ```bash
   # Öffne auf iPhone, iPad, Desktop
   ```

### ❌ DONT

1. **Desktop-First denken**
   ```typescript
   /* ❌ */
   <div className="grid grid-cols-3 sm:grid-cols-2 xs:grid-cols-1">
   ```

2. **Zu viele Breakpoints**
   ```typescript
   /* ❌ */
   <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl">
   ```

3. **Verstecke zu viel**
   ```typescript
   /* ❌ */
   <div className="hidden lg:block">Nur auf großen Monitoren</div>
   ```

4. **Nutze Media Queries manuell**
   ```css
   /* ❌ */
   @media (max-width: 768px) {
     .my-class { ... }
   }
   
   /* ✅ */
   <div className="md:...">
   ```

5. **Vergesse Touch-Targets**
   ```typescript
   /* ❌ */
   <button className="p-1">Zu klein</button>
   
   /* ✅ */
   <button className="p-3 md:p-2">Mindestens 44x44px</button>
   ```

---

## Häufige Fehler

### Fehler 1: Falsche Breakpoint-Reihenfolge

```typescript
/* ❌ FALSCH - Desktop-First */
<div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1">

/* ✅ RICHTIG - Mobile-First */
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Fehler 2: Zu kleine Touch-Targets

```typescript
/* ❌ FALSCH - Zu klein */
<button className="p-1">Click</button>

/* ✅ RICHTIG - Mindestens 44x44px */
<button className="p-3">Click</button>
```

### Fehler 3: Overflow bei Flex

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

### Fehler 4: Keine Safe Area für Mobile

```typescript
/* ❌ FALSCH - Auf iPhone mit Notch unsichtbar */
<div className="fixed top-0 left-0 right-0">
  Header
</div>

/* ✅ RICHTIG - Safe Area beachten */
<div className="fixed top-0 left-0 right-0 pt-safe">
  Header
</div>
```

### Fehler 5: Bilder nicht responsive

```typescript
/* ❌ FALSCH - Feste Größe */
<img src="image.jpg" width="1200" height="600" />

/* ✅ RICHTIG - Responsive */
<img
  src="image.jpg"
  alt="Description"
  className="w-full h-auto"
/>
```

---

## Testing Responsive Design

### Browser DevTools

```
1. Öffne DevTools (F12)
2. Klicke auf Device Toggle (Ctrl+Shift+M)
3. Wähle verschiedene Geräte
4. Teste auf Breakpoints
```

### Echte Geräte testen

```bash
# Finde lokale IP
ifconfig | grep "inet "

# Öffne auf Handy
http://192.168.1.100:3000
```

### Automatische Tests

```typescript
// Vitest mit viewport testing
describe('Responsive', () => {
  it('should stack on mobile', () => {
    // Test mobile layout
  });

  it('should be side-by-side on desktop', () => {
    // Test desktop layout
  });
});
```

---

## Zusammenfassung

| Aspekt | Beschreibung |
|--------|-------------|
| **Strategie** | Mobile-First (klein → groß) |
| **Breakpoints** | sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px) |
| **Layouts** | Flex/Grid mit Breakpoints |
| **Touch** | Mindestens 44x44px |
| **Bilder** | Responsive mit `w-full h-auto` |
| **Testing** | DevTools + echte Geräte |

**Goldstandard**: Mobile-First Responsive Design mit Tailwind Breakpoints.

**Nächstes Dokument**: [DO-DONT-DESIGN.md](./DO-DONT-DESIGN.md)
