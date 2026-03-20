from django.db import migrations


def drop_legacy_primary_skill_constraint(apps, schema_editor):
    """
    Some environments still carry a legacy DB-level uniqueness constraint that
    allows only one PRIMARY skill per worker. Remove it safely if present.
    """
    connection = schema_editor.connection
    table_name = "accounts_workerspecialization"
    legacy_name = "unique_primary_skill_per_worker"

    with connection.cursor() as cursor:
        constraints = connection.introspection.get_constraints(cursor, table_name)
        if legacy_name not in constraints:
            return

        quoted_table = schema_editor.quote_name(table_name)
        quoted_name = schema_editor.quote_name(legacy_name)

        if connection.vendor == "postgresql":
            # Depending on how it was created, it may exist as a constraint and/or index.
            cursor.execute(
                f"ALTER TABLE {quoted_table} DROP CONSTRAINT IF EXISTS {quoted_name}"
            )
            cursor.execute(f"DROP INDEX IF EXISTS {quoted_name}")
            return

        # SQLite/MySQL fallback: try index form first, then constraint form.
        try:
            cursor.execute(f"DROP INDEX IF EXISTS {quoted_name}")
        except Exception:
            pass

        try:
            cursor.execute(
                f"ALTER TABLE {quoted_table} DROP CONSTRAINT {quoted_name}"
            )
        except Exception:
            pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0121_job_shift_type"),
    ]

    operations = [
        migrations.RunPython(
            drop_legacy_primary_skill_constraint,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
