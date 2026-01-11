# Admin Panel - Module 8: Analytics & Reports

**Status**: 📋 PLANNED  
**Priority**: HIGH  
**Estimated Time**: 25-30 hours  
**Dependencies**: All previous modules (uses data from all systems)

---

## Module Overview

Comprehensive analytics and reporting system providing insights into platform performance, user behavior, financial metrics, and business intelligence. Includes customizable dashboards, automated reports, data export, and predictive analytics.

### Scope

- Platform-wide analytics dashboard
- User growth and engagement metrics
- Financial performance reports
- Job marketplace analytics
- Retention and churn analysis
- Custom report builder
- Scheduled report generation
- Data export in multiple formats

---

## Backend APIs Available

### Analytics Endpoints

```python
# Get platform overview statistics
GET /api/adminpanel/analytics/overview
Query: date_from, date_to, compare_period
Response: {
  users: { total, new, active, growth_rate },
  jobs: { total, active, completed, completion_rate },
  revenue: { total, platform_fees, growth_rate },
  transactions: { count, avg_value, payment_methods }
}

# Get user analytics
GET /api/adminpanel/analytics/users
Query: date_from, date_to, segment (all, clients, workers, agencies)
Response: {
  registrations_timeline: [{ date, count, clients, workers, agencies }],
  active_users_timeline: [{ date, dau, wau, mau }],
  user_retention: { day_1, day_7, day_30, day_90 },
  demographic_breakdown: { age_groups, locations, profile_types },
  top_user_segments: [...]
}

# Get job marketplace analytics
GET /api/adminpanel/analytics/jobs
Query: date_from, date_to
Response: {
  jobs_posted_timeline: [{ date, count }],
  jobs_completed_timeline: [{ date, count }],
  avg_completion_time: number,
  category_performance: [{ category, jobs, revenue, avg_budget }],
  budget_distribution: { ranges: [...], counts: [...] },
  application_metrics: { avg_applications_per_job, conversion_rate }
}

# Get financial analytics
GET /api/adminpanel/analytics/financial
Query: date_from, date_to
Response: {
  revenue_timeline: [{ date, revenue, transactions }],
  revenue_by_category: [{ category, revenue, percentage }],
  payment_method_breakdown: [{ method, count, amount }],
  refund_rate: number,
  avg_transaction_value: number,
  mrr: number,
  arr: number
}

# Get engagement metrics
GET /api/adminpanel/analytics/engagement
Query: date_from, date_to
Response: {
  session_metrics: { avg_session_duration, pages_per_session, bounce_rate },
  feature_usage: [{ feature, usage_count, unique_users }],
  retention_cohorts: [{ cohort_date, day_0, day_7, day_30, day_90 }],
  churn_rate: number,
  most_visited_pages: [{ page, views, unique_visitors }]
}

# Get geographic analytics
GET /api/adminpanel/analytics/geographic
Response: {
  users_by_location: [{ city, province, count, percentage }],
  jobs_by_location: [{ city, count }],
  revenue_by_location: [{ city, revenue }],
  heat_map_data: [{ lat, lng, intensity }]
}

# Get worker analytics
GET /api/adminpanel/analytics/workers
Query: date_from, date_to
Response: {
  total_workers: number,
  verified_workers: number,
  avg_rating: number,
  top_categories: [{ category, worker_count, avg_earnings }],
  earnings_distribution: { ranges: [...], counts: [...] },
  worker_retention: { active_30d, active_90d }
}

# Get client analytics
GET /api/adminpanel/analytics/clients
Query: date_from, date_to
Response: {
  total_clients: number,
  repeat_clients: number,
  repeat_rate: number,
  avg_jobs_per_client: number,
  avg_lifetime_value: number,
  spending_distribution: { ranges: [...], counts: [...] }
}

# Create custom report
POST /api/adminpanel/analytics/reports/custom
Body: {
  name: string,
  metrics: [],
  filters: {},
  date_range: {},
  format: 'pdf' | 'csv' | 'excel'
}
Response: { report_id, download_url }

# Schedule report
POST /api/adminpanel/analytics/reports/schedule
Body: {
  report_type: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  recipients: [],
  format: string
}

# Get scheduled reports
GET /api/adminpanel/analytics/reports/scheduled

# Get report history
GET /api/adminpanel/analytics/reports/history
Query: page, limit
```

