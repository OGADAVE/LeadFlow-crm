# LeadFlow CRM

## Architecture
```
Frontend (React + Vite)  →  Cloudflare Worker (leadflow-api)  →  Firestore + Firebase Auth
```
No Firebase Cloud Functions, no Blaze plan required. Firestore stays on the free Spark
plan — the Worker talks to it over the same REST API Cloud Functions would have used,
authenticated with a Firebase service account instead of the Admin SDK. Security-rule-wise
this is identical to how Cloud Functions worked: the Worker's service account bypasses
Firestore security rules entirely (same as Admin SDK did), so sensitive writes
(`userProfiles`, `users`, timeline integrity, etc.) are still only trustworthy when they
go through the Worker — never trust a client to have done them "for real."

## Design identity: "The Estate Ledger"
Dark obsidian background, brass-gold accents, IBM Plex Mono for data/numbering — evokes a
property deed register. Leads are numbered like registered entries (№ 0001, 0002…).

## Repo structure
```
leadflow-crm/
  src/                    → React frontend
  functions/              → (removed — no longer used)
  worker/                 → Cloudflare Worker backend
    wrangler.toml
    src/
      index.js            → router + CORS
      lib/
        googleAuth.js     → signs a JWT with your service account, exchanges it
                             for a Google OAuth token (cached in-memory per isolate)
        firestore.js      → minimal Firestore REST client (setDoc/getDoc/addDoc)
        identityToolkit.js→ create Firebase Auth users + generate password-reset
                             links, via REST (no Admin SDK)
        verifyIdToken.js  → verifies a Firebase ID token against Google's public
                             JWKS, so the Worker knows who's really calling
      routes/
        companySignup.js  → POST /api/company-signup
        inviteUser.js     → POST /api/invite-user
  firestore.rules
  firestore.indexes.json
  firebase.json           → rules + indexes only now (no functions section)
```

## Setup — frontend
```bash
npm install
cp .env.example .env   # fill in Firebase config + VITE_WORKER_URL (see below)
npm run dev
```

## Setup — Worker
```bash
cd worker
npm install
npx wrangler login
```

**Get a Firebase service account key** (this replaces the Admin SDK credentials Cloud
Functions used automatically):
1. Firebase console → your project → gear icon → Project Settings → **Service Accounts**
2. **Generate new private key** → downloads a JSON file
3. Set it as a Worker secret (paste the *entire* file contents when prompted):
   ```bash
   npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON
   ```
4. Also set your Resend key:
   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```

**Deploy the Worker:**
```bash
npx wrangler deploy
```
This prints your Worker's URL, something like `https://leadflow-api.<your-subdomain>.workers.dev`.
Put that in the frontend's `.env` as `VITE_WORKER_URL` (no trailing slash).

**Local dev** (optional, runs the Worker on your machine instead of deployed):
```bash
npx wrangler dev
```
Requires a `.dev.vars` file in `worker/` with the same two secrets in `KEY=value` form —
never commit this file (already in `.gitignore`).

## Deploy Firestore rules + indexes (unchanged from before, still via Firebase CLI)
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Auth flow, end to end
1. **`/signup`** — the frontend creates the user's own Firebase Auth account
   directly (`createUserWithEmailAndPassword`, ordinary self-service, no privileged
   operation). It then calls `POST /api/company-signup` on the Worker with that user's
   ID token. The Worker verifies the token, confirms this uid doesn't already have a
   `userProfiles` doc (can't be replayed), and creates the `companies/{companyId}` doc +
   makes them its first admin.
2. **`/invite`** (admin only) — calls `POST /api/invite-user`. The Worker verifies the
   **caller's** own admin role server-side (never trusts what the client claims about
   itself), creates the invitee's Firebase Auth account via the Identity Toolkit REST
   API (no Admin SDK needed), writes their `userProfiles` + `users` (+ `consultants` if
   applicable) docs, generates a password-reset link, and emails it via Resend.
   - If the Resend send fails, the account and Firestore docs are still created
     successfully — the response includes the raw reset link so you can share it
     manually instead of losing the invite entirely.
3. Invitee clicks the link, sets their password, signs in at `/login` — their profile
   doc is already in place, so they land straight in the workspace.

## What's built (MVP scope)
- **Dashboard** — 8 KPI cards, live from Firestore
- **Leads** — ledger-style list + "+ Add lead" form + individual profile with live timeline
- **Pipeline** — drag-and-drop Kanban across all 7 stages (`@dnd-kit`)
- **Properties** — card grid + admin "+ Add property" form
- **Consultants** — admin roster (live-computed lead count + conversion rate) and each
  consultant's personal `/my-dashboard` (today's follow-ups, upcoming inspections,
  assigned leads)
- **Auth** — signup, login, invite, all described above

## Known tradeoff — timeline integrity
The lead timeline (`companies/{id}/leads/{id}/timeline`) is currently written directly
by the client (`LeadForm.jsx` on create, `PipelineBoard.jsx` on drag) rather than by the
Worker. This means a determined user could technically fabricate a timeline entry via
the browser console — the audit trail isn't tamper-proof yet. Firestore rules do still
restrict it to signed-in members of the same company, and entries can never be edited or
deleted once created. Moving this to server-side logging (Worker webhook triggered by
Firestore, or the client calling a `/api/log-timeline-event` Worker route) is a
reasonable next hardening step once the core flows are validated end-to-end.

## Not yet built (next passes)
- Email template editor, Campaign Manager, AI Email Writer
- CSV import UI
- Property image upload via Cloudinary (URLs are pasted manually for now)
- Email automation: `sendScheduledSequenceEmails` (Cloudflare Cron Trigger),
  tracking pixel/click endpoints, `dailyFollowUpScan`, `generateFollowUpDrafts` — all
  straightforward to add as new Worker routes + a `[triggers]` cron in `wrangler.toml`,
  not yet built
- Denormalized consultant metrics kept in sync server-side (currently computed
  client-side each render — fine at current lead volume)
