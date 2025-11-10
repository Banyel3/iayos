from .models import AgencyKYC, AgencyKycFile, AgencyEmployee
from accounts.models import Accounts, Agency as AgencyProfile, Profile, Job, Notification
from iayos_project.utils import upload_agency_doc
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
import uuid
import os


def upload_agency_kyc(payload, business_permit, rep_front, rep_back, address_proof, auth_letter):
	"""Handle file uploads for agency KYC submissions."""
	try:
		user = Accounts.objects.get(accountID=payload.accountID)

		files_map = {
			'BUSINESS_PERMIT': business_permit,
			'REP_ID_FRONT': rep_front,
			'REP_ID_BACK': rep_back,
			'ADDRESS_PROOF': address_proof,
			'AUTH_LETTER': auth_letter,
		}

		allowed_mime_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
		max_size = 15 * 1024 * 1024  # 15 MB (frontend allowed)

		# Get or create AgencyKYC
		kyc_record, created = AgencyKYC.objects.get_or_create(
			accountFK=user,
			defaults={'status': 'PENDING', 'notes': ''}
		)

		if not created:
			# Remove previous files and reset status
			AgencyKycFile.objects.filter(agencyKyc=kyc_record).delete()
			kyc_record.status = 'PENDING'
			kyc_record.notes = 'Re-submitted'
			kyc_record.save()

		uploaded_files = []

		for key, file in files_map.items():
			if not file:
				continue

			if file.content_type not in allowed_mime_types:
				raise ValueError(f"{key}: Invalid file type")

			if file.size > max_size:
				raise ValueError(f"{key}: File too large")

			ext = os.path.splitext(file.name)[1]
			unique_name = f"{key.lower()}_{uuid.uuid4().hex}{ext}"

			file_url = upload_agency_doc(file=file, file_name=unique_name, user_id=user.accountID)

			# Defensive: ensure fileType is a valid choice (should be all-caps, matches FileType)
			valid_types = {c[0] for c in AgencyKycFile.FileType.choices}
			if key not in valid_types:
				raise ValueError(f"{key} is not a valid fileType. Valid: {valid_types}")
			AgencyKycFile.objects.create(
				agencyKyc=kyc_record,
				fileType=key,  # must match FileType choices
				fileURL=file_url,
				fileName=unique_name,
				fileSize=file.size
			)

			uploaded_files.append({
				"file_type": key.lower(),
				"file_url": file_url,
				"file_name": unique_name,
				"file_size": file.size
			})

		return {
			"message": "Agency KYC uploaded successfully",
			"agency_kyc_id": kyc_record.agencyKycID,
			"files": uploaded_files
		}

	except Accounts.DoesNotExist:
		raise ValueError("User not found")
	except Exception as e:
		print(f"Agency KYC upload error: {str(e)}")
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


def create_agency_kyc_from_paths(account_id: int, file_map: dict, businessName: str = None, businessDesc: str = None):
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
	"""Fetch all employees for a given agency account."""
	try:
		user = Accounts.objects.get(accountID=account_id)
		employees = AgencyEmployee.objects.filter(agency=user)
		
		return [
			{
				"id": emp.employeeID,
				"name": emp.name,
				"email": emp.email,
				"role": emp.role,
				"avatar": emp.avatar,
				"rating": float(emp.rating) if emp.rating else None,
			}
			for emp in employees
		]
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

def get_agency_jobs(account_id, status_filter=None, page=1, limit=20):
	"""
	Get all jobs assigned to this agency (where assignedAgencyFK = this agency).
	
	Args:
		account_id: Agency's account ID
		status_filter: Optional status filter (ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED)
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
		
		# Get total count
		total_count = Job.objects.filter(query).count()
		
		# Calculate pagination
		offset = (page - 1) * limit
		total_pages = (total_count + limit - 1) // limit  # Ceiling division
		
		# Get jobs with related data
		jobs = Job.objects.filter(query).select_related(
			'clientID',
			'clientID__profileID',
			'categoryID'
		).order_by('-createdAt')[offset:offset + limit]
		
		# Format response
		jobs_data = []
		for job in jobs:
			# Get client info
			client_profile = job.clientID.profileID
			
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
				'client': {
					'id': client_profile.accountFK.accountID,
					'name': f"{client_profile.firstName} {client_profile.lastName}",
					'avatar': client_profile.profilePicture,
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
