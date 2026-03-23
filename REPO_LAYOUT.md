# FieldOps — Repo Layout & Implementation Summary

## File structure (source tree)

```
field-ops/
├── .env.local              # Firebase, Microsoft OAuth, NEXTAUTH_URL, etc. (not committed)
├── .gitignore
├── cors.json               # CORS config (e.g. Firebase Hosting): GET, origin *
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts          # Headers: /sw.js Cache-Control + Service-Worker-Allowed
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── REPO_LAYOUT.md
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   ├── manifest.json       # PWA manifest (standalone, icons, start_url /jobs)
│   ├── sw.js               # Service worker: app shell cache, network-first fetch
│   ├── icons/              # favicon, apple-touch, PWA icons (referenced in layout/manifest)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
└── src/
    ├── app/
    │   ├── globals.css            # Tailwind + CSS variables (dark theme base)
    │   ├── theme-light.css        # Light theme overrides (data-theme="light")
    │   ├── layout.tsx             # Root: AuthProvider, ThemeProvider, SW, metadata, viewport
    │   ├── page.tsx               # Home → redirects to /jobs
    │   │
    │   ├── jobs/page.tsx          # Main jobs dashboard (protected)
    │   ├── calendar/page.tsx      # Week & month views, bulk Outlook “Sync all” (protected)
    │   ├── contacts/page.tsx      # Companies / contacts (protected)
    │   ├── documents/page.tsx     # Document library (protected)
    │   ├── notifications/page.tsx # Notification feed (protected)
    │   ├── integrations/page.tsx  # Outlook connect/disconnect, sync settings, history (protected)
    │   ├── login/page.tsx         # Email/password + Google auth
    │   │
    │   └── api/
    │       ├── auth/
    │       │   ├── outlook/route.ts           # GET ?uid= → Microsoft OAuth (else → /login)
    │       │   └── callback/outlook/route.ts  # GET OAuth callback, exchange code + store tokens
    │       └── outlook/
    │           ├── disconnect/route.ts        # POST { uid } → disconnect Outlook
    │           ├── sync/route.ts              # GET ?uid= status; POST job sync; PUT token test
    │           └── sync-all/route.ts         # POST { uid } → bulk sync active jobs
    │
    ├── components/
    │   ├── ContactDetailPanel.tsx
    │   ├── DetailPanel.tsx
    │   ├── JobsTable.tsx
    │   ├── NewContactPanel.tsx
    │   ├── NewJobPanel.tsx
    │   ├── ProfileSheet.tsx         # Mobile bottom sheet: user, Outlook status, Integrations, Sign out
    │   ├── ProtectedRoute.tsx
    │   ├── ServiceWorkerRegistration.tsx  # Registers public/sw.js, hourly update check
    │   ├── Sidebar.tsx
    │   ├── StatsRow.tsx
    │   └── Topbar.tsx               # Search (Jobs), actions; opens ProfileSheet on mobile
    │
    ├── contexts/
    │   ├── AuthContext.tsx          # Firebase Auth: useAuth, login/signup/Google, logout
    │   └── ThemeProvider.tsx        # Light/dark: useTheme, localStorage fieldops-theme, data-theme
    │
    ├── hooks/
    │   ├── useAutoProgress.ts       # scheduled → in-progress when on-site time passes
    │   └── useFirestore.ts         # Generic Firestore real-time subscription + fallback
    │
    ├── lib/
    │   ├── auth-helpers.ts         # getUid(), getUidSafe() from Firebase auth.currentUser
    │   ├── contacts.ts             # users/{uid}/companies CRUD + snapshot
    │   ├── documents.ts            # users/{uid}/documents + Storage under users/{uid}/documents/
    │   ├── firebase.ts             # App, Firestore, Storage, Auth
    │   ├── job-actions.ts          # create/update/complete + company ensure + Outlook + notifications
    │   ├── jobs.ts                 # users/{uid}/jobs CRUD + snapshot + deleteJob
    │   ├── microsoft-graph.ts      # OAuth (state=fieldops-{uid}), tokens in users/{uid}/settings
    │   ├── notifications.ts        # users/{uid}/notifications CRUD + helpers
    │   └── outlook-sync.ts        # Client calls API with uid in body/query
    │
    └── types/
        ├── contact.ts
        └── job.ts
```

*(Build: `.next/`. Dependencies: `node_modules/`. Both omitted.)*

---

