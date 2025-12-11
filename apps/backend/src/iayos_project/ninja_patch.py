"""
Monkey patch for Django Ninja UUID converter conflict with Django 5.x

Issue: Django Ninja 1.3.0 tries to register a UUID converter that Django 5.x already provides
Solution: Prevent ninja from registering the converter by checking if it already exists

This must be imported BEFORE ninja_extra in settings.py INSTALLED_APPS
"""

import sys
from django.urls import converters


def patch_ninja_uuid_converter():
    """
    Patch Django Ninja's UUID converter registration to prevent conflicts
    with Django 5.x's built-in UUID converter
    """
    # Only patch if ninja hasn't been imported yet
    if 'ninja.signature.utils' not in sys.modules:
        # Store original register_converter function
        original_register_converter = converters.register_converter
        
        def safe_register_converter(converter, *args, **kwargs):
            """
            Wrapper that prevents re-registration of existing converters
            """
            # Get converter name (first arg or 'name' kwarg)
            name = args[0] if args else kwargs.get('name')
            
            # Check if converter already registered
            if name and name in converters.get_converters():
                # Skip registration silently (already exists)
                return
            
            # Register new converter
            return original_register_converter(converter, *args, **kwargs)
        
        # Replace with safe version
        converters.register_converter = safe_register_converter
        
        print("[PATCH] Django Ninja UUID converter conflict resolved")


# Apply patch immediately on import
patch_ninja_uuid_converter()
