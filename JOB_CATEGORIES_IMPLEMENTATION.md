# Job Categories & Minimum Rates Implementation

## Overview
Implementation of job categories with minimum rates based on DOLE (Department of Labor and Employment) guidelines and Philippine labor standards.

## Files Created

### 1. `/lib/job-categories.ts`
Core configuration file containing:
- Job category definitions with minimum rates
- Helper functions for rate validation
- DOLE wage reference data

### 2. `/admin/jobs/categories/page.tsx`
Admin page to view and manage job categories with:
- Category cards showing minimum rates
- Recommended rate ranges
- Average project costs
- DOLE reference information

## Job Categories & Minimum Rates

Based on DOLE NCR minimum wage (₱610/day) and skilled labor multipliers:

| Category | Minimum Rate | Skill Level | Rate Calculation |
|----------|--------------|-------------|------------------|
| **Home Cleaning** | ₱85/hour | Entry | 1.1x minimum wage |
| **Carpentry** | ₱140/hour | Intermediate | 1.8x minimum wage |
| **Plumbing** | ₱150/hour | Intermediate | 2.0x minimum wage |
| **Electrical** | ₱175/hour | Intermediate | 2.3x minimum wage |
| **HVAC** | ₱200/hour | Expert | 2.6x minimum wage |
| **Painting** | ₱120/hour | Intermediate | 1.6x minimum wage |
| **Masonry** | ₱130/hour | Intermediate | 1.7x minimum wage |
| **Welding** | ₱180/hour | Expert | 2.4x minimum wage |

## Rate Calculation Logic

### Skill Level Multipliers:
- **Entry Level:** 1.1x - 1.3x DOLE minimum wage
- **Intermediate:** 1.5x - 2x DOLE minimum wage  
- **Expert:** 2x - 3x DOLE minimum wage

### DOLE Minimum Wage Reference (NCR - 2024):
- Non-Agriculture: ₱610/day
- Agriculture: ₱573/day
- Retail/Service (≤10 employees): ₱560/day

### Hourly Rate Calculation:
```
Hourly Rate = (Daily Minimum Wage × Skill Multiplier) ÷ 8 hours
```

## Features

### For Workers:
- Cannot set rates below category minimum
- Recommended rate ranges displayed
- Competitive rates based on skill level

### For Clients:
- Transparent pricing expectations
- Fair market rates
- Quality assurance through minimum standards

### For Admins:
- Easy rate management
- DOLE compliance tracking
- Category performance metrics

## API Functions

### `validateRate(categoryId, rate)`
Checks if proposed rate meets minimum requirements.

**Example:**
```typescript
const result = validateRate('plumbing', 120);
// Returns: { 
//   isValid: false, 
//   minimumRate: 150,
//   message: "Minimum rate for Plumbing is ₱150/hour"
// }
```

### `getRecommendedRateRange(categoryId)`
Returns min, max, and average recommended rates.

**Example:**
```typescript
const range = getRecommendedRateRange('electrical');
// Returns: { min: 175, max: 437.5, average: 262.5 }
```

### `getCategoryById(id)` / `getCategoryByName(name)`
Retrieve full category information.

## Usage in Forms

When creating job postings or worker profiles:

```typescript
import { validateRate, getRecommendedRateRange } from '@/lib/job-categories';

// Validate worker's proposed rate
const validation = validateRate(categoryId, proposedRate);
if (!validation.isValid) {
  alert(validation.message);
}

// Show recommended range to users
const range = getRecommendedRateRange(categoryId);
console.log(`Recommended: ₱${range.min} - ₱${range.max}/hour`);
```

## Future Enhancements

1. **Regional Rates:** Adjust minimums based on location (NCR, Luzon, Visayas, Mindanao)
2. **Dynamic Updates:** Admin interface to modify rates
3. **Experience Multipliers:** Adjust rates based on worker experience (years)
4. **Certification Bonuses:** Higher rates for certified professionals
5. **Seasonal Adjustments:** Update rates based on DOLE wage orders

## Navigation

Added to Admin Sidebar under **Jobs Management > Categories & Rates**

Access at: `/admin/jobs/categories`

## Compliance Notes

- Rates comply with DOLE minimum wage orders
- Accounts for skilled labor premium (1.5x - 3x base wage)
- Provides fair compensation while maintaining market competitiveness
- Protects workers from exploitation through rate floors
- Ensures service quality through professional compensation

## References

- DOLE Regional Wage Order No. NCR-24 (2024)
- Philippine Labor Code standards for skilled labor
- Construction Industry Authority of the Philippines (CIAP) rate guidelines
- Professional Regulation Commission (PRC) licensed professional rates
