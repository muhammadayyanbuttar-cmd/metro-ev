const fs = require('node:fs');
const path = require('node:path');
const { renderInvoice } = require('../../invoice-template');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  };
}

exports.handler = async event => {
  const action = event.queryStringParameters?.action;
  const templatePath = path.join(process.cwd(), 'templates', 'invoice.docx');

  if (event.httpMethod === 'GET' && action === 'ping') {
    return jsonResponse(200, { status: 'ok', templateFound: fs.existsSync(templatePath) });
  }

  if (event.httpMethod !== 'POST' || action !== 'generate-word') {
    return jsonResponse(404, { error: 'Not found' });
  }

  try {
    const data = JSON.parse(event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '{}');
    const document = renderInvoice(data, templatePath);
    const ref = String(data.ref || data.id || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '-');

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Invoice_${ref}.docx"`,
      },
      body: document.toString('base64'),
    };
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Could not generate invoice' });
  }
};