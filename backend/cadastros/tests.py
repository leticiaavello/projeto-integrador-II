from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Bloqueio, Equipamento, Espaco, Reserva
from .services import interpretar_horario

Usuario = get_user_model()


def criar_usuario(username, grupo):
    usuario = Usuario.objects.create_user(
        username=username, email=f'{username}@escola.test',
        password='Senha@12345', first_name=username.title(),
    )
    usuario.groups.add(Group.objects.get_or_create(name=grupo)[0])
    return usuario


def cliente(usuario):
    c = APIClient()
    c.force_authenticate(usuario)
    return c


class BaseTest(TestCase):
    def setUp(self):
        self.prof = criar_usuario('maria', 'Professor')
        self.prof2 = criar_usuario('joao', 'Professor')
        self.coord = criar_usuario('carlos', 'Coordenação')
        self.sec = criar_usuario('fernanda', 'Secretaria')
        Espaco.objects.create(nome='Sala 01', tipo='Sala')
        self.amanha = (timezone.localdate() + timedelta(days=1)).isoformat()

    def reservar(self, quem, recurso='Sala 01', horario='07h00–07h50'):
        return cliente(quem).post('/api/reservas/', {
            'recurso': recurso, 'data': self.amanha,
            'horario': horario, 'finalidade': 'Aula',
        }, format='json')


class HorarioTest(TestCase):
    def test_interpreta_formatos(self):
        self.assertIsNotNone(interpretar_horario('07h50–08h40'))
        self.assertIsNotNone(interpretar_horario('07h50-08h40'))
        self.assertIsNotNone(interpretar_horario('2ª aula (07h50–08h40)'))
        self.assertIsNone(interpretar_horario('qualquer coisa'))


