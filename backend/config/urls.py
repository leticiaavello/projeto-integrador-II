from django.contrib import admin
from django.views.generic import TemplateView
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from cadastros.views import (
    BloqueioViewSet,
    EquipamentoViewSet,
    EspacoViewSet,
    ManutencaoViewSet,
    ReservaViewSet,
    UsuarioAdminViewSet,
    csrf_token_api,
    login_api,
    logout_api,
    me_api,
)

router = DefaultRouter()
router.register('espacos', EspacoViewSet, basename='espaco')
router.register('equipamentos', EquipamentoViewSet, basename='equipamento')
router.register('reservas', ReservaViewSet, basename='reserva')
router.register('bloqueios', BloqueioViewSet, basename='bloqueio')
router.register('manutencoes', ManutencaoViewSet, basename='manutencao')
router.register('usuarios', UsuarioAdminViewSet, basename='usuario')

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html'), name='inicio'),
    path('admin/', admin.site.urls),
    path('api/csrf/', csrf_token_api, name='csrf_token_api'),
    path('api/login/', login_api, name='login_api'),
    path('api/logout/', logout_api, name='logout_api'),
    path('api/me/', me_api, name='me_api'),
    path('api/', include(router.urls)),
]