---

## Implementation Tasks

### Task 1: Main Analytics Dashboard ⏰ 6-7 hours

**File**: `apps/frontend_web/app/admin/analytics/page.tsx`

**AI Prompt**:

```
Create Main Analytics Dashboard:
1. Fetch from /api/adminpanel/analytics/overview
2. Date range selector (top right):
   - Quick options: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, Custom Range
   - Compare toggle: "Compare to previous period"
3. KPI Cards (4 large cards):
   - Total Users: Count with growth % (green up arrow, red down arrow), sparkline chart
   - Active Jobs: Count with completion rate %, mini bar chart
   - Total Revenue: ₱ amount with growth %, line chart
   - Platform Fees: ₱ amount with percentage of revenue, progress bar
4. Main Charts Section (2 columns):
   - Left: Revenue Trend (line chart):
     * X-axis: Date (daily/weekly/monthly based on range)
     * Y-axis: Revenue (₱)
     * Show transaction count as bars (secondary axis)
     * Comparison line (dotted) if compare enabled
   - Right: User Growth (area chart):
     * New users, Active users
     * Color-coded areas (blue, green)
5. Secondary Metrics Grid (3 columns):
   - Jobs by Category: Horizontal bar chart (top 5 categories)
   - Payment Methods: Donut chart (GCash, Wallet, Cash percentages)
   - User Types: Pie chart (Clients, Workers, Agencies)
6. Quick Stats Tiles (6 tiles in 2 rows):
   - Avg Transaction: ₱ amount
   - Completion Rate: % with target indicator
   - Response Time: hours with color code
   - Active Workers: count
   - Repeat Clients: %
   - Platform Rating: ⭐ score
7. Recent Activity Feed (right sidebar, scrollable):
   - Last 10 significant events: New user, Job completed, Payment processed, etc.
   - Timestamp and icon per event type
8. Export Dashboard button (PDF/PNG screenshot)
9. Refresh button with last updated timestamp
10. Responsive grid layout with Tailwind

File: apps/frontend_web/app/admin/analytics/page.tsx
Dependencies: Chart.js or Recharts, date-fns for date handling
```

---

### Task 2: User Analytics Deep Dive ⏰ 5-6 hours

**File**: `apps/frontend_web/app/admin/analytics/users/page.tsx`

**AI Prompt**:

```
Create User Analytics page:
1. Fetch from /api/adminpanel/analytics/users
2. Date range selector + Segment filter (All, Clients, Workers, Agencies)
3. User Growth Section:
   - Registration Timeline: Line chart (daily registrations)
   - Segmented by user type (stacked area)
   - Cumulative total line (secondary axis)
4. Active Users Section:
   - DAU/WAU/MAU metrics cards
   - Active Users Trend: Line chart with all 3 metrics
   - Activity heatmap: Calendar view showing daily active users
5. Retention Cohort Analysis:
   - Cohort table: Rows = registration month, Columns = retention % (Day 1, 7, 30, 90)
   - Color-coded cells: green high retention, red low retention
   - Average retention row at bottom
6. User Demographics:
   - Age Groups: Bar chart (18-24, 25-34, 35-44, 45+)
   - Location Map: Philippines map with city markers sized by user count
   - Top 10 Cities table: City, User count, % of total
7. User Segments:
   - Top segments cards: "Active Workers in Zamboanga", "High-value Clients", etc.
   - Segment size, Avg value, Growth trend
8. Churn Analysis:
   - Churn Rate: % with trend (target <5%)
   - Reasons for Churn: Pie chart (if data available)
   - At-Risk Users: Count with warning threshold
9. Export buttons: Export User Data (CSV), Generate Report (PDF)
10. Filters: Apply segment filter to all charts simultaneously

File: apps/frontend_web/app/admin/analytics/users/page.tsx
```

---

### Task 3: Job Marketplace Analytics ⏰ 5-6 hours

**File**: `apps/frontend_web/app/admin/analytics/jobs/page.tsx`

**AI Prompt**:

```
Create Job Marketplace Analytics:
1. Fetch from /api/adminpanel/analytics/jobs
2. Date range selector
3. Job Volume Metrics:
   - Jobs Posted Timeline: Line chart
   - Jobs Completed Timeline: Line chart (overlaid or separate)
   - Completion Rate: % with trend indicator
   - Avg Completion Time: Days with target benchmark
4. Category Performance:
   - Table with columns: Category, Jobs Posted, Jobs Completed, Completion Rate, Avg Budget, Total Revenue
   - Sort by any column
   - Top 5 categories highlighted
5. Budget Analysis:
   - Budget Distribution: Histogram (₱0-500, ₱500-1000, ₱1000-2000, etc.)
   - Avg Budget Trend: Line chart over time
   - Budget vs Completion Rate: Scatter plot (X: budget, Y: completion rate)
6. Application Metrics:
   - Avg Applications per Job: Number with trend
   - Application-to-Hire Conversion: % funnel chart (Applications → Hires)
   - Time to First Application: Avg hours
7. Job Lifecycle Funnel:
   - Posted → Applications → Assigned → In Progress → Completed → Reviewed
   - Show drop-off counts at each stage
8. Geographic Distribution:
   - Jobs by City: Bar chart (top 10 cities)
   - Jobs Map: Heat map showing job density by location
9. Urgency Analysis:
   - Jobs by Urgency: Pie chart (Low, Medium, High)
   - Urgency vs Completion Time: Comparison chart
10. Export: Export Job Analytics (CSV/PDF)

File: apps/frontend_web/app/admin/analytics/jobs/page.tsx
```

---

### Task 4: Financial Reports ⏰ 5-6 hours

**File**: `apps/frontend_web/app/admin/analytics/financial/page.tsx`

**AI Prompt**:

```
Create Financial Reports page:
1. Fetch from /api/adminpanel/analytics/financial
2. Date range selector with fiscal year option
3. Revenue Overview:
   - Total Revenue: Large ₱ amount with growth %
   - MRR (Monthly Recurring Revenue): ₱ amount
   - ARR (Annual Recurring Revenue): ₱ amount (MRR × 12)
   - Revenue Growth Rate: % (month-over-month, year-over-year)
4. Revenue Timeline:
   - Line chart: Daily/Weekly/Monthly revenue
   - Transaction volume bars (secondary axis)
   - Moving average trend line (dotted)
5. Revenue by Category:
   - Horizontal bar chart: Category, Revenue, % of total
   - Top 5 categories highlighted
6. Payment Methods:
   - Breakdown table: Method, Transaction Count, Total Amount, % of Total
   - Pie chart showing distribution
   - Comparison vs last period
7. Platform Fees:
   - Total Fees Collected: ₱ amount
   - Avg Fee per Transaction: ₱
   - Fee % of Total Revenue: %
   - Fees Timeline: Line chart
8. Refund Analysis:
   - Refund Rate: % with threshold indicator (target <2%)
   - Refunded Amount: ₱
   - Refund Reasons: Pie chart
   - Refund Trend: Line chart
9. Transaction Metrics:
   - Avg Transaction Value: ₱
   - Transaction Count: Total with growth %
   - Largest Transaction: ₱ (this period)
   - Transaction Distribution: Histogram
10. Financial Health Indicators:
   - Gross Margin: %
   - Net Revenue: ₱ (after refunds/fees)
   - Revenue per User: ₱
11. Export: Generate Financial Report (PDF with detailed tables)

File: apps/frontend_web/app/admin/analytics/financial/page.tsx
```

---

### Task 5: Engagement Metrics Dashboard ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/analytics/engagement/page.tsx`

**AI Prompt**:

