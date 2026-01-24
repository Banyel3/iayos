"""
Monkey patch for Django Ninja UUID converter conflict with Django 5.x

Issue: Django Ninja 1.3.0 tries to register a UUID converter that Django 5.x already provides
Solution: Patch register_converter to silently skip already-registered converters

This must be imported BEFORE any Django apps are loaded (top of settings.py)
"""

from django.urls import converters


def patch_ninja_uuid_converter():
    """
    Patch Django's register_converter to prevent ValueError when a converter
    is already registered. This fixes the conflict between Django 5.x's
    built-in UUID converter and Django Ninja's attempt to register its own.
    """
    # Store original register_converter function
    original_register_converter = converters.register_converter
    
    # Track if we've already patched (prevent double-patching)
    if hasattr(original_register_converter, '_ninja_patched'):
        print("[PATCH] Django Ninja UUID converter patch already applied")
        return
    
    def safe_register_converter(converter, type_name):
        """
        Wrapper that catches ValueError for already-registered converters
        and silently skips them instead of raising an error.
        """
        try:
            return original_register_converter(converter, type_name)
        except ValueError as e:
            if "already registered" in str(e):
                # Silently skip - converter already exists
                print(f"[PATCH] Skipping already registered converter: {type_name}")
                return
            # Re-raise other ValueErrors
            raise
    
    # Mark as patched to prevent double-patching
    safe_register_converter._ninja_patched = True
    
    # Replace with safe version
    converters.register_converter = safe_register_converter
    
    print("[PATCH] Django Ninja UUID converter patch applied successfully")


# Apply patch immediately on import
patch_ninja_uuid_converter()
