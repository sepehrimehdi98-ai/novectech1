# Novextech website and admin

The Figma-based portfolio has English and Persian interfaces, public articles, an admin editor, a consultation chat, and a Kavimo video workflow. Node.js 24 or newer is required for the built-in SQLite database.

## Run locally

From this folder, run these in two separate terminals:

```powershell
npm install
npm run api
```

```powershell
npm run dev
```

Open http://127.0.0.1:5173. The API runs at http://127.0.0.1:8787 and Vite forwards `/api` requests to it. To check the API directly, visit http://127.0.0.1:8787/api/health. On first API start, the local admin login is written to `.local-admin.txt`; open that file locally and sign in at http://127.0.0.1:5173/admin/login. Keep that file private. Both `.local-admin.txt` and the SQLite `data/` directory are ignored by Git.

## Add credentials

Edit `.env.local` in this folder. Put your OpenRouter key in `OPENROUTER_API_KEY` and your Kavimo management token in `KAVIMO_TOKEN`. `KAVIMO_STREAM_DOMAIN=stream.novextech.ir` is already set. If you use a dedicated Kavimo line, set `KAVIMO_LINE_ID` as well. Restart the API terminal after editing the file. Never put these values in a `VITE_` variable, frontend file, screenshot, or shared ZIP.

The included `.env.example` lists deployment variables without secrets. Keep `.env.local` private.

## Content and video workflow

The admin signs in at `/admin/login`, then sees all articles at `/admin/blogs`. Each article has separate English and Persian title, excerpt, tags and content blocks. Blocks can be reordered by dragging or with the move controls. Available blocks include heading, paragraph, image, video, quote and call to action; their alignment, width and accent are adjustable. Drafts stay private. Publishing exposes an article at `/blog/<slug>` and in the public article list. The language switch changes the interface and selects the matching article language; it does not translate new writing automatically.

The simplest flow is to upload a video in Kavimo, add a Kavimo video block to the blog draft, and paste either the 12-character media ID or Kavimo iframe snippet into the editor. The editor extracts the ID from the approved `https://stream.novextech.ir/<ID>/iframe` URL and never saves or executes pasted HTML or script. The blog page renders the sandboxed iframe directly; publishing and playback do not call Kavimo's management API or require its credentials. Preview the draft and verify the video before publishing. The optional `/admin/videos` library and direct upload still use Kavimo's API and server-side token.

For local Kavimo upload testing, allow `127.0.0.1:5173` (or `localhost:5173`, whichever URL you use) in Kavimo's domain settings. For production, allow `novextech.ir` and any actual `www` origin you serve, and confirm that `stream.novextech.ir` is connected in Kavimo. A Cloudflare DNS record alone does not confirm Kavimo's side of the connection. Try one small upload, wait for the ready state, attach it to a published test article, and verify playback from another browser.

## AI consultation and Nova comparison

The website chat, named Nora, posts visitor messages to `/api/chat`. Its knowledge manager at `/admin/knowledge` stores separate company facts, service descriptions, process guidance, technical explainers, FAQs and confirmed case studies. A bilingual starter library is preloaded with owner-provided company information and cited general guidance for discovery, site structure, responsive/accessibility basics, SEO/performance and security. These starter items are visible and editable in the knowledge manager. New documents are drafts. An admin must complete the approval checklist before they are chunked, embedded and activated. Editing an approved document immediately deactivates its chunks until it is approved again. Case studies require client confirmation; technical explainers require source-reference metadata and a review date. External articles are not copied into Nora's knowledge.

Retrieval normalizes Persian and English text, embeds approved chunks and the visitor's question through OpenRouter's embeddings endpoint, then combines cosine similarity and BM25-style lexical ranking with Reciprocal Rank Fusion. The default embedding model is `baai/bge-m3`. The assistant receives at most four fresh, approved passages. Explicit questions about Novextech services, prices, process and projects are restricted to company-specific documents; ordinary questions about planning a website can use general-industry guidance. If no passage clears the configured relevance threshold, generic consultation questions go to a bounded general-knowledge prompt, while unknown Novextech-specific questions keep the verified bilingual contact fallback. Retrieved passage IDs are returned by the API for future observability. This is request-time retrieval, not model fine-tuning.

The current store is SQLite and keeps small-corpus embeddings as JSON vectors that are scanned in-process. It is not PostgreSQL: `database/postgresql-schema.sql` and `database/postgresql-roles.sql` are migration design artifacts only. The Liara pilot uses SQLite on a persistent Liara disk and should run as one app instance. Published blog posts are deliberately not indexed automatically; an admin must create and approve a knowledge document in Nora's manager. The chat cannot forward a visitor's details, create a lead, or book a call; it directs visitors to Telegram `@Novextech` or `novextech.agency@gmail.com`.