```
Create Engagement Metrics Dashboard:
1. Fetch from /api/adminpanel/analytics/engagement
2. Session Metrics Cards:
   - Avg Session Duration: Minutes:Seconds
   - Pages per Session: Number
   - Bounce Rate: % (lower is better)
3. Feature Usage:
   - Table: Feature Name, Usage Count, Unique Users, Engagement Rate
   - Bar chart: Top 10 most used features
   - Trend over time for selected feature
4. Retention Cohorts:
   - Cohort analysis table (similar to user analytics but focus on engagement)
   - Rows: Cohort (by month)
   - Columns: Day 0, Day 7, Day 30, Day 90 (% still active)
   - Heatmap coloring
5. Page Analytics:
   - Most Visited Pages: Table (Page, Views, Unique Visitors, Avg Time)
   - Page Flow diagram: Show common navigation paths
   - Exit Pages: Pages where users leave most
6. User Journey Map:
   - Sankey diagram: Entry → Pages → Actions → Exit
   - Highlight conversion paths
7. Churn Prediction:
   - Churn Rate: % with trend
   - At-Risk Users: Count and list (users inactive >30 days)
   - Churn Reasons: If available from exit surveys
8. Engagement Score:
   - Overall Platform Engagement Score: 0-100
   - Calculation: Weighted average of DAU, session duration, feature usage
   - Trend over time
9. User Segments by Engagement:
   - Highly Engaged: >5 sessions/week
   - Moderately Engaged: 2-5 sessions/week
   - Low Engagement: <2 sessions/week
   - Inactive: No activity in 30 days
10. Export: Engagement Report (PDF)

File: apps/frontend_web/app/admin/analytics/engagement/page.tsx
```

---

### Task 6: Custom Report Builder ⏰ 6-7 hours

**File**: `apps/frontend_web/app/admin/analytics/reports/custom/page.tsx`

**AI Prompt**:

```
Create Custom Report Builder:
1. Step-by-step wizard interface (4 steps):

Step 1: Select Metrics
- Checkboxes grouped by category:
  * Users: Total, New, Active, Churn Rate, Retention
  * Jobs: Posted, Completed, Completion Rate, Avg Budget
  * Revenue: Total, Platform Fees, MRR, ARR
  * Engagement: Session Duration, Pages/Session, Feature Usage
- "Select All" option per category
- Selected count badge

Step 2: Configure Filters
- Date Range: Dropdown + date pickers
- User Segment: Clients, Workers, Agencies, All
- Location: Multi-select cities
- Category: Multi-select job categories
- Status: Active, Completed, All
- Budget Range: Min/Max inputs
- Apply Filters button with preview count

Step 3: Choose Visualization
- Chart Type selector:
  * Table: Data in tabular format
  * Line Chart: Trend over time
  * Bar Chart: Comparison across categories
  * Pie Chart: Distribution percentages
  * Area Chart: Cumulative trends
  * Heatmap: Density/intensity data
- Preview: Show sample chart with selected metrics
- Grouping: By day, week, month, category, location

Step 4: Export & Schedule
- Report Name: Text input (required)
- Description: Textarea (optional)
- Export Format:
  * PDF (formatted report)
  * CSV (raw data)
  * Excel (with charts)
  * JSON (API data)
- Schedule Options:
  * One-time: Generate now
  * Recurring: Daily, Weekly, Monthly
  * Recipients: Multi-email input (comma-separated)
  * Time: Time picker (for scheduled)
- Generate Report button

2. Report Preview:
   - Show preview before finalizing
   - Edit button to go back to any step
   - Sample data rendered with selected options

3. Saved Reports:
   - List of previously created custom reports
   - Quick regenerate button
   - Edit/Delete options

4. API calls:
   - POST /analytics/reports/custom (generate)
   - POST /analytics/reports/schedule (schedule)
   - GET /analytics/reports/history (list reports)

File: apps/frontend_web/app/admin/analytics/reports/custom/page.tsx
```

---

### Task 7: Scheduled Reports Manager ⏰ 3-4 hours

**File**: `apps/frontend_web/app/admin/analytics/reports/scheduled/page.tsx`

**AI Prompt**:

