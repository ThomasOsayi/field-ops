# FieldOps — Repo Layout & Implementation Summary

## File structure (source tree)

```
field-ops/
├── .env.local              # Firebase / Microsoft / env (not committed)
├── .gitignore
├── cors.json               # CORS config (e.g. Firebase Hosting): GET, origin *
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── REPO_LAYOUT.md
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
└── src/
    ├── app/
    │   ├── globals.css            # Tailwind + CSS variables (dark theme)
    │   ├── layout.tsx             # Root layout, AuthProvider, fonts, metadata
    │   ├── page.tsx               # Home → redirects to /jobs
    │   │
    │   ├── jobs/
    │   │   └── page.tsx           # Main jobs dashboard (protected)
    │   ├── calendar/
    │   │   └── page.tsx           # Week & month calendar views (protected)
    │   ├── contacts/
    │   │   └── page.tsx           # Companies / contacts directory (protected)
    │   ├── documents/
    │   │   └── page.tsx           # Document library (grid + table) (protected)
    │   ├── notifications/
    │   │   └── page.tsx           # Notification feed (protected)
    │   ├── integrations/
    │   │   └── page.tsx           # Outlook integration settings (protected)
    │   ├── login/
    │   │   └── page.tsx           # Login / signup (email+password, Google)
    │   │
    │   └── api/
    │       ├── auth/
    │       │   ├── outlook/
    │       │   │   └── route.ts   # GET → redirect to Microsoft OAuth
    │       │   └── callback/
    │       │       └── outlook/
    │       │           └── route.ts # GET → OAuth callback, exchange code
    │       └── outlook/
    │           ├── disconnect/
    │           │   └── route.ts   # POST → disconnect Outlook
    │           ├── sync/
    │           │   └── route.ts   # GET → status; POST → sync job; PUT → token test
    │           └── sync-all/
    │               └── route.ts   # POST → bulk sync all active jobs to Outlook
    │
    ├── components/
    │   ├── ContactDetailPanel.tsx  # Slide-out company detail
    │   ├── DetailPanel.tsx         # Slide-out job detail + mark complete
    │   ├── JobsTable.tsx           # Filterable jobs table + row actions
    │   ├── NewContactPanel.tsx     # Slide-out create/edit company form
    │   ├── NewJobPanel.tsx         # Slide-out create-job form
    │   ├── ProtectedRoute.tsx     # Redirects unauthenticated users to /login
    │   ├── Sidebar.tsx             # App nav with active route highlighting
    │   ├── StatsRow.tsx            # Summary stat cards
    │   └── Topbar.tsx              # Title, search, New Job, Export
    │
    ├── contexts/
    │   └── AuthContext.tsx         # Firebase Auth: user, login/signup/Google, logout
    │
    ├── hooks/
    │   ├── useAutoProgress.ts      # Auto-move scheduled → in-progress when time passes
    │   └── useFirestore.ts        # Generic real-time Firestore subscription hook
    │
    ├── lib/
    │   ├── contacts.ts            # Firestore CRUD for companies
    │   ├── documents.ts           # Firebase Storage + Firestore doc metadata
    │   ├── firebase.ts            # Firebase app, Firestore, Storage, Auth init
    │   ├── job-actions.ts         # Job ops + company sync + Outlook + notifications
    │   ├── jobs.ts                # Firestore CRUD for jobs (+ real-time, deleteJob)
    │   ├── microsoft-graph.ts     # Microsoft Graph OAuth & calendar API
    │   ├── notifications.ts      # Firestore notifications + convenience creators
    │   └── outlook-sync.ts        # Client-side Outlook sync helpers
    │
    └── types/
        ├── contact.ts             # ContactPerson, CompanyRecord, NewCompanyRecord
        └── job.ts                 # Job, NewJob, JobStatus, Attachment
```

*(Build output: `.next/`. Dependencies: `node_modules/`. Both omitted from tree.)*

---

## What's implemented

### Stack

