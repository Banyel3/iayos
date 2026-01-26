from .models import AgencyKYC, AgencyKycFile, AgencyEmployee
from accounts.models import Accounts, Agency as AgencyProfile, Profile, Job, Notification, JobReview
from iayos_project.utils import upload_agency_doc
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
import uuid
import os
import math

# Import AI verification service
from accounts.document_verification_service import (
	DocumentVerificationService,
	VerificationStatus,
	RejectionReason
)


def upload_agency_kyc(payload, business_permit, rep_front, rep_back, address_proof, auth_letter):
	"""
	Handle file uploads for agency KYC submissions with AI verification.
	
	Uses DocumentVerificationService for:
	- Image quality checks (resolution, blur)
	- Face detection on representative ID (front/back)
	- OCR text extraction on business permit
	- Auto-rejection for documents that fail validation
	
	Note: No face matching (selfie) required for agency KYC - just face detection on rep ID.
	"""
	try:
		print(f"🔍 Starting Agency KYC upload for accountID: {payload.accountID}")
		user = Accounts.objects.get(accountID=payload.accountID)

		files_map = {
			'BUSINESS_PERMIT': business_permit,
			'REP_ID_FRONT': rep_front,
			'REP_ID_BACK': rep_back,
			'ADDRESS_PROOF': address_proof,
			'AUTH_LETTER': auth_letter,
		}
		
		# Log which files were received
		received_files = [key for key, file in files_map.items() if file]
		print(f"📎 Files received: {', '.join(received_files) if received_files else 'NONE'}")

		allowed_mime_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
		max_size = 15 * 1024 * 1024  # 15 MB (frontend allowed)

		# Get or create AgencyKYC
		kyc_record, created = AgencyKYC.objects.get_or_create(
			accountFK=user,
			defaults={'status': 'PENDING', 'notes': ''}
		)

		if not created:
			# Remove previous files and reset status
			old_files_count = AgencyKycFile.objects.filter(agencyKyc=kyc_record).count()
			AgencyKycFile.objects.filter(agencyKyc=kyc_record).delete()
			kyc_record.status = 'PENDING'
			kyc_record.notes = 'Re-submitted'
			kyc_record.resubmissionCount = kyc_record.resubmissionCount + 1
			kyc_record.save()
			print(f"♻️ KYC status reset to PENDING (resubmission #{kyc_record.resubmissionCount}), deleted {old_files_count} old files")

		uploaded_files = []
		verification_results = []
		any_failed = False
		failure_messages = []
		
		# Initialize AI verification service
		verification_service = DocumentVerificationService()
		
		# Define which documents require face detection
		# REP_ID_FRONT and REP_ID_BACK require face detection (representative ID)
		face_required_docs = ['REP_ID_FRONT', 'REP_ID_BACK']
		
		# Define which documents require OCR keyword validation
		# BUSINESS_PERMIT requires OCR to extract and validate business keywords
		ocr_required_docs = ['BUSINESS_PERMIT']

		for key, file in files_map.items():
			if not file:
				continue

			if file.content_type not in allowed_mime_types:
				raise ValueError(f"{key}: Invalid file type. Allowed: JPEG, PNG, PDF")

			if file.size > max_size:
				raise ValueError(f"{key}: File too large. Maximum size is 15MB")

			ext = os.path.splitext(file.name)[1]
			unique_name = f"{key.lower()}_{uuid.uuid4().hex}{ext}"
			
			print(f"📤 Uploading {key}: filename={unique_name}, size={file.size} bytes")
			
			# Read file data for AI verification (before upload)
			file_data = file.read()
			file.seek(0)  # Reset file pointer for Supabase upload
			
			# Upload to Supabase
			file_url = upload_agency_doc(file=file, file_name=unique_name, user_id=user.accountID)
			
			if not file_url:
				print(f"❌ CRITICAL: File upload failed for {key}! No URL returned from Supabase.")
				raise ValueError(f"Failed to upload {key} to storage. Please try again.")
			
			print(f"✅ Upload successful for {key}: {file_url}")
			
			# ==========================
			# AI VERIFICATION PIPELINE
			# ==========================
			ai_status = 'PENDING'
			ai_rejection_reason = None
			ai_rejection_message = None
			face_detected = None
			face_count = None
			face_confidence = None
			ocr_text = None
			ocr_confidence = None
			quality_score = None
			ai_confidence_score = None
			ai_warnings = []
			ai_details = {}
			verified_at = None
			
			# Skip AI verification for PDFs (can't do image analysis)
			is_pdf = file.content_type == 'application/pdf'
			
			if not is_pdf:
				print(f"🤖 Running AI verification for {key}...")
				
				# Get rep_id_type for type-specific OCR (unified naming from mobile app)
				# This enables using PHILSYS_ID, DRIVERS_LICENSE, etc. for proper keyword validation
				rep_id_type = getattr(payload, 'rep_id_type', 'FRONTID') or 'FRONTID'
				
				# Map agency document types to verification service document types
				# Use actual ID type for REP_ID_FRONT to enable type-specific OCR keywords
				doc_type_mapping = {
					'BUSINESS_PERMIT': 'BUSINESS_PERMIT',
					'REP_ID_FRONT': rep_id_type.upper(),  # Use actual ID type for OCR keywords
					'REP_ID_BACK': 'BACKID',    # Map to BACKID (no type-specific keywords needed)
					'ADDRESS_PROOF': 'ADDRESS_PROOF',
					'AUTH_LETTER': 'AUTH_LETTER',
				}
				verification_doc_type = doc_type_mapping.get(key, key)
				
				print(f"   🔍 Using verification doc type: {verification_doc_type} (rep_id_type={rep_id_type})")
				
				# Run full verification
				verification_result = verification_service.verify_document(
					file_data=file_data,
					document_type=verification_doc_type,
					file_name=unique_name
				)
				
				# Extract verification results
				ai_status = verification_result.status.value
				quality_score = verification_result.quality_score
				ai_confidence_score = verification_result.confidence_score
				ai_warnings = verification_result.warnings or []
				ai_details = verification_result.details or {}
				verified_at = timezone.now()
				
				# Face detection results (for rep ID)
				if key in face_required_docs:
					face_detected = verification_result.face_detected
					face_count = verification_result.face_count
					face_confidence = ai_details.get('face_detection', {}).get('confidence', 0)
					
					# Check if face detection failed (required for rep ID)
					if not face_detected:
						ai_status = 'FAILED'
						ai_rejection_reason = 'NO_FACE_DETECTED'
						ai_rejection_message = f"No face detected in {key.replace('_', ' ').title()}. Please upload a clear photo of your ID with your face visible."
						any_failed = True
						failure_messages.append(ai_rejection_message)
						print(f"   ❌ Face detection FAILED for {key}")
				
				# OCR results (for business permit)
				if key in ocr_required_docs:
					ocr_text = verification_result.extracted_text[:2000] if verification_result.extracted_text else None
					ocr_confidence = ai_details.get('ocr', {}).get('confidence', 0)
					
					# Check keyword validation for business permit
					keyword_check = ai_details.get('keyword_check', {})
					if key == 'BUSINESS_PERMIT' and keyword_check and not keyword_check.get('passed'):
						ai_status = 'FAILED'
						ai_rejection_reason = 'MISSING_REQUIRED_TEXT'
						missing_groups = keyword_check.get('missing_groups', [])
						# missing_groups is a list of lists, so format each group properly
						formatted_missing = ', '.join([' or '.join(group) if isinstance(group, list) else str(group) for group in missing_groups])
						ai_rejection_message = f"Business permit does not contain required text. Missing: {formatted_missing}. Please upload a valid business permit."
						any_failed = True
						failure_messages.append(ai_rejection_message)
						print(f"   ❌ OCR keyword check FAILED for {key}: missing {missing_groups}")
				
				# Check for other rejection reasons
				if verification_result.rejection_reason:
					ai_rejection_reason = verification_result.rejection_reason.value
					if not ai_rejection_message:
						ai_rejection_message = f"{key.replace('_', ' ').title()}: {ai_rejection_reason.replace('_', ' ').title()}"
						if ai_status == 'FAILED':
							any_failed = True
							failure_messages.append(ai_rejection_message)
				
				confidence_display = f"{ai_confidence_score:.2f}" if ai_confidence_score else "0"
				print(f"   🤖 AI Result for {key}: status={ai_status}, confidence={confidence_display}")
			else:
				# PDF files skip AI verification
				ai_status = 'SKIPPED'
				ai_details = {'reason': 'PDF file - image verification not applicable'}
				verified_at = timezone.now()
				print(f"   ⏭️ Skipped AI verification for {key} (PDF)")
			
			# Defensive: ensure fileType is a valid choice
			valid_types = {c[0] for c in AgencyKycFile.FileType.choices}
			if key not in valid_types:
				raise ValueError(f"{key} is not a valid fileType. Valid: {valid_types}")
			
			# Create AgencyKycFile with AI verification results
			AgencyKycFile.objects.create(
				agencyKyc=kyc_record,
				fileType=key,
				fileURL=file_url,
				fileName=unique_name,
				fileSize=file.size,
				# AI Verification Fields
				ai_verification_status=ai_status,
				face_detected=face_detected,
				face_count=face_count,
				face_confidence=face_confidence,
				ocr_text=ocr_text,
				ocr_confidence=ocr_confidence,
				quality_score=quality_score,
				ai_confidence_score=ai_confidence_score,
				ai_rejection_reason=ai_rejection_reason,
				ai_rejection_message=ai_rejection_message,
				ai_warnings=ai_warnings,
				ai_details=ai_details,
				verified_at=verified_at,
			)

			uploaded_files.append({
				"file_type": key.lower(),
				"file_url": file_url,
				"file_name": unique_name,
				"file_size": file.size,
				"ai_status": ai_status,
				"ai_confidence": ai_confidence_score,
			})
		
		# Auto-reject if any document failed AI verification
		if any_failed:
			kyc_record.status = 'REJECTED'
			kyc_record.rejectionCategory = 'INVALID_DOCUMENT'
			kyc_record.rejectionReason = '\n'.join(failure_messages)
			kyc_record.notes = 'Auto-rejected by AI verification'
			kyc_record.save()
			print(f"❌ Agency KYC auto-rejected: {failure_messages}")
			
			# Create notification for the agency
			Notification.objects.create(
				accountFK=user,
				title="KYC Documents Rejected",
				message=f"Your agency KYC documents were automatically rejected. Reason: {failure_messages[0]}",
				notificationType="KYC_REJECTED"
			)
			
			return {
				"message": "Agency KYC documents rejected - AI verification failed",
				"agency_kyc_id": kyc_record.agencyKycID,
				"status": "REJECTED",
				"rejection_reasons": failure_messages,
				"files": uploaded_files
			}
		
		print(f"✅ Agency KYC uploaded successfully with AI verification passed")
		
		# Trigger Agency KYC extraction to populate auto-fill data
		try:
			from .kyc_extraction_service import trigger_agency_kyc_extraction_after_upload
			trigger_agency_kyc_extraction_after_upload(kyc_record)
		except Exception as ext_error:
			print(f"⚠️  Agency KYC extraction failed (non-blocking): {str(ext_error)}")
			# Don't fail KYC upload if extraction fails - admin can still verify manually
		
		return {
			"message": "Agency KYC uploaded successfully",
			"agency_kyc_id": kyc_record.agencyKycID,
			"status": "PENDING",
			"files": uploaded_files
		}

	except Accounts.DoesNotExist:
		raise ValueError("User not found")
	except Exception as e:
		print(f"❌ Agency KYC upload error: {str(e)}")
		raise


