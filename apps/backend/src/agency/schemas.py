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


# Agency Phase 2 - Employee Management Schemas

class UpdateEmployeeRatingSchema(Schema):
	"""Schema for updating employee rating"""
	rating: float
	reason: Optional[str] = None


class UpdateEmployeeRatingResponse(Schema):
	"""Response for rating update"""
	success: bool
	message: str
	employeeId: int
	rating: float
	lastRatingUpdate: str


class SetEmployeeOfMonthSchema(Schema):
	"""Schema for setting Employee of the Month"""
	reason: str


class SetEmployeeOfMonthResponse(Schema):
	"""Response for EOTM update"""
	success: bool
	message: str
	employeeId: int
	employeeOfTheMonth: bool
	employeeOfTheMonthDate: Optional[str]
	employeeOfTheMonthReason: str


class EmployeePerformanceResponse(Schema):
	"""Employee performance statistics"""
	employeeId: int
	name: str
	email: str
	role: str
	avatar: Optional[str]
	rating: Optional[float]
	totalJobsCompleted: int
	totalEarnings: float
	isActive: bool
	employeeOfTheMonth: bool
	employeeOfTheMonthDate: Optional[str]
	employeeOfTheMonthReason: str
	lastRatingUpdate: Optional[str]
	jobsHistory: List[dict]


class LeaderboardEmployeeSchema(Schema):
	"""Schema for employee in leaderboard"""
	employeeId: int
	name: str
	email: str
	role: str
	avatar: Optional[str]
	rating: Optional[float]
	totalJobsCompleted: int
	totalEarnings: float
	employeeOfTheMonth: bool
	rank: int


class EmployeeLeaderboardResponse(Schema):
	"""Response for employee leaderboard"""
	employees: List[LeaderboardEmployeeSchema]
	sortBy: str
	totalCount: int

