const { healHeadings } = require('./dist/index.cjs');

// Create a test DOM structure
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
  <html>
    <body>
      <h1>First H1</h1>
      <h3>Section</h3>
      <h1>Second H1</h1>
      <h4>Subsection</h4>
      <h1>Third H1</h1>
    </body>
  </html>
`);

global.document = dom.window.document;
global.Element = dom.window.Element;

console.log('Before:');
console.log(dom.window.document.body.innerHTML);

// Test with forceSingleH1: true
healHeadings(dom.window.document.body, { forceSingleH1: true });

console.log('\nAfter with forceSingleH1: true:');
console.log(dom.window.document.body.innerHTML);

// Count H1s
const h1s = dom.window.document.querySelectorAll('h1');
console.log(`\nFinal H1 count: ${h1s.length}`);
