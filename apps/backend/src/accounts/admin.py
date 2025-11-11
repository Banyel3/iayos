from django.contrib import admin
from .models import Accounts, Profile, kyc, kycFiles, Notification

# Register your models here.

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('notificationID', 'accountFK', 'notificationType', 'title', 'isRead', 'createdAt')
    list_filter = ('notificationType', 'isRead', 'createdAt')
    search_fields = ('title', 'message', 'accountFK__email')
    readonly_fields = ('notificationID', 'createdAt', 'readAt')
    ordering = ('-createdAt',)

