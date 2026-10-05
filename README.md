# Metro Lyallpur EV — Invoice Manager

A complete invoice management web app with Google Sheets cloud backup.

---

## 📁 Project Files

```
metro-ev-invoice/
├── index.html              ← Main app (open this in browser)
├── invoice-template-data.js ← Embedded invoice template data
├── Logo.png                ← App logo and startup splash image
├── google-apps-script.js   ← Backend script for Google Sheets
├── README.md               ← This file
├── netlify.toml            ← Static Netlify site configuration
├── scripts/                ← Template embedding utility
├── templates/
│   └── invoice.docx        ← Source Word template
└── vendor/                 ← Browser DOCX generation libraries
```

---

## 🚀 Quick Start

1. Open `index.html` in a modern browser (Chrome, Edge, Firefox). No npm install, server startup, or activation is required.
2. The DOCX template and rendering libraries are bundled with the app; Word export and PDF preview use the same template directly in the browser.
3. Data is saved locally in your browser's localStorage.
4. Optionally connect Google Sheets for cloud backup (see below)

## Deploy to Netlify

1. Push the project folder to a Git repository and import it in Netlify, or run `npx netlify deploy` from this folder.
2. Use the repository root as the base and publish directory. Leave the build command empty.
3. Netlify serves the app and its bundled static assets; there is no template function to deploy.
4. Word export renders the embedded DOCX in the browser. PDF export renders the same DOCX in the browser and opens the print dialog; choose **Save as PDF**.

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
7. The app uses the endpoint configured in `SHEETS_WEB_APP_URL` in `index.html`. Click **Test** to verify the connection.

The app loads existing invoices and VINs from Sheets on startup and when you test the connection. Pending local changes can be pushed with the Sync button.

The Sheets URL is fixed in the app and cannot be changed through Settings or browser-local settings. If the Apps Script deployment URL changes, update `SHEETS_WEB_APP_URL` and redeploy the app. This is a UI-level restriction only: the URL is visible in the page source, and static client-side code cannot enforce access control or prevent a technically capable user from modifying their local page. Do not treat the fixed URL as a password or security boundary.

When updating `google-apps-script.js`, publish a new web-app version from **Deploy → Manage deployments → Edit → New version → Deploy**. This is required for the spreadsheet-timezone date formatting fix to take effect.

`Logo.png` is used for the browser favicon, startup splash screen, and sidebar logo. Keep it alongside `index.html` when deploying.

---

## 📋 Invoice Template (Word/PDF Export)

The app includes the `templates/invoice.docx` content in `invoice-template-data.js`, so Word export and PDF preview work without a separate server. If you edit the Word template, rebuild the embedded data with `node scripts/embed-template.js` and deploy both files. The template uses these placeholder tags which are replaced at export time:

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

To bulk-import VINs, create a CSV file with columns such as:
```
VIN,Model/Description,Colour
DD35G48130000922,Metro Wonder Bike,Red
T910L723000002660,Metro T9 Sport LFP,Blue
```

The importer also accepts the VIN registry format with a separate motor number and particulars:
```
VIN,Motor_Number,Particulars,Colour
123,123456,Metro Wonder Bike,Blue
```

Headers are matched case-insensitively, and quoted values with commas are supported. Imported motor numbers, particulars, and colours are kept in the VIN registry and can be filled into invoices by selecting the VIN.

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
