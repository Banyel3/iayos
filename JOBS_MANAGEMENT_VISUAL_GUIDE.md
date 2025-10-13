# Jobs Management - Visual Guide & Screenshots Reference

## Page Layout Structure

### Common Layout Pattern

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (Fixed Left)                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Main Content Area                               │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Header                                      │ │ │
│ │ │ • Title                                     │ │ │
│ │ │ • Description                               │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Summary Cards Grid (4-5 cards)             │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Filters & Search Bar                        │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ Content Cards / List                        │ │ │
│ │ │ • Multiple expandable cards                 │ │ │
│ │ │ • Action buttons                            │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 1. Jobs Dashboard (`/admin/jobs`)

### Layout

```
┌───────────────────────────────────────────────────────┐
│ Jobs Management                                       │
│ Monitor and manage all job-related activities         │
├───────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │ 342  │ │  87  │ │ 198  │ │ 156  │  Primary Stats  │
│ │Total │ │Active│ │Comp. │ │Apps  │                 │
│ └──────┘ └──────┘ └──────┘ └──────┘                 │
├───────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐           │
│ │ $145,230  │ │  $425.75  │ │  92.5%    │  Secondary│
│ │Total Rev  │ │Avg Value  │ │Completion │  Stats   │
│ └───────────┘ └───────────┘ └───────────┘           │
├───────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │    📋   │ │    👥   │ │    ⏱️   │ │    ✅   │    │
│ │Listings │ │  Apps   │ │ Active  │ │Complete │    │
│ │   View  │ │  Track  │ │ Monitor │ │  View   │    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
├───────────────────────────────────────────────────────┤
│ ┌────────────────┐ ┌──────────────────────────────┐ │
│ │Recent Activity │ │ Top Job Categories           │ │
│ │• New job post  │ │ Home Cleaning ████████ 58    │ │
│ │• Application   │ │ Plumbing      ██████   42    │ │
│ │• Completed     │ │ Electrical    █████    38    │ │
│ │• Dispute       │ │ Painting      ████     35    │ │
│ └────────────────┘ └──────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

### Key Visual Elements

- **Top Row:** 4 large stat cards with icons
- **Second Row:** 4 colored gradient cards (blue, green, purple, red)
- **Third Row:** 5 clickable navigation cards with hover effects
- **Bottom Row:** 2-column layout (Activity feed + Categories chart)

---

## 2. Job Listings (`/admin/jobs/listings`)

### Layout

```
┌───────────────────────────────────────────────────────┐
│ Job Listings                                          │
│ View and manage all posted job listings               │
├───────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │   8  │ │  5   │ │  2   │ │  1   │                 │
│ │Total │ │ Open │ │InProg│ │Comp. │                 │
│ └──────┘ └──────┘ └──────┘ └──────┘                 │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🔍 [Search...] [Status▾] [Category▾] [📥Export] │ │
│ └───────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ Residential Plumbing Repair        [OPEN][HIGH]   │ │
│ │ Need professional plumber...                      │ │
│ │ 💵 $250 📍Brooklyn 👥 12 apps ⏱️ 1-2 days        │ │
│ │ Client: Sarah Wilson ⭐4.8 | Plumbing             │ │
│ │ [👁️ View Details] [👥 View Applications]         │ │
│ └───────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────┐ │
│ │ House Cleaning Service      [IN_PROGRESS][MEDIUM] │ │
│ │ Looking for thorough cleaning...                  │ │
│ │ 💵 $35/hr 📍Manhattan 👥 8 apps ⏱️ 4-6 hours     │ │
│ │ Client: Michael Brown ⭐4.5 | Home Cleaning       │ │
│ │ [👁️ View Details] [👥 View Applications]         │ │
│ └───────────────────────────────────────────────────┘ │
│ [More job cards...]                                   │
└───────────────────────────────────────────────────────┘
```

### Card Details

```
Each Job Card Contains:
┌─────────────────────────────────────────────┐
│ Title                    [STATUS] [URGENCY] │
│ Description text...                         │
│ 💵 Budget | 📍Location | 👥 Apps | ⏱️ Time  │
│ Client: Name ⭐Rating | Category            │
│ Posted: Date                                │
│ [View Details] [View Applications]          │
└─────────────────────────────────────────────┘
```

---

## 3. Job Applications (`/admin/jobs/applications`)

### Layout

```
┌───────────────────────────────────────────────────────┐
│ Job Applications                                      │
│ Track and manage all job applications                 │
├───────────────────────────────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                       │
│ │10 │ │ 6 │ │ 2 │ │ 1 │ │ 1 │                       │
│ │All│ │Pnd│ │Acc│ │Rej│ │Wth│                       │
│ └───┘ └───┘ └───┘ └───┘ └───┘                       │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🔍 [Search...] [Status▾] [📥 Export]             │ │
│ └───────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ 👤 Mike Thompson ⭐4.9 • 127 jobs completed       │ │
│ │ Applied for: Residential Plumbing Repair          │ │
│ │ Client: Sarah Wilson                              │ │
│ │ ┌─────────────────────────────────────────────┐   │ │
│ │ │ Rate: $240  Duration: 1 day  Avail: Now     │   │ │
│ │ │ Applied: Oct 12, 2024                       │   │ │
│ │ └─────────────────────────────────────────────┘   │ │
│ │ Cover Letter:                                     │ │
│ │ "I have 10+ years of experience..."              │ │
│ │ [👤 View Worker] [📄 View Job] [PENDING]          │ │
│ └───────────────────────────────────────────────────┘ │
│ [More application cards...]                           │
└───────────────────────────────────────────────────────┘
```

---

## 4. Active Jobs (`/admin/jobs/active`)

### Layout

```
┌───────────────────────────────────────────────────────┐
│ Active Jobs                                           │
│ Monitor ongoing work and progress                     │
├───────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │  5   │ │ 60%  │ │  4   │ │$4.9K │                 │
│ │Active│ │ Avg  │ │Escrow│ │Value │                 │
│ └──────┘ └──────┘ └──────┘ └──────┘                 │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🔍 [Search...] [Payment Status▾] [📥 Export]     │ │
│ └───────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ House Cleaning Service            [ESCROW]  $32/hr│ │
│ │ Client: Michael Brown → Worker: Maria Garcia     │ │
│ │ 📍Manhattan | ⏱️ Started: Oct 11                  │ │
│ │                                                   │ │
│ │ Progress: 75%                                     │ │
│ │ ████████████████████░░░░░░                       │ │
│ │                                                   │ │
│ │ Milestones:                                       │ │
│ │ ☑ Kitchen and dining area                        │ │
│ │ ☑ Bedrooms                                        │ │
│ │ ☐ Bathrooms                                       │ │
│ │ ☐ Final inspection                                │ │
│ │                                                   │ │
│ │ Started: Oct 11 | End: Oct 11 | Updated: 2h ago │ │
│ │ Hours: 3.5 | TXN: TXN-2024-001                   │ │
│ │ [View] [💵 Transaction] [💬 Messages] [📊 Report]│ │
│ └───────────────────────────────────────────────────┘ │
│ [More active job cards...]                            │
└───────────────────────────────────────────────────────┘
```

### Progress Bar Colors

- **Green** (75-100%): On track, nearly complete
- **Blue** (50-74%): Good progress
- **Orange** (25-49%): Slower progress
- **Red** (0-24%): Concerning progress

---

## 5. Completed Jobs (`/admin/jobs/completed`)

### Layout

```
┌───────────────────────────────────────────────────────┐
│ Completed Jobs                                        │
│ View finished jobs and payment status                 │
├───────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │  8   │ │$8,223│ │  1   │ │  6   │                 │
│ │Total │ │ Rev  │ │Pndng │ │Review│                 │
│ └──────┘ └──────┘ └──────┘ └──────┘                 │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🔍 [Search] [Payment▾] [Review▾] [📥 Export]     │ │
│ └───────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ ✅ Interior Painting - Living Room    [PAID]      │ │
│ │                                      [REVIEWED]    │ │
│ │ Professional painting service for...              │ │
│ │ Client: David Martinez → Worker: Carlos Rivera   │ │
│ │                                         $450      │ │
│ │ ┌─────────────────────────────────────────────┐   │ │
│ │ │ Started: Oct 7 | Completed: Oct 9          │   │ │
│ │ │ Duration: 2 days | Category: Painting      │   │ │
│ │ └─────────────────────────────────────────────┘   │ │
│ │ ⭐ Client Rating: 5.0 | Worker Rating: 4.8       │ │
│ │ Transaction: TXN-2024-101 | Invoice: INV-2024-01│ │
│ │ [View] [💵 Transaction] [📄 Invoice] [⭐ Reviews]│ │
│ └───────────────────────────────────────────────────┘ │
│ [More completed job cards...]                         │
└───────────────────────────────────────────────────────┘
```

---

## 6. Job Disputes (`/admin/jobs/disputes`)

### Layout

```
┌───────────────────────────────────────────────────────┐
│ ⚠️ Job Disputes                                       │
│ Manage and resolve conflicts                          │
├───────────────────────────────────────────────────────┤
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                       │
│ │ 5 │ │ 2 │ │ 2 │ │ 1 │ │ 0 │                       │
│ │All│ │Opn│ │Rev│ │Res│ │Cls│                       │
│ └───┘ └───┘ └───┘ └───┘ └───┘                       │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🔍 [Search] [Status▾] [Priority▾] [📥 Export]    │ │
│ └───────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────┐ │
│ ║ ⚠️ Painting Service - Incomplete Work             │ │RED
│ ║                      [OPEN] [HIGH PRIORITY]       │ │BORDER
│ ║ Dispute: DISP-001 | Job: JOB-045 | Painting      │ │
│ ║ Disputed by: CLIENT                               │ │
│ ║ ┌─────────────────────────────────────────────┐   │ │
│ ║ │ Client: Robert Thompson                     │   │ │
│ ║ │ Worker: James Wilson                        │   │ │
│ ║ └─────────────────────────────────────────────┘   │ │
│ ║ Reason: Incomplete Work                           │ │
│ ║ "The worker only completed half of the painting   │ │
│ ║  job before leaving..."                           │ │
│ ║ ┌─────────────────────────────────────────────┐   │ │
│ ║ │ Job: $650 | Disputed: $325 | Evidence: 2   │   │ │
│ ║ │ Messages: 8 | Opened: Oct 12, 2024         │   │ │
│ ║ └─────────────────────────────────────────────┘   │ │
│ ║ Evidence: [Photos] [Contract]                     │ │
│ ║ Assigned to: Admin Support Team                   │ │
│ ║ [View] [💬 Messages] [📄 Evidence] [Take Action] │ │
│ └───────────────────────────────────────────────────┘ │
│ [More dispute cards...]                               │
└───────────────────────────────────────────────────────┘
```

### Dispute Card Border Colors

```
Critical Priority: ║ Red left border (4px)
High Priority:     ║ Orange left border (4px)
Medium Priority:   ║ Yellow left border (4px)
Low Priority:      ║ Blue left border (4px)
```

---

## Color Scheme Reference

### Status Badges

```css
/* Green - Success */
.bg-green-100.text-green-800    /* OPEN (listings), COMPLETED, PAID, RESOLVED */

