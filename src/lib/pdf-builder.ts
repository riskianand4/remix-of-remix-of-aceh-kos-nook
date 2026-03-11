import {
  DocumentData,
  PaperSize,
  CoverLayout,
  CoverImageElement,
  DEFAULT_COVER_LAYOUT,
  DEFAULT_SURAT_RESMI,
} from "@/types/document";
import { buildTheme } from "@/lib/pdf-themes";
import { calculateColumn } from "@/lib/table-calculations";
import { generateQrDataUrl } from "@/lib/qr-utils";

function buildQrBlock(docCode: string, qrDataUrl: string): string {
  return `
    <div class="qr-verification">
      ${qrDataUrl ? `<img src="${qrDataUrl}" class="qr-image" />` : ""}
      <p class="qr-label">Scan untuk verifikasi</p>
      <p class="qr-code-text">${escapeHtml(docCode)}</p>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PAPER_SIZES: Record<PaperSize, string> = {
  A4: "A4",
  Letter: "Letter",
  Legal: "Legal",
  F4: "215mm 330mm",
};

function formatKopText(raw: string): string {
  const lines = raw.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return "";
  const first = `<strong style="font-size:12pt;display:block;margin-bottom:2px;">${escapeHtml(lines[0])}</strong>`;
  const rest = lines
    .slice(1)
    .map((l) => escapeHtml(l))
    .join("<br/>");
  return first + (rest ? `<span style="font-size:9pt;">${rest}</span>` : "");
}

export async function generatePdfHtml(doc: DocumentData): Promise<string> {
  // Generate QR data URL if docCode exists and QR is enabled
  let qrDataUrl = "";
  if (doc.qrEnabled !== false && doc.docCode) {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://example.com";
    const verifyUrl = `${origin}/verify/${encodeURIComponent(doc.docCode)}`;
    qrDataUrl = await generateQrDataUrl(verifyUrl, 100);
  }

  if (doc.documentType === "surat-resmi") {
    return generateSuratResmiHtml(doc, qrDataUrl);
  }
  return generateDokumentasiHtml(doc, qrDataUrl);
}

function generateSuratResmiHtml(doc: DocumentData, qrDataUrl: string): string {
  const orientation = doc.pageOrientation || "portrait";
  const paperSize = PAPER_SIZES[doc.paperSize || "A4"];
  const pageSize =
    orientation === "landscape" ? `${paperSize} landscape` : paperSize;
  const theme = buildTheme(doc.customTheme);
  const m = doc.margins || { top: 20, bottom: 25, left: 25, right: 20 };
  const contentLineSpacing = doc.contentLineSpacing || 1.5;
  const kopLogoPosition = doc.kopLogoPosition || "left";
  const kopDividerEnabled = doc.kopDividerEnabled || false;
  const kopSpacing = doc.kopSpacing || 8;
  const surat = doc.suratResmi || DEFAULT_SURAT_RESMI;

  const hasKop = doc.kopText || doc.kopLogoDataUrl || doc.kopLogoRightDataUrl;
  const kopDividerHtml = kopDividerEnabled ? `<hr class="kop-divider" />` : "";
  const kopBlock = hasKop
    ? `
    <div class="kop-header" style="display:flex; align-items:center; gap:16px; margin-bottom:${kopSpacing}mm;">
      ${doc.kopLogoDataUrl ? `<img src="${doc.kopLogoDataUrl}" class="kop-logo" style="flex-shrink:0;" />` : ""}
      ${
        doc.kopText
          ? `
        <div class="kop-text" style="flex:1; ${kopLogoPosition === "center" ? "text-align:center;" : "text-align:left;"}">
          ${formatKopText(doc.kopText)}
        </div>
      `
          : ""
      }
      ${doc.kopLogoRightDataUrl ? `<img src="${doc.kopLogoRightDataUrl}" class="kop-logo" style="flex-shrink:0;" />` : ""}
    </div>
    ${kopDividerHtml}
  `
    : "";

  // For judul-tengah format: centered title + number, no recipient
  const isJudulTengah = surat.suratFormat === "judul-tengah";

  // Date line
  const dateObj = new Date(doc.date);
  const formattedDate = dateObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dateLine = surat.suratTempat
    ? `${escapeHtml(surat.suratTempat)}, ${formattedDate}`
    : formattedDate;

  // Letter metadata
  const metaHtml = isJudulTengah
    ? ""
    : `
    <table class="surat-meta">
      ${surat.suratNomor ? `<tr><td class="meta-key">Nomor</td><td class="meta-sep">:</td><td>${escapeHtml(surat.suratNomor)}</td></tr>` : ""}
      ${surat.suratLampiran ? `<tr><td class="meta-key">Lampiran</td><td class="meta-sep">:</td><td>${escapeHtml(surat.suratLampiran)}</td></tr>` : ""}
      ${surat.suratPerihal ? `<tr><td class="meta-key">Hal</td><td class="meta-sep">:</td><td><strong>${escapeHtml(surat.suratPerihal)}</strong></td></tr>` : ""}
    </table>
  `;

  // Title block for judul-tengah format
  const titleBlockHtml = isJudulTengah
    ? `
    <div class="surat-title-block">
      <h1 class="surat-title">${escapeHtml(surat.suratJudul || surat.suratPerihal || "SURAT")}</h1>
      ${surat.suratNomor ? `<p class="surat-title-number">Nomor: ${escapeHtml(surat.suratNomor)}</p>` : ""}
    </div>
  `
    : "";

  // Recipient — only for dengan-tujuan
  const recipientHtml =
    !isJudulTengah && (surat.suratTujuan.nama || surat.suratTujuan.jabatan)
      ? `
    <div class="surat-recipient">
      <p>Kepada Yth.</p>
      ${surat.suratTujuan.nama ? `<p><strong>${escapeHtml(surat.suratTujuan.nama)}</strong></p>` : ""}
      ${surat.suratTujuan.jabatan ? `<p>${escapeHtml(surat.suratTujuan.jabatan)}</p>` : ""}
      ${surat.suratTujuan.alamat ? `<p>di ${escapeHtml(surat.suratTujuan.alamat)}</p>` : ""}
    </div>
  `
      : "";

  // Body content — render ALL content blocks in order
  const bodyContent = (doc.contentBlocks || [])
    .map((block) => {
      const spacingStyle = block.spacingAfter
        ? `margin-bottom:${block.spacingAfter}pt;`
        : "";
      const fontSizeStyle = block.fontSize
        ? `font-size:${block.fontSize}pt;`
        : "";
      if (block.type === "text") {
        const indent = block.indent ? `text-indent:${block.indent}mm;` : "";
        const pageBreak = block.newPageBefore
          ? "page-break-before:always;"
          : "";
        const content =
          block.htmlContent || escapeHtml(block.body).replace(/\n/g, "<br/>");
        return `<div style="${indent}${pageBreak}${spacingStyle}${fontSizeStyle}">${content}</div>`;
      }
      if (block.type === "fields") {
        const pageBreak = block.newPageBefore
          ? "page-break-before:always;"
          : "";
        const fieldsHtml = block.fields
          .map(
            (f) =>
              `<tr><td class="field-key">${escapeHtml(f.key)}</td><td class="field-sep">:</td><td class="field-val">${escapeHtml(f.value)}</td></tr>`,
          )
          .join("");
        return `<div style="${pageBreak}${spacingStyle}${fontSizeStyle}"><table class="fields-table"><tbody>${fieldsHtml}</tbody></table></div>`;
      }
      return "";
    })
    .join("\n");

  // Signature
  const sigAlign =
    surat.signaturePosition === "left"
      ? "flex-start"
      : surat.signaturePosition === "center"
        ? "center"
        : "flex-end";
  const signeesHtml =
    doc.signees.length > 0
      ? `
    <div class="surat-signatures" style="justify-content:${sigAlign};">
      ${doc.signees
        .map((s) => {
          const sigSize = s.signatureSize || 80;
          const stpSize = s.stampSize || 100;
          const containerH = Math.max(sigSize, stpSize) + 10;
          const titleAboveHtml = s.titleAbove
            ? s.titleAbove
                .split("\n")
                .map(
                  (line) =>
                    `<p class="signee-title-above">${escapeHtml(line)}</p>`,
                )
                .join("")
            : "";
          return `
        <div class="signee-block">
          ${titleAboveHtml}
          <div class="signee-images" style="min-height:${containerH}px;overflow:visible;">
            ${s.stampDataUrl ? `<img src="${s.stampDataUrl}" class="stamp-image" style="max-height:${stpSize}px;" />` : ""}
            ${s.signatureDataUrl ? `<img src="${s.signatureDataUrl}" class="signature-image" style="max-height:${sigSize}px;" />` : ""}
          </div>
          <div class="signee-line"></div>
          <p class="signee-name">${escapeHtml(s.name || "_______________")}</p>
          <p class="signee-role">${escapeHtml(s.role || "")}</p>
          ${s.nip ? `<p class="signee-nip">${escapeHtml(s.nip)}</p>` : ""}
        </div>
      `;
        })
        .join("")}
    </div>
  `
      : "";

  // Tembusan
  const tembusanHtml =
    surat.suratTembusan.length > 0
      ? `
    <div class="surat-tembusan">
      <p><strong><u>Tembusan:</u></strong></p>
      <ol>
        ${surat.suratTembusan.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
      </ol>
    </div>
  `
      : "";

  // Watermark
  const watermarkHtml = doc.watermarkEnabled
    ? `
    <div class="watermark" style="opacity: ${doc.watermarkOpacity || 0.1};">${escapeHtml(doc.watermarkText || "DRAFT")}</div>
  `
    : "";

  const footerText = doc.footerText || "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  @page { size: ${pageSize}; margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${theme.fontFamily};
    font-size: ${theme.fontSize}pt;
    color: ${theme.bodyColor};
    line-height: ${contentLineSpacing};
  }

  .page {
    padding: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm;
    position: relative;
    min-height: 100vh;
  }
  @media print { .page { padding: 0; } }

  .watermark {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 80pt; font-weight: bold; color: #000; pointer-events: none; z-index: 0;
    white-space: nowrap; text-transform: uppercase;
  }

  .kop-header { display: flex; align-items: center; gap: 16px; position: relative; z-index: 1; padding-bottom: 8px; }
  .kop-logo { max-height: 60px; object-fit: contain; }
  .kop-text { font-size: 10pt; color: ${theme.bodyColor}; line-height: 1.5; }
  .kop-divider { border: none; border-top: 3px double ${theme.dividerColor}; margin-bottom: 20px; }

  .surat-date { text-align: right; margin-bottom: 16pt; font-size: ${theme.fontSize}pt; }

  .surat-meta { border-collapse: collapse; margin-bottom: 16pt; font-size: ${theme.fontSize}pt; }
  .surat-meta td { border: none; padding: 1pt 4pt; vertical-align: top; }
  .meta-key { white-space: nowrap; min-width: 80pt; }
  .meta-sep { white-space: nowrap; padding: 1pt 4pt; }

  .surat-recipient { margin-bottom: 20pt; font-size: ${theme.fontSize}pt; }
  .surat-recipient p { margin-bottom: 2pt; }

  .surat-body { text-align: justify; margin-bottom: 24pt; position: relative; z-index: 1; font-size: ${theme.fontSize}pt; }
  .surat-body p { margin-bottom: 8pt; }
  .surat-body .fields-table { border-collapse: collapse; margin: 8pt 0; width: auto; }
  .surat-body .fields-table td { border: none; padding: 2pt 6pt; vertical-align: top; font-size: ${theme.fontSize}pt; }
  .surat-body .field-key { white-space: nowrap; min-width: 100pt; }
  .surat-body .field-sep { white-space: nowrap; padding: 2pt 4pt; }
  .surat-body .field-val { }

  .surat-signatures { display: flex; gap: 24px; margin-top: 40pt; }
  .signee-block { text-align: center; min-width: 180px; }
  .signee-images { position: relative; min-height: 70px; margin-bottom: 8px; }
  .stamp-image { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: 0.7; }
  .signature-image { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
  .signee-line { border-top: 1px solid ${theme.bodyColor}; margin-bottom: 4px; }
  .signee-name { font-weight: bold; font-size: 11pt; text-decoration: underline; }
  .signee-role { font-size: 9pt; color: #666; }
  .signee-nip { font-size: 9pt; color: #444; margin-top: 2px; }
  .signee-title-above { font-size: 10pt; margin-bottom: 2px; }

  .surat-title-block { text-align: center; margin-bottom: 24pt; }
  .surat-title { font-size: 14pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 4pt; }
  .surat-title-number { font-size: ${theme.fontSize}pt; }

  .qr-verification {
    position: absolute; bottom: 8mm; left: 8mm;
    text-align: center; z-index: 10;
    padding: 4px; border: 1px solid #ddd; border-radius: 4px;
    background: white;
  }
  .qr-image { width: 50px; height: 50px; }
  .qr-label { font-size: 6pt; color: #888; margin-top: 1px; }
  .qr-code-text { font-size: 6pt; font-weight: bold; color: #333; font-family: monospace; }

  .surat-tembusan { margin-top: 24pt; font-size: ${Number(theme.fontSize) - 1}pt; }
  .surat-tembusan ol { padding-left: 20pt; }
  .surat-tembusan li { margin-bottom: 2pt; }

  .page-footer {
    position: absolute; bottom: 8mm; left: ${m.left}mm; right: ${m.right}mm;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 8pt; color: #888; z-index: 2;
  }
</style>
</head>
<body>
  <div class="page" data-section="content">
    ${watermarkHtml}
    ${kopBlock}
    ${isJudulTengah ? "" : `<div class="surat-date">${dateLine}</div>`}
    ${titleBlockHtml}
    ${metaHtml}
    ${recipientHtml}
    ${isJudulTengah ? "" : ""}<div class="surat-body">${bodyContent}</div>
    ${signeesHtml}
    ${tembusanHtml}
    ${doc.qrEnabled !== false && doc.docCode ? buildQrBlock(doc.docCode, qrDataUrl) : ""}
  </div>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    var pages = document.querySelectorAll('.page');
    pages.forEach(function(p, i) {
      var el = document.createElement('div');
      el.className = 'page-footer';
      el.innerHTML = '<span>${escapeHtml(footerText)}</span>' +
        ${doc.footerEnabled ? `'<span>Halaman ' + (i+1) + ' dari ' + pages.length + '</span>'` : "''"};
      p.appendChild(el);
    });
  });
</script>
</body>
</html>`;
}

function generateDokumentasiHtml(doc: DocumentData, qrDataUrl: string): string {
  const pages: string[] = [];
  const orientation = doc.pageOrientation || "portrait";
  const paperSize = PAPER_SIZES[doc.paperSize || "A4"];
  const pageSize =
    orientation === "landscape" ? `${paperSize} landscape` : paperSize;
  const theme = buildTheme(doc.customTheme);
  const m = doc.margins || { top: 20, bottom: 25, left: 15, right: 15 };
  const coverLogoSize = doc.coverLogoSize || 80;
  const kopLogoPosition = doc.kopLogoPosition || "left";
  const kopPosition = doc.kopPosition || "top";
  const kopDividerEnabled = doc.kopDividerEnabled || false;
  const kopSpacing = doc.kopSpacing || 8;
  const coverLineSpacing = doc.coverLineSpacing || 1.5;
  const contentLineSpacing = doc.contentLineSpacing || 1.5;
  const layout: CoverLayout = doc.coverLayout || DEFAULT_COVER_LAYOUT;
  const logoWidth = layout.logoWidth || 30;

  // Watermark HTML
  const watermarkHtml = doc.watermarkEnabled
    ? `
    <div class="watermark" style="opacity: ${doc.watermarkOpacity || 0.1};">${escapeHtml(doc.watermarkText || "DRAFT")}</div>
  `
    : "";

  // Cover page with absolute positioning from layout
  if (doc.includeCover) {
    const logoAlignment = layout.logoAlignment || "horizontal";
    const logoFlexDir = logoAlignment === "vertical" ? "column" : "row";
    const logoHtml = doc.logo1DataUrl
      ? `
      <div class="cover-element" style="left:${layout.logos.x}%;top:${layout.logos.y}%;width:${logoWidth}%;">
        <div class="cover-logos" style="flex-direction:${logoFlexDir};gap:${layout.logoGap}px;">
          <img src="${doc.logo1DataUrl}" class="cover-logo" style="max-height:${coverLogoSize}px;" />
          ${doc.logo2DataUrl ? `<img src="${doc.logo2DataUrl}" class="cover-logo" style="max-height:${coverLogoSize}px;" />` : ""}
        </div>
      </div>
    `
      : "";

    // Custom text elements with width control + multiline support
    const textElementsHtml = (layout.textElements || [])
      .map((el) => {
        const elWidth = el.width || 80;
        const elColor = el.color || '#000000';
        const textHtml = escapeHtml(el.text.trim()).replace(/\n/g, "<br/>");
        return `
      <div class="cover-element" style="left:${el.pos.x}%;top:${el.pos.y}%;width:${elWidth}%;">
        <p style="font-size:${el.fontSize}pt;font-weight:${el.bold ? "bold" : "normal"};color:${elColor};font-family:${theme.fontFamily};line-height:1.3;margin:0;word-wrap:break-word;text-align:center;">
          ${textHtml}
        </p>
      </div>
    `;
      })
      .join("");

    // Cover image elements
    const imageElementsHtml = (layout.imageElements || [])
      .map(
        (el: CoverImageElement) => `
      <div class="cover-element" style="left:${el.pos.x}%;top:${el.pos.y}%;width:${el.width}%;">
        <img src="${el.dataUrl}" style="width:100%;height:auto;object-fit:contain;" />
      </div>
    `,
      )
      .join("");

    // Cover table elements (borderless key:value, e.g. "Nama : Rizki Ananda")
    const tableElementsHtml = (layout.tableElements || [])
      .map((tbl) => {
        const tblWidth = tbl.width || 60;
        const keyW = tbl.keyWidth || 35;
        const rowsHtml = (tbl.rows || [])
          .map(
            (r) => `
        <tr>
          <td class="cover-table-key" style="width:${keyW}%;font-size:${tbl.fontSize || 12}pt;font-weight:${tbl.bold ? "bold" : "normal"};font-family:${theme.fontFamily};color:${tbl.color || '#000000'};">${escapeHtml(r.key)}</td>
          <td class="cover-table-sep" style="font-size:${tbl.fontSize || 12}pt;font-family:${theme.fontFamily};color:${tbl.color || '#000000'};">:</td>
          <td class="cover-table-val" style="font-size:${tbl.fontSize || 12}pt;font-weight:${tbl.bold ? "bold" : "normal"};font-family:${theme.fontFamily};color:${tbl.color || '#000000'};">${escapeHtml(r.value)}</td>
        </tr>
      `,
          )
          .join("");
        return `
      <div class="cover-element" style="left:${tbl.pos.x}%;top:${tbl.pos.y}%;width:${tblWidth}%;">
        <table class="cover-table"><tbody>${rowsHtml}</tbody></table>
      </div>
    `;
      })
      .join("");

    pages.push(`
      <div class="page cover-page" data-section="cover" style="line-height:${coverLineSpacing};">
        ${watermarkHtml}
        ${logoHtml}
        ${imageElementsHtml}
        ${textElementsHtml}
        ${tableElementsHtml}
      </div>
    `);
  }

  // KOP header template
  const hasKop = doc.kopText || doc.kopLogoDataUrl || doc.kopLogoRightDataUrl;

  const kopDividerHtml = kopDividerEnabled ? `<hr class="kop-divider" />` : "";

const kopBlock = hasKop
    ? `
    <div class="kop-header" style="display:flex; align-items:center; gap:16px; margin-bottom:${kopSpacing}mm;">
      ${doc.kopLogoDataUrl ? `<img src="${doc.kopLogoDataUrl}" class="kop-logo" style="flex-shrink:0;" />` : ""}
      ${doc.kopText ? `
        <div class="kop-text" style="flex:1; ${kopLogoPosition === 'center' ? 'text-align:center;' : 'text-align:left;'}">
          ${formatKopText(doc.kopText)}
        </div>
      ` : ""}
      ${doc.kopLogoRightDataUrl ? `<img src="${doc.kopLogoRightDataUrl}" class="kop-logo" style="flex-shrink:0;" />` : ""}
    </div>
    ${kopDividerHtml}
  `
    : "";

  const kopTop =
    kopPosition === "top" || kopPosition === "both" ? kopBlock : "";
  const kopBottom =
    kopPosition === "bottom" || kopPosition === "both" ? kopBlock : "";

  // Collect TOC entries - only entries with non-empty titles
  const tocEntries: { title: string; type: "section" | "table" }[] = [];
  const tocImageEntries: string[] = [];
  const tocTableEntries: string[] = [];

  // Text content blocks — group inline blocks onto same page
  // A block with newPageBefore===false is appended inline after the previous block's content.
  // Groups are flushed to a new <div class="page"> whenever a block has newPageBefore!==false (default).
  interface PageGroup {
    kopTop: string;
    kopBottom: string;
    watermark: string;
    chunks: string[]; // inner HTML pieces
  }
  const groups: PageGroup[] = [];

  const flushGroup = (g: PageGroup) => {
    pages.push(`
      <div class="page" data-section="content">
        ${g.watermark}
        ${g.kopTop}
        ${g.chunks.join("\n")}
        ${g.kopBottom}
      </div>
    `);
  };

  (doc.contentBlocks || []).forEach((block, _idx) => {
    const isNewPage = block.newPageBefore !== false; // default true
    const spacingStyle = block.spacingAfter
      ? `margin-bottom:${block.spacingAfter}pt;`
      : "";
    const fontSizeStyle = block.fontSize
      ? `font-size:${block.fontSize}pt;`
      : "";

    let chunkHtml = "";

    if (block.type === "text") {
      if (block.title.trim()) {
        tocEntries.push({ title: block.title, type: "section" });
      }
      const indent = block.indent || 0;
      const content =
        block.htmlContent || escapeHtml(block.body).replace(/\n/g, "<br/>");
      const attachedImagesHtml =
        block.attachedImages && block.attachedImages.length > 0
          ? `
        <div class="attached-images">
          ${block.attachedImages
            .map(
              (img) => `
            <div class="attached-image-item">
              <img src="${img.dataUrl}" class="attached-image" />
              ${img.caption ? `<p class="image-caption">${escapeHtml(img.caption)}</p>` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      `
          : "";
      chunkHtml = `
        <div style="${spacingStyle}${fontSizeStyle}">
        ${block.title.trim() ? `<h2 class="section-title">${escapeHtml(block.title)}</h2>` : ""}
        <div class="text-content" style="${indent > 0 ? `text-indent:${indent}mm;` : ""}">${content}</div>
        ${attachedImagesHtml}
        </div>
      `;
    } else if (block.type === "fields") {
      if (block.title.trim()) {
        tocEntries.push({ title: block.title, type: "section" });
      }
      const fieldsHtml = block.fields
        .map(
          (f) => `
        <tr>
          <td class="field-key">${escapeHtml(f.key)}</td>
          <td class="field-sep">:</td>
          <td class="field-val">${escapeHtml(f.value)}</td>
        </tr>
      `,
        )
        .join("");
      chunkHtml = `
        <div style="${spacingStyle}${fontSizeStyle}">
        ${block.title.trim() ? `<h2 class="section-title">${escapeHtml(block.title)}</h2>` : ""}
        <table class="fields-table"><tbody>${fieldsHtml}</tbody></table>
        </div>
      `;
    }

    if (!chunkHtml) return;

    if (isNewPage || groups.length === 0) {
      // Start a fresh page group
      groups.push({
        kopTop,
        kopBottom,
        watermark: watermarkHtml,
        chunks: [chunkHtml],
      });
    } else {
      // Append inline to current group
      groups[groups.length - 1].chunks.push(chunkHtml);
    }
  });

  // Flush all groups to pages
  groups.forEach(flushGroup);

  // Image sections
  doc.sections.forEach((section) => {
    if (section.title.trim()) {
      tocEntries.push({ title: section.title, type: "section" });
    }
    const gridClass = `grid-${section.gridLayout}`;
    const imagesPerPage =
      section.gridLayout === "1x1"
        ? 1
        : section.gridLayout === "1x2"
          ? 2
          : section.gridLayout === "2x2"
            ? 4
            : 6;

    for (let i = 0; i < section.images.length; i += imagesPerPage) {
      const pageImages = section.images.slice(i, i + imagesPerPage);
      const imageHtml = pageImages
        .map((img) => {
          if (img.caption?.trim()) {
            tocImageEntries.push(img.caption);
          }
          return `
          <div class="image-item">
            <img src="${img.dataUrl}" class="grid-image" />
            ${img.caption ? `<p class="image-caption">${escapeHtml(img.caption)}</p>` : ""}
          </div>
        `;
        })
        .join("");

      pages.push(`
        <div class="page" data-section="content">
          ${watermarkHtml}
          ${kopTop}
          ${i === 0 && section.title.trim() ? `<h2 class="section-title">${escapeHtml(section.title)}</h2>` : ""}
          <div class="image-grid ${gridClass}">${imageHtml}</div>
          ${kopBottom}
        </div>
      `);
    }
  });

  // Tables
  doc.tables.forEach((table) => {
    if (table.title.trim()) {
      tocEntries.push({ title: table.title, type: "table" });
      tocTableEntries.push(table.title);
    }
    const headerRow = table.columns
      .map((col) => `<th>${escapeHtml(col)}</th>`)
      .join("");
    const bodyRows = table.rows
      .map(
        (row, ri) =>
          `<tr class="${ri % 2 === 1 ? "alt-row" : ""}">${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
      )
      .join("");

    let calcFooter = "";
    if (table.columnCalcs) {
      const hasCalcs = Object.values(table.columnCalcs).some(
        (c) => c !== "NONE",
      );
      if (hasCalcs) {
        const calcCells = table.columns
          .map((_, ci) => {
            const calc = table.columnCalcs?.[ci] || "NONE";
            if (calc === "NONE") return '<td class="calc-cell"></td>';
            const result = calculateColumn(table.rows, ci, calc);
            return `<td class="calc-cell"><strong>${calc}: ${result}</strong></td>`;
          })
          .join("");
        calcFooter = `<tfoot><tr class="calc-row">${calcCells}</tr></tfoot>`;
      }
    }

    pages.push(`
      <div class="page" data-section="tables">
        ${watermarkHtml}
        ${kopTop}
        ${table.title.trim() ? `<h2 class="section-title">${escapeHtml(table.title)}</h2>` : ""}
        <table class="data-table">
          <thead><tr>${headerRow}</tr></thead>
          <tbody>${bodyRows}</tbody>
          ${calcFooter}
        </table>
        ${kopBottom}
      </div>
    `);
  });

  // Signatures
  if (doc.signees.length > 0) {
    const signeesHtml = doc.signees
      .map((s) => {
        const sigSize = s.signatureSize || 80;
        const stpSize = s.stampSize || 100;
        const containerH = Math.max(sigSize, stpSize) + 10;
        const titleAboveHtml = s.titleAbove
          ? s.titleAbove
              .split("\n")
              .map(
                (line) =>
                  `<p class="signee-title-above">${escapeHtml(line)}</p>`,
              )
              .join("")
          : "";
        return `
      <div class="signee-block">
        ${titleAboveHtml}
        <div class="signee-images" style="min-height:${containerH}px;overflow:visible;">
          ${s.stampDataUrl ? `<img src="${s.stampDataUrl}" class="stamp-image" style="max-height:${stpSize}px;" />` : ""}
          ${s.signatureDataUrl ? `<img src="${s.signatureDataUrl}" class="signature-image" style="max-height:${sigSize}px;" />` : ""}
        </div>
        <div class="signee-line"></div>
        <p class="signee-name">${escapeHtml(s.name || "_______________")}</p>
        <p class="signee-role">${escapeHtml(s.role || "")}</p>
        ${s.nip ? `<p class="signee-nip">${escapeHtml(s.nip)}</p>` : ""}
      </div>
    `;
      })
      .join("");

    const sigContent = `<div class="signatures-container">${signeesHtml}</div>
        ${doc.qrEnabled !== false && doc.docCode ? buildQrBlock(doc.docCode, qrDataUrl) : ""}`;

    if (doc.signatureNewPage !== false) {
      // New page for signatures (default)
      pages.push(`
        <div class="page" data-section="signatures">
          ${watermarkHtml}
          ${kopTop}
          ${sigContent}
          ${kopBottom}
        </div>
      `);
    } else {
      // Append to last page if possible
      if (pages.length > 0) {
        const lastPage = pages[pages.length - 1];
        // Insert before the closing kopBottom + </div>
        const insertPoint = lastPage.lastIndexOf('</div>');
        if (insertPoint > -1) {
          pages[pages.length - 1] = lastPage.slice(0, insertPoint) + sigContent + lastPage.slice(insertPoint);
        } else {
          pages.push(`<div class="page" data-section="signatures">${watermarkHtml}${kopTop}${sigContent}${kopBottom}</div>`);
        }
      } else {
        pages.push(`<div class="page" data-section="signatures">${watermarkHtml}${kopTop}${sigContent}${kopBottom}</div>`);
      }
    }
  }

  // Calculate page numbers for TOC
  const showToc = doc.includeToc !== false;
  const showImageList =
    doc.includeImageList !== false && tocImageEntries.length > 0;
  const showTableList =
    doc.includeTableList !== false && tocTableEntries.length > 0;
  const tocPagesCount =
    (showToc ? 1 : 0) + (showImageList ? 1 : 0) + (showTableList ? 1 : 0);
  const contentStartPage = (doc.includeCover ? 1 : 0) + tocPagesCount + 1;

  // Build TOC with dot leaders
  const insertIdx = doc.includeCover ? 1 : 0;
  let insertCount = 0;

  if (showToc) {
    const tocItemsHtml =
      tocEntries.length > 0
        ? tocEntries
            .map((entry, i) => {
              const pageNum = contentStartPage + i;
              return `
        <div class="toc-item">
          <span class="toc-number">${i + 1}.</span>
          <span class="toc-title">${escapeHtml(entry.title)}</span>
          <span class="toc-dots"></span>
          <span class="toc-page">${pageNum}</span>
        </div>
      `;
            })
            .join("")
        : '<p class="toc-empty">Belum ada konten.</p>';

    const tocPage = `
      <div class="page" data-section="toc">
        ${watermarkHtml}
        ${kopTop}
        <h2 class="Daftar">Daftar Isi</h2>
        <div class="toc-container">${tocItemsHtml}</div>
        ${kopBottom}
      </div>
    `;
    pages.splice(insertIdx + insertCount, 0, tocPage);
    insertCount++;
  }

  if (showImageList) {
    const imageListPage = `
      <div class="page" data-section="toc">
        ${watermarkHtml}
        ${kopTop}
        <h2 class="Daftar">Daftar Gambar</h2>
        <div class="toc-container">
          ${tocImageEntries
            .map(
              (caption, i) => `
            <div class="toc-item">
              <span class="toc-number">Gambar ${i + 1}.</span>
              <span class="toc-title">${escapeHtml(caption)}</span>
              <span class="toc-dots"></span>
              <span class="toc-page">${contentStartPage + i}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        ${kopBottom}
      </div>
    `;
    pages.splice(insertIdx + insertCount, 0, imageListPage);
    insertCount++;
  }

  if (showTableList) {
    const tableListPage = `
      <div class="page" data-section="toc">
        ${watermarkHtml}
        ${kopTop}
        <h2 class="Daftar">Daftar Tabel</h2>
        <div class="toc-container">
          ${tocTableEntries
            .map(
              (title, i) => `
            <div class="toc-item">
              <span class="toc-number">Tabel ${i + 1}.</span>
              <span class="toc-title">${escapeHtml(title)}</span>
              <span class="toc-dots"></span>
              <span class="toc-page">${contentStartPage + i}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        ${kopBottom}
      </div>
    `;
    pages.splice(insertIdx + insertCount, 0, tableListPage);
    insertCount++;
  }

  const footerText = doc.footerText || "";

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>
  @page { size: ${pageSize}; margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; }
  @page cover { size: ${pageSize}; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${theme.fontFamily};
    font-size: ${theme.fontSize}pt;
    color: ${theme.bodyColor};
    line-height: ${contentLineSpacing};
    -webkit-hyphens: auto;
    hyphens: auto;
  }
  p { orphans: 3; widows: 3; }

  body { counter-reset: page-num; }

  .page {
    page-break-after: always;
    min-height: 100vh;
    padding: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm;
    position: relative;
    overflow: hidden;
    counter-increment: page-num;
  }
  @media print {
    .page { padding: 0; min-height: auto; overflow: visible; }
    .page:last-child { page-break-after: auto; }
  }
  .page:last-child { page-break-after: auto; }

  /* Footer area */
  .page-footer {
    position: absolute; bottom: 8mm; left: ${m.left}mm; right: ${m.right}mm;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 8pt; color: #888; z-index: 2;
  }
  .page-footer-text { font-size: 8pt; color: #888; }
  .page-footer-number { font-size: 9pt; color: #666; }
  .cover-page .page-footer { display: none; }
  .cover-page { counter-increment: none; }

  /* Watermark */
  .watermark {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 80pt; font-weight: bold; color: #000; pointer-events: none; z-index: 0;
    white-space: nowrap; text-transform: uppercase; letter-spacing: 10px;
  }

  /* Cover with absolute positioning */
  .cover-page {
    position: relative;
    padding: 0 !important;
    width: 100%;
    height: 100vh;
    page: cover;
  }
  @media screen {
    .cover-page { min-height: 100vh; }
  }
  @media print {
    .cover-page { height: 100vh; min-height: unset; }
  }
  .cover-element {
    position: absolute;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 1;
    box-sizing: border-box;
  }
  .cover-logos { display: flex; justify-content: center; align-items: center; width: 100%; }
  .cover-logo { max-width: 100%; object-fit: contain; flex: 1; }
  /* Cover table for key:value identity blocks */
  .cover-table { border-collapse: collapse; width: 100%; }
  .cover-table td { border: none; padding: 2pt 4pt; vertical-align: top; }
  .cover-table-key { white-space: nowrap; text-align: left; }
  .cover-table-sep { padding: 2pt 6pt; white-space: nowrap; }
  .cover-table-val { text-align: left; }

  /* Fields table (key:value for official letters) */
  .fields-table {
    border-collapse: collapse;
    margin-bottom: 12pt;
    position: relative;
    z-index: 1;
    font-size: ${theme.fontSize}pt;
  }
  .fields-table td {
    border: none;
    padding: 2pt 4pt;
    vertical-align: top;
  }
  .field-key {
    white-space: nowrap;
    padding-right: 8pt;
    min-width: 120pt;
  }
  .field-sep {
    white-space: nowrap;
    padding: 2pt 4pt;
  }
  .field-val {
    padding-left: 4pt;
  }

  /* KOP */
  .kop-header { display: flex; align-items: center; gap: 16px; position: relative; z-index: 1; padding-bottom: 1px; }
  .kop-logo { max-height: 100px; object-fit: contain; }
  .kop-text { font-size: 10pt; color: ${theme.bodyColor}; line-height: 1.5; }
  .kop-divider { border: none; border-top: 3px solid ${theme.dividerColor}; margin-bottom: 20px; }

  /* Section */
  .section-title {
    font-size: 14pt; font-weight: bold; color: ${theme.titleColor};
    margin-bottom: 16px; padding-bottom: 6px; position: relative; z-index: 1;
    font-family: ${theme.headingFont};
    break-after: avoid;
  }
  .Daftar {
    font-size: 16pt; font-weight: bold; color: ${theme.titleColor};
    text-align: center;
    margin-bottom: 16px; padding-bottom: 6px; position: relative; z-index: 1;
    font-family: ${theme.headingFont};
    break-after: avoid;
  }

  /* TOC with dot leaders */
  .toc-container { position: relative; z-index: 1; }
  .toc-item {
    display: flex;
    align-items: baseline;
    margin-bottom: 8px;
    font-size: ${theme.fontSize}pt;
  }
  .toc-number { white-space: nowrap; margin-right: 6px; font-weight: 500; min-width: 24px; }
  .toc-title { white-space: nowrap; }
  .toc-dots {
    flex: 1;
    border-bottom: 1px dotted #999;
    margin: 0 8px;
    min-width: 20px;
    position: relative;
    top: -3px;
  }
  .toc-page {
    white-space: nowrap;
    font-weight: 600;
  }
  .toc-empty { color: #999; font-style: italic; font-size: 10pt; }

  /* Text content - first-line indent only */
  .text-content {
    font-size: ${theme.fontSize}pt; line-height: ${contentLineSpacing}; text-align: justify;
    position: relative; z-index: 1;
  }
  .text-content p { margin-bottom: 8pt; }
  .text-content h1 { font-size: 18pt; font-weight: bold; margin: 16pt 0 8pt; font-family: ${theme.headingFont}; color: ${theme.titleColor}; }
  .text-content h2 { font-size: 15pt; font-weight: bold; margin: 14pt 0 6pt; font-family: ${theme.headingFont}; color: ${theme.titleColor}; }
  .text-content h3 { font-size: 13pt; font-weight: bold; margin: 12pt 0 6pt; font-family: ${theme.headingFont}; color: ${theme.titleColor}; }
  .text-content ul, .text-content ol { padding-left: 24pt; margin-bottom: 8pt; }
  .text-content li { margin-bottom: 4pt; }
  .text-content blockquote { border-left: 3px solid ${theme.dividerColor}; padding-left: 12pt; margin: 8pt 0; color: #555; font-style: italic; }
  .text-content pre { background: #f5f5f5; padding: 8pt; border-radius: 4px; font-size: 9pt; overflow-x: auto; margin: 8pt 0; }
  .text-content code { background: #f0f0f0; padding: 1pt 3pt; border-radius: 2px; font-size: 9.5pt; }

  /* Attached images - uniform width */
  .attached-images {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
    position: relative; z-index: 1;
  }
  .attached-image-item { text-align: center; }
  .attached-image {
    width: 100%;
    height: auto;
    aspect-ratio: 4/3;
    object-fit: cover;
    border: 1px solid ${theme.dividerColor};
    border-radius: 4px;
  }

  /* Image Grids */
  .image-grid { display: grid; gap: 12px; position: relative; z-index: 1; break-inside: avoid; }
  .grid-1x1 { grid-template-columns: 1fr; }
  .grid-1x2 { grid-template-columns: 1fr 1fr; }
  .grid-2x2 { grid-template-columns: 1fr 1fr; }
  .grid-2x3 { grid-template-columns: 1fr 1fr; }

  .image-item { break-inside: avoid; text-align: center; }
  .grid-image { width: 100%; height: auto; object-fit: contain; border: 1px solid ${theme.dividerColor}; border-radius: 4px; aspect-ratio: 4/3; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.10); }
  .grid-1x1 .grid-image { aspect-ratio: 16/9; }
  .image-caption { font-family: ${theme.fontFamily}; font-size: 11pt; font-weight: bold; color: ${theme.bodyColor}; margin-top: 1px; }

  /* Tables */
  .data-table {
    width: 100%; border-collapse: collapse; font-size: 10pt;
    position: relative; z-index: 1;
    break-inside: auto;
  }
  .data-table th, .data-table td {
    border: 1px solid ${theme.tableBorderColor};
    padding: 8px 10px; text-align: left;
    vertical-align: top;
  }
  .data-table th {
    background-color: ${theme.tableHeaderBg};
    color: ${theme.tableHeaderColor};
    font-weight: bold;
    font-size: 9.5pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .data-table tr { break-inside: avoid; }
  .data-table .alt-row { background-color: ${theme.altRowColor}; }
  .data-table thead { display: table-header-group; }
  .data-table tbody tr:hover { background-color: ${theme.altRowColor}; }

  /* Calculation footer */
  .calc-row { background-color: ${theme.tableHeaderBg}; border-top: 2px solid ${theme.tableBorderColor}; }
  .calc-cell { font-size: 9pt; padding: 6px 10px; }

  /* Signatures */
  .signatures-container {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 24px; margin-top: 60px; break-inside: avoid;
    position: relative; z-index: 1;
  }
  .signee-block { text-align: center; break-inside: avoid; }
  .signee-images { position: relative; margin-bottom: 0px; min-height: 80px; }
  .stamp-image { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: 0.7; }
  .signature-image { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
  .signee-line { border-top: 1px solid ${theme.bodyColor}; margin-bottom: 0px; }
  .signee-name { font-weight: bold; font-size: 11pt; }
  .signee-role { font-size: 9pt; color: ${theme.subtitleColor}; }

  .qr-verification {
    position: absolute; bottom: 8mm; left: 8mm;
    text-align: center; z-index: 10;
    padding: 4px; border: 1px solid #ddd; border-radius: 4px;
    background: white; display: inline-block;
  }
  .qr-image { width: 50px; height: 50px; }
  .qr-label { font-size: 6pt; color: #888; margin-top: 1px; }
  .qr-code-text { font-size: 6pt; font-weight: bold; color: #333; font-family: monospace; }

</style>
</head>
<body>${pages.join("")}
<script>
  document.addEventListener('DOMContentLoaded', function() {
    var pages = document.querySelectorAll('.page');
    var pageNum = 0;
    var totalPages = 0;
    pages.forEach(function(p) { if (!p.classList.contains('cover-page')) totalPages++; });
    pages.forEach(function(p) {
      if (p.classList.contains('cover-page')) return;
      pageNum++;
      var el = document.createElement('div');
      el.className = 'page-footer';
      el.innerHTML = '<span class="page-footer-text">${escapeHtml(footerText)}</span>' +
        ${doc.footerEnabled ? `'<span class="page-footer-number">Halaman ' + pageNum + ' dari ' + totalPages + '</span>'` : "''"};
      p.appendChild(el);
    });
  });
</script>
</body>
</html>`;
}
