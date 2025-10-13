# Jobs Management - Quick Reference Guide

## Page URLs

| Page                 | URL                        | Purpose                     |
| -------------------- | -------------------------- | --------------------------- |
| **Jobs Dashboard**   | `/admin/jobs`              | Overview and statistics     |
| **Job Listings**     | `/admin/jobs/listings`     | All posted jobs             |
| **Job Applications** | `/admin/jobs/applications` | Application tracking        |
| **Active Jobs**      | `/admin/jobs/active`       | Ongoing work monitoring     |
| **Completed Jobs**   | `/admin/jobs/completed`    | Finished jobs with payments |
| **Job Disputes**     | `/admin/jobs/disputes`     | Conflict resolution         |

---

## Data Quick Stats

### Job Listings (8 jobs)

- 5 Open jobs
- 2 In Progress
- 1 Completed
- Categories: Plumbing, Cleaning, Electrical, Painting, Carpentry, HVAC, Landscaping, Roofing

### Applications (10 applications)

- 6 Pending
- 2 Accepted
- 1 Rejected
- 1 Withdrawn

### Active Jobs (5 jobs)

- Average Progress: 60%
- 4 In Escrow
- 1 Partial Payment
- Total Value: ~$4,900

### Completed Jobs (8 jobs)

- 6 Paid ($8,223 revenue)
- 1 Processing
- 1 Pending
- 6 Reviewed jobs

### Disputes (5 disputes)

- 2 Open
- 2 Under Review
- 1 Resolved

---

## Key Features Per Page

### 1. Jobs Dashboard

- 8 statistics cards
- Recent activity feed (4 items)
- Top categories chart (5 categories)
- Quick navigation cards

### 2. Job Listings

- Search + 2 filters (status, category)
- 4 summary cards
- Detailed job cards
- Urgency indicators
- Application counts

### 3. Job Applications

- Search + 1 filter (status)
- 5 summary cards (by status)
- Worker profiles with ratings
- Cover letters
- Proposed rates

### 4. Active Jobs

- Search + 1 filter (payment status)
- 4 summary cards
- Progress bars (0-100%)
- Milestone tracking (4 per job)
- Transaction links
- Hours worked tracking

### 5. Completed Jobs

- Search + 2 filters (payment, review)
- 4 summary cards
- Client/worker ratings
- Transaction & invoice links
- Duration tracking
- Review status

### 6. Job Disputes

- Search + 2 filters (status, priority)
- 5 summary cards
- Priority indicators
- Evidence tracking
- Message counts
- Resolution notes
- Assigned mediators

---

## Status Color Codes

### Universal Colors

| Status               | Color  | Usage                                        |
| -------------------- | ------ | -------------------------------------------- |
| ✅ Success/Completed | Green  | Completed jobs, Paid, Resolved, Accepted     |
| 🔵 In Progress       | Blue   | Active jobs, Escrow, Processing              |
| 🟡 Pending/Warning   | Yellow | Pending applications, Under Review           |
| 🔴 Critical/Error    | Red    | Disputes, Cancelled, Rejected, Open disputes |
| ⚫ Neutral/Closed    | Gray   | Closed disputes, Withdrawn, None             |
| 🟠 Attention         | Orange | High priority, Partial payment               |

---

## Dummy User Data

### Clients (16 unique)

- Sarah Wilson, Michael Brown, Emily Chen, David Martinez, Jessica Lee, Robert Johnson, Amanda White, Thomas Garcia, Jennifer Taylor, William Davis, Lisa Anderson, Nancy Wilson, Kevin Brown, Patricia Moore, Steven Clark, Christopher White, Michelle Johnson

### Workers (21 unique)

- Mike Thompson, James Rodriguez, Maria Garcia, Robert Chen, David Kim, Thomas Anderson, Carlos Martinez, John Williams, Linda Johnson, Ahmed Hassan, Carlos Rivera, Robert Taylor, Miguel Santos, Anthony Lee, William Harris, Isabella Martinez, Ricardo Lopez, Daniel Rodriguez, and more

---

## Transaction & Invoice IDs

### Active Jobs

- TXN-2024-001 through TXN-2024-005

### Completed Jobs

- TXN-2024-101 through TXN-2024-108
- INV-2024-001 through INV-2024-008

---

## Common Job IDs

### Job Listings

- JOB-001 through JOB-008

### Disputes Reference

- JOB-045, JOB-067, JOB-089, JOB-102, JOB-115

### Applications Reference

- APP-001 through APP-010

### Active Jobs

- ACT-001 through ACT-005

### Completed Jobs

- COMP-001 through COMP-008

### Disputes

- DISP-001 through DISP-005

---

## Budget Ranges

| Category      | Range       | Type   |
| ------------- | ----------- | ------ |
| Home Cleaning | $28-$38/hr  | Hourly |
| Plumbing      | $240-$875   | Fixed  |
| Electrical    | $550-$1,200 | Fixed  |
| Painting      | $450-$680   | Fixed  |
| Carpentry     | $625-$2,500 | Fixed  |
| HVAC          | $300        | Fixed  |
| Landscaping   | $350-$1,850 | Fixed  |
| Roofing       | $480-$500   | Fixed  |
| Windows       | $1,450      | Fixed  |

