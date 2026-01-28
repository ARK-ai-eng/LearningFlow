# Do's & Don'ts - Praktische Design Checkliste

## Übersicht

Diese Checkliste verhindert die häufigsten Design-Fehler, die zu inkonsistentem UI führen (wie bei Gemini Flash).

---

## Spacing & Layout

### ✅ DO

- [ ] **Nutze Design-Tokens für Spacing**
  ```typescript
  <div className="p-md">  /* Nutze Token */
  ```

- [ ] **Nutze Tailwind Spacing Klassen**
  ```typescript
  <div className="p-md m-lg gap-sm">
  ```

- [ ] **Konsistente Abstände überall**
  ```typescript
  /* Alle Cards haben p-6 */
  <Card className="p-6">
  ```

- [ ] **Flex/Grid mit min-w-0**
  ```typescript
  <div className="flex">
    <div className="min-w-0 flex-1">...</div>
  </div>
  ```

- [ ] **Container für max-width**
  ```typescript
  <div className="container">  /* max-w-7xl mx-auto px-4 */
  ```

### ❌ DONT

- [ ] **Hardcodierte Pixel-Werte**
  ```typescript
  /* ❌ */
  <div style={{ padding: '16px' }}>
  ```

- [ ] **Gemischte Spacing-Systeme**
  ```typescript
  /* ❌ */
  <div className="p-4 m-6">  /* Tailwind Default, nicht unser Token */
  ```

- [ ] **Unterschiedliche Abstände für gleiche Elemente**
  ```typescript
  /* ❌ */
  <Card className="p-4">Card 1</Card>
  <Card className="p-6">Card 2</Card>
  ```

- [ ] **Flex ohne min-w-0**
  ```typescript
  /* ❌ */
  <div className="flex">
    <div className="w-full">...</div>  /* Quetscht sich! */
  </div>
  ```

- [ ] **Inline Styles für Layout**
  ```typescript
  /* ❌ */
  <div style={{ display: 'flex', padding: '20px' }}>
  ```

---

## Farben & Kontrast

### ✅ DO

- [ ] **Nutze Design-Token Farben**
  ```typescript
  <div className="bg-primary text-primary-foreground">
  ```

- [ ] **Semantische Farben verwenden**
  ```typescript
  <div className="bg-card text-card-foreground">  /* Nicht bg-white */
  ```

- [ ] **Ausreichend Kontrast**
  ```typescript
  /* ✅ Dunkler Text auf hellem Hintergrund */
  <div className="bg-background text-foreground">
  ```

- [ ] **Dark Mode automatisch**
  ```typescript
  /* ✅ Tokens ändern sich automatisch */
  <div className="bg-primary">  /* Funktioniert in Light & Dark */
  ```

- [ ] **Farben mit Transparenz**
  ```typescript
  <div className="bg-primary/50">  /* Mit Transparenz */
  ```

### ❌ DONT

- [ ] **Hardcodierte Farben**
  ```typescript
  /* ❌ */
  <div style={{ color: '#0066cc' }}>
  ```

- [ ] **Tailwind Standard Farben**
  ```typescript
  /* ❌ */
  <div className="text-blue-500">  /* Nicht unser Farbschema */
  ```

- [ ] **Schlechter Kontrast**
  ```typescript
  /* ❌ */
  <div className="bg-gray-100 text-gray-200">  /* Zu ähnlich */
  ```

- [ ] **Unterschiedliche Farben für gleiche Elemente**
  ```typescript
  /* ❌ */
  <Button className="bg-blue-500">Button 1</Button>
  <Button className="bg-cyan-500">Button 2</Button>
  ```

- [ ] **Farben ohne Semantik**
  ```typescript
  /* ❌ */
  <div className="bg-red-500">  /* Warum rot? Fehler? Warnung? */
  ```

---

## Typographie

### ✅ DO

- [ ] **Nutze Tailwind Font Sizes**
  ```typescript
  <h1 className="text-3xl font-bold">
  <p className="text-base">
  ```

- [ ] **Konsistente Font Weights**
  ```typescript
  <h1 className="font-bold">      /* 700 */
  <p className="font-normal">     /* 400 */
  <span className="font-semibold"> /* 600 */
  ```

- [ ] **Lesbare Zeilenhöhe**
  ```typescript
  <p className="leading-relaxed">  /* 1.625 */
  ```

- [ ] **Hierarchie durch Größe**
  ```typescript
  <h1 className="text-3xl">Heading 1</h1>
  <h2 className="text-2xl">Heading 2</h2>
  <p className="text-base">Paragraph</p>
  ```

- [ ] **Konsistente Schriftart**
  ```typescript
  /* Alle nutzen var(--font-sans) */
  ```

### ❌ DONT

- [ ] **Unterschiedliche Font Sizes für gleiche Elemente**
  ```typescript
  /* ❌ */
  <Button className="text-sm">Button 1</Button>
  <Button className="text-base">Button 2</Button>
  ```

