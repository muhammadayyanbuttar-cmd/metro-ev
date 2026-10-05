const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const templatePath = path.join(root, 'templates', 'invoice.docx');
const outputPath = path.join(root, 'invoice-template-data.js');
const template = fs.readFileSync(templatePath).toString('base64');

fs.writeFileSync(
  outputPath,
  `window.INVOICE_TEMPLATE_BASE64 = ${JSON.stringify(template)};\n`,
);
console.log(`Embedded ${path.relative(root, templatePath)} in ${path.relative(root, outputPath)}`);
