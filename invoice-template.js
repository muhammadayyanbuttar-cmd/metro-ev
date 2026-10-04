const fs = require('node:fs');
const path = require('node:path');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

function displayDate(value) {
  if (!value) return '';
  const parts = String(value).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(value);
}

function formatAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('en-PK', { maximumFractionDigits: 2 })
    : '';
}

function renderInvoice(data, templatePath = path.join(__dirname, 'templates', 'invoice.docx')) {
  if (!fs.existsSync(templatePath)) {
    throw new Error('Template not found: templates/invoice.docx');
  }

  const zip = new PizZip(fs.readFileSync(templatePath));
  const document = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });
  const total = data.total ?? Number(data.amount || 0) * Number(data.quantity || 1);
  document.render({
    DATE: displayDate(data.date),
    REF: data.ref || '',
    Name: data.name || '',
    CNIC: data.cnic || '',
    Contact: data.contact || '',
    Address: data.address || '',
    Particular: data.particular || '',
    Amount: formatAmount(data.amount),
    Total: formatAmount(total),
    VIN: data.vin || '',
    Motor_Number: data.motor || '',
    Colour: data.colour || '',
    Quantity: data.quantity || 1,
    Mode: data.mode || '',
    Bank: data.bank || '',
    Dealt_by: data.dealtBy || '',
    Amt_ex_tx: formatAmount(data.amtEx),
    Sales_tx: formatAmount(data.salesTx),
  });

  return document.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

module.exports = { renderInvoice };