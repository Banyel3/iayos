# Admin Panel - Module 2: User Management & Detail Pages

**Status**: 📋 PLANNED  
**Priority**: HIGH  
**Estimated Time**: 25-30 hours  
**Dependencies**: None (backend APIs ready)

---

## Module Overview

Complete user management system with detail pages for clients, workers, and agencies. Provides comprehensive user information, activity tracking, account actions, and profile management.

### Scope

- Client user management with detail pages
- Worker user management with detail pages
- Agency user management with detail pages
- User search and filtering
- Account actions (suspend, ban, delete)
- Activity logs and statistics
- Profile editing capabilities

---

## Backend APIs Available

### User Listing Endpoints

```python
# Client Users
GET /api/adminpanel/users/clients
Query: page, limit, search, status
Response: { users: [], pagination: { ... } }

# Worker Users
GET /api/adminpanel/users/workers
Query: page, limit, search, status, verification_status
Response: { users: [], pagination: { ... } }

# Agency Users
GET /api/adminpanel/users/agencies
Query: page, limit, search, status
Response: { users: [], pagination: { ... } }
```

### User Detail Endpoints

```python
# Get detailed user info
GET /api/adminpanel/users/{id}/detail
Response: {
  user: {
    id, email, first_name, last_name, phone, created_at,
    is_active, is_verified, last_login, profile_type
  },
  profile: {
    bio, avatar, location, rating, total_jobs, total_spent/earned
  },
  stats: {
    jobs_completed, jobs_posted, total_reviews, average_rating
  },
  recent_activity: [...],
  kyc_status: { ... }
}
```

### User Action Endpoints

```python
# Suspend user
POST /api/adminpanel/users/{id}/suspend
Body: { reason: string, duration_days?: number }

# Ban user permanently
POST /api/adminpanel/users/{id}/ban
Body: { reason: string }

# Reactivate user
POST /api/adminpanel/users/{id}/activate

# Delete user account
DELETE /api/adminpanel/users/{id}
Body: { reason: string }

# Update user profile
PUT /api/adminpanel/users/{id}/profile
Body: { first_name?, last_name?, phone?, bio? }

# Reset password
POST /api/adminpanel/users/{id}/reset-password

# Get user activity logs
GET /api/adminpanel/users/{id}/activity
Query: page, limit, type
```

---

## Implementation Tasks

### Task 1: Client Users List Enhancement ⏰ 4-5 hours

**Current State**: Basic list exists at `/admin/users/clients/page.tsx`  
**Goal**: Complete implementation with real API integration

#### Steps:

1. **Remove Mock Data** (30 mins)
   - Replace any hardcoded client arrays
   - Integrate `/api/adminpanel/users/clients` endpoint

