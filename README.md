# Novextech

Novextech is a Node.js application with a React/Vite frontend, server-rendered public articles, admin tools, Nora consultation chat, and an optional Kavimo video integration. The app source remains in `novextech-liara-deploy-20261020-215456/`; the repository root now provides the Liara Node.js build and start entry points.

## Liara Node.js deployment

This repository is configured for the Node.js platform. Keep the existing Liara app connected to this repository's `main` branch; no second app or repository is needed. Liara detects the root `package.json`, runs its post-install hook to install the nested app dependencies, builds the frontend, and starts the Node server on Liara's `PORT`.

The root build copies the generated frontend to `/dist`, where the server serves it. `liara.json` selects Node.js 24, port 8787, and the persistent disk named `novextech-data` mounted at `/data`. The database path should be `/data/novextech.sqlite`. Keep the app at one instance while SQLite is in use.

Before the first production start, attach the disk and set these variables in Liara's environment settings:

- `NODE_ENV=production`
- `APP_ORIGIN=https://novextech.ir`
- `DATABASE_PATH=/data/novextech.sqlite`
- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD` (at least 16 characters; remove it after the first successful boot)

Optional server-side values include `OPENROUTER_API_KEY`, `KAVIMO_TOKEN`, `KAVIMO_STREAM_DOMAIN=stream.novextech.ir`, and `KAVIMO_LINE_ID`. Set secrets in Liara only, never in GitHub or frontend variables.

Read [the deployment guide](./novextech-liara-deploy-20261020-215456/docs/LIARA-DEPLOYMENT.md) before first boot. After a successful deployment, test `/api/health`, admin login, publishing a draft, and a public blog page.

## Local checks

From the repository root:

```sh
npm install
npm run build
npm test
npm start
```

GitHub Actions runs the same build and tests on pushes and pull requests.
