from django.contrib import admin
from .models import SystemRoles, KYCLogs

# Register your models here.


@admin.register(KYCLogs)
class KYCLogsAdmin(admin.ModelAdmin):
    list_display = ('kycLogID', 'action', 'userEmail', 'reviewedBy', 'reviewedAt')
    list_filter = ('action', 'reviewedAt')
    search_fields = ('userEmail', 'reason')
    readonly_fields = ('kycLogID', 'kycID', 'accountFK', 'action', 'reviewedBy', 'reviewedAt', 
                       'reason', 'userEmail', 'userAccountID', 'createdAt')
    ordering = ('-reviewedAt',)
    
    def has_add_permission(self, request):
        # Prevent manual creation - logs should only be created by the system
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Prevent deletion of audit logs
        return False


@admin.register(SystemRoles)
class SystemRolesAdmin(admin.ModelAdmin):
    list_display = ('systemRoleID', 'accountID', 'systemRole', 'createdAt')
    list_filter = ('systemRole',)
    ordering = ('-createdAt',)

