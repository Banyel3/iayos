// Temporary patch file to fix TypeScript errors
// This file adds missing properties to the theme

import { Typography as BaseTypography, Spacing as BaseSpacing, Shadows as BaseShadows, BorderRadius as BaseBorderRadius } from './theme';

// Add missing fontSize properties
(BaseTypography.fontSize as any).md = 15;
(BaseTypography.fontSize as any).xxl = 22;

// Add missing Shadow property
(BaseShadows as any).large = BaseShadows.lg;

// Export patched theme
export { Colors, Typography, Spacing, BorderRadius, Shadows } from './theme';
