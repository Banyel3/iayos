#!/bin/bash

# Remove all fontFamily references (they're not needed)
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i '/fontFamily: Typography\.fontFamily/d'

# Fix Spacing.xxl -> Spacing.xl
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/Spacing\.xxl/Spacing.xl/g'

echo "Remaining theme errors fixed!"
