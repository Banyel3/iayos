"""
Agora RTC Token Generator for Voice Calling

Based on Agora's AccessToken2 specification:
https://github.com/AgoraIO/Tools/tree/master/DynamicKey/AgoraDynamicKey/python3

This module generates tokens for Agora Voice SDK authentication.
Tokens are valid for up to 24 hours and include channel-specific permissions.
"""

import os
import time
import hmac
import base64
import struct
import zlib
from hashlib import sha256
from enum import IntEnum


class ServiceType(IntEnum):
    RTC = 1
    RTM = 2
    FPA = 4
    CHAT = 5


class PrivilegeType(IntEnum):
    # RTC Privileges
    JOIN_CHANNEL = 1
    PUBLISH_AUDIO_STREAM = 2
    PUBLISH_VIDEO_STREAM = 3
    PUBLISH_DATA_STREAM = 4


class Role(IntEnum):
    """
    User roles for Agora RTC.
    - PUBLISHER: Can publish and subscribe to streams
    - SUBSCRIBER: Can only subscribe to streams (audience)
    """
    PUBLISHER = 1
    SUBSCRIBER = 2


def _pack_uint16(value: int) -> bytes:
    return struct.pack('<H', value)


def _pack_uint32(value: int) -> bytes:
    return struct.pack('<I', value)


def _pack_string(value: str) -> bytes:
    encoded = value.encode('utf-8')
    return _pack_uint16(len(encoded)) + encoded


def _pack_map_uint32(data: dict) -> bytes:
    result = _pack_uint16(len(data))
    for k, v in data.items():
        result += _pack_uint16(k) + _pack_uint32(v)
    return result


class Service:
    """Base class for Agora services"""
    
    def __init__(self, service_type: ServiceType):
        self.type = service_type
        self.privileges = {}
    
    def add_privilege(self, privilege: int, expire: int):
        self.privileges[privilege] = expire
    
    def pack(self) -> bytes:
        return _pack_uint16(self.type) + _pack_map_uint32(self.privileges)


class ServiceRtc(Service):
    """RTC Service for voice/video calling"""
    
    def __init__(self, channel_name: str = "", uid: int = 0):
        super().__init__(ServiceType.RTC)
        self.channel_name = channel_name
        self.uid = str(uid) if uid != 0 else ""
    
    def pack(self) -> bytes:
        return (
            _pack_uint16(self.type) +
            _pack_map_uint32(self.privileges) +
            _pack_string(self.channel_name) +
            _pack_string(self.uid)
        )


class AccessToken:
    """
    Agora AccessToken2 generator.
    
    AccessToken2 is the latest token format supporting multiple services
    and fine-grained privilege control.
    """
    
    VERSION = "007"
    VERSION_LENGTH = 3
    
    def __init__(self, app_id: str, app_certificate: str, issue_ts: int = 0, expire: int = 900):
        self.app_id = app_id
        self.app_certificate = app_certificate
        self.issue_ts = issue_ts or int(time.time())
        self.expire = expire
        self.salt = int(time.time() * 1000) % 100000000
        self.services = {}
    
    def add_service(self, service: Service):
        self.services[service.type] = service
    
    def _pack_services(self) -> bytes:
        result = _pack_uint16(len(self.services))
        for _, service in self.services.items():
            result += service.pack()
        return result
    
    def _sign(self, data: bytes) -> bytes:
        return hmac.new(self.app_certificate.encode(), data, sha256).digest()
    
    def build(self) -> str:
        # Pack message
        message = (
            _pack_uint32(self.salt) +
            _pack_uint32(self.issue_ts) +
            _pack_uint32(self.expire) +
            self._pack_services()
        )
        
        # Sign
        sign_key = self._sign(_pack_uint32(self.issue_ts))
        sign_key = self._sign(_pack_uint32(self.salt), ) if False else hmac.new(sign_key, _pack_uint32(self.salt), sha256).digest()
        signature = hmac.new(sign_key, message, sha256).digest()
        
        # Compress and encode
        content = (
            _pack_string(self.app_id) +
            _pack_uint32(self.issue_ts) +
            _pack_uint32(self.expire) +
            _pack_uint32(self.salt) +
            _pack_uint16(len(signature)) + signature +
            message
        )
        compressed = zlib.compress(content)
        
        return self.VERSION + base64.b64encode(compressed).decode()


def build_token_with_uid(
    app_id: str,
    app_certificate: str,
    channel_name: str,
    uid: int,
    role: Role = Role.PUBLISHER,
    token_expire_seconds: int = 3600,
    privilege_expire_seconds: int = 3600
) -> str:
    """
    Generate an RTC token for voice/video calling.
    
    Args:
        app_id: Agora App ID
        app_certificate: Agora App Certificate
        channel_name: Name of the channel to join
        uid: User ID (use 0 for auto-assign)
        role: PUBLISHER (can send/receive) or SUBSCRIBER (receive only)
        token_expire_seconds: Token validity in seconds (max 24 hours)
        privilege_expire_seconds: Privilege validity in seconds
    
    Returns:
        Token string for Agora SDK authentication
    """
    current_ts = int(time.time())
    privilege_expire_ts = current_ts + privilege_expire_seconds
    
    token = AccessToken(
        app_id=app_id,
        app_certificate=app_certificate,
        issue_ts=current_ts,
        expire=token_expire_seconds
    )
    
    rtc_service = ServiceRtc(channel_name=channel_name, uid=uid)
    rtc_service.add_privilege(PrivilegeType.JOIN_CHANNEL, privilege_expire_ts)
    
    if role == Role.PUBLISHER:
        rtc_service.add_privilege(PrivilegeType.PUBLISH_AUDIO_STREAM, privilege_expire_ts)
        rtc_service.add_privilege(PrivilegeType.PUBLISH_VIDEO_STREAM, privilege_expire_ts)
        rtc_service.add_privilege(PrivilegeType.PUBLISH_DATA_STREAM, privilege_expire_ts)
    
    token.add_service(rtc_service)
    
    return token.build()


def generate_call_token(conversation_id: int, user_id: int) -> dict:
    """
    Generate a token for a voice call within a conversation.
    
    Args:
        conversation_id: The conversation ID (used as channel name)
        user_id: The user's account ID
    
    Returns:
        Dict with token, channel_name, uid, and app_id
    """
    app_id = os.environ.get('AGORA_APP_ID', '')
    app_certificate = os.environ.get('AGORA_APP_CERTIFICATE', '')
    
    if not app_id or not app_certificate:
        raise ValueError("AGORA_APP_ID and AGORA_APP_CERTIFICATE must be set")
    
    # Use conversation ID as channel name for unique call channels
    channel_name = f"iayos_call_{conversation_id}"
    
    # Generate token with 1 hour expiry
    token = build_token_with_uid(
        app_id=app_id,
        app_certificate=app_certificate,
        channel_name=channel_name,
        uid=user_id,
        role=Role.PUBLISHER,
        token_expire_seconds=3600,
        privilege_expire_seconds=3600
    )
    
    return {
        "token": token,
        "channel_name": channel_name,
        "uid": user_id,
        "app_id": app_id
    }
