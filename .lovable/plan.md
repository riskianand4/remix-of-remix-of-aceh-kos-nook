

# Plan: 4 Fixes — Rename, Review Multi-page, KOP Dual Logo

## Issues to Fix

### 1. Rename Document from Dashboard
Add a "Rename" option in the dropdown menu of `DocumentCard` and `DocumentListItem`. Clicking opens an inline edit or small dialog to rename, then calls `PUT /api/documents/:id` with the new title.

**Files:** `src/pages/Dashboard.tsx`
- Add `onRename` prop to `DocumentCard` and `DocumentListItem`
- Add a rename dialog state in `Dashboard` component
- Add "Rename" `DropdownMenuItem` with `Pencil` icon
- On confirm, call `updateDocument(id, { title })` from `src/lib/api.ts` then reload data

### 2. Inline Rename in Editor Header
Currently line 304 shows `doc.title || 'Untitled'` as a static `<span>`. Replace with an editable component: double-click to enter edit mode (input field), blur/Enter to save.

**Files:** `src/pages/DocumentEditor.tsx`
- Replace the static `<span>` at line 304 with an inline editable component
- Add state: `editingTitle` boolean, `titleDraft` string
- On double-click: enter edit mode
- On blur/Enter: call `updateDoc({ title: titleDraft })` which triggers auto-save

### 3. Review Page Shows Only 1 Page
The `ReviewPage.tsx` `DocumentPreview` component looks correct — it queries `.page` elements. The problem is likely that the review page loads the document from `accessReview()` which returns a share snapshot, not the full saved document. The code at lines 39-44 tries `localStorage` fallback which won't work anymore since we migrated to backend.

**Fix:** After `accessReview()` returns the document, use the document ID to fetch the latest version from the backend API via `fetchDocument(result.document.id)`.

**Files:** `src/pages/ReviewPage.tsx`
- Import `fetchDocument` from `@/lib/api`
- In `handleAccess`, after getting `result.document`, try `fetchDocument(result.document.id)` to get the latest full document
- Remove the localStorage fallback code

### 4. KOP Dual Logo (Left + Right)
Add a second logo field `kopLogoRightDataUrl` to the document type and KOP UI. In the KOP header, render left logo on left side, right logo on right side, text in the middle — regardless of `kopLogoPosition` setting.

**Files to modify:**
- `src/types/document.ts` — Add `kopLogoRightDataUrl?: string` to `DocumentData`
- `src/components/editor/StepLetterhead.tsx` — Add upload UI for right logo
- `src/lib/pdf-builder.ts` — Update `kopBlock` HTML in both `generateDokumentasiHtml` and `generateSuratResmiHtml` to render left + right logos
- `pdf-backend/src/models/Document.js` — Add `kopLogoRightDataUrl` field
- `createNewDocument()` in `document.ts` — Add default `kopLogoRightDataUrl: undefined`

**KOP Layout:**
```text
[Left Logo] | KOP Text (center/left aligned) | [Right Logo]
──────────────────────────────────────────────────────────
```
Both logos always sit at left/right edges. Text fills the middle. This applies whether `kopLogoPosition` is "left" or "center".

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add rename dialog + dropdown item |
| `src/pages/DocumentEditor.tsx` | Inline editable title on double-click |
| `src/pages/ReviewPage.tsx` | Fetch latest doc from API, fix multi-page |
| `src/types/document.ts` | Add `kopLogoRightDataUrl` field |
| `src/components/editor/StepLetterhead.tsx` | Add right logo upload UI + preview |
| `src/lib/pdf-builder.ts` | Dual logo in KOP header HTML (both doc types) |
| `pdf-backend/src/models/Document.js` | Add `kopLogoRightDataUrl` field |

