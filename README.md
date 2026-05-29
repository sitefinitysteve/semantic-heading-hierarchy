# Semantic Heading Hierarchy

[![npm version](https://badge.fury.io/js/semantic-heading-hierarchy.svg)](https://badge.fury.io/js/semantic-heading-hierarchy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A JavaScript library that automatically corrects improper heading hierarchies for better accessibility and SEO while preserving original visual styling to prevent layout flash.

## Why This Exists

Most broken heading hierarchies don't come from developers — they come from **CMS admin-editable content**. Content editors pick headings by how they *look*, not by what they *mean*: they want the text bigger, so they reach for an `<h2>`; they want it smaller, so they drop to an `<h5>`. They're trying to be designers, and the result is a page that looks fine but has a semantically broken outline that screen readers and search engines can't navigate.

As the developer, you don't control what they type, and you usually can't realistically train every editor or audit every page they publish. What you need is a **layer that runs _after_ they're done** to repair the semantic structure for accessibility — **while leaving their visual design exactly as they intended it.**

That's all this library is for. It is **not** here to fix their content or second-guess their design choices; the "ugly" stays ugly. It simply **semantically heals** the heading levels so the document outline is valid, and preserves the original appearance via styling classes so nothing visually shifts. Someone can always go back later and fix the content properly — but until then, at least it's accessible.

## What It Does

Many websites have incorrect heading hierarchies that harm accessibility and SEO. Common issues include:

- Skipping heading levels (H1 → H4 instead of H1 → H2)
- Using headings purely for styling rather than semantic structure
- Inconsistent heading progression through complex layouts

This library automatically fixes these issues by:

1. **Correcting the semantic structure** - Ensures proper H1 → H2 → H3 progression
2. **Preserving visual appearance** - Adds `hs-X` classes to maintain original styling
3. **Maintaining accessibility** - Creates proper document outline for screen readers
4. **Improving SEO** - Provides clear content hierarchy for search engines

## Installation

```bash
npm install semantic-heading-hierarchy
```

Or via CDN:

```html
<script src="https://unpkg.com/semantic-heading-hierarchy@latest/dist/index.js"></script>
```

## Required CSS Implementation

**Important:** You must implement your own CSS for `hs-2` through `hs-6` classes to maintain visual consistency:

```css
/* Style hs-X classes to match their original heading appearance */
h1, .hs-1 { 
    /* Your H1 styles here */
}

h2, .hs-2 { 
    /* Your H2 styles here */
}

h3, .hs-3 { 
    /* Your H3 styles here */
}

h4, .hs-4 { 
    /* Your H4 styles here */
}

h5, .hs-5 { 
    /* Your H5 styles here */
}

h6, .hs-6 { 
    /* Your H6 styles here */
}
```

> **Already using Bootstrap?** You can skip this section entirely — set `classPrefix: 'h'` to reuse Bootstrap's built-in `.h1`–`.h6` classes instead of writing your own. See [Using Bootstrap's Heading Classes](#using-bootstraps-heading-classes).

## Basic Usage

### ES Module (Recommended)
```javascript
import SemanticHeadingHierarchy from 'semantic-heading-hierarchy';

// Fix headings in entire document
SemanticHeadingHierarchy.fix();

// Fix headings in specific container
SemanticHeadingHierarchy.fix('.main-content');

// Enable detailed logging
SemanticHeadingHierarchy.fix('.content', { logResults: true });

// Convert additional H1s to H2s (for pages with multiple H1s)
SemanticHeadingHierarchy.fix('.content', { forceSingleH1: true });

// When the container has no H1, promote its first heading to H1 and heal from there
SemanticHeadingHierarchy.fix('.content', { promoteFirstHeading: true });

// Also heal headings inside multi-item lists (skipped by default)
SemanticHeadingHierarchy.fix('.content', { healListHeadings: true });

// Use custom CSS class prefix
SemanticHeadingHierarchy.fix('.content', { classPrefix: 'fs-' });

// Inspect what happened - fix() returns a structured HealResult
const result = SemanticHeadingHierarchy.fix('.content');
console.table(result.headings);
```

### Browser Global
```javascript
// Available on window object
window.SemanticHeadingHierarchy.fix('.main-content');
```

## Usage Options

### Basic Options
```javascript
SemanticHeadingHierarchy.fix('.content', {
    logResults: true,           // Show detailed console output
    classPrefix: 'hs-',         // CSS class prefix (default: 'hs-')
    forceSingleH1: false,       // Convert additional H1s to H2s (default: false)
    promoteFirstHeading: false, // If no H1 exists, promote the first heading to H1 (default: false)
    healListHeadings: false     // Heal headings inside multi-item lists too (default: false)
});
```

### Example Transformation

**Before:**
```html
<article>
    <h1>Main Article Title</h1>
    <h4>Introduction</h4>         <!-- Skips H2, H3 levels -->
    <h6>Key Points</h6>           <!-- Skips H5 level -->
    <h2>Conclusion</h2>           <!-- Jumps back to H2 -->
</article>
```

**After:**
```html
<article>
    <h1>Main Article Title</h1>   <!-- Untouched -->
    <h2 class="hs-4" data-prev-heading="4">Introduction</h2>     <!-- Corrected, styled as H4 -->
    <h3 class="hs-6" data-prev-heading="6">Key Points</h3>       <!-- Corrected, styled as H6 -->
    <h2>Conclusion</h2>           <!-- Already correct -->
</article>
```

### Custom Class Prefix

You can customize the class prefix to match your existing CSS framework:

```javascript
// Default behavior (includes dash)
SemanticHeadingHierarchy.fix('.content'); // Creates hs-4, hs-5, etc.

// Custom prefix with dash
SemanticHeadingHierarchy.fix('.content', { classPrefix: 'fs-' }); // Creates fs-4, fs-5, etc.

// Custom prefix without dash  
SemanticHeadingHierarchy.fix('.content', { classPrefix: 'h' }); // Creates h4, h5, etc.
```

### Using Bootstrap's Heading Classes

If your site already uses **Bootstrap** (3, 4, or 5), you don't need to write any custom CSS at all. Bootstrap ships `.h1` through `.h6` classes that style *any* element to look like that heading level, and those class names are exactly what `classPrefix: 'h'` produces:

```javascript
SemanticHeadingHierarchy.fix('.content', { classPrefix: 'h' });
```

A healed heading then carries Bootstrap's own class:

**Before (`H1 → H3` jump):**
```html
<h1>Main Title</h1>
<h3>Section Title</h3>   <!-- styled by Bootstrap's .h3 / h3 rules -->
```

**After (with `classPrefix: 'h'`):**
```html
<h1>Main Title</h1>
<h2 class="h3" data-prev-heading="3">Section Title</h2>
```

The element is now a semantically correct `<h2>`, but Bootstrap's existing `.h3` rule (e.g. `font-size: 24px`) keeps it looking exactly like the H3 it was authored as — **no extra CSS required.** This works because a class selector (`.h3`) outranks an element selector (`h2`) on specificity, so Bootstrap's `.h3` styling wins over the `<h2>` tag's defaults.

> This is the one setup where you can skip the [Required CSS Implementation](#required-css-implementation) step — Bootstrap already provides the styling classes for you.

## 🔧 Debug Mode & Smart Logging

One of the coolest features is the **global localStorage-based debugging system** that lets you enable detailed logging across your entire site without modifying any code!

### Quick Debug Mode

**Enable debug mode instantly** - Run this in your browser console:
```javascript
// Turn on detailed logging for ALL fix calls
SemanticHeadingHierarchy.logging.enable();
```

**Turn off debug mode:**
```javascript
SemanticHeadingHierarchy.logging.disable();
```

**Toggle debug mode** - flips the current setting and returns the new state (`true` = now on):
```javascript
const isOn = SemanticHeadingHierarchy.logging.toggle();
```

All three (`enable`, `disable`, `toggle`) persist via `localStorage`, so the setting survives page reloads until you change it.

### What You'll See

When debug mode is enabled, each heal prints **one collapsed group** to keep the console tidy. Expand it to see a table overview and a clickable reference to every heading element:

```
▶ 🩺 healHeadings — 2 changed, 0 skipped, 4 total
```

Expanded, the group contains a `console.table` and one line per heading whose final argument is the **live DOM node** — in the browser you can click it to highlight/reveal the element in the Elements panel:

```
🩺 healHeadings — 2 changed, 0 skipped, 4 total
┌─────────┬───────────┬───────────┬───────┬───────────────┐
│ (index) │  heading  │   state   │ class │     text      │
├─────────┼───────────┼───────────┼───────┼───────────────┤
│    0    │   'H1'    │ 'anchor'  │  ''   │ 'Main Title'  │
│    1    │ 'H4 → H2' │ 'changed' │ 'hs-4'│ 'Introduction'│
│    2    │ 'H6 → H3' │ 'changed' │ 'hs-6'│ 'Key Points'  │
│    3    │   'H2'    │'unchanged'│  ''   │ 'Conclusion'  │
└─────────┴───────────┴───────────┴───────┴───────────────┘
⚓ H1  anchor  "Main Title"                    <h1>
🔧 H4 → H2  changed  +hs-4 class  "Introduction"   <h2 class="hs-4" …>
🔧 H6 → H3  changed  +hs-6 class  "Key Points"      <h3 class="hs-6" …>
· H2  unchanged  "Conclusion"                  <h2>
ℹ️  FYI: heading-healing logging is ON globally and persists across page loads. Turn it off any time with disableHeadingLogging().
```

Because the global setting persists across page loads, that final **FYI line is printed at the end of every heal** while global logging is on — a reminder of how to turn it off so it doesn't quietly stay enabled. (It only appears when logging was switched on via the global `localStorage` override, not when you pass `logResults: true` to a single `fix()` call.)

> Prefer to drive your own output? `fix()` always returns a [`HealResult`](#return-value) — call `console.table(result.headings)` yourself, or read `result.headings[n].element` for the live node.

### Manual localStorage Control

You can also control logging directly via localStorage:

```javascript
// Enable logging globally
localStorage.setItem('healHeadings.logResults', 'true');

// Disable logging globally  
localStorage.setItem('healHeadings.logResults', 'false');

// Clear override (use function parameters)
localStorage.removeItem('healHeadings.logResults');
```

## Preventing FLOUT (Flash of Unstyled Text)

The library prevents visual layout disruption by adding styling classes **before** changing the element tag:

### How FLOUT Prevention Works
1. **FIRST**: The `hs-X` class is added to the original element
2. **THEN**: The element tag is changed to the correct semantic level
3. This ensures zero visual flash since styling is applied before the tag change

### Before & After Correction

**Before:**
```html
<h1>Main Title</h1>
<h4>Section Title</h4>  <!-- Wrong level, but styled as h4 -->
```

**After:**
```html
<h1>Main Title</h1>
<h2 class="hs-4" data-prev-heading="4">Section Title</h2>
```

The `hs-4` class (heading-style-4) allows you to maintain the original H4 visual styling while using the semantically correct H2 tag.

## H1 Requirements & Edge Cases

### H1 Requirement

**This library does NOT create H1 elements - it requires them to exist.**

The H1 tag is the most important heading on your page and should be carefully chosen by developers, not automatically generated. Here's why:

- **H1 defines your page's main topic** - It should be unique and descriptive
- **SEO depends on proper H1 content** - Search engines use it as the primary content signal
- **Accessibility requires meaningful H1s** - Screen readers announce it as the main heading
- **Only content after H1 is processed** - Everything before the first H1 is ignored

### Real-World Scenarios

We understand that sometimes you inherit websites or work with CMSs where you can't control the entire page structure.

#### Multiple H1 Elements
If you have multiple H1 elements (which violates accessibility standards), the library will use the **first H1** as the main heading and warn you about the additional ones:

```
⚠️  Found 2 additional H1 element(s) after the first H1. These will be ignored. Consider using the forceSingleH1 option to convert them to H2 elements.
```

You can use the `forceSingleH1` option to automatically convert additional H1s to H2s:

```javascript
SemanticHeadingHierarchy.fix('.content', { forceSingleH1: true });
```

#### Headings Before H1
If you have headings before the H1 (like in navigation or headers), **the library will still work** - it will process headings after the H1 but will show you a console warning:

```
⚠️  Found 2 heading(s) before H1: h2, h3. These headings will be ignored for accessibility compliance. Consider restructuring your HTML to place all content headings after the main H1.
```

**These warnings are always shown regardless of your logging settings** because they're important for accessibility compliance.

#### No H1 In the Container

By default, if the container has no H1 the library has nothing to anchor to, so it does nothing and returns `{ ran: false, ... }`. This is the safe default - the library never invents an H1 for you.

Sometimes, though, you're scoped to a fragment (a CMS content area, a widget) that genuinely has no H1 and you'd rather heal it than skip it. Enable `promoteFirstHeading` to promote the container's first heading (whatever level it is) up to H1, then cascade the rest down as normal:

```javascript
SemanticHeadingHierarchy.fix('.content-area', { promoteFirstHeading: true });
```

**Before (no H1 in the fragment):**
```html
<div class="content-area">
    <h3>Widget Title</h3>     <!-- first heading -->
    <h4>Detail</h4>
    <h4>Another Detail</h4>
</div>
```

**After:**
```html
<div class="content-area">
    <h1 class="hs-3" data-prev-heading="3">Widget Title</h1>   <!-- promoted to H1, styled as H3 -->
    <h2 class="hs-4" data-prev-heading="4">Detail</h2>         <!-- cascaded down -->
    <h2 class="hs-4" data-prev-heading="4">Another Detail</h2>
</div>
```

The promoted heading keeps its original visual size via the `hs-X` class (same FLOUT prevention as a normal heal). The result's `promotedFirstHeading` flag will be `true`, and the promoted entry has `state: 'promoted'`.

#### Headings Inside Lists (and `healListHeadings`)

By default, a heading inside a **multi-item list** (a `<ul>`/`<ol>` whose immediate parent list has more than one `<li>`) is **left untouched** and reported with `state: 'skipped-list'` / `data-heading-processed="skipped-list"`. The reasoning: list items are usually repeated, uniform "cards" (article teasers, search results, rating widgets), and promoting only the *first* card's heading above its siblings would make the list look ragged.

This is exactly why article-title `<h3>`s inside something like a Sitefinity `.mostRecentControl > ul > li` show up as skipped — they sit in a genuine multi-item list, so the healer deliberately leaves them alone. (A *single*-item list still heals normally; only lists with two or more `<li>` siblings are skipped.)

If those list items are real content sections — not uniform cards — and the skip is leaving an `H1 → H3` jump unfixed, opt in with `healListHeadings: true` to evaluate and heal them like any other heading:

```javascript
SemanticHeadingHierarchy.fix('.content', { healListHeadings: true });
```

**Before (`H1 → H3` jump; list headings skipped by default):**
```html
<h1>Portal</h1>
<ul class="mostRecentControl">
    <li><h3>Article One</h3></li>   <!-- skipped-list by default -->
    <li><h3>Article Two</h3></li>   <!-- skipped-list by default -->
    <li><h3>Article Three</h3></li> <!-- skipped-list by default -->
</ul>
```

**After (with `healListHeadings: true`):**
```html
<h1>Portal</h1>
<ul class="mostRecentControl">
    <li><h2 class="hs-3" data-prev-heading="3">Article One</h2></li> <!-- H3 → H2, closes the jump -->
    <li><h3>Article Two</h3></li>   <!-- already valid as H3 under the new H2 -->
    <li><h3>Article Three</h3></li> <!-- already valid as H3 -->
</ul>
```

### Multiple H1 Example with forceSingleH1

**Before (Multiple H1s - accessibility violation):**
```html
<article>
    <h1>Main Article Title</h1>  <!-- First H1 - will be preserved -->
    <h3>Section</h3>              <!-- Skips H2 -->
    <h1>Another Main Title</h1>   <!-- Additional H1 - accessibility violation -->
    <h4>Subsection</h4>           <!-- Skips H3 -->
    <h1>Yet Another Title</h1>    <!-- Additional H1 - accessibility violation -->
</article>
```

**After (with `forceSingleH1: true`):**
```html
<article>
    <h1>Main Article Title</h1>   <!-- First H1 preserved -->
    <h2 class="hs-3" data-prev-heading="3">Section</h2>                    <!-- H3 → H2 -->
    <h2 class="hs-1" data-prev-heading="1">Another Main Title</h2>         <!-- H1 → H2 -->
    <h3 class="hs-4" data-prev-heading="4">Subsection</h3>                 <!-- H4 → H3 -->
    <h2 class="hs-1" data-prev-heading="1">Yet Another Title</h2>          <!-- H1 → H2 -->
</article>
```

## Advanced Usage

### Selector-Based Processing

```javascript
// Process only the main content area
SemanticHeadingHierarchy.fix('.main-content');

// Process specific article
SemanticHeadingHierarchy.fix('#article-123');

// Process with logging
SemanticHeadingHierarchy.fix('.content-area', { logResults: true });
```

## API Reference

### `SemanticHeadingHierarchy.fix(containerOrSelector, options)`

**Parameters:**
- `containerOrSelector` (string|Element, optional): CSS selector or DOM element to process. Defaults to `document.body`
- `options` (boolean|FixOptions, optional): Options object or boolean for backwards compatibility
  - `options.logResults` (boolean, optional): Enable detailed console logging. Defaults to `false`
  - `options.classPrefix` (string, optional): Custom prefix for styling classes. Defaults to `'hs-'`
  - `options.forceSingleH1` (boolean, optional): Convert additional H1 elements to H2 elements. Defaults to `false`
  - `options.promoteFirstHeading` (boolean, optional): When no H1 exists in the container, promote its first heading (H2–H6) to H1 and heal from there instead of bailing. Defaults to `false`
  - `options.healListHeadings` (boolean, optional): Also evaluate and heal headings inside multi-item lists. By default they are left untouched (`state: 'skipped-list'`) as uniform "card" content. Defaults to `false`

**Requirements:**
- **Must contain an H1 element** - The library requires an existing H1 to function (unless `promoteFirstHeading` is enabled)
- Only headings that come after the first H1 will be processed
- The H1 element itself is never modified

**Selector Requirements:**
- Must match exactly one element
- Returns error if multiple elements found
- Returns warning if no elements found

**Returns:** `HealResult` - a structured object describing what happened to every heading:

```typescript
interface HealResult {
  ran: boolean;                 // true when an H1 anchor was found/created and headings were processed
  promotedFirstHeading: boolean;// true when the first heading was promoted to H1 (promoteFirstHeading)
  modifiedCount: number;        // number of headings whose level was changed
  headings: HeadingResult[];    // per-heading outcome, in document order
}

interface HeadingResult {
  text: string;       // trimmed text content of the heading
  from: number;       // original heading level (1-6) as authored
  to: number;         // final heading level (1-6) after healing (equals `from` when unchanged)
  state: HeadingState;// what the healer did with this heading (see below)
  element: Element;   // the live heading element after healing (the replacement, if it was rewritten)
}

type HeadingState =
  | 'anchor'                 // the H1 the hierarchy is measured from
  | 'promoted'               // promoted up to H1 because none existed (promoteFirstHeading)
  | 'changed'                // level was rewritten
  | 'unchanged'              // evaluated, already at the correct level
  | 'skipped-list'           // inside a multi-item list, left alone by design
  | 'ignored-before-h1'      // appears before the H1, ignored
  | 'ignored-additional-h1'; // an extra H1 after the first, ignored
```

When `fix()` bails (e.g. no H1 and `promoteFirstHeading` is off), it returns an empty result: `{ ran: false, promotedFirstHeading: false, modifiedCount: 0, headings: [] }`. The return value is purely informational - existing callers that ignore it are unaffected.

### `SemanticHeadingHierarchy.logging`

**Methods:**
- `SemanticHeadingHierarchy.logging.enable()`: Enable detailed logging for all fix calls via localStorage
- `SemanticHeadingHierarchy.logging.disable()`: Disable detailed logging for all fix calls via localStorage
- `SemanticHeadingHierarchy.logging.toggle()`: Flip logging on/off based on the current state; returns the new state (`boolean`)
- `SemanticHeadingHierarchy.logging.clear()`: Clear localStorage override, returns to using function parameters
- `SemanticHeadingHierarchy.logging.status()`: Get the current logging status from localStorage

## How It Works

### Hierarchy Correction Rules

1. **H1 elements are never modified** - They serve as section anchors and must be created by developers
2. **Headings before the first H1 are completely ignored** - Only content sections after H1 are processed
3. **Console warning for headings before H1** - Always warns when problematic structure is detected (regardless of logging settings)
4. **Additional H1s are handled based on forceSingleH1 option** - Either ignored (default) or converted to H2s
5. **Console warning for additional H1s** - Always warns when multiple H1s are found (regardless of logging settings)
6. **No H1 elements are created by default** - The library requires an existing H1 to function, unless you opt in with `promoteFirstHeading` (which promotes the container's first heading to H1)
7. **No heading levels are skipped** - Ensures proper accessibility progression
8. **Minimum level is H2** - Never creates additional H1 elements
9. **Maximum level is H6** - Respects HTML heading limits

### List Detection

The library intelligently handles headings within lists:

- **Multi-item lists**: Headings are ignored (assumed to be repeated content)
- **Single-item lists**: Headings are processed normally

```html
<!-- Multi-item list - headings ignored -->
<ul>
    <li><h4>Item 1</h4></li>
    <li><h4>Item 2</h4></li>
    <li><h4>Item 3</h4></li>
</ul>

<!-- Single-item list - heading processed -->
<ul>
    <li><h6>Special Feature</h6></li>  <!-- Will become h3 with hs-6 class -->
</ul>
```

## Inspecting What Happened

There are three ways to see what the library did:

### 1. The `HealResult` return value

`fix()` returns a [`HealResult`](#semanticheadinghierarchyfixcontainerorselector-options) describing every heading in document order. Drop it straight into `console.table` for a readable summary:

```javascript
const result = SemanticHeadingHierarchy.fix('.content');
console.table(result.headings);   // text, from, to, state, element for each heading
console.log(`${result.modifiedCount} heading(s) changed`);
```

### 2. The `data-heading-processed` attribute (devtools)

Every heading the library evaluates is tagged with a `data-heading-processed` attribute, so when you inspect the page in devtools you can confirm the library ran and see what it decided for each heading. The value matches the heading's `state`:

| Value | Meaning |
| --- | --- |
| `anchor` | The H1 the hierarchy is measured from |
| `promoted` | Promoted up to H1 because none existed (`promoteFirstHeading`) |
| `changed` | Level was rewritten |
| `unchanged` | Evaluated, already at the correct level |
| `skipped-list` | Inside a multi-item list, left alone by design |
| `ignored-before-h1` | Appears before the H1, ignored |
| `ignored-additional-h1` | An extra H1 after the first, ignored |

### 3. The `data-prev-heading` attribute

Headings whose level actually changed (including a promoted H1) also carry `data-prev-heading="<original level>"`, recording what level they were authored at before healing.

## Testing & Validation

This package uses [html-validate](https://www.npmjs.com/package/html-validate) with the `heading-level` rule for accessibility validation in our test suite. This ensures that our heading corrections actually meet real-world accessibility standards.

## Browser Support

- Modern browsers (ES6+)
- IE 11+ (with polyfills for `Array.from`, `Element.closest`)

## Performance

- **Lightweight**: ~3KB minified
- **Fast**: Processes 1000+ headings in <100ms
- **Efficient**: Only processes specified container, ignores rest of DOM
- **Memory safe**: No memory leaks or retained references

## Accessibility Benefits

- ✅ **Screen readers** get proper document outline
- ✅ **Skip navigation** works correctly
- ✅ **Assistive technology** can navigate by heading level
- ✅ **SEO improvement** through proper content structure
- ✅ **WCAG compliance** for heading hierarchy requirements

## Contributing

Contributions are welcome! Here's how to get started:

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sitefinitysteve/semantic-heading-hierarchy.git
   cd semantic-heading-hierarchy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development commands:**
   ```bash
   # Run tests
   npm test

   # Run tests in watch mode
   npm test -- --watch

   # Run specific test file
   npm test -- test/healer.test.js

   # Type check
   npm run typecheck

   # Build the package
   npm run build

   # Lint the code
   npm run lint

   # Format the code
   npm run format
   ```

### Project Structure

```
semantic-heading-hierarchy/
├── src/
│   ├── index.ts          # Main entry point
│   ├── core.ts           # Core healing logic
│   ├── logging.ts        # Logging functionality
│   └── types.ts          # TypeScript interfaces
├── test/
│   ├── healer.test.js    # Basic functionality tests
│   ├── rigorous-healer.test.js  # Comprehensive tests
│   ├── complex-fixtures.test.js # Real-world scenarios
│   └── fixtures/         # Test HTML fixtures
├── dist/                 # Built files (generated)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

### Testing

The project uses [Vitest](https://vitest.dev/) for testing and [html-validate](https://www.npmjs.com/package/html-validate) for accessibility validation:

- **120+ comprehensive tests** covering all functionality
- **html-validate integration** ensures real accessibility compliance
- **Complex real-world scenarios** with Bootstrap, CMSs, and documentation sites
- **Edge case testing** for nested lists, missing H1s, and malformed HTML

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and add tests:**
   - Follow the existing code style
   - Add tests for new functionality
   - Update documentation if needed

3. **Run the test suite:**
   ```bash
   npm test
   ```

4. **Build and verify:**
   ```bash
   npm run build
   npm run typecheck
   ```

5. **Submit a pull request:**
   - Describe your changes clearly
   - Include tests for new features
   - Update README if needed

### Code Style

- **TypeScript** for type safety
- **ESM modules** with CJS compatibility
- **Comprehensive testing** with html-validate
- **Clear documentation** with examples

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for better web accessibility**