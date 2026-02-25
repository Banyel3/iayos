#!/bin/bash
# Extract changelog section for a specific version from CHANGELOG.md
# Usage: ./extract-changelog.sh <version>
# Example: ./extract-changelog.sh 2.0.5

VERSION=$1
CHANGELOG_FILE="apps/frontend_mobile/iayos_mobile/CHANGELOG.md"

if [ -z "$VERSION" ]; then
  echo "Error: Version number required"
  echo "Usage: $0 <version>"
  exit 1
fi

if [ ! -f "$CHANGELOG_FILE" ]; then
  echo "Error: CHANGELOG.md not found at $CHANGELOG_FILE"
  exit 1
fi

# Strip Windows carriage returns from the file for reliable awk parsing
CLEAN_FILE=$(mktemp)
tr -d '\r' < "$CHANGELOG_FILE" > "$CLEAN_FILE"

# Extract section between ## [VERSION] and next ## heading
# Preserve markdown formatting (indentation matters for nested lists)
CHANGELOG_CONTENT=$(awk "/^## \[$VERSION\]/,/^## \[/ { 
  if (/^## \[$VERSION\]/) { 
    next 
  } 
  if (/^## \[/ && !/^## \[$VERSION\]/) { 
    exit 
  } 
  print 
}" "$CLEAN_FILE")

# If no content found for specific version, try extracting [Unreleased] section
if [ -z "$(echo "$CHANGELOG_CONTENT" | tr -d '[:space:]')" ]; then
  echo "No entry for [$VERSION], extracting [Unreleased] section..." >&2
  CHANGELOG_CONTENT=$(awk '/^## \[Unreleased\]/,/^## \[/ { 
    if (/^## \[Unreleased\]/) { 
      next 
    } 
    if (/^## \[/ && !/^## \[Unreleased\]/) { 
      exit 
    } 
    print 
  }' "$CLEAN_FILE")
fi

# Clean up temp file
rm -f "$CLEAN_FILE"

# Trim leading/trailing blank lines but preserve internal formatting
CHANGELOG_CONTENT=$(echo "$CHANGELOG_CONTENT" | sed -e '/./,$!d' -e :a -e '/^\s*$/{ $d; N; ba; }')

# Check if we found content
if [ -z "$(echo "$CHANGELOG_CONTENT" | tr -d '[:space:]')" ]; then
  echo "No changelog entry found for version $VERSION. See commit history for detailed changes."
else
  echo "$CHANGELOG_CONTENT"
fi