---

## Filter Options

### Job Listings

- **Status:** All, Open, In Progress, Completed, Cancelled
- **Category:** All, (dynamic based on jobs)

### Applications

- **Status:** All, Pending, Accepted, Rejected, Withdrawn

### Active Jobs

- **Payment:** All, Pending, Escrow, Partial, Released

### Completed Jobs

- **Payment:** All, Paid, Processing, Pending
- **Review:** All, Reviewed, Pending Review, No Review

### Disputes

- **Status:** All, Open, Under Review, Resolved, Closed
- **Priority:** All, Critical, High, Medium, Low

---

## Quick Navigation Links

### From Jobs → Other Sections

```typescript
// To Users
/admin/users/clients/[clientId]
/admin/users/workers/[workerId]

// To Payments
/admin/payments/transactions/[transactionId]

// To Reviews
/admin/reviews?job=[jobId]
```

### Within Jobs Section

```typescript
// From Listings
→ View Applications: /admin/jobs/applications?job=[jobId]
→ View Details: /admin/jobs/listings/[jobId]

// From Applications
→ View Worker: /admin/users/workers/[workerId]
→ View Job: /admin/jobs/listings/[jobId]
→ View Active Job: /admin/jobs/active (if accepted)

// From Active
→ View Details: /admin/jobs/active/[jobId]
→ View Transaction: /admin/payments/transactions/[transactionId]

// From Completed
→ View Details: /admin/jobs/completed/[jobId]
→ View Transaction: /admin/payments/transactions/[transactionId]
→ View Reviews: /admin/reviews?job=[jobId]

// From Disputes
→ View Details: /admin/jobs/disputes/[disputeId]
→ View Job: /admin/jobs/listings/[jobId]
```

---

## Icons Reference

| Icon             | Usage         | Pages                       |
| ---------------- | ------------- | --------------------------- |
| 💼 Briefcase     | Jobs main     | Dashboard, Listings         |
| 📋 ClipboardList | Applications  | Dashboard, Applications     |
| ⏱️ Clock         | Time/progress | Active, Pending             |
| ✅ CheckCircle   | Completed     | Completed, Milestones       |
| ⚠️ AlertTriangle | Disputes      | Disputes                    |
| ⭐ Star          | Ratings       | Applications, Completed     |
| 💵 DollarSign    | Money         | All financial displays      |
| 📍 MapPin        | Location      | Listings, Active, Completed |
| 📅 Calendar      | Dates         | All pages                   |
| 👤 User          | People        | All pages with users        |
| 💬 MessageSquare | Messages      | Disputes                    |
| 📊 TrendingUp    | Progress      | Active, Analytics           |
| 📄 FileText      | Documents     | Completed, Disputes         |
| 👁️ Eye           | View actions  | All pages                   |
| 📥 Download      | Export        | All pages                   |
| 🔍 Search        | Search bars   | All pages                   |

---

## Milestone Examples (Active Jobs)

### Typical 4-Milestone Structure

1. **Initial/Preparation** (e.g., "System inspection", "Demolition")
2. **Main Work** (e.g., "Cabinet installation", "Filter replacement")
3. **Secondary Tasks** (e.g., "Countertop installation", "Duct cleaning")
4. **Completion** (e.g., "Final testing", "Quality check")

---

## Evidence Types (Disputes)

Common evidence types in dummy data:

- Photos
- Videos
- Contracts/Original Agreements
- Messages/Chat History
- Receipts
- Completion Certificates
- Witness Statements

---

## Best Practices for Using Dummy Data

### Testing Scenarios

1. **Happy Path:**
   - Browse Job Listings
   - Check Applications
   - Monitor Active Jobs progress
   - Verify Completed Jobs payments

2. **Edge Cases:**
   - Filter with no results
   - Search for non-existent terms
   - Check disputed jobs
   - Verify pending payments

3. **Integration Testing:**
   - Click user profile links
   - Navigate to transaction pages
   - Check review links
   - Test export buttons

---

## Component Reusability

### Shared Components Used

- `Sidebar` - Main navigation
- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Content containers
- `Button` - Actions
- `Input` - Search fields
- Lucide React Icons

### Common Patterns

```typescript
// Search Pattern
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
  <Input placeholder="Search..." className="pl-10" />
</div>

// Status Badge Pattern
<span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
  {status.toUpperCase()}
</span>

// Filter Pattern
<select className="px-4 py-2 border rounded-md bg-white">
  <option value="all">All Items</option>
  {/* options */}
</select>
```

---

## Performance Considerations

### Current Implementation

- Client-side filtering (suitable for demo)
- All data loaded at once
- No pagination

### For Production

Consider adding:

- Server-side pagination
- API-based filtering
- Infinite scroll
- Data caching
- Skeleton loaders
- Debounced search

---

## Accessibility Features

### Keyboard Navigation

- Tab through all interactive elements
- Enter to activate buttons/links
- Arrow keys in dropdowns

### Screen Readers

- Semantic HTML elements
- Descriptive link text
- Status announcements
- Form labels

### Visual

- High contrast colors
- Clear focus indicators
- Readable font sizes
- Icon + text labels

---

**Quick Start:** Navigate to `/admin/jobs` to see the dashboard!
