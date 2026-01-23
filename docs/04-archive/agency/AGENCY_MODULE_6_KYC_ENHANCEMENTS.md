# Agency Module 6: KYC Resubmission & Enhanced Verification

**Status**: 📋 PLANNED  
**Priority**: MEDIUM  
**Estimated Time**: 6-8 hours  
**Dependencies**: Existing KYC system

---

## Module Overview

Enhanced KYC management system allowing agencies to view rejection reasons, resubmit specific documents without full resubmission, track submission history, and implement resubmission limits to prevent abuse.

### Scope

- Display admin rejection reasons
- Single document replacement (without full resubmit)
- Resubmission counter (max 3 attempts)
- KYC submission history timeline
- Document preview functionality
- Structured rejection categories
- Admin workflow improvements
- Status tracking enhancements

---

## Current State Analysis

### ✅ What Exists

**Agency KYC Page** (`apps/frontend_web/app/agency/kyc/page.tsx` - partial):

- Basic KYC status display
- Document upload functionality
- Simple approval/rejection display
- No rejection reason display
- No resubmission tracking

**Backend KYC Upload** (`apps/backend/src/agency/api.py`):

```python
@router.post("/upload", auth=cookie_auth)
def upload_agency_kyc(request, ...):
    # Upload to Supabase
    # Create AgencyKYC record
    # Status defaults to PENDING
```

**AgencyKYC Model** (`apps/backend/src/agency/models.py`):

```python
class AgencyKYC(models.Model):
    agencyFK = models.ForeignKey(Agency)
    businessPermit = models.CharField(max_length=500)
    governmentID = models.CharField(max_length=500)
    proofOfAddress = models.CharField(max_length=500)
    kycStatus = models.CharField(
        choices=[
            ('NOT_SUBMITTED', 'Not Submitted'),
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected')
        ]
    )
    submittedAt = models.DateTimeField(auto_now_add=True)
    # MISSING: rejectionReason, resubmissionCount, reviewedAt, reviewedBy
```

### ❌ What's Missing

1. **No rejection reason field** - agencies don't know why KYC rejected
2. **No resubmission counter** - unlimited attempts possible
3. **No single document replacement** - must resubmit all 3 documents
4. **No KYC history** - can't see past submissions
5. **No structured rejection categories** - freeform text only
6. **No document preview** - can't view currently submitted documents
7. **No resubmission API** - uses same upload endpoint

---

## Implementation

### Task 1: Database Migration ⏰ 1 hour

**Create Migration**: `0004_enhanced_kyc_tracking.py`

```python
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('agency', '0003_agencyemployee_performance_tracking'),
    ]

    operations = [
        # Add rejection tracking
        migrations.AddField(
            model_name='agencykyc',
            name='rejectionReason',
            field=models.TextField(
                null=True,
                blank=True,
                help_text='Reason for rejection from admin'
            ),
        ),

        migrations.AddField(
            model_name='agencykyc',
            name='rejectionCategory',
            field=models.CharField(
                max_length=50,
                null=True,
                blank=True,
                choices=[
                    ('DOCUMENT_UNCLEAR', 'Document Unclear/Unreadable'),
                    ('MISSING_INFO', 'Missing Required Information'),
                    ('EXPIRED', 'Document Expired'),
                    ('FRAUDULENT', 'Suspected Fraudulent Document'),
                    ('MISMATCH', 'Information Mismatch'),
                    ('OTHER', 'Other Reason')
                ],
                help_text='Category of rejection'
            ),
        ),

        # Add resubmission tracking
        migrations.AddField(
            model_name='agencykyc',
            name='resubmissionCount',
            field=models.IntegerField(
                default=0,
                help_text='Number of times resubmitted'
            ),
        ),

        migrations.AddField(
            model_name='agencykyc',
            name='maxResubmissions',
            field=models.IntegerField(
                default=3,
                help_text='Maximum resubmission attempts allowed'
            ),
        ),

        # Add review tracking
        migrations.AddField(
            model_name='agencykyc',
            name='reviewedAt',
            field=models.DateTimeField(
                null=True,
                blank=True,
                help_text='When admin reviewed the KYC'
            ),
        ),

        migrations.AddField(
            model_name='agencykyc',
            name='reviewedBy',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=models.SET_NULL,
                related_name='reviewed_agency_kycs',
                to='accounts.accounts',
                help_text='Admin who reviewed the KYC'
            ),
        ),

        # Add document-specific rejection flags
        migrations.AddField(
            model_name='agencykyc',
            name='businessPermitRejected',
            field=models.BooleanField(
                default=False,
                help_text='Business permit rejected'
            ),
        ),

        migrations.AddField(
            model_name='agencykyc',
            name='governmentIDRejected',
            field=models.BooleanField(
                default=False,
                help_text='Government ID rejected'
            ),
        ),

        migrations.AddField(
            model_name='agencykyc',
            name='proofOfAddressRejected',
            field=models.BooleanField(
                default=False,
                help_text='Proof of address rejected'
            ),
        ),

        # Add indexes for performance
        migrations.AddIndex(
            model_name='agencykyc',
            index=models.Index(
                fields=['kycStatus', 'submittedAt'],
                name='kyc_status_submitted_idx'
            ),
        ),
    ]
```

