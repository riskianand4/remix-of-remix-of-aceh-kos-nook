const QRCode = require('qrcode');
const asyncHandler = require('../middleware/asyncHandler');

exports.handleGenerateQr = asyncHandler(async (req, res) => {
  const { text, size = 200 } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  const dataUrl = await QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
  });
  res.json({ dataUrl });
});