def get_agency_kyc_status(account_id):
	try:
		user = Accounts.objects.get(accountID=account_id)
		try:
			kyc_record = AgencyKYC.objects.get(accountFK=user)
		except AgencyKYC.DoesNotExist:
			return {
				"status": "NOT_STARTED",
				"message": "No KYC submission found"
			}

		files = AgencyKycFile.objects.filter(agencyKyc=kyc_record)

		return {
			"agency_kyc_id": kyc_record.agencyKycID,
			"status": kyc_record.status,
			"notes": kyc_record.notes,
			"reviewed_at": kyc_record.reviewedAt,
			"submitted_at": kyc_record.createdAt,
			"files": [
				{
					"file_type": f.fileType,
					"file_name": f.fileName,
					"file_size": f.fileSize,
					"uploaded_at": f.uploadedAt,
					"file_url": f.fileURL
				} for f in files
			]
		}

	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def create_agency_kyc_from_paths(account_id: int, file_map: dict, businessName: str | None = None, businessDesc: str | None = None):
	"""
	Create an AgencyKYC record and associated AgencyKycFile rows using existing Supabase storage paths.

	file_map: dict mapping file type keys to storage paths, e.g.
	{
		"BUSINESS_PERMIT": "agency_1/kyc/permit.pdf",
		"REP_ID_FRONT": "agency_1/kyc/rep_front.jpg",
		...
	}
	"""
	try:
		user = Accounts.objects.get(accountID=account_id)

		kyc_record, created = AgencyKYC.objects.get_or_create(
			accountFK=user,
			defaults={'status': 'PENDING', 'notes': ''}
		)

		if not created:
			# Clean up existing files records and reset
			AgencyKycFile.objects.filter(agencyKyc=kyc_record).delete()
			kyc_record.status = 'PENDING'
			kyc_record.notes = 'Created from existing storage paths'
			kyc_record.save()

		created_files = []
		for key, path in file_map.items():
			if not path:
				continue
			# store the path in fileURL and a generated fileName extracted from path
			file_name = path.split('/')[-1]
			AgencyKycFile.objects.create(
				agencyKyc=kyc_record,
				fileType=key,
				fileURL=path,
				fileName=file_name,
				fileSize=None
			)
			created_files.append({
				"file_type": key,
				"file_path": path,
				"file_name": file_name
			})

		# Update Agency profile if businessName/Desc provided
		try:
			agency_profile = None
			from accounts.models import Agency as AgencyProfile
			agency_profile = AgencyProfile.objects.filter(accountFK=user).first()
			if agency_profile and businessName:
				agency_profile.businessName = businessName
				agency_profile.businessDesc = businessDesc or agency_profile.businessDesc
				agency_profile.save()
		except Exception:
			# Non-fatal if Agency profile not present
			pass

		return {
			"message": "Agency KYC record created",
			"agency_kyc_id": kyc_record.agencyKycID,
			"files": created_files
		}

	except Accounts.DoesNotExist:
		raise ValueError("User not found")
	except Exception as e:
		print(f"Error creating Agency KYC from paths: {e}")
		raise


# Employee management services

