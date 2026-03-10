const { generatePdf } = require('../services/pdfService');

async function handleGeneratePdf(req, res, next) {
  try {
    const { html, footerEnabled, margins } = req.body;
    const pdf = await generatePdf(html, { footerEnabled, margins });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="document.pdf"',
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  } catch (error) {
    next(error);
  }
}

module.exports = { handleGeneratePdf };
