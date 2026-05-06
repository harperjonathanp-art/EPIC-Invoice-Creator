# ⚡ EPIC STEM Invoice Creator

A lightweight, browser-based invoice generator for the EPIC STEM program. No backend required — just a single HTML file hosted on GitHub Pages with optional Google Sheets integration.

## Features

- **Create invoices** with customer details, line items, tax rates, and notes
- **Print-ready preview** with clean formatting
- **Email tab** generates a styled HTML invoice with a **Pay Now** button linking to SuccessFund
- **Google Sheets sync** — invoices auto-save to a shared spreadsheet
- **Invoice history** pulled from the sheet so all teachers see the same data
- **Mobile responsive** — works on phones and tablets

## Quick Start

**For teachers:** Just visit the hosted URL — no installation needed.

## Google Sheets Setup (One-Time)

1. Create a new Google Sheet named **"EPIC STEM Invoices"**
2. Add these headers in Row 1:

   | A | B | C | D | E | F | G | H | I | J | K | L | M |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Invoice # | Date | Due Date | Customer | Email | Address | Items | Subtotal | Tax Rate | Tax | Total | Notes | Saved At |

3. Go to **Extensions → Apps Script**
4. Paste the contents of `google-apps-script.js`
5. Click **Deploy → New Deployment**
6. Set type: **Web app**, Execute as: **Me**, Who has access: **Anyone**
7. Copy the deployment URL
8. Update the `SHEET_URL` variable in `index.html`

> **Important:** If you update the Apps Script code, you must create a **new** deployment (Deploy → New Deployment). Editing an existing deployment does NOT update the live code.

## Hosting on GitHub Pages

1. Create a new GitHub repository
2. Upload `index.html` and `google-apps-script.js`
3. Go to **Settings → Pages**
4. Set Source to **Deploy from a branch**, select `main`, folder `/ (root)`
5. Your invoice creator will be live at `https://yourusername.github.io/repo-name/`

## Color Scheme

Built with Mill Creek High School's brand colors:

- **Pantone 289 C** (#0C2340) — Dark navy
- **Pantone 202 C** (#862633) — Maroon
- **Pantone 4525 C** (#C2A04F) — Gold
- White & Black

## Payment Integration

Invoices include a **Pay Now** button linking to the program's SuccessFund page. Update the `PAY_URL` variable in `index.html` to change the payment link.
