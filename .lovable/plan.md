

# Fix Cover Issues, Add TOC Toggle, Tabular Content, Template Fixes

## Issues to Fix

### 1. Cover Image Not Showing
`CoverDesigner.tsx` uses `compressImage()` which returns a data URL, but the `<img>` tag renders blank. The issue is the image element width calculation uses `el.width * 4.2` which produces tiny pixel values. Need to use percentage-based width relative to the container instead.

### 2. Logo & Image Shrinking When Dragged Right
The `transform: translate(-50%, -50%)` centers elements, but elements near edges overflow the container (which has `overflow: hidden`). Fix: clamp positions accounting for element width, and remove `overflow: hidden` or use `overflow: visible` with `clip-path` only on the outer boundary.

### 3. Logo Width Control
Logos currently only have `coverLogoSize` (height). Add a `logoWidth` percentage control to `CoverLayout` so logos behave like text/image elements with width control, preventing shrinking at edges.

### 4. TOC/Daftar Gambar/Daftar Tabel Toggles
Add three boolean fields to `DocumentData`:
- `includeToc` (default: true)
- `includeImageList` (default: true)  
- `includeTableList` (default: true)

Add toggles in `StepCover.tsx` (under page settings). Update `pdf-builder.ts` to conditionally render these sections.

### 5. Tabular Data in Content (Nama : Value format)
Add a new content block type `'fields'` for key-value data like official letters. Interface:
```
FieldsBlock { type: 'fields'; id; title; fields: { key: string; value: string }[] }
```
Update `ContentBlock = TextBlock | FieldsBlock`. Add UI in `StepContent.tsx` with "Tambah Data Fields" button. Render in `pdf-builder.ts` as aligned table without borders.

### 6. Template Save Bug
The save in `StepPreview.tsx` looks correct. The Dashboard save may fail because `saveTemplateTarget` is set but `templateName` starts empty. Need to verify the flow works — likely the issue is that clicking "Simpan Template" from the dropdown sets `saveTemplateTarget` but the dialog doesn't show because state isn't properly initialized. Actually looking at code, the Dashboard dialog uses `!!saveTemplateTarget` as open condition and has proper input — seems fine. Let me check if `safeSetItem` silently fails due to quota. Will add error feedback.

### 7. Remove "Laporan Keuangan" Template
Remove the `financial-report` entry from `TEMPLATES` array in `src/lib/templates.ts`.

### 8. Cover Precision — Use Percentage Width for All Elements
In `CoverDesigner.tsx`, change element rendering from pixel-based width (`el.width * 4.2px`) to percentage-based width (`${el.width}%` of container). This matches what `pdf-builder.ts` does, ensuring WYSIWYG precision.

## Files Changed

| File | Changes |
|------|---------|
| `src/types/document.ts` | Add `FieldsBlock`, `includeToc`, `includeImageList`, `includeTableList` fields |
| `src/components/editor/CoverDesigner.tsx` | Fix image display (use % width), fix logo width, remove overflow:hidden, clamp positions |
| `src/components/editor/StepCover.tsx` | Add TOC/image list/table list toggles |
| `src/components/editor/StepContent.tsx` | Add "Tambah Data Fields" block type with key-value UI |
| `src/lib/pdf-builder.ts` | Conditional TOC/lists, render FieldsBlock as aligned key:value, fix cover image rendering |
| `src/lib/templates.ts` | Remove `financial-report` template, set `includeCover: false` properly for surat resmi |
| `src/pages/DocumentEditor.tsx` | Add defaults for new fields |
| `src/lib/storage.ts` | Add error toast feedback on save failure |

## Detail per Section

### CoverDesigner Fix
- All draggable elements use `style={{ width: \`${el.width}%\` }}` of container (not pixel calc)
- Container: `overflow: visible` with a wrapper that clips
- Logo group gets a width slider in properties panel
- Image `<img>` uses `width: 100%` inside its container div which uses percentage width

### FieldsBlock for Official Letter Data
```
Nama             : Rizki Ananda
NIM              : 2022573010115
```
Rendered as:
```html
<table class="fields-table">
  <tr><td class="field-key">Nama</td><td>:</td><td>Rizki Ananda</td></tr>
</table>
```
CSS: no borders, fixed key column width, monospace-like alignment.

### TOC Toggles
Three switches in StepCover.tsx under "Pengaturan Halaman" card. In `pdf-builder.ts`, wrap TOC page generation with `if (doc.includeToc !== false)`, image list with `if (doc.includeImageList !== false)`, and add a table list page with `if (doc.includeTableList !== false)`.

