# Generated migration for Team Mode Multi-Skill Multi-Worker Feature
# Date: January 2025

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0062_multi_criteria_reviews'),
    ]

    operations = [
        # ============================================================
        # 1. Add Team Mode fields to Job model
        # ============================================================
        migrations.AddField(
            model_name='job',
            name='is_team_job',
            field=models.BooleanField(
                default=False,
                help_text='True if this job requires multiple workers/skills (team mode)'
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='budget_allocation_type',
            field=models.CharField(
                choices=[
                    ('EQUAL_PER_SKILL', 'Equal budget per skill slot'),
                    ('EQUAL_PER_WORKER', 'Equal budget per worker (default)'),
                    ('MANUAL_ALLOCATION', 'Client manually allocates'),
                    ('SKILL_WEIGHTED', 'Weighted by skill complexity')
                ],
                default='EQUAL_PER_WORKER',
                help_text='How the total budget is distributed among skill slots/workers',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='job',
            name='team_job_start_threshold',
            field=models.DecimalField(
                decimal_places=2,
                default=100.00,
                help_text='Percentage of team positions that must be filled before job can start (0-100)',
                max_digits=5
            ),
        ),
        
        # ============================================================
        # 2. Create JobSkillSlot model
        # ============================================================
        migrations.CreateModel(
            name='JobSkillSlot',
            fields=[
                ('skillSlotID', models.BigAutoField(primary_key=True, serialize=False)),
                ('workers_needed', models.PositiveIntegerField(
                    default=1,
                    help_text='Number of workers needed for this skill (1-10)'
                )),
                ('budget_allocated', models.DecimalField(
                    decimal_places=2,
                    default=0,
                    help_text='Budget allocated to this skill slot',
                    max_digits=10
                )),
                ('skill_level_required', models.CharField(
                    choices=[
                        ('ENTRY', 'Entry Level'),
                        ('INTERMEDIATE', 'Intermediate'),
                        ('EXPERT', 'Expert')
                    ],
                    default='ENTRY',
                    help_text='Minimum skill level required',
                    max_length=15
                )),
                ('status', models.CharField(
                    choices=[
                        ('OPEN', 'Open for applications'),
                        ('PARTIALLY_FILLED', 'Some workers assigned'),
                        ('FILLED', 'All positions filled'),
                        ('CLOSED', 'No longer accepting')
                    ],
                    default='OPEN',
                    max_length=20
                )),
                ('notes', models.TextField(
                    blank=True,
                    help_text='Additional requirements or notes for this skill slot',
                    null=True
                )),
                ('createdAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('jobID', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='skill_slots',
                    to='accounts.job'
                )),
                ('specializationID', models.ForeignKey(
                    help_text='The specialization/skill required',
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='job_skill_slots',
                    to='accounts.specializations'
                )),
            ],
            options={
                'db_table': 'job_skill_slots',
                'ordering': ['jobID', 'specializationID'],
            },
        ),
        migrations.AddIndex(
            model_name='jobskillslot',
            index=models.Index(fields=['jobID', 'status'], name='job_skill_s_jobID_status_idx'),
        ),
        migrations.AddIndex(
            model_name='jobskillslot',
            index=models.Index(fields=['specializationID', 'status'], name='job_skill_s_spec_status_idx'),
        ),
        
        # ============================================================
        # 3. Create JobWorkerAssignment model
        # ============================================================
        migrations.CreateModel(
            name='JobWorkerAssignment',
            fields=[
                ('assignmentID', models.BigAutoField(primary_key=True, serialize=False)),
                ('slot_position', models.PositiveIntegerField(
                    default=1,
                    help_text='Position number within this skill slot'
                )),
                ('assignment_status', models.CharField(
                    choices=[
                        ('ACTIVE', 'Actively Assigned'),
                        ('COMPLETED', 'Work Completed'),
                        ('REMOVED', 'Removed from Job'),
                        ('WITHDRAWN', 'Worker Withdrew')
                    ],
                    default='ACTIVE',
                    max_length=15
                )),
                ('worker_marked_complete', models.BooleanField(default=False)),
                ('worker_marked_complete_at', models.DateTimeField(blank=True, null=True)),
                ('completion_notes', models.TextField(blank=True, null=True)),
                ('individual_rating', models.DecimalField(
                    blank=True,
                    decimal_places=2,
                    help_text="Client's rating for this specific worker's contribution",
                    max_digits=3,
                    null=True
                )),
                ('assignedAt', models.DateTimeField(auto_now_add=True)),
                ('updatedAt', models.DateTimeField(auto_now=True)),
                ('jobID', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='worker_assignments',
                    to='accounts.job'
                )),
                ('skillSlotID', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='worker_assignments',
                    to='accounts.jobskillslot'
                )),
                ('workerID', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='team_job_assignments',
                    to='accounts.workerprofile'
                )),
            ],
            options={
                'db_table': 'job_worker_assignments',
                'ordering': ['jobID', 'skillSlotID', 'slot_position'],
            },
        ),
        migrations.AddIndex(
            model_name='jobworkerassignment',
            index=models.Index(fields=['jobID', 'assignment_status'], name='job_worker_job_status_idx'),
        ),
        migrations.AddIndex(
            model_name='jobworkerassignment',
            index=models.Index(fields=['workerID', 'assignment_status'], name='job_worker_worker_status_idx'),
        ),
        migrations.AddIndex(
            model_name='jobworkerassignment',
            index=models.Index(fields=['skillSlotID', 'slot_position'], name='job_worker_slot_pos_idx'),
        ),
        migrations.AddConstraint(
            model_name='jobworkerassignment',
            constraint=models.UniqueConstraint(
                fields=('jobID', 'workerID'),
                name='unique_worker_per_job'
            ),
        ),
        migrations.AddConstraint(
            model_name='jobworkerassignment',
            constraint=models.UniqueConstraint(
                fields=('skillSlotID', 'slot_position'),
                name='unique_slot_position'
            ),
        ),
        
        # ============================================================
        # 4. Add applied_skill_slot to JobApplication
        # ============================================================
        migrations.AddField(
            model_name='jobapplication',
            name='applied_skill_slot',
            field=models.ForeignKey(
                blank=True,
                help_text='Which skill slot this worker is applying for (team jobs only)',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='applications',
                to='accounts.jobskillslot'
            ),
        ),
        migrations.AddIndex(
            model_name='jobapplication',
            index=models.Index(fields=['applied_skill_slot', 'status'], name='job_app_skill_slot_status_idx'),
        ),
        # Remove old unique constraint
        migrations.RemoveConstraint(
            model_name='jobapplication',
            name='unique_job_application',
        ),
        # Add new constraints for team job support
        migrations.AddConstraint(
            model_name='jobapplication',
            constraint=models.UniqueConstraint(
                fields=('jobID', 'workerID', 'applied_skill_slot'),
                name='unique_job_skill_slot_application'
            ),
        ),
        migrations.AddConstraint(
            model_name='jobapplication',
            constraint=models.UniqueConstraint(
                condition=models.Q(applied_skill_slot__isnull=True),
                fields=('jobID', 'workerID'),
                name='unique_non_team_job_application'
            ),
        ),
    ]
