# PDF Generator Backend (Puppeteer)

Backend Express.js untuk generate PDF menggunakan Puppeteer.

## Instalasi

```bash
cd pdf-backend
npm install
```

## Menjalankan

```bash
npm start
```

Server akan berjalan di `http://localhost:3002`.

## Endpoint

### POST /api/generate-pdf

**Body (JSON):**
```json
{
  "html": "<html>...</html>",
  "footerEnabled": true
}
```

**Response:** File PDF (application/pdf)