- **Next.js 16** (App Router, v16.1.7), **React 19** (v19.2.3), **TypeScript**
- **Tailwind CSS v4** + **PostCSS** (`@tailwindcss/postcss`)
- **Firebase**: Firestore (jobs, companies, documents, notifications, settings), Storage (document uploads), **Auth** (email/password + Google)
- **Microsoft Graph API**: OAuth 2.0, Outlook calendar sync
- **Fonts**: DM Sans, JetBrains Mono (next/font)
- **Icons**: Heroicons (`@heroicons/react`)
- **Utilities**: `clsx` for conditional classnames

### App flow & routes

| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/jobs` |
| `/login` | Login / signup: email+password, Google; redirects to `/jobs` when authenticated |
| `/jobs` | Main jobs dashboard (protected): sidebar, topbar, stats, search, table, panels |
| `/calendar` | Week and month calendar views (protected) with job blocks and navigation |
| `/contacts` | Companies/contacts directory (protected) with city filters and detail panels |
| `/documents` | Document library (protected) with grid/table views, upload, and preview panels |
| `/notifications` | Notification feed (protected) grouped by day with filters and read/unread |
| `/integrations` | Outlook Calendar integration (protected): connect, disconnect, sync, sync-all |

All app routes except `/` and `/login` are wrapped in **ProtectedRoute**; unauthenticated users are redirected to `/login`.

### API routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/outlook` | GET | Initiates Microsoft OAuth — redirects to Microsoft login |
| `/api/auth/callback/outlook` | GET | Handles OAuth callback — exchanges code for tokens, stores in Firestore |
| `/api/outlook/sync` | GET | Returns Outlook connection status (`connected`, `email`) |
| `/api/outlook/sync` | POST | Syncs a single job to Outlook calendar (create/update/delete events) |
| `/api/outlook/sync` | PUT | Test endpoint: validates token via Graph `/me` (debugging) |
| `/api/outlook/sync-all` | POST | Bulk sync: creates Outlook events for all active (non-completed) jobs that don’t yet have a mapping |
| `/api/outlook/disconnect` | POST | Disconnects Outlook — marks tokens as disconnected in Firestore |

### Data & types

- **`Job`**: `id`, `jobNumber`, `company`, `address`, `contactName`, `contactPhone`, `ktiTime`, `onSiteTime`, `date`, `status`, `scope`, `notes`, `attachments[]`, `createdAt`.
- **`JobStatus`**: `scheduled` | `in-progress` | `completed` | `pending`.
- **`Attachment`**: `name`, `url`, `size`, `type` (PDF, Archive, etc.).
- **`ContactPerson`**: `name`, `role`, `phone`, `email`, `isPrimary`.
- **`CompanyRecord`**: `id`, `name`, `address`, `city`, `contacts[]`, `notes`, `jobCount`, `lastJobDate`, `createdAt`.
- **`DocRecord`** (in `lib/documents.ts`): `id`, `name`, `size`, `sizeBytes`, `type`, `mimeType`, `jobNumber`, `company`, `storageUrl`, `storagePath`, `uploadedBy`, `createdAt`.
- **`NotifRecord`** (in `lib/notifications.ts`): `id`, `type`, `category`, `unread`, `titleBold`, `title`, `desc`, `createdAt`.

### Backend / lib

- **Firebase** (`lib/firebase.ts`)
  - Init from `NEXT_PUBLIC_*` env vars, avoids duplicate init in dev.
  - Exports: `db` (Firestore), `storage` (Storage), `auth` (Firebase Auth).

- **Jobs** (`lib/jobs.ts`)
  - `getJobs()` — one-time fetch, newest first.
  - `onJobsSnapshot(callback)` — real-time Firestore listener.
  - `createJob(job)` — add job, returns doc id.
  - `updateJob(id, data)` — partial update.
  - `markJobComplete(id)` — set status to `completed`.
  - `deleteJob(id)` — delete job document.

- **Job Actions** (`lib/job-actions.ts`)
  - `createJobWithSync(job)` — creates job, ensures company exists (creates/updates from job data via `ensureCompanyFromJob`), syncs to Outlook, sends notification.
  - `updateJobWithSync(id, data, fullJob)` — updates job + syncs to Outlook + notifies on status change.
  - `markJobCompleteWithSync(job)` — marks complete + removes Outlook event + notifies.
  - Internal: `extractCity(address)` (city/state from address), `ensureCompanyFromJob(job)` (company CRUD from job fields).

