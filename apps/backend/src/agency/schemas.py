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


# Agency Chat/Messaging Schemas

class AgencyConversationJobSchema(Schema):
	"""Job info within a conversation"""
	id: int
	title: str
	status: str
	budget: float
	location: str
	workerMarkedComplete: bool
	clientMarkedComplete: bool
	workerReviewed: bool
	clientReviewed: bool
	assignedEmployeeId: Optional[int]
	assignedEmployeeName: Optional[str]


class AgencyConversationParticipantSchema(Schema):
	"""Other participant info"""
	name: str
	avatar: Optional[str]
	profile_type: str
	city: Optional[str]
	job_title: Optional[str]


class AgencyConversationSchema(Schema):
	"""Schema for a single agency conversation"""
	id: int
	job: AgencyConversationJobSchema
	client: AgencyConversationParticipantSchema
	assigned_employee: Optional[LeaderboardEmployeeSchema]
	last_message: Optional[str]
	last_message_time: Optional[datetime]
	unread_count: int
	is_archived: bool
	status: str
	created_at: datetime


class AgencyConversationsResponse(Schema):
	"""Response for agency conversations list"""
	success: bool
	conversations: List[AgencyConversationSchema]
	total: int


class AgencyMessageSchema(Schema):
	"""Schema for a single message"""
	message_id: int
	sender_name: str
	sender_avatar: Optional[str]
	message_text: str
	message_type: str
	is_read: bool
	created_at: datetime
	is_mine: bool
	sent_by_agency: bool


class AgencyConversationDetailSchema(Schema):
	"""Detailed conversation with messages"""
	conversation_id: int
	job: AgencyConversationJobSchema
	client: AgencyConversationParticipantSchema
	assigned_employee: Optional[LeaderboardEmployeeSchema]
	messages: List[AgencyMessageSchema]
	total_messages: int
	status: str


class AgencySendMessageSchema(Schema):
	"""Schema for sending a message"""
	message_text: str
	message_type: str = "TEXT"

