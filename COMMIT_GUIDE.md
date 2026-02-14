# Commit Message Guide

This guide explains how to write commit messages that trigger automated mobile app releases with proper semantic versioning.

## Mobile App Release Workflow

When you push changes to `main` or `dev` branches that affect files in `apps/frontend_mobile/iayos_mobile/`, the GitHub Actions workflow will:

1. Analyze your commit messages
2. Determine the appropriate version bump (major/minor/patch)
3. Build a new Android APK
4. Create a GitHub release with the APK attached

## Commit Message Format

Use conventional commit format to trigger the correct version bump:

```
<type>: <description>

[optional body]
```

## Version Bump Rules

### 🔴 Major Release (1.0.0 → 2.0.0)

**Breaking changes** that are incompatible with previous versions.

**Triggers:**

- `BREAKING CHANGE:` in commit body
- `feat!: <description>` (exclamation mark indicates breaking change)
- `fix!: <description>`

**Examples:**

```bash
git commit -m "feat!: redesign entire navigation system"
git commit -m "fix!: remove deprecated API endpoints"
git commit -m "feat: new authentication system

BREAKING CHANGE: Old login tokens are no longer valid"
```

---

### 🟡 Minor Release (1.0.0 → 1.1.0)

**New features** that don't break existing functionality.

**Triggers:**

- `feat:` - New feature
- `feature:` - New feature (alternative)
- `add:` - Adding new functionality
- `new:` - New capability

**Examples:**

```bash
git commit -m "feat: add dark mode support"
git commit -m "feature: implement offline mode"
git commit -m "add: push notifications for job updates"
git commit -m "new: worker rating system"
```

---

### 🟢 Patch Release (1.0.0 → 1.0.1)

**Bug fixes** and minor improvements that don't add features.

**Triggers:**

- `fix:` - Bug fix
- `bugfix:` - Bug fix (alternative)
- `patch:` - Small patch
- `hotfix:` - Urgent fix
- `chore:` - Maintenance tasks
- `docs:` - Documentation only
- `style:` - Code style changes
- `refactor:` - Code refactoring

**Examples:**

```bash
git commit -m "fix: login button not responding on Android"
git commit -m "bugfix: crash when viewing empty job list"
git commit -m "hotfix: payment processing timeout"
git commit -m "chore: update dependencies"
git commit -m "refactor: optimize image loading performance"
git commit -m "style: fix inconsistent button styling"
```

---

## Best Practices

### ✅ DO

- Be specific and descriptive
- Use present tense ("add feature" not "added feature")
- Keep the first line under 72 characters
- Reference issue numbers when applicable
- Group related changes in a single commit

**Good examples:**

```bash
git commit -m "feat: add QR code scanner for job verification"
git commit -m "fix: resolve memory leak in image upload (#123)"
git commit -m "chore: update Expo SDK to v54"
```

### ❌ DON'T

- Use vague messages like "update code" or "fix stuff"
- Mix multiple unrelated changes in one commit
- Forget the colon after the type
- Use all caps (except BREAKING CHANGE)

**Bad examples:**

```bash
git commit -m "Update"
git commit -m "fixed some bugs and added features"
git commit -m "FIX LOGIN"
```

---

## Workflow Behavior

### Release Creation

- **main branch**: Creates a **stable release** (not marked as pre-release)
- **dev branch**: Creates a **pre-release** (marked as draft)

### No Release Scenarios

The workflow will **skip** release creation if:

- No files in `apps/frontend_mobile/iayos_mobile/` were changed
- Only markdown files (`.md`) were modified
- Commit messages don't match any recognized patterns

---

## Examples by Scenario

### Bug Fix Release (1.2.3 → 1.2.4)

```bash
# Single bug fix
git commit -m "fix: crash on profile screen when avatar missing"

# Multiple fixes
git commit -m "fix: resolve login timeout and improve error messages"
```

### Feature Release (1.2.3 → 1.3.0)

```bash
# New feature
git commit -m "feat: add job search filters for location and budget"

# Feature with details
git commit -m "feat: implement real-time chat notifications

- Add WebSocket connection for instant messaging
- Display unread message badges
- Play notification sound on new messages"
```

### Major Breaking Change (1.2.3 → 2.0.0)

```bash
# With exclamation mark
git commit -m "feat!: migrate to new payment API

All existing payment methods will need to be re-added.
Wallet balances will be migrated automatically."

# With BREAKING CHANGE footer
git commit -m "refactor: restructure authentication system

BREAKING CHANGE: All users must log in again.
Old session tokens are invalidated."
```

---

## Quick Reference Table

| Commit Type         | Version Bump  | Example                  |
| ------------------- | ------------- | ------------------------ |
| `BREAKING CHANGE:`  | Major (2.0.0) | `feat!: new auth system` |
| `feat!:` or `fix!:` | Major (2.0.0) | `fix!: remove old API`   |
| `feat:`             | Minor (1.1.0) | `feat: add dark mode`    |
| `feature:`          | Minor (1.1.0) | `feature: job filters`   |
| `add:`              | Minor (1.1.0) | `add: notifications`     |
| `new:`              | Minor (1.1.0) | `new: rating system`     |
| `fix:`              | Patch (1.0.1) | `fix: login crash`       |
| `bugfix:`           | Patch (1.0.1) | `bugfix: memory leak`    |
| `hotfix:`           | Patch (1.0.1) | `hotfix: payment bug`    |
| `chore:`            | Patch (1.0.1) | `chore: update deps`     |
| `refactor:`         | Patch (1.0.1) | `refactor: clean code`   |
| `docs:`             | Patch (1.0.1) | `docs: update README`    |
| `style:`            | Patch (1.0.1) | `style: format code`     |

---

## Getting Your APK

After the workflow completes:

1. Go to **Releases** in your GitHub repository
2. Find the latest release (e.g., `mobile-v1.2.4`)
3. Download the `.apk` file from the Assets section
4. Install on your Android device

> **Note:** You may need to enable "Install from unknown sources" in your Android device settings.

---

## Troubleshooting

### Workflow didn't trigger?

- Ensure your changes are in `apps/frontend_mobile/iayos_mobile/`
- Check you pushed to `main` or `dev` branch
- Verify the commit message follows the format above

### Wrong version bump?

- Review your commit message type
- Use `feat!:` for breaking changes (major bump)
- Use `feat:` for new features (minor bump)
- Use `fix:` for bug fixes (patch bump)

### Need to manually trigger?

Currently, the workflow only runs on push. To manually trigger a build:

```bash
git commit --allow-empty -m "chore: trigger manual build"
git push
```

---

## Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