2. **Add Search & Filters** (2 hours)

   ```typescript
   // apps/frontend_web/app/admin/users/clients/page.tsx

   'use client';

   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';

   interface ClientFilters {
     search: string;
     status: 'all' | 'active' | 'suspended' | 'banned';
     sort: 'newest' | 'oldest' | 'most_jobs' | 'highest_spending';
   }

   export default function ClientsPage() {
     const router = useRouter();
     const [clients, setClients] = useState([]);
     const [loading, setLoading] = useState(true);
     const [filters, setFilters] = useState<ClientFilters>({
       search: '',
       status: 'all',
       sort: 'newest'
     });
     const [pagination, setPagination] = useState({
       page: 1,
       limit: 20,
       total: 0,
       pages: 0
     });

     const fetchClients = async () => {
       setLoading(true);
       try {
         const params = new URLSearchParams({
           page: pagination.page.toString(),
           limit: pagination.limit.toString(),
           ...(filters.search && { search: filters.search }),
           ...(filters.status !== 'all' && { status: filters.status }),
           sort: filters.sort
         });

         const response = await fetch(`/api/adminpanel/users/clients?${params}`, {
           credentials: 'include'
         });

         if (!response.ok) throw new Error('Failed to fetch clients');

         const data = await response.json();
         setClients(data.users);
         setPagination(prev => ({
           ...prev,
           total: data.pagination.total,
           pages: data.pagination.pages
         }));
       } catch (error) {
         console.error('Error fetching clients:', error);
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       const debounce = setTimeout(() => {
         fetchClients();
       }, 300);

       return () => clearTimeout(debounce);
     }, [filters, pagination.page]);

     return (
       <div className="p-6">
         <div className="mb-6">
           <h1 className="text-2xl font-bold">Client Users</h1>
           <p className="text-gray-600">Manage client accounts and activities</p>
         </div>

         {/* Filters */}
         <div className="bg-white rounded-lg shadow p-4 mb-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {/* Search */}
             <input
               type="text"
               placeholder="Search by name or email..."
               value={filters.search}
               onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
               className="border rounded-lg px-4 py-2"
             />

             {/* Status Filter */}
             <select
               value={filters.status}
               onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
               className="border rounded-lg px-4 py-2"
             >
               <option value="all">All Status</option>
               <option value="active">Active</option>
               <option value="suspended">Suspended</option>
               <option value="banned">Banned</option>
             </select>

             {/* Sort */}
             <select
               value={filters.sort}
               onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
               className="border rounded-lg px-4 py-2"
             >
               <option value="newest">Newest First</option>
               <option value="oldest">Oldest First</option>
               <option value="most_jobs">Most Jobs</option>
               <option value="highest_spending">Highest Spending</option>
             </select>
           </div>
         </div>

         {/* Client Table */}
         <div className="bg-white rounded-lg shadow overflow-hidden">
           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jobs Posted</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {loading ? (
                 <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
               ) : clients.length === 0 ? (
                 <tr><td colSpan={6} className="px-6 py-4 text-center">No clients found</td></tr>
               ) : (
                 clients.map((client: any) => (
                   <tr key={client.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4">
                       <div className="flex items-center">
                         <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                           {client.avatar ? (
                             <img src={client.avatar} alt="" className="h-10 w-10 rounded-full" />
                           ) : (
                             <span className="text-blue-600 font-medium">
                               {client.first_name?.[0]}{client.last_name?.[0]}
                             </span>
                           )}
                         </div>
                         <div className="ml-4">
                           <div className="text-sm font-medium text-gray-900">
                             {client.first_name} {client.last_name}
                           </div>
                           <div className="text-sm text-gray-500">{client.email}</div>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <span className={`px-2 py-1 text-xs rounded-full ${
                         client.is_active
                           ? 'bg-green-100 text-green-800'
                           : 'bg-red-100 text-red-800'
                       }`}>
                         {client.is_active ? 'Active' : 'Suspended'}
                       </span>
                     </td>
                     <td className="px-6 py-4 text-sm text-gray-900">{client.jobs_posted || 0}</td>
                     <td className="px-6 py-4 text-sm text-gray-900">₱{client.total_spent?.toLocaleString() || 0}</td>
                     <td className="px-6 py-4 text-sm text-gray-500">
                       {new Date(client.created_at).toLocaleDateString()}
                     </td>
                     <td className="px-6 py-4 text-sm">
                       <button
                         onClick={() => router.push(`/admin/users/clients/${client.id}`)}
                         className="text-blue-600 hover:text-blue-900"
                       >
                         View Details
                       </button>
                     </td>
                   </tr>
                 ))
               )}
             </tbody>
           </table>
         </div>

         {/* Pagination */}
         {pagination.pages > 1 && (
           <div className="mt-6 flex justify-center gap-2">
             <button
               onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
               disabled={pagination.page === 1}
               className="px-4 py-2 border rounded-lg disabled:opacity-50"
             >
               Previous
             </button>
             <span className="px-4 py-2">
               Page {pagination.page} of {pagination.pages}
             </span>
             <button
               onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
               disabled={pagination.page === pagination.pages}
               className="px-4 py-2 border rounded-lg disabled:opacity-50"
             >
               Next
             </button>
           </div>
         )}
       </div>
     );
   }
   ```

