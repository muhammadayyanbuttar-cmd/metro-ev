# Metro Lyallpur EV — Invoice Manager

A complete invoice management web app with Google Sheets cloud backup.

---

## 📁 Project Files

```
metro-ev-invoice/
├── index.html              ← Main app (open this in browser)
├── google-apps-script.js   ← Backend script for Google Sheets
├── README.md               ← This file
├── netlify.toml            ← Netlify site and function configuration
├── netlify/functions/      ← Serverless invoice template endpoint
└── templates/              ← Place your .docx invoice template here
    └── invoice.docx        ← (add your template with placeholders)
```

---

## 🚀 Quick Start

1. Run `npm install`, then `npm start` in the project folder to start the invoice template server
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox)
3. Data is saved locally in your browser's localStorage; each saved invoice downloads a Word document generated from `templates/invoice.docx`
4. Optionally connect Google Sheets for cloud backup (see below)

## Deploy to Netlify

1. Push the project folder to a Git repository and import it in Netlify, or run `npx netlify deploy` from this folder.
2. Use the repository root as the base and publish directory. Leave the build command empty.
3. Netlify reads `netlify.toml`, deploys the template function, and includes `templates/invoice.docx` with it.
4. Word export uses the template function. PDF export renders that same DOCX in the browser and opens the print dialog; choose **Save as PDF**.

The Netlify site can also use the existing Google Sheets connection. Invoice records remain in each browser's local storage unless Sheets is configured.

---

## ☁ Google Sheets Setup

1. Create a new **Google Spreadsheet**
2. Go to **Extensions → Apps Script**
3. Delete any existing code and paste the contents of `google-apps-script.js`
4. Click **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, copy the **Web App URL**
6. In the app, go to **Settings → Google Sheets Connection**
7. Paste the URL and click **Save**, then **Test**

The app will now sync invoices to your Google Sheet automatically.

---

## 📋 Invoice Template (Word/PDF Export)

The local template server reads `templates/invoice.docx` whenever an invoice is saved. Keep `npm start` running while using the app. PDF export converts the same rendered DOCX using Microsoft Word on Windows or LibreOffice on other platforms.  
The template uses these placeholder tags which are replaced at export time:

| Placeholder | Description |
|---|---|
| `{{DATE}}` | Invoice date |
| `{{REF}}` | Reference number (e.g. 26/001) |
| `{{Name}}` | Customer name |
| `{{CNIC}}` | Customer CNIC |
| `{{Contact}}` | Contact number |
| `{{Address}}` | Customer address |
| `{{Particular}}` | Vehicle/product name |
| `{{Amount}}` | Total amount (incl. tax) |
| `{{Total}}` | Grand total |
| `{{VIN}}` | Vehicle VIN |
| `{{Motor_Number}}` | Motor number |
| `{{Colour}}` | Vehicle colour |
| `{{Quantity}}` | Quantity |
| `{{Mode}}` | Payment mode |
| `{{Bank}}` | Bank name |
| `{{Dealt_by}}` | Sales representative |
| `{{Amt_ex_tx}}` | Amount excluding sales tax |
| `{{Sales_tx}}` | Sales tax amount (1%) |

---

## 📊 Sales Tax Calculation

Sales tax is **1% included in the price**:

```
Sales Tax    = Total ÷ 101 × 1
Amount ex tx = Total − Sales Tax
```

---

## 🚗 VIN Bulk Import (CSV)

To bulk-import VINs, create a CSV file with columns:
```
VIN,Model/Description,Colour
DD35G48130000922,Metro Wonder Bike,Red
T910L723000002660,Metro T9 Sport LFP,Blue
```

Go to **VIN Manager → Bulk Import CSV** and select the file.

---

## 📥 Legacy Data Import

Go to **Legacy Import**, paste your JSON array or upload the `.json` file.
Legacy record IDs are ignored — new sequential IDs are assigned automatically.

---

## 🔢 Reference Numbers

Default format: `26/001`  
- `26` = year (configurable in Settings)  
- `001` = sequential number (auto-increments, can be changed)  
- Numbers can repeat if needed (manual override allowed)

---

## 💾 Data Backup

Go to **Settings → Data Management** to export:
- **JSON** — full backup of all invoices + VINs
- **CSV** — spreadsheet-compatible export (respects current search filters)
