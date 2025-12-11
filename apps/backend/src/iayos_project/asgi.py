"""
ASGI config for iayos_project project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os


def patch_ninja_converters():
    """
    Patch Django URL converters to prevent Django Ninja UUID registration conflict.
    Must be called BEFORE Django setup.
    """
    from django.urls import converters
    
    # Store original function
    original_register = converters.register_converter
    
    def safe_register_converter(converter, type_name):
        """Skip registration if converter already exists"""
        if type_name in converters.get_converters():
            return  # Already registered, skip silently
        return original_register(converter, type_name)
    
    # Replace with safe version
    converters.register_converter = safe_register_converter


# Apply patch BEFORE Django setup
patch_ninja_converters()

# CRITICAL: Set Django settings BEFORE any Django imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')

# Initialize Django ASGI application early to ensure settings are loaded
import django
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from profiles.middleware import SessionAuthMiddleware
from profiles.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": SessionAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})