3. **Add Export Functionality** (1 hour)
   - CSV export button
   - Client data formatting
   - Download trigger

4. **Add Bulk Actions** (1.5 hours)
   - Checkbox selection
   - Bulk suspend/activate
   - Confirmation dialogs

**AI Prompt for Task 1**:

```
Implement the Client Users list page with the following requirements:
1. Replace any mock data with real API calls to /api/adminpanel/users/clients
2. Add search input with 300ms debounce that filters by name/email
3. Add status filter dropdown (All, Active, Suspended, Banned)
4. Add sort dropdown (Newest, Oldest, Most Jobs, Highest Spending)
5. Display client table with columns: Client Info (avatar + name + email), Status badge, Jobs Posted count, Total Spent (₱ formatted), Joined date, Actions button
6. Add pagination with Previous/Next buttons (20 per page)
7. Make each row clickable to navigate to /admin/users/clients/{id}
8. Add loading state and empty state
9. Style with Tailwind CSS matching existing admin panel design
10. Use TypeScript with proper interfaces

File: apps/frontend_web/app/admin/users/clients/page.tsx
```

---

### Task 2: Client Detail Page ⏰ 5-6 hours

**File**: Create `apps/frontend_web/app/admin/users/clients/[id]/page.tsx`

#### Steps:

