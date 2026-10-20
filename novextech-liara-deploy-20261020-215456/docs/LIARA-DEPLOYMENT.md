# Deploy Novextech on Liara

The project is prepared for a single-instance Liara Docker app. `Dockerfile` builds the frontend and runs the Node.js 24 API server; `liara.json` sets the container port and mounts a persistent disk at `/data`; the database file is `/data/novextech.sqlite`. The current app uses SQLite, not PostgreSQL. Do not run multiple app instances against this SQLite database.

## Resource sizing for the first deployment

Start with one app instance and 1 GB RAM if that size is available in your Liara plan. The application does not run an AI model locally; chat and embeddings are sent to OpenRouter, and videos stay on Kavimo. This keeps the app's memory needs modest. A 512 MB instance may be enough for a quiet pilot, but 1 GB gives more headroom for Node.js, SQLite, builds/startup, and concurrent requests. Watch Liara's memory graphs after real traffic and increase the allocation if sustained use approaches 70–80% or the process restarts.

Use the smallest practical persistent disk, with 5 GB as a comfortable starting point if that is the offered size. The SQLite database initially contains small text records and embeddings; article images are currently external HTTPS URLs and videos are stored by Kavimo. The app database should therefore start far below 1 GB. Do not store video files or backups on this disk; back up the database separately and monitor disk growth. These are planning estimates, not measured Liara runtime usage; confirm the available RAM/disk sizes and prices in your account before choosing a plan.

## 1. Put the project in GitHub

Push the project to a private GitHub repository. Confirm that the repository contains `Dockerfile`, `.dockerignore`, and `liara.json` at its root. The ignore files exclude local databases and secrets. Never commit `.env.local`, `.local-admin.txt`, or files from `data/`.

The included GitHub Actions workflow runs tests and a production build on pushes and pull requests. A green check confirms the code builds; it does not deploy the app or verify live OpenRouter/Kavimo credentials.

## 2. Create the Liara app and persistent disk

Create a Docker app in Liara and connect/import the GitHub repository if that option is enabled for your account. Select the intended production branch and build from the repository root so Liara finds the included Dockerfile and `liara.json`. The app name in `liara.json` is `novextech`; change it to the exact Liara app identifier if you chose another name.

Create or attach a persistent disk named `novextech-data` and mount it at `/data` (the path already declared in `liara.json`). Size the disk according to the Liara plan you selected. App container storage outside that mount is temporary; the database must remain on `/data` across redeploys. Kavimo stores the video files, so they do not consume the app disk.

If the GitHub connection is unavailable, use Liara's CLI from a local clone. The Liara CLI documents Docker deploys, the config file, and disk mounts; sign in, select the app, and deploy from the project root. Follow the current Liara dashboard/CLI prompts for the exact disk attachment and build settings.

## 3. Set server environment variables

Set these in Liara's app environment settings. Keep all keys server-side; do not prefix them with `VITE_`.

```dotenv
NODE_ENV=production
APP_ORIGIN=https://novextech.ir
HOST=0.0.0.0
PORT=8787
DATABASE_PATH=/data/novextech.sqlite
OPENROUTER_API_KEY=<your OpenRouter key>
INITIAL_ADMIN_EMAIL=<your admin email>
INITIAL_ADMIN_PASSWORD=<unique random password, at least 16 characters>
```

For Kavimo, add these when ready:

```dotenv
KAVIMO_TOKEN=<Kavimo server token>
KAVIMO_STREAM_DOMAIN=stream.novextech.ir
KAVIMO_LINE_ID=<the Kavimo line that owns the videos, if applicable>
```

Set the public domain to the actual canonical HTTPS origin. If you serve `www.novextech.ir` as a separate origin rather than redirecting it, the app's allowed origins and Kavimo upload domain policy also need to include it.

## 4. First boot and admin account

Deploy and inspect app logs. The server creates the first admin from `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` only when the database has no admin yet. After a successful boot, remove `INITIAL_ADMIN_PASSWORD` from Liara settings and redeploy/restart as required. Sign in at `/admin/login`, store the credential safely, and verify that the session cookie is secure over HTTPS.

Do not set `TRUST_PROXY=1` unless Liara's proxy behavior and the app's client IP handling have been verified. The default rate limiter uses the direct socket address and is per process.

## 5. Connect the domain and smoke-test

Attach `novextech.ir` to the Liara app and follow Liara's DNS and TLS instructions. Verify the certificate and that the canonical host redirects consistently before enabling admin access.

Check `/api/health`, `/robots.txt`, `/sitemap.xml`, and `/llms.txt` on the public HTTPS domain. Then test admin login, create and publish an English/Persian draft article, confirm the public article URL and language switch, and send Nora both a greeting and a website-planning question. Test the Kavimo flow separately after credentials and the stream domain are verified.

## Kavimo dashboard upload fallback

The app already supports linking a video uploaded manually in Kavimo:

1. Upload and wait until Kavimo marks the media ready.
2. Copy the media's 12-character ID from the Kavimo dashboard.
3. Open `/admin/blogs`, edit the intended article, and add a `Kavimo video` block where the video should appear.
4. Paste the ID into `Kavimo media ID`. Add an English and Persian video title, save as a draft, and preview.
5. Preview the draft and confirm playback. The editor accepts either the ID or full Kavimo iframe code, extracts the ID, and generates `https://stream.novextech.ir/<MEDIA_ID>/iframe`. Publishing and playback do not make a Kavimo API request. The optional upload/library tools still need `KAVIMO_TOKEN` and `KAVIMO_STREAM_DOMAIN`.

If the player does not load in the draft preview, confirm the media ID and that Kavimo has finished processing it. The iframe is public, so anyone who can open the published article can watch it; this setup does not provide private video access.

## Backups and scaling

Back up the persistent disk on a schedule and test restoring a copy before launch. Keep an encrypted backup outside the Liara app and account. Do not treat the container image or an ordinary redeploy as a backup. The current SQLite rate limits and database are per app instance. Before scaling beyond one instance or switching to PostgreSQL, implement and test the PostgreSQL store adapter and migration; the SQL files in `database/` alone do not enable PostgreSQL.
