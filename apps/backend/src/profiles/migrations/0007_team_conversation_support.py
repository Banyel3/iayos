# Generated migration for Team Mode Conversation Support
# Date: January 2025

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0006_add_sender_agency_to_message'),
        ('accounts', '0063_team_mode_multi_skill_workers'),  # Depends on JobSkillSlot
    ]

    operations = [
        # ============================================================
        # 1. Add conversation_type field to Conversation
        # ============================================================
        migrations.AddField(
            model_name='conversation',
            name='conversation_type',
            field=models.CharField(
                choices=[
                    ('ONE_ON_ONE', '1:1 (Client + Worker/Agency)'),
                    ('TEAM_GROUP', 'Team Group Chat (Client + Multiple Workers)')
                ],
                default='ONE_ON_ONE',
                help_text='ONE_ON_ONE for regular jobs, TEAM_GROUP for team mode jobs',
                max_length=15
            ),
        ),
        migrations.AddIndex(
            model_name='conversation',
            index=models.Index(fields=['conversation_type', 'status'], name='conv_type_status_idx'),
        ),
        
        # ============================================================
        # 2. Create ConversationParticipant model for team group chats
        # ============================================================
        migrations.CreateModel(
            name='ConversationParticipant',
            fields=[
                ('participantID', models.BigAutoField(primary_key=True, serialize=False)),
                ('participant_type', models.CharField(
                    choices=[
                        ('CLIENT', 'Client (Job Owner)'),
                        ('WORKER', 'Worker (Team Member)')
                    ],
                    default='WORKER',
                    max_length=10
                )),
                ('unread_count', models.IntegerField(default=0)),
                ('is_archived', models.BooleanField(default=False)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('last_read_at', models.DateTimeField(blank=True, null=True)),
                ('conversation', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='participants',
                    to='profiles.conversation'
                )),
                ('profile', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='team_conversation_participations',
                    to='accounts.profile'
                )),
                ('skill_slot', models.ForeignKey(
                    blank=True,
                    help_text='Which skill slot this worker is fulfilling in the team',
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='conversation_participants',
                    to='accounts.jobskillslot'
                )),
            ],
            options={
                'db_table': 'conversation_participants',
                'ordering': ['joined_at'],
            },
        ),
        migrations.AddIndex(
            model_name='conversationparticipant',
            index=models.Index(fields=['conversation', 'profile'], name='conv_part_conv_profile_idx'),
        ),
        migrations.AddIndex(
            model_name='conversationparticipant',
            index=models.Index(fields=['profile', '-joined_at'], name='conv_part_profile_joined_idx'),
        ),
        migrations.AddConstraint(
            model_name='conversationparticipant',
            constraint=models.UniqueConstraint(
                fields=('conversation', 'profile'),
                name='unique_conversation_participant'
            ),
        ),
    ]
