# Pushing PortiAI to your GitHub repository

The project is already a git repository inside the workspace: branch `main`, 2 commits, 121 tracked
files, clean working tree, and **no `.env` files or secrets tracked**. You only need to move it to your
machine and add your remote.

Two ready-made archives sit next to the project folder:

| File | What it is | Use it when |
| --- | --- | --- |
| `portiai.zip` (5.1 MB) | Full project **including `.git`** (history preserved), excluding `node_modules`, `.env`, `dist`, local database | You want the simplest route |
| `portiai.bundle` (2.6 MB) | A git bundle — a single file you can `git clone` (history preserved) | You prefer git-native transfer, or the zip is blocked |

Both were verified: the zip unzips to a clean tree with 2 commits on `main` and 121 tracked files; the
bundle clones to the same history.

---

## Route A — zip (recommended)

1. **Download `portiai.zip`** from the workspace file viewer.
2. Unzip and move the folder wherever you keep projects:

   ```bash
   unzip portiai.zip -d ~/projects
   cd ~/projects/portiai
   git log --oneline          # expect the 2 existing commits
   git status                 # expect: nothing to commit, working tree clean
   ```

3. **Create the empty repository on GitHub** — <https://github.com/new>
   * Repository name: `portiai`
   * Visibility: your choice (public is usual for a college submission)
   * **Do not** tick "Add a README file", ".gitignore" or "Choose a license" — an initialised repo
     would give you a commit that conflicts with your local `main`.
4. **Add the remote and push** (see [Authentication](#authentication) below):

   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/portiai.git
   git push -u origin main
   ```

5. Confirm on github.com that the file list matches, and that `server/.env` and `client/.env` are
   **absent** (only the `.env.example` files should be there).

## Route B — git bundle

```bash
# download portiai.bundle, then:
git clone ~/Downloads/portiai.bundle portiai
cd portiai
git remote remove origin                     # bundle origin is a local path
git remote add origin https://github.com/<YOUR-USERNAME>/portiai.git
git push -u origin main
```

Cloning a bundle keeps the original commit messages, dates and author. To tidy the author identity
before pushing:

```bash
git rebase -r --root --exec 'git commit --amend --no-edit --reset-author'
```

## Route C — one clean commit (if you would rather not keep my commit history)

```bash
unzip portiai.zip -d ~/projects
cd ~/projects/portiai
rm -rf .git
git init -b main
git add -A
git commit -m "PortiAI — AI-powered portfolio builder and analyzer"
git remote add origin https://github.com/<YOUR-USERNAME>/portiai.git
git push -u origin main
```

---

## Authentication

GitHub no longer accepts your account password over HTTPS.

**Option 1 — Personal Access Token (quickest)**

1. GitHub → Settings → Developer settings → **Personal access tokens → Tokens (classic)** →
   *Generate new token*.
2. Scope: tick **`repo`** (that is all this project needs). Set an expiry.
3. Copy the token (shown once) and use it as the password when git asks:

   ```bash
   git push -u origin main
   # Username: <your-github-username>
   # Password: <paste the token>
   ```

   To avoid retyping, cache it:

   ```bash
   git config --global credential.helper store   # or: manager / osxkeychain
   ```

**Option 2 — SSH key**

```bash
ssh-keygen -t ed25519 -C "you@example.com"     # press Enter through the prompts
cat ~/.ssh/id_ed25519.pub                      # paste this into GitHub → Settings → SSH and GPG keys
ssh -T git@github.com                          # expect: "Hi <user>! You've successfully authenticated"
git remote add origin git@github.com:<YOUR-USERNAME>/portiai.git
git push -u origin main
```

---

## Before you push (30-second checklist)

```bash
# 1. Nothing sensitive is tracked
git ls-files | grep -E '(^|/)\.env$'          # must print nothing
git grep -nI "AIza" -- . | grep -v "not-a-real-key"   # must print nothing

# 2. Build output and dependencies are ignored
git status --porcelain                        # must be empty

# 3. Your identity is sensible on the commits
git config user.name  "Your Name"
git config user.email "you@example.com"
```

`node_modules` is not in the archive, so after cloning run:

```bash
cd server && npm install && cp .env.example .env    # then fill in the values
cd ../client && npm install && cp .env.example .env
```

---

## Common problems

| Message | Cause | Fix |
| --- | --- | --- |
| `Support for password authentication was removed` | You typed your GitHub password | Use a Personal Access Token or SSH (above) |
| `remote: Repository not found` / `403` | Wrong URL, or the token lacks the `repo` scope | Check the URL case-sensitively; regenerate the token with `repo` |
| `src refspec main does not match any` | You are on a different branch name | `git branch -M main` then push again |
| `Updates were rejected because the remote contains work you do not have` | You let GitHub create a README/license | `git pull --rebase origin main` then `git push -u origin main` (or, if the remote only has that one auto-generated commit: `git push -u --force origin main`) |
| `fatal: refusing to merge unrelated histories` | Remote was initialised separately | `git pull origin main --allow-unrelated-histories`, resolve, push |
| Push hangs or is very slow | Large files | This repo is ~3 MB of source plus screenshots; if you add a database dump later, keep it out of git |
| `Permission denied (publickey)` | SSH key not added to the agent/account | `ssh-add ~/.ssh/id_ed25519`, re-check `ssh -T git@github.com` |

---

## After the push — connect the free hosts

Both platforms deploy straight from the repository:

* **Render (API)** — New → Blueprint, pick the repo; `render.yaml` defines the service with root
  directory `server`. Add `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_URL` in the dashboard.
* **Vercel (frontend)** — Add New → Project, pick the repo, **set Root Directory to `client`**,
  framework preset Vite, and add `VITE_API_BASE_URL=https://<your-api>.onrender.com/api`.

Full walkthrough with the post-deploy checklist: [`DEPLOYMENT.md`](DEPLOYMENT.md).

## If you ever commit a secret by mistake

1. Revoke the key immediately (Gemini key in AI Studio, Atlas database user password, GitHub token).
2. Remove it from the working tree and add the file to `.gitignore`.
3. If it was pushed, treat the value as public: rewriting history
   (`git filter-repo` / BFG) only helps after rotation, because clones and forks may already hold it.

This repository contains no real credentials — only placeholders such as `your_gemini_api_key`,
`USER:PASSWORD` in documentation, and one deliberately invalid key in the testing notes.