- [ ] **Zu viele verschiedene Größen**
  ```typescript
  /* ❌ */
  <h1 className="text-4xl">
  <h2 className="text-3xl">
  <h3 className="text-2xl">
  <h4 className="text-xl">
  <h5 className="text-lg">
  <h6 className="text-base">
  ```

- [ ] **Schlechte Lesbarkeit**
  ```typescript
  /* ❌ */
  <p className="text-xs leading-tight">  /* Zu klein, zu eng */
  ```

- [ ] **Gemischte Schriftarten**
  ```typescript
  /* ❌ */
  <div style={{ fontFamily: 'Arial' }}>  /* Nicht unser Font */
  ```

- [ ] **Keine Hierarchie**
  ```typescript
  /* ❌ */
  <h1 className="text-base">Heading</h1>  /* Sieht wie normaler Text aus */
  ```

---

## Komponenten

### ✅ DO

- [ ] **Nutze shadcn/ui Komponenten**
  ```typescript
  import { Button } from '@/components/ui/button';
  <Button>Click</Button>
  ```

- [ ] **Nutze Komponenten-Varianten**
  ```typescript
  <Button variant="primary">Primary</Button>
  <Button variant="outline">Outline</Button>
  ```

- [ ] **Nutze Komponenten-Größen**
  ```typescript
  <Button size="sm">Small</Button>
  <Button size="lg">Large</Button>
  ```

- [ ] **Kombiniere Komponenten**
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

- [ ] **Passe mit Tailwind an (minimal)**
  ```typescript
  <Button className="w-full">Full Width</Button>
  ```

### ❌ DONT

- [ ] **Schreibe custom Button CSS**
  ```typescript
  /* ❌ */
  <button style={{ padding: '12px', backgroundColor: '#0066cc' }}>
  ```

- [ ] **Nutze Bootstrap oder andere UI Libs**
  ```typescript
  /* ❌ */
  <button className="btn btn-primary">
  ```

- [ ] **Überschreibe Komponenten komplett**
  ```typescript
  /* ❌ */
  <Button className="!bg-red-500 !text-yellow-200 !p-10">
  ```

- [ ] **Erstelle neue Komponenten statt Varianten**
  ```typescript
  /* ❌ */
  function MyButton() { return <button>...</button> }

  /* ✅ */
  <Button variant="custom">
  ```

- [ ] **Mische verschiedene Komponenten-Systeme**
  ```typescript
  /* ❌ */
  <Button>shadcn</Button>
  <button className="custom-btn">Custom</button>
  ```

---

## Responsive Design

### ✅ DO

- [ ] **Mobile-First Responsive**
  ```typescript
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  ```

- [ ] **Nutze Breakpoints richtig**
  ```typescript
  <div className="text-sm md:text-base lg:text-lg">
  ```

- [ ] **Verstecke/Zeige responsive**
  ```typescript
  <div className="hidden md:block">Desktop only</div>
  <div className="md:hidden">Mobile only</div>
  ```

- [ ] **Teste auf echten Geräten**
  ```bash
  # Öffne auf iPhone, iPad, Desktop
  ```

- [ ] **Mindestens 44x44px Touch-Targets**
  ```typescript
  <Button className="p-3">  /* Mindestens 44x44px */
  ```

### ❌ DONT

- [ ] **Desktop-First Responsive**
  ```typescript
  /* ❌ */
  <div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
  ```

- [ ] **Zu viele Breakpoints**
  ```typescript
  /* ❌ */
  <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
  ```

- [ ] **Verstecke zu viel**
  ```typescript
  /* ❌ */
  <div className="hidden lg:block">  /* Nur auf großen Monitoren */
  ```

- [ ] **Nutze Media Queries manuell**
  ```css
  /* ❌ */
  @media (max-width: 768px) { ... }
  ```

- [ ] **Zu kleine Touch-Targets**
  ```typescript
  /* ❌ */
  <button className="p-1">  /* Zu klein */
  ```

---

## Konsistenz

### ✅ DO

- [ ] **Gleiche Elemente = gleiche Styles**
  ```typescript
  /* ✅ Alle Cards gleich */
  <Card className="p-6">Card 1</Card>
  <Card className="p-6">Card 2</Card>
  <Card className="p-6">Card 3</Card>
  ```

- [ ] **Buttons überall gleich**
  ```typescript
  /* ✅ Alle Buttons gleich */
  <Button>Action 1</Button>
  <Button>Action 2</Button>
  <Button>Action 3</Button>
  ```

- [ ] **Spacing überall konsistent**
  ```typescript
  /* ✅ Alle nutzen p-md */
  <div className="p-md">
  ```

- [ ] **Farben überall konsistent**
  ```typescript
  /* ✅ Alle nutzen text-primary */
  <span className="text-primary">
  ```

