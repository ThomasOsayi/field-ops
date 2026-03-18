# FieldOps — Repo Layout & Implementation Summary

## File structure (source tree)

```
field-ops/
├── .env.local              # Firebase / env (not committed)
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
├── tsconfig.json
│
└── src/
    ├── app/
    │   ├── globals.css       # Tailwind + CSS variables (theme)
    │   ├── layout.tsx         # Root layout, fonts, metadata
    │   ├── page.tsx           # Home → redirects to /jobs
    │   └── jobs/
    │       └── page.tsx       # Main jobs dashboard (client page)
    │
    ├── components/
    │   ├── DetailPanel.tsx    # Slide-out job detail + mark complete
    │   ├── JobsTable.tsx      # Filterable jobs table + row actions
    │   ├── NewJobPanel.tsx    # Slide-out create-job form
    │   ├── Sidebar.tsx        # App nav (Jobs, Calendar, etc.)
    │   ├── StatsRow.tsx       # Summary cards (active, scheduled, etc.)
    │   └── Topbar.tsx        # Title, search, New Job, Export
    │
    ├── lib/
    │   ├── firebase.ts        # Firebase app, Firestore, Storage init
    │   └── jobs.ts            # CRUD: getJobs, createJob, updateJob, markJobComplete
    │
    └── types/
        └── job.ts             # Job, NewJob, JobStatus, Attachment
```

*(Build output: `.next/`. Dependencies: `node_modules/`. Both omitted from tree.)*

---

## What’s implemented

### Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4** + **PostCSS**
- **Firebase**: Firestore (jobs), Storage (ready for attachments)
- **Fonts**: DM Sans, JetBrains Mono (next/font)

### App flow

- **`/`** → redirects to **`/jobs`**.
- **`/jobs`** is the main dashboard: sidebar + topbar + stats + jobs table + slide-out panels.

### Data & types

- **`Job`**: `id`, `jobNumber`, `company`, `address`, `contactName`, `contactPhone`, `ktiTime`, `onSiteTime`, `date`, `status`, `scope`, `notes`, `attachments[]`, `createdAt`.
- **Status**: `scheduled` | `in-progress` | `completed` | `pending`.
- **Attachments**: `name`, `url`, `size`, `type` (e.g. PDF, Archive).

### Backend / lib

- **Firebase**  
  - Init in `lib/firebase.ts` from `NEXT_PUBLIC_*` env vars.  
  - Exports: `db` (Firestore), `storage` (Storage).

- **Jobs API** (`lib/jobs.ts`)  
  - `getJobs()` — list jobs, newest first.  
  - `createJob(job)` — add job, returns doc id.  
  - `updateJob(id, data)` — partial update.  
  - `markJobComplete(id)` — set status to `completed`.

### UI components

| Component      | Role |
|----------------|------|
| **Sidebar**    | Fixed left nav: brand “FieldOps”, main nav (Jobs active, Calendar, Contacts, Documents, Notifications), Integrations. Jobs badge, notification dot. |
| **Topbar**     | “Active Jobs” title, search input (UI only), Export button, “New Job” primary button. |
| **StatsRow**   | Four cards: Active Jobs, Scheduled Today, In Progress, Completed (Week). Values from `jobs`; deltas/labels are placeholder. |
| **JobsTable**  | Filter pills (All / Scheduled / In Progress / Completed / Pending). Table: Job #, Company, Site Contact, KTI, On Site, Status, Scope, Files, actions. Row click → detail; edit icon → edit. |
| **NewJobPanel**| Right slide-out (620px). Form: job number, company, address, contact, phone, KTI time, on-site time, date, status, scope, notes, attachments (structure in place). Save → `createJob`, then refresh list and close. |
| **DetailPanel**| Right slide-out (620px). Shows full job; “Mark complete” → `markJobComplete`; “Edit” opens NewJobPanel with that job. |

### UX / behavior

- **Panels**: New Job and Detail open as overlay + right slide-out; overlay click or Escape closes.
- **Keyboard**: Escape closes either panel.
- **Theme**: Dark theme via CSS variables in `globals.css` (void, sidebar, cards, borders, accent, success, warning, danger, etc.).

### Config

- **Paths**: `@/*` → `./src/*` (tsconfig).
- **Tailwind**: v4 + `@tailwindcss/postcss`.
- **Next**: Default `next.config.ts`.

### Not implemented (placeholders / future)

- **Search** in Topbar: input only, no filter logic.
- **Export**: button only, no export logic.
- **Sidebar** links other than Jobs: no routes (Calendar, Contacts, Documents, Notifications, Integrations).
- **Calendar view**: not built.
- **Real-time** Firestore listeners (jobs are fetched on load/refresh and after create/update).
- **Auth**: no Firebase Auth or protected routes.
- **File upload**: attachment fields in NewJobPanel; Storage is initialized but upload flow not wired.

---

## Quick reference

| Path / alias     | Purpose |
|------------------|--------|
| `src/app/page.tsx` | Redirect home → `/jobs` |
| `src/app/jobs/page.tsx` | Jobs dashboard (state, fetch, panels) |
| `src/app/layout.tsx` | Root layout, fonts, metadata |
| `src/app/globals.css` | Theme variables, Tailwind, keyframes |
| `src/types/job.ts` | Job types |
| `src/lib/firebase.ts` | Firebase init |
| `src/lib/jobs.ts` | Firestore job CRUD |
| `@/components/*` | Shared UI components |
