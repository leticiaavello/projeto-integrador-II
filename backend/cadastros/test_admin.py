"""Testes da configuração do Django Admin (cadastros/admin.py)."""
from django.contrib import admin
from django.test import RequestFactory, TestCase

from .admin import LogOperacaoAdmin
from .helpers_teste import criar_usuario
from .models import (
    Bloqueio,
    Equipamento,
    Espaco,
    LogOperacao,
    Manutencao,
    Reserva,
)


class AdminRegistroTest(TestCase):
    def test_todos_os_modelos_estao_registrados(self):
        for modelo in (Bloqueio, Equipamento, Espaco, LogOperacao, Manutencao, Reserva):
            with self.subTest(modelo=modelo.__name__):
                self.assertTrue(admin.site.is_registered(modelo))


class LogOperacaoAdminTest(TestCase):
    """A trilha de auditoria não pode ser adulterada pelo admin."""

    def setUp(self):
        self.admin = LogOperacaoAdmin(LogOperacao, admin.site)
        self.request = RequestFactory().get('/admin/')
        self.request.user = criar_usuario(
            'root', is_staff=True, is_superuser=True
        )

    def test_nao_permite_criar_editar_nem_apagar(self):
        log = LogOperacao.objects.create(acao='criar', entidade='Espaco')
        self.assertFalse(self.admin.has_add_permission(self.request))
        self.assertFalse(self.admin.has_change_permission(self.request))
        self.assertFalse(self.admin.has_change_permission(self.request, log))
        self.assertFalse(self.admin.has_delete_permission(self.request))
        self.assertFalse(self.admin.has_delete_permission(self.request, log))

    def test_todos_os_campos_sao_somente_leitura(self):
        esperado = {f.name for f in LogOperacao._meta.fields}
        self.assertEqual(set(self.admin.readonly_fields), esperado)