- [ ] **Dokumentiere Abweichungen**
  ```typescript
  /* Wenn anders, dann mit Kommentar */
  <Button className="w-full">  {/* Spezialfall: Full Width */}
  ```

### ❌ DONT

- [ ] **Unterschiedliche Styles für gleiche Elemente**
  ```typescript
  /* ❌ */
  <Card className="p-4">Card 1</Card>
  <Card className="p-6">Card 2</Card>
  <Card className="p-8">Card 3</Card>
  ```

- [ ] **Buttons überall anders**
  ```typescript
  /* ❌ */
  <button className="px-4 py-2 bg-blue-500">Button 1</button>
  <button className="px-6 py-3 bg-cyan-600">Button 2</button>
  ```

- [ ] **Zufällige Spacing**
  ```typescript
  /* ❌ */
  <div className="p-4">
  <div className="p-6">
  <div className="p-8">
  ```

- [ ] **Zufällige Farben**
  ```typescript
  /* ❌ */
  <span className="text-blue-500">
  <span className="text-cyan-600">
  <span className="text-indigo-700">
  ```

- [ ] **Undokumentierte Abweichungen**
  ```typescript
  /* ❌ Warum anders? Keine Erklärung */
  <Button className="w-1/2">
  ```

---

## Code-Qualität

### ✅ DO

- [ ] **Nutze @apply für wiederholte Klassen**
  ```css
  @layer components {
    .card {
      @apply bg-card rounded-lg border border-border p-6;
    }
  }
  ```

- [ ] **Nutze CSS-Variablen**
  ```css
  padding: var(--spacing-md);
  color: var(--primary);
  ```

- [ ] **Nutze Tailwind Klassen**
  ```typescript
  <div className="p-md bg-primary text-white rounded-md">
  ```

- [ ] **Kurze Klassen-Listen**
  ```typescript
  <div className="p-md bg-primary rounded-md">  /* Kurz */
  ```

- [ ] **Kommentiere komplexe Styles**
  ```typescript
  {/* Mobile: 1 Spalte, Tablet: 2, Desktop: 3 */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  ```

### ❌ DONT

- [ ] **Inline Styles**
  ```typescript
  /* ❌ */
  <div style={{ padding: '16px', color: 'blue' }}>
  ```

- [ ] **Custom CSS für einfache Styles**
  ```css
  /* ❌ */
  .my-button {
    padding: 12px;
    background-color: blue;
  }
  ```

- [ ] **Zu lange Klassen-Listen**
  ```typescript
  /* ❌ */
  <div className="p-4 m-2 bg-white text-black border border-gray-200 rounded-md shadow-md hover:shadow-lg transition-shadow duration-300">
  ```

- [ ] **Hardcodierte Werte**
  ```typescript
  /* ❌ */
  <div className="p-4">  /* Tailwind Default, nicht unser Token */
  ```

- [ ] **Keine Kommentare bei komplexem Code**
  ```typescript
  /* ❌ */
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  ```

---

## Checkliste für neue Features

Vor dem Implementieren einer neuen Komponente/Seite:

- [ ] **Design-Tokens prüfen** - Welche Farben/Spacing nutzen?
- [ ] **Tailwind Klassen prüfen** - Gibt es bereits Klassen dafür?
- [ ] **shadcn/ui prüfen** - Gibt es bereits eine Komponente?
- [ ] **Responsive prüfen** - Wie sieht es auf Mobile aus?
- [ ] **Konsistenz prüfen** - Passt es zu anderen Komponenten?
- [ ] **Kontrast prüfen** - Ist der Text lesbar?
- [ ] **Touch-Targets prüfen** - Sind Buttons mindestens 44x44px?
- [ ] **Dark Mode prüfen** - Funktioniert es im Dark Mode?
- [ ] **Tests schreiben** - Responsive, Kontrast, Accessibility
- [ ] **Dokumentieren** - Warum diese Choices?

---

## Zusammenfassung

| Kategorie | Goldstandard |
|-----------|--------------|
| **Spacing** | Design-Tokens (--spacing-*) |
| **Farben** | Design-Tokens (--primary, --secondary, etc.) |
| **Typographie** | Tailwind Font Sizes + Weights |
| **Komponenten** | shadcn/ui mit Varianten |
| **Responsive** | Mobile-First mit Breakpoints |
| **Konsistenz** | Gleiche Elemente = gleiche Styles |
| **Code** | Tailwind Klassen + @apply |

**Wichtigste Regel**: Wenn Sie unsicher sind, fragen Sie sich: "Gibt es bereits einen Standard dafür?" Wenn ja, nutzen Sie ihn. Wenn nein, dokumentieren Sie Ihre Entscheidung.

**Nächstes Dokument**: [DESIGN-SYSTEM-README.md](./README.md)
