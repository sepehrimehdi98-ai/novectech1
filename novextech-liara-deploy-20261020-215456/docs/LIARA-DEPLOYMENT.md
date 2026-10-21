# Deploy Novextech on Liara's Node.js platform

The repository root is configured for Liara Node.js 24. It has a root `package.json` so Liara's Node builder can install and run the app. The frontend source and server remain in `novextech-liara-deploy-20261020-215456/`; the root build runs the app build and copies its static output to `/dist`, which the server serves at runtime. The app uses SQLite, so run one instance and keep the database on the attached persistent disk at `/data/novextech.sqlite`.

## 1. Check the GitHub connection

Use the existing `novextech` Liara app and its current GitHub connection to `sepehrimehdi98-ai/novectech1` on branch `main`. Do not create another app or repository for this code change. Build from the repository root.

The `liara.json` file selects the Node.js platform, Node 24, port 8787, and disk `novextech-data` mounted at `/data`. The root `package.json` post-install hook runs `npm ci --include=dev` in the nested app folder; the build runs TypeScript/Vite and stages `dist` at the root; the start script launches the existing API server. The server listens on Liara's `PORT` environment variable.

If Liara still identifies the existing app as Docker or rejects the Node deployment, stop before creating another billable app and ask Liara support whether the current app platform can be changed. Repository files cannot change the platform assigned to an already-created Liara app.

## 2. Attach persistent storage

In the existing app, make sure the persistent disk named `novextech-data` is attached at `/data`. The database path must be `/data/novextech.sqlite`. Storage outside `/data` may be ephemeral after a redeploy. Do not scale this SQLite app to multiple instances.

## 3. Set environment variables in Liara

Add these under the app's environment settings:

```dotenv
NODE_ENV=production
APP_ORIGIN=https://novextech.ir
DATABASE_PATH=/data/novextech.sqlite
INITIAL_ADMIN_EMAIL=<your admin email>
INITIAL_ADMIN_PASSWORD=<unique random password, at least 16 characters>
```

Add `OPENROUTER_API_KEY` for Nora when ready. Add the Kavimo settings later when needed:

```dotenv
KAVIMO_TOKEN=<Kavimo server token>
KAVIMO_STREAM_DOMAIN=stream.novextech.ir
KAVIMO_LINE_ID=<optional Kavimo line ID>
```

Keep these values in Liara's secret environment settings. Never commit them to GitHub or put them in a `VITE_` variable. After the first successful boot creates the admin, remove `INITIAL_ADMIN_PASSWORD` from the settings and restart/redeploy if Liara requires it.

## 4. Deploy and verify

The connected `main` branch should deploy through the existing GitHub integration after the GitHub check succeeds. The CI job installs the nested app dependencies, builds the frontend, and runs the test suite. A green GitHub check confirms those steps, but not the Liara runtime or external service credentials.

After Liara reports a successful release, inspect the app logs and verify:

- `/api/health` returns `{"ok":true}`
- `/admin/login` accepts the initial admin credentials
- a draft can be published and its public article loads
- `/robots.txt`, `/sitemap.xml`, and `/llms.txt` load from the production domain
- Nora responds after `OPENROUTER_API_KEY` is configured

Kavimo playback in a blog post uses the public iframe and does not require the management API token. Uploading or browsing the admin video library does need `KAVIMO_TOKEN`. Videos stay on Kavimo and are not stored on Liara.

## Resource and backup notes

The application does not run an AI model locally; AI requests go to OpenRouter, and video files stay on Kavimo. A 1 GB RAM plan is a reasonable starting point for a small pilot, subject to actual usage. Watch memory and restart metrics after real traffic. The database and knowledge corpus should initially be small; article images are external URLs. Back up the Liara disk regularly and test restoring a backup. The SQL files for PostgreSQL are design artifacts only; the running implementation uses SQLite.
