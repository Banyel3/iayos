# Worker Detail Screen - New Metrics UI Layout

## 📱 Screen Layout (Updated)

```
┌─────────────────────────────────────────┐
│  ← Back              Worker Detail      │
├─────────────────────────────────────────┤
│                                         │
│         ┌───────────────────┐           │
│         │   Profile Photo   │           │
│         └───────────────────┘           │
│                                         │
│        Vaniel Cornelio                  │
│        ⭐ 4.5 (12 reviews)               │
│        📍 Marikina, Metro Manila        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │  💼  │  │  ⏱️  │  │  💵  │          │
│  │  28  │  │  2h  │  │ ₱500 │          │
│  │ Jobs │  │ Time │  │ /hr  │          │
│  └──────┘  └──────┘  └──────┘          │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║ ✅ NEW: Completion Rate Card     ║  │
│  ╠═══════════════════════════════════╣  │
│  ║                                   ║  │
│  ║  ✓  93.3%                         ║  │
│  ║     Job Completion Rate           ║  │
│  ║                                   ║  │
│  ║  ████████████████████░░░ 93%      ║  │
│  ║  ▲ Green progress bar             ║  │
│  ╚═══════════════════════════════════╝  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║ ⭐ NEW: Performance Ratings       ║  │
│  ╠═══════════════════════════════════╣  │
│  ║                                   ║  │
│  ║  Quality          ⭐⭐⭐⭐⭐  4.7   ║  │
│  ║                                   ║  │
│  ║  Communication    ⭐⭐⭐⭐⭐  4.4   ║  │
│  ║                                   ║  │
│  ║  Professionalism  ⭐⭐⭐⭐⭐  4.8   ║  │
│  ║                                   ║  │
│  ║  Timeliness       ⭐⭐⭐⭐☆  4.2   ║  │
│  ║                                   ║  │
│  ╚═══════════════════════════════════╝  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  Specializations                        │
│  ┌──────────┐ ┌──────────┐              │
│  │ 🔨 Plumb │ │ 🔨 Elect │              │
│  └──────────┘ └──────────┘              │
│                                         │
│  About                                  │
│  Professional plumber with 5 years...   │
│                                         │
│  Skills                                 │
│  [Pipe Repair] [Installation] ...      │
│                                         │
│  📜 Certifications (3)                  │
│  ... (existing implementation)          │
│                                         │
│  🧰 Materials & Products (4)            │
│  ... (existing implementation)          │
│                                         │
├─────────────────────────────────────────┤
│  [ 💬 Message ]  [ ✓ Hire Worker ]      │
└─────────────────────────────────────────┘
```

---

## 🎨 Visual Component Breakdown

### 1. Completion Rate Card (NEW)

**Before Stats Section**:

```
┌─────────────────────────────────────────┐
│  Job Completion Statistics              │
├─────────────────────────────────────────┤
│                                         │
│  ✓   93.3%                              │ ← Large, bold number
│      Job Completion Rate                │ ← Gray label
│                                         │
│  ████████████████████░░░                │ ← Progress bar
│  ▲ Color: Green (≥90%)                  │
│                                         │
└─────────────────────────────────────────┘
```

**Color Logic**:

- **Green** (≥90%): Excellent reliability
- **Yellow** (70-89%): Good reliability
- **Red** (<70%): Needs improvement

**Icon**: `checkmark-circle` (Ionicons)

---

### 2. Performance Ratings Section (NEW)

**Only shows if worker has reviews (`reviewCount > 0`)**:

```
┌─────────────────────────────────────────┐
│  Performance Ratings                    │
├─────────────────────────────────────────┤
│                                         │
│  Quality              ⭐⭐⭐⭐⭐  4.7    │
│  ▲ Left aligned       ▲ Right aligned   │
│                                         │
│  Communication        ⭐⭐⭐⭐⭐  4.4    │
│                                         │
│  Professionalism      ⭐⭐⭐⭐⭐  4.8    │
│                                         │
│  Timeliness           ⭐⭐⭐⭐☆  4.2    │
│                       ▲ 4 filled +      │
│                         1 outline       │
│                                         │
└─────────────────────────────────────────┘
```

**Layout Details**:

- **Label**: Left-aligned, 14px font, medium weight
- **Stars**: 5 icons, 16px each, 4px gap
  - Filled: `star` icon, yellow color
  - Outline: `star-outline` icon, gray color
- **Value**: Numeric rating to 1 decimal, 14px font, bold

**Star Rendering Logic**:

