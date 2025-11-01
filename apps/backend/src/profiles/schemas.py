from ninja import Schema
from typing import Optional
from datetime import datetime


class DepositFundsSchema(Schema):
    amount: float
    payment_method: str = "GCASH"


class ProductCreateSchema(Schema):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None


class ProductSchema(Schema):
    productID: int
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    createdAt: str
    updatedAt: str


# Chat Schemas
class SendMessageSchema(Schema):
    """Schema for sending a new message within an existing conversation"""
    conversation_id: int
    message_text: str
    message_type: Optional[str] = "TEXT"


class MessageResponseSchema(Schema):
    """Schema for a single message"""
    id: int
    sender_id: int
    sender_name: str
    sender_avatar: Optional[str]
    message_text: str
    message_type: str
    is_read: bool
    created_at: datetime
    is_mine: bool  # Whether the current user sent this message


class ConversationParticipantSchema(Schema):
    """Schema for conversation participant info"""
    profile_id: int
    name: str
    avatar: Optional[str]
    profile_type: str
    city: Optional[str]


class ConversationSchema(Schema):
    """Schema for a conversation in the list"""
    id: int
    other_participant: ConversationParticipantSchema
    last_message: Optional[str]
    last_message_time: Optional[datetime]
    last_message_sender_id: Optional[int]
    unread_count: int
    created_at: datetime


class MarkAsReadSchema(Schema):
    """Schema for marking messages as read"""
    conversation_id: int
    message_id: Optional[int] = None  # If provided, mark up to this message
