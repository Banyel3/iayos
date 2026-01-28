"""
sitecustomize.py - Automatically executed by Python on startup
Used to patch Django Ninja UUID converter conflict with Django 5.x
"""

import sys


def patch_django_converters():
    """
    Monkey patch django.urls.converters.register_converter to prevent
    Django Ninja from registering a UUID converter that Django already has.
    Runs at interpreter startup via sitecustomize so it precedes all imports.
    """
    # Only patch once
    if hasattr(sys, "_django_ninja_patched"):
        return

    try:
        from django import urls
        from django.urls import converters

        _original_register = converters.register_converter

        def patched_register_converter(converter, type_name):
            """Safe wrapper that ignores duplicate converter registration"""
            try:
                return _original_register(converter, type_name)
            except ValueError as exc:
                if "already registered" in str(exc):
                    print(f"[SITEPATCH] Skipping already registered converter: {type_name}")
                    return
                raise

        # Patch both django.urls.converters and django.urls module-level reference
        converters.register_converter = patched_register_converter
        urls.register_converter = patched_register_converter
        sys._django_ninja_patched = True
        print("[SITEPATCH] Django URL converter patch applied at startup")

    except ImportError:
        # Django not installed yet; nothing to patch
        pass


# Apply patch immediately when Python loads this module
patch_django_converters()