```
Create Scheduled Reports Manager:
1. Fetch from /api/adminpanel/analytics/reports/scheduled
2. Scheduled Reports Table:
   - Columns: Report Name, Type, Frequency, Next Run, Recipients, Format, Status, Actions
   - Frequency: Daily (9:00 AM), Weekly (Mon 9:00 AM), Monthly (1st, 9:00 AM)
   - Next Run: Countdown timer "in 2 hours" or date
   - Recipients: Email list (truncated, tooltip on hover)
   - Status badges: Active (green), Paused (yellow), Failed (red)
   - Actions: Edit, Pause/Resume, Delete, Run Now
3. Add Scheduled Report button:
   - Opens modal with form:
     * Report Type: Dropdown (User Analytics, Job Analytics, Financial, Custom)
     * Frequency: Daily, Weekly, Monthly
     * Day/Time picker (conditional based on frequency)
     * Recipients: Multi-email input with validation
     * Format: PDF, CSV, Excel
     * Include Charts: Checkbox (PDF only)
   - Save button
4. Report History Tab:
   - Table: Report Name, Generated Date, Status (Success/Failed), Download link
   - Filter: Last 7 days, Last 30 days, All time
   - Download button per report (if success)
   - Error message (if failed)
5. Report Templates:
   - Pre-configured report templates:
     * Daily Operations Summary
     * Weekly Revenue Report
     * Monthly User Growth
     * Quarterly Financial Report
   - "Use Template" button creates scheduled report with pre-filled settings
6. Email Preview:
   - Preview button shows sample email with report attachment
   - Subject line, Body, Attachment info
7. Notifications:
   - Success: "Report scheduled successfully"
   - Run Now: "Report generation started, will be sent to recipients"
8. API calls:
   - GET /reports/scheduled, POST /reports/schedule
   - PUT /reports/scheduled/{id}, DELETE /reports/scheduled/{id}
   - POST /reports/scheduled/{id}/run-now

File: apps/frontend_web/app/admin/analytics/reports/scheduled/page.tsx
```

---

### Task 8: Geographic Analytics (Bonus) ⏰ 3-4 hours

**File**: `apps/frontend_web/app/admin/analytics/geographic/page.tsx`

**AI Prompt**:

```
Create Geographic Analytics page:
1. Fetch from /api/adminpanel/analytics/geographic
2. Philippines Map:
   - Interactive map (use Leaflet or Google Maps API)
   - City markers sized by user count
   - Color-coded by revenue (gradient: low = blue, high = red)
   - Click marker: Popup showing stats (users, jobs, revenue)
3. Regional Breakdown Table:
   - Columns: Region, Cities, Users, Jobs Posted, Jobs Completed, Revenue
   - Sort by any column
   - Top region highlighted
4. Top 10 Cities:
   - Bar chart: Cities ranked by metric (users, jobs, revenue - toggle)
   - Click bar: Zoom to city on map
5. City Deep Dive (select city):
   - User growth timeline (for selected city)
   - Job category distribution (for selected city)
   - Revenue trend (for selected city)
6. Heat Map:
   - Overlay showing job/user density
   - Toggle: Users heat map / Jobs heat map
7. Location-based Insights:
   - Cities with highest growth rate
   - Underserved cities (high demand, low workers)
   - Expansion opportunities (cities with potential)
8. Export: Geographic Report (PDF with map screenshots)

File: apps/frontend_web/app/admin/analytics/geographic/page.tsx
Dependencies: Leaflet or Google Maps React, react-leaflet
```

---

## Testing Checklist

### Main Dashboard

- [ ] All KPI cards display with data
- [ ] Date range selector changes data
- [ ] Compare period shows comparison
- [ ] Revenue chart renders correctly
- [ ] User growth chart displays
- [ ] Secondary charts accurate
- [ ] Quick stats tiles load
- [ ] Activity feed updates
- [ ] Export dashboard works
- [ ] Refresh updates data

### User Analytics

- [ ] Registration timeline accurate
- [ ] Active users metrics correct
- [ ] Retention cohorts display
- [ ] Demographics charts render
- [ ] Location map shows data
- [ ] Segment filter works
- [ ] Churn analysis accurate
- [ ] Export works

### Job Analytics

- [ ] Job volume charts display
- [ ] Category performance table sorts
- [ ] Budget distribution accurate
- [ ] Application metrics correct
- [ ] Lifecycle funnel renders
- [ ] Geographic distribution displays
- [ ] Urgency analysis charts work
- [ ] Export works

### Financial Reports

- [ ] Revenue metrics accurate
- [ ] MRR/ARR calculated correctly
- [ ] Revenue timeline displays
- [ ] Payment method breakdown correct
- [ ] Refund analysis accurate
- [ ] Transaction metrics display
- [ ] Financial indicators correct
- [ ] Export PDF works

### Engagement Metrics

- [ ] Session metrics display
- [ ] Feature usage table loads
- [ ] Retention cohorts render
- [ ] Page analytics accurate
- [ ] User journey map displays
- [ ] Churn prediction works
- [ ] Engagement score calculates
- [ ] Segment breakdown correct
- [ ] Export works

