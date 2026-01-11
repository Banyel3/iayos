# Admin Panel - Module 4: Reviews & Ratings Management

**Status**: 📋 PLANNED  
**Priority**: MEDIUM  
**Estimated Time**: 15-18 hours  
**Dependencies**: Module 2 (User Management) for user links

---

## Module Overview

Comprehensive review and rating management system allowing admins to monitor, moderate, and respond to reviews across the platform. Includes dispute resolution, rating analytics, and quality control features.

### Scope

- Review listings with filtering and search
- Review detail pages with full context
- Moderation tools (flag, hide, delete)
- Dispute management workflow
- Rating analytics and trends
- Inappropriate content detection

---

## Backend APIs Available

### Review Endpoints

```python
# Get all reviews with filters
GET /api/adminpanel/reviews/all
Query: page, limit, rating_filter, status, user_type, search
Response: {
  reviews: [{
    id, job_id, reviewer_id, reviewee_id, rating, comment,
    created_at, is_flagged, is_hidden, status
  }],
  pagination: { page, limit, total, pages }
}

# Get review detail
GET /api/adminpanel/reviews/{id}/detail
Response: {
  review: { ... },
  job: { title, category, budget },
  reviewer: { name, email, profile_type },
  reviewee: { name, email, profile_type },
  history: [{ action, admin_id, reason, timestamp }]
}

# Flag review
POST /api/adminpanel/reviews/{id}/flag
Body: { reason: string, severity: 'low' | 'medium' | 'high' }

# Hide review (soft delete)
POST /api/adminpanel/reviews/{id}/hide
Body: { reason: string }

# Delete review permanently
DELETE /api/adminpanel/reviews/{id}
Body: { reason: string }

# Restore hidden review
POST /api/adminpanel/reviews/{id}/restore

# Get flagged reviews
GET /api/adminpanel/reviews/flagged
Query: page, limit, severity

# Get rating statistics
GET /api/adminpanel/reviews/statistics
Query: date_from, date_to, user_type
Response: {
  total_reviews: number,
  average_rating: number,
  rating_distribution: { 1: count, 2: count, ... },
  flagged_count: number,
  hidden_count: number
}

# Get review trends
GET /api/adminpanel/reviews/trends
Query: period (7d, 30d, 90d, 1y)
Response: {
  timeline: [{ date, count, average_rating }],
  comparison: { current_period, previous_period, change_percent }
}
```

---

## Implementation Tasks

### Task 1: Reviews List Page ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/reviews/page.tsx`

#### Steps:

