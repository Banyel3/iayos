"""Fix local SQLite schema for negotiation columns."""
import os, sys, django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
os.environ["DJANGO_SETTINGS_MODULE"] = "iayos_backend.settings"
django.setup()

from django.db import connection

cursor = connection.cursor()

# Check existing columns
cursor.execute("PRAGMA table_info(job_applications)")
cols = [row[1] for row in cursor.fetchall()]
print("Existing relevant columns:", [c for c in cols if "negoti" in c.lower() or "daily" in c.lower() or "proposed" in c.lower()])

# Add missing columns
alterations = []
if "negotiation_count" not in cols:
    alterations.append("ALTER TABLE job_applications ADD COLUMN negotiation_count INTEGER DEFAULT 0")
if "proposed_daily_rate" not in cols:
    alterations.append("ALTER TABLE job_applications ADD COLUMN proposed_daily_rate DECIMAL(10,2) NULL")
if "proposed_days" not in cols:
    alterations.append("ALTER TABLE job_applications ADD COLUMN proposed_days INTEGER NULL")

for sql in alterations:
    try:
        cursor.execute(sql)
        print(f"OK: {sql}")
    except Exception as e:
        print(f"SKIP ({e}): {sql}")

# Create price_negotiations table if missing
try:
    cursor.execute("SELECT 1 FROM price_negotiations LIMIT 1")
    print("price_negotiations table already exists")
except Exception:
    cursor.execute("""CREATE TABLE IF NOT EXISTS price_negotiations (
        negotiationID INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id BIGINT NOT NULL REFERENCES job_applications(applicationID) ON DELETE CASCADE,
        actor VARCHAR(10) NOT NULL,
        round_number INTEGER DEFAULT 0,
        proposed_budget DECIMAL(10,2) NOT NULL,
        proposed_daily_rate DECIMAL(10,2) NULL,
        proposed_days INTEGER NULL,
        message TEXT DEFAULT '',
        status VARCHAR(15) DEFAULT 'PENDING',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )""")
    cursor.execute("CREATE INDEX IF NOT EXISTS price_negot_applica_idx ON price_negotiations(application_id, createdAt)")
    print("Created price_negotiations table + index")

# Verify
cursor.execute("PRAGMA table_info(job_applications)")
cols_after = [row[1] for row in cursor.fetchall()]
print("negotiation_count present:", "negotiation_count" in cols_after)
print("proposed_daily_rate present:", "proposed_daily_rate" in cols_after)
print("proposed_days present:", "proposed_days" in cols_after)

# Fake the relevant migrations
from datetime import datetime
migrations_to_fake = [
    "0116_jobapplication_daily_rate_negotiation",
    "0119_price_negotiation",
]
for name in migrations_to_fake:
    cursor.execute("SELECT id FROM django_migrations WHERE app='accounts' AND name=%s", [name])
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO django_migrations (app, name, applied) VALUES (%s, %s, %s)",
            ["accounts", name, datetime.now().isoformat()],
        )
        print(f"Faked migration: {name}")
    else:
        print(f"Migration already recorded: {name}")

print("\nDone! Restart the backend server.")