```typescript
// Round rating to nearest integer for star display
const filledStars = Math.round(4.7); // 5 stars
// Display: ⭐⭐⭐⭐⭐ 4.7

const filledStars = Math.round(4.2); // 4 stars
// Display: ⭐⭐⭐⭐☆ 4.2
```

---

## 📐 Spacing & Layout

### Component Order (Top to Bottom):

1. Header (back button, title)
2. Profile Info (photo, name, rating, location)
3. **Stats Cards** (jobs, response time, hourly rate)
4. 🆕 **Completion Rate Card** ← NEW
5. 🆕 **Performance Ratings Section** ← NEW (if reviews exist)
6. Specializations
7. About/Bio
8. Skills
9. Certifications (with empty state)
10. Materials (with empty state)
11. Bottom Actions (message, hire)

### Margins:

- Section spacing: 16px between sections
- Card padding: 16px inside cards
- Gap between rating rows: 16px

---

## 🎯 Conditional Rendering

### Completion Rate Card

- **Always shows** (uses 0.0 if no assigned jobs)
- Green/yellow/red color based on percentage

### Performance Ratings Section

```typescript
// Only render if worker has reviews
{data.reviewCount > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Performance Ratings</Text>
    {/* 4 rating rows */}
  </View>
)}
```

---

## 🖼️ Color Scheme

### Completion Rate Colors:

```typescript
const iconColor =
  data.completionRate >= 90
    ? Colors.success // Green
    : data.completionRate >= 70
      ? Colors.warning // Yellow
      : Colors.error; // Red
```

### Star Colors:

- **Filled stars**: `Colors.warning` (yellow/gold)
- **Outline stars**: `Colors.textHint` (light gray)

### Text Colors:

- **Value text** (93.3%, 4.7): `Colors.textPrimary` (dark)
- **Label text**: `Colors.textSecondary` (medium gray)

---

## 📊 Data Flow

### Backend → Frontend

**API Response**:

```json
{
  "completionRate": 93.3,
  "qualityRating": 4.7,
  "communicationRating": 4.4,
  "professionalismRating": 4.8,
  "timelinessRating": 4.2,
  "reviewCount": 12
}
```

**Frontend Rendering**:

```tsx
// Completion Rate
<Text>{data.completionRate.toFixed(1)}%</Text>
<View style={[styles.progressBar, { width: `${data.completionRate}%` }]} />

// Quality Rating
{[1, 2, 3, 4, 5].map((star) => (
  <Ionicons
    name={star <= Math.round(data.qualityRating) ? "star" : "star-outline"}
    color={star <= Math.round(data.qualityRating) ? Colors.warning : Colors.textHint}
  />
))}
<Text>{data.qualityRating.toFixed(1)}</Text>
```

---

## 🧪 Visual Testing Scenarios

### Scenario 1: High-Performing Worker

```
Completion Rate: 95% (Green)
Quality: ⭐⭐⭐⭐⭐ 4.8
Communication: ⭐⭐⭐⭐⭐ 4.6
Professionalism: ⭐⭐⭐⭐⭐ 4.9
Timeliness: ⭐⭐⭐⭐⭐ 4.7
```

### Scenario 2: Moderate Worker

```
Completion Rate: 75% (Yellow)
Quality: ⭐⭐⭐⭐☆ 3.8
Communication: ⭐⭐⭐⭐☆ 3.6
Professionalism: ⭐⭐⭐⭐☆ 4.0
Timeliness: ⭐⭐⭐☆☆ 3.4
```

### Scenario 3: Low-Performing Worker

```
Completion Rate: 45% (Red)
Quality: ⭐⭐⭐☆☆ 2.8
Communication: ⭐⭐⭐☆☆ 2.6
Professionalism: ⭐⭐⭐☆☆ 3.0
Timeliness: ⭐⭐☆☆☆ 2.4
```

### Scenario 4: New Worker (No Reviews)

```
Completion Rate: 100% (Green) ← Still shows
Performance Ratings: [HIDDEN] ← reviewCount = 0
```

---

## ✅ Implementation Checklist

UI Components:

- [x] Completion Rate Card component
- [x] Performance Ratings Section component
- [x] Color-coded progress bar
- [x] Star rating display (filled/outline)
- [x] Conditional rendering (only if reviewCount > 0)

Styling:

- [x] Card styles (background, border, padding)
- [x] Typography (font sizes, weights)
- [x] Colors (success, warning, error, text)
- [x] Spacing (gaps, margins)
- [x] Progress bar styles

Data Handling:

- [x] TypeScript interface updated
- [x] API response parsing
- [x] Number formatting (toFixed(1))
- [x] Percentage calculation for progress bar

---

**Visual Design Complete** ✅  
**Ready for Mobile App Testing** 📱
