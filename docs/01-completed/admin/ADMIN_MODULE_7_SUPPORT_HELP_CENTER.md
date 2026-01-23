# Admin Panel - Module 7: Support & Help Center

**Status**: 📋 PLANNED  
**Priority**: MEDIUM  
**Estimated Time**: 18-22 hours  
**Dependencies**: Module 2 (User Management for user links)

---

## Module Overview

Comprehensive support ticket system and help center management for handling user inquiries, technical issues, feature requests, and providing self-service resources. Includes ticket management, canned responses, FAQ management, and support analytics.

### Scope

- Support ticket system with categorization
- Ticket assignment and tracking
- Canned response library
- FAQ/Help article management
- User report management (inappropriate content)
- Support analytics and performance metrics
- Live chat management (optional)

---

## Backend APIs Available

### Support Ticket Endpoints

```python
# Get all support tickets
GET /api/adminpanel/support/tickets
Query: page, limit, status, priority, category, assigned_to, search
Response: {
  tickets: [{
    id, user_id, subject, category, priority, status, assigned_to,
    created_at, last_reply_at, reply_count
  }],
  pagination: { ... }
}

# Get ticket detail
GET /api/adminpanel/support/tickets/{id}
Response: {
  ticket: { id, user_id, subject, description, category, priority, status },
  user: { name, email, profile_type },
  messages: [{ id, sender_id, sender_name, is_admin, message, created_at }],
  attachments: [{ id, filename, url }],
  history: [{ action, admin_name, timestamp }]
}

# Create ticket (admin on behalf of user)
POST /api/adminpanel/support/tickets
Body: { user_id, subject, description, category, priority }

# Reply to ticket
POST /api/adminpanel/support/tickets/{id}/reply
Body: { message: string, is_internal_note: boolean, attachments?: [] }

# Assign ticket
POST /api/adminpanel/support/tickets/{id}/assign
Body: { admin_id: number }

# Update ticket status
PUT /api/adminpanel/support/tickets/{id}/status
Body: { status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed' }

# Update ticket priority
PUT /api/adminpanel/support/tickets/{id}/priority
Body: { priority: 'low' | 'medium' | 'high' | 'urgent' }

# Close ticket
POST /api/adminpanel/support/tickets/{id}/close
Body: { resolution_note: string }

# Get canned responses
GET /api/adminpanel/support/canned-responses
Response: {
  responses: [{ id, title, content, category, usage_count }]
}

# Create canned response
POST /api/adminpanel/support/canned-responses
Body: { title, content, category, shortcuts?: [] }

# Get FAQs
GET /api/adminpanel/support/faqs
Query: category, is_published
Response: {
  faqs: [{ id, question, answer, category, views, is_published, order }]
}

# Create FAQ
POST /api/adminpanel/support/faqs
Body: { question, answer, category, is_published }

# Update FAQ
PUT /api/adminpanel/support/faqs/{id}
Body: { question?, answer?, category?, is_published?, order? }

# Delete FAQ
DELETE /api/adminpanel/support/faqs/{id}

# Get user reports
GET /api/adminpanel/support/reports
Query: status, type, reported_user_id
Response: {
  reports: [{
    id, reporter_id, reported_user_id, reported_content_type,
    reported_content_id, reason, description, status, created_at
  }]
}

# Review report
POST /api/adminpanel/support/reports/{id}/review
Body: { action: 'warning' | 'suspend' | 'ban' | 'dismiss', notes: string }

# Get support statistics
GET /api/adminpanel/support/statistics
Query: date_from, date_to
Response: {
  total_tickets: number,
  open_tickets: number,
  resolved_tickets: number,
  avg_response_time: number,
  avg_resolution_time: number,
  ticket_by_category: { ... },
  ticket_by_priority: { ... }
}
```

---

## Implementation Tasks

### Task 1: Support Tickets List ⏰ 5-6 hours

**File**: `apps/frontend_web/app/admin/support/tickets/page.tsx`

**AI Prompt**:

```
Create Support Tickets list page:
1. Fetch from /api/adminpanel/support/tickets
2. Filters (top bar):
   - Search: Text input (search subject/description)
   - Status tabs: All, Open, In Progress, Waiting User, Resolved, Closed
   - Priority filter: All, Low, Medium, High, Urgent
   - Category filter: All, Account, Payment, Technical, Feature Request, Bug Report
   - Assigned filter: All, Unassigned, Assigned to Me, Assigned to Others
   - Date range: Last 7 Days, Last 30 Days, Custom Range
3. Stats cards (4 cards):
   - Open Tickets (count, red if >50)
   - In Progress (count, yellow)
   - Resolved Today (count, green)
   - Avg Response Time (hours, target <4h)
4. Tickets table:
   - Columns: ID, Subject, User Name, Category badge, Priority badge, Status badge, Assigned To, Last Reply, Actions
   - Priority badges: Urgent (red), High (orange), Medium (yellow), Low (gray)
   - Status badges: color-coded
   - Category badges: Account (blue), Payment (green), Technical (purple), etc.
   - Last Reply: "2 hours ago" format
   - Assigned To: Avatar + name or "Unassigned" (gray)
   - Actions: Quick Reply, Assign, View Details
5. Bulk actions:
   - Select multiple tickets
   - Bulk assign to admin
   - Bulk close with resolution note
   - Bulk change priority
6. Click ticket row to open detail page
7. "New Ticket" button (admin creates on behalf of user)
8. Sorting: Newest, Oldest, Priority, Last Reply
9. Pagination (30 per page)
10. Real-time updates (badge count updates)

File: apps/frontend_web/app/admin/support/tickets/page.tsx
```

---

### Task 2: Ticket Detail & Conversation ⏰ 6-7 hours

**File**: `apps/frontend_web/app/admin/support/tickets/[id]/page.tsx`

**AI Prompt**:

```
Create Ticket Detail page with conversation thread:
1. Fetch from /api/adminpanel/support/tickets/{id}
2. 2-column layout: Main (left 70%) + Sidebar (right 30%)

Main Section:
- Ticket header:
  * Subject (large, bold)
  * Status badge, Priority badge, Category badge
  * Created date
  * "Edit" button (inline edit subject)
- Conversation thread:
  * User messages (left-aligned, gray background)
  * Admin replies (right-aligned, blue background)
  * Each message: Avatar, Name, Timestamp, Message text
  * Attachments displayed as clickable links/thumbnails
  * Internal notes (yellow background, lock icon, "Internal Note" badge)
  * System messages (center, gray, italic): "Ticket assigned to John", "Priority changed to High"
- Reply box (bottom):
  * Rich text editor (basic formatting: bold, italic, lists, links)
  * Attach file button (max 5MB, images/PDFs)
  * "Internal Note" checkbox (only admins see)
  * Canned Responses dropdown (insert pre-written responses)
  * "Send Reply" button (primary blue)
  * "Close Ticket" button (secondary gray)

Sidebar:
- User Info Card:
  * Avatar, Name, Email
  * Profile type badge
  * "View Profile" link
  * User stats: Total tickets, Open tickets
- Ticket Details Card:
  * Status dropdown (change instantly)
  * Priority dropdown (change instantly)
  * Category (read-only or dropdown)
  * Assigned To dropdown (list of admins, "Unassigned" option)
- Timeline Card:
  * Action history: Created, Assigned, Replied, Status changed, Closed
  * Timestamps and admin names

3. API calls:
   - GET /tickets/{id} on load
   - POST /tickets/{id}/reply for messages
   - PUT /tickets/{id}/status for status change
   - PUT /tickets/{id}/priority for priority change
   - POST /tickets/{id}/assign for assignment
   - POST /tickets/{id}/close for closing
4. Real-time updates: New messages appear without refresh (polling every 10s or WebSocket)
5. Keyboard shortcuts: Cmd/Ctrl + Enter to send reply
6. Auto-save draft replies to localStorage
7. File upload progress indicator
8. Success/error toasts
9. "Back to Tickets" breadcrumb

File: apps/frontend_web/app/admin/support/tickets/[id]/page.tsx
```

