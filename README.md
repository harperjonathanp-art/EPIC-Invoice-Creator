# EPIC STEM Invoice Creator

A browser-based invoice generator for the EPIC STEM program at Mill Creek High School. It's one HTML file hosted on GitHub Pages, with optional Google Sheets logging.

## Features

- **Create invoices** with customer details, line items, tax and notes
- **Payments and credits**: list deposits, scholarships or earlier credits. They come off the total after tax, and the invoice shows a balance due (or "Paid in full")
- **How to pay**: an online payment link (for example SuccessFund) and/or who to make checks payable to and where to send them. Leave a box empty to leave that option off. These settings, and your name and email, are remembered on each device
- **Download PDF**: makes a real one-page letter-size PDF, with a working payment link in it
- **Email with PDF attached**: on devices with a share menu (iPad, iPhone, Mac Safari, Chromebook, Windows Chrome/Edge) this opens the share menu with the PDF already attached, so you pick Mail, Outlook or Gmail. On other browsers it downloads the PDF and opens a new email with the text filled in, and you drag the PDF in. A plain `mailto:` link can't attach files on its own, so that's the limit of what a web page can do
- **Copy email HTML**: a branded invoice with a Pay button to paste into the body of an email
- **Google Sheets log** that every teacher shares, plus a History tab
- **Draft autosave**: a refresh or a closed tab doesn't lose the invoice you're working on
- Mill Creek High School branding (Cardinal, Vegas Gold and Navy, Jost type, the MC Oval), and it works on phones

## Updating the Google Sheet script (needed for credits)

The page works with the old script, but credits and balance due are only logged once the new script is live, and only the new script updates a row when you re-save an invoice (the old one adds a duplicate row).

1. Open the sheet, then **Extensions → Apps Script**
2. Replace everything with the contents of `google-apps-script.js` and save
3. **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**

Doing it this way keeps the same URL, so nothing in `index.html` changes. The script adds the new columns (Credits, Balance Due, Created By) to Row 1 by itself.

## First-time Google Sheets setup

1. Create a Google Sheet (for example "EPIC STEM Invoices"). Headers are added automatically
2. **Extensions → Apps Script**, paste in `google-apps-script.js`
3. **Deploy → New deployment**, type **Web app**, Execute as **Me**, Who has access **Anyone**
4. Copy the Web App URL into `SHEET_URL` in `index.html`

## Settings in `index.html`

| Setting | What it does |
| --- | --- |
| `SHEET_URL` | The Apps Script Web App URL invoices log to |
| `DEFAULT_PAY_URL` | The payment link a new device starts with (each teacher can change theirs) |
| `TAGLINE` | The line under "EPIC STEM" on the invoice |

## Hosting on GitHub Pages

**Settings → Pages**, Source **Deploy from a branch**, branch `main`, folder `/ (root)`. Keep the `assets` folder next to `index.html`: the email version of the invoice loads the logo PNG from there (email apps can't show the inline logo), so the email logo only shows when the page is opened from the hosted site.

## Brand

Colors and marks follow Mill Creek High School's 2019 brand guide: Cardinal `#8b2331`, Vegas Gold `#c7b683`, Navy `#0c223f`, Jost type. `assets/mc-oval-primary.svg` is the MC Oval from the guide. Don't recolor or redraw it.
