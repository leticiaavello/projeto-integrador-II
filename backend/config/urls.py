
from django.contrib import admin
from django.urls import path

from cadastros.views import login_api, logout_api, csrf_token_api

urlpatterns = [
    path("api/csrf/", csrf_token_api, name="csrf_token_api"),
    path("admin/", admin.site.urls),
    path("api/login/", login_api, name="login_api"),
    path("api/logout/", logout_api, name="logout_api"),
]