- **Contacts** (`lib/contacts.ts`)
  - `getCompanies()` — one-time fetch.
  - `onCompaniesSnapshot(callback)` — real-time listener.
  - `createCompany(company)` — add company, returns doc id.
  - `updateCompany(id, data)` — partial update.
  - `deleteCompany(id)` — delete company.

- **Documents** (`lib/documents.ts`)
  - `getDocuments()` — one-time fetch.
  - `onDocumentsSnapshot(callback)` — real-time listener.
  - `uploadDocument(file, metadata, onProgress)` — uploads to Storage, writes Firestore metadata.
  - `deleteDocument(doc)` — removes file from Storage and Firestore record.
  - `getDocumentDownloadUrl(path)` — returns signed download URL.
  - Helpers: `formatFileSize`, `inferFileType` (pdf, image, archive, checklist, doc).

- **Notifications** (`lib/notifications.ts`)
  - `getNotifications()` / `onNotificationsSnapshot(callback)` — fetch or subscribe.
  - `markNotifRead(id)` / `toggleNotifRead(id, read)` / `markAllNotifsRead()` — read state management.
  - `createNotification(notif)` — generic create.
  - Convenience: `notifyJobCreated`, `notifyJobStatusChanged`, `notifyJobReminder`, `notifyOutlookSync`, `notifyDocumentUploaded`.

- **Microsoft Graph** (`lib/microsoft-graph.ts`)
  - OAuth: `getAuthUrl()`, `exchangeCodeForTokens(code)`.
  - Tokens: `getValidAccessToken()` (auto-refreshes within 5 min of expiry), stored in Firestore `settings/outlook_tokens`.
  - Connection: `isOutlookConnected()`, `disconnectOutlook()`.
  - Calendar: `createCalendarEvent(event)`, `updateCalendarEvent(eventId, event)`, `deleteCalendarEvent(eventId)`.
  - Conversion: `jobToCalendarEvent(job)` — maps job fields to Graph CalendarEvent.

- **Outlook Sync Client** (`lib/outlook-sync.ts`)
  - `syncJobToOutlook(action, job)` — calls POST `/api/outlook/sync`.
  - `checkOutlookConnection()` — calls GET `/api/outlook/sync`.
  - `connectOutlook()` — redirects to `/api/auth/outlook`.
  - `disconnectOutlookClient()` — calls POST `/api/outlook/disconnect`.

### Hooks

- **`useFirestore<T>(subscribe, fallback)`** (`hooks/useFirestore.ts`)
  - Generic hook for real-time Firestore subscriptions.
  - Returns `{ data, loading, error }`.
  - Falls back to seed data if collection is empty or on error.

- **`useAutoProgress(jobs)`** (`hooks/useAutoProgress.ts`)
  - Moves jobs from `scheduled` to `in-progress` when current time passes `onSiteTime`.
  - Runs on mount and every 5 minutes; uses `updateJobWithSync` for each transition.
  - Uses a ref to avoid reprocessing the same job.

### Auth