class ReservaTest(BaseTest):
    def test_professor_cria_reserva(self):
        r = self.reservar(self.prof)
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data['status'], 'ativa')
        self.assertEqual(r.data['horario'], '07h00–07h50')

    def test_impede_reserva_duplicada(self):
        self.assertEqual(self.reservar(self.prof).status_code, 201)
        r = self.reservar(self.prof2)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Reserva.objects.count(), 1)

    def test_impede_horario_sobreposto(self):
        self.reservar(self.prof, horario='07h00–07h50')
        r = self.reservar(self.prof2, horario='07h30–08h20')
        self.assertEqual(r.status_code, 400)

    def test_horarios_vizinhos_nao_conflitam(self):
        self.reservar(self.prof, horario='07h00–07h50')
        r = self.reservar(self.prof2, horario='07h50–08h40')
        self.assertEqual(r.status_code, 201)

    def test_recurso_bloqueado_nao_reserva(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', motivo='Reforma', origem='COORDENACAO'
        )
        self.assertEqual(self.reservar(self.prof).status_code, 400)

    def test_bloqueio_de_outra_aula_nao_impede(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO',
            aula='5ª aula (10h40–11h30)',
        )
        self.assertEqual(self.reservar(self.prof).status_code, 201)

    def test_espaco_indisponivel_nao_reserva(self):
        Espaco.objects.filter(nome='Sala 01').update(situacao='Indisponível')
        self.assertEqual(self.reservar(self.prof).status_code, 400)

    def test_data_passada_recusada(self):
        r = cliente(self.prof).post('/api/reservas/', {
            'recurso': 'Sala 01', 'data': '2020-01-01',
            'horario': '07h00–07h50', 'finalidade': 'x',
        }, format='json')
        self.assertEqual(r.status_code, 400)

    def test_secretaria_nao_reserva(self):
        self.assertEqual(self.reservar(self.sec).status_code, 403)

    def test_so_dono_ou_coordenacao_cancela(self):
        rid = self.reservar(self.prof).data['id']
        r = cliente(self.prof2).post(f'/api/reservas/{rid}/cancelar/')
        self.assertEqual(r.status_code, 403)
        r = cliente(self.prof).post(f'/api/reservas/{rid}/cancelar/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['status'], 'cancelada')
        # liberou o horário
        self.assertEqual(self.reservar(self.prof2).status_code, 201)

    def test_coordenacao_cancela_qualquer(self):
        rid = self.reservar(self.prof).data['id']
        r = cliente(self.coord).post(f'/api/reservas/{rid}/cancelar/')
        self.assertEqual(r.status_code, 200)

    def test_exige_login(self):
        self.assertEqual(APIClient().get('/api/reservas/').status_code, 403)


class CadastroTest(BaseTest):
    def test_professor_nao_cadastra_espaco(self):
        r = cliente(self.prof).post(
            '/api/espacos/', {'tipo': 'Sala', 'nome': 'Sala 99'}, format='json'
        )
        self.assertEqual(r.status_code, 403)

    def test_secretaria_cadastra_espaco_e_bloqueia(self):
        c = cliente(self.sec)
        r = c.post('/api/espacos/', {'tipo': 'Sala', 'nome': 'Sala 99'}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        r = c.patch(f"/api/espacos/{r.data['id']}/", {'situacao': 'Indisponível'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(Bloqueio.objects.filter(recurso='Sala 99', ativo=True).exists())

    def test_equipamento_exige_patrimonio_ou_simplificado(self):
        c = cliente(self.sec)
        r = c.post('/api/equipamentos/', {'tipo': 'Projetor'}, format='json')
        self.assertEqual(r.status_code, 400)
        r = c.post('/api/equipamentos/', {'tipo': 'Projetor', 'patrimonio': '123'}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data['simplificado'], '')
        r = c.post('/api/equipamentos/', {'tipo': 'Projetor', 'patrimonio': '123'}, format='json')
        self.assertEqual(r.status_code, 400)  # patrimônio repetido
        self.assertEqual(Equipamento.objects.count(), 1)

    def test_coordenacao_so_desbloqueia_o_que_bloqueou(self):
        b = Bloqueio.objects.create(tipo='Sala', recurso='Sala 01', origem='SECRETARIA')
        r = cliente(self.coord).delete(f'/api/bloqueios/{b.pk}/')
        self.assertEqual(r.status_code, 403)
        r = cliente(self.sec).delete(f'/api/bloqueios/{b.pk}/')
        self.assertEqual(r.status_code, 204)
        b.refresh_from_db()
        self.assertFalse(b.ativo)


class LoginTest(BaseTest):
    def test_login_e_me(self):
        c = APIClient()
        r = c.post('/api/login/', {'email': 'maria@escola.test', 'senha': 'Senha@12345'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['usuario']['perfil'], 'professor')
        self.assertEqual(c.get('/api/me/').status_code, 200)

    def test_senha_errada(self):
        r = APIClient().post('/api/login/', {'email': 'maria@escola.test', 'senha': 'x'}, format='json')
        self.assertEqual(r.status_code, 401)

class ManutencaoPermissaoTest(BaseTest):
    def test_professor_consulta_manutencoes(self):
        r = cliente(self.prof).get('/api/manutencoes/')
        self.assertEqual(r.status_code, 200)

    def test_professor_nao_cria_manutencao(self):
        r = cliente(self.prof).post(
            '/api/manutencoes/',
            {
                'tipo': 'Equipamento',
                'recurso': 'Projetor 123',
                'inicio': self.amanha,
                'motivo': 'Teste de permissão',
            },
            format='json',
        )
        self.assertEqual(r.status_code, 403)

    def test_coordenacao_nao_cria_manutencao(self):
        r = cliente(self.coord).post(
            '/api/manutencoes/',
            {
                'tipo': 'Equipamento',
                'recurso': 'Projetor 123',
                'inicio': self.amanha,
                'motivo': 'Teste de permissão',
            },
            format='json',
        )
        self.assertEqual(r.status_code, 403)

    def test_secretaria_cria_manutencao(self):
        r = cliente(self.sec).post(
            '/api/manutencoes/',
            {
                'tipo': 'Equipamento',
                'recurso': 'Projetor 123',
                'inicio': self.amanha,
                'motivo': 'Manutenção preventiva',
            },
            format='json',
        )
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(
            Bloqueio.objects.filter(
                recurso='Projetor 123',
                manutencao_id=r.data['id'],
                ativo=True,
            ).exists()
        )

class UsuarioAdminAPITests(BaseTest):
    def setUp(self):
        super().setUp()
        self.admin_ti = criar_usuario(
            'admin_ti_teste',
            'Administrador TI',
        )
        self.url = '/api/usuarios/'

    def test_professor_nao_pode_listar_usuarios(self):
        resposta = cliente(self.prof).get(self.url)
        self.assertEqual(resposta.status_code, 403)

    def test_coordenacao_nao_pode_listar_usuarios(self):
        resposta = cliente(self.coord).get(self.url)
        self.assertEqual(resposta.status_code, 403)

    def test_secretaria_nao_pode_cadastrar_usuarios(self):
        resposta = cliente(self.sec).post(
            self.url,
            {
                'username': 'usuario_bloqueado',
                'first_name': 'Usuario',
                'last_name': 'Teste',
                'email': 'bloqueado@escola.test',
                'perfil': 'professor',
                'password': 'SenhaSegura@123',
            },
            format='json',
        )
        self.assertEqual(resposta.status_code, 403)

    def test_administrador_pode_listar_sem_expor_senhas(self):
        resposta = cliente(self.admin_ti).get(self.url)

        self.assertEqual(resposta.status_code, 200)
        self.assertTrue(
            all('password' not in usuario for usuario in resposta.data)
        )

    def test_administrador_pode_cadastrar_usuario_com_senha_segura(self):
        resposta = cliente(self.admin_ti).post(
            self.url,
            {
                'username': 'novo_professor',
                'first_name': 'Novo',
                'last_name': 'Professor',
                'email': 'novo_professor@escola.test',
                'perfil': 'professor',
                'password': 'SenhaSegura@123',
            },
            format='json',
        )

        self.assertEqual(resposta.status_code, 201)
        self.assertNotIn('password', resposta.data)

        usuario = Usuario.objects.get(username='novo_professor')
        self.assertTrue(usuario.check_password('SenhaSegura@123'))
        self.assertTrue(
            usuario.groups.filter(name='Professor').exists()
        )

    def test_administrador_pode_atualizar_apenas_email(self):
        usuario = criar_usuario('professor_email', 'Professor')

        resposta = cliente(self.admin_ti).patch(
            f'{self.url}{usuario.pk}/',
            {'email': 'email_novo@escola.test'},
            format='json',
        )

        self.assertEqual(resposta.status_code, 200)
        usuario.refresh_from_db()
        self.assertEqual(usuario.email, 'email_novo@escola.test')
        self.assertTrue(usuario.groups.filter(name='Professor').exists())

    def test_atualizar_perfil_troca_grupo_do_usuario(self):
        usuario = criar_usuario('professor_perfil', 'Professor')

        resposta = cliente(self.admin_ti).patch(
            f'{self.url}{usuario.pk}/',
            {'perfil': 'secretaria'},
            format='json',
        )

        self.assertEqual(resposta.status_code, 200)
        usuario.refresh_from_db()
        self.assertTrue(usuario.groups.filter(name='Secretaria').exists())
        self.assertFalse(usuario.groups.filter(name='Professor').exists())

    def test_api_nao_permite_promover_usuario_a_superusuario(self):
        usuario = criar_usuario('professor_comum', 'Professor')

        resposta = cliente(self.admin_ti).patch(
            f'{self.url}{usuario.pk}/',
            {
                'is_superuser': True,
                'is_staff': True,
            },
            format='json',
        )

        usuario.refresh_from_db()
        self.assertFalse(usuario.is_superuser)
        self.assertFalse(usuario.is_staff)

    def test_nao_pode_desativar_a_propria_conta(self):
        resposta = cliente(self.admin_ti).post(
            f'{self.url}{self.admin_ti.pk}/desativar/',
            {},
            format='json',
        )

        self.assertEqual(resposta.status_code, 400)
        self.admin_ti.refresh_from_db()
        self.assertTrue(self.admin_ti.is_active)

    def test_nao_pode_rebaixar_o_ultimo_administrador_ativo(self):
        resposta = cliente(self.admin_ti).patch(
            f'{self.url}{self.admin_ti.pk}/',
            {'perfil': 'professor'},
            format='json',
        )

        self.assertEqual(resposta.status_code, 400)
        self.admin_ti.refresh_from_db()
        self.assertTrue(
            self.admin_ti.groups.filter(name='Administrador TI').exists()
        )

    def test_pode_rebaixar_administrador_se_houver_outro_ativo(self):
        outro_admin = criar_usuario(
            'outro_admin_ti',
            'Administrador TI',
        )

        resposta = cliente(self.admin_ti).patch(
            f'{self.url}{outro_admin.pk}/',
            {'perfil': 'professor'},
            format='json',
        )

        self.assertEqual(resposta.status_code, 200)
        outro_admin.refresh_from_db()
        self.assertTrue(
            outro_admin.groups.filter(name='Professor').exists()
        )

    def test_professor_nao_pode_ativar_usuario(self):
        usuario = criar_usuario('usuario_inativo', 'Professor')
        usuario.is_active = False
        usuario.save(update_fields=['is_active'])

        resposta = cliente(self.prof).post(
            f'{self.url}{usuario.pk}/ativar/',
            {},
            format='json',
        )

        self.assertEqual(resposta.status_code, 403)
        usuario.refresh_from_db()
        self.assertFalse(usuario.is_active)

    def test_professor_nao_pode_desativar_usuario(self):
        usuario = criar_usuario('usuario_ativo', 'Professor')

        resposta = cliente(self.prof).post(
            f'{self.url}{usuario.pk}/desativar/',
            {},
            format='json',
        )

        self.assertEqual(resposta.status_code, 403)
        usuario.refresh_from_db()
        self.assertTrue(usuario.is_active)

    def test_administrador_pode_ativar_usuario_inativo(self):
        usuario = criar_usuario('usuario_para_ativar', 'Professor')
        usuario.is_active = False
        usuario.save(update_fields=['is_active'])

        resposta = cliente(self.admin_ti).post(
            f'{self.url}{usuario.pk}/ativar/',
            {},
            format='json',
        )

        self.assertEqual(resposta.status_code, 200)
        usuario.refresh_from_db()
        self.assertTrue(usuario.is_active)

    def test_professor_nao_pode_alterar_perfil_de_usuario(self):
        usuario = criar_usuario('usuario_para_editar', 'Professor')

        resposta = cliente(self.prof).patch(
            f'{self.url}{usuario.pk}/',
            {'perfil': 'secretaria'},
            format='json',
        )

        self.assertEqual(resposta.status_code, 403)
        usuario.refresh_from_db()
        self.assertTrue(
            usuario.groups.filter(name='Professor').exists()
        )
        self.assertFalse(
            usuario.groups.filter(name='Secretaria').exists()
        )
