# Mobile Profile UI Update - Skills with Nested Certifications ✅

**Date**: December 9, 2025  
**Status**: Complete - Frontend Refactored  
**Type**: UI Enhancement - Profile Tab

## Overview

Updated the mobile profile screen to display **skills as expandable sections** with **nested certifications** underneath each skill. This matches the new backend structure where certifications are linked to specific skills.

## Visual Changes

### Before

```
Skills
  [Plumbing] [Electrical] [Carpentry]

Certifications
  TESDA NC II Plumbing
  Advanced Electrical Certificate
  Basic Carpentry License
```

### After

```
Skills & Certifications

  🔧 Plumbing                    🏅 2  ▼
     5 years experience

  When expanded:
     ├─ TESDA NC II Plumbing
     └─ Advanced Plumbing Certificate

  ⚡ Electrical Work              🏅 1  ▼
     3 years experience

  When expanded:
     └─ Electrical Safety Certificate

  🔨 Carpentry                   🏅 0  ▼
     2 years experience

  When expanded:
     No certifications added for Carpentry
     [+ Add Certification]
```

## Features Implemented

### 1. Expandable Skill Sections ✅

- **Tap to expand/collapse** each skill
- **Chevron icon** (▼/▲) indicates expand state
- **Smooth animation** when expanding

### 2. Skill Header Display ✅

- **Skill icon** (🔧) on the left
- **Skill name** in bold
- **Experience years** ("5 years experience")
- **Certification badge** showing count with ribbon icon
- **Active badge** turns green when count > 0

### 3. Nested Certifications ✅

- Shows certifications **only when skill is expanded**
- Uses existing **CertificationCard** component
- **Compact mode** for space efficiency
- **Tap certification** to go to full certifications page

### 4. Empty States ✅

- When skill has **no certifications**:
  - Shows empty state message
  - Shows ribbon outline icon
  - Shows "Add Certification" button
- When worker has **no skills**:
  - Shows "Add Skills" button
  - Links to profile edit page

## Files Modified

### 1. TypeScript Interfaces (2 files)

**`types/index.ts`** (+18 lines):

```typescript
// NEW: Skill interface with certification count
export interface Skill {
  id: number; // workerSpecialization ID
  specializationId: number; // Specializations ID
  name: string;
  experienceYears: number;
  certificationCount: number;
}

// UPDATED: Certification interface with skill linkage
export interface Certification {
  // ...existing fields...
  specializationId: number | null; // NEW
  skillName: string | null; // NEW
}
```

**`lib/hooks/useCertifications.ts`** (+2 fields):

- Added `specializationId` to Certification interface
- Added `skillName` to Certification interface
- Updated mapper to include new fields from backend

### 2. Profile Screen (`app/profile/index.tsx`)

**State Management** (+1 line):

```typescript
const [expandedSkills, setExpandedSkills] = useState<Set<number>>(new Set());
```

**Skills Section** (~100 lines replaced):

- Removed old "Skills" chip section
- Removed old separate "Certifications" section
- Added new "Skills & Certifications" combined section
- Added expandable skill headers with toggle
- Added nested certification display
- Added empty state for skills with no certs

**Styles** (+85 lines):

```typescript
skillSection: {...}        // Outer container
skillHeader: {...}         // Clickable header
skillHeaderLeft: {...}     // Icon + text side
skillHeaderRight: {...}    // Badge + chevron side
skillName: {...}           // Skill name text
skillMeta: {...}           // "X years experience"
certBadge: {...}           // Certification count badge
skillCertifications: {...} // Expanded content area
noCertifications: {...}    // Empty state container
addCertButton: {...}       // "Add Certification" button
```

## API Integration

### Backend Response (Already Implemented)

```json
GET /api/mobile/auth/profile
{
  "skills": [
    {
      "id": 1,
      "specializationId": 1,
      "name": "Plumbing",
      "experienceYears": 5,
      "certificationCount": 2
    }
  ]
}

GET /api/accounts/certifications
[
  {
    "certificationID": 6,
    "name": "Advanced Plumbing Certificate",
    "specializationId": 1,
    "skillName": "Plumbing"
  }
]
```

### Frontend Logic

```typescript
// 1. Fetch profile with structured skills
const profile = await fetchProfile(); // skills: Skill[]

// 2. Fetch certifications with skill linkage
const certifications = useCertifications(); // includes specializationId

// 3. Filter certifications per skill
const skillCertifications = certifications.filter(
  (cert) => cert.specializationId === skill.id
);
```

## User Interaction Flow

1. **User opens profile tab**
   - Sees list of skills (all collapsed by default)
   - Each skill shows: name, experience, cert count badge

