#!/bin/bash
# Pre-commit hook to validate CHANGELOG.md is updated when mobile files change
# Add to .git/hooks/pre-commit or use with husky/lint-staged

# Check if mobile files are being committed
MOBILE_FILES_CHANGED=$(git diff --cached --name-only | grep -c "apps/frontend_mobile/")

if [ "$MOBILE_FILES_CHANGED" -gt 0 ]; then
  # Check if CHANGELOG.md was also updated
  CHANGELOG_UPDATED=$(git diff --cached --name-only | grep -c "apps/frontend_mobile/iayos_mobile/CHANGELOG.md")
  
  if [ "$CHANGELOG_UPDATED" -eq 0 ]; then
    echo "⚠️  WARNING: Mobile files changed but CHANGELOG.md not updated!"
    echo ""
    echo "Please update apps/frontend_mobile/iayos_mobile/CHANGELOG.md"
    echo "Add your changes to the [Unreleased] section:"
    echo "  - ### Added / ### Changed / ### Fixed / ### Removed"
    echo ""
    echo "To bypass this check, use: git commit --no-verify"
    echo ""
    exit 1
  fi
fi

# All checks passed
exit 0