---

### Task 3: Canned Responses Manager ⏰ 3-4 hours

**File**: `apps/frontend_web/app/admin/support/canned-responses/page.tsx`

**AI Prompt**:

```
Create Canned Responses management page:
1. Fetch from /api/adminpanel/support/canned-responses
2. Header with "Add New Response" button
3. Category filter tabs: All, Account, Payment, Technical, General
4. Responses list (cards, not table):
   - Title (bold)
   - Content preview (truncated to 2 lines)
   - Category badge
   - Usage count badge: "Used 45 times"
   - Shortcuts (if any): "/refund", "/reset-password"
   - Actions: Edit, Delete, Use (copy to clipboard)
5. Add/Edit Response modal:
   - Title input (required, max 100 chars): "Standard Refund Response"
   - Category dropdown
   - Content textarea (rich text editor with variables):
     * Variables: {{user_name}}, {{ticket_subject}}, {{current_date}}
     * Click variable to insert
   - Shortcuts input: Comma-separated shortcuts like "/refund, /ref"
   - Preview section (shows rendered content with sample data)
   - Save button
6. Delete confirmation modal
7. Search responses by title or content
8. Sort: Most Used, Newest, A-Z
9. Copy to clipboard animation (checkmark)
10. API calls: GET, POST, PUT /canned-responses/{id}, DELETE

File: apps/frontend_web/app/admin/support/canned-responses/page.tsx
```

---

### Task 4: FAQ Management ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/support/faqs/page.tsx`

**AI Prompt**:

```
Create FAQ Management page:
1. Fetch from /api/adminpanel/support/faqs
2. Header with "Add New FAQ" button
3. Category tabs: All, Account, Payments, Jobs, Workers, General
4. Published filter toggle: Show All / Published Only / Drafts Only
5. FAQ list (accordion or cards):
   - Question (bold, large)
   - Answer (truncated, expandable)
   - Category badge
   - Published status badge: Published (green) / Draft (yellow)
   - View count: "👁 245 views"
   - Order number (for sorting)
   - Actions: Edit, Delete, Duplicate, Preview
6. Drag-drop reordering (saves order to backend)
7. Add/Edit FAQ modal:
   - Question input (required, max 200 chars)
   - Answer rich text editor (full formatting: headings, bold, italic, lists, links, images)
   - Category dropdown
   - Is Published toggle (default: OFF)
   - Meta description (for SEO, optional, max 160 chars)
   - Related FAQs multi-select (link related questions)
   - Tags input (comma-separated for search)
   - Preview button (opens preview modal)
   - Save as Draft / Publish buttons
8. Delete confirmation (warn if FAQ has high views)
9. Duplicate creates copy with "(Copy)" suffix
10. Search FAQs by question/answer/tags
11. Bulk actions: Bulk publish, Bulk unpublish, Bulk delete
12. API calls: GET, POST, PUT /faqs/{id}, DELETE

File: apps/frontend_web/app/admin/support/faqs/page.tsx
```

---

### Task 5: User Reports Management ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/support/reports/page.tsx`

**AI Prompt**:

```
Create User Reports management page:
1. Fetch from /api/adminpanel/support/reports
2. Status filter tabs: All, Pending Review (red badge), Investigating, Resolved, Dismissed
3. Report type filter: All, User Report, Job Report, Review Report, Message Report
4. Reports table:
   - Columns: Report ID, Reporter, Reported User, Content Type, Reason, Description (truncated), Status, Date, Actions
   - Reporter: Name with profile link
   - Reported User: Name with profile link, highlight if multiple reports
   - Content Type badges: User, Job, Review, Message
   - Reason badges: Spam, Inappropriate, Scam, Harassment, Other
   - Description: Truncated to 50 chars, tooltip on hover
   - Actions: Review, Dismiss, View Details
5. Report detail modal:
   - Reporter info: Name, Email, Profile type, History (how many reports submitted)
   - Reported user info: Name, Email, Profile type, History (how many times reported)
   - Reported content:
     * Show actual content: Job description, Review text, Message, etc.
     * Screenshot/evidence if uploaded
   - Reason and full description
   - Report date
   - Admin notes textarea (internal only)
   - Action buttons:
     * Send Warning (opens confirmation)
     * Suspend User (opens modal: duration input, reason)
     * Ban User Permanently (confirmation with reason)
     * Dismiss Report (closes modal)
   - Previous actions taken on this user (if any)
6. Send Warning modal:
   - Warning message template (editable)
   - Send email checkbox
   - Confirm button
7. Suspend User modal:
   - Duration dropdown: 1 day, 3 days, 7 days, 30 days, Custom
   - Reason textarea (required)
   - Notify user checkbox
   - Suspend button (red)
8. Bulk actions: Bulk dismiss, Bulk assign to admin
9. Search by reporter or reported user
10. API calls: GET /reports, POST /reports/{id}/review

File: apps/frontend_web/app/admin/support/reports/page.tsx
```

---

### Task 6: Support Analytics Dashboard ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/support/analytics/page.tsx`

**AI Prompt**:

```
Create Support Analytics dashboard:
1. Fetch from /api/adminpanel/support/statistics
2. Date range selector: Today, Last 7 Days, Last 30 Days, Last 90 Days, Custom
3. Stats cards (6 cards):
   - Total Tickets (count with % change vs previous period)
   - Open Tickets (count, red if >50)
   - Resolved Tickets (count, green)
   - Avg Response Time (hours, target <4h, color code: green <4, yellow 4-8, red >8)
   - Avg Resolution Time (hours, target <24h)
   - Customer Satisfaction (%, based on feedback, if available)
4. Tickets by Category pie chart:
   - Account, Payment, Technical, Feature Request, Bug Report
   - Show count and percentage
5. Tickets by Priority bar chart:
   - Urgent, High, Medium, Low
   - Stacked by status: Open, In Progress, Resolved
6. Response Time Trend line chart:
   - X-axis: Date
   - Y-axis: Hours
   - Show target line at 4 hours
7. Top 5 tables:
   - Most Active Support Agents: Admin name, Tickets handled, Avg response time
   - Most Common Issues: Category, Count, % of total
   - Users with Most Tickets: User name, Ticket count, Open count
8. Ticket Status Flow diagram (Sankey or similar):
   - Show flow from Open → In Progress → Resolved
   - Show drop-offs (closed without resolution)
9. Export buttons: Export Report (PDF), Export Data (CSV)
10. Auto-refresh toggle (refresh every 60 seconds)

File: apps/frontend_web/app/admin/support/analytics/page.tsx
```

---

## Testing Checklist

### Tickets List

- [ ] Tickets load with pagination
- [ ] All filters work correctly
- [ ] Search finds tickets
- [ ] Stats cards accurate
- [ ] Bulk actions work
- [ ] Quick reply opens modal
- [ ] Assign ticket works
- [ ] Click row opens detail
- [ ] Sorting works
- [ ] Real-time updates work

### Ticket Detail

- [ ] Detail loads correctly
- [ ] Conversation thread displays
- [ ] User messages left, admin right
- [ ] Internal notes styled differently
- [ ] Reply box submits message
- [ ] File upload works
- [ ] Canned responses insert correctly
- [ ] Status change works
- [ ] Priority change works
- [ ] Assignment works
- [ ] Close ticket works
- [ ] Real-time updates appear
- [ ] Draft saves to localStorage
- [ ] Keyboard shortcuts work

### Canned Responses

- [ ] Responses load by category
- [ ] Add response saves
- [ ] Edit response updates
- [ ] Delete works with confirmation
- [ ] Variables insert correctly
- [ ] Preview renders variables
- [ ] Search works
- [ ] Copy to clipboard works
- [ ] Shortcuts save correctly
- [ ] Usage count accurate

### FAQ Management