- **AuthContext** (`contexts/AuthContext.tsx`): `AuthProvider` wraps the app (root layout). Exposes `useAuth()`: `user`, `loading`, `loginWithEmail(email, password)`, `signupWithEmail(email, password, displayName)`, `loginWithGoogle()`, `logout()`. Uses Firebase `onAuthStateChanged`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signInWithPopup` (Google), `signOut`, `updateProfile`.
- **ProtectedRoute** (`components/ProtectedRoute.tsx`): Wraps Jobs, Calendar, Contacts, Documents, Notifications, Integrations. If not authenticated, redirects to `/login`; shows loading spinner while auth is resolving.
- **Login page** (`/login`): Login / signup toggle; email + password (min 6 chars); optional first/last name for signup; Google sign-in; error handling (invalid credentials, email-already-in-use, weak password); animated background (grid, orbs, particles); redirects to `/jobs` on success.

### UI components

| Component | Role |
|-----------|------|
| **Sidebar** | Fixed left nav (260px). Brand "FieldOps". Links: Jobs, Calendar, Contacts, Documents, Notifications, Integrations. Active route highlighting via `usePathname`. Jobs badge, notification dot. Footer: Outlook sync status, user avatar. |
| **Topbar** | Sticky header: "Active Jobs" title, search input (wired on Jobs page to filter by job number/company), Export button, "New Job" primary button. |
| **StatsRow** | Four stat cards in a grid. Values computed from `jobs` array. Staggered fade-in animation. |
| **JobsTable** | Filter pills (All / Scheduled / In Progress / Completed / Pending). Table: Job #, Company, Site Contact, KTI, On Site, Status, Scope, Files, actions. Row click → detail panel; edit icon → edit panel. Status badges with colored left border. Empty state. |
| **NewJobPanel** | Right slide-out (620px). Form: job number, company, address, contact, phone, KTI time, on-site time, date, status, scope, notes. Save → `createJobWithSync` (Firestore + Outlook + notification). Saving/success states. |
| **DetailPanel** | Right slide-out (620px). Full job view: status badge, company, address, contact, schedule, scope, notes, attachments with type icons. Actions: "Edit" opens NewJobPanel; "Mark complete" → `markJobCompleteWithSync`. |
| **NewContactPanel** | Right slide-out. Create/edit company form: company name, city, address, contact person (name, role, phone, email), notes. Uses `createCompany` / `updateCompany`. |
| **ContactDetailPanel** | Right slide-out. Company detail: avatar (color from name hash), name, address, job count, last job, contacts list, recent jobs (up to 5) with status badges, notes. Actions: Delete, Edit, New Job. |

### Pages (feature detail)

- **Jobs** (`/jobs`): Protected. Real-time Firestore via `useFirestore` + `onJobsSnapshot`. `useAutoProgress(jobs)` auto-advances scheduled → in-progress. **Search**: filters jobs by job number and company (Topbar search wired). Manages NewJobPanel and DetailPanel state. Escape closes panels.

- **Calendar** (`/calendar`): Protected. Week view (7-col time grid, 7 AM–6 PM, job blocks) and month view (day grid, up to 3 jobs per day). Navigation: prev/next, "Today" button, week/month toggle. "Upcoming Jobs" sidebar. Opens NewJobPanel and DetailPanel. Parses job dates and times for positioning.

- **Contacts** (`/contacts`): Protected. Real-time Firestore for companies and jobs. Stats row (Total Contacts, Companies, Active This Week). City filter pills. Table with company rows. Row click → ContactDetailPanel; edit → NewContactPanel. "New Job" button opens Add Contact form.

- **Documents** (`/documents`): Protected. Grid and table view toggle. Stats (Total Files, PDFs, Photos, Storage Used). Filter pills (All, PDFs, Photos, Archives, Checklists). Upload panel with drop zone, job link, notes. Preview panel with file details and linked job info. Seeds from job attachments.

- **Notifications** (`/notifications`): Protected. Real-time Firestore via `useFirestore` + `onNotificationsSnapshot`. Filter pills (All, Jobs, Calendar, Documents, Outlook). Grouped by Today / Yesterday / Earlier. Activity summary sidebar. Unread count badge. "Mark all read" action. Click toggles read state. Falls back to seed data.

- **Integrations** (`/integrations`): Protected. Outlook Calendar integration. Connection status (Connected / Not Connected). Connect / Disconnect. Config: sync toggles (auto-sync on create, sync updates, remove on complete, include notes). Sync history log. "Sync Now" (single-job sync) and bulk **Sync All** (calls `POST /api/outlook/sync-all`). Handles OAuth redirect via `?connected=true`.

### UX / behavior

- **Auth**: Unauthenticated users hit `/login`; after login/signup (email or Google) they are redirected to `/jobs`. All main app routes are protected.
- **Panels**: New Job, Detail, New Contact, and Contact Detail open as overlay + right slide-out; overlay click or Escape closes.
- **Keyboard**: Escape closes any open panel.
- **Search**: Jobs page filters the table by job number and company as the user types in the Topbar search input.
- **Real-time**: Jobs, companies, and notifications use Firestore real-time listeners via `useFirestore` hook with seed-data fallback.
- **Auto-progress**: Scheduled jobs automatically move to in-progress when the current time passes the on-site time (useAutoProgress on Jobs page).
- **Outlook sync**: Job create/update/complete operations automatically sync to Outlook calendar; bulk "Sync All" available on Integrations page.
- **Theme**: Dark theme via CSS variables in `globals.css` (void, sidebar, cards, borders, accent, success, warning, danger, etc.). Animations: `fadeUp`, `pulse`, `spin`.

### Config

- **Paths**: `@/*` → `./src/*` (tsconfig).
- **Tailwind**: v4 + `@tailwindcss/postcss`.
- **Next**: Default `next.config.ts` (no custom options).
- **TypeScript**: Strict mode, ES2017 target, bundler module resolution.

### Not implemented (placeholders / future)

- **Export**: Topbar Export button rendered, no export logic.
- **Middleware**: No `middleware.ts` present.
- **Environment example**: No `.env.example` file for onboarding.

---

## Firestore collections

| Collection | Purpose |
|------------|---------|
| `jobs` | Job records |
| `companies` | Company / contact records |
| `documents` | Document metadata (files in Storage) |
| `notifications` | Notification records |
| `settings/outlook_tokens` | Microsoft OAuth tokens + connection state |
| `outlook_event_mappings` | Job ID ↔ Outlook event ID mappings |

---

## Quick reference

| Path / alias | Purpose |
|--------------|---------|
| `src/app/page.tsx` | Redirect home → `/jobs` |
| `src/app/login/page.tsx` | Login/signup (email, Google), redirect to `/jobs` |
| `src/app/jobs/page.tsx` | Jobs dashboard (protected, search, panels, useAutoProgress) |
| `src/app/calendar/page.tsx` | Calendar week/month views (protected) |
| `src/app/contacts/page.tsx` | Contacts/companies directory (protected) |
| `src/app/documents/page.tsx` | Document library (protected) |
| `src/app/notifications/page.tsx` | Notification feed (protected) |
| `src/app/integrations/page.tsx` | Outlook integration + Sync All (protected) |
| `src/app/layout.tsx` | Root layout, AuthProvider, fonts, metadata |
| `src/app/globals.css` | Theme variables, Tailwind, keyframes |
| `src/app/api/auth/outlook/route.ts` | OAuth start |
| `src/app/api/auth/callback/outlook/route.ts` | OAuth callback |
| `src/app/api/outlook/sync/route.ts` | GET status; POST sync job; PUT token test |
| `src/app/api/outlook/sync-all/route.ts` | POST bulk sync all active jobs to Outlook |
| `src/app/api/outlook/disconnect/route.ts` | Disconnect Outlook |
| `src/components/ProtectedRoute.tsx` | Redirect to /login if not authenticated |
| `src/contexts/AuthContext.tsx` | useAuth, AuthProvider (Firebase Auth) |
| `src/types/job.ts` | Job types |
| `src/types/contact.ts` | Contact/company types |
| `src/hooks/useFirestore.ts` | Real-time Firestore hook |
| `src/hooks/useAutoProgress.ts` | Auto scheduled → in-progress by time |
| `src/lib/firebase.ts` | Firebase init (db, storage, auth) |
| `src/lib/jobs.ts` | Job CRUD + deleteJob |
| `src/lib/job-actions.ts` | Job ops + company sync + Outlook + notifications |
| `src/lib/contacts.ts` | Company CRUD |
| `src/lib/documents.ts` | Document storage + metadata (DocRecord fields) |
| `src/lib/notifications.ts` | Notifications CRUD + creators (NotifRecord fields) |
| `src/lib/microsoft-graph.ts` | Microsoft Graph OAuth & calendar |
| `src/lib/outlook-sync.ts` | Client-side Outlook helpers |
| `cors.json` | CORS config (GET, origin *; e.g. Firebase Hosting) |
| `@/components/*` | Shared UI components |
