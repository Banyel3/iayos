from django.contrib import admin
from django.urls import path, include
from ninja_extra import NinjaExtraAPI

# Import routers from your apps
from accounts.api import router as accounts_router
from adminpanel.api import router as adminpanel_router
# from jobs.api import router as jobs_router
# from agencies.api import router as agencies_router

api = NinjaExtraAPI()

# Add routers from apps
api.add_router("/accounts/", accounts_router)
api.add_router("/adminpanel/", adminpanel_router)
# api.add_router("/jobs/", jobs_router)
# api.add_router("/agencies/", agencies_router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),  # mounts all the API routes
    path("auth/", include("allauth.urls")),
]
