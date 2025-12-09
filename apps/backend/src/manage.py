#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


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


def main():
    """Run administrative tasks."""
    # Apply patch BEFORE setting Django settings module
    patch_ninja_converters()
    
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