---

### Task 2: KYC History Model ⏰ 30 minutes

**File**: `apps/backend/src/agency/models.py` (ADD)

```python
class AgencyKYCHistory(models.Model):
    """Track all KYC submissions for audit trail"""
    historyID = models.AutoField(primary_key=True)
    agencyFK = models.ForeignKey(
        Agency,
        on_delete=models.CASCADE,
        related_name='kyc_history'
    )
    submissionType = models.CharField(
        max_length=20,
        choices=[
            ('INITIAL', 'Initial Submission'),
            ('RESUBMISSION', 'Resubmission'),
            ('DOCUMENT_UPDATE', 'Single Document Update')
        ]
    )
    businessPermit = models.CharField(max_length=500, null=True, blank=True)
    governmentID = models.CharField(max_length=500, null=True, blank=True)
    proofOfAddress = models.CharField(max_length=500, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected')
        ]
    )
    rejectionReason = models.TextField(null=True, blank=True)
    rejectionCategory = models.CharField(max_length=50, null=True, blank=True)
    submittedAt = models.DateTimeField(auto_now_add=True)
    reviewedAt = models.DateTimeField(null=True, blank=True)
    reviewedBy = models.ForeignKey(
        'accounts.accounts',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_kyc_history'
    )

    class Meta:
        db_table = 'agency_kyc_history'
        ordering = ['-submittedAt']
        indexes = [
            models.Index(fields=['agencyFK', '-submittedAt'])
        ]
```

---

### Task 3: Resubmission API Endpoints ⏰ 2 hours

**File**: `apps/backend/src/agency/api.py` (ADD)

