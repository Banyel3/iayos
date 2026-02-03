# Generated manually for Daily Payment Model
# Migration: 0089_daily_payment_model

from django.db import migrations, models
from django.conf import settings
from decimal import Decimal


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0088_notification_profile_type'),
        ('agency', '0007_agencyemployee_name_breakdown_specializations'),
    ]

    operations = [
        # ============================================================
        # 1. Add daily_rate to WorkerProfile
        # ============================================================
        migrations.AddField(
            model_name='workerprofile',
            name='daily_rate',
            field=models.DecimalField(
                max_digits=10,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Worker's daily rate in PHP"
            ),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='is_available_daily_jobs',
            field=models.BooleanField(
                default=True,
                help_text="Whether worker accepts daily rate jobs"
            ),
        ),
        
        # ============================================================
        # 2. Add payment_model fields to Job
        # ============================================================
        migrations.AddField(
            model_name='job',
            name='payment_model',
            field=models.CharField(
                max_length=10,
                choices=[
                    ('PROJECT', 'Project-based (fixed budget)'),
                    ('DAILY', 'Daily rate (per day worked)'),
                ],
                default='PROJECT',
                help_text="Payment model: PROJECT = fixed budget, DAILY = per day worked"
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='duration_days',
            field=models.PositiveIntegerField(
                null=True,
                blank=True,
                help_text="Expected number of work days (for DAILY payment model)"
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='daily_rate_agreed',
            field=models.DecimalField(
                max_digits=10,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Agreed daily rate per worker (for DAILY payment model)"
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='actual_start_date',
            field=models.DateField(
                null=True,
                blank=True,
                help_text="Actual date when work started (for daily payment tracking)"
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='total_days_worked',
            field=models.PositiveIntegerField(
                default=0,
                help_text="Total days worked across all workers"
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='daily_escrow_total',
            field=models.DecimalField(
                max_digits=12,
                decimal_places=2,
                default=Decimal('0.00'),
                help_text="Total amount escrowed for daily job (daily_rate × workers × days)"
            ),
        ),
        
        # ============================================================
        # 3. Add daily rate tracking to JobWorkerAssignment
        # ============================================================
        migrations.AddField(
            model_name='jobworkerassignment',
            name='daily_rate_at_assignment',
            field=models.DecimalField(
                max_digits=10,
                decimal_places=2,
                null=True,
                blank=True,
                help_text="Daily rate locked at time of assignment"
            ),
        ),
        migrations.AddField(
            model_name='jobworkerassignment',
            name='days_worked',
            field=models.PositiveIntegerField(
                default=0,
                help_text="Number of days this worker has worked"
            ),
        ),
        migrations.AddField(
            model_name='jobworkerassignment',
            name='total_earned',
            field=models.DecimalField(
                max_digits=10,
                decimal_places=2,
                default=Decimal('0.00'),
                help_text="Total amount earned by this worker on this job"
            ),
        ),
        
        # ============================================================
        # 4. Create DailyAttendance model
        # ============================================================
        migrations.CreateModel(
            name='DailyAttendance',
            fields=[
                ('attendanceID', models.BigAutoField(primary_key=True, serialize=False)),
                ('date', models.DateField(help_text='Work date')),
                ('time_in', models.DateTimeField(null=True, blank=True, help_text='Clock in time')),
                ('time_out', models.DateTimeField(null=True, blank=True, help_text='Clock out time')),
                ('status', models.CharField(
                    max_length=15,
                    choices=[
                        ('PENDING', 'Pending confirmation'),
                        ('PRESENT', 'Present (full day)'),
                        ('HALF_DAY', 'Half day'),
                        ('ABSENT', 'Absent'),
                        ('DISPUTED', 'Disputed'),
                    ],
                    default='PENDING',
                    help_text='Attendance status for this day'
                )),
                ('worker_confirmed', models.BooleanField(default=False)),
                ('worker_confirmed_at', models.DateTimeField(null=True, blank=True)),
                ('client_confirmed', models.BooleanField(default=False)),
                ('client_confirmed_at', models.DateTimeField(null=True, blank=True)),
                ('amount_earned', models.DecimalField(
                    max_digits=10,
                    decimal_places=2,
                    default=Decimal('0.00'),
                    help_text='Amount earned for this day'
                )),
                ('payment_processed', models.BooleanField(
                    default=False,
                    help_text='Whether payment has been moved to pendingEarnings'
                )),
                ('payment_processed_at', models.DateTimeField(null=True, blank=True)),
                ('notes', models.TextField(blank=True, default='')),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                # Foreign keys
                ('jobID', models.ForeignKey(
                    on_delete=models.CASCADE,
                    related_name='daily_attendance',
                    to='accounts.job'
                )),
                ('workerID', models.ForeignKey(
                    on_delete=models.CASCADE,
                    related_name='daily_attendance',
                    to='accounts.workerprofile',
                    null=True,
                    blank=True,
                    help_text='Worker (for freelance workers)'
                )),
                ('assignmentID', models.ForeignKey(
                    on_delete=models.CASCADE,
                    related_name='daily_attendance',
                    to='accounts.jobworkerassignment',
                    null=True,
                    blank=True,
                    help_text='Assignment (for team jobs)'
                )),
                ('employeeID', models.ForeignKey(
                    on_delete=models.CASCADE,
                    related_name='daily_attendance',
                    to='agency.agencyemployee',
                    null=True,
                    blank=True,
                    help_text='Agency employee (for agency jobs)'
                )),
            ],
            options={
                'db_table': 'daily_attendance',
                'ordering': ['-date', 'jobID'],
                'indexes': [
                    models.Index(fields=['jobID', 'date'], name='daily_att_job_date_idx'),
                    models.Index(fields=['workerID', 'date'], name='daily_att_worker_date_idx'),
                    models.Index(fields=['status'], name='daily_att_status_idx'),
                    models.Index(fields=['payment_processed'], name='daily_att_payment_idx'),
                ],
            },
        ),
        # Unique constraint: one attendance per worker per job per day
        migrations.AddConstraint(
            model_name='dailyattendance',
            constraint=models.UniqueConstraint(
                fields=['jobID', 'workerID', 'date'],
                name='unique_worker_attendance_per_day'
            ),
        ),
        
        # ============================================================
        # 5. Create DailyJobExtension model (mutual approval)
        # ============================================================
        migrations.CreateModel(
            name='DailyJobExtension',
            fields=[
                ('extensionID', models.BigAutoField(primary_key=True, serialize=False)),
                ('additional_days', models.PositiveIntegerField(help_text='Number of additional days requested')),
                ('additional_escrow', models.DecimalField(
                    max_digits=12,
                    decimal_places=2,
                    help_text='Additional escrow needed (daily_rate × workers × additional_days)'
                )),
                ('reason', models.TextField(help_text='Reason for extension request')),
                ('status', models.CharField(
                    max_length=15,
                    choices=[
                        ('PENDING', 'Pending approval'),
                        ('APPROVED', 'Approved by both parties'),
                        ('REJECTED', 'Rejected'),
                        ('CANCELLED', 'Cancelled by requester'),
                    ],
                    default='PENDING'
                )),
                ('requested_by', models.CharField(
                    max_length=10,
                    choices=[('CLIENT', 'Client'), ('WORKER', 'Worker'), ('AGENCY', 'Agency')],
                    help_text='Who requested the extension'
                )),
                ('client_approved', models.BooleanField(default=False)),
                ('client_approved_at', models.DateTimeField(null=True, blank=True)),
                ('worker_approved', models.BooleanField(default=False)),
                ('worker_approved_at', models.DateTimeField(null=True, blank=True)),
                ('escrow_collected', models.BooleanField(
                    default=False,
                    help_text='Whether additional escrow has been collected'
                )),
                ('escrow_collected_at', models.DateTimeField(null=True, blank=True)),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                # Foreign keys
                ('jobID', models.ForeignKey(
                    on_delete=models.CASCADE,
                    related_name='extensions',
                    to='accounts.job'
                )),
                ('requestedByUser', models.ForeignKey(
                    on_delete=models.SET_NULL,
                    null=True,
                    related_name='extension_requests',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'db_table': 'daily_job_extensions',
                'ordering': ['-createdAt'],
            },
        ),
        
        # ============================================================
        # 6. Create DailyRateChange model (mutual approval)
        # ============================================================
        migrations.CreateModel(
            name='DailyRateChange',
            fields=[
                ('changeID', models.BigAutoField(primary_key=True, serialize=False)),
                ('old_rate', models.DecimalField(max_digits=10, decimal_places=2)),
                ('new_rate', models.DecimalField(max_digits=10, decimal_places=2)),
                ('reason', models.TextField(help_text='Reason for rate change request')),
                ('effective_date', models.DateField(help_text='Date from which new rate applies')),
                ('status', models.CharField(
                    max_length=15,
                    choices=[
                        ('PENDING', 'Pending approval'),
                        ('APPROVED', 'Approved by both parties'),
                        ('REJECTED', 'Rejected'),
                        ('CANCELLED', 'Cancelled by requester'),
                    ],
                    default='PENDING'
                )),
                ('requested_by', models.CharField(
                    max_length=10,
                    choices=[('CLIENT', 'Client'), ('WORKER', 'Worker'), ('AGENCY', 'Agency')],
                    help_text='Who requested the rate change'
                )),
                ('client_approved', models.BooleanField(default=False)),
                ('client_approved_at', models.DateTimeField(null=True, blank=True)),
                ('worker_approved', models.BooleanField(default=False)),
                ('worker_approved_at', models.DateTimeField(null=True, blank=True)),
                ('escrow_adjusted', models.BooleanField(
                    default=False,
                    help_text='Whether escrow has been adjusted for rate change'
                )),
                ('escrow_adjustment_amount', models.DecimalField(
                    max_digits=12,
                    decimal_places=2,
                    default=Decimal('0.00'),
                    help_text='Amount added/refunded for rate change (positive=client pays more)'
                )),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                # Foreign keys
                ('jobID', models.ForeignKey(
                    on_delete=models.CASCADE,
                    related_name='rate_changes',
                    to='accounts.job'
                )),
                ('requestedByUser', models.ForeignKey(
                    on_delete=models.SET_NULL,
                    null=True,
                    related_name='rate_change_requests',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'db_table': 'daily_rate_changes',
                'ordering': ['-createdAt'],
            },
        ),
        
        # ============================================================
        # 7. Add indexes for performance
        # ============================================================
        migrations.AddIndex(
            model_name='job',
            index=models.Index(fields=['payment_model', 'status'], name='job_payment_model_status_idx'),
        ),
    ]
