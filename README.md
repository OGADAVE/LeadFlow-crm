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

## Design identity: "LeadFlow"
Navy/blue theme matching the provided brand mockup — dark navy backgrounds, blue-to-cyan
brand gradient, DM Sans display font, lucide-react icons throughout. Replaced the earlier
dark/gold "Estate Ledger" look entirely.

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
   applicable) docs, generates a password-reset link, and emails it via Brevo.
   - If the Brevo send fails, the account and Firestore docs are still created
     successfully — the response includes the raw reset link so you can share it
     manually instead of losing the invite entirely.
3. Invitee clicks the link, sets their password, signs in at `/login` — their profile
   doc is already in place, so they land straight in the workspace.

## Email Automation flow, end to end
1. **`/email-templates`** — create HTML templates with `{{fullName}}` / `{{consultantName}}`
   placeholders. Stored in `companies/{id}/emailTemplates`.
2. **`/automation`** — build a sequence: pick a trigger (currently just "when a new lead
   is created"), add ordered steps referencing a template + a delay in days.
3. **Enrollment** happens client-side the moment a lead is created (`LeadForm.jsx` and
   `CSVImport.jsx` both call `src/lib/enrollment.js`), which queries active sequences
   matching the trigger and writes a `sequenceEnrollments` doc per match, starting at
   step 1 with `nextSendAt` set from that step's delay.
4. **Sending** is Worker-only — `worker/src/routes/sendSequenceEmails.js` runs on a
   Cloudflare Cron Trigger every hour (`wrangler.toml`), scans every company's due
   enrollments in one `collectionGroup` query, sends the current step's email via Brevo,
   personalizes the placeholders, logs an `email_sent` timeline event + notification,
   and advances to the next step (or marks the enrollment `completed`).
   - Enrollment writes are the one place the client is trusted (matching the
     timeline/notifications tradeoff below) — but advancing a step, marking one
     complete, or sending the actual email is only ever done by the Worker's service
     account, which bypasses Firestore rules entirely.
5. **Testing without waiting an hour**: the Automation page has a "Send due emails now"
   button (admin only) that calls `POST /api/trigger-sequences` — same logic the cron
   runs, just on demand.
6. **Open/click tracking** — before sending, `injectTracking()` in `sendSequenceEmails.js`
   rewrites every `<a href="...">` in the email to route through
   `GET /track/click?url=...&companyId=...&leadId=...` first (logs `email_clicked`, then
   302-redirects to the real destination), and appends an invisible 1×1 pixel pointing at
   `GET /track/open?...` (logs `email_opened`). Both are plain Worker HTTP routes — no
   auth on them, since email clients loading an image or following a link can't send a
   Firebase ID token. `WORKER_URL` in `wrangler.toml` must be set to your actual deployed
   Worker URL for these links to resolve correctly.

## Daily follow-up scan
`worker/src/routes/dailyFollowUpScan.js` runs once a day (06:00 UTC, `wrangler.toml`),
finds every lead across every company with `nextFollowUpDate <= now`, groups them by
company, and writes ONE summary notification per company (not one per lead — avoids
spamming the bell). Admins can also run it on demand from the Automation page's "Run
follow-up scan now" button.

**A real correctness fix made while building this**: Firestore only allows one field per
query to have an inequality filter (`<`, `<=`, `>`, `>=`, `!=`, `not-in` all count). The
original design doc's pseudocode combined `status not-in [...]` with `lastContactDate <=`
— two different fields, both inequalities — which Firestore would reject at query time.
The actual query here filters only on `nextFollowUpDate <= now` (one inequality field),
then excludes `closed`/`lost` leads in application code after fetching, not in the query
itself. Worth knowing if you ever add more filters to this kind of cross-company scan.

AI-assisted follow-up draft generation (`generateFollowUpDrafts` from the original PRD)
is a separate, not-yet-built feature — this scan only notifies that leads are due, it
doesn't draft anything for you yet.

## What's built (MVP scope)
- **Dashboard** — re-themed to the navy/blue "LeadFlow" visual identity (see mockup),
  with real KPI cards, a Lead Conversion Funnel, a Lead Sources donut chart (recharts),
  a Recent Activity feed (via a `collectionGroup` query across lead timelines), and
  Quick Actions
- **Leads** — list + "+ Add lead" form + **CSV Import** (bulk load via `papaparse`,
  batched Firestore writes, template download, consultant-name matching) + individual
  profile with live timeline + WhatsApp click-to-chat (logs the click + a timeline event)
- **Pipeline** — drag-and-drop Kanban across all 7 stages (`@dnd-kit`)
- **Properties** — card grid + admin "+ Add property" form
- **Consultants** — admin roster (live-computed lead count + conversion rate) and each
  consultant's personal `/my-dashboard`
- **Email Templates** — create/edit HTML templates with a live preview and placeholder support
- **Email Automation** — build multi-step sequences, auto-enrollment on lead creation,
  hourly Worker-driven sending via Brevo, manual "send now" trigger for testing, and
  open/click tracking (rewritten links + invisible pixel, both logged to the lead's
  timeline and the notification bell)
- **Daily follow-up scan** — a Worker Cron job finds every lead with a due follow-up
  across every company and writes one summary notification per company; admin can also
  run it on demand
- **Analytics** — Email Performance (sent/opened/clicked, computed from the last 1,000
  timeline events), Lead Source Performance, and Consultant Performance, all computed
  from real data. CSV export of the whole page
- **Notifications** — the bell in the top nav is now live: new leads, status changes,
  WhatsApp clicks, CSV imports, and sequence emails all write a notification. Clicking
  one marks it read and jumps to the relevant lead. Visible to the whole company for now
  (no per-user targeting yet — see tradeoff note below)
- **Auth** — signup, login, invite (Cloudflare Worker + Brevo), all described above
- **Responsive layout** — sidebar collapses to an off-canvas drawer below `md` breakpoint,
  tables scroll horizontally instead of squeezing illegibly


## Known tradeoffs — client-side writes
Three things are currently written directly by the client rather than a trusted server,
because we're not running Cloud Functions:
- **Lead timeline** (`LeadForm.jsx` on create, `PipelineBoard.jsx` on status change,
  `LeadProfile.jsx` on WhatsApp click)
- **Notifications** (same three places, via `src/lib/notifications.js`)
- **Sequence enrollment** (`src/lib/enrollment.js`, called from `LeadForm.jsx` and
  `CSVImport.jsx`) — creating the *enrollment record* is client-side, but everything
  that happens after — advancing a step, sending the actual email, marking one
  complete — is Worker-only

Firestore rules still restrict all three to signed-in members of the same company, and
none can be edited or deleted once created by the client — but a determined user could
technically fabricate an entry via the browser console. Moving these to server-side
writes (new Worker routes the client calls instead of writing directly) is a reasonable
hardening step once the core flows are validated end-to-end — not urgent for an
internal team tool.

## Not yet built (next passes)
- Campaign Manager, AI Email Writer
- Property image upload via Cloudinary (URLs are pasted manually for now)
- `generateFollowUpDrafts` — AI-assisted follow-up email suggestions (the scan itself is
  built; this would add an AI-drafted email per due lead on top of the notification)
- PDF/Excel export for Analytics (CSV export is built; PDF/Excel formats from the
  original PRD are not)
- Denormalized consultant metrics kept in sync server-side (currently computed
  client-side each render — fine at current lead volume)
- Per-user notification targeting (currently company-wide visible to everyone)

Note on Analytics: Email Performance is computed from the last 1,000 timeline events
across the whole company (a fixed window, not a true all-time total) — fine at current
volume, but worth revisiting with a proper aggregation approach if the company ever
generates enough email activity to blow past that window.
