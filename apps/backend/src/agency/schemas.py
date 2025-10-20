from ninja import Schema
from typing import Optional, List
from datetime import datetime


class AgencyKYCUploadSchema(Schema):
	accountID: int
	businessName: Optional[str] = None
	businessDesc: Optional[str] = None


class AgencyKYCUploadResponse(Schema):
	message: str
	agency_kyc_id: int
	files: List[dict]


class AgencyKYCStatusResponse(Schema):
	agency_kyc_id: int
	status: str
	notes: Optional[str]
	reviewed_at: Optional[datetime]
	submitted_at: Optional[datetime]
	files: List[dict]