```python
@router.post("/kyc/resubmit", auth=cookie_auth)
def resubmit_agency_kyc(
    request,
    business_permit: UploadedFile = File(None),
    government_id: UploadedFile = File(None),
    proof_of_address: UploadedFile = File(None)
):
    """
    Resubmit specific KYC documents (partial or full)

    POST /api/agency/kyc/resubmit
    Body (multipart/form-data):
        - business_permit (optional): File
        - government_id (optional): File
        - proof_of_address (optional): File
    """
    try:
        agency = Agency.objects.get(accountFK=request.auth)
    except Agency.DoesNotExist:
        return Response({'error': 'Agency not found'}, status=404)

    try:
        kyc = AgencyKYC.objects.get(agencyFK=agency)
    except AgencyKYC.DoesNotExist:
        return Response({'error': 'No KYC record found. Please submit initial KYC first.'}, status=404)

    # Check resubmission limit
    if kyc.resubmissionCount >= kyc.maxResubmissions:
        return Response({
            'error': f'Maximum resubmission attempts ({kyc.maxResubmissions}) reached. Please contact support.'
        }, status=400)

    # Check if KYC is rejected (can only resubmit rejected KYC)
    if kyc.kycStatus != 'REJECTED':
        return Response({
            'error': 'Can only resubmit rejected KYC. Current status: ' + kyc.kycStatus
        }, status=400)

    # At least one document must be provided
    if not any([business_permit, government_id, proof_of_address]):
        return Response({'error': 'At least one document must be provided'}, status=400)

    # Upload new documents to Supabase (only if provided)
    supabase_client = get_supabase_client()

    if business_permit:
        file_name = f"agency_{agency.agencyID}_business_permit_{int(time.time())}.{business_permit.name.split('.')[-1]}"
        upload_result = supabase_client.storage.from_('kyc-documents').upload(
            file_name,
            business_permit.read(),
            {'content-type': business_permit.content_type}
        )
        if upload_result:
            kyc.businessPermit = f"{SUPABASE_URL}/storage/v1/object/public/kyc-documents/{file_name}"
            kyc.businessPermitRejected = False

    if government_id:
        file_name = f"agency_{agency.agencyID}_gov_id_{int(time.time())}.{government_id.name.split('.')[-1]}"
        upload_result = supabase_client.storage.from_('kyc-documents').upload(
            file_name,
            government_id.read(),
            {'content-type': government_id.content_type}
        )
        if upload_result:
            kyc.governmentID = f"{SUPABASE_URL}/storage/v1/object/public/kyc-documents/{file_name}"
            kyc.governmentIDRejected = False

    if proof_of_address:
        file_name = f"agency_{agency.agencyID}_proof_of_address_{int(time.time())}.{proof_of_address.name.split('.')[-1]}"
        upload_result = supabase_client.storage.from_('kyc-documents').upload(
            file_name,
            proof_of_address.read(),
            {'content-type': proof_of_address.content_type}
        )
        if upload_result:
            kyc.proofOfAddress = f"{SUPABASE_URL}/storage/v1/object/public/kyc-documents/{file_name}"
            kyc.proofOfAddressRejected = False

    # Update KYC status
    kyc.kycStatus = 'PENDING'
    kyc.resubmissionCount += 1
    kyc.submittedAt = timezone.now()
    kyc.rejectionReason = None  # Clear previous rejection
    kyc.rejectionCategory = None
    kyc.save()

    # Create history entry
    AgencyKYCHistory.objects.create(
        agencyFK=agency,
        submissionType='RESUBMISSION' if all([business_permit, government_id, proof_of_address]) else 'DOCUMENT_UPDATE',
        businessPermit=kyc.businessPermit if business_permit else None,
        governmentID=kyc.governmentID if government_id else None,
        proofOfAddress=kyc.proofOfAddress if proof_of_address else None,
        status='PENDING'
    )

    # Notify admins
    create_admin_notification(
        title=f'Agency KYC Resubmission',
        message=f'{agency.businessName} has resubmitted KYC documents (Attempt {kyc.resubmissionCount}/{kyc.maxResubmissions})'
    )

    return Response({
        'success': True,
        'message': 'KYC documents resubmitted successfully',
        'resubmission_count': kyc.resubmissionCount,
        'remaining_attempts': kyc.maxResubmissions - kyc.resubmissionCount
    })


@router.get("/kyc/status", auth=cookie_auth)
def get_kyc_status_detailed(request):
    """
    Get detailed KYC status including rejection info

    GET /api/agency/kyc/status
    """
    try:
        agency = Agency.objects.get(accountFK=request.auth)
    except Agency.DoesNotExist:
        return Response({'error': 'Agency not found'}, status=404)

    try:
        kyc = AgencyKYC.objects.select_related('reviewedBy').get(agencyFK=agency)
    except AgencyKYC.DoesNotExist:
        return Response({
            'success': True,
            'status': 'NOT_SUBMITTED',
            'kyc': None
        })

    return Response({
        'success': True,
        'status': kyc.kycStatus,
        'kyc': {
            'business_permit': kyc.businessPermit,
            'government_id': kyc.governmentID,
            'proof_of_address': kyc.proofOfAddress,
            'submitted_at': kyc.submittedAt.isoformat(),
            'reviewed_at': kyc.reviewedAt.isoformat() if kyc.reviewedAt else None,
            'reviewed_by': kyc.reviewedBy.email if kyc.reviewedBy else None,
            'rejection_reason': kyc.rejectionReason,
            'rejection_category': kyc.rejectionCategory,
            'rejected_documents': {
                'business_permit': kyc.businessPermitRejected,
                'government_id': kyc.governmentIDRejected,
                'proof_of_address': kyc.proofOfAddressRejected
            },
            'resubmission_count': kyc.resubmissionCount,
            'max_resubmissions': kyc.maxResubmissions,
            'remaining_attempts': kyc.maxResubmissions - kyc.resubmissionCount
        }
    })


@router.get("/kyc/history", auth=cookie_auth)
def get_kyc_history(request):
    """
    Get KYC submission history

    GET /api/agency/kyc/history
    """
    try:
        agency = Agency.objects.get(accountFK=request.auth)
    except Agency.DoesNotExist:
        return Response({'error': 'Agency not found'}, status=404)

    history = AgencyKYCHistory.objects.filter(
        agencyFK=agency
    ).select_related('reviewedBy').order_by('-submittedAt')

    results = []
    for entry in history:
        results.append({
            'id': entry.historyID,
            'submission_type': entry.submissionType,
            'status': entry.status,
            'submitted_at': entry.submittedAt.isoformat(),
            'reviewed_at': entry.reviewedAt.isoformat() if entry.reviewedAt else None,
            'reviewed_by': entry.reviewedBy.email if entry.reviewedBy else None,
            'rejection_reason': entry.rejectionReason,
            'rejection_category': entry.rejectionCategory,
            'documents': {
                'business_permit': entry.businessPermit,
                'government_id': entry.governmentID,
                'proof_of_address': entry.proofOfAddress
            }
        })

    return Response({
        'success': True,
        'history': results,
        'total': history.count()
    })
```

