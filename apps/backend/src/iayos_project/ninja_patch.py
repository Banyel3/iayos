"""
Monkey patch for Django Ninja UUID converter conflict with Django 5.x/6.x

Issue: Django Ninja 1.3.0 tries to register a UUID converter that Django 5.x/6.x already provides
       in DEFAULT_CONVERTERS (not REGISTERED_CONVERTERS). The check happens BEFORE calling
       the original register_converter, so we need to intercept and skip.

Solution: Check both DEFAULT_CONVERTERS and REGISTERED_CONVERTERS before registering

This must be imported BEFORE any Django apps are loaded (top of settings.py)
"""

from django.urls import converters


def patch_ninja_uuid_converter():
    """
    Patch Django's register_converter to prevent ValueError when a converter
    is already registered in either DEFAULT_CONVERTERS or REGISTERED_CONVERTERS.
    
    Django 5.x/6.x includes 'uuid' in DEFAULT_CONVERTERS, which Django Ninja
    tries to register again, causing: ValueError: Converter 'uuid' is already registered.
    """
    # Store original register_converter function
    original_register_converter = converters.register_converter
    
    # Track if we've already patched (prevent double-patching)
    if hasattr(converters.register_converter, '_ninja_patched'):
        print("[PATCH] Django Ninja UUID converter patch already applied")
        return
    
    def safe_register_converter(converter, type_name):
        """
        Wrapper that checks if converter exists in DEFAULT_CONVERTERS or 
        REGISTERED_CONVERTERS before attempting registration.
        """
        # Check DEFAULT_CONVERTERS (where Django 5.x/6.x puts 'uuid')
        if type_name in converters.DEFAULT_CONVERTERS:
            print(f"[PATCH] Skipping '{type_name}' - exists in DEFAULT_CONVERTERS")
            return
        
        # Check REGISTERED_CONVERTERS (custom converters)
        if type_name in converters.REGISTERED_CONVERTERS:
            print(f"[PATCH] Skipping '{type_name}' - exists in REGISTERED_CONVERTERS")
            return
        
        # Not registered anywhere, proceed with registration
        try:
            return original_register_converter(converter, type_name)
        except ValueError as e:
            if "already registered" in str(e):
                # Fallback: silently skip if somehow still fails
                print(f"[PATCH] Fallback skip for '{type_name}': {e}")
                return
            raise
    
    # Mark as patched to prevent double-patching
    safe_register_converter._ninja_patched = True
    
    # Replace with safe version
    converters.register_converter = safe_register_converter
    
    print("[PATCH] Django Ninja UUID converter patch applied successfully")


# Apply patch immediately on import
patch_ninja_uuid_converter()