def get_agency_employees(account_id):
	"""Fetch all employees for a given agency account with dynamic stats."""
	from accounts.models import Job, JobReview
	from django.db.models import Avg
	
	try:
		user = Accounts.objects.get(accountID=account_id)
		employees = AgencyEmployee.objects.filter(agency=user)
		
		result = []
		for emp in employees:
			# Calculate active jobs count dynamically
			active_jobs_count = Job.objects.filter(
				assignedEmployeeID=emp,
				status__in=['ASSIGNED', 'IN_PROGRESS']
			).count()
			
			# Calculate completed jobs from actual job records
			completed_jobs_count = Job.objects.filter(
				assignedEmployeeID=emp,
				status='COMPLETED'
			).count()
			
			# Use stored totalJobsCompleted if no completed jobs found (backwards compat)
			final_completed_count = completed_jobs_count if completed_jobs_count > 0 else emp.totalJobsCompleted
			
			# Calculate average rating from job reviews
			# Use revieweeEmployeeID field which references AgencyEmployee
			reviews = JobReview.objects.filter(
				revieweeEmployeeID=emp,
				status='ACTIVE'
			)
			avg_rating = None
			if reviews.exists():
				avg_rating = reviews.aggregate(avg=Avg('rating'))['avg']
			
			# Use calculated rating, fall back to stored rating, then 0
			final_rating = float(avg_rating) if avg_rating else (float(emp.rating) if emp.rating else 0)
			
			result.append({
				"id": emp.employeeID,
				"employeeId": emp.employeeID,  # Frontend expects this field name
				"name": emp.name,
				"email": emp.email,
				"role": emp.role,
				"avatar": emp.avatar,
				"rating": final_rating,
				# Agency Phase 2 performance fields
				"employeeOfTheMonth": emp.employeeOfTheMonth,
				"employeeOfTheMonthDate": emp.employeeOfTheMonthDate.isoformat() if emp.employeeOfTheMonthDate else None,
				"employeeOfTheMonthReason": emp.employeeOfTheMonthReason,
				"lastRatingUpdate": emp.lastRatingUpdate.isoformat() if emp.lastRatingUpdate else None,
				"totalJobsCompleted": final_completed_count,
				"totalEarnings": float(emp.totalEarnings),
				"isActive": emp.isActive,
				# Dynamic active jobs count
				"activeJobs": active_jobs_count,
			})
		
		return result
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def add_agency_employee(account_id, name, email, role, avatar=None, rating=None):
	"""Add a new employee to an agency."""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Validate role is provided
		if not role or not role.strip():
			raise ValueError("Role/specialization is required")
		
		# Create the employee
		employee = AgencyEmployee.objects.create(
			agency=user,
			name=name,
			email=email,
			role=role,
			avatar=avatar,
			rating=rating
		)
		
		return {
			"id": employee.employeeID,
			"name": employee.name,
			"email": employee.email,
			"role": employee.role,
			"avatar": employee.avatar,
			"rating": float(employee.rating) if employee.rating else None,
			# Agency Phase 2 performance fields (defaults for new employees)
			"employeeOfTheMonth": employee.employeeOfTheMonth,
			"employeeOfTheMonthDate": None,
			"employeeOfTheMonthReason": "",
			"lastRatingUpdate": None,
			"totalJobsCompleted": employee.totalJobsCompleted,
			"totalEarnings": float(employee.totalEarnings),
			"isActive": employee.isActive,
			"message": "Employee added successfully"
		}
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def remove_agency_employee(account_id, employee_id):
	"""Remove an employee from an agency."""
	try:
		user = Accounts.objects.get(accountID=account_id)
		employee = AgencyEmployee.objects.get(employeeID=employee_id, agency=user)
		employee.delete()
		
		return {"message": "Employee removed successfully"}
	except Accounts.DoesNotExist:
		raise ValueError("User not found")
	except AgencyEmployee.DoesNotExist:
		raise ValueError("Employee not found")


def get_agency_profile(account_id):
	"""Get complete agency profile with statistics."""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Get agency profile
		try:
			agency_profile = AgencyProfile.objects.get(accountFK=user)
			business_name = agency_profile.businessName
			business_desc = agency_profile.businessDesc
			contact_number = agency_profile.contactNumber
			address = {
				"street": agency_profile.street_address,
				"city": agency_profile.city,
				"province": agency_profile.province,
				"postal_code": agency_profile.postal_code,
				"country": agency_profile.country,
			}
		except AgencyProfile.DoesNotExist:
			business_name = None
			business_desc = None
			contact_number = None
			address = None
		
		# Get KYC status
		try:
			kyc_record = AgencyKYC.objects.get(accountFK=user)
			kyc_status = kyc_record.status
			kyc_submitted_at = kyc_record.createdAt
		except AgencyKYC.DoesNotExist:
			kyc_status = "NOT_STARTED"
			kyc_submitted_at = None
		
		# Get employee statistics
		employees = AgencyEmployee.objects.filter(agency=user)
		total_employees = employees.count()
		avg_employee_rating = employees.aggregate(avg_rating=Avg('rating'))['avg_rating']
		
		# TODO: Get jobs statistics when jobs model is implemented
		# For now, return placeholder values
		total_jobs = 0
		active_jobs = 0
		completed_jobs = 0
		
		# Get account info
		email = user.email
		created_at = user.createdAt
		
		return {
			"account_id": user.accountID,
			"email": email,
			"contact_number": contact_number,
			"business_name": business_name,
			"business_description": business_desc,
			"address": address,
			"kyc_status": kyc_status,
			"kyc_submitted_at": kyc_submitted_at,
			"statistics": {
				"total_employees": total_employees,
				"avg_employee_rating": float(avg_employee_rating) if avg_employee_rating else None,
				"total_jobs": total_jobs,
				"active_jobs": active_jobs,
				"completed_jobs": completed_jobs,
			},
			"created_at": created_at,
		}
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def update_agency_profile(account_id, business_name=None, business_desc=None, contact_number=None):
	"""Update agency profile information."""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Update Agency profile
		agency_profile = None
		try:
			agency_profile = AgencyProfile.objects.get(accountFK=user)
			if business_name is not None:
				agency_profile.businessName = business_name
			if business_desc is not None:
				agency_profile.businessDesc = business_desc
			if contact_number is not None and contact_number.strip():
				agency_profile.contactNumber = contact_number
			agency_profile.save()
		except AgencyProfile.DoesNotExist:
			# Create agency profile if it doesn't exist
			if business_name or business_desc or contact_number:
				agency_profile = AgencyProfile.objects.create(
					accountFK=user,
					businessName=business_name or "",
					businessDesc=business_desc or "",
					contactNumber=contact_number or ""
				)
		
		# Get the current values to return
		try:
			agency_profile = AgencyProfile.objects.get(accountFK=user)
			current_business_name = agency_profile.businessName
			current_business_desc = agency_profile.businessDesc
			current_contact = agency_profile.contactNumber
		except AgencyProfile.DoesNotExist:
			current_business_name = None
			current_business_desc = None
			current_contact = None
		
		return {
			"message": "Profile updated successfully",
			"business_name": current_business_name,
			"business_description": current_business_desc,
			"contact_number": current_contact
		}
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


# Simplified agency job services - Direct invite/hire model

