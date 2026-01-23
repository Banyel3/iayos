# Admin Panel - Module 6: Settings & Configuration

**Status**: 📋 PLANNED  
**Priority**: MEDIUM  
**Estimated Time**: 15-18 hours  
**Dependencies**: None (standalone module)

---

## Module Overview

Platform settings and configuration management including system preferences, notification templates, platform fees, category management, payment gateway settings, and admin user management.

### Scope

- Platform settings (fees, limits, policies)
- Category and service management
- Email/SMS notification templates
- Payment gateway configuration
- Admin user roles and permissions
- System maintenance settings
- Audit logs viewer

---

## Backend APIs Available

### Settings Endpoints

```python
# Get all platform settings
GET /api/adminpanel/settings/platform
Response: {
  platform_fee_percentage: number,
  escrow_holding_days: number,
  max_job_budget: number,
  min_job_budget: number,
  worker_verification_required: boolean,
  auto_approve_kyc: boolean,
  maintenance_mode: boolean
}

# Update platform settings
PUT /api/adminpanel/settings/platform
Body: { key: value pairs }

# Get categories
GET /api/adminpanel/settings/categories
Response: { categories: [{ id, name, icon, is_active, job_count }] }

# Create category
POST /api/adminpanel/settings/categories
Body: { name: string, icon: string, description: string }

# Update category
PUT /api/adminpanel/settings/categories/{id}
Body: { name?, icon?, description?, is_active? }

# Delete category
DELETE /api/adminpanel/settings/categories/{id}

# Get notification templates
GET /api/adminpanel/settings/notifications
Response: {
  templates: [{
    id, type, subject, body_html, body_text, is_active
  }]
}

# Update notification template
PUT /api/adminpanel/settings/notifications/{id}
Body: { subject?, body_html?, body_text?, is_active? }

# Get payment gateway settings
GET /api/adminpanel/settings/payment-gateways
Response: {
  xendit: { enabled, api_key_configured, webhook_url },
  gcash: { enabled, merchant_id },
  bank_transfer: { enabled, accounts: [...] }
}

# Update payment gateway
PUT /api/adminpanel/settings/payment-gateways/{gateway}
Body: { enabled: boolean, config: object }

# Get admin users
GET /api/adminpanel/settings/admins
Response: {
  admins: [{ id, email, role, permissions, created_at, last_login }]
}

# Create admin user
POST /api/adminpanel/settings/admins
Body: { email, password, role, permissions: [] }

# Update admin permissions
PUT /api/adminpanel/settings/admins/{id}/permissions
Body: { permissions: [] }

# Delete admin user
DELETE /api/adminpanel/settings/admins/{id}

# Get audit logs
GET /api/adminpanel/settings/audit-logs
Query: page, limit, admin_id, action_type, date_from, date_to
Response: {
  logs: [{ id, admin_id, admin_email, action, details, ip_address, timestamp }]
}
```

---

## Implementation Tasks

### Task 1: Platform Settings Page ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/settings/platform/page.tsx`

**AI Prompt**:

```
Create Platform Settings page:
1. Fetch from /api/adminpanel/settings/platform
2. Settings form with sections:

   Financial Settings:
   - Platform Fee Percentage: Number input (0-100%) with % suffix
   - Escrow Holding Days: Number input (0-365 days)
   - Minimum Job Budget: Currency input (₱)
   - Maximum Job Budget: Currency input (₱)

   Verification Settings:
   - Worker Verification Required: Toggle switch (On/Off)
   - Auto-Approve KYC: Toggle switch (On/Off)
   - KYC Document Expiry Days: Number input

   System Settings:
   - Maintenance Mode: Toggle with warning ("Platform will be inaccessible to users")
   - Session Timeout: Number input (minutes)
   - Max Upload Size: Number input (MB)

3. Each section in white card with dividers
4. Real-time validation:
   - Min budget < Max budget
   - Fee percentage 0-100
   - Positive numbers only
5. "Save Changes" button (primary blue)
6. "Reset to Defaults" button (secondary gray) with confirmation
7. API call: PUT /settings/platform
8. Success toast: "Settings updated successfully"
9. Show last updated timestamp
10. Unsaved changes warning before navigation

File: apps/frontend_web/app/admin/settings/platform/page.tsx
```

