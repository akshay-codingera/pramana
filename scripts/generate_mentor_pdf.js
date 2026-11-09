const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MD_PATH = 'D:\\Projects\\pramana-github\\reports\\mentor_review\\PRAMANA_COMPLETE_MODEL_DEVELOPMENT_REPORT.md';
const HTML_PATH = 'D:\\Projects\\pramana-github\\reports\\mentor_review\\report_typeset.html';
const PDF_PATH = 'D:\\Projects\\pramana-github\\reports\\mentor_review\\PRAMANA_COMPLETE_MODEL_DEVELOPMENT_REPORT.pdf';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function markdownToHTML(md) {
  let html = md;

  // Escape HTML characters in pure text (except for allowed html tags)
  // Process headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Math equations: display math and inline math
  html = html.replace(/\$\$(.*?)\$\$/gs, '<div class="math-display">$1</div>');
  html = html.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr/>');

  // Code blocks (fenced with ```)
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre class="code-block ${lang}"><code>${code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Tables
  const lines = html.split('\n');
  const outLines = [];
  let inTable = false;
  let tableHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableHeader = true;
        outLines.push('<table>');
      }
      // Check if separator line
      if (line.includes('---')) {
        tableHeader = false;
        continue;
      }
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      const tag = tableHeader ? 'th' : 'td';
      const rowHtml = '<tr>' + cells.map(c => `<${tag}>${c}</${tag}>`).join('') + '</tr>';
      outLines.push(rowHtml);
    } else {
      if (inTable) {
        inTable = false;
        outLines.push('</table>');
      }
      outLines.push(lines[i]);
    }
  }
  if (inTable) {
    outLines.push('</table>');
  }

  html = outLines.join('\n');

  // Lists
  html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Paragraphs
  html = html.replace(/\n\s*\n/g, '</p><p>');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>PRAMANA Master Technical Report</title>
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
    @bottom-center {
      content: counter(page);
    }
  }
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    color: #1a202c;
    line-height: 1.6;
    font-size: 10pt;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 18pt;
    color: #0d233a;
    border-bottom: 2px solid #2b6cb0;
    padding-bottom: 6px;
    margin-top: 24pt;
    margin-bottom: 12pt;
    page-break-after: avoid;
  }
  h2 {
    font-size: 14pt;
    color: #1a365d;
    border-bottom: 1px solid #cbd5e0;
    padding-bottom: 4px;
    margin-top: 18pt;
    margin-bottom: 8pt;
    page-break-after: avoid;
  }
  h3 {
    font-size: 11pt;
    color: #2c5282;
    margin-top: 14pt;
    margin-bottom: 6pt;
    page-break-after: avoid;
  }
  p {
    margin: 6pt 0;
    text-align: justify;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }
  th {
    background-color: #2b6cb0;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #2b6cb0;
  }
  td {
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
  }
  tr:nth-child(even) {
    background-color: #f7fafc;
  }
  pre.code-block {
    background-color: #2d3748;
    color: #edf2f7;
    padding: 10px 14px;
    border-radius: 4px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8pt;
    overflow-x: auto;
    page-break-inside: avoid;
    line-height: 1.4;
  }
  code {
    background-color: #edf2f7;
    color: #805ad5;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 8.5pt;
  }
  pre.code-block code {
    background: none;
    color: inherit;
    padding: 0;
  }
  blockquote {
    border-left: 4px solid #3182ce;
    background-color: #ebf8ff;
    margin: 10pt 0;
    padding: 8pt 14pt;
    font-style: italic;
    color: #2b6cb0;
  }
  .math-display {
    text-align: center;
    background: #f7fafc;
    border: 1px solid #edf2f7;
    padding: 6px;
    margin: 8pt 0;
    font-family: 'Times New Roman', serif;
    font-size: 10.5pt;
    color: #1a202c;
  }
  .math-inline {
    font-family: 'Times New Roman', serif;
    font-style: italic;
    color: #1a202c;
  }
  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 16pt 0;
  }
  ul, ol {
    margin: 6pt 0;
    padding-left: 20px;
  }
  li {
    margin: 3pt 0;
  }
</style>
</head>
<body>
<p>${html}</p>
</body>
</html>
  `;
}

async function buildPDF() {
  console.log('Reading Master Report Markdown...');
  const md = fs.readFileSync(MD_PATH, 'utf8');

  console.log('Converting Markdown to Typeset HTML...');
  const html = markdownToHTML(md);
  fs.writeFileSync(HTML_PATH, html, 'utf8');
  console.log(`Saved HTML: ${HTML_PATH} (${(html.length / 1024).toFixed(1)} KB)`);

  console.log('Rendering PDF via Headless Chrome...');
  const cmd = `"${CHROME_PATH}" --headless=new --run-all-compositor-stages-before-draw --no-pdf-header-footer --print-to-pdf="${PDF_PATH}" "${HTML_PATH}"`;
  
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(PDF_PATH)) {
    const stats = fs.statSync(PDF_PATH);
    console.log(`\n============================================================`);
    console.log(`SUCCESS: Typeset Master Report PDF generated successfully!`);
    console.log(`Path: ${PDF_PATH}`);
    console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log(`============================================================\n`);
  } else {
    console.error('ERROR: PDF generation failed, file not found.');
    process.exit(1);
  }
}

buildPDF().catch(console.error);