### Custom Report Builder

- [ ] Step 1: Metric selection works
- [ ] Step 2: Filters apply correctly
- [ ] Step 3: Chart preview displays
- [ ] Step 4: Export options work
- [ ] Report generates successfully
- [ ] Schedule creates recurring report
- [ ] Saved reports list displays
- [ ] Edit/regenerate works

### Scheduled Reports

- [ ] Scheduled reports table loads
- [ ] Add report modal validates
- [ ] Frequency options work
- [ ] Recipients validation works
- [ ] Pause/Resume works
- [ ] Run Now generates report
- [ ] Report history displays
- [ ] Download links work
- [ ] Templates load pre-filled
- [ ] Email preview displays

### Geographic Analytics

- [ ] Map loads with markers
- [ ] Marker size by data works
- [ ] Popup displays stats
- [ ] Regional breakdown table sorts
- [ ] Top 10 cities chart displays
- [ ] City selection updates data
- [ ] Heat map overlay works
- [ ] Insights display correctly
- [ ] Export with map screenshots

---

## File Structure

```
apps/frontend_web/app/admin/analytics/
├── page.tsx                        ❌ CREATE (main dashboard)
├── users/
│   └── page.tsx                    ❌ CREATE (user analytics)
├── jobs/
│   └── page.tsx                    ❌ CREATE (job analytics)
├── financial/
│   └── page.tsx                    ❌ CREATE (financial reports)
├── engagement/
│   └── page.tsx                    ❌ CREATE (engagement metrics)
├── geographic/
│   └── page.tsx                    ❌ CREATE (geographic analytics)
└── reports/
    ├── custom/
    │   └── page.tsx                ❌ CREATE (custom report builder)
    └── scheduled/
        └── page.tsx                ❌ CREATE (scheduled reports)
```

---

## API Integration Summary

| Endpoint                                      | Method | Purpose                | Status   |
| --------------------------------------------- | ------ | ---------------------- | -------- |
| `/api/adminpanel/analytics/overview`          | GET    | Platform overview      | ✅ Ready |
| `/api/adminpanel/analytics/users`             | GET    | User analytics         | ✅ Ready |
| `/api/adminpanel/analytics/jobs`              | GET    | Job analytics          | ✅ Ready |
| `/api/adminpanel/analytics/financial`         | GET    | Financial reports      | ✅ Ready |
| `/api/adminpanel/analytics/engagement`        | GET    | Engagement metrics     | ✅ Ready |
| `/api/adminpanel/analytics/geographic`        | GET    | Geographic data        | ✅ Ready |
| `/api/adminpanel/analytics/workers`           | GET    | Worker analytics       | ✅ Ready |
| `/api/adminpanel/analytics/clients`           | GET    | Client analytics       | ✅ Ready |
| `/api/adminpanel/analytics/reports/custom`    | POST   | Generate custom report | ✅ Ready |
| `/api/adminpanel/analytics/reports/schedule`  | POST   | Schedule report        | ✅ Ready |
| `/api/adminpanel/analytics/reports/scheduled` | GET    | List scheduled reports | ✅ Ready |
| `/api/adminpanel/analytics/reports/history`   | GET    | Report history         | ✅ Ready |

---

## Dependencies

- **Chart Library**: Chart.js or Recharts (required for all charts)
- **Map Library**: Leaflet or Google Maps React (for geographic analytics)
- **Date Library**: date-fns or moment.js (for date handling)
- **PDF Generator**: jsPDF or server-side PDF generation (for reports)
- **All Modules**: Uses data from Users, Jobs, Payments, Reviews, Support

---

## Completion Criteria

✅ Module complete when:

1. Main analytics dashboard operational with all KPIs
2. User analytics deep dive working
3. Job marketplace analytics functional
4. Financial reports complete
5. Engagement metrics dashboard
6. Custom report builder functional
7. Scheduled reports manager working
8. Geographic analytics (optional) complete
9. All charts rendering correctly
10. All exports working
11. All tests passing
12. Documentation updated

---

**Ready for Implementation**: ✅ All backend APIs operational, comprehensive analytics designed
