# Novextech on ParsPack Linux + cPanel: deployment guide

This guide describes a safe deployment path for the current Novextech website, Nora RAG assistant, blogs, admin panel, and Kavimo integration.

## Read this before creating the production database

The application currently uses Node.js 24's built-in SQLite driver (`node:sqlite`) and stores RAG embeddings as JSON. It does **not** connect to PostgreSQL yet. The SQL in `database/postgresql-schema.sql` is the reviewed target schema for the PostgreSQL + pgvector migration; importing it does not switch the running app to PostgreSQL. Do not put a PostgreSQL URL in the environment and expect the present app to use it.

Two valid deployment milestones:

1. **Immediate pilot on a ParsPack VPS:** install a supported Node.js 24 runtime; run the current app with SQLite on a durable private directory; back it up off-server. This brings the existing site online, but does not meet the planned PostgreSQL/pgvector production architecture.
2. **Recommended production:** complete and test the PostgreSQL store adapter and SQLite-to-PostgreSQL importer, then deploy to PostgreSQL with pgvector. Verify that ParsPack's PostgreSQL service supports pgvector before choosing it for Nora. If it does not, use a VPS-managed PostgreSQL instance with pgvector or another compatible database host reachable over a private network/VPN.

For the system’s Node 24, long-running API, PostgreSQL extensions, and server-side secrets, a Linux VPS with SSH/root and a process manager is the predictable option. cPanel is optional and adds maintenance/licensing overhead. A cPanel account is suitable only if the provider exposes a supported Node application feature with the needed Node version and database access. A basic PHP/shared-hosting cPanel account cannot run the whole app by uploading `dist/`.

## Ask ParsPack support these questions first

Ask these before buying or provisioning:

- Is this a self-managed cloud VPS with root SSH, or managed/shared hosting? Is cPanel/WHM included and licensed?
- Which OS images are supported with your cPanel version? Confirm an actively supported cPanel OS and Node.js **24.x** for Passenger or a persistent Node process.
- Is cPanel's Application Manager enabled? Does the Node process get a persistent writable directory outside the deploy directory?
- Is PostgreSQL provided? Give its host, port, TLS mode, backup/restore policy, and whether it supports `CREATE EXTENSION vector` (pgvector) and `pg_trgm`.
- Can the app reach PostgreSQL through a private network? If remote access is required, can access be restricted to the app host IP and TLS enforced?
- Do the hosting and network terms permit outbound HTTPS calls to OpenRouter and Kavimo from the server?
- What are the backup retention, snapshot, restore-test, and incident-response options?

The PostgreSQL wizard/interface appears only when the provider has installed and configured PostgreSQL and enabled the feature. cPanel's remote database access feature is documented for MySQL/MariaDB; do not assume it configures PostgreSQL access. Have the provider configure PostgreSQL network access and firewall rules.

## Deployment option A: cPanel Application Manager / Passenger

Use this only if all of the following are true: Application Manager is enabled, the host supplies Node.js 24, Passenger supports this Node ESM app, and the app can keep a persistent writable SQLite path. The current app's ES module startup is `server/index.mjs`; configure that exact startup file if the UI allows it. cPanel documentation says Passenger controls the listening port, so validate that the app can use Passenger's assigned port. If the startup checks fail or Node 24 is unavailable, use option B.

