# Generated manually for job materials purchasing workflow

import django.db.models.deletion
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0080_kyc_face_match_score'),
    ]

    operations = [
        # 1. Add materialsCost and materials_status to Job model
        migrations.AddField(
            model_name='job',
            name='materialsCost',
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal('0.00'),
                help_text='Total cost of materials purchased by worker, approved by client',
                max_digits=10,
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='materials_status',
            field=models.CharField(
                choices=[
                    ('NONE', 'No materials needed'),
                    ('PENDING_PURCHASE', "Worker hasn't started buying"),
                    ('BUYING', 'Worker is buying materials'),
                    ('PURCHASED', 'Worker purchased, awaiting client approval'),
                    ('APPROVED', 'Client approved all material purchases'),
                ],
                default='NONE',
                help_text='Status of materials purchasing workflow',
                max_length=20,
            ),
        ),
        # 2. Add selected_materials to JobApplication model
        migrations.AddField(
            model_name='jobapplication',
            name='selected_materials',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Materials the worker selected from their profile or marked to purchase. Format: [{name, source, price, quantity, worker_material_id}]',
            ),
        ),
        # 3. Alter transactionType max_length on Transaction (for MATERIALS_REIMBURSEMENT)
        migrations.AlterField(
            model_name='transaction',
            name='transactionType',
            field=models.CharField(
                choices=[
                    ('DEPOSIT', 'Deposit'),
                    ('WITHDRAWAL', 'Withdrawal'),
                    ('PAYMENT', 'Payment'),
                    ('REFUND', 'Refund'),
                    ('EARNING', 'Earning'),
                    ('PENDING_EARNING', 'Pending Earning (7-day buffer)'),
                    ('FEE', 'Platform Fee'),
                    ('MATERIALS_REIMBURSEMENT', 'Materials Reimbursement'),
                ],
                max_length=30,
            ),
        ),
        # 4. Create JobMaterial model
        migrations.CreateModel(
            name='JobMaterial',
            fields=[
                ('jobMaterialID', models.BigAutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True, null=True)),
                ('quantity', models.IntegerField(default=1)),
                ('unit', models.CharField(blank=True, max_length=50, null=True)),
                ('source', models.CharField(
                    choices=[
                        ('FROM_PROFILE', 'Worker already has this (no cost)'),
                        ('TO_PURCHASE', 'Worker will purchase'),
                        ('PURCHASED', 'Worker has purchased'),
                    ],
                    default='TO_PURCHASE',
                    max_length=20,
                )),
                ('purchase_price', models.DecimalField(
                    blank=True,
                    decimal_places=2,
                    help_text='Actual purchase price (set when worker uploads receipt)',
                    max_digits=10,
                    null=True,
                )),
                ('receipt_image_url', models.CharField(
                    blank=True,
                    help_text='URL of purchase receipt image',
                    max_length=500,
                    null=True,
                )),
                ('client_approved', models.BooleanField(default=False)),
                ('client_approved_at', models.DateTimeField(blank=True, null=True)),
                ('client_rejected', models.BooleanField(default=False)),
                ('rejection_reason', models.TextField(blank=True, null=True)),
                ('added_by', models.CharField(
                    choices=[
                        ('CLIENT_REQUEST', 'From job posting materials list'),
                        ('WORKER_SUPPLIED', 'Worker added during application'),
                    ],
                    default='WORKER_SUPPLIED',
                    max_length=20,
                )),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('jobID', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='job_materials',
                    to='accounts.job',
                )),
                ('workerMaterialID', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='job_usages',
                    to='accounts.workermaterial',
                )),
            ],
            options={
                'db_table': 'job_materials',
                'ordering': ['createdAt'],
                'indexes': [
                    models.Index(fields=['jobID', 'source'], name='accounts_jo_jobID_i_0b1c2d_idx'),
                    models.Index(fields=['jobID', 'client_approved'], name='accounts_jo_jobID_i_3a4b5c_idx'),
                ],
            },
        ),
    ]
