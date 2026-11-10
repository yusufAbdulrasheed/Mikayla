# Deploying: backend on Render, frontend on Vercel

The order matters: **GitHub → (Atlas + Cloudinary checks) → Render → Vercel → back to Render → test.**
Total cost: free (see "Free plan limits" at the bottom).

```
Visitor / Mikayla's browser
   │
   ├─► Vercel  (the website: React)            https://<project>.vercel.app
   │        │  calls the API directly (VITE_API_URL)
   └────────▼
        Render (the backend: Express)          https://<service>.onrender.com
              ├─► MongoDB Atlas  (all text content)
              └─► Cloudinary     (all photos, videos, PDFs)
```

---

## 0. Before you start: what you need

| Thing | Where | You need |
|---|---|---|
| GitHub account | github.com | an empty repository for this project |
| Render account | render.com | sign up with GitHub (easiest) |
| Vercel account | vercel.com | sign up with GitHub |
| MongoDB Atlas | cloud.mongodb.com | the cluster you already use |
| Cloudinary | cloudinary.com | the account you already use |
| The values in `server/.env` | your computer | you will copy them into Render (never into GitHub) |

---

## 1. Put the project on GitHub

Render and Vercel both deploy from a GitHub repository.

1. On github.com, click **New repository**. Name it e.g. `mikayla-portfolio`. Choose **Private**. Do **not** add a README or .gitignore (the project has them).
2. In a terminal, in the project folder (`mikal`):
   ```
   git init
   git add .
   git status
   ```
3. **Read the `git status` list.** It must NOT contain `server/.env`, `server/data`, `server/uploads`, `node_modules` or `client/dist`. (`.gitignore` already excludes them. If you ever see `.env` listed, stop and tell me.)
4. Then:
   ```
   git commit -m "Mikayla portfolio"
   git branch -M main
   git remote add origin https://github.com/<your-username>/mikayla-portfolio.git
   git push -u origin main
   ```
   If GitHub asks you to sign in, use the browser window it opens (or a Personal Access Token as the password).

I scanned the project for your real keys and passwords and found none in any file that would be committed.

---

## 2. Check MongoDB Atlas (the #1 cause of a failed deploy)

Render's servers have addresses that change, so Atlas must accept connections from anywhere.

1. Atlas → **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) → Confirm.
   (This is normal for Render's free plan. Your data is still protected by the database username and password. Render's paid plans have fixed addresses if you later want to lock this down.)
2. Atlas → **Database Access**: your database user must have **Read and write to any database**.
3. Your `MONGODB_URI` must have no `<` `>` brackets, no quotes, and the password must be URL-safe. If the password has symbols like `@ : / ? # %`, they must be percent-encoded (e.g. `@` → `%40`), or simply reset the password to letters and numbers.
4. **Heads-up:** your local `npm run dev` uses this same database. So testing on your computer changes the real website's content. For safe experiments, add `MONGODB_DB=mikayla-dev` to your local `server/.env` (it creates a separate empty test database).

The content is already in Atlas (I copied it earlier), so the deployed site will show the same content.

---

## 3. Deploy the backend on Render

1. Render dashboard → **New +** → **Web Service** → connect your GitHub repo.
2. Fill in exactly:

| Field | Value |
|---|---|
| Name | `mikayla-api` (this becomes part of the address) |
| Region | the one closest to you / your Atlas region |
| Branch | `main` |
| **Root Directory** | `server`  ← easy to forget, and the deploy fails without it |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | `Free` |

3. Open **Advanced** and set **Health Check Path** to `/api/health`.
4. Add these **Environment Variables** (copy the values from your local `server/.env`):

| Key | Value | Notes |
|---|---|---|
| `NODE_VERSION` | `22` | |
| `NODE_ENV` | `production` | |
| `MONGODB_URI` | your Atlas connection string | |
| `CLOUDINARY_URL` | `cloudinary://<key>:<secret>@<cloud_name>` | one line. (Or the 3 separate `CLOUDINARY_*` values) |
| `ADMIN_PASSWORD` | the admin password | if Mikayla already changed it inside the admin, her new one is stored in the database and wins |
| `SESSION_SECRET` | a long random string | make one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CLIENT_ORIGIN` | leave **empty for now** | you will fill it in at step 5 |
| `KEEP_ALIVE` | `true` | stops the free server from sleeping (see "Keeping the free server awake" below) |

   **Do NOT add `PORT`.** Render sets it itself, and the server already listens on it. Setting your own can make the deploy fail with "no open port detected".

   (`render.yaml` in the project describes this same service if you prefer **New + → Blueprint**.)

5. Click **Create Web Service**. The first build takes a few minutes.
6. When it says **Live**, open `https://<your-service>.onrender.com/api/health`. You must see:
   ```
   {"ok":true,"db":true}
   ```
   `"db":true` means MongoDB works. In the Render **Logs** you should also see `MongoDB connected` and `Cloudinary connected`.
   If you see `"db":false`, go back to step 2 (Atlas network access / password).

Copy your Render address, e.g. `https://mikayla-api.onrender.com`.

---

## 4. Deploy the frontend on Vercel

1. Vercel dashboard → **Add New… → Project** → import the same GitHub repo.
2. Configure:

| Field | Value |
|---|---|
| Framework Preset | `Vite` (auto-detected) |
| **Root Directory** | `client`  ← click **Edit** and choose the `client` folder. Required |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |

3. Open **Environment Variables** and add (for **Production**, and **Preview** too):

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://mikayla-api.onrender.com` (your Render address, **no trailing slash**) |

   This value is baked in when the site is built, so if you ever change it you must **Redeploy**.

4. Click **Deploy**. When done you get an address like `https://mikayla-portfolio.vercel.app`.

(`client/vercel.json` makes `/admin` and story links keep working when refreshed. It's already in the project.)

---

## 5. Connect them (the step people forget)

The backend only accepts browser calls from websites it has been told about.

1. Render → your service → **Environment** → set
   `CLIENT_ORIGIN` = `https://mikayla-portfolio.vercel.app`
   (exactly the Vercel address, **no trailing slash**). For several addresses, separate with commas, e.g. your custom domain too.
2. Save. Render restarts the service by itself (about a minute).

---

## 6. Test it (checklist)

1. Open the Vercel address. The site loads with her content and photos.
2. Open `/admin`, sign in. Dashboard shows a green "stored safely on Cloudinary" banner in **Media library**.
3. Change a heading and save. Open the public site in a second tab: it should update **by itself, without refreshing**.
4. Upload a photo and a short video; check they appear.
5. Send a message from the contact form, then find it under **Messages**.
6. On your phone (especially an iPhone/Safari), sign in to `/admin`. It works because the login does not rely on cookies.
7. Refresh on `/admin` and on a story page. Neither should show a 404.

---

## If something fails

| What you see | Most likely cause | Fix |
|---|---|---|
| Render build fails: `ENOENT package.json` | Root Directory not set | Render → Settings → Root Directory = `server` |
| Render: "No open ports detected" | You set a `PORT` variable | Delete `PORT` from Render's env vars |
| `/api/health` says `"db":false` | Atlas blocks Render, or bad password/URI | Step 2 (Network Access `0.0.0.0/0`, URL-encode the password, no quotes/brackets) |
| Site shows "We couldn't load the site" | `VITE_API_URL` missing or wrong; or Render is waking up | Check the variable, then **Redeploy** Vercel. If it just woke, wait up to a minute |
| Browser console: *blocked by CORS policy* | `CLIENT_ORIGIN` doesn't match the Vercel address exactly | Fix it on Render (no trailing slash, `https://`). Preview deployments have different addresses: add them |
| Vercel build fails / blank page | Root Directory not `client` | Vercel → Settings → General → Root Directory |
| `/admin` gives 404 after refresh | `client/vercel.json` missing, or wrong Root Directory | Make sure the file is committed and Root Directory is `client` |
| Admin password "stopped working" | She changed it inside the admin; the database copy wins | Use her new password. (Lost it? Ask me for a reset method) |
| Photos missing after deploy | Links still point at a local `/uploads/` folder | Admin → Media library → "Move them to Cloudinary" (already done for your current content) |
| Book PDF link gives an error | Cloudinary blocks PDF delivery by default | Cloudinary → Settings → Security → enable **PDF and ZIP files delivery** |
| First visit after a quiet spell is slow | Render's free plan puts the server to sleep | Normal. The page says "Waking the website up…". See below |

Render **Logs** tab shows what the server is doing. It is the first place to look.

---

## Free plan limits you should know

- **Render free sleeps after 15 minutes without traffic.** The next visitor waits up to about a minute while it wakes. Setting `KEEP_ALIVE=true` (below) avoids that. Render's paid plan (about $7/month) is the dependable fix.
- **Render's free disk is temporary.** That is fine here because content is in Atlas and files are in Cloudinary. Never rely on the server's own disk.
- **Cloudinary free** limits: photos/files up to 10 MB, videos up to 100 MB, and a monthly bandwidth/storage allowance. Long videos are better as a YouTube link.
- **Atlas M0 free** is plenty for this site (512 MB).

## Keeping the free server awake

Set `KEEP_ALIVE=true` on Render (it is already in `render.yaml`). Every 10 minutes the server requests its own public address,
`/api/health`, which counts as incoming traffic and resets Render's 15 minute idle timer. The code is `server/src/keepAlive.js`.

- **Check it:** in Render's **Logs** you should see `[keep-alive] running: pinging https://<service>.onrender.com/api/health every 10 min`.
  It stays quiet after that and logs again only if pings start failing or recover.
- **It only helps while the server is awake.** After a deploy or restart it starts awake, then keeps itself up. If it ever does fall asleep
  (for example Render restarts it), the next visitor wakes it and the pinging resumes.
- **It uses your free hours.** A free workspace gets about 750 instance hours a month, which covers **one** service running all month.
  A second free web service in the same workspace would push you over the limit.
- **It is an unofficial workaround.** Render documents that free services sleep without incoming traffic. It does not promise that
  self-requests will always count. If it ever stops working, the paid plan is the answer (then delete `KEEP_ALIVE`).
- **Alternative that doesn't depend on the server:** a free uptime monitor (for example UptimeRobot or cron-job.org) set to request
  `https://<service>.onrender.com/api/health` every 5 to 10 minutes. A scheduled GitHub Actions job is a poor fit for a private repository
  because every run uses billable minutes.
- **Before a client meeting** (if you chose not to use keep-alive), open `https://<service>.onrender.com/api/health` a minute earlier to wake it.

## Keeping it safe

- Change the admin password in **Admin → Account** after the first login on the live site.
- If a key or password is ever pasted somewhere public, rotate it (Atlas user password, Cloudinary API secret, `SESSION_SECRET`) and update Render.
- Anyone can open `/admin`, but it needs the password. Login attempts are rate-limited.
- Each Git push to `main` redeploys both Render and Vercel automatically.
