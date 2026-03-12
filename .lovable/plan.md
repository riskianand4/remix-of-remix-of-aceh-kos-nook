

# Plan: Fix ShareLink, Review Auth, Progress Dialogs, Template Save

## 4 Issues to Fix

### 1. ShareLink ObjectId Cast Error
**Root cause:** `ShareLink.documentId` is `mongoose.Schema.Types.ObjectId` but Document uses `_id: String` (UUIDs). UUIDs can't cast to ObjectId.

**Fix:** `pdf-backend/src/models/ShareLink.js` — Change `documentId` from `ObjectId` to `String`:
```js
documentId: { type: String, ref: 'Document', required: true, index: true }
```
Also fix `Comment.js` model's `documentId` the same way.

### 2. Review Returns 401 (Auth Bypass)
**Root cause:** Your running backend has an auth middleware (not in this repo) that intercepts ALL `/api` routes including `/api/review/:code/access`. The 401 with 0.3ms response confirms middleware rejection.

**Fix:** `pdf-backend/src/app.js` — Mount review/public routes BEFORE the auth middleware:
```js
// Public routes (no auth required)
app.use('/api', shareRoutes);  // review routes are public

// Auth middleware (if exists)
// app.use('/api', authMiddleware);

// Protected routes
app.use('/api', routes);
```
Since the auth middleware isn't in this repo, I'll restructure `app.js` to mount share routes (which contain `/review/*`) directly on the app BEFORE the main `/api` routes, so any auth middleware applied later won't affect them.

### 3. Progress Bar Dialogs
Create a reusable `ProgressDialog` component that shows during long operations (save, upload, export, import, image add, PDF download). Features:
- Modal with progress bar + percentage
- No close button / non-dismissible until complete
- Shows "Berhasil!" on completion, then auto-closes after 1.5s
- Used via a React context/hook: `useProgress()`

**Files:**
- `src/components/ProgressDialog.tsx` — The dialog component
- `src/hooks/useProgress.ts` — Hook returning `{ start, update, complete, fail }` functions
- `src/pages/DocumentEditor.tsx` — Wrap save operations
- `src/components/editor/StepPreview.tsx` — Wrap PDF download + export + template save
- `src/pages/Dashboard.tsx` — Wrap import/export/delete operations

### 4. Save as Template Button Not Working
**Root cause:** `saveCustomTemplate` in `storage.ts` calls `createTemplate` API. If backend returns error, it falls back to localStorage — but the localStorage fallback always returns `true`, so it should work. The issue is likely that `handleSaveTemplate` in `StepPreview.tsx` runs but the toast doesn't show because the dialog closes first, OR the function silently errors.

**Fix:** Add `console.log` debugging and ensure the async handler properly awaits. Also wrap with progress dialog for feedback.

## File Changes

| File | Change |
|------|--------|
| `pdf-backend/src/models/ShareLink.js` | `documentId` → `String` type |
| `pdf-backend/src/models/Comment.js` | `documentId` → `String` type |
| `pdf-backend/src/app.js` | Mount share routes before other middleware for public access |
| `src/components/ProgressDialog.tsx` | New reusable progress dialog component |
| `src/hooks/useProgress.ts` | New hook for progress management |
| `src/pages/DocumentEditor.tsx` | Add progress dialog for save operations |
| `src/components/editor/StepPreview.tsx` | Add progress dialog for PDF download, export, template save |
| `src/pages/Dashboard.tsx` | Add progress dialog for import/export/delete |

