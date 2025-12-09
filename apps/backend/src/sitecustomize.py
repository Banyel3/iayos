"""
sitecustomize.py - Automatically executed by Python on startup
Used to patch Django Ninja UUID converter conflict with Django 5.x
"""

import sys


def patch_django_converters():
    """
    Monkey patch django.urls.converters.register_converter to prevent
    Django Ninja from registering UUID converter that Django already has.
    
    This must execute before any Django or Ninja imports.
    """
    # Only patch once
    if hasattr(sys, '_django_ninja_patched'):
        return
    
    try:
        from django.urls import converters
        
        # Store original
        _original_register = converters.register_converter
        
        def patched_register_converter(converter, type_name):
            """Safe wrapper that prevents duplicate registrations"""
            # Check if already registered
            existing = converters.get_converters()
            if type_name in existing:
                # Silently skip duplicate registration
                print(f"[PATCH] Skipped duplicate converter registration: {type_name}")
                return
            
            # Register new converter
            return _original_register(converter, type_name)
        
        # Apply patch
        converters.register_converter = patched_register_converter
        sys._django_ninja_patched = True
        print("[PATCH] Django Ninja UUID converter patch applied successfully")
        
    except ImportError:
        # Django not installed yet, patch will be applied later
        pass


# Apply patch immediately when Python loads this module
patch_django_converters()
