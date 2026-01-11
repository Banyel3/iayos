# Worker Metrics - Quick Testing Guide

## 🚀 How to Test the New Features

### Prerequisites

- ✅ Backend container restarted (`docker-compose -f docker-compose.dev.yml restart backend`)
- ✅ Frontend code updated with new TypeScript interface
- ✅ Mobile app running (Expo dev server)

---

## 📱 Testing Steps

### Step 1: Start Mobile App

```bash
# In apps/frontend_mobile/iayos_mobile/
npx expo start
```

### Step 2: Log In as CLIENT

- Open mobile app on device/emulator
- Log in with CLIENT account (not WORKER)
- Navigate to home screen

### Step 3: View Worker Detail

- Tap on any worker card in home screen
- OR search for workers and tap one
- Worker detail screen should load

### Step 4: Verify New UI Components

#### ✅ Completion Rate Card (After Stats Cards)

**Expected**:

- Card with checkmark icon
- Large percentage number (e.g., "93.3%")
- Label: "Job Completion Rate"
- Progress bar below (width matches percentage)
- Color: Green (≥90%), Yellow (70-89%), or Red (<70%)

**Screenshot Checklist**:

- [ ] Card renders correctly
- [ ] Icon color matches progress bar color
- [ ] Percentage displays to 1 decimal place
- [ ] Progress bar fills correct width
- [ ] No layout overflow or clipping

#### ✅ Performance Ratings Section (After Completion Rate)

**Expected** (only if worker has reviews):

- Section title: "Performance Ratings"
- 4 rows:
  1. Quality + stars + numeric value
  2. Communication + stars + numeric value
  3. Professionalism + stars + numeric value
  4. Timeliness + stars + numeric value

**Screenshot Checklist**:

- [ ] Section only shows if reviewCount > 0
- [ ] All 4 rating categories display
- [ ] Stars render correctly (filled vs outline)
- [ ] Numeric values show to 1 decimal (e.g., "4.7")
- [ ] Stars count matches rounded rating
- [ ] Yellow stars for filled, gray for outline

---

## 🧪 Test Cases

### Test Case 1: Worker with Reviews

**Worker ID**: 2 (Vaniel Cornelio)  
**Expected**: Both sections display

**Verify**:

- [ ] Completion rate shows (e.g., 93.3%)
- [ ] Progress bar displays
- [ ] Performance Ratings section displays
- [ ] 4 rating rows visible
- [ ] All stars render correctly

### Test Case 2: Worker with No Reviews

**Expected**: Only completion rate shows

**Verify**:

- [ ] Completion rate card displays
- [ ] Progress bar displays
- [ ] Performance Ratings section HIDDEN
- [ ] No TypeScript errors in console

### Test Case 3: Different Completion Rates

**Test with multiple workers**:

**High (≥90%)** - Should be GREEN:

- [ ] Icon is green
- [ ] Progress bar is green
- [ ] No visual errors

**Medium (70-89%)** - Should be YELLOW:

- [ ] Icon is yellow/orange
- [ ] Progress bar is yellow/orange
- [ ] No visual errors

**Low (<70%)** - Should be RED:

- [ ] Icon is red
- [ ] Progress bar is red
- [ ] No visual errors

### Test Case 4: Different Star Ratings

**Test with various ratings**:

**4.7 rating** → 5 filled stars:

- [ ] ⭐⭐⭐⭐⭐ 4.7

**4.2 rating** → 4 filled stars:

- [ ] ⭐⭐⭐⭐☆ 4.2

**3.5 rating** → 4 filled stars (rounds up):

- [ ] ⭐⭐⭐⭐☆ 3.5

**2.8 rating** → 3 filled stars:

- [ ] ⭐⭐⭐☆☆ 2.8

---

## 🐛 Common Issues & Fixes

### Issue 1: Sections Don't Show

**Symptoms**: New sections missing from worker detail screen

**Debug**:

```typescript
// Check API response in console
console.log("Worker Data:", data);
// Should show: completionRate, qualityRating, etc.
```

**Fix**:

