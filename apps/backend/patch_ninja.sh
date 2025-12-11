#!/bin/sh
# Patch Django Ninja UUID converter conflict with Django 5.x
# This script modifies the ninja package to skip UUID registration if already exists

echo "[PATCH] Applying Django Ninja UUID converter fix..."

NINJA_FILE="/usr/local/lib/python3.12/site-packages/ninja/signature/utils.py"

if [ ! -f "$NINJA_FILE" ]; then
    echo "[PATCH] ERROR: Django Ninja utils.py not found at $NINJA_FILE"
    exit 1
fi

# Create backup
cp "$NINJA_FILE" "${NINJA_FILE}.bak"

# Use Python to do the patch reliably with correct indentation
python3 << 'EOF'
import re

NINJA_FILE = "/usr/local/lib/python3.12/site-packages/ninja/signature/utils.py"

with open(NINJA_FILE, 'r') as f:
    content = f.read()

# Find and replace the register_converter line (around line 96)
old_code = 'register_converter(NinjaUUIDConverter, "uuid")'
new_code = '''try:
    register_converter(NinjaUUIDConverter, "uuid")
except ValueError:
    # UUID converter already registered by Django 5.x
    pass'''

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(NINJA_FILE, 'w') as f:
        f.write(content)
    print("[PATCH] Successfully patched Django Ninja UUID converter registration")
else:
    print("[PATCH] WARNING: Could not find target code to patch")
    print("[PATCH] Django Ninja may have been updated or already patched")
EOF

echo "[PATCH] Django Ninja patch complete"