1. **Create Reviews List** (3 hours)

   ```typescript
   'use client';

   import { useState, useEffect } from 'react';
   import { useRouter } from 'next/navigation';

   interface ReviewFilters {
     search: string;
     rating: 'all' | '1' | '2' | '3' | '4' | '5';
     status: 'all' | 'active' | 'flagged' | 'hidden';
     userType: 'all' | 'client_to_worker' | 'worker_to_client';
   }

   export default function ReviewsPage() {
     const router = useRouter();
     const [reviews, setReviews] = useState([]);
     const [loading, setLoading] = useState(true);
     const [filters, setFilters] = useState<ReviewFilters>({
       search: '',
       rating: 'all',
       status: 'all',
       userType: 'all'
     });
     const [pagination, setPagination] = useState({
       page: 1,
       limit: 20,
       total: 0,
       pages: 0
     });

     const fetchReviews = async () => {
       setLoading(true);
       try {
         const params = new URLSearchParams({
           page: pagination.page.toString(),
           limit: pagination.limit.toString(),
           ...(filters.search && { search: filters.search }),
           ...(filters.rating !== 'all' && { rating_filter: filters.rating }),
           ...(filters.status !== 'all' && { status: filters.status }),
           ...(filters.userType !== 'all' && { user_type: filters.userType })
         });

         const response = await fetch(`/api/adminpanel/reviews/all?${params}`, {
           credentials: 'include'
         });

         if (!response.ok) throw new Error('Failed to fetch reviews');

         const data = await response.json();
         setReviews(data.reviews);
         setPagination(prev => ({
           ...prev,
           total: data.pagination.total,
           pages: data.pagination.pages
         }));
       } catch (error) {
         console.error('Error:', error);
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       const debounce = setTimeout(() => {
         fetchReviews();
       }, 300);

       return () => clearTimeout(debounce);
     }, [filters, pagination.page]);

     const renderStars = (rating: number) => {
       return Array.from({ length: 5 }, (_, i) => (
         <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
           ★
         </span>
       ));
     };

     return (
       <div className="p-6">
         <div className="mb-6">
           <h1 className="text-2xl font-bold">Reviews & Ratings</h1>
           <p className="text-gray-600">Monitor and moderate platform reviews</p>
         </div>

         {/* Filters */}
         <div className="bg-white rounded-lg shadow p-4 mb-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Search */}
             <input
               type="text"
               placeholder="Search reviews..."
               value={filters.search}
               onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
               className="border rounded-lg px-4 py-2"
             />

             {/* Rating Filter */}
             <select
               value={filters.rating}
               onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value as any }))}
               className="border rounded-lg px-4 py-2"
             >
               <option value="all">All Ratings</option>
               <option value="5">5 Stars</option>
               <option value="4">4 Stars</option>
               <option value="3">3 Stars</option>
               <option value="2">2 Stars</option>
               <option value="1">1 Star</option>
             </select>

             {/* Status Filter */}
             <select
               value={filters.status}
               onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
               className="border rounded-lg px-4 py-2"
             >
               <option value="all">All Status</option>
               <option value="active">Active</option>
               <option value="flagged">Flagged</option>
               <option value="hidden">Hidden</option>
             </select>

             {/* User Type Filter */}
             <select
               value={filters.userType}
               onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value as any }))}
               className="border rounded-lg px-4 py-2"
             >
               <option value="all">All Types</option>
               <option value="client_to_worker">Client to Worker</option>
               <option value="worker_to_client">Worker to Client</option>
             </select>
           </div>
         </div>

         {/* Quick Stats */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
           <div className="bg-white rounded-lg shadow p-4">
             <p className="text-sm text-gray-600">Total Reviews</p>
             <p className="text-2xl font-bold">{pagination.total}</p>
           </div>
           <div className="bg-white rounded-lg shadow p-4">
             <p className="text-sm text-gray-600">Flagged</p>
             <p className="text-2xl font-bold text-red-600">
               {reviews.filter((r: any) => r.is_flagged).length}
             </p>
           </div>
           <div className="bg-white rounded-lg shadow p-4">
             <p className="text-sm text-gray-600">Hidden</p>
             <p className="text-2xl font-bold text-yellow-600">
               {reviews.filter((r: any) => r.is_hidden).length}
             </p>
           </div>
           <div className="bg-white rounded-lg shadow p-4">
             <p className="text-sm text-gray-600">Avg Rating</p>
             <p className="text-2xl font-bold">
               ⭐ {(reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length || 0).toFixed(1)}
             </p>
           </div>
         </div>

         {/* Reviews List */}
         <div className="bg-white rounded-lg shadow">
           {loading ? (
             <div className="p-6 text-center">Loading...</div>
           ) : reviews.length === 0 ? (
             <div className="p-6 text-center text-gray-600">No reviews found</div>
           ) : (
             <div className="divide-y divide-gray-200">
               {reviews.map((review: any) => (
                 <div
                   key={review.id}
                   onClick={() => router.push(`/admin/reviews/${review.id}`)}
                   className="p-6 hover:bg-gray-50 cursor-pointer"
                 >
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-3">
                       <div>
                         <p className="font-medium">{review.reviewer_name}</p>
                         <p className="text-sm text-gray-600">
                           reviewed {review.reviewee_name}
                         </p>
                       </div>
                     </div>

                     <div className="flex items-center gap-2">
                       {review.is_flagged && (
                         <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                           Flagged
                         </span>
                       )}
                       {review.is_hidden && (
                         <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                           Hidden
                         </span>
                       )}
                       <div className="flex">{renderStars(review.rating)}</div>
                     </div>
                   </div>

                   <p className="text-gray-700 mb-2">{review.comment}</p>

                   <div className="flex items-center gap-4 text-sm text-gray-500">
                     <span>Job: {review.job_title}</span>
                     <span>•</span>
                     <span>{new Date(review.created_at).toLocaleDateString()}</span>
                   </div>
                 </div>
               ))}
             </div>
           )}
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

2. **Add Export Functionality** (1 hour)
   - CSV export button
   - Filter applied to export
   - Download trigger

3. **Add Bulk Moderation** (1 hour)
   - Checkbox selection
   - Bulk hide/delete
   - Confirmation modals

**AI Prompt for Task 1**:

```
Implement Reviews list page with:
1. Fetch reviews from /api/adminpanel/reviews/all with pagination
2. Add 4 filters: Search (text), Rating (1-5 stars dropdown), Status (Active/Flagged/Hidden), User Type (Client to Worker / Worker to Client)
3. Display 4 quick stat cards: Total Reviews, Flagged Count, Hidden Count, Average Rating
4. Review cards showing: Reviewer name, Reviewee name, Star rating (★), Comment text, Job title, Date
5. Add status badges: Flagged (red), Hidden (yellow)
6. Click review card to navigate to /admin/reviews/{id}
7. Add pagination (20 per page)
8. Implement 300ms debounce on search
9. Loading and empty states
10. Style with Tailwind CSS