The chat-completion API input was compared with the local Nova educational platform implementation:

| Setting | Nova | Novextech |
| --- | --- | --- |
| Endpoint | `POST https://openrouter.ai/api/v1/chat/completions` | Same |
| Auth | Server-side Bearer key | Same, from `.env.local` |
| Model | `nvidia/nemotron-3-ultra-550b-a55b:free` | Same explicit free variant |
| Provider routing | Fallbacks enabled, throughput priority | Same |
| Reasoning | Disabled | Same |
| `max_tokens` | 900 for tutor chat; other Nova modes differ | 900 |
| Temperature | 0.25 or 0.35 by Nova mode | 0.35 |
| Messages | Tutor/teacher prompt and lesson or student context | Consultation prompt, approved company knowledge, relevant published posts, conversation history |
| Timeout | 90 seconds local, 55 seconds hosted | Same |
| Empty reply | Retry once | Same |

The model name without `:free` is a different paid route, so keep the suffix. The API key is still required for the free route. Provider availability and rate limits can change. The UI shows a service error if the provider is unavailable rather than presenting a made-up answer.

## Checks and deployment

Run `npm test` for API and Kavimo contract tests, and `npm run build` for TypeScript and the frontend build. These use mocks for external providers; they do not prove live Kavimo or OpenRouter access.

The backend is a Node server with SQLite. Static hosting of `dist` alone will not run login, articles, chat or video uploads. The repository root includes a Liara Node.js 24 entry point that installs the nested app dependencies, builds the frontend, stages its static output for the server, and starts the API. Liara mounts the persistent disk at `/data`; SQLite uses `/data/novextech.sqlite`. See `docs/LIARA-DEPLOYMENT.md` for environment setup, GitHub deployment, domain setup, and checks.

Telegram chat integration and automatic lead capture are not implemented. The AI currently serves the website chat only; Telegram would require a bot/webhook and its own credentials. Some original portfolio content and images came from the Figma prototype and should be reviewed for factual accuracy before publishing.

## SEO and public discovery

The home page has a descriptive title, description, canonical URL, Open Graph/Twitter metadata, and Organization/WebSite JSON-LD using confirmed public details. Each published article gets its own server-rendered title, description, canonical URL, Open Graph tags, BlogPosting and BreadcrumbList structured data. `/sitemap.xml` is generated from the home page and published articles; `/robots.txt` points crawlers to it and blocks admin/API paths. `/llms.txt` describes confirmed services and contact channels. A branded social preview image and favicon are included. Admin pages are marked noindex. Unknown URLs return a custom 404 page with an HTTP 404 status. Main site modules are split and loaded when needed.

The schema uses Organization rather than LocalBusiness because Novextech's physical address and phone number have not been supplied. Add LocalBusiness schema only when the real public address/area and contact details are confirmed. The homepage and article pages now offer crawlable English and Persian query URLs (`?lang=fa`), and the sitemap emits reciprocal `hreflang` links. The language switch updates this query, and page metadata/structured data follow it. This is an incremental bilingual SEO step; distinct `/fa/` paths and server-rendered article body content would be more robust for indexing and should be considered after launch.

## Security and hosting preparation

The API sets MIME sniffing, referrer, frame, permissions, and production CSP/HSTS headers. Production cookies require HTTPS and use HttpOnly/SameSite protection; admin mutations require an Origin check and CSRF token. Login, chat, video-list, upload-session, and playback routes have rate limits. IP-based login/chat/playback limits use the socket address by default; set `TRUST_PROXY=1` only when a trusted reverse proxy overwrites `X-Forwarded-For`. The server binds to `0.0.0.0` in production and uses the platform-provided `PORT`.

For Liara, set `APP_ORIGIN=https://novextech.ir`, `DATABASE_PATH=/data/novextech.sqlite`, `NODE_ENV=production`, and temporary `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` values in the host's secret environment settings. The Liara Node.js service uses Node.js 24 and the first-boot admin flow. Remove `INITIAL_ADMIN_PASSWORD` after the first successful boot. Keep the app at one instance while it uses SQLite.

The production CSP allows the Kavimo player and uploader hosts. If Kavimo changes its player hostname or iframe path, update the allowlist/parser and test it. Before launch, confirm the canonical domain and HTTPS certificate, check sitemap/robots over the public domain, review prototype portfolio claims and images, and test login, publishing, AI replies, and video playback on the real domain.
