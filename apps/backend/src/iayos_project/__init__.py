"""
Django Ninja UUID Converter Patch - Applied at Package Import
This MUST run before any Django app imports ninja or ninja_extra.
"""
import sys

# Apply patch before ANY Django imports
if not hasattr(sys, '_iayos_converter_patched'):
    from django.urls import converters
    
    _original_register = converters.register_converter
    
    def idempotent_register_converter(converter, type_name):
        """Register converter only if not already present - prevents double registration errors."""
        try:
            existing = converters.get_converters()
            if type_name in existing:
                # Already registered - skip silently
                return
        except Exception:
            # Fallback: try to register and catch ValueError
            pass
        
        try:
            _original_register(converter, type_name)
        except ValueError as e:
            if "already registered" in str(e):
                # Ignore - converter exists
                pass
            else:
                raise
    
    # Apply patch globally
    converters.register_converter = idempotent_register_converter
    sys._iayos_converter_patched = True
