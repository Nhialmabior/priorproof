# PriorProof

**Your skills deserve recognition.**

PriorProof helps people document skills gained through formal education, employment, volunteering, apprenticeships, community activities, entrepreneurship and self-directed learning. It supports evidence organisation, competency mapping, gap analysis and portfolio preparation.

PriorProof is a skills-documentation and prior-learning support platform. It does **not** award qualifications, guarantee formal recognition or replace an authorised assessor.

## Current capabilities

- Responsive public pages and authenticated application
- Email/password and Google sign-in through Supabase Auth
- User workspace persistence in Supabase
- Experience and evidence records
- Private evidence attachments in Supabase Storage
- Competency mapping and evidence gap analysis
- Portfolio and assessment-review preparation
- Account settings, JSON data export and workspace reset controls (permanent account deletion is not implemented)

## Technology

- Vite, vanilla JavaScript and CSS
- Supabase Auth, Postgres and private Storage
- `@supabase/supabase-js`

## Run locally

1. Install Node.js (LTS).
2. Clone the repository and open it in VS Code.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a local `.env` file using `.env.example`:

   ```env
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

   Use the Supabase publishable/anon key only. Never put a service-role key, database password or Google client secret in frontend environment variables.

5. In Supabase SQL Editor, run the complete `supabase/schema.sql` script.
6. Configure Supabase Authentication:
   - Enable Google provider if you want Google sign-in.
   - Set the local Site URL to `http://localhost:5173` while testing locally.
   - Add the exact email-confirmation redirect `http://localhost:5173/app/dashboard` to Authentication → URL Configuration → Redirect URLs. Add the matching `127.0.0.1` URL only if you actually use that host.
   - Keep `/app/dashboard` allowed because email confirmation returns there and the app completes the Supabase PKCE session exchange before opening the workspace.
   - When testing locally, open the email link on the same computer and browser where the Vite server is running; a `localhost` link opened on a phone points to the phone, not your computer.
   - In Authentication → Settings, configure the server-side minimum password length to 12 and enable uppercase, lowercase, number and symbol requirements if those controls are available. The app also checks these requirements before registration and password reset.
   - For Google OAuth, set the authorized redirect URI to the Supabase Auth callback shown in your Supabase Google provider settings.
7. Start the development server:

   ```bash
   npm run dev
   ```

   Open the URL Vite prints, usually `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

Vite creates the production site in `dist/`.

## Deploy to Netlify

1. Push the project to GitHub.
2. In Netlify, import the repository.
3. Set the build command to `npm run build` and publish directory to `dist`.
4. Add the two Vite environment variables from your local `.env` to Netlify's site environment settings.
5. Deploy, then copy your Netlify site URL.
6. In Supabase Authentication URL settings, set the production Site URL to your Netlify URL and add that URL (including the required app routes or wildcard) to the redirect allowlist.
7. If using Google sign-in, keep the Supabase Auth callback as the Google OAuth redirect URI. The user-facing production URL must also be allowed by Supabase.

The `public/_redirects` file provides the Netlify single-page-app fallback so direct route visits resolve to `index.html`.

## Data and trust notes

- Workspace data and uploaded evidence are associated with the signed-in account and protected by Supabase row-level and storage policies.
- Evidence attachments are private; the configured upload limit is 5 MB per file.
- Users should only upload files they have permission to share.
- Self-reported experience, uploaded evidence, reference confirmation and assessor review are different evidence states. A file upload alone is not independent verification.
- Any future AI-generated guidance should be labelled as suggestions and must not be presented as a formal assessment decision.

## Project status

PriorProof is an evolving demonstration product. Test authentication, workspace persistence, evidence upload/download and workspace reset flows in a controlled environment before inviting real users. The current application does not provide permanent self-service account deletion; the service operator must establish and test a secure account-closure and data-deletion process before public launch. Do not claim formal credential recognition or assessor certification.