/* Blue - In Progress */
.bg-blue-100.text-blue-800      /* IN_PROGRESS, ESCROW, PROCESSING */

/* Yellow - Pending */
.bg-yellow-100.text-yellow-800  /* PENDING, UNDER_REVIEW */

/* Red - Critical */
.bg-red-100.text-red-800        /* OPEN (disputes), CANCELLED, REJECTED */

/* Gray - Neutral */
.bg-gray-100.text-gray-800      /* CLOSED, WITHDRAWN, NONE */

/* Orange - Attention */
.bg-orange-100.text-orange-800  /* PARTIAL PAYMENT, HIGH URGENCY */

/* Purple - Special */
.bg-purple-100.text-purple-800  /* EVIDENCE, ACCEPTED */
```

### Gradient Cards (Dashboard)

```css
/* Revenue Card */
.from-blue-50.to-blue-100.border-blue-200

/* Average Value Card */
.from-green-50.to-green-100.border-green-200

/* Completion Rate Card */
.from-purple-50.to-purple-100.border-purple-200

/* Disputes Card */
.from-red-50.to-red-100.border-red-200
```

---

## Icon Legend

### Status Icons

- ⏱️ `Clock` - Pending, In Progress, Time
- ✅ `CheckCircle` - Completed, Success
- ❌ `XCircle` - Rejected, Cancelled, Closed
- ⚠️ `AlertTriangle` - Disputes, Warnings
- 🔴 `Circle` (filled) - Critical priority

### Action Icons

- 👁️ `Eye` - View details
- 📥 `Download` - Export data
- 🔍 `Search` - Search functionality
- 💬 `MessageSquare` - Messages, chat
- 📄 `FileText` - Documents, invoices
- 📊 `TrendingUp` - Reports, analytics

### Info Icons

- 💵 `DollarSign` - Money, payments
- 📍 `MapPin` - Location
- 📅 `Calendar` - Dates
- 👤 `User` - People, profiles
- 👥 `Users` - Multiple people, applications
- ⭐ `Star` - Ratings
- 💼 `Briefcase` - Jobs
- 📋 `ClipboardList` - Lists, applications

---

## Responsive Breakpoints

### Grid Layouts

```css
/* Summary Cards */
grid-cols-1          /* Mobile: 1 column */
md:grid-cols-4       /* Tablet+: 4 columns */