1. **Basic Detail Layout** (2 hours)

   ```typescript
   'use client';

   import { useState, useEffect } from 'react';
   import { useParams, useRouter } from 'next/navigation';

   interface ClientDetail {
     user: {
       id: number;
       email: string;
       first_name: string;
       last_name: string;
       phone: string;
       created_at: string;
       is_active: boolean;
       is_verified: boolean;
       last_login: string;
     };
     profile: {
       bio: string;
       avatar: string;
       location: string;
       rating: number;
       total_jobs: number;
       total_spent: number;
     };
     stats: {
       jobs_posted: number;
       jobs_completed: number;
       total_reviews: number;
       average_rating: number;
     };
     recent_activity: Array<{
       id: number;
       type: string;
       description: string;
       created_at: string;
     }>;
     kyc_status: {
       is_verified: boolean;
       verified_at?: string;
       status: string;
     };
   }

   export default function ClientDetailPage() {
     const params = useParams();
     const router = useRouter();
     const clientId = params.id as string;

     const [client, setClient] = useState<ClientDetail | null>(null);
     const [loading, setLoading] = useState(true);
     const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'activity' | 'kyc'>('overview');

     const fetchClientDetail = async () => {
       try {
         const response = await fetch(`/api/adminpanel/users/${clientId}/detail`, {
           credentials: 'include'
         });

         if (!response.ok) throw new Error('Failed to fetch client');

         const data = await response.json();
         setClient(data);
       } catch (error) {
         console.error('Error:', error);
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       fetchClientDetail();
     }, [clientId]);

     if (loading) return <div className="p-6">Loading...</div>;
     if (!client) return <div className="p-6">Client not found</div>;

     return (
       <div className="p-6">
         {/* Header */}
         <div className="mb-6">
           <button
             onClick={() => router.back()}
             className="text-blue-600 hover:text-blue-800 mb-4"
           >
             ← Back to Clients
           </button>
           <h1 className="text-2xl font-bold">Client Details</h1>
         </div>

         {/* Profile Card */}
         <div className="bg-white rounded-lg shadow p-6 mb-6">
           <div className="flex items-start justify-between">
             <div className="flex items-center">
               <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                 {client.profile.avatar ? (
                   <img src={client.profile.avatar} alt="" className="h-20 w-20 rounded-full" />
                 ) : (
                   <span className="text-2xl text-blue-600 font-medium">
                     {client.user.first_name?.[0]}{client.user.last_name?.[0]}
                   </span>
                 )}
               </div>
               <div className="ml-6">
                 <h2 className="text-xl font-bold">
                   {client.user.first_name} {client.user.last_name}
                 </h2>
                 <p className="text-gray-600">{client.user.email}</p>
                 <p className="text-gray-600">{client.user.phone}</p>
                 <div className="flex gap-2 mt-2">
                   <span className={`px-2 py-1 text-xs rounded-full ${
                     client.user.is_active
                       ? 'bg-green-100 text-green-800'
                       : 'bg-red-100 text-red-800'
                   }`}>
                     {client.user.is_active ? 'Active' : 'Suspended'}
                   </span>
                   {client.user.is_verified && (
                     <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                       Verified
                     </span>
                   )}
                 </div>
               </div>
             </div>

             {/* Action Buttons */}
             <div className="flex gap-2">
               <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                 Edit Profile
               </button>
               <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                 Reset Password
               </button>
               {client.user.is_active ? (
                 <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                   Suspend Account
                 </button>
               ) : (
                 <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                   Activate Account
                 </button>
               )}
             </div>
           </div>
         </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
           <div className="bg-white rounded-lg shadow p-6">
             <p className="text-sm text-gray-600">Jobs Posted</p>
             <p className="text-2xl font-bold">{client.stats.jobs_posted}</p>
           </div>
           <div className="bg-white rounded-lg shadow p-6">
             <p className="text-sm text-gray-600">Jobs Completed</p>
             <p className="text-2xl font-bold">{client.stats.jobs_completed}</p>
           </div>
           <div className="bg-white rounded-lg shadow p-6">
             <p className="text-sm text-gray-600">Total Spent</p>
             <p className="text-2xl font-bold">₱{client.profile.total_spent.toLocaleString()}</p>
           </div>
           <div className="bg-white rounded-lg shadow p-6">
             <p className="text-sm text-gray-600">Average Rating</p>
             <p className="text-2xl font-bold">⭐ {client.stats.average_rating.toFixed(1)}</p>
           </div>
         </div>

         {/* Tabs */}
         <div className="bg-white rounded-lg shadow">
           <div className="border-b">
             <nav className="flex gap-4 px-6">
               {['overview', 'jobs', 'activity', 'kyc'].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab as any)}
                   className={`py-4 px-2 border-b-2 font-medium ${
                     activeTab === tab
                       ? 'border-blue-600 text-blue-600'
                       : 'border-transparent text-gray-600 hover:text-gray-900'
                   }`}
                 >
                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
                 </button>
               ))}
             </nav>
           </div>

           <div className="p-6">
             {activeTab === 'overview' && (
               <div>
                 <h3 className="text-lg font-semibold mb-4">Account Information</h3>
                 <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <dt className="text-sm text-gray-600">Account Created</dt>
                     <dd className="text-sm font-medium">
                       {new Date(client.user.created_at).toLocaleString()}
                     </dd>
                   </div>
                   <div>
                     <dt className="text-sm text-gray-600">Last Login</dt>
                     <dd className="text-sm font-medium">
                       {new Date(client.user.last_login).toLocaleString()}
                     </dd>
                   </div>
                   <div>
                     <dt className="text-sm text-gray-600">Location</dt>
                     <dd className="text-sm font-medium">{client.profile.location || 'N/A'}</dd>
                   </div>
                   <div>
                     <dt className="text-sm text-gray-600">Bio</dt>
                     <dd className="text-sm font-medium">{client.profile.bio || 'N/A'}</dd>
                   </div>
                 </dl>
               </div>
             )}

             {activeTab === 'jobs' && (
               <div>
                 <h3 className="text-lg font-semibold mb-4">Job History</h3>
                 <p className="text-gray-600">Job history component here</p>
               </div>
             )}

             {activeTab === 'activity' && (
               <div>
                 <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                 <div className="space-y-4">
                   {client.recent_activity.map((activity) => (
                     <div key={activity.id} className="border-l-2 border-gray-300 pl-4">
                       <p className="text-sm font-medium">{activity.description}</p>
                       <p className="text-xs text-gray-500">
                         {new Date(activity.created_at).toLocaleString()}
                       </p>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {activeTab === 'kyc' && (
               <div>
                 <h3 className="text-lg font-semibold mb-4">KYC Verification</h3>
                 <div className="flex items-center gap-2">
                   <span className={`px-3 py-1 text-sm rounded-full ${
                     client.kyc_status.is_verified
                       ? 'bg-green-100 text-green-800'
                       : 'bg-yellow-100 text-yellow-800'
                   }`}>
                     {client.kyc_status.status}
                   </span>
                   {client.kyc_status.verified_at && (
                     <span className="text-sm text-gray-600">
                       Verified on {new Date(client.kyc_status.verified_at).toLocaleDateString()}
                     </span>
                   )}
                 </div>
               </div>
             )}
           </div>
         </div>
       </div>
     );
   }
   ```

