# PriorProof

**Your skills deserve recognition.**

PriorProof is a skills-documentation and prior-learning support platform. It helps people organise skills gained through formal education, employment, volunteering, apprenticeships, community activities, entrepreneurship and self-directed learning into a structured, evidence-backed portfolio.

PriorProof does **not** award qualifications, guarantee formal recognition, verify documents independently or replace an authorised assessor. Competency records and gap summaries are user-managed organisational aids, not formal assessment decisions.

## Product features

### Public website
- Responsive homepage with an illustrative portfolio preview
- About and How It Works pages
- Privacy and Terms pages, currently marked as development drafts
- Navigation between public pages and the signed-in workspace

### Account and workspace
- Email/password registration and sign-in through Supabase Auth
- Email-confirmation resend and password-recovery flows
- Google sign-in when the provider is enabled and configured
- Profile and experience records
- Evidence descriptions and private evidence attachments
- Competency organisation and evidence-gap review
- Portfolio and review-pack preparation
- Account settings, JSON backup/export and workspace recovery controls
- Responsive dashboard navigation and light/dark theme preference

Account deletion is not available as a self-service action yet. A server-side deletion Edge Function is included in the repository, but the UI control remains disabled until the function is deployed and verified in the intended Supabase project.

## Technology

- Vite
- Vanilla JavaScript (ES modules)
- CSS
- Supabase Auth, Postgres and private Storage
- `@supabase/supabase-js`
- Node.js built-in test runner

## Project structure

```text
priorproof/
├── public/
│   ├── _redirects              # Netlify SPA route fallback
│   ├── favicon.svg
│   └── logo.svg
├── src/
│   ├── components/              # Shared page layout and navigation
│   ├── data/                    # Illustrative/demo content
│   ├── pages/                   # Public and workspace page markup
│   ├── services/                 # Supabase and evidence-file services
│   ├── styles/                   # Global, public, dashboard and responsive styles
│   ├── utils/                    # Routing, validation and auth helpers
│   └── main.js                   # Application entry point and event handlers
├── supabase/
│   ├── schema.sql                # Database setup script
│   ├── security-audit.sql        # SQL security review queries
│   ├── ACCOUNT_DELETION_ROLLOUT.md
│   └── functions/                # Supabase Edge Functions
├── tests/                         # Unit tests
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

## Requirements

- Node.js LTS (with npm)
- A Supabase project for authentication, database and evidence storage
- Git and a GitHub account for source control (optional for local development)

## Run locally

1. Clone the repository and open the folder in VS Code.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local `.env` file from `.env.example` and set:

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

   Use only the Supabase publishable/anon key in the browser app. **Never** put a service-role key, database password, private API key or Google client secret in a `VITE_*` variable or commit it to Git.

4. Configure the Supabase project (see [Database and Supabase setup](#database-and-supabase-setup)).
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open the local URL printed by Vite, usually `http://localhost:5173`.

## Common commands

```bash
npm run dev       # Start local development server
npm test          # Run unit tests
npm run build     # Create production build in dist/
npm run preview   # Preview the production build locally
```

Run the test suite and production build before submitting website changes.

## Database and Supabase setup

Database configuration and live Supabase deployment must be completed and verified by the project operator.

1. In the Supabase SQL Editor, review and run `supabase/schema.sql` against the intended development project.
2. Review the resulting tables, constraints, indexes, Row Level Security (RLS) policies and Storage policies. Do not assume that applying a schema alone proves account isolation.
3. In Authentication settings, configure the Site URL and redirect allowlist for the local app and the production site.
4. Add the local confirmation and recovery redirect used by the application, typically `http://localhost:5173/app/dashboard`. Use the same host consistently; `localhost` and `127.0.0.1` are different redirect origins.
5. Enable Google OAuth only if it is needed. Use the Supabase-provided callback URL in the Google provider configuration and allow the app's redirect URL in Supabase.
6. Review `supabase/security-audit.sql` and record the results of the security review.
7. Test with at least two separate disposable accounts to confirm that each account can access only its own records and evidence files.

The browser app should use the publishable/anon key and rely on correctly configured RLS and Storage policies. Never expose the Supabase service-role key to the client.

## Authentication troubleshooting

- **Confirmation email not received:** Check the Supabase Auth logs at the exact time of registration or resend. Verify the SMTP/email provider configuration, spam folder and rate limits. A successful frontend request does not guarantee email delivery.
- **Confirmation or recovery link fails:** Check that the link is not expired or already used and that its redirect URL is included in the Supabase allowlist. Open a local `localhost` link on the same computer running Vite.
- **Google sign-in fails:** Check that Google OAuth is enabled, the provider callback URI matches the value shown in Supabase, and the app redirect is allowlisted.
- **Workspace does not load or save:** Check the browser console/network panel, the configured project URL, Supabase service status, database schema and RLS policies. Do not disable RLS as a workaround.

Do not share passwords, access tokens, recovery links, service-role keys or the contents of your `.env` file when asking for help.

## Deploy to Netlify

1. Push the repository to GitHub and import it into Netlify.
2. Set the build command to `npm run build` and the publish directory to `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify environment-variable settings. Keep all private secrets out of frontend variables.
4. Trigger a deploy and confirm that the deployment is marked published/ready.
5. Set the production Site URL and redirect allowlist in Supabase to the actual Netlify site URL.
6. Test direct page visits, refreshes, sign-in redirects and password-recovery redirects on the published site.

The `public/_redirects` file provides the single-page-app fallback for Netlify.

## Data, evidence and trust

- Experience and competency information is user-entered and self-reported unless a separate review process is explicitly documented.
- Evidence files are intended to be stored in private Supabase Storage; access depends on correct Storage policies and account-scoped paths.
- The application currently limits evidence uploads to 5 MB per file.
- JSON backups include workspace data but do not contain the original uploaded evidence attachments. Keep original files separately.
- Only upload files you are authorised to use. Remove unnecessary personal information belonging to other people.
- Do not use real sensitive documents during development or security testing.

## Release checklist

Before inviting real users, the project operator should complete and document:

- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Authentication and recovery flows work in the target environment
- [ ] Two-account RLS and private Storage isolation tests pass
- [ ] Evidence upload, download, replacement, deletion and persistence are verified
- [ ] Backup/restore and local recovery are tested
- [ ] Account deletion Edge Function is deployed and tested with disposable accounts before enabling the control
- [ ] Privacy Notice and Terms are completed and reviewed
- [ ] A verified operator/support contact and retention process are published
- [ ] Keyboard navigation, mobile layout and major browsers are checked
- [ ] Production deployment and redirect configuration are confirmed

## Project status

PriorProof is under development. The public website and application UI are implemented, and the project is being prepared for a controlled release. Database setup, live authentication, account isolation, storage security, account deletion and legal/privacy readiness require verification in the operator's Supabase and Netlify environments before the service can be described as production-ready.

Do not describe PriorProof as a qualification-awarding, credential-verifying or assessor-certifying service.