2. **User taps a skill header**
   - Skill expands with smooth animation
   - Shows certifications linked to that skill
   - OR shows "no certifications" empty state

3. **User taps certification card**
   - Navigates to `/profile/certifications` page
   - Can view/edit/delete certification

4. **User taps "Add Certification" button**
   - Navigates to certifications management page
   - Can add new certification and link to skill

5. **User taps skill header again**
   - Skill collapses back to header only

## Design Details

### Color Scheme

- **Skill header background**: `Colors.surface` (white)
- **Expanded area background**: `Colors.backgroundSecondary` (light gray)
- **Cert badge (empty)**: Gray with secondary text
- **Cert badge (active)**: Gray with green text + green icon
- **Primary actions**: `Colors.primary` (blue)

### Typography

- **Skill name**: `Typography.body.large` + bold (600)
- **Experience text**: `Typography.body.small` + secondary color
- **Cert count**: `Typography.body.small` + bold (600)

### Spacing

- **Section margin**: `Spacing.md` (16px)
- **Skill gap**: `Spacing.md` (16px between skills)
- **Header padding**: `Spacing.md` (16px all sides)
- **Cert padding**: `Spacing.md` horizontal, `Spacing.sm` top

### Icons

- **Skill icon**: `construct` (wrench/tool icon)
- **Cert badge icon**: `ribbon` (award ribbon)
- **Expand icon**: `chevron-down` / `chevron-up`
- **Empty state icon**: `ribbon-outline` (32px)

## Benefits

### User Experience

✅ **Clear hierarchy**: Skills → Certifications relationship is obvious  
✅ **Less scrolling**: Collapsed by default, expand only what you need  
✅ **Visual feedback**: Cert count badge shows at a glance  
✅ **Contextual actions**: "Add Certification" appears when needed  
✅ **Consistent design**: Uses existing CertificationCard component

### Developer Experience

✅ **Type-safe**: Full TypeScript interfaces  
✅ **Reusable**: Leverages existing components  
✅ **Maintainable**: Clear separation of concerns  
✅ **Performant**: Only renders expanded sections  
✅ **Scalable**: Handles unlimited skills/certs

## Testing Checklist

### Visual Testing

- [ ] Skills display correctly with icons
- [ ] Experience years show properly
- [ ] Cert count badge updates correctly
- [ ] Expand/collapse animation is smooth
- [ ] Nested certifications render correctly
- [ ] Empty state shows when no certs
- [ ] "Add Certification" button navigates correctly

### Interaction Testing

- [ ] Tap skill header expands/collapses
- [ ] Multiple skills can be expanded simultaneously
- [ ] Tap certification card navigates to management page
- [ ] "Add Certification" button works from empty state
- [ ] Edit button navigates to profile edit
- [ ] Back button works from certifications page

### Data Testing

- [ ] Skills with 0 certs show empty state
- [ ] Skills with 1+ certs show correctly
- [ ] Unlinked certifications don't appear under any skill
- [ ] Cert count badge matches actual count
- [ ] Experience years display correctly

### Edge Cases

- [ ] Worker with no skills shows "Add Skills" button
- [ ] Worker with skills but no certs shows empty states
- [ ] Very long skill names don't overflow
- [ ] Very long certification names don't overflow
- [ ] Rapidly tapping expand doesn't break UI

## Known Issues / Future Enhancements

### Current Limitations

- Unlinked certifications are not displayed (by design)
- Cannot add certifications directly from expanded skill
- Cannot reorder skills in this view

### Planned Enhancements

1. **Show unlinked certifications** in separate "Other Certifications" section
2. **Quick add certification** button in expanded skill area
3. **Drag-to-reorder skills** for priority sorting
4. **Skill level badges** (Beginner/Intermediate/Expert)
5. **Skill endorsements** from clients
6. **Skill verification** status indicators

## Migration Notes

### For Existing Users

- Old profile data still works (backward compatible)
- Skills are fetched from new API endpoint
- Certifications show `specializationId` field
- No data migration required

### For New Users

- Skills must be added via profile edit
- Certifications can be linked to skills when created
- Cert count updates automatically

## Related Documentation

- `docs/01-completed/WORKER_SKILLS_REFACTORING_BACKEND_COMPLETE.md` - Backend implementation
- `docs/01-completed/WORKER_SKILLS_TESTING_GUIDE.md` - API testing guide
- `apps/backend/test_worker_skills_endpoints.http` - REST Client tests

---

**Status**: ✅ Complete - Ready for Testing  
**Next Step**: Manual UI testing with test account (worker@test.com)
