"""Testes unitários de perfis e permissões (cadastros/permissions.py)."""
from django.contrib.auth.models import AnonymousUser, Group
from django.test import TestCase
from rest_framework.permissions import BasePermission

from .helpers_teste import criar_usuario, requisicao_falsa
from .permissions import PERFIS, nome_exibicao, perfil_de, perfis_permitidos


class PerfilDeTest(TestCase):
    def test_cada_grupo_mapeia_para_seu_codigo(self):
        esperado = {
            'Professor': 'professor',
            'Coordenação': 'coordenacao',
            'Secretaria': 'secretaria',
            'Administrador TI': 'administrador',
        }
        self.assertEqual(PERFIS, esperado)
        for grupo, codigo in esperado.items():
            with self.subTest(grupo=grupo):
                usuario = criar_usuario(f'u_{codigo}', grupo)
                self.assertEqual(perfil_de(usuario), codigo)

    def test_sem_usuario_ou_anonimo(self):
        self.assertIsNone(perfil_de(None))
        self.assertIsNone(perfil_de(AnonymousUser()))

    def test_usuario_sem_grupo(self):
        self.assertIsNone(perfil_de(criar_usuario('sem_grupo')))

    def test_grupo_desconhecido_nao_gera_perfil(self):
        usuario = criar_usuario('visitante')
        usuario.groups.add(Group.objects.create(name='Visitantes'))
        self.assertIsNone(perfil_de(usuario))

    def test_com_varios_grupos_vale_o_primeiro_da_ordem_de_PERFIS(self):
        usuario = criar_usuario('acumulado', 'Secretaria')
        usuario.groups.add(Group.objects.get_or_create(name='Professor')[0])
        self.assertEqual(perfil_de(usuario), 'professor')


class NomeExibicaoTest(TestCase):
    def test_usa_nome_completo_quando_existe(self):
        usuario = criar_usuario(
            'maria.silva', first_name='Maria', last_name='Silva'
        )
        self.assertEqual(nome_exibicao(usuario), 'Maria Silva')

    def test_usa_username_sem_nome(self):
        usuario = criar_usuario('maria.silva', first_name='')
        self.assertEqual(nome_exibicao(usuario), 'maria.silva')


class PerfisPermitidosTest(TestCase):
    def permitido(self, classe, usuario):
        return classe().has_permission(requisicao_falsa(usuario), view=None)

    def test_so_deixa_passar_os_perfis_informados(self):
        classe = perfis_permitidos('professor', 'coordenacao')
        professor = criar_usuario('p', 'Professor')
        coordenacao = criar_usuario('c', 'Coordenação')
        secretaria = criar_usuario('s', 'Secretaria')

        self.assertTrue(self.permitido(classe, professor))
        self.assertTrue(self.permitido(classe, coordenacao))
        self.assertFalse(self.permitido(classe, secretaria))

    def test_nega_anonimo_e_usuario_sem_perfil(self):
        classe = perfis_permitidos('professor')
        self.assertFalse(self.permitido(classe, AnonymousUser()))
        self.assertFalse(self.permitido(classe, criar_usuario('sem_grupo')))

    def test_sem_perfis_ninguem_passa(self):
        classe = perfis_permitidos()
        self.assertFalse(self.permitido(classe, criar_usuario('p', 'Professor')))

    def test_gera_classe_de_permissao_do_drf_com_mensagem(self):
        classe = perfis_permitidos('professor')
        self.assertTrue(issubclass(classe, BasePermission))
        self.assertIn('permissão', classe.message)

    def test_cada_chamada_gera_uma_classe_independente(self):
        so_professor = perfis_permitidos('professor')
        so_secretaria = perfis_permitidos('secretaria')
        professor = criar_usuario('p', 'Professor')
        self.assertTrue(self.permitido(so_professor, professor))
        self.assertFalse(self.permitido(so_secretaria, professor))
