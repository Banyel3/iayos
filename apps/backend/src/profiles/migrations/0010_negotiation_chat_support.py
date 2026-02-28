from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0096_backfill_agency_reviews'),
        ('profiles', '0009_increase_attachment_fileurl_length'),
    ]

    operations = [
        # 1. Make ConversationParticipant.profile nullable
        migrations.AlterField(
            model_name='conversationparticipant',
            name='profile',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='team_conversation_participations',
                to='accounts.profile',
            ),
        ),
        # 2. Add admin_account FK to ConversationParticipant
        migrations.AddField(
            model_name='conversationparticipant',
            name='admin_account',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='negotiation_conversations',
                to='accounts.accounts',
            ),
        ),
        # 3. Update participant_type choices to include ADMIN
        migrations.AlterField(
            model_name='conversationparticipant',
            name='participant_type',
            field=models.CharField(
                choices=[
                    ('CLIENT', 'Client (Job Owner)'),
                    ('WORKER', 'Worker (Team Member)'),
                    ('ADMIN', 'Admin (Negotiation)'),
                ],
                default='WORKER',
                max_length=10,
            ),
        ),
        # 4. Remove old unique constraint on (conversation, profile)
        migrations.RemoveConstraint(
            model_name='conversationparticipant',
            name='unique_conversation_participant',
        ),
        # 5. Add conditional unique constraint for (conversation, profile) when profile is not null
        migrations.AddConstraint(
            model_name='conversationparticipant',
            constraint=models.UniqueConstraint(
                condition=models.Q(profile__isnull=False),
                fields=['conversation', 'profile'],
                name='unique_conversation_participant',
            ),
        ),
        # 6. Add unique constraint for (conversation, admin_account) when admin_account is not null
        migrations.AddConstraint(
            model_name='conversationparticipant',
            constraint=models.UniqueConstraint(
                condition=models.Q(admin_account__isnull=False),
                fields=['conversation', 'admin_account'],
                name='unique_conversation_admin',
            ),
        ),
        # 7. Add sender_admin FK to Message
        migrations.AddField(
            model_name='message',
            name='sender_admin',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='admin_messages',
                to='accounts.accounts',
            ),
        ),
    ]
