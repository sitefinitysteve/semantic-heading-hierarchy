# Semantic Heading Hierarchy

[![npm version](https://badge.fury.io/js/semantic-heading-hierarchy.svg)](https://badge.fury.io/js/semantic-heading-hierarchy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A JavaScript library that automatically corrects improper heading hierarchies for better accessibility and SEO while preserving original visual styling to prevent layout flash.

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

// Use custom CSS class prefix
SemanticHeadingHierarchy.fix('.content', { classPrefix: 'fs-' });
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
    forceSingleH1: false        // Convert additional H1s to H2s (default: false)
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

### What You'll See

When debug mode is enabled, you'll see detailed console output like this:

```
✅ Detailed heading healing logging ENABLED globally
Found 5 heading(s) to process after H1
Will change H4 → H2 (will add hs-4 class)
Will change H6 → H3 (will add hs-6 class)
Replaced H4 with H2, added hs-4 class
Replaced H6 with H3, added hs-6 class
Heading structure fix complete. Modified 2 heading(s)
```

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

**Requirements:**
- **Must contain an H1 element** - The library requires an existing H1 to function
- Only headings that come after the first H1 will be processed
- The H1 element itself is never modified

**Selector Requirements:**
- Must match exactly one element
- Returns error if multiple elements found
- Returns warning if no elements found

**Returns:** `void`

### `SemanticHeadingHierarchy.logging`

**Methods:**
- `SemanticHeadingHierarchy.logging.enable()`: Enable detailed logging for all fix calls via localStorage
- `SemanticHeadingHierarchy.logging.disable()`: Disable detailed logging for all fix calls via localStorage
- `SemanticHeadingHierarchy.logging.clear()`: Clear localStorage override, returns to using function parameters
- `SemanticHeadingHierarchy.logging.status()`: Get the current logging status from localStorage

## How It Works

### Hierarchy Correction Rules

1. **H1 elements are never modified** - They serve as section anchors and must be created by developers
2. **Headings before the first H1 are completely ignored** - Only content sections after H1 are processed
3. **Console warning for headings before H1** - Always warns when problematic structure is detected (regardless of logging settings)
4. **Additional H1s are handled based on forceSingleH1 option** - Either ignored (default) or converted to H2s
5. **Console warning for additional H1s** - Always warns when multiple H1s are found (regardless of logging settings)
6. **No H1 elements are ever created** - The library requires an existing H1 to function
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

- **91+ comprehensive tests** covering all functionality
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