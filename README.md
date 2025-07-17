# Semantic Heading Hierarchy

[![npm version](https://badge.fury.io/js/semantic-heading-hierarchy.svg)](https://badge.fury.io/js/semantic-heading-hierarchy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A JavaScript library that automatically corrects improper heading hierarchies for better accessibility and SEO while preserving original visual styling to prevent layout flash.

## What It Does

Many websites have incorrect heading hierarchies that harm accessibility and SEO. Common issues include:

- Skipping heading levels (H1 → H4 instead of H1 → H2)
- Using headings purely for styling rather than semantic structure, usually it's a WYSIWYG editor or a CMS with content added by admins... not devs.
- Inconsistent heading progression through complex layouts

This library automatically fixes these issues by:

1. **Correcting the semantic structure** - Ensures proper H1 → H2 → H3 progression
2. **Preserving visual appearance** - Adds `fs-X` classes to maintain original styling
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

## Basic Usage

### ES Module
```javascript
import { healHeadings } from 'semantic-heading-hierarchy';

// Fix headings in entire document
healHeadings();

// Fix headings in specific container
healHeadings(document.querySelector('.main-content'));

// Fix headings with selector (must match exactly one element)
healHeadings('.article-content');

// Enable detailed logging
healHeadings('.content', true);
```

### Browser Global
```javascript
// Available on window object
window.healHeadings('.main-content');
```

## Preventing FLOUT (Flash of Unstyled Text)

The library prevents visual layout disruption by adding styling classes **before** changing the element tag:

### How FLOUT Prevention Works
1. **FIRST**: The `hs-X` class is added to the original element
2. **THEN**: The element tag is changed to the correct semantic level
3. This ensures zero visual flash since styling is applied before the tag change

### Before Correction
```html
<h1>Main Title</h1>
<h4>Section Title</h4>  <!-- Wrong level, but styled as h4 -->
```

### After Correction
```html
<h1>Main Title</h1>
<h2 class="hs-4" data-prev-heading="4">Section Title</h2>
```

The `hs-4` class (heading-style-4) allows you to maintain the original H4 visual styling while using the semantically correct H2 tag.

## Required CSS Implementation

**Important:** You must implement your own CSS for `hs-2` through `hs-6` classes to maintain visual consistency:

```css
/* Style hs-X classes to match their original heading appearance */
h1, .hs-1 { 
    font-size: 2rem; 
    font-weight: bold; 
    margin: 0.67em 0; 
}

h2, .hs-2 { 
    font-size: 1.5rem; 
    font-weight: bold; 
    margin: 0.75em 0; 
}

h3, .hs-3 { 
    font-size: 1.17rem; 
    font-weight: bold; 
    margin: 0.83em 0; 
}

h4, .hs-4 { 
    font-size: 1rem; 
    font-weight: bold; 
    margin: 1.12em 0; 
}

h5, .hs-5 { 
    font-size: 0.83rem; 
    font-weight: bold; 
    margin: 1.5em 0; 
}

h6, .hs-6 { 
    font-size: 0.75rem; 
    font-weight: bold; 
    margin: 1.67em 0; 
}
```

### Framework-Specific Examples

**Bootstrap:**
```css
.hs-2 { @extend .h2; }
.hs-3 { @extend .h3; }
.hs-4 { @extend .h4; }
.hs-5 { @extend .h5; }
.hs-6 { @extend .h6; }
```

**Tailwind CSS:**
```css
.hs-2 { @apply text-3xl font-bold; }
.hs-3 { @apply text-2xl font-bold; }
.hs-4 { @apply text-xl font-bold; }
.hs-5 { @apply text-lg font-bold; }
.hs-6 { @apply text-base font-bold; }
```

### Custom Class Prefix

You can customize the class prefix to match your existing CSS framework:

```javascript
// Use custom prefix
healHeadings('.content', { classPrefix: 'fs' }); // Creates fs-4, fs-5, etc.
healHeadings('.content', { classPrefix: 'heading' }); // Creates heading-4, heading-5, etc.
healHeadings('.content', { classPrefix: '' }); // Creates -4, -5, etc.
```

## How It Works

### Hierarchy Correction Rules

1. **H1 elements are never modified** - They serve as section anchors
2. **Headings before the first H1 are ignored** - Only process content sections
3. **No heading levels are skipped** - Ensures proper accessibility
4. **Minimum level is H2** - Never creates additional H1 elements
5. **Maximum level is H6** - Respects HTML heading limits

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
    <li><h6>Special Feature</h6></li>  <!-- Will become h3 with fs-6 class -->
</ul>
```

### Example Transformation

**Before:**
```html
<article>
    <h1>Main Article Title</h1>
    <h4>Introduction</h4>
    <h6>Key Points</h6>
    <h2>Conclusion</h2>
</article>
```

**After:**
```html
<article>
    <h1>Main Article Title</h1>
    <h2 class="hs-4" data-prev-heading="4">Introduction</h2>
    <h3 class="hs-6" data-prev-heading="6">Key Points</h3>
    <h2>Conclusion</h2>
</article>
```

**Resulting Hierarchy:**
```
H1: Main Article Title
├── H2: Introduction (styled as H4)
│   └── H3: Key Points (styled as H6)
└── H2: Conclusion
```

## Advanced Usage

### Selector-Based Processing

```javascript
// Process only the main content area
healHeadings('.main-content');

// Process specific article
healHeadings('#article-123');

// Process with logging
healHeadings('.content-area', true);
```

### Integration with CMSs

**WordPress:**
```javascript
// Fix headings in post content
healHeadings('.entry-content');
```

**Drupal:**
```javascript
// Fix headings in node content
healHeadings('.node-content');
```

### Framework Integration

**React:**
```javascript
import { healHeadings } from 'semantic-heading-hierarchy';

useEffect(() => {
    healHeadings('.article-content');
}, []);
```

**Vue:**
```javascript
import { healHeadings } from 'semantic-heading-hierarchy';

mounted() {
    healHeadings(this.$refs.content);
}
```

## API Reference

### `healHeadings(containerOrSelector, options)`

**Parameters:**
- `containerOrSelector` (string|Element, optional): CSS selector or DOM element to process. Defaults to `document.body`
- `options` (boolean|object, optional): Options object or boolean for backwards compatibility
  - `options.logResults` (boolean, optional): Enable detailed console logging. Defaults to `false`
  - `options.classPrefix` (string, optional): Custom prefix for styling classes. Defaults to `'hs'`

**Selector Requirements:**
- Must match exactly one element
- Returns error if multiple elements found
- Returns warning if no elements found

**Returns:** `void`

**Examples:**
```javascript
healHeadings();                                          // Process entire document
healHeadings(document.body);                             // Process body element
healHeadings('.content');                                // Process .content element
healHeadings('.content', true);                          // Process with logging (backwards compatible)
healHeadings('.content', { logResults: true });         // Process with logging
healHeadings('.content', { classPrefix: 'fs' });        // Use custom class prefix
healHeadings('.content', { 
    logResults: true, 
    classPrefix: 'custom' 
});                                                      // Both options
```

### Global Logging Control

Control logging globally via localStorage without modifying code:

```javascript
// Enable detailed logging for all healHeadings calls
enableHeadingLogging();

// Disable detailed logging for all healHeadings calls  
disableHeadingLogging();

// Clear override - use function parameters again
clearHeadingLogging();

// Check current logging status
getHeadingLoggingStatus();
```

**localStorage Override:**
- `localStorage.setItem('healHeadings.logResults', 'true')` - Force logging on
- `localStorage.setItem('healHeadings.logResults', 'false')` - Force logging off
- `localStorage.removeItem('healHeadings.logResults')` - Use function parameters

The localStorage setting always takes precedence over function parameters, making it easy to debug in production or enable logging across an entire site.

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

## Common Use Cases

### CMS Content
```javascript
// Fix user-generated content with poor heading structure
healHeadings('.user-content');
```

### Legacy Sites
```javascript
// Improve SEO on existing sites without redesign
healHeadings('.main-content');
```

### Blog Posts
```javascript
// Ensure proper hierarchy in blog post content
healHeadings('.post-content');
```

### Documentation
```javascript
// Fix heading structure in documentation pages
healHeadings('.docs-content');
```

## Debugging

Enable logging to see what changes are made:

```javascript
healHeadings('.content', true);
```

Output example:
```
Found 5 heading(s) to process after H1
Will change H4 → H2
Will change H6 → H3
Replaced H4 with H2, added fs-4 class
Replaced H6 with H3, added fs-6 class
Heading structure fix complete. Modified 2 heading(s)
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### 1.0.0
- Initial release
- Core heading hierarchy correction
- List detection logic
- Selector-based container targeting
- CSS class preservation for visual consistency

---

**Made with ❤️ for better web accessibility**