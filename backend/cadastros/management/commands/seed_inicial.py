from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from cadastros.models import Espaco
from cadastros.seed_data import ESPACOS

GRUPOS = ['Professor', 'Coordenação', 'Secretaria']

USUARIOS_DEMO = [
    # (username, e-mail, nome, sobrenome, grupo)
    ('maria.silva', 'professor@escola.test', 'Maria', 'Silva', 'Professor'),
    ('carlos.mendes', 'coordenacao@escola.test', 'Carlos', 'Mendes', 'Coordenação'),
    ('fernanda.costa', 'secretaria@escola.test', 'Fernanda', 'Costa', 'Secretaria'),
]


class Command(BaseCommand):
    help = 'Cria os 3 perfis (grupos), usuários de demonstração e os espaços iniciais.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--senha', default='Escola@2026',
            help='Senha dos usuários de demonstração (apenas para desenvolvimento!).',
        )

    def handle(self, *args, **opcoes):
        for nome in GRUPOS:
            Group.objects.get_or_create(name=nome)

        Usuario = get_user_model()
        for username, email, nome, sobrenome, grupo in USUARIOS_DEMO:
            usuario, criado = Usuario.objects.get_or_create(
                username=username,
                defaults={'email': email, 'first_name': nome, 'last_name': sobrenome},
            )
            if criado:
                usuario.set_password(opcoes['senha'])
                usuario.save()
            usuario.groups.set([Group.objects.get(name=grupo)])
            self.stdout.write(f'  {"criado" if criado else "já existia"}: {email} ({grupo})')

        novos = 0
        for dados in ESPACOS:
            _, criado = Espaco.objects.get_or_create(
                nome=dados['nome'], defaults=dados
            )
            novos += int(criado)
        self.stdout.write(self.style.SUCCESS(
            f'Pronto. {novos} espaços novos. Senha dos usuários novos: {opcoes["senha"]} '
            '(troque/remova antes de publicar na nuvem).'
        ))