1. In cPanel, open **Software → Application Manager** (or the provider's Node.js application selector). Create an application for `novextech.ir` with production mode, Node 24, and a private application root such as `~/apps/novextech`.
2. Upload the release archive or clone the repository into that app root. Keep `.env.local`, `.env`, SQLite files, logs and backups outside the public document root. Do not upload `.local-admin.txt`, local DB files, or real secrets from your development machine.
3. Use cPanel Terminal/SSH in the application root to run `npm ci`, then `npm run build`. Do not run the Vite dev server in production.
4. Set the application environment variables using the cPanel app settings (not a `VITE_*` variable):

   ```text
   NODE_ENV=production
   APP_ORIGIN=https://novextech.ir
   DATABASE_PATH=/home/CPANEL_USER/novextech-data/novextech.sqlite
   TRUST_PROXY=1
   OPENROUTER_API_KEY=...
   RAG_EMBEDDING_MODEL=baai/bge-m3
   KAVIMO_TOKEN=...
   KAVIMO_STREAM_DOMAIN=stream.novextech.ir
   INITIAL_ADMIN_EMAIL=...
   INITIAL_ADMIN_PASSWORD=...
   ```

   Replace `CPANEL_USER` with the actual account username. Set `TRUST_PROXY=1` only when Passenger/Apache is the trusted reverse proxy that overwrites `X-Forwarded-For`; do not set it behind an unknown proxy.

5. Create the durable data directory in SSH/Terminal and restrict permissions:

   ```sh
   mkdir -p "$HOME/novextech-data"
   chmod 700 "$HOME/novextech-data"
   ```

   Confirm the Node app user can write there. If cPanel deployment replaces the application root, this data directory must remain untouched.

6. Add domain `novextech.ir` in cPanel, point DNS A/AAAA records to the server IP, enable AutoSSL/HTTPS, and redirect HTTP to HTTPS. Only add `www` if you intend to serve it; if used, set a redirect/canonical strategy and include its origin in app configuration where needed.
7. Start/restart the app from Application Manager. Confirm the expected URL returns `https://novextech.ir/api/health` with `{"ok":true}` and public `/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` work.
8. Sign into `/admin/login` using the first-boot admin credentials. Immediately remove `INITIAL_ADMIN_PASSWORD` from app settings and restart. Change the password through a secure admin process before broader use.
9. Test drafts, publish/unpublish, bilingual blog views, Nora, Kavimo upload/playback, and admin noindex. Do not announce launch until the recovery test below passes.

If the Node app is mounted under a sub-URI instead of the domain root, verify API and SPA paths; a root deployment on the domain is preferred for this Vite setup.

## Deployment option B: ParsPack VPS with SSH + systemd (recommended if you have root)

This avoids Passenger's Node-version and process constraints. Install an actively supported Linux OS and Node.js 24 from an authenticated package source approved for the server OS. Create a non-root `novextech` service account; configure Nginx/Apache as the HTTPS reverse proxy; keep the Node process bound to localhost and let the proxy expose only ports 80/443. Store production secrets in a root-owned environment file such as `/etc/novextech/novextech.env` with mode `600`, or a secret manager.

1. Build the release in CI or on the host using the lockfile: `npm ci && npm run build`.
2. Put code in `/opt/novextech/current` (read-only to the service account) and persistent SQLite pilot data in `/var/lib/novextech/novextech.sqlite`. Set ownership and permissions so only the service account can read/write the DB directory.
3. Use `NODE_ENV=production`, `APP_ORIGIN=https://novextech.ir`, `HOST=127.0.0.1`, `PORT=8787`, `DATABASE_PATH=/var/lib/novextech/novextech.sqlite`, and the required secrets.
4. Create a systemd unit with `User=novextech`, `Group=novextech`, `WorkingDirectory=/opt/novextech/current`, `EnvironmentFile=/etc/novextech/novextech.env`, `ExecStart=/usr/bin/node server/index.mjs`, `Restart=on-failure`, `RestartSec=5`, `NoNewPrivileges=true`, `PrivateTmp=true`, `ProtectSystem=strict`, `ProtectHome=true`, and `ReadWritePaths=/var/lib/novextech`. Verify sandbox options against the chosen Linux distribution before enabling the service.
5. Run `systemctl daemon-reload`, `systemctl enable --now novextech`, then inspect `systemctl status novextech` and `journalctl -u novextech`.
6. Configure Nginx/Apache TLS and reverse proxy to `127.0.0.1:8787`; set forwarded headers explicitly. Do not open port 8787 publicly. Only set `TRUST_PROXY=1` if the reverse proxy overwrites incoming forwarding headers with the actual client address.
7. Add a firewall allowing SSH from your own IP/VPN plus HTTP/HTTPS; keep PostgreSQL bound to loopback/private network and firewall off public port 5432.

Do not run cPanel and independently hand-edit its managed Apache/Nginx configuration unless you understand cPanel's rebuild lifecycle. If cPanel is installed, use its supported vhost/Application Manager workflow or delegate proxy setup to the administrator.

## Create and import the PostgreSQL database (after the adapter exists)

Use a managed ParsPack PostgreSQL database if it provides PostgreSQL + pgvector and a private app connection. Otherwise, on a VPS, install and secure PostgreSQL using the OS/provider-supported packages. Do not install PostgreSQL manually into a cPanel-managed WHM server without following cPanel's supported PostgreSQL procedure; its docs warn that unsupported install methods are not managed by cPanel.

In cPanel, if available, use **Databases → PostgreSQL Database Wizard** to create the DB and initial owner/user. Use a unique generated password. The wizard grants the user access; phpPgAdmin is for querying/importing, not creating database accounts. Keep the database private to the app host. On a VPS, create the database/user via `createuser`/`createdb` or an authenticated `psql` session, and use SCRAM password auth, TLS where networked, and a firewall allowlist.

Before schema import:

1. Confirm `SELECT version();` and `CREATE EXTENSION vector;` work for the chosen database/user. If extension creation is restricted, ask the provider to enable pgvector; the schema file requires it.
2. Create a private database and separate users: schema/migration owner, API runtime user, and read-only chat user. Follow `database/postgresql-roles.sql` as a policy example, adjusting ownership and least privilege to the actual role model.
3. Apply `database/postgresql-schema.sql` with the migration-owner connection. For a hosted DB, run it from a secure machine using `psql` or the provider's SQL editor. Never place passwords in shell history or commit them.
4. Implement and test the PostgreSQL adapter before pointing production to it. Update environment validation and add a versioned migrations system. Avoid changing SQLite's file-based `DATABASE_PATH` into a connection string by assumption.
5. Export current SQLite data only after the importer is implemented and tested against a copy. Include admins, posts, settings, RAG docs and chunks. Map SQLite's epoch-millisecond `sessions.expires` and `limits.expires` into PostgreSQL timestamps. Verify counts, slugs, bilingual JSON, approved status/checklists, embedding dimensions, RAG retrieval, and blog publish behavior before cutover.
6. Reindex RAG documents from their canonical approved text using the configured embedding model. Do not trust a JSON-to-vector cast until each vector is validated for 1024 dimensions and the correct embedding model. The schema defaults to 1024 dimensions for BGE-M3; changing embedding model/dimensions requires a deliberate migration and re-embedding.
7. Cut over in a maintenance window: take final backups, stop writes, import delta/final snapshot, compare row counts and test API, switch app database config, smoke-test, then retain a restorable SQLite snapshot. Do not delete the old DB until restore and rollback have been exercised.

## Backups and recovery

For the immediate SQLite pilot, stop or quiesce the app for a clean file-level copy, or use SQLite's online backup mechanism. Copying only the `.sqlite` file while WAL writes are active can omit recent data because committed pages may still be in the `-wal` file. Store encrypted backups off the VPS in a different provider/account. Back up secrets separately in a password manager/secret manager, never beside a public web root. Run a restore drill to a separate test DB monthly and before releases.

For PostgreSQL, take scheduled provider snapshots plus logical `pg_dump` backups encrypted and copied off-host; test `pg_restore` into an isolated database. Include the schema and roles/migration version, but keep secrets out of backup archives. Define recovery point and recovery time targets before accepting customer leads or publishing frequently.

## SEO checks before launch

- Set `APP_ORIGIN` to the exact canonical HTTPS origin. Test that the homepage, each published article, and 404 return the correct title, description, canonical URL, status code and language.
- The current article renderer supports `?lang=fa` metadata; crawlers need a crawlable language URL and visible matching page content. The app still stores English/Persian under the same slug and needs dedicated `/fa/` routes plus reciprocal `hreflang` before claiming complete bilingual indexing.
- Verify `/robots.txt`, `/sitemap.xml`, `/llms.txt`, favicon, page titles, one useful H1 per page, descriptive image alt text, internal links, and no placeholder copy. Submit sitemap in Google Search Console and Bing Webmaster Tools when domain ownership is verified.
- Add article `datePublished`, author, and image metadata once the editor stores trustworthy values. Keep Article/Breadcrumb JSON-LD consistent with visible page content. Organization schema is appropriate with confirmed company details; use LocalBusiness only after a real address/service-area and public contact are confirmed.
- Reduce JS by measuring actual production chunks (Lighthouse/Web Vitals); do not remove features based on bundle size alone. Consider SSR/prerendering if search/social crawlers do not receive article body content.
- Do not promise ranking. SEO files improve discovery and interpretation; rankings depend on useful original content, crawlability, site performance, links and competition.

## Security hardening checklist

- Use HTTPS only, HSTS after confirming all subdomains are HTTPS, secure cookies, a strong unique admin password, MFA at the provider/cPanel/SSH layer, and no shared admin accounts. Current app has one initial admin bootstrap path; remove the bootstrap password immediately after the first successful boot.
- SSH: disable password/root login where operationally possible, use SSH keys, restrict source IP/VPN, update OS regularly, and keep cPanel/WHM behind an allowlist or VPN. Apply provider security updates and enable automatic security notifications.
- Firewall: expose only SSH from trusted sources and HTTP/HTTPS; never expose the app's internal Node port or PostgreSQL publicly. For remote DB use a private network, TLS and an explicit single-host allowlist.
- Secrets: store OpenRouter/Kavimo/database keys in hosting secrets or a `600` root-owned environment file. Never use frontend `VITE_` variables, Git, ZIP files, ticket screenshots, or public logs. Rotate them after accidental exposure and on staff changes.
- Database: least-privilege users, no superuser for the app, separate read-only chat role, prepared statements, backups encrypted offsite, tested restores, extension/OS patching, and access logs. Restrict DB admin tools such as phpPgAdmin to the operator IP/VPN and remove or disable them when not needed.
- App: keep Node/dependencies patched; run `npm audit` and review production dependency advisories; cap request body sizes (already capped at 200 KB), validate all content, escape rendered HTML, use CSP/HSTS/security headers, origin+CSRF checks, secure cookies, and rate limiting. Do not blindly trust client-supplied proxy headers.
- Rate limits: the app can trust `X-Forwarded-For` only when `TRUST_PROXY=1`. Set it only behind Passenger/Nginx/Apache configured to overwrite the header; otherwise keep it off. Per-process SQLite rate limits are not shared across multiple app instances; use Redis or DB-backed atomic limits before horizontal scaling.
- cPanel: keep app root, secrets, SQLite/PostgreSQL backups, and runtime data outside `public_html`; disable directory listing; ensure uploaded artifacts cannot execute as scripts. Keep cPanel packages current and restrict panel logins.
- Monitoring: alert on repeated login failures, server 5xx, disk pressure, DB connection failures, backup failures, and OpenRouter/Kavimo failures. Avoid logging full visitor messages, credentials, session cookies or tokens. Set log retention and review it.
- Recovery: rehearse restoring a database and redeploying the previous release. A server snapshot alone is not a verified backup.

## Release smoke tests

```sh
npm ci
npm test
npm run build
```

After deploy, verify `/api/health`, anonymous draft isolation, admin login/logout, blog create/edit/publish/unpublish, `/blog/<slug>` metadata in English, `/blog/<slug>?lang=fa` metadata, sitemap contents, robots rules, custom 404 status, Nora answers in English and Persian from approved context, and Kavimo upload/playback. Re-run the app behind the actual proxy and confirm login/chat rate limiting sees separate client IPs. Verify an actual restore into a fresh environment.
