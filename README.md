# PEP Weekly Math Practice

A teacher-facing tool for creating one mixed, cumulative mathematics worksheet for a small group of elementary students. A worksheet is normally issued on Monday, worked on during the week, and submitted on Friday.

The generator is designed for written practice of previously taught material—not timed automaticity and not first teaching. It creates new, reproducible question variants instead of repeatedly sampling a small fixed bank.

## What teachers can do

- Start from one of four simple presets or a balanced default.
- Choose up to eight previously taught sub-skills; six are selected by default.
- Set each skill to **Support**, **Core**, or **Stretch**.
- Choose **Direct**, **Applied**, or **Mixed** questions for each skill.
- Generate 8–20 questions; the default is 12.
- Preview the exact two-page, A4 student worksheet before downloading.
- Print in true black and white, with unruled blank working space.
- Download a ZIP containing the student PDF, teacher answer key, reusable recipe, and immutable manifest.
- Reprint an exact previous worksheet or reuse its setup to create fresh questions.
- Privately track successful downloads by teacher, selected skills, practice bands, and question styles.

Geometry questions are text-based and may ask students to draw. The PDF never depends on generated diagrams. Written-operation generators use suitably substantial numbers, with enough working space for students to show their method.

## Local setup

Requirements: Node.js 18.18 or later, npm, and Google OAuth credentials.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root URL redirects to `/builder`; unauthenticated users are sent to `/sign-in`.

## Environment variables

See `.env.example`. At minimum configure:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`
- `NEXTAUTH_URL`

Teacher access defaults to verified Google accounts at `@pepschoolv2.com` and `@accelschool.in`. Override the defaults with `ALLOWED_EMAIL_DOMAINS` and add exceptional individual accounts with `ALLOWED_EMAILS` only when required.

For Google OAuth, add both the local and production callback URLs as authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://YOUR-DOMAIN/api/auth/callback/google
```

Set `NEXTAUTH_URL` to the matching site origin in each environment. Vercel production and preview environments should have their own correct values.

## Download tracking

Successful worksheet-pack generations can be recorded in Supabase. Previews and failed generations are deliberately not counted. The event contains the signed-in teacher email, timestamp, starting point, question count, and aggregate skill, band, and style counts. It never stores group labels, worksheet titles, seeds, generated questions, answers, or student information.

1. Create or choose a Supabase project.
2. Run [`supabase/migrations/202608020001_create_worksheet_download_events.sql`](supabase/migrations/202608020001_create_worksheet_download_events.sql) in the Supabase SQL editor.
3. Add these server-side environment variables locally and in Vercel:

```text
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY
PRIVATE_ADMIN_EMAILS=rahul@pepschoolv2.com
```

The service-role key must never use a `NEXT_PUBLIC_` prefix. The event table has RLS enabled and grants no browser access to ordinary authenticated or anonymous clients. Only the server writes events and reads the private report.

The private tracker is available at `/admin/usage` to the configured administrator emails. A visible status distinguishes a working connection with zero downloads from missing configuration or a failed Supabase query. Tracking failures do not block a teacher from receiving a completed worksheet pack.

After deployment, sign in as a teacher, preview once, and download once. Then sign in as the private administrator and confirm the tracker shows exactly one event; the preview should not appear.

## Commands

```bash
npm run dev                 # Local server on port 3000
npm run build               # Production build
npm run start               # Run the production build
npm run lint                # ESLint
npm test -- --runInBand     # Deterministic generator, API, renderer and UI tests
npx ts-node scripts/smoke-weekly-pdf.ts  # Local PDF/ZIP smoke pack
```

The smoke script writes disposable files under `output/pdf/`; that folder is ignored by Git.

## Architecture

- `src/lib/worksheet/catalog.ts` — curriculum-backed sub-skills and teacher presets
- `src/lib/worksheet/generators.ts` — typed, parameterized question generators
- `src/lib/worksheet/compose.ts` — seeded composition, interleaving, uniqueness and page-budget checks
- `src/lib/worksheet/render.ts` — student and answer-key HTML with KaTeX MathML
- `src/lib/worksheet/pdf.ts` — local Chrome or serverless Chromium rendering
- `src/lib/worksheet/pack.ts` — complete ZIP packaging
- `src/lib/worksheet/history.ts` — browser-local exact worksheet history
- `src/app/api/worksheet/*` — authenticated compose, preview and download routes
- `src/lib/usage.ts` — privacy-minimal Supabase event recording and reporting
- `src/app/admin/usage` — private download tracker

One immutable manifest drives the student paper, answer key, exact reprint, and audit trail. The same recipe and seed reproduce the same questions.

## History and student data

The reusable worksheet history remains only in that teacher's browser using `localStorage`. The server stores only the privacy-minimal successful-download event described above; it does not store the worksheet manifest or any student information. A browser history entry can be:

- **Reprinted exactly**, using its stored manifest; or
- **Used as a setup**, producing fresh variants from its stored recipe.

Clearing browser storage clears this history, so the downloaded ZIP is the durable record.

## Production notes

PDF generation uses Playwright. Locally it discovers an installed Chrome/Chromium browser; on Vercel it uses `@sparticuz/chromium`. The Next.js output-tracing configuration includes the required serverless browser files.

Keep `AUTH_SECRET`, the Google client secret, and `SUPABASE_SERVICE_ROLE_KEY` server-side. Never expose them through `NEXT_PUBLIC_*` variables.
