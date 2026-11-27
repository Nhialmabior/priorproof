import { defineConfig } from 'vite';

// GitHub Pages hosts this project under /priorproof/.
// Netlify serves it from the domain root, so it must use / instead.
const base = process.env.GITHUB_ACTIONS === 'true' ? '/priorproof/' : '/';

export default defineConfig({ base });