2. **Add Account Actions** (2 hours)
   - Suspend account modal
   - Ban account modal
   - Activate account
   - Delete account confirmation

3. **Add Edit Profile Modal** (1 hour)
   - Edit form with validation
   - Update API call
   - Success notification

4. **Add Activity Timeline** (1 hour)
   - Fetch activity logs
   - Display timeline
   - Load more pagination

**AI Prompt for Task 2**:

```
Create a Client Detail page with:
1. Fetch client details from /api/adminpanel/users/{id}/detail
2. Display profile card with avatar, name, email, phone, status badges
3. Show 4 stat cards: Jobs Posted, Jobs Completed, Total Spent, Average Rating
4. Create 4 tabs: Overview, Jobs, Activity, KYC
5. Overview tab: Account created, last login, location, bio
6. Activity tab: Timeline of recent actions with timestamps
7. Add action buttons: Edit Profile, Reset Password, Suspend/Activate Account
8. Create modals for suspend (with reason input) and ban (with confirmation)
9. Implement API calls for account actions (/api/adminpanel/users/{id}/suspend, /ban, /activate)
10. Add back button to return to clients list
11. Style with Tailwind CSS

File: apps/frontend_web/app/admin/users/clients/[id]/page.tsx
```

---

### Task 3: Worker Users Implementation ⏰ 6-7 hours

**Files**:

- `apps/frontend_web/app/admin/users/workers/page.tsx`
- `apps/frontend_web/app/admin/users/workers/[id]/page.tsx`

#### Implementation (similar to clients but with worker-specific fields):

1. **Worker List Page** (3 hours)
   - Search and filters (add verification_status filter)
   - Worker table with: Worker info, Verification status, Skills, Jobs completed, Total earned, Rating
   - Sort options: Newest, Top rated, Most jobs, Highest earnings

2. **Worker Detail Page** (3-4 hours)
   - Profile section with skills, hourly rate, availability
   - Stats: Jobs completed, Total earned, Rating, Response time
   - Tabs: Overview, Jobs History, Reviews, Certifications, Portfolio
   - Actions: Verify worker, Suspend, Ban, Delete
   - Display certifications with verification status
   - Portfolio gallery

**AI Prompt for Task 3**:

```
Implement Worker Users management similar to Client Users with these differences:
1. Worker list page at /admin/users/workers/page.tsx
2. Add verification_status filter (All, Verified, Pending, Unverified)
3. Table columns: Worker Info, Verification badge, Skills (comma-separated), Jobs Completed, Total Earned, Rating, Actions
4. Worker detail page at /admin/users/workers/[id]/page.tsx
5. Show worker-specific fields: hourly_rate, skills array, availability, certifications
6. Add Certifications tab displaying uploaded certificates with expiry dates
7. Add Portfolio tab with image gallery (3-column grid)
8. Stats cards: Jobs Completed, Total Earned, Rating, Response Time
9. Actions: Verify Worker button (only for unverified), Suspend, Ban, Delete
10. Use APIs: /api/adminpanel/users/workers (list), /api/adminpanel/users/{id}/detail (detail)

Files:
- apps/frontend_web/app/admin/users/workers/page.tsx
- apps/frontend_web/app/admin/users/workers/[id]/page.tsx
```

---

### Task 4: Agency Users Implementation ⏰ 5-6 hours