File: apps/frontend_web/app/admin/reviews/page.tsx
```

---

### Task 2: Review Detail & Moderation ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/reviews/[id]/page.tsx`

#### Steps:

1. **Create Detail Page** (2.5 hours)

   ```typescript
   'use client';

   import { useState, useEffect } from 'react';
   import { useParams, useRouter } from 'next/navigation';

   interface ReviewDetail {
     review: {
       id: number;
       rating: number;
       comment: string;
       created_at: string;
       is_flagged: boolean;
       is_hidden: boolean;
       status: string;
     };
     job: {
       id: number;
       title: string;
       category: string;
       budget: number;
     };
     reviewer: {
       id: number;
       name: string;
       email: string;
       profile_type: string;
     };
     reviewee: {
       id: number;
       name: string;
       email: string;
       profile_type: string;
     };
     history: Array<{
       action: string;
       admin_id: number;
       admin_name: string;
       reason: string;
       timestamp: string;
     }>;
   }

   export default function ReviewDetailPage() {
     const params = useParams();
     const router = useRouter();
     const reviewId = params.id as string;

     const [detail, setDetail] = useState<ReviewDetail | null>(null);
     const [loading, setLoading] = useState(true);
     const [showFlagModal, setShowFlagModal] = useState(false);
     const [showHideModal, setShowHideModal] = useState(false);
     const [showDeleteModal, setShowDeleteModal] = useState(false);

     const fetchDetail = async () => {
       try {
         const response = await fetch(`/api/adminpanel/reviews/${reviewId}/detail`, {
           credentials: 'include'
         });

         if (!response.ok) throw new Error('Failed to fetch review');

         const data = await response.json();
         setDetail(data);
       } catch (error) {
         console.error('Error:', error);
       } finally {
         setLoading(false);
       }
     };

     useEffect(() => {
       fetchDetail();
     }, [reviewId]);

     const handleFlag = async (reason: string, severity: string) => {
       try {
         const response = await fetch(`/api/adminpanel/reviews/${reviewId}/flag`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           credentials: 'include',
           body: JSON.stringify({ reason, severity })
         });

         if (!response.ok) throw new Error('Failed to flag review');

         alert('Review flagged successfully');
         fetchDetail();
         setShowFlagModal(false);
       } catch (error) {
         console.error('Error:', error);
         alert('Failed to flag review');
       }
     };

     const handleHide = async (reason: string) => {
       try {
         const response = await fetch(`/api/adminpanel/reviews/${reviewId}/hide`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           credentials: 'include',
           body: JSON.stringify({ reason })
         });

         if (!response.ok) throw new Error('Failed to hide review');

         alert('Review hidden successfully');
         fetchDetail();
         setShowHideModal(false);
       } catch (error) {
         console.error('Error:', error);
         alert('Failed to hide review');
       }
     };

     const handleDelete = async (reason: string) => {
       try {
         const response = await fetch(`/api/adminpanel/reviews/${reviewId}`, {
           method: 'DELETE',
           headers: { 'Content-Type': 'application/json' },
           credentials: 'include',
           body: JSON.stringify({ reason })
         });

         if (!response.ok) throw new Error('Failed to delete review');

         alert('Review deleted successfully');
         router.push('/admin/reviews');
       } catch (error) {
         console.error('Error:', error);
         alert('Failed to delete review');
       }
     };

     const handleRestore = async () => {
       try {
         const response = await fetch(`/api/adminpanel/reviews/${reviewId}/restore`, {
           method: 'POST',
           credentials: 'include'
         });

         if (!response.ok) throw new Error('Failed to restore review');

         alert('Review restored successfully');
         fetchDetail();
       } catch (error) {
         console.error('Error:', error);
         alert('Failed to restore review');
       }
     };

     if (loading) return <div className="p-6">Loading...</div>;
     if (!detail) return <div className="p-6">Review not found</div>;

     return (
       <div className="p-6">
         <button
           onClick={() => router.back()}
           className="text-blue-600 hover:text-blue-800 mb-4"
         >
           ← Back to Reviews
         </button>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Main Content */}
           <div className="lg:col-span-2 space-y-6">
             {/* Review Card */}
             <div className="bg-white rounded-lg shadow p-6">
               <div className="flex justify-between items-start mb-4">
                 <h2 className="text-xl font-bold">Review Details</h2>
                 <div className="flex gap-2">
                   {detail.review.is_flagged && (
                     <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                       Flagged
                     </span>
                   )}
                   {detail.review.is_hidden && (
                     <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                       Hidden
                     </span>
                   )}
                 </div>
               </div>

               <div className="mb-4">
                 <div className="flex items-center gap-2 mb-2">
                   {Array.from({ length: 5 }, (_, i) => (
                     <span key={i} className={`text-2xl ${i < detail.review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                       ★
                     </span>
                   ))}
                   <span className="text-xl font-bold">{detail.review.rating}.0</span>
                 </div>
                 <p className="text-gray-700 text-lg">{detail.review.comment}</p>
               </div>

               <div className="text-sm text-gray-500">
                 Posted on {new Date(detail.review.created_at).toLocaleString()}
               </div>
             </div>

             {/* Job Info */}
             <div className="bg-white rounded-lg shadow p-6">
               <h3 className="font-semibold mb-4">Related Job</h3>
               <div className="space-y-2">
                 <p><span className="text-gray-600">Title:</span> {detail.job.title}</p>
                 <p><span className="text-gray-600">Category:</span> {detail.job.category}</p>
                 <p><span className="text-gray-600">Budget:</span> ₱{detail.job.budget.toLocaleString()}</p>
                 <button
                   onClick={() => router.push(`/admin/jobs/${detail.job.id}`)}
                   className="text-blue-600 hover:text-blue-800"
                 >
                   View Job Details →
                 </button>
               </div>
             </div>

             {/* Action History */}
             <div className="bg-white rounded-lg shadow p-6">
               <h3 className="font-semibold mb-4">Action History</h3>
               {detail.history.length === 0 ? (
                 <p className="text-gray-600">No actions taken yet</p>
               ) : (
                 <div className="space-y-4">
                   {detail.history.map((item, index) => (
                     <div key={index} className="border-l-2 border-gray-300 pl-4">
                       <p className="font-medium">{item.action}</p>
                       <p className="text-sm text-gray-600">By: {item.admin_name}</p>
                       {item.reason && <p className="text-sm text-gray-600">Reason: {item.reason}</p>}
                       <p className="text-xs text-gray-500">
                         {new Date(item.timestamp).toLocaleString()}
                       </p>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>

           {/* Sidebar */}
           <div className="space-y-6">
             {/* Reviewer Info */}
             <div className="bg-white rounded-lg shadow p-6">
               <h3 className="font-semibold mb-4">Reviewer</h3>
               <p className="font-medium">{detail.reviewer.name}</p>
               <p className="text-sm text-gray-600">{detail.reviewer.email}</p>
               <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                 {detail.reviewer.profile_type}
               </span>
               <button
                 onClick={() => router.push(`/admin/users/${detail.reviewer.profile_type.toLowerCase()}s/${detail.reviewer.id}`)}
                 className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
               >
                 View Profile →
               </button>
             </div>

             {/* Reviewee Info */}
             <div className="bg-white rounded-lg shadow p-6">
               <h3 className="font-semibold mb-4">Reviewee</h3>
               <p className="font-medium">{detail.reviewee.name}</p>
               <p className="text-sm text-gray-600">{detail.reviewee.email}</p>
               <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                 {detail.reviewee.profile_type}
               </span>
               <button
                 onClick={() => router.push(`/admin/users/${detail.reviewee.profile_type.toLowerCase()}s/${detail.reviewee.id}`)}
                 className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
               >
                 View Profile →
               </button>
             </div>

             {/* Actions */}
             <div className="bg-white rounded-lg shadow p-6">
               <h3 className="font-semibold mb-4">Moderation Actions</h3>
               <div className="space-y-2">
                 {!detail.review.is_flagged && (
                   <button
                     onClick={() => setShowFlagModal(true)}
                     className="w-full px-4 py-2 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50"
                   >
                     Flag Review
                   </button>
                 )}

                 {!detail.review.is_hidden ? (
                   <button
                     onClick={() => setShowHideModal(true)}
                     className="w-full px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50"
                   >
                     Hide Review
                   </button>
                 ) : (
                   <button
                     onClick={handleRestore}
                     className="w-full px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                   >
                     Restore Review
                   </button>
                 )}

                 <button
                   onClick={() => setShowDeleteModal(true)}
                   className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                 >
                   Delete Permanently
                 </button>
               </div>
             </div>
           </div>
         </div>

         {/* Modals */}
         {showFlagModal && (
           <FlagModal
             onConfirm={handleFlag}
             onCancel={() => setShowFlagModal(false)}
           />
         )}

         {showHideModal && (
           <HideModal
             onConfirm={handleHide}
             onCancel={() => setShowHideModal(false)}
           />
         )}

         {showDeleteModal && (
           <DeleteModal
             onConfirm={handleDelete}
             onCancel={() => setShowDeleteModal(false)}
           />
         )}
       </div>
     );
   }

   // Modal components (simplified - expand with full forms)
   function FlagModal({ onConfirm, onCancel }: any) {
     const [reason, setReason] = useState('');
     const [severity, setSeverity] = useState('medium');

     return (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 max-w-md w-full">
           <h3 className="text-lg font-bold mb-4">Flag Review</h3>
           <textarea
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             placeholder="Reason for flagging..."
             className="w-full border rounded-lg px-3 py-2 mb-4"
             rows={4}
           />
           <select
             value={severity}
             onChange={(e) => setSeverity(e.target.value)}
             className="w-full border rounded-lg px-3 py-2 mb-4"
           >
             <option value="low">Low Severity</option>
             <option value="medium">Medium Severity</option>
             <option value="high">High Severity</option>
           </select>
           <div className="flex gap-2">
             <button
               onClick={() => onConfirm(reason, severity)}
               className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg"
             >
               Flag
             </button>
             <button
               onClick={onCancel}
               className="flex-1 px-4 py-2 border rounded-lg"
             >
               Cancel
             </button>
           </div>
         </div>
       </div>
     );
   }

   function HideModal({ onConfirm, onCancel }: any) {
     const [reason, setReason] = useState('');

     return (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 max-w-md w-full">
           <h3 className="text-lg font-bold mb-4">Hide Review</h3>
           <textarea
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             placeholder="Reason for hiding..."
             className="w-full border rounded-lg px-3 py-2 mb-4"
             rows={4}
           />
           <div className="flex gap-2">
             <button
               onClick={() => onConfirm(reason)}
               className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg"
             >
               Hide
             </button>
             <button
               onClick={onCancel}
               className="flex-1 px-4 py-2 border rounded-lg"
             >
               Cancel
             </button>
           </div>
         </div>
       </div>
     );
   }

   function DeleteModal({ onConfirm, onCancel }: any) {
     const [reason, setReason] = useState('');

     return (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white rounded-lg p-6 max-w-md w-full">
           <h3 className="text-lg font-bold mb-4 text-red-600">Delete Review Permanently</h3>
           <p className="text-gray-600 mb-4">This action cannot be undone.</p>
           <textarea
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             placeholder="Reason for deletion..."
             className="w-full border rounded-lg px-3 py-2 mb-4"
             rows={4}
           />
           <div className="flex gap-2">
             <button
               onClick={() => onConfirm(reason)}
               className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
             >
               Delete
             </button>
             <button
               onClick={onCancel}
               className="flex-1 px-4 py-2 border rounded-lg"
             >
               Cancel
             </button>
           </div>
         </div>
       </div>
     );
   }
   ```

2. **Add Modal Components** (1.5 hours)
   - Flag modal with reason + severity
   - Hide modal with reason
   - Delete confirmation modal

**AI Prompt for Task 2**:

```
Create Review Detail page with:
1. Fetch review details from /api/adminpanel/reviews/{id}/detail
2. 2-column layout: Main content (left 2/3) + Sidebar (right 1/3)
3. Main content: Review card with stars, comment, date + Job info card + Action history timeline
4. Sidebar: Reviewer card, Reviewee card, Moderation Actions buttons
5. Moderation actions: Flag (yellow button), Hide/Restore (toggle), Delete (red button)
6. Create 3 modals: FlagModal (reason textarea + severity dropdown), HideModal (reason textarea), DeleteModal (confirmation + reason)
7. All modals call respective APIs: /flag, /hide, /restore, DELETE
8. Show status badges: Flagged (red), Hidden (yellow)
9. Add "View Profile" links to reviewer/reviewee cards
10. Add "View Job" link in job info card

File: apps/frontend_web/app/admin/reviews/[id]/page.tsx
```

---

### Task 3: Rating Analytics Dashboard ⏰ 4-5 hours

**File**: `apps/frontend_web/app/admin/reviews/analytics/page.tsx`

#### Features:

1. **Statistics Cards** (1.5 hours)
   - Total reviews count
   - Average rating (platform-wide)
   - Rating distribution chart (1-5 stars)
   - Flagged reviews count

2. **Trend Chart** (2 hours)
   - Line chart showing reviews over time
   - Average rating trend
   - Comparison with previous period
   - Date range selector (7d, 30d, 90d, 1y)

3. **Top Reviewers/Reviewees** (1.5 hours)
   - Most active reviewers
   - Highest rated workers
   - Most reviewed clients
   - Link to user profiles

**AI Prompt for Task 3**:

```
Create Rating Analytics page with:
1. Fetch statistics from /api/adminpanel/reviews/statistics
2. Display 4 stat cards: Total Reviews, Average Rating (⭐), Flagged Count, Hidden Count
3. Rating distribution bar chart showing count for each star rating (1-5)
4. Fetch trends from /api/adminpanel/reviews/trends with period selector
5. Line chart showing: Daily review count + Average rating (dual axis)
6. Comparison badge: "↑ 15% vs previous period" (green if up, red if down)
7. Date range buttons: 7 Days, 30 Days, 90 Days, 1 Year
8. Top 10 tables: Most Active Reviewers, Highest Rated Workers, Most Reviewed Clients
9. Tables show: Rank, Name, Count/Rating, View Profile link
10. Use Chart.js or Recharts for visualizations

File: apps/frontend_web/app/admin/reviews/analytics/page.tsx
```

---

### Task 4: Flagged Reviews Management ⏰ 2-3 hours

**File**: `apps/frontend_web/app/admin/reviews/flagged/page.tsx`

#### Features:

- Separate page for flagged reviews only
- Severity filter (low, medium, high)
- Quick action buttons (hide, delete, dismiss)
- Bulk resolution

**AI Prompt for Task 4**:

```
Create Flagged Reviews page:
1. Fetch from /api/adminpanel/reviews/flagged
2. Filter by severity: All, Low, Medium, High
3. Review cards with: Flag badge (color by severity), Reviewer, Reviewee, Comment, Stars
4. Quick action buttons on each card: Hide, Delete, Dismiss Flag
5. Bulk actions: Select all, Bulk hide, Bulk delete
6. Confirmation modals before destructive actions
7. Success toast after actions
8. Auto-refresh list after actions
9. Empty state: "No flagged reviews"
10. Pagination (20 per page)

File: apps/frontend_web/app/admin/reviews/flagged/page.tsx
```

---

## Testing Checklist

### Reviews List

- [ ] Reviews load with pagination
- [ ] Search filters reviews correctly
- [ ] Rating filter works (1-5 stars)
- [ ] Status filter works (Active/Flagged/Hidden)
- [ ] User type filter works
- [ ] Quick stats display accurately
- [ ] Click review navigates to detail page
- [ ] Export to CSV works
- [ ] Bulk selection works
- [ ] Bulk hide works
- [ ] Bulk delete works with confirmation

### Review Detail

- [ ] Detail page loads all information
- [ ] Reviewer/reviewee cards display correctly
- [ ] Job info displays with link
- [ ] Flag modal saves with reason + severity
- [ ] Hide modal works
- [ ] Delete modal confirms before deletion
- [ ] Restore button works for hidden reviews
- [ ] Action history displays chronologically
- [ ] Profile links navigate correctly
- [ ] Job link navigates correctly

### Analytics

- [ ] Statistics cards display correct counts
- [ ] Rating distribution chart accurate
- [ ] Trend chart displays correctly
- [ ] Date range selector changes data
- [ ] Period comparison accurate
- [ ] Top reviewers list correct
- [ ] Charts responsive on mobile

### Flagged Reviews

- [ ] Flagged reviews load correctly
- [ ] Severity filter works
- [ ] Quick actions work (hide, delete, dismiss)
- [ ] Bulk actions work
- [ ] Confirmations required for destructive actions
- [ ] Success notifications appear

---

## File Structure

```
apps/frontend_web/app/admin/reviews/
├── page.tsx                        ❌ CREATE (reviews list)
├── [id]/
│   └── page.tsx                    ❌ CREATE (review detail)
├── analytics/
│   └── page.tsx                    ❌ CREATE (analytics dashboard)
└── flagged/
    └── page.tsx                    ❌ CREATE (flagged reviews)
```

---

## API Integration Summary

| Endpoint                               | Method | Purpose         | Status   |
| -------------------------------------- | ------ | --------------- | -------- |
| `/api/adminpanel/reviews/all`          | GET    | List reviews    | ✅ Ready |
| `/api/adminpanel/reviews/{id}/detail`  | GET    | Review details  | ✅ Ready |
| `/api/adminpanel/reviews/{id}/flag`    | POST   | Flag review     | ✅ Ready |
| `/api/adminpanel/reviews/{id}/hide`    | POST   | Hide review     | ✅ Ready |
| `/api/adminpanel/reviews/{id}`         | DELETE | Delete review   | ✅ Ready |
| `/api/adminpanel/reviews/{id}/restore` | POST   | Restore review  | ✅ Ready |
| `/api/adminpanel/reviews/flagged`      | GET    | Flagged reviews | ✅ Ready |
| `/api/adminpanel/reviews/statistics`   | GET    | Rating stats    | ✅ Ready |
| `/api/adminpanel/reviews/trends`       | GET    | Rating trends   | ✅ Ready |

---

## Dependencies

- **Module 2** - User Management (for profile links)
- **Chart Library** - Need to add Chart.js or Recharts for analytics

---

## Completion Criteria

✅ Module complete when:

1. Reviews list page functional with all filters
2. Review detail page with full moderation tools
3. Analytics dashboard with charts and trends
4. Flagged reviews management page
5. All moderation actions working
6. All tests passing
7. Documentation updated

---

**Ready for Implementation**: ✅ All backend APIs operational, analytics specifications clear
