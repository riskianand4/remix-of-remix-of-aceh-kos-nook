

# Plan: Fix 6 Issues — Toast, Cover Theme, Signatures, PDF

## 1. Toast on 429 Rate Limit
**File:** `src/lib/api.ts`
- In `request()` function, detect 429 status and show toast "Terlalu banyak permintaan. Silakan coba beberapa saat lagi." before throwing
- Import toast from `@/hooks/use-toast`

## 2. Cover Preview Dark Mode Fix
**File:** `src/components/editor/CoverDesigner.tsx`
- The cover canvas already has `bg-white` but text elements use `className="text-foreground"` (line 301) which turns white in dark mode
- Fix: replace `text-foreground` with explicit `text-black` or use inline `style={{ color: el.color || '#000000' }}`
- Same fix for table elements text color

## 3. Custom Color for Cover Text Elements
**Files:** `src/types/document.ts`, `src/components/editor/CoverDesigner.tsx`, `src/lib/pdf-builder.ts`, `pdf-backend/src/models/Document.js`
- Add `color?: string` to `CoverTextElement` interface (default `#000000`)
- Add `color?: string` to `CoverTableElement` interface
- In CoverDesigner properties panel for text: add color input
- In pdf-builder: use `el.color || '#000000'` instead of `theme.bodyColor` for cover text/table elements

## 4. Signatures Missing titleAbove & NIP in Dokumentasi PDF
**File:** `src/lib/pdf-builder.ts` (lines 696-712)
- The `generateDokumentasiHtml` signee block is missing `titleAbove` and `nip` fields
- The `generateSuratResmiHtml` version (lines 200-222) correctly includes them
- Fix: add `titleAboveHtml` and `nip` rendering to the dokumentasi signee block, matching the surat-resmi version

## 5. Signature Page Break Control
**Files:** `src/types/document.ts`, `src/components/editor/StepSignatures.tsx`, `src/lib/pdf-builder.ts`
- Add `signatureNewPage?: boolean` to `DocumentData` (default `true`)
- In StepSignatures: add a Switch "Tanda tangan di halaman baru"
- In pdf-builder dokumentasi: if `signatureNewPage === false`, append signatures to the last content/table page instead of creating a new `.page` div
- In pdf-builder surat-resmi: same logic — if false, keep signatures inline (already inline in single page)

## 6. PDF Download Differs from Preview
**File:** `src/lib/pdf-builder.ts`
- Root cause: Puppeteer uses `@page` margin AND `.page` has padding, causing double margins. Also `min-height: 100vh` creates issues when Puppeteer breaks pages.
- Fix the `@media print` section: when printing, `.page` should have `padding: 0` (already there) BUT the `@page` margins are applied. The issue is that `min-height: 100vh` forces each div to fill a page even if nearly empty.
- Remove `min-height: 100vh` from `.page` for print, use `page-break-after: always` alone
- Ensure content pages that overflow naturally break without inserting blank KOP-only pages
- Change `.page` to use `page-break-inside: avoid` only for small sections, allow large content to flow across print pages

**Also in `src/lib/pdf-builder.ts`:** The real fix is that Puppeteer already handles `@page` margins — so the HTML should NOT have padding on `.page` when going through Puppeteer. Add a `data-render="puppeteer"` attribute or pass a flag, but simpler: just ensure the `@media print` rules are correct since Puppeteer uses print rendering.

Updated approach for print CSS:
```css
@media print {
  .page {
    padding: 0;
    min-height: auto;
    page-break-after: always;
    overflow: visible;
  }
  .page:last-child { page-break-after: auto; }
}
```

## File Summary

| File | Changes |
|------|---------|
| `src/lib/api.ts` | Add 429 toast notification |
| `src/components/editor/CoverDesigner.tsx` | Fix dark mode text color, add color picker |
| `src/types/document.ts` | Add `color` to CoverTextElement/CoverTableElement, add `signatureNewPage` to DocumentData |
| `src/lib/pdf-builder.ts` | Fix cover text color, add titleAbove/nip to dokumentasi signatures, signature page break control, fix print CSS for PDF |
| `src/components/editor/StepSignatures.tsx` | Add signature page break toggle |
| `pdf-backend/src/models/Document.js` | Add color fields to cover schemas, add signatureNewPage |