**Files**:

- `apps/frontend_web/app/admin/users/agencies/page.tsx`
- `apps/frontend_web/app/admin/users/agencies/[id]/page.tsx`

#### Implementation:

1. **Agency List Page** (2.5 hours)
   - Search and filters
   - Agency table: Name, Contact person, Employees count, Jobs handled, Total revenue, Status
   - Sort options

2. **Agency Detail Page** (2.5-3.5 hours)
   - Agency profile with business info
   - Employee list (sub-table)
   - Stats: Total employees, Jobs handled, Revenue, Rating
   - Tabs: Overview, Employees, Jobs, Financial
   - Actions: Suspend, Verify, Delete

**AI Prompt for Task 4**:

```
Implement Agency Users management:
1. Agency list at /admin/users/agencies/page.tsx
2. Table columns: Agency Name, Contact Person, Employees Count, Jobs Handled, Total Revenue, Status, Actions
3. Filters: Search by name, Status (Active/Suspended)
4. Agency detail page at /admin/users/agencies/[id]/page.tsx
5. Show agency-specific info: business_name, registration_number, contact_person
6. Employees sub-table with: Name, Role, Jobs Completed, Status
7. Stats cards: Total Employees, Jobs Handled, Revenue, Rating
8. Tabs: Overview, Employees, Jobs History, Financial Records
9. Actions: Verify Agency, Suspend, Delete
10. Use APIs: /api/adminpanel/users/agencies, /api/adminpanel/users/{id}/detail

Files:
- apps/frontend_web/app/admin/users/agencies/page.tsx
- apps/frontend_web/app/admin/users/agencies/[id]/page.tsx
```

---

### Task 5: User Search Global Component ⏰ 3-4 hours

**File**: Create `apps/frontend_web/components/admin/UserSearchModal.tsx`

#### Features:

- Global search across all user types
- Real-time search with debounce
- Display results grouped by type (Clients, Workers, Agencies)
- Click to navigate to detail page
- Recent searches history

**AI Prompt for Task 5**:

```
Create a global user search modal component:
1. Triggered by search icon in admin header
2. Search input with 300ms debounce
3. Search across clients, workers, agencies simultaneously
4. Group results by user type with section headers
5. Display: avatar, name, email, user type badge
6. Click result to navigate to appropriate detail page
7. Show "Recent Searches" when input is empty (stored in localStorage)
8. Max 5 recent searches, clickable
9. Loading state with skeleton loaders
10. Empty state "No users found"
11. Use API: /api/adminpanel/users/search?q={query}

File: apps/frontend_web/components/admin/UserSearchModal.tsx
Usage: Import in admin layout header
```

---

### Task 6: Bulk User Actions ⏰ 2-3 hours

**File**: Add to existing user list pages

#### Features:

- Checkbox selection (select all, individual)
- Bulk actions dropdown: Suspend, Activate, Export
- Confirmation modals
- Progress indicators for bulk operations

**AI Prompt for Task 6**:

```
Add bulk user actions to all user list pages:
1. Add checkbox column to tables (clients, workers, agencies)
2. Add "Select All" checkbox in header
3. Show bulk actions bar when users selected: "{count} selected"
4. Bulk actions dropdown: Suspend Selected, Activate Selected, Export to CSV
5. Confirmation modal before bulk suspend: "Suspend {count} users?" with reason input
6. Sequential API calls with progress indicator (Processing 3/10...)
7. Success toast: "{count} users suspended successfully"
8. Error handling: Show failed operations count
9. Deselect all after successful operation
10. Use existing suspend/activate APIs in loop

Files to modify:
- apps/frontend_web/app/admin/users/clients/page.tsx
- apps/frontend_web/app/admin/users/workers/page.tsx
- apps/frontend_web/app/admin/users/agencies/page.tsx
```

---

## Testing Checklist

### Client Users

