from decimal import Decimal

from django.db import migrations, models


def sanitize_wallet_balances(apps, schema_editor):
    Wallet = apps.get_model('accounts', 'Wallet')

    changed = 0
    for wallet in Wallet.objects.all().iterator():
        original_balance = wallet.balance
        original_reserved = wallet.reservedBalance
        original_pending = wallet.pendingEarnings

        balance = original_balance if original_balance is not None else Decimal('0.00')
        reserved = original_reserved if original_reserved is not None else Decimal('0.00')
        pending = original_pending if original_pending is not None else Decimal('0.00')

        if balance < Decimal('0.00'):
            balance = Decimal('0.00')
        if reserved < Decimal('0.00'):
            reserved = Decimal('0.00')
        if pending < Decimal('0.00'):
            pending = Decimal('0.00')
        if reserved > balance:
            reserved = balance

        if (
            balance != original_balance
            or reserved != original_reserved
            or pending != original_pending
        ):
            wallet.balance = balance
            wallet.reservedBalance = reserved
            wallet.pendingEarnings = pending
            wallet.save(update_fields=['balance', 'reservedBalance', 'pendingEarnings', 'updatedAt'])
            changed += 1

    print(f"[Migration 0110] Sanitized {changed} wallet rows before constraints")


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0109_daily_attendance_absent_penalty_fields'),
    ]

    operations = [
        migrations.RunPython(sanitize_wallet_balances, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='wallet',
            constraint=models.CheckConstraint(
                condition=models.Q(balance__gte=Decimal('0.00')),
                name='wallet_balance_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='wallet',
            constraint=models.CheckConstraint(
                condition=models.Q(reservedBalance__gte=Decimal('0.00')),
                name='wallet_reserved_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='wallet',
            constraint=models.CheckConstraint(
                condition=models.Q(pendingEarnings__gte=Decimal('0.00')),
                name='wallet_pending_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='wallet',
            constraint=models.CheckConstraint(
                condition=models.Q(balance__gte=models.F('reservedBalance')),
                name='wallet_balance_gte_reserved',
            ),
        ),
    ]
