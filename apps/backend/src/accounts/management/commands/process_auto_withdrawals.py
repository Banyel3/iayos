"""
Django Management Command: process_auto_withdrawals

Creates automatic withdrawal requests for users with auto-withdraw enabled.
Run this command via cron job every Friday at 10:00 AM Philippines time:
    0 2 * * 5 cd /path/to/app && python manage.py process_auto_withdrawals

Features:
- Finds wallets with autoWithdrawEnabled=True and balance >= ₱100
- Creates PENDING withdrawal transactions (admin processes manually)
- Skips wallets without valid payment method (and notifies user)
- Does NOT call Xendit/PayMongo disbursement (admin processes manually)
- Logs all actions for audit trail
- Supports --dry-run mode for testing

Usage:
    python manage.py process_auto_withdrawals              # Process all eligible
    python manage.py process_auto_withdrawals --dry-run    # Preview without processing
    python manage.py process_auto_withdrawals --verbose    # Show detailed output
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db import transaction
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create automatic withdrawal requests for users with auto-withdraw enabled (every Friday)'
    
    # Minimum balance required for auto-withdrawal (in PHP)
    MIN_AUTO_WITHDRAW_AMOUNT = Decimal('100.00')

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview withdrawals without actually processing them',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output for each wallet processed',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=500,
            help='Maximum number of wallets to process in one run (default: 500)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force run even if not Friday (for testing)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verbose = options['verbose']
        limit = options['limit']
        force = options['force']
        
        now = timezone.now()
        
        # Check if it's Friday (weekday 4 = Friday, 0 = Monday)
        if not force and now.weekday() != 4:
            self.stdout.write(self.style.WARNING(
                f"Today is not Friday (day {now.weekday()}). Use --force to run anyway."
            ))
            return
        
        self.stdout.write(self.style.NOTICE(
            f"{'[DRY RUN] ' if dry_run else ''}Starting auto-withdrawal job at {now.strftime('%Y-%m-%d %H:%M:%S')}"
        ))
        
        try:
            from accounts.models import Wallet, Transaction, Notification, UserPaymentMethod
            
            # Find eligible wallets
            eligible_wallets = Wallet.objects.filter(
                autoWithdrawEnabled=True,
                balance__gte=self.MIN_AUTO_WITHDRAW_AMOUNT
            ).select_related(
                'accountFK',
                'preferredPaymentMethodID'
            )[:limit]
            
            if not eligible_wallets:
                self.stdout.write(self.style.SUCCESS(
                    "No wallets eligible for auto-withdrawal."
                ))
                return
            
            self.stdout.write(f"Found {len(eligible_wallets)} wallet(s) eligible for auto-withdrawal.")
            
            processed_count = 0
            skipped_count = 0
            failed_count = 0
            total_amount = Decimal('0.00')
            
            for wallet in eligible_wallets:
                user = wallet.accountFK
                user_email = user.email
                
                if verbose:
                    self.stdout.write(f"\n  Processing wallet for: {user_email}")
                    self.stdout.write(f"    Balance: ₱{wallet.balance}")
                
                # Check for valid payment method
                payment_method = wallet.preferredPaymentMethodID
                if not payment_method:
                    # Try to find any active GCash payment method
                    payment_method = UserPaymentMethod.objects.filter(
                        accountFK=user,
                        methodType='GCASH'
                    ).first()
                
                if not payment_method:
                    # Skip and notify user
                    skipped_count += 1
                    if verbose:
                        self.stdout.write(self.style.WARNING(
                            f"    ⚠️ SKIPPED - No payment method found"
                        ))
                    
                    if not dry_run:
                        # Create notification for user
                        Notification.objects.create(
                            accountFK=user,
                            title="Auto-Withdrawal Skipped",
                            message=(
                                f"Your weekly auto-withdrawal of ₱{wallet.balance:.2f} was skipped because "
                                f"you don't have a GCash account set up. Please add a payment method."
                            ),
                            notificationType='PAYMENT'
                        )
                    continue
                
                withdraw_amount = wallet.balance
                
                if dry_run:
                    self.stdout.write(self.style.WARNING(
                        f"    [DRY RUN] Would create withdrawal request for ₱{withdraw_amount}"
                    ))
                    processed_count += 1
                    total_amount += withdraw_amount
                    continue
                
                # Create the withdrawal request (same logic as manual withdrawal)
                try:
                    with transaction.atomic():
                        # Deduct balance
                        wallet.balance -= withdraw_amount
                        wallet.lastAutoWithdrawAt = now
                        wallet.save()
                        
                        # Determine payment method display
                        if payment_method.methodType == 'GCASH':
                            method_display = f"GCash ({payment_method.accountNumber})"
                        else:
                            method_display = f"Bank ({payment_method.accountNumber})"
                        
                        # Create PENDING transaction
                        tx = Transaction.objects.create(
                            walletID=wallet,
                            transactionType=Transaction.TransactionType.WITHDRAWAL,
                            amount=withdraw_amount,
                            balanceAfter=wallet.balance,
                            status=Transaction.TransactionStatus.PENDING,
                            description=f"Auto-Withdrawal (Friday) to {method_display}",
                            paymentMethod=payment_method.methodType
                        )
                        
                        # Create notification for user
                        Notification.objects.create(
                            accountFK=user,
                            title="Auto-Withdrawal Request Created",
                            message=(
                                f"A withdrawal request for ₱{withdraw_amount:.2f} has been created "
                                f"and is pending admin approval. You will be notified when processed."
                            ),
                            notificationType='PAYMENT'
                        )
                        
                        processed_count += 1
                        total_amount += withdraw_amount
                        
                        if verbose:
                            self.stdout.write(self.style.SUCCESS(
                                f"    ✅ Created withdrawal request #{tx.transactionID} for ₱{withdraw_amount}"
                            ))
                
                except Exception as e:
                    failed_count += 1
                    self.stdout.write(self.style.ERROR(
                        f"    ❌ FAILED: {str(e)}"
                    ))
            
            # Summary
            self.stdout.write("\n" + "=" * 50)
            self.stdout.write(self.style.SUCCESS(
                f"{'[DRY RUN] ' if dry_run else ''}Auto-withdrawal job completed:"
            ))
            self.stdout.write(f"  ✅ Processed: {processed_count} withdrawal request(s)")
            self.stdout.write(f"  ⚠️ Skipped (no payment method): {skipped_count}")
            self.stdout.write(f"  ❌ Failed: {failed_count}")
            self.stdout.write(f"  💰 Total amount: ₱{total_amount:.2f}")
            
        except Exception as e:
            raise CommandError(f"Auto-withdrawal job failed: {str(e)}")
