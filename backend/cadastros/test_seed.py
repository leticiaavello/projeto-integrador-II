"""Testes do comando ``seed_inicial`` e dos dados de demonstração."""
from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import TestCase

from .management.commands.seed_inicial import GRUPOS, USUARIOS_DEMO
from .models import Espaco
from .seed_data import ESPACOS

Usuario = get_user_model()


def rodar_seed(*args):
    saida = StringIO()
    call_command('seed_inicial', *args, stdout=saida)
    return saida.getvalue()


class SeedDataTest(TestCase):
    def test_nomes_sao_unicos(self):
        nomes = [e['nome'] for e in ESPACOS]
        self.assertEqual(len(nomes), len(set(nomes)))

    def test_todos_os_tipos_sao_validos(self):
        tipos = {valor for valor, _ in Espaco.TIPOS}
        for dados in ESPACOS:
            with self.subTest(nome=dados['nome']):
                self.assertIn(dados['tipo'], tipos)


class SeedInicialTest(TestCase):
    def test_cria_grupos_usuarios_e_espacos(self):
        rodar_seed()

        for nome in GRUPOS:
            self.assertTrue(Group.objects.filter(name=nome).exists(), nome)
        for username, email, nome, sobrenome, grupo in USUARIOS_DEMO:
            with self.subTest(username=username):
                usuario = Usuario.objects.get(username=username)
                self.assertEqual(usuario.email, email)
                self.assertEqual(usuario.get_full_name(), f'{nome} {sobrenome}')
                self.assertEqual(
                    list(usuario.groups.values_list('name', flat=True)), [grupo]
                )
        self.assertEqual(Espaco.objects.count(), len(ESPACOS))

    def test_senha_padrao_e_senha_personalizada(self):
        rodar_seed()
        self.assertTrue(
            Usuario.objects.get(username='maria.silva').check_password('Escola@2026')
        )

        Usuario.objects.all().delete()
        rodar_seed('--senha', 'Outra@Senha1')
        self.assertTrue(
            Usuario.objects.get(username='maria.silva').check_password('Outra@Senha1')
        )

    def test_pode_rodar_varias_vezes_sem_duplicar(self):
        rodar_seed()
        saida = rodar_seed()

        self.assertEqual(Espaco.objects.count(), len(ESPACOS))
        self.assertEqual(Usuario.objects.count(), len(USUARIOS_DEMO))
        self.assertIn('0 espaços novos', saida)
        self.assertIn('já existia', saida)

    def test_nao_redefine_a_senha_de_quem_ja_existe(self):
        rodar_seed()
        rodar_seed('--senha', 'Outra@Senha1')
        usuario = Usuario.objects.get(username='maria.silva')
        self.assertTrue(usuario.check_password('Escola@2026'))
        self.assertFalse(usuario.check_password('Outra@Senha1'))

    def test_corrige_o_perfil_de_usuario_demo_existente(self):
        usuario = Usuario.objects.create_user(
            username='maria.silva', email='professor@escola.test', password='x'
        )
        usuario.groups.add(Group.objects.get_or_create(name='Secretaria')[0])

        rodar_seed()

        self.assertEqual(
            list(usuario.groups.values_list('name', flat=True)), ['Professor']
        )