- [ ] Client list loads with real data
- [ ] Search filters clients correctly
- [ ] Status filter works (All, Active, Suspended, Banned)
- [ ] Sort options work correctly
- [ ] Pagination works
- [ ] Click row navigates to detail page
- [ ] Client detail page displays all information
- [ ] Tabs switch correctly
- [ ] Suspend account works with reason
- [ ] Activate account works
- [ ] Ban account works with confirmation
- [ ] Delete account works with confirmation
- [ ] Edit profile saves changes
- [ ] Reset password sends email
- [ ] Activity timeline loads and paginates
- [ ] Bulk actions select/deselect works
- [ ] Bulk suspend works
- [ ] Export to CSV works

### Worker Users

- [ ] Worker list loads with real data
- [ ] Verification status filter works
- [ ] Worker-specific fields display (skills, hourly rate)
- [ ] Worker detail shows certifications
- [ ] Portfolio tab displays images
- [ ] Verify worker action works
- [ ] Worker stats accurate
- [ ] All actions work (suspend, ban, delete)

### Agency Users

- [ ] Agency list loads with real data
- [ ] Agency detail shows employees
- [ ] Employee sub-table loads
- [ ] Agency stats accurate
- [ ] Financial tab displays records
- [ ] All actions work

### Global Features

- [ ] Global search finds all user types
- [ ] Recent searches save and load
- [ ] Bulk actions work on all user types
- [ ] All modals have proper validation
- [ ] Error handling displays user-friendly messages
- [ ] Loading states show during API calls
- [ ] Success/error toasts appear

---

## File Structure

```
apps/frontend_web/app/admin/users/
├── clients/
│   ├── page.tsx                    ✅ EXISTS (needs enhancement)
│   └── [id]/
│       └── page.tsx                ❌ CREATE (detail page)
├── workers/
│   ├── page.tsx                    ⚠️  CREATE/UPDATE
│   └── [id]/
│       └── page.tsx                ❌ CREATE (detail page)
└── agencies/
    ├── page.tsx                    ⚠️  CREATE/UPDATE
    └── [id]/
        └── page.tsx                ❌ CREATE (detail page)

apps/frontend_web/components/admin/
└── UserSearchModal.tsx             ❌ CREATE (global search)
```

---

## API Integration Summary

| Endpoint                                    | Method | Purpose        | Status   |
| ------------------------------------------- | ------ | -------------- | -------- |
| `/api/adminpanel/users/clients`             | GET    | List clients   | ✅ Ready |
| `/api/adminpanel/users/workers`             | GET    | List workers   | ✅ Ready |
| `/api/adminpanel/users/agencies`            | GET    | List agencies  | ✅ Ready |
| `/api/adminpanel/users/{id}/detail`         | GET    | User details   | ✅ Ready |
| `/api/adminpanel/users/{id}/suspend`        | POST   | Suspend user   | ✅ Ready |
| `/api/adminpanel/users/{id}/ban`            | POST   | Ban user       | ✅ Ready |
| `/api/adminpanel/users/{id}/activate`       | POST   | Activate user  | ✅ Ready |
| `/api/adminpanel/users/{id}`                | DELETE | Delete user    | ✅ Ready |
| `/api/adminpanel/users/{id}/profile`        | PUT    | Update profile | ✅ Ready |
| `/api/adminpanel/users/{id}/reset-password` | POST   | Reset password | ✅ Ready |
| `/api/adminpanel/users/{id}/activity`       | GET    | Activity logs  | ✅ Ready |
| `/api/adminpanel/users/search`              | GET    | Global search  | ✅ Ready |

---

## Dependencies

- **None** - All backend APIs are ready
- **Shared Components** - Can reuse table components from other modules
- **Sidebar Update** - Will need to add pending counts for user sections

---

## Completion Criteria

✅ Module complete when:

1. All three user types (clients, workers, agencies) have functioning list pages
2. All three user types have detailed profile pages
3. All account actions work (suspend, ban, activate, delete)
4. Global search component implemented
5. Bulk actions implemented
6. All tests passing
7. Documentation updated

---

**Ready for Implementation**: ✅ All backend APIs operational, requirements documented, AI prompts provided