## What's implemented

### Stack

- **Next.js 16.1.7** (App Router), **React 19.2.3**, **TypeScript**
- **Tailwind CSS v4** + **@tailwindcss/postcss**
- **Firebase** — Firestore, Storage, Auth (email/password + Google)
- **Microsoft Graph** — OAuth 2.0, Outlook calendar read/write
- **PWA** — Web App Manifest + service worker (`public/sw.js`, `public/manifest.json`)
- **Fonts** — DM Sans, JetBrains Mono (`next/font`)
- **Icons** — `@heroicons/react`, **clsx**

### Themes

- **`globals.css`** — Dark palette via CSS variables (void, surfaces, accent, semantic colors, animations).
- **`theme-light.css`** — Light theme when `data-theme="light"` on `<html>`.
- **`ThemeProvider`** — `useTheme()`, `toggleTheme` / `setTheme`, persists `fieldops-theme` in `localStorage`, respects `prefers-color-scheme` when no stored preference.
- Root layout defaults to **`data-theme="light"`**; ThemeProvider syncs document theme on mount.

### PWA & offline-ish behavior

- **`metadata.manifest`** → `/manifest.json`; **appleWebApp**, **icons** under `/icons/`.
- **`viewport`** — `themeColor`, `viewportFit: cover`, etc.
- **`ServiceWorkerRegistration`** — registers `/sw.js`; hourly `reg.update()`.
- **`sw.js`** — Install: cache app shell routes (`/`, `/jobs`, `/calendar`, …). Fetch: **network first**, cache successful GETs; skip `/api/`, Firebase/Google URLs; offline: cache fallback, navigate fallback to `/jobs`.
- **`next.config.ts`** — `Cache-Control` and **`Service-Worker-Allowed: /`** for `/sw.js`.

### App routes