- [ ] FAQs load by category
- [ ] Add FAQ saves
- [ ] Edit FAQ updates
- [ ] Delete with high views warns
- [ ] Duplicate creates copy
- [ ] Drag-drop reorder works
- [ ] Publish toggle works
- [ ] Preview modal displays correctly
- [ ] Search finds FAQs
- [ ] Bulk actions work
- [ ] Related FAQs link correctly

### User Reports

- [ ] Reports load with filters
- [ ] Detail modal shows all info
- [ ] Content displays correctly
- [ ] Send warning works
- [ ] Suspend user modal validates
- [ ] Ban user confirms
- [ ] Dismiss report works
- [ ] Admin notes save
- [ ] Bulk actions work
- [ ] Links to users work
- [ ] Multiple reports highlighted

### Analytics

- [ ] All stats cards display
- [ ] Date range changes data
- [ ] Pie chart accurate
- [ ] Bar chart displays correctly
- [ ] Line chart shows trend
- [ ] Target line displays
- [ ] Top 5 tables populated
- [ ] Export PDF works
- [ ] Export CSV works
- [ ] Auto-refresh works

---

## File Structure

```
apps/frontend_web/app/admin/support/
├── tickets/
│   ├── page.tsx                    ❌ CREATE (tickets list)
│   └── [id]/
│       └── page.tsx                ❌ CREATE (ticket detail)
├── canned-responses/
│   └── page.tsx                    ❌ CREATE (canned responses)
├── faqs/
│   └── page.tsx                    ❌ CREATE (FAQ management)
├── reports/
│   └── page.tsx                    ❌ CREATE (user reports)
└── analytics/
    └── page.tsx                    ❌ CREATE (support analytics)
```

---

## API Integration Summary

| Endpoint                                      | Method | Purpose         | Status   |
| --------------------------------------------- | ------ | --------------- | -------- |
| `/api/adminpanel/support/tickets`             | GET    | List tickets    | ✅ Ready |
| `/api/adminpanel/support/tickets/{id}`        | GET    | Ticket detail   | ✅ Ready |
| `/api/adminpanel/support/tickets`             | POST   | Create ticket   | ✅ Ready |
| `/api/adminpanel/support/tickets/{id}/reply`  | POST   | Reply to ticket | ✅ Ready |
| `/api/adminpanel/support/tickets/{id}/assign` | POST   | Assign ticket   | ✅ Ready |
| `/api/adminpanel/support/tickets/{id}/status` | PUT    | Update status   | ✅ Ready |
| `/api/adminpanel/support/tickets/{id}/close`  | POST   | Close ticket    | ✅ Ready |
| `/api/adminpanel/support/canned-responses`    | GET    | List responses  | ✅ Ready |
| `/api/adminpanel/support/canned-responses`    | POST   | Create response | ✅ Ready |
| `/api/adminpanel/support/faqs`                | GET    | List FAQs       | ✅ Ready |
| `/api/adminpanel/support/faqs`                | POST   | Create FAQ      | ✅ Ready |
| `/api/adminpanel/support/faqs/{id}`           | PUT    | Update FAQ      | ✅ Ready |
| `/api/adminpanel/support/faqs/{id}`           | DELETE | Delete FAQ      | ✅ Ready |
| `/api/adminpanel/support/reports`             | GET    | List reports    | ✅ Ready |
| `/api/adminpanel/support/reports/{id}/review` | POST   | Review report   | ✅ Ready |
| `/api/adminpanel/support/statistics`          | GET    | Support stats   | ✅ Ready |

---

## Dependencies

- **Module 2**: User Management (for profile links)
- **Rich Text Editor**: React-Quill or TinyMCE for FAQ editor
- **Chart Library**: Chart.js or Recharts for analytics

---

## Completion Criteria

✅ Module complete when:

1. Ticket list and detail pages functional
2. Conversation thread with replies working
3. Canned responses manager operational
4. FAQ management with rich editor
5. User reports review workflow
6. Support analytics dashboard
7. Real-time updates working
8. All tests passing
9. Documentation updated

---

**Ready for Implementation**: ✅ All backend APIs operational, support workflows designed
