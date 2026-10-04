const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { renderInvoice } = require('./invoice-template');

const execFileAsync = promisify(execFile);
const PORT = Number(process.env.PORT) || 3434;
const TEMPLATE_PATH = path.join(__dirname, 'templates', 'invoice.docx');

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body must be valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

async function convertDocxToPdf(docxPath, pdfPath) {
  if (process.platform === 'win32') {
    const script = [
      "$ErrorActionPreference = 'Stop'",
      '$word = $null',
      '$document = $null',
      'try {',
      '  $word = New-Object -ComObject Word.Application',
      '  $word.Visible = $false',
      '  $word.DisplayAlerts = 0',
      '  $document = $word.Documents.Open($env:MLEV_DOCX, $false, $true)',
      '  $document.ExportAsFixedFormat($env:MLEV_PDF, 17)',
      '} finally {',
      '  if ($document) { $document.Close(0) }',
      '  if ($word) { $word.Quit() }',
      '}',
    ].join('\n');
    await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-STA', '-Command', script], {
      env: { ...process.env, MLEV_DOCX: docxPath, MLEV_PDF: pdfPath },
      windowsHide: true,
      timeout: 60000,
    });
  } else {
    await execFileAsync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', path.dirname(pdfPath), docxPath], {
      timeout: 60000,
    });
  }

  const pdf = await fs.promises.readFile(pdfPath);
  if (!pdf.length) throw new Error('PDF conversion produced an empty file');
  return pdf;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/ping') {
    sendJson(res, 200, { status: 'ok', templateFound: fs.existsSync(TEMPLATE_PATH) });
    return;
  }

  if (req.method === 'POST' && req.url === '/generate-word') {
    try {
      const data = await readJson(req);
      const buffer = renderInvoice(data);
      const ref = String(data.ref || data.id || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '-');
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Invoice_${ref}.docx"`,
      });
      res.end(buffer);
    } catch (error) {
      sendJson(res, 500, { error: error.message || 'Could not generate invoice' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/generate-pdf') {
    let directory;
    try {
      const data = await readJson(req);
      directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'mlev-invoice-'));
      const docxPath = path.join(directory, 'invoice.docx');
      const pdfPath = path.join(directory, 'invoice.pdf');
      await fs.promises.writeFile(docxPath, renderInvoice(data));
      const pdf = await convertDocxToPdf(docxPath, pdfPath);
      const ref = String(data.ref || data.id || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '-');
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice_${ref}.pdf"`,
      });
      res.end(pdf);
    } catch (error) {
      const message = error.code === 'ENOENT'
        ? 'PDF export requires Microsoft Word on Windows or LibreOffice on other platforms'
        : error.message || 'Could not generate invoice PDF';
      sendJson(res, 500, { error: message });
    } finally {
      if (directory) await fs.promises.rm(directory, { recursive: true, force: true });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Invoice template server listening at http://localhost:${PORT}`);
});