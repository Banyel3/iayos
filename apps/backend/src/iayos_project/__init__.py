"""
Fix for Django Ninja UUID converter conflict with Django 5.x/6.x

This runs at package import time - BEFORE any app imports ninja or ninja_extra.

Solution: Remove 'uuid' from DEFAULT_CONVERTERS so Django Ninja can register its version.
"""
import sys

# Only apply once per Python process
if not hasattr(sys, '_iayos_uuid_patched'):
    from django.urls import converters
    
    if 'uuid' in converters.DEFAULT_CONVERTERS:
        # Remove Django's built-in UUID converter
        converters.DEFAULT_CONVERTERS.pop('uuid')
        
        # Clear cache so get_converters() reflects the change
        converters.get_converters.cache_clear()
    
    sys._iayos_uuid_patched = True