---

### Task 4: Enhanced KYC Page ⏰ 3 hours

**File**: `apps/frontend_web/app/agency/kyc/page.tsx` (REWRITE)

```typescript
"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Upload,
  Eye,
  XCircle,
  RefreshCw,
} from 'lucide-react';

interface KYCStatus {
  status: string;
  kyc: {
    business_permit: string;
    government_id: string;
    proof_of_address: string;
    submitted_at: string;
    reviewed_at: string | null;
    reviewed_by: string | null;
    rejection_reason: string | null;
    rejection_category: string | null;
    rejected_documents: {
      business_permit: boolean;
      government_id: boolean;
      proof_of_address: boolean;
    };
    resubmission_count: number;
    max_resubmissions: number;
    remaining_attempts: number;
  } | null;
}

export default function AgencyKYCPage() {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<{
    business_permit?: File;
    government_id?: File;
    proof_of_address?: File;
  }>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery<KYCStatus>({
    queryKey: ['agency-kyc-status'],
    queryFn: async () => {
      const response = await fetch('/api/agency/kyc/status', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch KYC status');
      return response.json();
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async (files: FormData) => {
      const response = await fetch('/api/agency/kyc/resubmit', {
        method: 'POST',
        credentials: 'include',
        body: files,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resubmit KYC');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-kyc-status'] });
      setSelectedFiles({});
      alert('KYC documents resubmitted successfully!');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleFileSelect = (documentType: string, file: File | null) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [documentType]: file || undefined,
    }));
  };

  const handleResubmit = () => {
    if (Object.keys(selectedFiles).length === 0) {
      alert('Please select at least one document to resubmit');
      return;
    }

    const formData = new FormData();
    if (selectedFiles.business_permit) {
      formData.append('business_permit', selectedFiles.business_permit);
    }
    if (selectedFiles.government_id) {
      formData.append('government_id', selectedFiles.government_id);
    }
    if (selectedFiles.proof_of_address) {
      formData.append('proof_of_address', selectedFiles.proof_of_address);
    }

    resubmitMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      NOT_SUBMITTED: {
        color: 'bg-gray-100 text-gray-800',
        icon: Clock,
        label: 'Not Submitted',
      },
      PENDING: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        label: 'Pending Review',
      },
      APPROVED: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        label: 'Approved',
      },
      REJECTED: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        label: 'Rejected',
      },
    };

    const badge = badges[status as keyof typeof badges];
    if (!badge) return null;

    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon size={16} />
        {badge.label}
      </span>
    );
  };

  const rejectionCategories: { [key: string]: string } = {
    DOCUMENT_UNCLEAR: 'Document Unclear/Unreadable',
    MISSING_INFO: 'Missing Required Information',
    EXPIRED: 'Document Expired',
    FRAUDULENT: 'Suspected Fraudulent Document',
    MISMATCH: 'Information Mismatch',
    OTHER: 'Other Reason',
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-32 rounded-lg" />
          <div className="bg-gray-200 h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  const kyc = data?.kyc;
  const status = data?.status || 'NOT_SUBMITTED';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-600">Manage your business verification documents</p>
        </div>
        {getStatusBadge(status)}
      </div>

      {/* Rejection Alert */}
      {status === 'REJECTED' && kyc && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                KYC Verification Rejected
              </h3>
              {kyc.rejection_category && (
                <p className="text-red-800 font-medium mb-2">
                  Reason: {rejectionCategories[kyc.rejection_category] || kyc.rejection_category}
                </p>
              )}
              {kyc.rejection_reason && (
                <p className="text-red-700 mb-4 italic">
                  "{kyc.rejection_reason}"
                </p>
              )}
              <div className="bg-white border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Rejected Documents:
                </p>
                <ul className="space-y-1 text-sm text-gray-700">
                  {kyc.rejected_documents.business_permit && (
                    <li>• Business Permit ❌</li>
                  )}
                  {kyc.rejected_documents.government_id && (
                    <li>• Government ID ❌</li>
                  )}
                  {kyc.rejected_documents.proof_of_address && (
                    <li>• Proof of Address ❌</li>
                  )}
                </ul>
              </div>
              <p className="text-sm text-red-700">
                <span className="font-medium">Resubmission attempts:</span>{' '}
                {kyc.resubmission_count} / {kyc.max_resubmissions} used
                {kyc.remaining_attempts > 0 && (
                  <span className="ml-2">
                    ({kyc.remaining_attempts} remaining)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Documents */}
      {kyc && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Business Permit', url: kyc.business_permit, key: 'business_permit' },
              { label: 'Government ID', url: kyc.government_id, key: 'government_id' },
              { label: 'Proof of Address', url: kyc.proof_of_address, key: 'proof_of_address' },
            ].map((doc) => (
              <div
                key={doc.key}
                className={`border rounded-lg p-4 ${
                  kyc.rejected_documents[doc.key as keyof typeof kyc.rejected_documents]
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{doc.label}</h3>
                  {kyc.rejected_documents[doc.key as keyof typeof kyc.rejected_documents] && (
                    <XCircle className="text-red-600" size={20} />
                  )}
                </div>
                <button
                  onClick={() => setPreviewUrl(doc.url)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Eye size={14} />
                  View Document
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resubmission Form (only if rejected) */}
      {status === 'REJECTED' && kyc && kyc.remaining_attempts > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Resubmit Documents
          </h2>
          <p className="text-gray-600 mb-6">
            Upload replacement documents for rejected items. You don't need to resubmit all documents, only the ones that were rejected.
          </p>

          <div className="space-y-4">
            {kyc.rejected_documents.business_permit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Permit (Rejected) *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('business_permit', e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>
            )}
            {kyc.rejected_documents.government_id && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Government ID (Rejected) *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('government_id', e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>
            )}
            {kyc.rejected_documents.proof_of_address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof of Address (Rejected) *
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileSelect('proof_of_address', e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleResubmit}
            disabled={resubmitMutation.isPending || Object.keys(selectedFiles).length === 0}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {resubmitMutation.isPending ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Submitting...
              </>
            ) : (
              <>
                <Upload size={20} />
                Resubmit Documents
              </>
            )}
          </button>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="max-w-4xl w-full bg-white rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Document Preview</h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            {previewUrl.endsWith('.pdf') ? (
              <iframe src={previewUrl} className="w-full h-[600px]" />
            ) : (
              <img src={previewUrl} alt="Document" className="w-full h-auto" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 5: Admin KYC Review Enhancement ⏰ 1 hour

**File**: `apps/backend/src/adminpanel/api.py` (MODIFY)

Update KYC rejection endpoint to include category and document-specific flags:

```python
@router.post("/kyc/review/{kyc_id}", auth=cookie_auth)
def review_agency_kyc(request, kyc_id: int, payload: ReviewKYCSchema):
    """
    Admin review KYC with enhanced rejection tracking

    POST /api/adminpanel/kyc/review/{kyc_id}
    Body: {
        "action": "approve" | "reject",
        "rejection_reason": "string",
        "rejection_category": "DOCUMENT_UNCLEAR",
        "rejected_documents": {
            "business_permit": true,
            "government_id": false,
            "proof_of_address": true
        }
    }
    """
    if not hasattr(request.auth, 'is_staff') or not request.auth.is_staff:
        return Response({'error': 'Admin access required'}, status=403)

    try:
        kyc = AgencyKYC.objects.select_related('agencyFK').get(kycID=kyc_id)
    except AgencyKYC.DoesNotExist:
        return Response({'error': 'KYC not found'}, status=404)

    action = payload.action

    if action == 'approve':
        kyc.kycStatus = 'APPROVED'
        kyc.rejectionReason = None
        kyc.rejectionCategory = None
    elif action == 'reject':
        kyc.kycStatus = 'REJECTED'
        kyc.rejectionReason = payload.rejection_reason
        kyc.rejectionCategory = payload.rejection_category

        # Set document-specific rejection flags
        if payload.rejected_documents:
            kyc.businessPermitRejected = payload.rejected_documents.get('business_permit', False)
            kyc.governmentIDRejected = payload.rejected_documents.get('government_id', False)
            kyc.proofOfAddressRejected = payload.rejected_documents.get('proof_of_address', False)

    kyc.reviewedAt = timezone.now()
    kyc.reviewedBy = request.auth
    kyc.save()

    # Update history
    history_entry = AgencyKYCHistory.objects.filter(
        agencyFK=kyc.agencyFK
    ).order_by('-submittedAt').first()

    if history_entry:
        history_entry.status = kyc.kycStatus
        history_entry.rejectionReason = kyc.rejectionReason
        history_entry.rejectionCategory = kyc.rejectionCategory
        history_entry.reviewedAt = kyc.reviewedAt
        history_entry.reviewedBy = request.auth
        history_entry.save()

    # Notify agency
    create_notification(
        kyc.agencyFK.accountFK,
        f'KYC {action}ed',
        f'Your KYC submission has been {action}ed by admin'
    )

    return Response({
        'success': True,
        'action': action,
        'kyc_status': kyc.kycStatus
    })


class ReviewKYCSchema(Schema):
    action: str
    rejection_reason: str = None
    rejection_category: str = None
    rejected_documents: dict = None
```

---

## Testing Checklist

### Backend Tests

- [ ] Migration runs successfully
- [ ] AgencyKYC has new rejection fields
- [ ] AgencyKYCHistory model works
- [ ] Resubmission API checks limit
- [ ] Resubmission API updates counter
- [ ] Resubmission API creates history entry
- [ ] Status API returns rejection details
- [ ] History API returns all submissions
- [ ] Admin review updates document flags

### Frontend Tests

- [ ] KYC page displays status badge
- [ ] Rejection alert displays
- [ ] Rejection reason shows
- [ ] Rejected documents highlighted
- [ ] Resubmission counter displays
- [ ] File upload works
- [ ] Resubmit button disabled when no files
- [ ] Resubmit success updates UI
- [ ] Document preview opens
- [ ] Document preview closes
- [ ] Resubmission limit blocks form

---

## Success Criteria

✅ Module 6 complete when:

1. Migration applied successfully
2. Rejection reasons displaying
3. Resubmission counter working
4. Single document replacement functional
5. KYC history tracking operational
6. Document preview working
7. Resubmission limits enforced
8. Admin review enhanced
9. All tests passing
10. Zero errors

---

## All 6 Modules Complete! 🎉

**Total Implementation Time**: 49-66 hours

**Module Summary**:

1. ✅ Employee Assignment (8-12h) - CRITICAL BLOCKER
2. ✅ Chat Messaging (15-18h) - Real-time communication
3. ✅ Analytics Dashboard (6-8h) - Performance metrics
4. ✅ Job Lifecycle (10-12h) - Mobile workflow integration
5. ✅ Admin Integration (4-6h) - Replace mock data
6. ✅ KYC Enhancements (6-8h) - Resubmission workflow

**Implementation Order**:

1. Module 1 (Assignment) - Must complete first
2. Modules 2, 3, 5 - Can be done in parallel
3. Module 4 (Lifecycle) - After Module 1
4. Module 6 (KYC) - Anytime

**Ready for Development** ✅
