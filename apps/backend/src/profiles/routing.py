from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # NEW: Single user-level WebSocket for ALL conversations
    re_path(r'ws/inbox/$', consumers.InboxConsumer.as_asgi()),
    
    # Legacy: Per-conversation WebSocket (kept for backwards compatibility)
    re_path(r'ws/chat/(?P<conversation_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
    
    # Job status updates
    re_path(r'ws/job/(?P<job_id>\d+)/$', consumers.JobStatusConsumer.as_asgi()),
    
    # Voice call signaling
    re_path(r'ws/call/(?P<conversation_id>\d+)/$', consumers.CallConsumer.as_asgi()),
]
