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

# Extract section between ## [VERSION] and next ##
# Remove the heading line, keep only the content
CHANGELOG_CONTENT=$(awk "/^## \[$VERSION\]/,/^## \[/ { 
  if (/^## \[$VERSION\]/) { 
    # Skip the version heading line
    next 
  } 
  if (/^## \[/ && !/^## \[$VERSION\]/) { 
    # Stop at next version heading
    exit 
  } 
  print 
}" "$CHANGELOG_FILE" | sed '/^$/d' | sed 's/^[ \t]*//')

# Check if we found content
if [ -z "$CHANGELOG_CONTENT" ]; then
  echo "No changelog entry found for version $VERSION. See commit history for detailed changes."
else
  echo "$CHANGELOG_CONTENT"
fi
