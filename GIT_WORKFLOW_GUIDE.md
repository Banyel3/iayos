# 🚀 Git Workflow Guide for Team Members

This guide will help you understand how to work with Git and GitHub on the iAyos project. We'll cover both **GitHub Desktop** (easier for beginners) and **Git CLI** (command line) approaches.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a New Branch](#creating-a-new-branch)
3. [Switching to Your Branch](#switching-to-your-branch)
4. [Making Changes](#making-changes)
5. [Committing Your Work](#committing-your-work)
6. [Pushing to Remote](#pushing-to-remote)
7. [Creating a Pull Request](#creating-a-pull-request)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, make sure you have:

### Required Software

- ✅ **Git** installed ([download](https://git-scm.com/downloads))
- ✅ **GitHub Desktop** (recommended for beginners - [download](https://desktop.github.com/))
- ✅ **Visual Studio Code** or your preferred code editor
- ✅ A **GitHub account** with access to the `Banyel3/iayos` repository

### Initial Setup

1. **Clone the repository** (if you haven't already):
   
   **GitHub Desktop:**
   - Open GitHub Desktop
   - File → Clone Repository
   - Select `Banyel3/iayos` or paste URL: `https://github.com/Banyel3/iayos.git`
   - Choose where to save it on your computer
   - Click **Clone**

   **Git CLI:**
   ```bash
   git clone https://github.com/Banyel3/iayos.git
   cd iayos
   ```

2. **Make sure you're on the main branch:**
   
   **GitHub Desktop:**
   - Look at the top-left branch dropdown
   - Should say `main` (if not, click and select `main`)

   **Git CLI:**
   ```bash
   git checkout main
   git pull origin main
   ```

---

## 🌿 Creating a New Branch

**Why create a branch?** Branches let you work on features or fixes without affecting the main codebase. Think of it like making a copy to experiment with.

### Method 1: GitHub Desktop

1. Click the **Current Branch** dropdown at the top
2. Click **New Branch** button
3. Enter a descriptive name (e.g., `feature/payment-integration` or `fix/login-bug`)
4. Make sure "Create branch based on" shows `main`
5. Click **Create Branch**

### Method 2: Git CLI

```bash
# Make sure you're on main and up-to-date
git checkout main
git pull origin main

# Create and switch to new branch
git checkout -b feature/your-feature-name

# Example:
git checkout -b feature/payment-integration
```

### Branch Naming Conventions

Follow these patterns for consistency:

- **Features**: `feature/feature-name` (e.g., `feature/user-authentication`)
- **Bug Fixes**: `fix/bug-description` (e.g., `fix/login-error`)
- **Documentation**: `docs/what-you-documented` (e.g., `docs/api-endpoints`)
- **Hotfixes**: `hotfix/critical-issue` (e.g., `hotfix/payment-crash`)

---

## 🔄 Switching to Your Branch

### GitHub Desktop

1. Click the **Current Branch** dropdown
2. Find your branch in the list (use search if needed)
3. Click on the branch name to switch to it

### Git CLI

```bash
# List all branches
git branch -a

# Switch to your branch
git checkout your-branch-name

# Example:
git checkout feature/payment-integration
```

---

## ✏️ Making Changes

Now you can edit files in your code editor (VS Code recommended).

### 1. Open the Project

**VS Code:**
- File → Open Folder
- Navigate to your `iayos` folder
- Click **Select Folder**

### 2. Make Your Changes

- Edit files as needed
- Create new files if required
- Delete files if necessary

### 3. Check What Changed

**GitHub Desktop:**
- Look at the **Changes** tab on the left
- You'll see a list of all modified files
- Click on a file to see the diff (what changed)

**Git CLI:**
```bash
# See which files were changed
git status

# See the actual changes (diff)
git diff

# See changes for a specific file
git diff path/to/file.ts
```

---

## 💾 Committing Your Work

A **commit** is like taking a snapshot of your work. Each commit should represent a logical unit of work.

### GitHub Desktop

1. Review your changes in the **Changes** tab
2. Check the boxes next to files you want to commit (usually all of them)
3. At the bottom, write a **commit message**:
   - **Summary** (required): Brief description (e.g., "Add payment integration")
   - **Description** (optional): More details if needed
4. Click **Commit to [branch-name]**

### Git CLI

```bash
# Stage all changes
git add .

# Or stage specific files
git add path/to/file1.ts path/to/file2.ts

# Commit with a message
git commit -m "feat: Add payment integration with Xendit"

# Or use an editor for longer messages
git commit
# This opens your default editor for a multi-line message
```

### Commit Message Best Practices

Follow the **Conventional Commits** format:

```
<type>: <short description>

[optional longer description]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat: Add user authentication with JWT"
git commit -m "fix: Resolve login button not responding"
git commit -m "docs: Update API endpoints documentation"
git commit -m "refactor: Simplify payment processing logic"
```

---

## 📤 Pushing to Remote

**Pushing** uploads your local commits to GitHub so others can see them.

### GitHub Desktop

1. After committing, you'll see **"Push origin"** at the top
2. Click **Push origin** button
3. If it's your first push on a new branch, it will say **"Publish branch"** instead

### Git CLI

```bash
# First time pushing a new branch
git push -u origin your-branch-name

# Example:
git push -u origin feature/payment-integration

# After the first push, just use:
git push
```

---

## 🔀 Creating a Pull Request

A **Pull Request (PR)** is how you propose your changes to be merged into the `main` branch.

### Step 1: Push Your Branch (if not already)

Make sure you've pushed all your commits (see previous section).

### Step 2: Go to GitHub

1. Open your browser and go to: **https://github.com/Banyel3/iayos**
2. You should see a yellow banner: **"your-branch-name had recent pushes"**
3. Click **"Compare & pull request"** button

   *If you don't see the banner:*
   - Click the **"Pull requests"** tab
   - Click **"New pull request"** button
   - Select your branch from the dropdown

### Step 3: Fill Out PR Details

**Title:** (auto-filled from your last commit, but you can change it)
```
Add payment integration feature
```

**Description:** Explain what you did and why
```
## What Changed
- Integrated Xendit payment gateway
- Added payment confirmation page
- Updated API endpoints for transactions

## Why
To enable users to make secure payments

## Testing
Tested with test API keys, payments working correctly
```

**Reviewers:** (on the right side)
- Click the gear icon next to "Reviewers"
- Select team members to review your code

**Labels:** (optional)
- Add labels like `feature`, `bug`, `documentation`

### Step 4: Create the Pull Request

1. Click **"Create pull request"** button
2. Wait for team reviews and CI/CD checks
3. Address any requested changes
4. Once approved, a team lead will merge it into `main`

---

## ✅ Best Practices

### 🎯 General Rules

1. **Always create a branch** - Never work directly on `main`
2. **Pull before you push** - Get latest changes first
3. **Commit often** - Small, logical commits are better than one huge commit
4. **Write clear commit messages** - Your future self will thank you
5. **Test before pushing** - Make sure your code works

### 🔄 Staying Up-to-Date

**Update your branch with latest `main` changes:**

**GitHub Desktop:**
1. Switch to `main` branch
2. Click **"Fetch origin"** then **"Pull origin"**
3. Switch back to your feature branch
4. Branch → Update from `main`
5. Resolve any conflicts if they appear

**Git CLI:**
```bash
# Switch to main and update
git checkout main
git pull origin main

# Switch back to your branch
git checkout your-branch-name

# Merge main into your branch
git merge main

# Or use rebase (cleaner history)
git rebase main
```

### 🚫 What NOT to Do

- ❌ Don't commit sensitive data (API keys, passwords, `.env` files)
- ❌ Don't push directly to `main` (use branches and PRs)
- ❌ Don't commit large binary files or build artifacts
- ❌ Don't force push (`git push -f`) unless you're absolutely sure
- ❌ Don't commit `node_modules`, `__pycache__`, or other dependencies

---

## 🆘 Troubleshooting

### "Your branch is behind 'origin/main'"

**Solution:** Pull the latest changes
```bash
git pull origin main
```

### "Merge conflict"

**What it means:** You and someone else changed the same lines of code.

**GitHub Desktop:**
1. Conflicted files will be highlighted
2. Right-click → Open in VS Code
3. Look for conflict markers:
   ```
   <<<<<<< HEAD
   Your changes
   =======
   Their changes
   >>>>>>> main
   ```
4. Manually choose which to keep or combine them
5. Remove the conflict markers
6. Save, commit, and push

**Git CLI:**
```bash
# See which files have conflicts
git status

# Open each file and resolve conflicts manually
# (look for <<<<<<, =======, >>>>>> markers)

# After resolving, stage the files
git add path/to/resolved-file.ts

# Complete the merge
git commit
```

### "Permission denied" when pushing

**Solution:** Make sure you're authenticated
- GitHub Desktop: Sign in again (File → Options → Accounts)
- Git CLI: Configure your credentials
  ```bash
  git config --global user.name "Your Name"
  git config --global user.email "your.email@example.com"
  ```

### Accidentally committed to `main`

**Solution:** Move commits to a new branch
```bash
# Create a new branch with your commits
git branch feature/my-work

# Reset main to origin
git reset --hard origin/main

# Switch to your new branch
git checkout feature/my-work
```

### Want to undo last commit (but keep changes)

```bash
# Undo commit, keep changes staged
git reset --soft HEAD~1

# Undo commit, keep changes unstaged
git reset HEAD~1

# Undo commit and discard changes (⚠️ CAREFUL!)
git reset --hard HEAD~1
```

### Accidentally deleted a file

**GitHub Desktop:**
1. Right-click the deleted file in Changes
2. Click **"Discard Changes"**

**Git CLI:**
```bash
git checkout -- path/to/file.ts
```

---

## 📚 Additional Resources

- **Git Documentation:** https://git-scm.com/doc
- **GitHub Guides:** https://guides.github.com/
- **GitHub Desktop Docs:** https://docs.github.com/desktop
- **Interactive Git Tutorial:** https://learngitbranching.js.org/
- **Conventional Commits:** https://www.conventionalcommits.org/

---

## 💡 Quick Command Reference

### Most Used Commands

```bash
# Check status
git status

# Create and switch to new branch
git checkout -b feature/my-feature

# Stage changes
git add .

# Commit
git commit -m "feat: add new feature"

# Push
git push

# Pull latest changes
git pull

# Switch branches
git checkout branch-name

# See commit history
git log --oneline

# See what changed
git diff
```

---

## 🤝 Need Help?

If you're stuck:
1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Ask in the team chat
3. Contact the team lead
4. Search on [Stack Overflow](https://stackoverflow.com/questions/tagged/git)

---

**Happy coding! 🚀**

*Last updated: January 25, 2026*
