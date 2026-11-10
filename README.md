# Mikayla Barigboma: MERN portfolio

A magazine-cover portfolio (magenta, blush pink, deep plum) with a private **admin area** where the owner
edits everything herself: text, photos, videos, books, stories and social links. No code needed.

- `client/`: React + Vite. The public site, plus the admin at `/admin`
- `server/`: Express API, login, uploads. Content is stored in MongoDB, or in a local file if no database is set

## Run it
```
npm run install:all
npm run dev        # site http://localhost:5173   api http://localhost:5001
```
**First run:** the server generates a strong admin password and prints it in the terminal (a box labelled
"ADMIN LOGIN"). It's also saved in `server/.env` as `ADMIN_PASSWORD`. Open `/admin`, sign in, and change it under
**Account**.

## The admin (`/admin`)
| Section | What admin can do |
|---|---|
| Website text & cover | Name, email, cover photo and quote, about text and photo, nursing section, every heading, scrolling words, **social links**, footer, Google title/description |
| Stories | Write, edit, hide (draft) or delete stories, with a cover photo |
| Photos | Upload many at once, caption, reorder, hide |
| Videos | Upload a video file **or** paste a YouTube/Vimeo link (other links open in a new tab) |
| Books | Cover, status (available / coming soon / free), buy link, downloadable PDF or EPUB |
| Services | The "Work with me" cards |
| Messages | Contact-form messages, with an unread badge and reply-by-email |
| Media library | Everything uploaded, whether it's in use, copy link, delete |
| Account | Change password, sign out |

Videos and Books sections only appear on the site once there is something published in them.

## Where things are stored
- **Content (text, stories, settings):** MongoDB if `MONGODB_URI` is set in `server/.env`; otherwise `server/data/db.json`.
- **Photos, videos, PDFs/EPUBs:** **Cloudinary** once its keys are in `server/.env` (see below); otherwise the local
  `server/uploads/` folder. Allowed types only: JPG/PNG/WebP/GIF/AVIF, MP4/WebM/MOV, PDF/EPUB (no SVG).
- **Back up** `server/data/` (and `server/uploads/` if you use local storage). Both are git-ignored.
- `npm run seed -- --yes` resets all editable content back to the starter text (keeps messages and the password).
- `DATA_DIR` / `UPLOADS_DIR` in `.env` move those folders (e.g. onto a persistent disk on a host).

## MongoDB (text content in the cloud)
Put your Atlas connection string in `server/.env` as `MONGODB_URI=`. The content goes into a database called `mikayla`
(override with `MONGODB_DB`, or name a database in the string yourself). The terminal prints "MongoDB connected" at startup.
- **Switching from the local file:** run `npm run migrate:db` once to see what would be copied, then
  `npm run migrate:db -- --yes`. It copies stories, settings, photos, videos, books, messages and the admin password into
  MongoDB and only *reads* `server/data/db.json`, which stays as a backup. Do this **before** the first start with
  `MONGODB_URI` set, otherwise the site shows the starter text because the database is empty.
- If the server can't reach MongoDB it falls back to the local file and says so in the terminal.
- If you see `querySrv ECONNREFUSED`, your network blocks the `mongodb+srv://` lookup. In Atlas choose *Connect > Drivers* and an
  older driver version to get the plain `mongodb://` string, or switch the computer's DNS to 8.8.8.8. Atlas must also allow your IP.

## Cloudinary (cloud storage for all media)
1. Create a free account at cloudinary.com. On the **Dashboard**, copy your **Cloud name**, **API key** and **API secret**.
2. Put them in `server/.env` (either form works):
   ```
   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   ```
   or
   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
3. Restart the server. The terminal says "Cloudinary connected", and the admin's **Media library** shows a green
   "stored safely on Cloudinary" banner. From then on **every upload goes to Cloudinary** and the site stores its `https://` link.
   Everything lives in a `mikayla/` folder in her account (`CLOUDINARY_FOLDER` to change it).
4. **Existing files:** anything uploaded before this step stays on the computer. The Media library shows a
   **"Move them to Cloudinary"** button that uploads them and fixes the links (the local copies are kept as a backup).

Notes: the default size limits follow Cloudinary's free plan (photos 10 MB, files 10 MB, videos 100 MB). Raise them with
`MAX_IMAGE_MB`, `MAX_DOC_MB`, `MAX_VIDEO_MB` if you upgrade. If PDF links won't open, enable **Settings > Security >
"PDF and ZIP files delivery"** in Cloudinary. If the keys are wrong, uploads fail with a clear message; they never silently fall
back to the local disk, so her files never end up split across two places. Photos are delivered resized and in the best
format for each visitor's browser automatically.

## Live updates (no manual refresh)
When she saves anything in the admin, every open copy of the website updates by itself within about a second: text, photos,
stories, videos, books, links. It uses Server-Sent Events (`/api/events`), which reconnect on their own, and a page that was
asleep (a phone in a pocket) re-checks when it wakes. Visitors do not need to do anything.
If you put the site behind a proxy (nginx, a CDN), make sure it doesn't buffer `/api/events` (the server already sends the
`X-Accel-Buffering: no` header).

## Security notes
- One admin password. Login is rate-limited (7 wrong tries, then a 10 minute wait) and uses an `httpOnly`, same-site cookie.
- Everything the admin saves is validated server-side: unknown fields are dropped, text is length-capped, and links must be
  `https://`, `mailto:` or an upload (no `javascript:`).
- Use HTTPS in production. Keep `server/.env` private.

## Deploying (Render + Vercel)
See **[DEPLOY.md](DEPLOY.md)** for the step-by-step guide, the exact settings and environment variables, a test checklist and fixes for the usual failures.
In short: backend = `server/` on Render (`render.yaml`), frontend = `client/` on Vercel with `VITE_API_URL` pointing at the Render address,
and `CLIENT_ORIGIN` on Render set to the Vercel address. The admin login works across the two domains (token header, no cookies needed).

## Production
```
npm run build && npm start      # Express serves client/dist, /admin, /uploads and the API on one port (5001)
```
**Important for hosting:** free hosts (Render, Railway, etc.) often have a temporary disk, so a local `db.json`
(and local uploads) can vanish on redeploy. For a real deployment: use **MongoDB Atlas** (`MONGODB_URI`) for content and
**Cloudinary** for media. With both set, nothing important lives on the host's disk.

## Edit the code
```
client/src/
  pages/ components/        the public site (Home, Hero, Videos, Books, ...)
  lib/                      api.js, SiteContext.jsx (loads site text from the API), text helpers
  admin/                    AdminApp.jsx, pages/, ui.jsx (form fields), configs.js (what's editable), admin.css
server/src/
  routes/api.js             public API        routes/admin.js   protected admin API
  store.js                  file / MongoDB storage    schemas.js   validation whitelists
  auth.js  config.js  data/defaults.js (starter content)
  media.js (upload handling)   storage/ (local.js, cloudinary.js: pick one)   migrate.js (local -> Cloudinary)
  events.js (live updates)
```
- **Add or change an editable field:** edit `client/src/admin/configs.js` (the form) and `server/src/schemas.js`
  (the validation), then use it in the public component.
- **Starter text** lives in `server/src/data/defaults.js`.
- Colors and fonts: CSS variables at the top of `client/src/styles.css`.
