const puppeteer = require('puppeteer');

async function generatePdf(html, options = {}) {
  const { footerEnabled = false, margins, qrDataUrl } = options;
  let browser;
  try {
    const launchArgs = {
      headless: 'new',
         args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--font-render-hinting=none',
      ],
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchArgs.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    browser = await puppeteer.launch(launchArgs);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    };

    // QR is now embedded in HTML on the last page only, not in footer
    if (footerEnabled) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = '<div></div>';

      const pageNumHtml = `<span style="font-size:9px;color:#555;">Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>`;

      pdfOptions.footerTemplate = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding:0 15mm; font-size:9px;">
          <div></div>
          ${pageNumHtml}
        </div>
      `;
      pdfOptions.margin.bottom = '15mm';
    }

    const pdf = await page.pdf(pdfOptions);
    return pdf;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generatePdf };
