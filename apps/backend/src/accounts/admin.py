from django.contrib import admin
from .models import Accounts, Profile, kyc, kycFiles, Notification, PushToken, NotificationSettings

# Register your models here.

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('notificationID', 'accountFK', 'notificationType', 'title', 'isRead', 'createdAt')
    list_filter = ('notificationType', 'isRead', 'createdAt')
    search_fields = ('title', 'message', 'accountFK__email')
    readonly_fields = ('notificationID', 'createdAt', 'readAt')
    ordering = ('-createdAt',)


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ('tokenID', 'accountFK', 'deviceType', 'isActive', 'lastUsed', 'createdAt')
    list_filter = ('deviceType', 'isActive', 'createdAt')
    search_fields = ('accountFK__email', 'pushToken')
    readonly_fields = ('tokenID', 'createdAt', 'updatedAt', 'lastUsed')
    ordering = ('-lastUsed',)


@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ('settingsID', 'accountFK', 'pushEnabled', 'soundEnabled', 'updatedAt')
    list_filter = ('pushEnabled', 'soundEnabled', 'jobUpdates', 'messages', 'payments')
    search_fields = ('accountFK__email',)
    readonly_fields = ('settingsID', 'createdAt', 'updatedAt')
    ordering = ('-updatedAt',)

