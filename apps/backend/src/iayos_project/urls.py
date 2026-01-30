from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from ninja_extra import NinjaExtraAPI

# Import routers from your apps
from accounts.api import router as accounts_router
from accounts.mobile_api import mobile_router as mobile_api_router
from adminpanel.api import router as adminpanel_router
from profiles.api import router as profiles_router
from agency.api import router as agency_router
from jobs.api import router as jobs_router
from client.api import router as client_router
from ml.api import router as ml_router  # Machine Learning predictions
from testing.api import router as testing_router  # E2E testing support

# Import health check views
from iayos_project.health import liveness_check, readiness_check, detailed_status

api = NinjaExtraAPI()

# Add routers from apps
api.add_router("/accounts/", accounts_router)
api.add_router("/mobile/", mobile_api_router)  # Mobile-specific endpoints
api.add_router("/adminpanel/", adminpanel_router)
api.add_router("/profiles/", profiles_router)
api.add_router("/agency/", agency_router)
api.add_router("/client/", client_router)  # Client-specific endpoints (agency discovery, INVITE jobs)
api.add_router("/jobs/", jobs_router)
api.add_router("/ml/", ml_router)  # Machine Learning predictions
api.add_router("/tests/", testing_router)  # E2E testing endpoints (test DB only)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),  # mounts all the API routes
    path("auth/", include("allauth.urls")),
    
    # Health check endpoints for Kubernetes/Docker
    path("health/live", liveness_check, name="health_liveness"),
    path("health/ready", readiness_check, name="health_readiness"),
    path("health/status", detailed_status, name="health_status"),
]

# Serve media files in development (for local storage / offline mode)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