---

### Task 2: Category Management ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/settings/categories/page.tsx`

**AI Prompt**:

```
Create Category Management page:
1. Fetch from /api/adminpanel/settings/categories
2. Header with "Add New Category" button (opens modal)
3. Categories table:
   - Columns: Icon, Category Name, Description, Jobs Count, Status toggle, Actions
   - Icon column: Display icon emoji/image
   - Status: Active (green toggle) / Inactive (gray toggle)
   - Actions: Edit (pencil), Delete (trash)
4. Drag-drop reordering (save order to backend)
5. Add/Edit Category modal:
   - Name input (required, max 50 chars)
   - Icon picker (emoji selector or upload image)
   - Description textarea (optional, max 200 chars)
   - Is Active toggle (default: ON)
   - Save button
6. Delete confirmation modal:
   - Warning if category has active jobs
   - Checkbox: "Reassign existing jobs to:" with category dropdown
   - Delete button (red)
7. Search/filter: Active, Inactive, All
8. Stats: Total categories, Active count, Inactive count
9. API calls: GET /categories, POST /categories, PUT /categories/{id}, DELETE /categories/{id}
10. Success notifications for all actions

File: apps/frontend_web/app/admin/settings/categories/page.tsx
```

---

### Task 3: Notification Templates ⏰ 3-4 hours

**File**: `apps/frontend_web/app/admin/settings/notifications/page.tsx`

**AI Prompt**:

```
Create Notification Templates page:
1. Fetch from /api/adminpanel/settings/notifications
2. Template list (grouped by type):
   - Email Templates
   - SMS Templates
   - Push Notification Templates
3. Each template card shows:
   - Template name (e.g., "KYC Approved Email")
   - Subject line
   - Preview of body (truncated)
   - Is Active toggle
   - Last modified date
   - Edit button
4. Edit template modal/page:
   - Template type (read-only, display only)
   - Subject input (for emails)
   - Body editor:
     * Rich text editor for HTML emails (use TinyMCE or similar)
     * Plain text editor for SMS
   - Variables helper panel:
     * Show available variables: {{user_name}}, {{job_title}}, etc.
     * Click to insert into editor
   - Preview panel (live preview with sample data)
   - Is Active toggle
   - Save button
5. Template variables documentation section
6. API call: PUT /notifications/{id}
7. Validation: Subject required for emails
8. Success toast after save
9. Unsaved changes warning
10. Reset to default template button

File: apps/frontend_web/app/admin/settings/notifications/page.tsx
```

---

### Task 4: Payment Gateway Configuration ⏰ 3-4 hours

**File**: `apps/frontend_web/app/admin/settings/payment-gateways/page.tsx`

**AI Prompt**:

```
Create Payment Gateway Settings page:
1. Fetch from /api/adminpanel/settings/payment-gateways
2. Gateway cards (3 cards):

   Xendit Card:
   - Xendit logo/icon
   - Status badge: Enabled (green) / Disabled (gray)
   - Enable toggle switch
   - API Key configured: ✓ Yes / ✗ No
   - Webhook URL (read-only, copy button)
   - "Configure" button

   GCash Card:
   - GCash logo
   - Status badge
   - Enable toggle
   - Merchant ID (if configured)
   - "Configure" button

   Bank Transfer Card:
   - Bank icon
   - Status badge
   - Enable toggle
   - Supported banks list
   - "Manage Accounts" button

3. Configure modal (per gateway):
   - Gateway name (header)
   - Enable/disable toggle
   - Gateway-specific fields:
     * Xendit: API Key (password input), Secret Key, Webhook URL
     * GCash: Merchant ID, API Key
     * Bank: Add/remove bank accounts (name, account number, branch)
   - Test Connection button (validates API keys)
   - Save button
4. Security: Mask API keys (show "••••••••key123")
5. API call: PUT /payment-gateways/{gateway}
6. Success/error notifications
7. Warning before disabling active gateway
8. Last updated timestamp per gateway
9. Documentation links for each gateway
10. Transaction count per gateway (stats)

File: apps/frontend_web/app/admin/settings/payment-gateways/page.tsx
```

