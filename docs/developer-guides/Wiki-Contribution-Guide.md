# Wiki Contribution Guide

_How to edit the UMTAS documentation and have it auto-deploy to GitHub Pages._

---

## Prerequisites

These are one-time setup steps every dev needs to do.

### 1. Clone the main repo with submodules

```bash
git clone --recurse-submodules https://github.com/COS301-SE-2026/UMTAS.git
cd UMTAS
```

> If you already cloned without `--recurse-submodules`, run:
>
> ```bash
> git submodule update --init --recursive
> ```

---

### 2. Install the GitHub CLI and authenticate

```bash
# macOS
brew install gh

# Then authenticate
gh auth login
```

Follow the prompts — select **GitHub.com → HTTPS → Login with a web browser**.

---

### 3. Install the auto-deploy hook

The hook lives in `.git/` which is not committed, so every dev needs to run this once:

```bash
cp .git/modules/wiki/hooks/pre-push.sample .git/modules/wiki/hooks/pre-push 2>/dev/null || true

cat > .git/modules/wiki/hooks/pre-push << 'EOF'
#!/bin/sh
echo "🚀 Triggering MkDocs deploy..."
gh workflow run deploy-docs.yml \
  --repo COS301-SE-2026/UMTAS \
  --ref setup-docs \
  && echo "✅ Deploy workflow triggered." \
  || echo "⚠️  Could not trigger deploy (is gh CLI authenticated?)"
EOF

chmod +x .git/modules/wiki/hooks/pre-push
```

---

## Making Documentation Changes

All wiki changes go into the `wiki/` folder. Always push to **`master`** on the wiki.

```bash
# 1. Make your changes inside wiki/docs/
#    e.g. edit wiki/docs/management/Team-Profiles.md

# 2. Stage and commit inside the wiki submodule
git -C wiki add .
git -C wiki commit -m "docs: your change description"

# 3. Push — this automatically triggers the MkDocs deploy
git -C wiki push origin master
```

After the push you will see:

```
🚀 Triggering MkDocs deploy...
✅ Deploy workflow triggered.
```

The site will be live at **https://cos301-se-2026.github.io/UMTAS/** within ~1 minute.

---

## Quick Reference

| Task                    | Command                                                                        |
| ----------------------- | ------------------------------------------------------------------------------ |
| Edit docs               | Edit files inside `wiki/docs/`                                                 |
| Stage all wiki changes  | `git -C wiki add .`                                                            |
| Commit wiki changes     | `git -C wiki commit -m "docs: ..."`                                            |
| Push & auto-deploy      | `git -C wiki push origin master`                                               |
| Check deploy status     | `gh run list --workflow="deploy-docs.yml"`                                     |
| Trigger deploy manually | `gh workflow run deploy-docs.yml --repo COS301-SE-2026/UMTAS --ref setup-docs` |

---

## Troubleshooting

**"Could not trigger deploy (is gh CLI authenticated?)"**  
Run `gh auth login` and try again.

**"Everything up-to-date" (no hook output)**  
You have no new commits to push. Make a change, commit, then push.

**"workflow does not have workflow_dispatch trigger"**  
The `--ref` in the hook is wrong. Check with Marcel — it should point to the branch where `deploy-docs.yml` lives.
