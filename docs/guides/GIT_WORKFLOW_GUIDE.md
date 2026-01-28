# Git Workflow Guide for iAyos Team

**Version**: 1.0  
**Last Updated**: January 2026  
**Audience**: All team members working on the iAyos project

---

## 📑 Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Part 1: Creating a New Branch](#part-1-creating-a-new-branch)
   - [Using GitHub Desktop](#using-github-desktop-creating-a-branch)
   - [Using Git Command Line](#using-git-command-line-creating-a-branch)
4. [Part 2: Accessing Your Branch](#part-2-accessing-your-branch)
   - [Using GitHub Desktop](#using-github-desktop-accessing-your-branch)
   - [Using Git Command Line](#using-git-command-line-accessing-your-branch)
5. [Part 3: Making Changes and Committing](#part-3-making-changes-and-committing)
   - [Using GitHub Desktop](#using-github-desktop-committing-changes)
   - [Using Git Command Line](#using-git-command-line-committing-changes)
6. [Part 4: Pushing to Remote](#part-4-pushing-to-remote)
   - [Using GitHub Desktop](#using-github-desktop-pushing)
   - [Using Git Command Line](#using-git-command-line-pushing)
7. [Part 5: Creating a Pull Request](#part-5-creating-a-pull-request)
8. [Best Practices](#best-practices)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Additional Resources](#additional-resources)

---

## Introduction

This guide will walk you through the complete Git workflow for contributing to the iAyos project. Whether you prefer using GitHub Desktop (visual interface) or Git command line, we've got you covered!

**What you'll learn:**

- ✅ How to create feature branches for your work
- ✅ How to switch between branches
- ✅ How to commit your changes with meaningful messages
- ✅ How to push your work to the remote repository
- ✅ How to create Pull Requests for code review
- ✅ Best practices for clean Git history

---

## Prerequisites

Before starting, make sure you have:

### 1. **Git Installed**

- **Windows/Mac**: Download from [git-scm.com](https://git-scm.com/downloads)
- **Verify installation**: Open terminal/PowerShell and run:
  ```bash
  git --version
  ```
  _(Should display something like: `git version 2.40.0`)_

### 2. **GitHub Desktop** (Optional but Recommended)

- Download from [desktop.github.com](https://desktop.github.com/)
- Sign in with your GitHub account
- Configure your name and email in `File > Options > Git`

### 3. **VS Code** (Recommended)

- Download from [code.visualstudio.com](https://code.visualstudio.com/)
- Install Git extension (usually comes pre-installed)

### 4. **Repository Access**

- You must be added as a collaborator on `Banyel3/iayos`
- Clone the repository (instructions in next sections)

### 5. **GitHub Account**

- Create account at [github.com/signup](https://github.com/signup)
- Share your username with team lead for repository access

---

## Part 1: Creating a New Branch

### Why Create Branches?

Branches allow you to work on new features or bug fixes **without affecting the main codebase**. Think of it as creating a separate workspace for your changes.

**Branch Naming Convention:**

- **Features**: `feature/short-description` (e.g., `feature/user-authentication`)
- **Bug Fixes**: `fix/issue-description` (e.g., `fix/login-error`)
- **Experimental**: `experiment/feature-name` (e.g., `experiment/new-ui`)

---

### Using GitHub Desktop (Creating a Branch)

**Step 1:** Open GitHub Desktop

1. Launch GitHub Desktop application
2. Make sure you have the **iayos** repository selected (top-left dropdown)

**📸 Screenshot Placeholder:** _GitHub Desktop main window with repository dropdown highlighted_

---

**Step 2:** Click on "Current Branch" Button

1. Look at the top toolbar
2. Click the button that shows your current branch (usually `main`)
3. This opens the branch dropdown menu

**📸 Screenshot Placeholder:** _Current Branch button in GitHub Desktop with dropdown open_

---

**Step 3:** Create New Branch

1. In the branch dropdown, click **"New Branch"** button
2. A dialog will appear asking for the branch name

**📸 Screenshot Placeholder:** _New Branch dialog in GitHub Desktop_

---

**Step 4:** Name Your Branch

1. Type your branch name following the naming convention
   - Example: `feature/mobile-payment-integration`
2. Make sure "Create branch based on..." shows `main` (or current working branch)
3. Click **"Create Branch"**

**📸 Screenshot Placeholder:** _Branch name input field with example name_

---

**Step 5:** Verify Branch Created

1. The "Current Branch" button should now show your new branch name
2. GitHub Desktop will automatically switch to your new branch

**📸 Screenshot Placeholder:** _GitHub Desktop showing new branch name in Current Branch button_

---

### Using Git Command Line (Creating a Branch)

**Step 1:** Open Terminal/PowerShell

- **Windows**: Press `Win + X` → Select "Windows PowerShell"
- **Mac**: Press `Cmd + Space` → Type "Terminal"
- **VS Code**: Press `Ctrl + `` (backtick) to open integrated terminal

---

**Step 2:** Navigate to Repository

```bash
# Navigate to your project folder
cd c:\code\iayos

# Verify you're in the right place
pwd  # Should show path to iayos folder
```

**Expected Output:**

```
PS C:\code\iayos>
```

---

**Step 3:** Check Current Branch

```bash
# See which branch you're currently on
git branch

# Or use git status for more info
git status
```

**Expected Output:**

```
* main
  feature/old-feature
```

_(The asterisk `*` shows your current branch)_

---

**Step 4:** Create and Switch to New Branch

```bash
# Create new branch and switch to it in one command
git checkout -b feature/your-feature-name

# Alternative (Git 2.23+):
git switch -c feature/your-feature-name
```

**Example:**

```bash
git checkout -b feature/mobile-payment-integration
```

**Expected Output:**

```
Switched to a new branch 'feature/mobile-payment-integration'
```

---

**Step 5:** Verify Branch Created

```bash
# List all branches (current branch marked with *)
git branch

# Or check status
git status
```

**Expected Output:**

```
* feature/mobile-payment-integration
  main
```

---

## Part 2: Accessing Your Branch

### Using GitHub Desktop (Accessing Your Branch)

**Scenario:** You want to switch to an existing branch you or someone else created.

---

**Step 1:** Open Branch Dropdown

1. Click the **"Current Branch"** button at the top
2. This shows all available branches

**📸 Screenshot Placeholder:** _Branch dropdown menu showing list of branches_

---

**Step 2:** Find Your Branch

1. Scroll through the list or use the search box
2. Branches are organized into:
   - **Recent branches** (branches you worked on recently)
   - **Default branch** (usually `main`)
   - **Other branches** (alphabetically sorted)

**📸 Screenshot Placeholder:** _Branch search and filtering in GitHub Desktop_

---

**Step 3:** Switch to Branch

1. Click on the branch name you want to switch to
2. GitHub Desktop will automatically switch to that branch

**📸 Screenshot Placeholder:** _Clicking on a branch to switch_

---

**Step 4:** Pull Latest Changes

1. After switching, click **"Fetch origin"** button
2. If updates are available, click **"Pull origin"**
3. This ensures you have the latest code from the remote repository

**📸 Screenshot Placeholder:** _Fetch origin and Pull origin buttons_

---

### Using Git Command Line (Accessing Your Branch)

**Step 1:** List All Branches

```bash
# See all local branches
git branch

# See all branches including remote
git branch -a
```

**Expected Output:**

```
  feature/mobile-payment-integration
* main
  fix/login-error
  remotes/origin/main
  remotes/origin/feature/team-feature
```

---

**Step 2:** Switch to Existing Branch

```bash
# Switch to an existing local branch
git checkout feature/mobile-payment-integration

# Alternative (Git 2.23+):
git switch feature/mobile-payment-integration
```

**Expected Output:**

```
Switched to branch 'feature/mobile-payment-integration'
```

---

**Step 3:** Pull Latest Changes

```bash
# Fetch all remote branches and updates
git fetch origin

# Pull latest changes for current branch
git pull origin feature/mobile-payment-integration
```

**Expected Output:**

```
remote: Enumerating objects: 15, done.
remote: Counting objects: 100% (15/15), done.
Updating 8b88094..a1b2c3d
Fast-forward
 apps/backend/src/payments/api.py | 45 ++++++++++++++++++
```

---

**Step 4:** Verify Current Branch

```bash
git status
```

**Expected Output:**

```
On branch feature/mobile-payment-integration
Your branch is up to date with 'origin/feature/mobile-payment-integration'.

nothing to commit, working tree clean
```

---

## Part 3: Making Changes and Committing

### What is a Commit?

A **commit** is a snapshot of your code at a specific point in time. Think of it as saving a checkpoint in a video game—you can always go back to this state if needed.

**Good Commit Practices:**

- ✅ **Small, focused commits**: One feature or fix per commit
- ✅ **Clear messages**: Describe **what** and **why** you changed
- ✅ **Frequent commits**: Commit every 30-60 minutes of work
- ✅ **Test before committing**: Make sure code compiles and runs

---

### Using GitHub Desktop (Committing Changes)

**Step 1:** Make Code Changes

1. Open VS Code (or your preferred editor)
2. Make your changes to the code
3. Save all files (`Ctrl + S`)

---

**Step 2:** Review Changes in GitHub Desktop

1. Switch to GitHub Desktop
2. The **"Changes"** tab will show all modified files
3. Click on each file to see the **diff** (red = removed, green = added)

**📸 Screenshot Placeholder:** _GitHub Desktop Changes tab showing file diffs_

---

**Step 3:** Select Files to Commit

1. By default, all changed files are selected (checkboxes checked)
2. **Uncheck files** you don't want to commit (e.g., temporary files)
3. Only commit files related to your current feature/fix

**📸 Screenshot Placeholder:** _Checkbox selection in Changes tab_

---

**Step 4:** Write Commit Message

1. In the bottom-left panel, find the **"Summary"** field
2. Write a short, descriptive commit message (50 characters max recommended)

**Good Examples:**

```
✅ Add payment integration with Xendit API
✅ Fix login error when email is empty
✅ Update user profile UI layout
```

**Bad Examples:**

```
❌ Fixed stuff
❌ asdfasdf
❌ Updated code
```

**📸 Screenshot Placeholder:** _Commit message fields in GitHub Desktop_

---

**Step 5:** Add Detailed Description (Optional)

1. In the **"Description"** field (below Summary), add more context if needed
2. Explain **why** you made the changes, not just what changed

**Example:**

```
Summary: Add payment integration with Xendit API

Description:
- Implemented escrow payment flow
- Added 50% downpayment calculation
- Integrated Xendit invoice creation
- Handles payment success/failure callbacks

Resolves issue #123
```

---

**Step 6:** Commit to Your Branch

1. Click the blue **"Commit to [your-branch-name]"** button
2. Your changes are now saved in Git history locally

**📸 Screenshot Placeholder:** _Commit button in GitHub Desktop_

---

**Step 7:** Verify Commit

1. Go to the **"History"** tab
2. Your commit should appear at the top of the list
3. Click on it to see the changes included

**📸 Screenshot Placeholder:** _History tab showing recent commit_

---

### Using Git Command Line (Committing Changes)

**Step 1:** Check What Changed

```bash
# See which files were modified
git status
```

**Expected Output:**

```
On branch feature/mobile-payment-integration
Changes not staged for commit:
  modified:   apps/backend/src/payments/api.py
  modified:   apps/frontend_mobile/iayos_mobile/app/payments/method.tsx

Untracked files:
  apps/backend/src/payments/xendit_service.py
```

---

**Step 2:** Review Changes (Optional)

```bash
# See detailed changes in all files
git diff

# See changes for a specific file
git diff apps/backend/src/payments/api.py
```

**📝 Tip:** Press `q` to exit the diff view.

---

**Step 3:** Stage Files for Commit

```bash
# Add all changed files
git add .

# Or add specific files only
git add apps/backend/src/payments/api.py apps/backend/src/payments/xendit_service.py

# Or add files by pattern
git add apps/backend/src/payments/*.py
```

**Expected Output:** _(No output means success)_

---

**Step 4:** Verify Staged Files

```bash
git status
```

**Expected Output:**

```
On branch feature/mobile-payment-integration
Changes to be committed:
  modified:   apps/backend/src/payments/api.py
  new file:   apps/backend/src/payments/xendit_service.py
  modified:   apps/frontend_mobile/iayos_mobile/app/payments/method.tsx
```

---

**Step 5:** Commit Changes

```bash
# Commit with a short message
git commit -m "Add payment integration with Xendit API"

# Commit with multi-line message
git commit -m "Add payment integration with Xendit API" -m "- Implemented escrow payment flow
- Added 50% downpayment calculation
- Integrated Xendit invoice creation"
```

**Expected Output:**

```
[feature/mobile-payment-integration a1b2c3d] Add payment integration with Xendit API
 3 files changed, 245 insertions(+), 12 deletions(-)
 create mode 100644 apps/backend/src/payments/xendit_service.py
```

---

**Step 6:** Verify Commit

```bash
# See commit history
git log --oneline

# See last commit details
git show
```

**Expected Output:**

```
a1b2c3d (HEAD -> feature/mobile-payment-integration) Add payment integration with Xendit API
8b88094 (origin/main, main) fix: Remove incorrect AVD directory check
```

---

## Part 4: Pushing to Remote

### What is Pushing?

**Pushing** uploads your local commits to the remote repository on GitHub. This makes your changes available to your team and backs up your work in the cloud.

**⚠️ Important:** You must commit changes **before** you can push them!

---

### Using GitHub Desktop (Pushing)

**Step 1:** Check for Unpushed Commits

1. Look at the top toolbar
2. If you have commits to push, you'll see:
   - **"Push origin"** button with a number badge (e.g., "Push origin 2↑")
   - The number indicates how many commits will be pushed

**📸 Screenshot Placeholder:** _Push origin button with commit count badge_

---

**Step 2:** Push Commits

1. Click the **"Push origin"** button
2. GitHub Desktop will upload your commits to GitHub

**📸 Screenshot Placeholder:** _Push in progress indicator_

---

**Step 3:** Verify Push Success

1. The "Push origin" button should disappear (replaced with "Fetch origin")
2. This means your commits are now on GitHub
3. You can verify by visiting your repository on GitHub.com

**📸 Screenshot Placeholder:** _GitHub Desktop after successful push_

---

**Step 4:** Handle "Push Rejected" Errors

If someone else pushed to the same branch while you were working:

1. Click **"Fetch origin"** to get updates
2. If there are conflicts, you'll see a **"Pull origin"** button
3. Click **"Pull origin"** to merge remote changes
4. Resolve any conflicts (see [Conflict Resolution](#handling-merge-conflicts))
5. Try pushing again

**📸 Screenshot Placeholder:** _Pull origin dialog with conflict warning_

---

### Using Git Command Line (Pushing)

**Step 1:** Check Status

```bash
# See if you have commits to push
git status
```

**Expected Output:**

```
On branch feature/mobile-payment-integration
Your branch is ahead of 'origin/feature/mobile-payment-integration' by 2 commits.
  (use "git push" to publish your local commits)

nothing to commit, working tree clean
```

---

**Step 2:** Push to Remote

```bash
# Push current branch to remote
git push origin feature/mobile-payment-integration

# Or use shorthand (if upstream is set)
git push
```

**Expected Output:**

```
Enumerating objects: 15, done.
Counting objects: 100% (15/15), done.
Delta compression using up to 8 threads
Compressing objects: 100% (10/10), done.
Writing objects: 100% (10/10), 2.45 KiB | 2.45 MiB/s, done.
Total 10 (delta 5), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (5/5), completed with 3 local objects.
To https://github.com/Banyel3/iayos.git
   8b88094..a1b2c3d  feature/mobile-payment-integration -> feature/mobile-payment-integration
```

---

**Step 3:** Push New Branch (First Time)

If this is the first time pushing a new branch:

```bash
# Push and set upstream tracking
git push -u origin feature/mobile-payment-integration
```

**Expected Output:**

```
Total 0 (delta 0), reused 0 (delta 0), pack-reused 0
remote:
remote: Create a pull request for 'feature/mobile-payment-integration' on GitHub by visiting:
remote:      https://github.com/Banyel3/iayos/pull/new/feature/mobile-payment-integration
remote:
To https://github.com/Banyel3/iayos.git
 * [new branch]      feature/mobile-payment-integration -> feature/mobile-payment-integration
branch 'feature/mobile-payment-integration' set up to track 'origin/feature/mobile-payment-integration'.
```

**📝 Note:** The `-u` flag sets up tracking so future `git push` commands don't need to specify the remote/branch.

---

**Step 4:** Handle Push Rejection

If push is rejected due to remote changes:

```bash
# Fetch updates from remote
git fetch origin

# Pull changes and merge
git pull origin feature/mobile-payment-integration

# Resolve any conflicts (if prompted)
# Then push again
git push origin feature/mobile-payment-integration
```

---

## Part 5: Creating a Pull Request

### What is a Pull Request (PR)?

A **Pull Request** is a request to merge your branch into the main branch. It allows team members to:

- ✅ **Review your code** before it's merged
- ✅ **Discuss changes** and suggest improvements
- ✅ **Run automated tests** to ensure quality
- ✅ **Approve or request changes** before merging

**📝 Note:** Pull Requests are created on GitHub.com, not in GitHub Desktop or command line.

---

### Step 1: Push Your Branch

Before creating a PR, make sure all your commits are pushed to GitHub:

- **GitHub Desktop**: Click "Push origin" button
- **Command Line**: Run `git push origin your-branch-name`

---

### Step 2: Navigate to GitHub Repository

1. Open your browser
2. Go to: [https://github.com/Banyel3/iayos](https://github.com/Banyel3/iayos)
3. Sign in to your GitHub account (if not already)

**📸 Screenshot Placeholder:** _GitHub repository main page_

---

### Step 3: Click "Pull requests" Tab

1. At the top of the repository page, click the **"Pull requests"** tab
2. This shows all open pull requests

**📸 Screenshot Placeholder:** _Pull requests tab in GitHub navigation_

---

### Step 4: Create New Pull Request

1. Click the green **"New pull request"** button (top-right)
2. This opens the pull request comparison page

**📸 Screenshot Placeholder:** _New pull request button_

---

### Step 5: Select Branches to Compare

1. **Base branch** (left dropdown): Select `main` (the branch you want to merge INTO)
2. **Compare branch** (right dropdown): Select your feature branch (e.g., `feature/mobile-payment-integration`)
3. GitHub will show you the diff between these branches

**📸 Screenshot Placeholder:** _Branch selection dropdowns with comparison diff_

---

### Step 6: Review Changes

1. Scroll down to see all changed files
2. **Green lines** = code you added
3. **Red lines** = code you removed
4. Make sure only your intended changes are shown

**📸 Screenshot Placeholder:** _File diff view in pull request_

---

### Step 7: Click "Create pull request"

1. After reviewing, click the green **"Create pull request"** button
2. This opens the PR description form

**📸 Screenshot Placeholder:** _Create pull request button_

---

### Step 8: Fill Out PR Details

**Title** (required):

- Use a descriptive title (auto-filled from your first commit message)
- Example: `Add payment integration with Xendit API`

**Description** (recommended):

Write a clear description explaining:

- **What** changed
- **Why** you made the changes
- **How** to test the changes
- **Related issues** (if any)

**Example Template:**

```markdown
## Changes

- Implemented escrow payment flow with 50% downpayment
- Added Xendit API integration for invoice creation
- Created payment method selection screen
- Handles payment success/failure callbacks

## Why

This implements Phase 3 of the mobile payment system, allowing clients to make downpayments via GCash/wallet.

## How to Test

1. Start backend and mobile app
2. Navigate to job detail screen
3. Click "Accept Job" button
4. Select payment method (GCash or Wallet)
5. Complete payment flow

## Related Issues

- Closes #123
- Related to #145

## Screenshots

[Add screenshots here if UI changes]
```

**📸 Screenshot Placeholder:** _Pull request description editor_

---

### Step 9: Assign Reviewers (Optional)

1. On the right sidebar, click **"Reviewers"**
2. Select team members to review your code
3. They'll be notified to review your PR

**📸 Screenshot Placeholder:** _Reviewers dropdown in PR sidebar_

---

### Step 10: Add Labels (Optional)

1. Click **"Labels"** in the right sidebar
2. Add relevant labels:
   - `feature` = new feature
   - `bug` = bug fix
   - `documentation` = docs update
   - `urgent` = needs quick review

**📸 Screenshot Placeholder:** _Labels dropdown in PR sidebar_

---

### Step 11: Create the Pull Request

1. Review all details one more time
2. Click the green **"Create pull request"** button at the bottom
3. Your PR is now created! 🎉

**📸 Screenshot Placeholder:** _Final create pull request button_

---

### Step 12: Wait for Review

1. Team members will review your code
2. They may:
   - ✅ **Approve** = code looks good, ready to merge
   - 💬 **Comment** = ask questions or suggest changes
   - ❌ **Request changes** = you need to make updates

**📸 Screenshot Placeholder:** _PR review interface with approve/comment/request changes buttons_

---

### Step 13: Address Review Comments

If reviewers request changes:

1. Make the requested changes in your local branch
2. Commit the changes (`git commit -m "Address review comments"`)
3. Push to the same branch (`git push origin your-branch-name`)
4. **The PR will automatically update** with your new commits!

---

### Step 14: Merge the Pull Request

Once approved by reviewers (usually 1-2 team members):

1. Click the green **"Merge pull request"** button
2. Choose merge method:
   - **"Create a merge commit"** (default, preserves commit history)
   - **"Squash and merge"** (combines all commits into one)
   - **"Rebase and merge"** (linear history, advanced)
3. Click **"Confirm merge"**
4. Your changes are now in the `main` branch! 🎉

**📸 Screenshot Placeholder:** _Merge pull request button and options_

---

### Step 15: Delete Branch (Optional)

After merging:

1. GitHub will offer to delete your branch with a button
2. Click **"Delete branch"** to clean up
3. You can always restore it later if needed

**📸 Screenshot Placeholder:** _Delete branch button after merge_

---

## Best Practices

### 1. **Commit Messages**

Follow the **Conventional Commits** format:

```
<type>(<scope>): <short description>

<body>
<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no logic changes)
- `refactor`: Code restructuring (no behavior change)
- `test`: Add or update tests
- `chore`: Maintenance tasks

**Examples:**

```bash
✅ feat(payments): add Xendit API integration
✅ fix(auth): resolve login error when email is empty
✅ docs(readme): update setup instructions for Windows
✅ refactor(api): simplify user profile endpoint
✅ test(jobs): add unit tests for job creation
```

---

### 2. **Branch Management**

- **Create new branch** for each feature/fix
- **Keep branches short-lived** (merge within 1-2 weeks)
- **Delete merged branches** to keep repo clean
- **Pull from main regularly** to avoid conflicts

```bash
# Update your branch with latest main
git checkout feature/your-feature
git pull origin main

# Or using rebase (advanced)
git checkout feature/your-feature
git rebase main
```

---

### 3. **Pull Requests**

- **Small PRs** = easier to review (aim for <500 lines changed)
- **Descriptive titles** explaining what changed
- **Test before creating PR** (ensure code works)
- **Respond to reviews quickly** (within 24-48 hours)
- **Don't merge your own PR** (unless emergency)

---

### 4. **Code Review**

When reviewing someone else's PR:

- ✅ **Be respectful** and constructive
- ✅ **Explain why** you're suggesting changes
- ✅ **Suggest solutions** not just problems
- ✅ **Approve quickly** if code looks good
- ❌ **Don't nitpick** small formatting issues (use linters instead)

---

### 5. **Commit Frequency**

**Good practices:**

- Commit every 30-60 minutes of work
- Commit after completing a logical unit of work
- Commit before switching tasks
- Commit before ending your work session

**Bad practices:**

- ❌ Committing every 5 minutes (too granular)
- ❌ Committing once a day (too large)
- ❌ Committing broken code (always test first)

---

### 6. **Syncing with Main**

Keep your branch updated with `main`:

```bash
# Option 1: Merge (preserves history)
git checkout feature/your-feature
git pull origin main

# Option 2: Rebase (cleaner history, advanced)
git checkout feature/your-feature
git rebase main

# If rebase conflicts, resolve and continue
git rebase --continue

# If you want to abort rebase
git rebase --abort
```

---

## Common Issues & Solutions

### Issue 1: "Merge Conflict"

**Symptom:** Git says there are conflicts when pulling or merging.

**Solution:**

1. Git will mark conflicted files with conflict markers:

```
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> main
```

2. **Manually edit** the file to choose which changes to keep
3. **Remove the conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`)
4. **Stage the resolved file**: `git add conflicted-file.txt`
5. **Complete the merge/pull**: `git commit` (or `git rebase --continue` if rebasing)

---

### Issue 2: "Push Rejected"

**Symptom:** `error: failed to push some refs to 'origin'`

**Solution:**

```bash
# Pull latest changes first
git pull origin your-branch-name

# Resolve any conflicts (if prompted)

# Push again
git push origin your-branch-name
```

---

### Issue 3: "Accidentally Committed to Wrong Branch"

**Solution:**

```bash
# Undo last commit but keep changes
git reset --soft HEAD~1

# Switch to correct branch
git checkout correct-branch-name

# Re-commit the changes
git add .
git commit -m "Your commit message"
```

---

### Issue 4: "Want to Undo Last Commit"

**Solution:**

```bash
# Undo commit but keep changes (staged)
git reset --soft HEAD~1

# Undo commit and unstage changes
git reset HEAD~1

# Undo commit and delete changes (DANGEROUS!)
git reset --hard HEAD~1
```

---

### Issue 5: "Pushed Sensitive Data (API Keys, Passwords)"

**⚠️ URGENT - Do this immediately:**

1. **Revoke the compromised credentials** (regenerate API keys, change passwords)
2. **Contact team lead** to help remove from Git history
3. **Never commit** `.env` files or secrets again

---

### Issue 6: "GitHub Desktop Not Showing Changes"

**Solutions:**

- Click "Fetch origin" to refresh
- Restart GitHub Desktop
- Check if you're on the correct branch
- Check if files are in `.gitignore`

---

### Issue 7: "Can't Switch Branches (Uncommitted Changes)"

**Symptom:** `error: Your local changes would be overwritten by checkout`

**Solution:**

```bash
# Option 1: Commit changes first
git add .
git commit -m "WIP: work in progress"
git checkout other-branch

# Option 2: Stash changes temporarily
git stash
git checkout other-branch

# Later, restore stashed changes
git checkout original-branch
git stash pop
```

---

### Issue 8: "Remote Branch Deleted But Still Shows Locally"

**Solution:**

```bash
# Fetch with prune to remove deleted remote branches
git fetch --prune origin

# Or set it as default behavior
git config --global fetch.prune true
```

---

## Additional Resources

### Official Documentation

- **Git Documentation**: [git-scm.com/doc](https://git-scm.com/doc)
- **GitHub Guides**: [guides.github.com](https://guides.github.com/)
- **GitHub Desktop Docs**: [docs.github.com/en/desktop](https://docs.github.com/en/desktop)

### Interactive Tutorials

- **Learn Git Branching**: [learngitbranching.js.org](https://learngitbranching.js.org/)
- **GitHub Skills**: [skills.github.com](https://skills.github.com/)
- **Git Immersion**: [gitimmersion.com](https://gitimmersion.com/)

### Cheat Sheets

- **Git Cheat Sheet**: [education.github.com/git-cheat-sheet-education.pdf](https://education.github.com/git-cheat-sheet-education.pdf)
- **Conventional Commits**: [conventionalcommits.org](https://www.conventionalcommits.org/)

### Team-Specific Resources

- **Repository Structure**: See `REPO_STRUCTURE.md`
- **Commit Guidelines**: See `COMMIT_GUIDE.md`
- **Setup Guide**: See `docs/setup/LOCAL_DEVELOPMENT_SETUP.md`

---

## Quick Reference Commands

### Daily Workflow

```bash
# 1. Start your day - pull latest changes
git checkout main
git pull origin main
git checkout -b feature/new-feature

# 2. Work on your feature
# ... make changes ...

# 3. Commit frequently
git add .
git commit -m "feat: implement user authentication"

# 4. Push when ready
git push origin feature/new-feature

# 5. Create Pull Request on GitHub.com

# 6. After PR is merged, clean up
git checkout main
git pull origin main
git branch -d feature/new-feature
```

### Emergency Fixes

```bash
# Fix mistake in last commit (before pushing)
git commit --amend -m "Fixed commit message"

# Undo last commit but keep changes
git reset --soft HEAD~1

# Discard ALL local changes (DANGEROUS!)
git reset --hard HEAD
git clean -fd
```

### Branch Management

```bash
# List all branches
git branch -a

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Rename current branch
git branch -m new-branch-name
```

---

## Getting Help

If you're stuck:

1. **Search this guide** for your issue
2. **Check Git documentation**: `git help <command>`
3. **Ask in team chat** (Slack/Discord)
4. **Contact team lead** for urgent issues

**Remember:** Everyone makes Git mistakes—it's part of learning! Don't be afraid to ask for help.

---

## Appendix: Keyboard Shortcuts

### GitHub Desktop

- `Ctrl + 1` - Changes tab
- `Ctrl + 2` - History tab
- `Ctrl + Enter` - Commit changes
- `Ctrl + P` - Push to origin
- `Ctrl + Shift + F` - Fetch from origin
- `Ctrl + T` - Switch branch
- `Ctrl + Shift + N` - New branch

### VS Code Git Integration

- `Ctrl + Shift + G` - Open Source Control panel
- `Ctrl + Enter` - Commit staged changes
- `Ctrl + K Ctrl + P` - Push to remote
- `Ctrl + K Ctrl + B` - Switch branch

---

**Last Updated:** January 2026  
**Maintained By:** iAyos Development Team  
**Questions?** Contact your team lead or open a discussion on GitHub.