---

### Task 5: Admin User Management ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/settings/admins/page.tsx`

**AI Prompt**:

```
Create Admin User Management page:
1. Fetch from /api/adminpanel/settings/admins
2. Header with "Add New Admin" button
3. Admin users table:
   - Columns: Email, Role badge, Permissions count, Last Login, Status, Actions
   - Role badges: Super Admin (red), Admin (blue), Moderator (green)
   - Status: Active toggle
   - Actions: Edit (pencil), Delete (trash)
4. Add Admin modal:
   - Email input (required, validation)
   - Password input (required, min 8 chars, show strength meter)
   - Confirm Password input
   - Role dropdown: Super Admin, Admin, Moderator
   - Permissions checklist (based on role):
     * Manage Users
     * Approve KYC
     * Manage Jobs
     * Handle Payments
     * View Reports
     * Manage Settings
     * Manage Admins (Super Admin only)
   - Send Welcome Email checkbox
   - Create button
5. Edit Admin modal:
   - Similar to Add but without password (separate "Reset Password" button)
   - Cannot edit own role/permissions (security)
   - Cannot delete own account
6. Delete confirmation:
   - Warning: "Admin will lose access immediately"
   - Reassign pending tasks to: dropdown (other admins)
   - Confirm Delete button
7. Permissions matrix view (table showing roles vs permissions)
8. API calls: GET /admins, POST /admins, PUT /admins/{id}/permissions, DELETE /admins/{id}
9. Success/error notifications
10. Current logged-in admin highlighted

File: apps/frontend_web/app/admin/settings/admins/page.tsx
```

---

### Task 6: Audit Logs Viewer ⏰ 3-4 hours

**File**: `apps/frontend_web/app/admin/settings/audit-logs/page.tsx`

**AI Prompt**:

```
Create Audit Logs viewer page:
1. Fetch from /api/adminpanel/settings/audit-logs
2. Filters:
   - Admin dropdown (All Admins / specific admin)
   - Action Type dropdown (All / Login / KYC Approval / Payment Release / User Ban / Settings Change)
   - Date range picker (From/To)
   - Search by details (text input)
3. Logs table:
   - Columns: Timestamp, Admin Email, Action Type badge, Details, IP Address, View button
   - Action badges: color-coded by type (Login: blue, Approval: green, Ban: red, etc.)
   - Timestamp: "2 hours ago" with full date on hover
4. Log detail modal:
   - Full timestamp
   - Admin info (email, role)
   - Action type
   - Full details (formatted JSON or structured display)
   - IP address and location (if available)
   - Before/After values (for edits)
   - User Agent (browser info)
5. Export logs as CSV (filtered results)
6. Auto-refresh toggle (refresh every 30 seconds)
7. Pagination (100 logs per page)
8. Loading skeleton
9. Empty state: "No logs found for selected filters"
10. Real-time log streaming (optional: WebSocket for new logs)

File: apps/frontend_web/app/admin/settings/audit-logs/page.tsx
```

---

## Testing Checklist

### Platform Settings

- [ ] Settings form loads current values
- [ ] All input validations work
- [ ] Min < Max budget validation
- [ ] Fee percentage 0-100% validation
- [ ] Toggle switches work
- [ ] Save changes API call succeeds
- [ ] Success toast appears
- [ ] Unsaved changes warning works
- [ ] Reset to defaults works
- [ ] Last updated timestamp accurate

### Category Management

- [ ] Categories load correctly
- [ ] Add category modal validates inputs
- [ ] Icon picker works
- [ ] Save new category works
- [ ] Edit category works
- [ ] Status toggle works
- [ ] Delete with job reassignment works
- [ ] Drag-drop reorder works
- [ ] Search filter works
- [ ] Stats cards accurate

### Notification Templates

- [ ] Templates grouped by type
- [ ] Edit template loads data
- [ ] Rich text editor works
- [ ] Variable insertion works
- [ ] Preview updates in real-time
- [ ] Save template works
- [ ] Active toggle works
- [ ] Reset to default works
- [ ] Unsaved changes warning
- [ ] Success notifications

