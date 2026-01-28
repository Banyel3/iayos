"""
Fix for Django Ninja UUID converter conflict with Django 5.x/6.x

Issue: Django Ninja 1.3.0 tries to register a UUID converter, but Django 5.x/6.x 
       already has 'uuid' in DEFAULT_CONVERTERS. Django raises ValueError.

Solution: Remove 'uuid' from DEFAULT_CONVERTERS before Django Ninja loads.
          Django Ninja will register its version in REGISTERED_CONVERTERS.
          Both converters are functionally equivalent, so this is safe.

This must be imported BEFORE any Django apps are loaded (top of settings.py)
"""

from django.urls import converters


def patch_ninja_uuid_converter():
    """
    Remove 'uuid' from DEFAULT_CONVERTERS to prevent conflict with Django Ninja.
    
    Django Ninja will add its UUID converter to REGISTERED_CONVERTERS, which
    takes precedence over DEFAULT_CONVERTERS in get_converters().
    """
    if 'uuid' in converters.DEFAULT_CONVERTERS:
        # Store original for reference (in case needed later)
        _original_uuid_converter = converters.DEFAULT_CONVERTERS.pop('uuid')
        
        # Clear the get_converters cache so it picks up the change
        converters.get_converters.cache_clear()
        
        print(f"[PATCH] Removed 'uuid' from DEFAULT_CONVERTERS - Django Ninja can now register its version")
    else:
        print("[PATCH] 'uuid' not in DEFAULT_CONVERTERS - no action needed")


# Apply patch immediately on import
patch_ninja_uuid_converter()