/* Content Sections */
grid-cols-1          /* Mobile: 1 column */
lg:grid-cols-2       /* Desktop: 2 columns */

/* Detail Grids */
grid-cols-2          /* Mobile: 2 columns */
md:grid-cols-4       /* Tablet+: 4 columns */
```

### Flex Layouts

```css
/* Filter Bars */
flex-col             /* Mobile: stack vertically */
md:flex-row          /* Tablet+: horizontal */
```

---

## Hover Effects

### Cards

```css
.hover: shadow-lg /* Elevate on hover */ .transition-shadow; /* Smooth animation */
```

### Buttons

```css
.hover:bg-gray-100   /* Light gray on hover */
.hover:underline     /* Underline links on hover */
```

### Links

```css
.text-blue-600       /* Blue link color */
.hover:underline     /* Underline on hover */
```

---

## Empty States

When no results found:

```
┌─────────────────────────────────┐
│                                 │
│         [Relevant Icon]         │
│                                 │
│  No [items] found matching      │
│  your filters                   │
│                                 │
└─────────────────────────────────┘
```

---

## Best Visual Practices

### 1. **Consistent Spacing**

- Card padding: `p-6` (24px)
- Content gaps: `gap-4` (16px)
- Section margins: `mb-6` (24px)

### 2. **Typography Hierarchy**

- Page Title: `text-3xl font-bold` (30px)
- Card Title: `text-lg font-semibold` (18px)
- Body Text: `text-sm` (14px)
- Labels: `text-xs` (12px)

### 3. **Color Contrast**

- Main text: `text-gray-900` (dark)
- Secondary text: `text-gray-600` (medium)
- Muted text: `text-gray-500` (light)

### 4. **Interactive Elements**

- Buttons: Outline or filled variants
- Links: Blue with hover underline
- Cards: Shadow on hover

---

## Print/Export View Considerations

For generated reports:

- Remove hover effects
- Use high-contrast colors
- Include all relevant data
- Add page breaks between major sections
- Include timestamps and filters applied

---

**Note:** All pages follow the same visual language for consistency and ease of use!
