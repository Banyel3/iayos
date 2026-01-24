#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

# CRITICAL: Patch Django Ninja UUID converter BEFORE any Django imports
# This must run at module level, not inside main()
from django.urls import converters

# Store original function
_original_register = converters.register_converter

def _safe_register_converter(converter, type_name):
    """Skip registration if converter already exists (prevents Django Ninja conflict)"""
    if type_name in converters.get_converters():
        print(f"[PATCH] Skipping duplicate registration of '{type_name}' converter")
        return  # Already registered, skip silently
    print(f"[PATCH] Registering new '{type_name}' converter")
    return _original_register(converter, type_name)

# Apply patch immediately
converters.register_converter = _safe_register_converter
print("[PATCH] Django Ninja UUID converter patch applied successfully")


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'iayos_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