| Route | Purpose |
|-------|---------|
| `/` | Redirect → `/jobs` |
| `/login` | Sign in / sign up (email + Google); then → `/jobs` |
| `/jobs` | Protected: stats, **search** (job # / company), table, panels, `useAutoProgress` |
| `/calendar` | Protected: week/month views, job blocks, **Sync all** → `POST /api/outlook/sync-all` with `{ uid }` |
| `/contacts` | Protected: companies table, filters, detail/create panels |
| `/documents` | Protected: grid/table, upload, preview |
| `/notifications` | Protected: feed, filters, read/unread |
| `/integrations` | Protected: Outlook connect/disconnect, **per-user sync_settings** in Firestore, sync history from notifications, “Sync Now” (UI placeholder alert) |

All main app routes except `/` and `/login` use **`ProtectedRoute`** → redirect to `/login` if signed out.

### API routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/outlook` | GET | **`?uid=`** required; else redirect `/login`. Redirects to Microsoft authorize URL (`getAuthUrl(uid)`). |
| `/api/auth/callback/outlook` | GET | OAuth callback; parses `state` for Firebase uid; `exchangeCodeForTokens(code, uid)`; redirect `/integrations?…` |
| `/api/outlook/sync` | GET | **`?uid=`** — `isOutlookConnected(uid)` |
| `/api/outlook/sync` | POST | Body `{ action, job, uid }` — create/update/delete Outlook event; maps stored in **root** `outlook_event_mappings/{jobId}` |
| `/api/outlook/sync` | PUT | **`?uid=`** — debug: `getValidAccessToken(uid)`, probe Graph `/me` |
| `/api/outlook/sync-all` | POST | Body **`{ uid }`** — non-completed jobs under `users/{uid}/jobs`; mappings in **`users/{uid}/outlook_event_mappings/{jobId}`** |
| `/api/outlook/disconnect` | POST | Body `{ uid }` — `disconnectOutlook(uid)` |

**Note:** Single-job sync (`sync/route.ts`) and bulk sync (`sync-all/route.ts`) use **different Firestore paths** for job↔event mappings (global vs per-user). Align `sync/route.ts` with `sync-all` if you want one source of truth.

### Environment variables (typical)

- **Firebase** — `NEXT_PUBLIC_FIREBASE_*` (see `lib/firebase.ts`).
- **Microsoft** — `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`.
- **App URL** — `NEXTAUTH_URL` (e.g. `http://localhost:3000` or production origin); used as OAuth **redirect_uri** base in `microsoft-graph.ts`.

### Data model (TypeScript)

- **`Job` / `NewJob` / `JobStatus` / `Attachment`** — `src/types/job.ts`.
- **`ContactPerson` / `CompanyRecord` / `NewCompanyRecord`** — `src/types/contact.ts`.
- **`DocRecord` / `NewDocRecord`** — `lib/documents.ts` (size, `sizeBytes`, `mimeType`, Storage paths, `uploadedBy`, etc.).
- **`NotifRecord`** — `lib/notifications.ts` (`unread`, `titleBold`, `title`, `desc`, …).

### Per-user Firestore layout

All primary app data is scoped by **Firebase Auth uid**:

| Path | Purpose |
|------|---------|
| `users/{uid}/jobs` | Jobs |
| `users/{uid}/companies` | Companies / contacts |
| `users/{uid}/documents` | Document metadata |
| `users/{uid}/notifications` | Notifications |
| `users/{uid}/settings/outlook_tokens` | Microsoft OAuth tokens (via `microsoft-graph.ts`) |
| `users/{uid}/settings/sync_settings` | Integrations toggles (`syncOnCreate`, `syncUpdates`, …) |
| `users/{uid}/outlook_event_mappings/{jobId}` | Used by **sync-all** only |

**`auth-helpers.ts`:** `getUid()` throws if signed out; `getUidSafe()` returns `null` (used before subscribing).

### Lib highlights

- **`job-actions.ts`** — `createJobWithSync`, `updateJobWithSync`, `markJobCompleteWithSync`; `ensureCompanyFromJob` queries **`users/{uid}/companies`**; Outlook + notification side effects.
- **`microsoft-graph.ts`** — `getAuthUrl(firebaseUid)`, `exchangeCodeForTokens(code, firebaseUid)`, `getValidAccessToken(uid)`, `isOutlookConnected(uid)`, `disconnectOutlook(uid)`, `createCalendarEvent(uid, event)`, `updateCalendarEvent(uid, eventId, event)`, `deleteCalendarEvent(uid, eventId)`, `jobToCalendarEvent(job)`.
- **`outlook-sync.ts`** — Adds **`uid`** to POST/GET for sync, disconnect, and `connectOutlook()` → `/api/auth/outlook?uid=`.

### Hooks

- **`useFirestore`** — Real-time listener + optional seed fallback.
- **`useAutoProgress`** — Every 5 minutes + mount: `scheduled` → `in-progress` via `updateJobWithSync`.

### Auth

- **`AuthContext`** — `useAuth`: `user`, `loading`, email login/signup, Google popup, `logout`.
- **`ProtectedRoute`** — Loading UI; redirect `/login` when no user.
- **`/login`** — Branded UI, validation, Firebase error mapping.

### UI components (summary)

| Component | Role |
|-----------|------|
| **Sidebar** | Nav, badges, Outlook line, user block |
| **Topbar** | Title, search (Jobs), export, new job; **ProfileSheet** on small screens |
| **ProfileSheet** | Bottom sheet: Outlook status, Integrations link, sign out (`useAuth`) |
| **StatsRow / JobsTable / panels** | Dashboard patterns as before |
| **ServiceWorkerRegistration** | Client-only SW register |

### Config

- **Paths** — `@/*` → `./src/*`.
- **Next** — Headers for service worker (see above).
- **TypeScript** — Strict, bundler resolution.

### Not implemented / placeholders

- **Export** — Button only, no export logic.
- **Integrations “Sync Now”** — Alert placeholder, not `sync-all`.
- **Middleware** — No `middleware.ts`.
- **`.env.example`** — Not in repo.

---

## Quick reference

| Path | Purpose |
|------|---------|
| `src/app/layout.tsx` | Auth + theme + SW + metadata + viewport |
| `src/app/globals.css` / `theme-light.css` | Theming |
| `src/contexts/ThemeProvider.tsx` | Light/dark |
| `src/components/ServiceWorkerRegistration.tsx` | PWA SW |
| `public/sw.js` / `manifest.json` | PWA assets |
| `next.config.ts` | SW headers |
| `src/lib/auth-helpers.ts` | Current user uid |
| `src/app/api/outlook/sync/route.ts` | Per-job sync + global mappings |
| `src/app/api/outlook/sync-all/route.ts` | Bulk sync + per-user mappings |
| `src/lib/microsoft-graph.ts` | OAuth + Graph + per-user token doc |
| `src/lib/outlook-sync.ts` | Browser → API with uid |
