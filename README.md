# Semantic Heading Hierarchy

[![npm version](https://badge.fury.io/js/semantic-heading-hierarchy.svg)](https://badge.fury.io/js/semantic-heading-hierarchy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A JavaScript library that automatically corrects improper heading hierarchies for better accessibility and SEO while preserving original visual styling to prevent layout flash.

## 🚨 Important: H1 Requirement

**This library does NOT create H1 elements - it requires them to exist.**

The H1 tag is the most important heading on your page and should be carefully chosen by developers, not automatically generated. Here's why:

- **H1 defines your page's main topic** - It should be unique and descriptive
- **SEO depends on proper H1 content** - Search engines use it as the primary content signal
- **Accessibility requires meaningful H1s** - Screen readers announce it as the main heading
- **Only content after H1 is processed** - Everything before the first H1 is ignored

### What This Means

```html
<!-- ✅ GOOD - H1 exists, other headings will be corrected -->
<main>
    <h1>Main Page Title</h1>
    <h4>Section Title</h4>  <!-- Will become H2 with hs-4 class -->
    <h6>Subsection</h6>     <!-- Will become H3 with hs-6 class -->
</main>

<!-- ❌ BAD - No H1, nothing will be processed -->
<main>
    <h2>Some heading</h2>   <!-- Ignored - no H1 found -->
    <h3>Another heading</h3> <!-- Ignored - no H1 found -->
</main>

<!-- ⚠️  PROBLEMATIC - H1 comes after other headings -->
<main>
    <h2>Nav heading</h2>    <!-- Ignored - before H1 -->
    <h3>Breadcrumb</h3>     <!-- Ignored - before H1 -->
    <h1>Main Title</h1>     <!-- First H1 found -->
    <h5>Section</h5>        <!-- ✅ Will be processed -->
</main>
```

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

**Bottom line:** Make sure your page has a meaningful H1 element, and content headings come after it!

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

### ES Module (Recommended)
```javascript
import SemanticHeadingHierarchy from 'semantic-heading-hierarchy';

// Fix headings in entire document, everything inside body
SemanticHeadingHierarchy.fix();

// Fix headings in specific container
SemanticHeadingHierarchy.fix(document.querySelector('.main-content'));

// Fix headings with selector (must match exactly one element)
SemanticHeadingHierarchy.fix('.article-content');

// Enable detailed logging
SemanticHeadingHierarchy.fix('.content', true);

// Convert additional H1s to H2s (for pages with multiple H1s)
SemanticHeadingHierarchy.fix('.content', { forceSingleH1: true });
```

### Named Import
```javascript
import { SemanticHeadingHierarchy } from 'semantic-heading-hierarchy';

SemanticHeadingHierarchy.fix('.main-content');
```

### Legacy Function Import (Backwards Compatible)
```javascript
import { healHeadings } from 'semantic-heading-hierarchy';

healHeadings('.main-content');
```

### Browser Global
```javascript
// New API available on window object
window.SemanticHeadingHierarchy.fix('.main-content');

// Legacy API still available
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
// Turn off detailed logging
SemanticHeadingHierarchy.logging.disable();
```

**Reset to function parameters:**
```javascript
// Clear override - use function parameters again
SemanticHeadingHierarchy.logging.clear();
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

### Advanced Debug Control

```javascript
import SemanticHeadingHierarchy from 'semantic-heading-hierarchy';

// Check current status
SemanticHeadingHierarchy.logging.status(); // Shows current override state

// Enable for debugging on production
SemanticHeadingHierarchy.logging.enable(); // All fix calls will now log

// Disable when done
SemanticHeadingHierarchy.logging.disable(); // All fix calls will be silent

// Or clear to use function parameters
SemanticHeadingHierarchy.logging.clear(); // Back to per-call logging control
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

The localStorage setting persists across page reloads, making it perfect for debugging multi-page applications or CMS sites where you want to see heading corrections across the entire user journey.

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

### Custom Class Prefix

You can customize the class prefix to match your existing CSS framework. The prefix is applied exactly as provided, giving you full control:

```javascript
// Default behavior (includes dash)
healHeadings('.content'); // Creates hs-4, hs-5, etc.

// Custom prefix with dash
healHeadings('.content', { classPrefix: 'fs-' }); // Creates fs-4, fs-5, etc.
healHeadings('.content', { classPrefix: 'heading-' }); // Creates heading-4, heading-5, etc.

// Custom prefix without dash  
healHeadings('.content', { classPrefix: 'hs' }); // Creates hs4, hs5, etc.
healHeadings('.content', { classPrefix: 'h' }); // Creates h4, h5, etc.

// Empty prefix
healHeadings('.content', { classPrefix: '' }); // Creates 4, 5, etc.
```

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
    <li><h6>Special Feature</h6></li>  <!-- Will become h3 with fs-6 class -->
</ul>
```

### Example Transformation

**Before** (Note: H1 must exist):
```html
<article>
    <h1>Main Article Title</h1>  <!-- ✅ Required - defines the page topic -->
    <h4>Introduction</h4>         <!-- ❌ Skips H2, H3 levels -->
    <h6>Key Points</h6>           <!-- ❌ Skips H5 level -->
    <h2>Conclusion</h2>           <!-- ❌ Jumps back to H2 -->
</article>
```

**After** (H1 unchanged, others corrected):
```html
<article>
    <h1>Main Article Title</h1>   <!-- ✅ Untouched - stays H1 -->
    <h2 class="hs-4" data-prev-heading="4">Introduction</h2>     <!-- ✅ Corrected to H2, styled as H4 -->
    <h3 class="hs-6" data-prev-heading="6">Key Points</h3>       <!-- ✅ Corrected to H3, styled as H6 -->
    <h2>Conclusion</h2>           <!-- ✅ Already correct - no changes -->
</article>
```

### Multiple H1 Example with forceSingleH1

**Before** (Multiple H1s - accessibility violation):
```html
<article>
    <h1>Main Article Title</h1>  <!-- ✅ First H1 - will be preserved -->
    <h3>Section</h3>              <!-- ❌ Skips H2 -->
    <h1>Another Main Title</h1>   <!-- ❌ Additional H1 - accessibility violation -->
    <h4>Subsection</h4>           <!-- ❌ Skips H3 -->
    <h1>Yet Another Title</h1>    <!-- ❌ Additional H1 - accessibility violation -->
</article>
```

**After** (with `forceSingleH1: true`):
```html
<article>
    <h1>Main Article Title</h1>   <!-- ✅ First H1 preserved -->
    <h2 class="hs-3" data-prev-heading="3">Section</h2>                    <!-- ✅ H3 → H2 -->
    <h2 class="hs-1" data-prev-heading="1">Another Main Title</h2>         <!-- ✅ H1 → H2 -->
    <h3 class="hs-4" data-prev-heading="4">Subsection</h3>                 <!-- ✅ H4 → H3 -->
    <h2 class="hs-1" data-prev-heading="1">Yet Another Title</h2>          <!-- ✅ H1 → H2 -->
</article>
```

**Without `forceSingleH1`** (default behavior):
```html
<article>
    <h1>Main Article Title</h1>   <!-- ✅ First H1 preserved -->
    <h2 class="hs-3" data-prev-heading="3">Section</h2>                    <!-- ✅ H3 → H2 -->
    <h1>Another Main Title</h1>   <!-- ❌ Additional H1 ignored -->
    <h4>Subsection</h4>           <!-- ❌ Subsequent headings ignored -->
    <h1>Yet Another Title</h1>    <!-- ❌ Additional H1 ignored -->
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

**Examples:**
```javascript
// New API (recommended)
SemanticHeadingHierarchy.fix();                                          // Process entire document
SemanticHeadingHierarchy.fix(document.body);                             // Process body element
SemanticHeadingHierarchy.fix('.content');                                // Process .content element
SemanticHeadingHierarchy.fix('.content', true);                          // Process with logging (backwards compatible)
SemanticHeadingHierarchy.fix('.content', { logResults: true });         // Process with logging
SemanticHeadingHierarchy.fix('.content', { classPrefix: 'fs-' });        // Use custom class prefix
SemanticHeadingHierarchy.fix('.content', { forceSingleH1: true });       // Convert additional H1s to H2s
SemanticHeadingHierarchy.fix('.content', { 
    logResults: true, 
    classPrefix: 'custom-',
    forceSingleH1: true 
});                                                                      // All options
```

### `SemanticHeadingHierarchy.logging`

**Methods:**
- `SemanticHeadingHierarchy.logging.enable()`: Enable detailed logging for all fix calls via localStorage
- `SemanticHeadingHierarchy.logging.disable()`: Disable detailed logging for all fix calls via localStorage
- `SemanticHeadingHierarchy.logging.clear()`: Clear localStorage override, returns to using function parameters
- `SemanticHeadingHierarchy.logging.status()`: Get the current logging status from localStorage

**Examples:**
```javascript
// Enable logging globally
SemanticHeadingHierarchy.logging.enable();

// Check current status
SemanticHeadingHierarchy.logging.status();

// Disable logging globally
SemanticHeadingHierarchy.logging.disable();

// Clear override (use function parameters)
SemanticHeadingHierarchy.logging.clear();
```

### Legacy API (Backwards Compatible)

The original function-based API is still available for backwards compatibility:

```javascript
import { healHeadings, enableHeadingLogging, disableHeadingLogging } from 'semantic-heading-hierarchy';

healHeadings('.content');
enableHeadingLogging();
disableHeadingLogging();
```


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

## Testing & Validation

This package uses [html-validate](https://www.npmjs.com/package/html-validate) with the `heading-level` rule for accessibility validation in our test suite. This ensures that our heading corrections actually meet real-world accessibility standards, not just our own assumptions.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- test/rigorous-healer.test.js
```

Our test suite includes 87+ comprehensive tests covering:
- **html-validate validation**: Ensures bad heading structures fail accessibility tests before healing and pass after
- **Complex real-world scenarios**: Bootstrap grids, sidebar layouts, documentation sites
- **List detection logic**: Multi-item vs single-item list handling
- **Edge cases**: Nested lists, missing H1s, deeply nested headings
- **Framework integration**: Selector-based targeting, custom prefixes

### Accessibility Validation

The primary validation method in our tests is html-validate's `heading-level` rule:

```javascript
// Test pattern used throughout our test suite
const htmlvalidate = new HtmlValidate({
    rules: { 'heading-level': 'error' }
});

const reportBefore = await htmlvalidate.validateString(container.innerHTML);
const errorsBefore = reportBefore.results[0].messages.filter(m => m.ruleId === 'heading-level');
expect(errorsBefore.length).toBeGreaterThan(0); // Bad structure fails

healHeadings(container);

const reportAfter = await htmlvalidate.validateString(container.innerHTML);
const errorsAfter = reportAfter.results[0].messages.filter(m => m.ruleId === 'heading-level');
expect(errorsAfter.length).toBe(0); // Fixed structure passes
```

## Debugging

For detailed debugging information, see the [**🔧 Debug Mode & Smart Logging**](#-debug-mode--smart-logging) section above, which includes our powerful localStorage-based global debugging system.

**Quick reminder** - Enable logging for a single call:
```javascript
SemanticHeadingHierarchy.fix('.content', true);
```

**Or enable globally** (recommended for debugging):
```javascript
SemanticHeadingHierarchy.logging.enable(); // All fix calls will now log details
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