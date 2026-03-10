const puppeteer = require('puppeteer');

async function generatePdf(html, options = {}) {
  const { footerEnabled = false, margins } = options;
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: margins || { top: '20mm', right: '15mm', bottom: '25mm', left: '15mm' },
    };

    if (footerEnabled) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = '<div></div>';
      pdfOptions.footerTemplate = `
        <div style="width:100%; font-size:9px; padding:0 15mm; text-align:right; color:#555;">
          Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span>
        </div>
      `;
    }

    const pdf = await page.pdf(pdfOptions);
    return pdf;
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { generatePdf };
