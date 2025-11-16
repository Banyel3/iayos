#!/bin/bash

# Fix Typography.fontSize.md -> Typography.fontSize.base (16px is close to 15px)
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/Typography\.fontSize\.md/Typography.fontSize.base/g'

# Fix Typography.fontSize.xxl -> Typography.fontSize.xl (20px is close to 22px)
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/Typography\.fontSize\.xxl/Typography.fontSize.xl/g'

# Fix Typography.fontFamily -> remove (not needed in styles)
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/fontFamily: Typography\.fontFamily,//g'
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/fontFamily: Typography\.fontFamily\.regular,//g'
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/fontFamily: Typography\.fontFamily\.medium,//g'
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/fontFamily: Typography\.fontFamily\.bold,//g'

# Fix Shadows.large -> Shadows.lg
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/Shadows\.large/Shadows.lg/g'
find app components -name "*.tsx" -type f -print0 | xargs -0 sed -i 's/Shadow\.large/Shadow.lg/g'

echo "Theme errors fixed!"
