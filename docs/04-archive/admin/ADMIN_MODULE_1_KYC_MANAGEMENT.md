# Admin Module 1: KYC Management System

**Status**: 📋 PLANNED  
**Priority**: CRITICAL  
**Time Estimate**: 20-25 hours  
**Dependencies**: None (can start immediately)  
**Backend**: ✅ All endpoints ready

## Overview

Complete the KYC (Know Your Customer) verification system for reviewing and approving identity documents submitted by individual users and agencies. This is the highest priority module as KYC verification blocks users from accessing platform features.

## Module Scope

### Pages to Implement

1. **Main KYC List** (`admin/kyc/page.tsx`) - Overview with stats and filters
2. **Pending KYC** (`admin/kyc/pending/page.tsx`) - Awaiting review submissions
3. **Approved KYC** (`admin/kyc/approved/page.tsx`) - Verified accounts
4. **Rejected KYC** (`admin/kyc/rejected/page.tsx`) - Failed verifications
5. **KYC Detail Modal** (`admin/kyc/[id]/page.tsx`) - Document viewer + actions
6. **KYC Logs** (`admin/kyc/logs/page.tsx`) - Audit trail of all KYC actions

### Features

- ✅ Document image viewer with zoom/pan
- ✅ Approve/Reject actions with admin notes
- ✅ Individual KYC (ID front/back, selfie, barangay clearance)
- ✅ Agency KYC (business permit, rep ID, address proof, auth letter)
- ✅ Status badges (pending/approved/rejected/under_review)
- ✅ Search by name/email
- ✅ Date range filters
- ✅ Audit logs with action history
- ✅ Signed Supabase URLs for secure document viewing

## Backend API Endpoints

All endpoints ready in `apps/backend/src/adminpanel/api.py`:

```typescript
// Fetch all KYC submissions (individual + agency)
GET /api/adminpanel/kyc/all
Response: {
  success: boolean;
  kyc: Array<{ kycID, accountFK_id, kycStatus, reviewedAt, reviewedBy_id, notes, createdAt }>;
  kyc_files: Array<{ kycFileID, kycID_id, idType, fileName, fileURL }>;
  users: Array<{ accountID, email, firstName, lastName, contactNum, profileType }>;
  agency_kyc: Array<{ agencyKycID, accountFK_id, status, reviewedAt, notes }>;
  agency_kyc_files: Array<{ fileID, agencyKyc_id, fileType, fileName, fileURL }>;
  agencies: Array<{ accountID, email, businessName, businessDesc }>;
}

// Generate signed URLs for document viewing
POST /api/adminpanel/kyc/review
Body: { frontIDLink, backIDLink, clearanceLink, selfieLink }
Response: { frontIDLink, backIDLink, clearanceLink, selfieLink } // Signed URLs

// Approve individual KYC
POST /api/adminpanel/kyc/approve
Body: { kycID: number, notes?: string }
Response: { success: boolean, message: string }

// Reject individual KYC
POST /api/adminpanel/kyc/reject
Body: { kycID: number, notes: string }
Response: { success: boolean, message: string }

// Approve agency KYC
POST /api/adminpanel/kyc/approve-agency
Body: { agencyKycID: number, notes?: string }
Response: { success: boolean, message: string }

// Reject agency KYC
POST /api/adminpanel/kyc/reject-agency
Body: { agencyKycID: number, notes: string }
Response: { success: boolean, message: string }

// Fetch audit logs
GET /api/adminpanel/kyc/logs?action=APPROVED&limit=100
Response: {
  success: boolean;
  logs: Array<{ kycLogID, kycID, action, performedBy, performedAt, notes }>;
  count: number;
}
```

## Implementation Tasks

### Task 1.1: Replace Mock Data in Main KYC Page (3 hours)

**File**: `apps/frontend_web/app/admin/kyc/page.tsx`

**Current State**: Uses `mockKYCRecords` array (lines 48-85)

**Changes Needed**:

1. Remove mock data array
2. Add state management for API data:

```typescript
const [kycRecords, setKycRecords] = useState<KYCRecord[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

3. Create `fetchKYCData()` function:

```typescript
const fetchKYCData = async () => {
  try {
    setLoading(true);
    const response = await fetch(
      "http://localhost:8000/api/adminpanel/kyc/all",
      {
        credentials: "include",
      }
    );

    if (!response.ok) throw new Error("Failed to fetch KYC data");

    const data = await response.json();

    // Transform backend data to match KYCRecord interface
    const transformedRecords = combineKYCData(data);
    setKycRecords(transformedRecords);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

4. Add data transformation helper:

```typescript
function combineKYCData(data: any): KYCRecord[] {
  // Combine individual KYC records
  const individualKYC = data.kyc.map((kyc: any) => {
    const user = data.users.find((u: any) => u.accountID === kyc.accountFK_id);
    const files = data.kyc_files.filter((f: any) => f.kycID_id === kyc.kycID);

    return {
      id: kyc.kycID.toString(),
      userId: user?.accountID || "",
      userName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      userEmail: user?.email || "",
      userType: user?.profileType === "WORKER" ? "worker" : "client",
      submissionDate: kyc.createdAt,
      status: kyc.kycStatus.toLowerCase(),
      documentsSubmitted: files.map((f: any) => ({
        name: f.fileName,
        type: f.idType,
        status: kyc.kycStatus.toLowerCase(),
      })),
      reviewedBy: kyc.reviewedBy_id ? "Admin" : undefined,
      reviewDate: kyc.reviewedAt || undefined,
      comments: kyc.notes || undefined,
    };
  });

  // Combine agency KYC records
  const agencyKYC = data.agency_kyc.map((kyc: any) => {
    const agency = data.agencies.find(
      (a: any) => a.accountID === kyc.accountFK_id
    );
    const files = data.agency_kyc_files.filter(
      (f: any) => f.agencyKyc_id === kyc.agencyKycID
    );

    return {
      id: `agency_${kyc.agencyKycID}`,
      userId: agency?.accountID || "",
      userName: agency?.businessName || "Unknown Agency",
      userEmail: agency?.email || "",
      userType: "agency",
      submissionDate: kyc.createdAt,
      status: kyc.status.toLowerCase(),
      documentsSubmitted: files.map((f: any) => ({
        name: f.fileName,
        type: f.fileType,
        status: kyc.status.toLowerCase(),
      })),
      reviewedBy: kyc.reviewedBy_id ? "Admin" : undefined,
      reviewDate: kyc.reviewedAt || undefined,
      comments: kyc.notes || undefined,
    };
  });

  return [...individualKYC, ...agencyKYC];
}
```

5. Add useEffect to fetch on mount:

```typescript
useEffect(() => {
  fetchKYCData();
}, []);
```

6. Update stats cards to use real data:

```typescript
<CardContent>
  <div className="text-2xl font-bold">
    {kycRecords.filter((r) => r.status === "pending").length}
  </div>
</CardContent>
```

**Prompt for AI Agent**:

```
Replace the mock KYC data in apps/frontend_web/app/admin/kyc/page.tsx with real API integration.

1. Remove the mockKYCRecords array (lines 48-85)
2. Add state management for kycRecords, loading, and error
3. Create fetchKYCData() function that calls /api/adminpanel/kyc/all
4. Add combineKYCData() helper to transform backend response into KYCRecord[]
5. Update all stats cards to calculate from real data instead of mock array
6. Add loading spinner while fetching
7. Add error state display if fetch fails
8. Ensure credentials: 'include' is in fetch options for cookie auth

The backend endpoint returns both individual KYC and agency KYC - combine them into a single array with userType field to distinguish.
```

---

### Task 1.2: Create KYC Detail Page with Document Viewer (5 hours)

**File**: `apps/frontend_web/app/admin/kyc/[id]/page.tsx` (NEW)

**Requirements**:

- Display user/agency information (name, email, submission date)
- Show all submitted documents with thumbnails
- Full-screen image viewer modal with zoom/pan controls
- Approve button (opens note input modal)
- Reject button (requires rejection reason input)
- Status badge showing current KYC status
- Back button to KYC list

**Component Structure**:

```typescript
export default function KYCDetailPage({ params }: { params: { id: string } }) {
  const [kycData, setKycData] = useState<KYCDetail | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch KYC data and generate signed URLs
  useEffect(() => {
    fetchKYCDetail();
  }, [params.id]);

  const fetchKYCDetail = async () => {
    // 1. Fetch all KYC data
    const response = await fetch('/api/adminpanel/kyc/all');
    const allData = await response.json();

    // 2. Find specific KYC record by ID
    const kycRecord = findKYCById(allData, params.id);
    setKycData(kycRecord);

    // 3. Get document URLs and generate signed URLs
    const docURLs = getDocumentURLs(kycRecord);
    const signedResponse = await fetch('/api/adminpanel/kyc/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docURLs),
      credentials: 'include',
    });
    const signedURLs = await signedResponse.json();
    setDocuments(transformToDocuments(signedURLs));
  };

  const handleApprove = async () => {
    const endpoint = kycData.userType === 'agency'
      ? '/api/adminpanel/kyc/approve-agency'
      : '/api/adminpanel/kyc/approve';

    const body = kycData.userType === 'agency'
      ? { agencyKycID: parseInt(kycData.id.replace('agency_', '')), notes }
      : { kycID: parseInt(kycData.id), notes };

    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (response.ok) {
      toast.success('KYC approved successfully');
      router.push('/admin/kyc');
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    const endpoint = kycData.userType === 'agency'
      ? '/api/adminpanel/kyc/reject-agency'
      : '/api/adminpanel/kyc/reject';

    const body = kycData.userType === 'agency'
      ? { agencyKycID: parseInt(kycData.id.replace('agency_', '')), notes }
      : { kycID: parseInt(kycData.id), notes };

    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (response.ok) {
      toast.success('KYC rejected');
      router.push('/admin/kyc');
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50">
        {/* User Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>KYC Verification - {kycData?.userName}</CardTitle>
                <p className="text-gray-600">{kycData?.userEmail}</p>
              </div>
              <StatusBadge status={kycData?.status} />
            </div>
          </CardHeader>
        </Card>

        {/* Documents Grid */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submitted Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <div key={doc.type} className="border rounded-lg p-4 cursor-pointer hover:shadow-lg"
                     onClick={() => setSelectedDoc(doc.url)}>
                  <img src={doc.url} alt={doc.type} className="w-full h-32 object-cover rounded" />
                  <p className="text-sm text-center mt-2">{doc.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {kycData?.status === 'pending' && (
          <div className="flex gap-4">
            <Button variant="destructive" onClick={() => setShowRejectModal(true)}>
              Reject KYC
            </Button>
            <Button variant="success" onClick={() => setShowApproveModal(true)}>
              Approve KYC
            </Button>
          </div>
        )}

        {/* Full-screen Image Viewer Modal */}
        {selectedDoc && (
          <ImageViewerModal url={selectedDoc} onClose={() => setSelectedDoc(null)} />
        )}

        {/* Approve Modal */}
        {showApproveModal && (
          <ApproveModal
            onConfirm={handleApprove}
            onCancel={() => setShowApproveModal(false)}
            notes={notes}
            setNotes={setNotes}
          />
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <RejectModal
            onConfirm={handleReject}
            onCancel={() => setShowRejectModal(false)}
            notes={notes}
            setNotes={setNotes}
          />
        )}
      </main>
    </div>
  );
}
```

**Prompt for AI Agent**:

```
Create a new file apps/frontend_web/app/admin/kyc/[id]/page.tsx for KYC detail view.

Requirements:
1. Fetch KYC data using /api/adminpanel/kyc/all and filter by params.id
2. Call /api/adminpanel/kyc/review with document URLs to get signed Supabase URLs
3. Display user info card with name, email, submission date, status badge
4. Show documents grid (2 columns mobile, 4 columns desktop) with thumbnails
5. Add click handler on thumbnails to open full-screen image viewer
6. Create ImageViewerModal component with zoom/pan controls (use react-zoom-pan-pinch or similar)
7. Add "Approve" button that opens modal with optional notes input
8. Add "Reject" button that requires rejection reason (mandatory)
9. Call correct endpoint based on userType (individual vs agency)
10. Show success toast and redirect to /admin/kyc after approval/rejection
11. Add loading state while fetching data
12. Handle errors gracefully

Individual KYC documents: ID Front, ID Back, Selfie, Barangay Clearance
Agency KYC documents: Business Permit, Rep ID Front, Rep ID Back, Address Proof, Auth Letter
```

---

### Task 1.3: Create Pending/Approved/Rejected Sub-pages (4 hours)

**Files**:

- `apps/frontend_web/app/admin/kyc/pending/page.tsx` (NEW)
- `apps/frontend_web/app/admin/kyc/approved/page.tsx` (NEW)
- `apps/frontend_web/app/admin/kyc/rejected/page.tsx` (NEW)

**Approach**: These are filtered views of the main KYC list

**Shared Component** (`apps/frontend_web/app/admin/kyc/components/KYCList.tsx`):

```typescript
interface KYCListProps {
  statusFilter: 'pending' | 'approved' | 'rejected';
  title: string;
  description: string;
}

export function KYCList({ statusFilter, title, description }: KYCListProps) {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);

  useEffect(() => {
    fetchFilteredKYC();
  }, [statusFilter, searchTerm, dateRange]);

  const fetchFilteredKYC = async () => {
    const response = await fetch('/api/adminpanel/kyc/all', {
      credentials: 'include',
    });
    const data = await response.json();
    const allRecords = combineKYCData(data);

    // Filter by status
    const filtered = allRecords.filter((r) => r.status === statusFilter);

    // Apply search filter
    const searched = filtered.filter((r) =>
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply date range filter
    // ... date filtering logic

    setRecords(searched);
    setLoading(false);
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
          </CardContent>
        </Card>

        {/* KYC Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>{records.length} Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.userName}</TableCell>
                    <TableCell>{record.userEmail}</TableCell>
                    <TableCell>
                      <Badge>{record.userType}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(record.submissionDate)}
                    </TableCell>
                    <TableCell>
                      {record.documentsSubmitted.length} files
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/kyc/${record.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

Then each page uses this component:

**`pending/page.tsx`**:

```typescript
export default function PendingKYCPage() {
  return (
    <KYCList
      statusFilter="pending"
      title="Pending KYC Verifications"
      description="Review and approve identity documents awaiting verification"
    />
  );
}
```

**Prompt for AI Agent**:

```
Create 3 new sub-pages for filtered KYC views: pending, approved, and rejected.

1. First, create shared component apps/frontend_web/app/admin/kyc/components/KYCList.tsx
   - Accept statusFilter prop ('pending' | 'approved' | 'rejected')
   - Fetch from /api/adminpanel/kyc/all and filter by status
   - Add search input (filters by name/email)
   - Add date range picker (filter by submission date)
   - Display results in table with columns: User, Email, Type, Submitted, Documents, Actions
   - Add "Review" button that links to /admin/kyc/[id]

2. Create apps/frontend_web/app/admin/kyc/pending/page.tsx
   - Use KYCList component with statusFilter="pending"
   - Title: "Pending KYC Verifications"
   - Description: "Review and approve identity documents awaiting verification"

3. Create apps/frontend_web/app/admin/kyc/approved/page.tsx
   - Use KYCList component with statusFilter="approved"
   - Title: "Approved KYC Verifications"
   - Description: "Successfully verified identity documents"

4. Create apps/frontend_web/app/admin/kyc/rejected/page.tsx
   - Use KYCList component with statusFilter="rejected"
   - Title: "Rejected KYC Verifications"
   - Description: "Identity documents that failed verification"

Ensure table is responsive with horizontal scroll on mobile.
```

---

### Task 1.4: Create KYC Audit Logs Page (3 hours)

**File**: `apps/frontend_web/app/admin/kyc/logs/page.tsx` (NEW)

**Requirements**:

- Display all KYC actions (approved, rejected) in chronological order
- Show who performed the action (admin user)
- Show timestamp of action
- Show notes/reason entered by admin
- Filter by action type (APPROVED / Rejected)
- Filter by date range
- Pagination (100 logs per page)

**Component Structure**:

```typescript
export default function KYCLogsPage() {
  const [logs, setLogs] = useState<KYCLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<'all' | 'APPROVED' | 'Rejected'>('all');
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  const fetchLogs = async () => {
    const params = new URLSearchParams({
      limit: '100',
      ...(actionFilter !== 'all' && { action: actionFilter }),
    });

    const response = await fetch(
      `http://localhost:8000/api/adminpanel/kyc/logs?${params}`,
      { credentials: 'include' }
    );

    const data = await response.json();
    if (data.success) {
      setLogs(data.logs);
      setTotalLogs(data.count);
    }
    setLoading(false);
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-2">KYC Audit Logs</h1>
        <p className="text-gray-600 mb-6">
          Complete history of all KYC verification actions
        </p>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold">{totalLogs}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Approvals</p>
                <p className="text-2xl font-bold text-green-600">
                  {logs.filter((l) => l.action === 'APPROVED').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rejections</p>
                <p className="text-2xl font-bold text-red-600">
                  {logs.filter((l) => l.action === 'Rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as any)}
                className="border rounded px-3 py-2"
              >
                <option value="all">All Actions</option>
                <option value="APPROVED">Approved Only</option>
                <option value="Rejected">Rejected Only</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Action History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.kycLogID} className="border-l-4 border-blue-500 pl-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          log.action === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }>
                          {log.action}
                        </Badge>
                        <span className="font-semibold">KYC #{log.kycID}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Performed by: Admin #{log.performedBy}
                      </p>
                      {log.notes && (
                        <p className="text-sm mt-2 bg-gray-50 p-2 rounded">
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatTimestamp(log.performedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

**Prompt for AI Agent**:

```
Create apps/frontend_web/app/admin/kyc/logs/page.tsx for KYC audit logs.

Requirements:
1. Fetch logs from /api/adminpanel/kyc/logs?action=&limit=100
2. Display stats card showing total actions, approvals, rejections
3. Add dropdown filter for action type (all/APPROVED/Rejected)
4. Display logs in timeline format with:
   - Border-left color indicator (green for approved, red for rejected)
   - Action badge showing APPROVED or Rejected
   - KYC ID reference
   - Performed by: Admin user ID
   - Admin notes/reason (if provided)
   - Timestamp (formatted as "Nov 24, 2025 3:45 PM")
5. Sort logs by timestamp (most recent first)
6. Add loading state
7. Handle empty state (no logs found)

Use vertical timeline design similar to activity feeds.
```

---

### Task 1.5: Update Sidebar Navigation (1 hour)

**File**: `apps/frontend_web/app/admin/components/sidebar.tsx`

**Changes**: Update KYC section to include new sub-pages

**Current KYC Navigation** (lines 107-125):

```typescript
{
  name: "KYC Management",
  href: "/admin/kyc",
  icon: Shield,
  count: 3,
  children: [
    {
      name: "Pending",
      href: "/admin/kyc/pending",
      icon: Clock,
      description: "Awaiting verification",
    },
    {
      name: "Approved",
      href: "/admin/kyc/approved",
      icon: CheckCircle,
      description: "Verified accounts",
    },
    {
      name: "Rejected",
      href: "/admin/kyc/rejected",
      icon: XCircle,
      description: "Failed verification",
    },
  ],
},
```

**Add Logs Sub-page**:

```typescript
{
  name: "KYC Management",
  href: "/admin/kyc",
  icon: Shield,
  count: 3, // TODO: Fetch real pending count from API
  children: [
    {
      name: "Pending",
      href: "/admin/kyc/pending",
      icon: Clock,
      description: "Awaiting verification",
    },
    {
      name: "Approved",
      href: "/admin/kyc/approved",
      icon: CheckCircle,
      description: "Verified accounts",
    },
    {
      name: "Rejected",
      href: "/admin/kyc/rejected",
      icon: XCircle,
      description: "Failed verification",
    },
    {
      name: "Audit Logs",
      href: "/admin/kyc/logs",
      icon: FileText,
      description: "Action history",
    },
  ],
},
```

**Prompt for AI Agent**:

```
Update apps/frontend_web/app/admin/components/sidebar.tsx to add "Audit Logs" sub-page to KYC Management section.

Add this child to the KYC Management children array (around line 125):
{
  name: "Audit Logs",
  href: "/admin/kyc/logs",
  icon: FileText,
  description: "Action history",
}

Ensure FileText icon is imported from lucide-react.
```

---

### Task 1.6: Add Real-time Pending Count to Sidebar (2 hours)

**File**: `apps/frontend_web/app/admin/components/sidebar.tsx`

**Enhancement**: Fetch real pending KYC count and display in sidebar badge

**Implementation**:

```typescript
export default function Sidebar({ className }: SidebarProps) {
  const [pendingKYCCount, setPendingKYCCount] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingKYCCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchPendingKYCCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingKYCCount = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/adminpanel/kyc/all",
        {
          credentials: "include",
        }
      );
      const data = await response.json();

      const pendingIndividual = data.kyc.filter(
        (k: any) => k.kycStatus === "PENDING"
      ).length;

      const pendingAgency = data.agency_kyc.filter(
        (k: any) => k.status === "PENDING"
      ).length;

      setPendingKYCCount(pendingIndividual + pendingAgency);
    } catch (error) {
      console.error("Failed to fetch pending KYC count:", error);
    }
  };

  // Update navigation array to use state
  const navigation: NavItem[] = [
    // ... other items
    {
      name: "KYC Management",
      href: "/admin/kyc",
      icon: Shield,
      count: pendingKYCCount, // Use state instead of hardcoded 3
      children: [
        // ... children
      ],
    },
    // ... other items
  ];

  // ... rest of component
}
```

**Prompt for AI Agent**:

```
Update apps/frontend_web/app/admin/components/sidebar.tsx to fetch real pending KYC count.

Requirements:
1. Add state: const [pendingKYCCount, setPendingKYCCount] = useState<number | null>(null);
2. Create fetchPendingKYCCount() function that:
   - Calls /api/adminpanel/kyc/all
   - Counts kyc records where kycStatus === 'PENDING'
   - Counts agency_kyc records where status === 'PENDING'
   - Sets total count to state
3. Add useEffect to fetch on mount and every 60 seconds
4. Update KYC Management item to use pendingKYCCount instead of hardcoded count: 3

This will show real-time pending KYC count in sidebar badge.
```

---

## Testing Checklist

After completing all tasks, verify:

- [ ] Main KYC page displays real data from API (no mock data)
- [ ] Stats cards calculate correct counts (pending/approved/rejected)
- [ ] Pending/Approved/Rejected sub-pages filter correctly
- [ ] Search by name/email works on filtered pages
- [ ] KYC detail page opens for individual and agency records
- [ ] Document images load with signed Supabase URLs
- [ ] Image viewer modal opens and displays documents full-screen
- [ ] Zoom/pan controls work in image viewer
- [ ] Approve button opens confirmation modal with optional notes
- [ ] Reject button requires rejection reason (validation)
- [ ] Approve action calls correct endpoint (individual vs agency)
- [ ] Reject action calls correct endpoint (individual vs agency)
- [ ] Success toast displays after approve/reject
- [ ] Page redirects to /admin/kyc after action
- [ ] Audit logs page displays all actions chronologically
- [ ] Logs filter by action type works
- [ ] Sidebar shows real pending count (not hardcoded 3)
- [ ] Pending count updates every 60 seconds
- [ ] No TypeScript compilation errors
- [ ] No console errors during normal operation
- [ ] Mobile responsive design works on small screens

## Success Criteria

Module 1 is complete when:

1. ✅ All 6 pages implemented and functional
2. ✅ Real API integration (zero mock data)
3. ✅ Document viewer with zoom/pan works
4. ✅ Approve/reject workflow tested end-to-end
5. ✅ Audit logs display action history
6. ✅ Sidebar shows real-time pending count
7. ✅ TypeScript compiles without errors
8. ✅ All 21 testing checklist items pass

## Next Steps

After Module 1 completion:

1. Update `AGENTS.md` with completed KYC features
2. Test KYC workflow with real user submissions
3. Proceed to Module 2 (User Management)

---

**Last Updated**: January 2025  
**Status**: Ready for implementation  
**Assigned Priority**: CRITICAL (Start first)
