"""Utilitários compartilhados pelos testes (não contém testes próprios)."""
from datetime import date, time, timedelta
from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Espaco, Reserva

Usuario = get_user_model()

SENHA = 'Senha@12345'


def criar_usuario(username, grupo=None, **extra):
    """Cria um usuário e, se informado, o coloca no grupo (perfil)."""
    usuario = Usuario.objects.create_user(
        username=username,
        email=extra.pop('email', f'{username}@escola.test'),
        password=extra.pop('password', SENHA),
        first_name=extra.pop('first_name', username.title()),
        **extra,
    )
    if grupo:
        usuario.groups.add(Group.objects.get_or_create(name=grupo)[0])
    return usuario


def cliente(usuario=None):
    """APIClient autenticado (sem CSRF) como o usuário informado."""
    c = APIClient()
    if usuario is not None:
        c.force_authenticate(usuario)
    return c


def requisicao_falsa(usuario):
    """Objeto mínimo que imita ``request`` para serializers e permissões."""
    return SimpleNamespace(user=usuario)


def nova_reserva(
    recurso='Sala 01',
    data=None,
    inicio=time(7, 0),
    fim=time(7, 50),
    status='ATIVA',
    usuario=None,
    responsavel='Maria Teste',
    **extra,
):
    """Cria uma Reserva direto no banco (sem passar pelas regras da API)."""
    return Reserva.objects.create(
        recurso=recurso,
        data=data or date(2026, 3, 10),
        horario_inicio=inicio,
        horario_fim=fim,
        status=status,
        usuario=usuario,
        responsavel=responsavel,
        finalidade=extra.pop('finalidade', 'Aula'),
        **extra,
    )


class BaseAPITestCase(TestCase):
    """Cria um usuário de cada perfil e uma sala para os testes de API."""

    def setUp(self):
        self.prof = criar_usuario('maria', 'Professor')
        self.prof2 = criar_usuario('joao', 'Professor')
        self.coord = criar_usuario('carlos', 'Coordenação')
        self.sec = criar_usuario('fernanda', 'Secretaria')
        self.admin_ti = criar_usuario('admin_ti', 'Administrador TI')
        self.sala = Espaco.objects.create(nome='Sala 01', tipo='Sala')
        self.amanha = (timezone.localdate() + timedelta(days=1)).isoformat()

    def reservar(self, quem, recurso='Sala 01', horario='07h00–07h50', **extra):
        dados = {
            'recurso': recurso,
            'data': self.amanha,
            'horario': horario,
            'finalidade': 'Aula',
        }
        dados.update(extra)
        return cliente(quem).post('/api/reservas/', dados, format='json')
