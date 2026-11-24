# PriorProof

**Your skills deserve recognition.**

PriorProof is an AI-assisted prior learning and competency evidence platform concept. It helps people document skills gained through education, employment, volunteering, apprenticeships, community activities and self-directed learning.

## Current starter release

This repository contains the first working foundation:
- Responsive public homepage
- About and How It Works pages
- Demo sign-in and registration flow
- Dashboard shell and shared navigation
- Browser-local demo data and state
- A working profile editor and experience/evidence quick-add demonstrations

## Run locally

1. Install [Node.js](https://nodejs.org/) (LTS).
2. Open this folder in VS Code.
3. Open the terminal and run:

```bash
npm install
npm run dev
```

4. Open the local URL shown by Vite, usually `http://localhost:5173`.

## Build for deployment

```bash
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Important prototype limitations

- Demo access is not production authentication.
- Data is stored in the current browser using `localStorage`; it is not synchronised across devices or users.
- No official qualification or competency is issued by PriorProof.
- Any future AI analysis must be clearly labelled as a suggestion, explain its basis, and never be represented as independent verification.
- Uploaded evidence files are not yet stored in a secure backend.

Before public production use, connect a secure backend/authentication provider, implement access controls, secure file storage, consent and data deletion workflows.

## Suggested next build milestones

1. Complete experience and evidence management.
2. Build competency mapping and evidence gap analysis.
3. Add portfolio generation and print/PDF support.
4. Add assessor review workflow and immutable review history.
5. Connect secure authentication and persistent database storage.