### Payment Gateways

- [ ] Gateway cards display correctly
- [ ] Enable/disable toggles work
- [ ] Configure modal opens
- [ ] API key masking works
- [ ] Test connection validates keys
- [ ] Save gateway config works
- [ ] Warning before disabling
- [ ] Stats display transaction counts
- [ ] Copy webhook URL works
- [ ] Documentation links work

### Admin Users

- [ ] Admin users table loads
- [ ] Add admin validates email
- [ ] Password strength meter works
- [ ] Permissions checklist by role
- [ ] Cannot edit own role
- [ ] Cannot delete own account
- [ ] Edit admin saves changes
- [ ] Delete with reassignment works
- [ ] Permissions matrix accurate
- [ ] Welcome email sends

### Audit Logs

- [ ] Logs load with pagination
- [ ] All filters work correctly
- [ ] Action badges display
- [ ] Date range filter works
- [ ] Search by details works
- [ ] Detail modal shows full info
- [ ] Export CSV works
- [ ] Auto-refresh toggle works
- [ ] Real-time updates work
- [ ] Empty state displays

---

## File Structure

```
apps/frontend_web/app/admin/settings/
├── platform/
│   └── page.tsx                    ❌ CREATE (platform settings)
├── categories/
│   └── page.tsx                    ❌ CREATE (category management)
├── notifications/
│   └── page.tsx                    ❌ CREATE (notification templates)
├── payment-gateways/
│   └── page.tsx                    ❌ CREATE (payment gateways)
├── admins/
│   └── page.tsx                    ❌ CREATE (admin users)
└── audit-logs/
    └── page.tsx                    ❌ CREATE (audit logs)
```

---

## API Integration Summary

| Endpoint                                              | Method | Purpose               | Status   |
| ----------------------------------------------------- | ------ | --------------------- | -------- |
| `/api/adminpanel/settings/platform`                   | GET    | Get platform settings | ✅ Ready |
| `/api/adminpanel/settings/platform`                   | PUT    | Update settings       | ✅ Ready |
| `/api/adminpanel/settings/categories`                 | GET    | List categories       | ✅ Ready |
| `/api/adminpanel/settings/categories`                 | POST   | Create category       | ✅ Ready |
| `/api/adminpanel/settings/categories/{id}`            | PUT    | Update category       | ✅ Ready |
| `/api/adminpanel/settings/categories/{id}`            | DELETE | Delete category       | ✅ Ready |
| `/api/adminpanel/settings/notifications`              | GET    | Get templates         | ✅ Ready |
| `/api/adminpanel/settings/notifications/{id}`         | PUT    | Update template       | ✅ Ready |
| `/api/adminpanel/settings/payment-gateways`           | GET    | Get gateway config    | ✅ Ready |
| `/api/adminpanel/settings/payment-gateways/{gateway}` | PUT    | Update gateway        | ✅ Ready |
| `/api/adminpanel/settings/admins`                     | GET    | List admins           | ✅ Ready |
| `/api/adminpanel/settings/admins`                     | POST   | Create admin          | ✅ Ready |
| `/api/adminpanel/settings/admins/{id}/permissions`    | PUT    | Update permissions    | ✅ Ready |
| `/api/adminpanel/settings/admins/{id}`                | DELETE | Delete admin          | ✅ Ready |
| `/api/adminpanel/settings/audit-logs`                 | GET    | Get audit logs        | ✅ Ready |

---

## Dependencies

- **Rich Text Editor**: TinyMCE or React-Quill for email templates
- **Icon Picker**: emoji-picker-react or custom icon library
- **None** for backend APIs (all ready)

---

## Completion Criteria

✅ Module complete when:

1. Platform settings form functional
2. Category management with CRUD operations
3. Notification templates editor working
4. Payment gateway configuration
5. Admin user management complete
6. Audit logs viewer operational
7. All validations working
8. All tests passing
9. Documentation updated

---

**Ready for Implementation**: ✅ All backend APIs operational, settings workflows designed