- Restart backend: `docker-compose -f docker-compose.dev.yml restart backend`
- Clear React Query cache: Pull down to refresh
- Check backend logs: `docker logs iayos-backend-dev --tail 50`

### Issue 2: TypeScript Errors

**Symptoms**: Red underlines in code editor

**Fix**:

```bash
# In apps/frontend_mobile/iayos_mobile/
npm run typecheck
# Should show 0 errors
```

### Issue 3: Stars Not Rendering

**Symptoms**: Star icons missing or showing as boxes

**Debug**:

```typescript
// Check Ionicons import
import { Ionicons } from "@expo/vector-icons";

// Verify icon names
name = "star"; // Filled star
name = "star-outline"; // Outline star
```

### Issue 4: Progress Bar Not Showing

**Symptoms**: No progress bar visible

**Debug**:

```typescript
// Check styles
progressBarContainer: {
  height: 8,
  backgroundColor: Colors.border,
  overflow: "hidden", // Required!
}

// Check width calculation
width: `${data.completionRate}%`  // Must be string with %
```

---

## 📊 API Response Verification

### Expected Response Structure

```json
{
  "id": 2,
  "firstName": "Vaniel",
  "lastName": "Cornelio",
  "rating": 4.5,
  "reviewCount": 12,
  "completedJobs": 28,

  // NEW FIELDS:
  "completionRate": 93.3,
  "qualityRating": 4.7,
  "communicationRating": 4.4,
  "professionalismRating": 4.8,
  "timelinessRating": 4.2,

  "responseTime": "2h",
  "hourlyRate": 500,
  ...
}
```

### How to Check API Response

1. Open React DevTools in Expo
2. Navigate to worker detail screen
3. Check React Query cache:
   ```javascript
   // In React DevTools Console
   queryClient.getQueryData(["worker-detail", 2]);
   ```

---

## 📸 Screenshot Guide

### Required Screenshots:

1. **Full worker detail screen** showing:
   - Header
   - Profile info
   - Stats cards
   - ✅ NEW: Completion rate card
   - ✅ NEW: Performance ratings section
   - Specializations
   - About/Bio

2. **Close-up of completion rate card**:
   - Clear view of percentage
   - Visible progress bar
   - Color-coded icon

3. **Close-up of performance ratings**:
   - All 4 categories visible
   - Stars clearly rendered
   - Numeric values visible

4. **Different completion rates**:
   - One green (≥90%)
   - One yellow (70-89%)
   - One red (<70%)

---

## ✅ Success Criteria

**Backend**:

- [x] Backend container running
- [x] API returns 5 new fields
- [x] No server errors in logs

**Frontend**:

- [ ] Completion rate card displays
- [ ] Progress bar renders with correct width
- [ ] Color coding works (green/yellow/red)
- [ ] Performance ratings section shows (if reviews exist)
- [ ] 4 rating categories display
- [ ] Stars render correctly
- [ ] Numeric values show to 1 decimal
- [ ] No TypeScript errors
- [ ] No React warnings in console
- [ ] Layout is responsive (no overflow)

**UX**:

- [ ] Cards have proper spacing
- [ ] Text is readable
- [ ] Colors match theme
- [ ] Animations smooth (if any)
- [ ] No visual glitches

---

## 🔍 Debug Commands

### Check Backend Logs

```bash
docker logs iayos-backend-dev --tail 100
```

### Restart Backend

```bash
docker-compose -f docker-compose.dev.yml restart backend
```

### Check TypeScript Compilation

```bash
cd apps/frontend_mobile/iayos_mobile
npm run typecheck
```

### Clear Metro Cache (if needed)

```bash
npx expo start --clear
```

---

## 📞 Next Steps After Testing

### If All Tests Pass ✅:

1. Document findings in QA report
2. Take screenshots for documentation
3. Mark feature as "Ready for Production"
4. Optionally test with different worker profiles

### If Issues Found ❌:

1. Document specific issues with screenshots
2. Note steps to reproduce
3. Check console logs for errors
4. Report to development team

---

**Testing Time Estimate**: 15-20 minutes  
**Last Updated**: November 16, 2025
