#!/usr/bin/env bash
# Push this repository to a GitHub repository you own.
#
#   ./push-to-github.sh https://github.com/<you>/portiai.git
#   ./push-to-github.sh git@github.com:<you>/portiai.git        # SSH
#   ./push-to-github.sh https://github.com/<you>/portiai.git main
#
# Run it from the project root. It refuses to push if a .env file is tracked,
# then sets (or corrects) the "origin" remote and pushes the branch.
set -euo pipefail

REPO_URL="${1:-}"
BRANCH="${2:-main}"

if [[ -z "$REPO_URL" ]]; then
  echo "Usage: $0 <github-repo-url> [branch]" >&2
  echo "Example: $0 https://github.com/yourname/portiai.git" >&2
  exit 2
fi

cd "$(dirname "$0")"

# --- pre-flight checks -------------------------------------------------------
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "✗ This directory is not a git repository." >&2
  exit 1
fi

if git ls-files --error-unmatch .env >/dev/null 2>&1 \
   || git ls-files | grep -qE '(^|/)\.env$'; then
  echo "✗ A .env file is tracked. Remove it before pushing:" >&2
  echo "    git rm --cached <path>/.env && git commit -m 'remove env file'" >&2
  exit 1
fi
echo "✓ no .env files tracked"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "! Working tree has uncommitted changes; committing them first."
  git add -A
  git commit -m "chore: pre-push snapshot" >/dev/null
fi
echo "✓ working tree clean"

if ! git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  echo "✗ Branch '$BRANCH' does not exist. Current branch: $(git branch --show-current)" >&2
  exit 1
fi
git checkout "$BRANCH" >/dev/null 2>&1 || true

if ! git config user.email >/dev/null; then
  echo "! No git identity configured. Set one, then re-run:"
  echo "    git config user.name  \"Your Name\""
  echo "    git config user.email \"you@example.com\""
  exit 1
fi

# --- remote ------------------------------------------------------------------
if git remote get-url origin >/dev/null 2>&1; then
  CURRENT="$(git remote get-url origin)"
  if [[ "$CURRENT" != "$REPO_URL" ]]; then
    echo "→ Replacing existing origin ($CURRENT)"
    git remote set-url origin "$REPO_URL"
  else
    echo "✓ origin already set to $REPO_URL"
  fi
else
  git remote add origin "$REPO_URL"
  echo "✓ origin added"
fi

# --- push --------------------------------------------------------------------
echo "→ Pushing '$BRANCH' to $REPO_URL"
echo "  (HTTPS asks for your GitHub username and a Personal Access Token as the password)"
if git push -u origin "$BRANCH"; then
  echo
  echo "✓ Pushed. Repository: ${REPO_URL%.git}"
  echo "  Next: connect Render (rootDir: server) and Vercel (rootDir: client)."
  echo "  See docs/DEPLOYMENT.md."
else
  echo
  echo "✗ Push failed. Common fixes:" >&2
  echo "  • 'Repository not found'      → check the URL, and that the token has the 'repo' scope" >&2
  echo "  • 'rejected ... fetch first'  → git pull --rebase origin $BRANCH, then re-run" >&2
  echo "  • 'refspec does not match'    → git branch -M $BRANCH, then re-run" >&2
  echo "  • password auth error         → use a Personal Access Token, not your account password" >&2
  exit 1
fi