def get_agency_jobs(account_id, status_filter=None, invite_status_filter=None, page=1, limit=20):
	"""
	Get all jobs assigned to this agency (where assignedAgencyFK = this agency).
	
	Args:
		account_id: Agency's account ID
		status_filter: Optional status filter (ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED)
		invite_status_filter: Optional invite status filter (PENDING, ACCEPTED, REJECTED)
		page: Page number for pagination
		limit: Items per page
	
	Returns:
		Dictionary with jobs, pagination info, and counts
	"""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Verify user has an agency profile
		try:
			agency = AgencyProfile.objects.get(accountFK=user)
		except AgencyProfile.DoesNotExist:
			raise ValueError("Agency profile not found. Complete KYC first.")
		
		# Build query for jobs assigned to this agency
		query = Q(assignedAgencyFK=agency)
		
		# Apply status filter
		if status_filter:
			valid_statuses = ['ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
			if status_filter.upper() not in valid_statuses:
				raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
			query &= Q(status=status_filter.upper())
		
		# Apply invite status filter (for INVITE-type jobs)
		if invite_status_filter:
			valid_invite_statuses = ['PENDING', 'ACCEPTED', 'REJECTED']
			if invite_status_filter.upper() not in valid_invite_statuses:
				raise ValueError(f"Invalid invite status. Must be one of: {', '.join(valid_invite_statuses)}")
			query &= Q(inviteStatus=invite_status_filter.upper())
		
		# Get total count
		total_count = Job.objects.filter(query).count()
		
		# Calculate pagination
		offset = (page - 1) * limit
		total_pages = (total_count + limit - 1) // limit  # Ceiling division
		
		# Get jobs with related data
		jobs = Job.objects.filter(query).select_related(
			'clientID',
			'clientID__profileID',
			'categoryID',
			'assignedEmployeeID'
		).order_by('-createdAt')[offset:offset + limit]
		
		# Format response
		jobs_data = []
		for job in jobs:
			# Get client info
			client_profile = job.clientID.profileID
			
			# Get assigned employee info if exists
			assigned_employee = None
			if job.assignedEmployeeID:
				assigned_employee = {
					'employeeId': job.assignedEmployeeID.employeeID,
					'name': job.assignedEmployeeID.name,
					'email': job.assignedEmployeeID.email,
					'role': job.assignedEmployeeID.role,
				}
			
			jobs_data.append({
				'jobID': job.jobID,
				'title': job.title,
				'description': job.description,
				'category': {
					'id': job.categoryID.specializationID,
					'name': job.categoryID.specializationName
				} if job.categoryID else None,
				'budget': float(job.budget) if job.budget else None,
				'location': job.location,
				'urgency': job.urgency,
				'status': job.status,
				'jobType': job.jobType,
				'expectedDuration': job.expectedDuration,
				'preferredStartDate': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
				'assignedEmployeeID': job.assignedEmployeeID.employeeID if job.assignedEmployeeID else None,
				'assignedEmployee': assigned_employee,
				'inviteStatus': job.inviteStatus,
				'client': {
					'id': client_profile.accountFK.accountID,
					'name': f"{client_profile.firstName} {client_profile.lastName}",
					'avatar': client_profile.profileImg,
					'email': client_profile.accountFK.email,
				},
				'createdAt': job.createdAt.isoformat(),
				'updatedAt': job.updatedAt.isoformat(),
			})
		
		# Get status counts
		status_counts = {
			'active': Job.objects.filter(assignedAgencyFK=agency, status='ACTIVE').count(),
			'inProgress': Job.objects.filter(assignedAgencyFK=agency, status='IN_PROGRESS').count(),
			'completed': Job.objects.filter(assignedAgencyFK=agency, status='COMPLETED').count(),
			'cancelled': Job.objects.filter(assignedAgencyFK=agency, status='CANCELLED').count(),
		}
		
		return {
			'jobs': jobs_data,
			'pagination': {
				'page': page,
				'limit': limit,
				'totalCount': total_count,
				'totalPages': total_pages,
				'hasNext': page < total_pages,
				'hasPrev': page > 1,
			},
			'statusCounts': status_counts,
		}
		
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def get_agency_job_detail(account_id, job_id):
	"""
	Get detailed information for a specific job assigned to this agency.
	
	Args:
		account_id: Agency's account ID
		job_id: Job ID to fetch
	
	Returns:
		Dictionary with complete job details
	"""
	from accounts.models import JobEmployeeAssignment
	
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Verify user has an agency profile
		try:
			agency = AgencyProfile.objects.get(accountFK=user)
		except AgencyProfile.DoesNotExist:
			raise ValueError("Agency profile not found. Complete KYC first.")
		
		# Get job and verify it's assigned to this agency
		try:
			job = Job.objects.select_related(
				'clientID',
				'clientID__profileID',
				'categoryID',
				'assignedEmployeeID'
			).get(jobID=job_id, assignedAgencyFK=agency)
		except Job.DoesNotExist:
			raise ValueError("Job not found or not assigned to your agency")
		
		# Get client info
		client_profile = job.clientID.profileID
		
		# Get assigned employee info if exists (legacy single employee)
		assigned_employee = None
		if job.assignedEmployeeID:
			assigned_employee = {
				'employeeId': job.assignedEmployeeID.employeeID,
				'name': job.assignedEmployeeID.name,
				'email': job.assignedEmployeeID.email,
				'role': job.assignedEmployeeID.role,
			}
		
		# Get ALL assigned employees (multi-employee support)
		assigned_employees = []
		assignments = JobEmployeeAssignment.objects.filter(
			job=job,
			status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
		).select_related('employee').order_by('-isPrimaryContact', 'assignedAt')
		
		for assignment in assignments:
			emp = assignment.employee
			assigned_employees.append({
				'employee_id': emp.employeeID,
				'name': emp.name,
				'email': emp.email,
				'role': emp.role,
				'avatar': emp.avatar,
				'rating': float(emp.rating) if emp.rating else None,
				'is_primary_contact': assignment.isPrimaryContact,
				'status': assignment.status,
				'assigned_at': assignment.assignedAt.isoformat() if assignment.assignedAt else None,
			})
		
		# Fallback: if no M2M assignments but legacy field is set
		if not assigned_employees and job.assignedEmployeeID:
			emp = job.assignedEmployeeID
			assigned_employees.append({
				'employee_id': emp.employeeID,
				'name': emp.name,
				'email': emp.email,
				'role': emp.role,
				'avatar': emp.avatar,
				'rating': float(emp.rating) if emp.rating else None,
				'is_primary_contact': True,
				'status': 'ASSIGNED',
				'assigned_at': job.employeeAssignedAt.isoformat() if job.employeeAssignedAt else None,
			})
		
		# Parse materials needed if JSON string
		materials_needed = []
		if job.materialsNeeded:
			try:
				import json
				if isinstance(job.materialsNeeded, str):
					materials_needed = json.loads(job.materialsNeeded)
				elif isinstance(job.materialsNeeded, list):
					materials_needed = job.materialsNeeded
			except:
				materials_needed = []
		
		job_data = {
			'jobID': job.jobID,
			'title': job.title,
			'description': job.description,
			'category': {
				'id': job.categoryID.specializationID,
				'name': job.categoryID.specializationName
			} if job.categoryID else None,
			'budget': float(job.budget) if job.budget else None,
			'location': job.location,
			'urgency': job.urgency,
			'status': job.status,
			'jobType': job.jobType,
			'expectedDuration': job.expectedDuration,
			'preferredStartDate': job.preferredStartDate.isoformat() if job.preferredStartDate else None,
			'materialsNeeded': materials_needed,
			'assignedEmployeeID': job.assignedEmployeeID.employeeID if job.assignedEmployeeID else None,
			'assignedEmployee': assigned_employee,  # Legacy single employee
			'assignedEmployees': assigned_employees,  # NEW: All assigned employees
			'employeeAssignedAt': job.employeeAssignedAt.isoformat() if job.employeeAssignedAt else None,
			'assignmentNotes': job.assignmentNotes,
			'inviteStatus': job.inviteStatus,
			'client': {
				'id': client_profile.accountFK.accountID,
				'name': f"{client_profile.firstName} {client_profile.lastName}",
				'avatar': client_profile.profileImg,
				'email': client_profile.accountFK.email,
			},
			'createdAt': job.createdAt.isoformat(),
			'updatedAt': job.updatedAt.isoformat(),
		}
		
		return {'job': job_data}
		
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


# Agency Phase 2 - Employee Management Services

def update_employee_rating(account_id, employee_id, rating, reason=None):
	"""
	Update employee rating manually.
	
	Args:
		account_id: Agency owner's account ID
		employee_id: Employee ID to update
		rating: New rating (0.00 to 5.00)
		reason: Optional reason for the rating update
	
	Returns:
		Dictionary with updated employee info
	"""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Get employee and verify ownership
		try:
			employee = AgencyEmployee.objects.get(employeeID=employee_id, agency=user)
		except AgencyEmployee.DoesNotExist:
			raise ValueError("Employee not found or not owned by this agency")
		
		# Validate rating range
		if rating < 0.0 or rating > 5.0:
			raise ValueError("Rating must be between 0.00 and 5.00")
		
		# Update rating and timestamp
		from decimal import Decimal
		employee.rating = Decimal(str(rating))
		employee.lastRatingUpdate = timezone.now()
		employee.save(update_fields=['rating', 'lastRatingUpdate', 'updatedAt'])
		
		# Create notification for the rating update
		Notification.objects.create(
			accountFK=user,
			notificationType="EMPLOYEE_RATING_UPDATED",
			title=f"Rating Updated: {employee.name}",
			message=f"Updated {employee.name}'s rating to {rating}/5.0" + (f". Reason: {reason}" if reason else ""),
		)
		
		return {
			"success": True,
			"message": "Employee rating updated successfully",
			"employeeId": employee.employeeID,
			"rating": float(employee.rating) if employee.rating is not None else 0.0,  # type: ignore[arg-type]
			"lastRatingUpdate": employee.lastRatingUpdate.isoformat() if employee.lastRatingUpdate else None,  # type: ignore[union-attr]
		}
		
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def set_employee_of_month(account_id, employee_id, reason):
	"""
	Set an employee as Employee of the Month.
	Only one employee can be EOTM per agency at a time.
	
	Args:
		account_id: Agency owner's account ID
		employee_id: Employee ID to set as EOTM
		reason: Reason for selection (required)
	
	Returns:
		Dictionary with updated employee info
	"""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Get employee and verify ownership
		try:
			employee = AgencyEmployee.objects.get(employeeID=employee_id, agency=user)
		except AgencyEmployee.DoesNotExist:
			raise ValueError("Employee not found or not owned by this agency")
		
		# Validate reason
		if not reason or not reason.strip():
			raise ValueError("Reason is required for Employee of the Month selection")
		
		# Clear previous EOTM for this agency (only one at a time)
		AgencyEmployee.objects.filter(agency=user, employeeOfTheMonth=True).update(
			employeeOfTheMonth=False
		)
		
		# Set new EOTM
		employee.employeeOfTheMonth = True
		employee.employeeOfTheMonthDate = timezone.now()
		employee.employeeOfTheMonthReason = reason
		employee.save(update_fields=['employeeOfTheMonth', 'employeeOfTheMonthDate', 'employeeOfTheMonthReason', 'updatedAt'])
		
		# Create notification
		Notification.objects.create(
			accountFK=user,
			notificationType="EMPLOYEE_OF_MONTH_SET",
			title=f"Employee of the Month: {employee.name}",
			message=f"{employee.name} has been selected as Employee of the Month! Reason: {reason}",
		)
		
		return {
			"success": True,
			"message": f"{employee.name} is now Employee of the Month!",
			"employeeId": employee.employeeID,
			"employeeOfTheMonth": employee.employeeOfTheMonth,
			"employeeOfTheMonthDate": employee.employeeOfTheMonthDate.isoformat() if employee.employeeOfTheMonthDate else None,  # type: ignore[union-attr]
			"employeeOfTheMonthReason": employee.employeeOfTheMonthReason,
		}
		
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def get_employee_performance(account_id, employee_id):
	"""
	Get comprehensive performance statistics for an employee.
	
	Args:
		account_id: Agency owner's account ID
		employee_id: Employee ID to get performance for
	
	Returns:
		Dictionary with performance statistics
	"""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Get employee and verify ownership
		try:
			employee = AgencyEmployee.objects.get(employeeID=employee_id, agency=user)
		except AgencyEmployee.DoesNotExist:
			raise ValueError("Employee not found or not owned by this agency")
		
		# Get performance stats using model method
		stats = employee.get_performance_stats()
		
		return {
			"employeeId": employee.employeeID,
			"name": employee.name,
			"email": employee.email,
			"role": employee.role,
			"avatar": employee.avatar,
			"rating": float(employee.rating) if employee.rating else None,
			"totalJobsCompleted": stats['total_jobs'],
			"totalEarnings": stats['total_earnings'],
			"isActive": stats['is_active'],
			"employeeOfTheMonth": stats['is_employee_of_month'],
			"employeeOfTheMonthDate": employee.employeeOfTheMonthDate.isoformat() if employee.employeeOfTheMonthDate else None,
			"employeeOfTheMonthReason": employee.employeeOfTheMonthReason,
			"lastRatingUpdate": employee.lastRatingUpdate.isoformat() if employee.lastRatingUpdate else None,
			"jobsHistory": stats['jobs_history'],
		}
		
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def get_employee_leaderboard(account_id, sort_by='rating'):
	"""
	Get employee leaderboard sorted by various metrics.
	Only includes active employees.
	
	Args:
		account_id: Agency owner's account ID
		sort_by: Sort metric ('rating', 'jobs', 'earnings')
	
	Returns:
		Dictionary with leaderboard data
	"""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Validate sort_by parameter
		valid_sorts = ['rating', 'jobs', 'earnings']
		if sort_by not in valid_sorts:
			raise ValueError(f"Invalid sort_by parameter. Must be one of: {', '.join(valid_sorts)}")
		
		# Build query for active employees
		employees = AgencyEmployee.objects.filter(agency=user, isActive=True)
		
		# Sort based on parameter
		if sort_by == 'rating':
			employees = employees.order_by('-rating', 'name')
		elif sort_by == 'jobs':
			employees = employees.order_by('-totalJobsCompleted', 'name')
		elif sort_by == 'earnings':
			employees = employees.order_by('-totalEarnings', 'name')
		
		# Format response with rank
		leaderboard_data = []
		for rank, employee in enumerate(employees, start=1):
			leaderboard_data.append({
				"employeeId": employee.employeeID,
				"name": employee.name,
				"email": employee.email,
				"role": employee.role,
				"avatar": employee.avatar,
				"rating": float(employee.rating) if employee.rating else None,
				"totalJobsCompleted": employee.totalJobsCompleted,
				"totalEarnings": float(employee.totalEarnings),
				"employeeOfTheMonth": employee.employeeOfTheMonth,
				"rank": rank,
			})
		
		return {
			"employees": leaderboard_data,
			"sortBy": sort_by,
			"totalCount": len(leaderboard_data),
		}
		
	except Accounts.DoesNotExist:
		raise ValueError("User not found")


def assign_job_to_employee(
	agency_account,
	job_id: int,
	employee_id: int,
	assignment_notes: str = None
) -> dict:
	"""
	Assign an accepted job to a specific agency employee

	Args:
		agency_account: The authenticated agency account
		job_id: ID of the job to assign
		employee_id: ID of the employee to assign
		assignment_notes: Optional notes about the assignment

	Returns:
		dict with success status and job details

	Raises:
		ValueError for validation errors
	"""
	from accounts.models import Job, Notification, JobLog
	from django.utils import timezone
	from django.db import transaction

	try:
		# Get agency
		agency = AgencyProfile.objects.get(accountFK=agency_account)
	except AgencyProfile.DoesNotExist:
		raise ValueError("Agency account not found")

	# Get job and validate
	try:
		job = Job.objects.select_related(
			'clientID__profileID__accountFK',
			'assignedAgencyFK',
			'assignedWorkerID',
			'assignedEmployeeID'
		).get(jobID=job_id)
	except Job.DoesNotExist:
		raise ValueError(f"Job {job_id} not found")

	# Verify job belongs to this agency
	if job.assignedAgencyFK != agency:
		raise ValueError("This job is not assigned to your agency")

	# Verify job is in correct status
	if job.inviteStatus != 'ACCEPTED':
		raise ValueError(f"Cannot assign job with invite status: {job.inviteStatus}")

	allowed_statuses = {'ACTIVE', 'ASSIGNED'}
	if job.status not in allowed_statuses:
		# Allow rare case where job already moved to IN_PROGRESS but still missing employee
		if not (job.status == 'IN_PROGRESS' and job.assignedEmployeeID is None):
			raise ValueError(f"Cannot assign job with status: {job.status}")

	# Check if already assigned to an employee
	if job.assignedEmployeeID:
		raise ValueError(
			f"Job is already assigned to {job.assignedEmployeeID.name}. "
			"Please unassign first if you want to reassign."
		)

	# Get employee and validate
	try:
		employee = AgencyEmployee.objects.select_related('agency').get(
			employeeID=employee_id,
			agency=agency_account
		)
	except AgencyEmployee.DoesNotExist:
		raise ValueError(f"Employee {employee_id} not found")

	# Verify employee belongs to this agency
	if employee.agency != agency_account:
		raise ValueError("This employee does not belong to your agency")

	# Verify employee is active
	if not employee.isActive:
		raise ValueError(f"Employee {employee.name} is not active")

	# Assign job to employee (atomic transaction)
	with transaction.atomic():
		previous_status = job.status
		# Update job
		job.assignedEmployeeID = employee
		job.employeeAssignedAt = timezone.now()
		job.assignmentNotes = assignment_notes or ""
		if job.status == 'ACTIVE':
			job.status = 'IN_PROGRESS'  # Go directly to IN_PROGRESS when employees assigned
		job.save()

	# Create job log entry
	JobLog.objects.create(
		jobID=job,
		notes=f"Employee assigned: Agency '{agency.businessName}' assigned employee '{employee.name}' to job. Notes: {assignment_notes or 'None'}",
		changedBy=agency_account,
		oldStatus=previous_status,
		newStatus=job.status
	)

	# Get employee's account if exists (for notification)
	employee_account = getattr(employee, 'accountFK', None)

	if employee_account:
		# Create notification for employee
		Notification.objects.create(
			accountFK=employee_account,
			notificationType='JOB_ASSIGNED',
			title=f'New Job Assignment: {job.title}',
			message=f'You have been assigned to work on "{job.title}" for client {job.clientID.profileID.firstName}. Budget: ₱{job.budget}',
			relatedJobID=job.jobID
		)

	# Create notification for client
	Notification.objects.create(
		accountFK=job.clientID.profileID.accountFK,
		notificationType='AGENCY_ASSIGNED_WORKER',
		title=f'Worker Assigned to Your Job',
		message=f'{agency.businessName} has assigned {employee.name} to work on "{job.title}".',
		relatedJobID=job.jobID
	)

	print(f"✅ Job {job_id} assigned to employee {employee.name} (ID: {employee_id})")

	return {
		'success': True,
		'message': f'Job successfully assigned to {employee.name}',
		'job_id': job.jobID,
		'employee_id': employee.employeeId,
		'employee_name': employee.name,
		'assigned_at': job.employeeAssignedAt.isoformat(),
		'status': job.status
	}


def unassign_job_from_employee(
	agency_account,
	job_id: int,
	reason: str = None
) -> dict:
	"""
	Unassign a job from an employee (for reassignment or cancellation)

	Args:
		agency_account: The authenticated agency account
		job_id: ID of the job to unassign
		reason: Reason for unassignment

	Returns:
		dict with success status
	"""
	from accounts.models import Job, Notification, JobLog
	from django.utils import timezone
	from django.db import transaction

	try:
		agency = AgencyProfile.objects.get(accountFK=agency_account)
	except AgencyProfile.DoesNotExist:
		raise ValueError("Agency account not found")

	try:
		job = Job.objects.select_related(
			'assignedEmployeeID',
			'assignedAgencyFK'
		).get(jobID=job_id)
	except Job.DoesNotExist:
		raise ValueError(f"Job {job_id} not found")

	# Verify job belongs to this agency
	if job.assignedAgencyFK != agency:
		raise ValueError("This job is not assigned to your agency")

	# Check if job has an assigned employee
	if not job.assignedEmployeeID:
		raise ValueError("This job does not have an assigned employee")

	# Verify job hasn't started work yet
	if job.status == 'IN_PROGRESS':
		raise ValueError("Cannot unassign employee from job that is already in progress")

	if job.workerMarkedComplete or job.clientMarkedComplete:
		raise ValueError("Cannot unassign employee from completed job")

	employee_name = job.assignedEmployeeID.name
	employee_id = job.assignedEmployeeID.employeeId

	previous_status = job.status

	with transaction.atomic():
		# Clear assignment
		job.assignedEmployeeID = None
		job.employeeAssignedAt = None
		job.assignmentNotes = None
		job.status = 'ACTIVE'  # Revert to ACTIVE for reassignment
		job.save()

	# Create job log
	JobLog.objects.create(
		jobID=job,
		notes=f"Employee unassigned: Agency '{agency.businessName}' unassigned employee '{employee_name}'. Reason: {reason or 'Not specified'}",
		changedBy=agency_account,
		oldStatus=previous_status,
		newStatus='ACTIVE'
	)
	
	print(f"✅ Employee {employee_name} (ID: {employee_id}) unassigned from job {job_id}")

	return {
		'success': True,
		'message': f'Employee {employee_name} unassigned from job',
		'job_id': job.jobID,
		'unassigned_employee': employee_name
	}


def get_employee_workload(agency_account, employee_id: int) -> dict:
	"""
	Get current workload for an employee (for assignment decisions)

	Returns:
		dict with active jobs count, in-progress count, availability status
	"""
	from accounts.models import Job

	try:
		agency = AgencyProfile.objects.get(accountFK=agency_account)
	except AgencyProfile.DoesNotExist:
		raise ValueError("Agency account not found")

	try:
		employee = AgencyEmployee.objects.get(
			employeeID=employee_id,
			agency=agency_account
		)
	except AgencyEmployee.DoesNotExist:
		raise ValueError(f"Employee {employee_id} not found")

	# Count active and in-progress jobs
	active_jobs = Job.objects.filter(
		assignedEmployeeID=employee,
		status='ASSIGNED'
	).count()

	in_progress_jobs = Job.objects.filter(
		assignedEmployeeID=employee,
		status='IN_PROGRESS'
	).count()

	total_active = active_jobs + in_progress_jobs

	# Determine availability (simple logic for now)
	if not employee.isActive:
		availability = 'INACTIVE'
	elif total_active >= 3:
		availability = 'BUSY'
	elif total_active >= 1:
		availability = 'WORKING'
	else:
		availability = 'AVAILABLE'

	return {
		'employee_id': employee.employeeId,
		'employee_name': employee.name,
		'is_active': employee.isActive,
		'assigned_jobs_count': active_jobs,
		'in_progress_jobs_count': in_progress_jobs,
		'total_active_jobs': total_active,
		'availability': availability
	}


# ============================================================
# MULTI-EMPLOYEE ASSIGNMENT FUNCTIONS (NEW)
# ============================================================

def assign_employees_to_job(
	agency_account,
	job_id: int,
	employee_ids: list,
	primary_contact_id: int = None,
	assignment_notes: str = None
) -> dict:
	"""
	Assign multiple employees to a job.
	
	Args:
		agency_account: The authenticated agency account
		job_id: ID of the job to assign employees to
		employee_ids: List of employee IDs to assign
		primary_contact_id: ID of employee who is the primary contact/team lead
		assignment_notes: Optional notes about the assignment
	
	Returns:
		dict with success status and assignment details
	"""
	from accounts.models import Job, JobEmployeeAssignment, Notification, JobLog
	from django.utils import timezone
	from django.db import transaction
	
	if not employee_ids:
		raise ValueError("At least one employee must be specified")
	
	# Validate primary contact is in the list
	if primary_contact_id and primary_contact_id not in employee_ids:
		raise ValueError("Primary contact must be in the list of assigned employees")
	
	# If no primary contact specified, use the first employee
	if not primary_contact_id:
		primary_contact_id = employee_ids[0]
	
	try:
		agency = AgencyProfile.objects.get(accountFK=agency_account)
	except AgencyProfile.DoesNotExist:
		raise ValueError("Agency account not found")
	
	# Get job and validate
	try:
		job = Job.objects.select_related(
			'clientID__profileID__accountFK',
			'assignedAgencyFK'
		).get(jobID=job_id)
	except Job.DoesNotExist:
		raise ValueError(f"Job {job_id} not found")
	
	# Verify job belongs to this agency
	if job.assignedAgencyFK != agency:
		raise ValueError("This job is not assigned to your agency")
	
	# Verify job is in correct status
	if job.inviteStatus != 'ACCEPTED':
		raise ValueError(f"Cannot assign employees to job with invite status: {job.inviteStatus}")
	
	# Only allow assignment for ACTIVE jobs (not IN_PROGRESS or COMPLETED)
	allowed_statuses = {'ACTIVE'}
	if job.status not in allowed_statuses:
		raise ValueError(f"Cannot assign employees to job with status: {job.status}")
	
	# Get all employees and validate
	employees = AgencyEmployee.objects.filter(
		employeeID__in=employee_ids,
		agency=agency_account
	)
	
	found_ids = set(emp.employeeID for emp in employees)
	missing_ids = set(employee_ids) - found_ids
	if missing_ids:
		raise ValueError(f"Employees not found: {missing_ids}")
	
	# Check all employees are active
	inactive_employees = [emp for emp in employees if not emp.isActive]
	if inactive_employees:
		names = ', '.join(emp.name for emp in inactive_employees)
		raise ValueError(f"The following employees are not active: {names}")
	
	# Check for already assigned employees
	existing_assignments = JobEmployeeAssignment.objects.filter(
		job=job,
		employee_id__in=employee_ids,
		status__in=['ASSIGNED', 'IN_PROGRESS']
	).values_list('employee_id', flat=True)
	
	if existing_assignments:
		existing_names = AgencyEmployee.objects.filter(
			employeeID__in=existing_assignments
		).values_list('name', flat=True)
		raise ValueError(f"Already assigned: {', '.join(existing_names)}")
	
	assignments_created = []
	
	with transaction.atomic():
		for employee in employees:
			is_primary = (employee.employeeID == primary_contact_id)
			
			assignment = JobEmployeeAssignment.objects.create(
				job=job,
				employee=employee,
				assignedBy=agency_account,
				notes=assignment_notes or "",
				isPrimaryContact=is_primary,
				status='ASSIGNED'
			)
			assignments_created.append({
				'assignment_id': assignment.assignmentID,
				'employee_id': employee.employeeID,
				'employee_name': employee.name,
				'is_primary_contact': is_primary
			})
		
		# Update job metadata
		if not job.employeeAssignedAt:
			job.employeeAssignedAt = timezone.now()
		if job.status == 'ACTIVE':
			job.status = 'IN_PROGRESS'  # Go directly to IN_PROGRESS when employees assigned
		job.assignmentNotes = assignment_notes or ""
		
		# Also set legacy field to primary contact for backward compatibility
		primary_employee = next(emp for emp in employees if emp.employeeID == primary_contact_id)
		job.assignedEmployeeID = primary_employee
		job.save()
	
	# Create job log
	employee_names = ', '.join(emp.name for emp in employees)
	JobLog.objects.create(
		jobID=job,
		notes=f"Multi-employee assignment: {len(employees)} employees assigned ({employee_names}). Primary contact: {primary_employee.name}",
		changedBy=agency_account,
		oldStatus='ACTIVE',
		newStatus=job.status
	)
	
	# Create notification for client
	Notification.objects.create(
		accountFK=job.clientID.profileID.accountFK,
		notificationType='AGENCY_ASSIGNED_WORKER',
		title=f'Team Assigned to Your Job',
		message=f'{agency.businessName} has assigned {len(employees)} workers to "{job.title}". Team lead: {primary_employee.name}.',
		relatedJobID=job.jobID
	)
	
	print(f"✅ {len(employees)} employees assigned to job {job_id}")
	
	return {
		'success': True,
		'message': f'{len(employees)} employees assigned to job',
		'job_id': job.jobID,
		'job_status': job.status,
		'assignments': assignments_created,
		'primary_contact': {
			'employee_id': primary_employee.employeeID,
			'name': primary_employee.name
		}
	}


def remove_employee_from_job(
	agency_account,
	job_id: int,
	employee_id: int,
	reason: str = None
) -> dict:
	"""
	Remove a single employee from a multi-employee job assignment.
	
	Args:
		agency_account: The authenticated agency account
		job_id: ID of the job
		employee_id: ID of the employee to remove
		reason: Optional reason for removal
	
	Returns:
		dict with success status
	"""
	from accounts.models import Job, JobEmployeeAssignment, JobLog
	from django.utils import timezone
	from django.db import transaction
	
	try:
		agency = AgencyProfile.objects.get(accountFK=agency_account)
	except AgencyProfile.DoesNotExist:
		raise ValueError("Agency account not found")
	
	# Get job
	try:
		job = Job.objects.get(jobID=job_id)
	except Job.DoesNotExist:
		raise ValueError(f"Job {job_id} not found")
	
	# Verify job belongs to this agency
	if job.assignedAgencyFK != agency:
		raise ValueError("This job is not assigned to your agency")
	
	# Find the assignment
	try:
		assignment = JobEmployeeAssignment.objects.select_related('employee').get(
			job=job,
			employee_id=employee_id,
			status__in=['ASSIGNED', 'IN_PROGRESS']
		)
	except JobEmployeeAssignment.DoesNotExist:
		raise ValueError(f"Employee {employee_id} is not assigned to this job")
	
	# Check if this is the only employee
	active_assignments = JobEmployeeAssignment.objects.filter(
		job=job,
		status__in=['ASSIGNED', 'IN_PROGRESS']
	).count()
	
	if active_assignments <= 1:
		raise ValueError("Cannot remove the last employee. Use unassign_all instead.")
	
	employee_name = assignment.employee.name
	was_primary = assignment.isPrimaryContact
	
	with transaction.atomic():
		# Mark assignment as removed
		assignment.status = 'REMOVED'
		assignment.notes = f"{assignment.notes}\nRemoved: {reason or 'No reason provided'}"
		assignment.save()
		
		# If this was the primary contact, assign a new one
		if was_primary:
			next_primary = JobEmployeeAssignment.objects.filter(
				job=job,
				status__in=['ASSIGNED', 'IN_PROGRESS']
			).exclude(assignmentID=assignment.assignmentID).first()
			
			if next_primary:
				next_primary.isPrimaryContact = True
				next_primary.save()
				
				# Update legacy field
				job.assignedEmployeeID = next_primary.employee
				job.save()
	
	# Create log
	JobLog.objects.create(
		jobID=job,
		notes=f"Employee removed: {employee_name}. Reason: {reason or 'Not specified'}",
		changedBy=agency_account,
		oldStatus=job.status,
		newStatus=job.status
	)
	
	print(f"✅ Employee {employee_name} removed from job {job_id}")
	
	return {
		'success': True,
		'message': f'{employee_name} removed from job',
		'job_id': job.jobID,
		'removed_employee': employee_name,
		'was_primary_contact': was_primary
	}


def get_job_assigned_employees(agency_account, job_id: int) -> dict:
	"""
	Get all employees assigned to a job.
	
	Args:
		agency_account: The authenticated agency account
		job_id: ID of the job
	
	Returns:
		dict with list of assigned employees
	"""
	from accounts.models import Job, JobEmployeeAssignment
	
	try:
		agency = AgencyProfile.objects.get(accountFK=agency_account)
	except AgencyProfile.DoesNotExist:
		raise ValueError("Agency account not found")
	
	# Get job
	try:
		job = Job.objects.get(jobID=job_id)
	except Job.DoesNotExist:
		raise ValueError(f"Job {job_id} not found")
	
	# Verify job belongs to this agency
	if job.assignedAgencyFK != agency:
		raise ValueError("This job is not assigned to your agency")
	
	# Get all active assignments
	assignments = JobEmployeeAssignment.objects.filter(
		job=job,
		status__in=['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
	).select_related('employee').order_by('-isPrimaryContact', 'assignedAt')
	
	employees = []
	for assignment in assignments:
		emp = assignment.employee
		employees.append({
			'assignment_id': assignment.assignmentID,
			'employee_id': emp.employeeID,
			'name': emp.name,
			'email': emp.email,
			'role': emp.role,
			'avatar': emp.avatar,
			'rating': float(emp.rating) if emp.rating else None,
			'is_primary_contact': assignment.isPrimaryContact,
			'status': assignment.status,
			'assigned_at': assignment.assignedAt.isoformat(),
			'marked_complete': assignment.employeeMarkedComplete,
			'marked_complete_at': assignment.employeeMarkedCompleteAt.isoformat() if assignment.employeeMarkedCompleteAt else None,
		})
	
	return {
		'job_id': job.jobID,
		'job_title': job.title,
		'total_assigned': len(employees),
		'employees': employees
	}


def set_primary_contact(
	agency_account,
	job_id: int,
	employee_id: int
) -> dict:
	"""
	Change the primary contact for a job.
	
	Args:
		agency_account: The authenticated agency account
		job_id: ID of the job
		employee_id: ID of the employee to make primary contact
	
	Returns:
		dict with success status
	"""
	from accounts.models import Job, JobEmployeeAssignment, JobLog
	from django.db import transaction
	
	try:
		agency = AgencyProfile.objects.get(accountFK=agency_account)
	except AgencyProfile.DoesNotExist:
		raise ValueError("Agency account not found")
	
	# Get job
	try:
		job = Job.objects.get(jobID=job_id)
	except Job.DoesNotExist:
		raise ValueError(f"Job {job_id} not found")
	
	# Verify job belongs to this agency
	if job.assignedAgencyFK != agency:
		raise ValueError("This job is not assigned to your agency")
	
	# Find the assignment
	try:
		new_primary = JobEmployeeAssignment.objects.select_related('employee').get(
			job=job,
			employee_id=employee_id,
			status__in=['ASSIGNED', 'IN_PROGRESS']
		)
	except JobEmployeeAssignment.DoesNotExist:
		raise ValueError(f"Employee {employee_id} is not assigned to this job")
	
	if new_primary.isPrimaryContact:
		return {
			'success': True,
			'message': f'{new_primary.employee.name} is already the primary contact',
			'job_id': job.jobID
		}
	
	with transaction.atomic():
		# Remove primary from current
		JobEmployeeAssignment.objects.filter(
			job=job,
			isPrimaryContact=True
		).update(isPrimaryContact=False)
		
		# Set new primary
		new_primary.isPrimaryContact = True
		new_primary.save()
		
		# Update legacy field
		job.assignedEmployeeID = new_primary.employee
		job.save()
	
	# Create log
	JobLog.objects.create(
		jobID=job,
		notes=f"Primary contact changed to: {new_primary.employee.name}",
		changedBy=agency_account,
		oldStatus=job.status,
		newStatus=job.status
	)
	
	return {
		'success': True,
		'message': f'{new_primary.employee.name} is now the primary contact',
		'job_id': job.jobID,
		'primary_contact': {
			'employee_id': new_primary.employee.employeeID,
			'name': new_primary.employee.name
		}
	}


def get_agency_reviews(account_id: int, page: int = 1, limit: int = 10, review_type: str = None):
	"""
	Get reviews for an agency (includes both agency reviews and employee reviews).
	
	Args:
		account_id: The agency owner's account ID
		page: Page number (1-indexed)
		limit: Items per page
		review_type: Filter by type - 'AGENCY', 'EMPLOYEE', or None for all
	
	Returns:
		Dict with reviews, stats, and pagination info
	"""
	try:
		user = Accounts.objects.get(accountID=account_id)
		
		# Get the agency profile
		try:
			agency = AgencyProfile.objects.get(accountFK=user)
		except AgencyProfile.DoesNotExist:
			raise ValueError("Agency profile not found")
		
		# Get all agency employees
		employees = AgencyEmployee.objects.filter(agency=user)
		employee_ids = list(employees.values_list('employeeID', flat=True))
		
		# Get reviews where:
		# 1. revieweeAgencyID = this agency, OR
		# 2. revieweeEmployeeID is one of this agency's employees
		base_query = JobReview.objects.filter(
			Q(revieweeAgencyID=agency) | Q(revieweeEmployeeID__in=employee_ids)
		).select_related(
			'jobID', 
			'reviewerID', 
			'revieweeAgencyID', 
			'revieweeEmployeeID'
		).order_by('-createdAt')
		
		# Apply review_type filter for pagination
		if review_type == 'AGENCY':
			reviews_query = base_query.filter(revieweeAgencyID=agency)
		elif review_type == 'EMPLOYEE':
			reviews_query = base_query.filter(revieweeEmployeeID__in=employee_ids)
		else:
			reviews_query = base_query
		
		total = reviews_query.count()
		
		# Calculate stats
		all_ratings = list(reviews_query.values_list('rating', flat=True))
		avg_rating = sum(float(r) for r in all_ratings) / len(all_ratings) if all_ratings else 0.0
		positive_count = sum(1 for r in all_ratings if float(r) >= 4.0)
		neutral_count = sum(1 for r in all_ratings if 3.0 <= float(r) < 4.0)
		negative_count = sum(1 for r in all_ratings if float(r) < 3.0)
		
		agency_reviews_count = reviews_query.filter(revieweeAgencyID=agency).count()
		employee_reviews_count = reviews_query.filter(revieweeEmployeeID__in=employee_ids).count()
		
		# Pagination
		start_idx = (page - 1) * limit
		end_idx = start_idx + limit
		reviews_page = reviews_query[start_idx:end_idx]
		
		# Build response
		reviews_data = []
		for review in reviews_page:
			# Get reviewer (client) info
			reviewer_profile = Profile.objects.filter(accountFK=review.reviewerID).first()
			client_name = f"{reviewer_profile.firstName} {reviewer_profile.lastName}" if reviewer_profile else "Unknown Client"
			client_avatar = reviewer_profile.profileImg if reviewer_profile else None
			
			# Determine review type and employee info
			if review.revieweeEmployeeID:
				review_type = "EMPLOYEE"
				employee_name = review.revieweeEmployeeID.name
				employee_id = review.revieweeEmployeeID.employeeID
			else:
				review_type = "AGENCY"
				employee_name = None
				employee_id = None
			
			reviews_data.append({
				"review_id": review.reviewID,
				"job_id": review.jobID.jobID,
				"job_title": review.jobID.title,
				"client_name": client_name,
				"client_avatar": client_avatar,
				"rating": float(review.rating) if review.rating else 0.0,
				"comment": review.comment,
				"created_at": review.createdAt,
				"review_type": review_type,
				"employee_name": employee_name,
				"employee_id": employee_id
			})
		
		total_pages = math.ceil(total / limit) if total > 0 else 1
		
		return {
			"success": True,
			"reviews": reviews_data,
			"stats": {
				"total_reviews": total,
				"average_rating": round(avg_rating, 2),
				"positive_reviews": positive_count,
				"neutral_reviews": neutral_count,
				"negative_reviews": negative_count,
				"agency_reviews_count": agency_reviews_count,
				"employee_reviews_count": employee_reviews_count
			},
			"total": total,
			"page": page,
			"limit": limit,
			"total_pages": total_pages
		}
	
	except Accounts.DoesNotExist:
		raise ValueError("User not found")
