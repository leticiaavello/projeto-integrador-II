"""Testes das views/API (cadastros/views.py).

Complementam os de ``tests.py``: aqui ficam autenticação, filtros, auditoria
(LogOperacao), efeitos colaterais entre recursos e casos de borda.
"""
import json
import unittest
from datetime import date

from django.test import Client, TestCase
from rest_framework.test import APIClient

from .helpers_teste import BaseAPITestCase, SENHA, cliente, criar_usuario
from .models import (
    Bloqueio,
    Equipamento,
    Espaco,
    LogOperacao,
    Manutencao,
)


# --------------------------------------------------------------------------
# Autenticação (sessão + CSRF)
# --------------------------------------------------------------------------

class AutenticacaoTest(TestCase):
    def setUp(self):
        self.prof = criar_usuario(
            'maria', 'Professor', first_name='Maria', last_name='Silva'
        )

    def login(self, **dados):
        c = Client()
        corpo = {'email': 'maria@escola.test', 'senha': SENHA}
        corpo.update(dados)
        return c, c.post(
            '/api/login/', json.dumps(corpo), content_type='application/json'
        )

    def test_csrf_devolve_token_e_grava_cookie(self):
        c = Client()
        r = c.get('/api/csrf/')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()['csrfToken'])
        self.assertIn('csrftoken', r.cookies)

    def test_login_ok_devolve_dados_do_usuario(self):
        _, r = self.login()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['usuario'], {
            'nome': 'Maria Silva',
            'email': 'maria@escola.test',
            'perfil': 'professor',
        })

    def test_login_ignora_maiusculas_e_espacos_no_email(self):
        _, r = self.login(email='  MARIA@Escola.Test ')
        self.assertEqual(r.status_code, 200)

    def test_login_registra_auditoria(self):
        self.login()
        log = LogOperacao.objects.get(acao='login')
        self.assertEqual(log.usuario, self.prof)
        self.assertEqual(log.objeto_id, str(self.prof.pk))

    def test_login_exige_email_e_senha(self):
        for dados in ({'email': ''}, {'senha': ''}, {'email': '   '}):
            with self.subTest(dados=dados):
                _, r = self.login(**dados)
                self.assertEqual(r.status_code, 400)

    def test_login_com_json_invalido(self):
        r = Client().post(
            '/api/login/', 'isto não é json', content_type='application/json'
        )
        self.assertEqual(r.status_code, 400)

    def test_login_com_email_inexistente(self):
        _, r = self.login(email='ninguem@escola.test')
        self.assertEqual(r.status_code, 401)
        # mesma mensagem da senha errada: não revela se o e-mail existe
        _, r2 = self.login(senha='errada')
        self.assertEqual(r.json()['erro'], r2.json()['erro'])

    def test_login_com_senha_errada(self):
        _, r = self.login(senha='errada')
        self.assertEqual(r.status_code, 401)

    def test_login_de_usuario_sem_perfil(self):
        criar_usuario('sem_perfil')
        _, r = self.login(email='sem_perfil@escola.test')
        self.assertEqual(r.status_code, 403)
        self.assertFalse(LogOperacao.objects.filter(acao='login').exists())

    def test_login_so_aceita_post(self):
        self.assertEqual(Client().get('/api/login/').status_code, 405)

    @unittest.expectedFailure
    def test_login_com_json_que_nao_e_objeto_deveria_dar_400(self):
        """BUG CONHECIDO: ``json.loads('[]')`` devolve lista e ``.get`` quebra.

        Remova o ``expectedFailure`` depois de validar o corpo com
        ``isinstance(dados, dict)`` em ``login_api``.
        """
        c = Client(raise_request_exception=False)
        r = c.post('/api/login/', '[]', content_type='application/json')
        self.assertEqual(r.status_code, 400)

    def test_me_exige_sessao(self):
        self.assertEqual(Client().get('/api/me/').status_code, 401)

    def test_me_depois_do_login_e_logout(self):
        c, _ = self.login()
        r = c.get('/api/me/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['usuario']['perfil'], 'professor')

        self.assertEqual(c.post('/api/logout/').status_code, 200)
        self.assertEqual(c.get('/api/me/').status_code, 401)


# --------------------------------------------------------------------------
# Espaços
# --------------------------------------------------------------------------

class EspacoAPITest(BaseAPITestCase):
    def test_todos_os_perfis_listam(self):
        for usuario in (self.prof, self.coord, self.sec, self.admin_ti):
            with self.subTest(usuario=usuario.username):
                r = cliente(usuario).get('/api/espacos/')
                self.assertEqual(r.status_code, 200)

    def test_nao_autenticado_nao_lista(self):
        self.assertIn(APIClient().get('/api/espacos/').status_code, (401, 403))

    def test_lista_apenas_espacos_ativos(self):
        Espaco.objects.create(nome='Sala velha', tipo='Sala', ativo=False)
        nomes = [e['nome'] for e in cliente(self.prof).get('/api/espacos/').data]
        self.assertEqual(nomes, ['Sala 01'])

    def test_criar_registra_auditoria(self):
        r = cliente(self.sec).post(
            '/api/espacos/', {'tipo': 'Sala', 'nome': 'Sala 50'}, format='json'
        )
        self.assertEqual(r.status_code, 201, r.data)
        log = LogOperacao.objects.get(acao='criar', entidade='Espaco')
        self.assertEqual(log.usuario, self.sec)
        self.assertEqual(log.objeto_id, str(r.data['id']))

    def test_nome_repetido_e_recusado(self):
        r = cliente(self.sec).post(
            '/api/espacos/', {'tipo': 'Sala', 'nome': 'sala 01'}, format='json'
        )
        self.assertEqual(r.status_code, 400)

    def test_perfis_sem_permissao_nao_criam(self):
        for usuario in (self.prof, self.coord, self.admin_ti):
            with self.subTest(usuario=usuario.username):
                r = cliente(usuario).post(
                    '/api/espacos/', {'tipo': 'Sala', 'nome': 'Sala 60'},
                    format='json',
                )
                self.assertEqual(r.status_code, 403)

    def test_tornar_indisponivel_cria_bloqueio_da_secretaria(self):
        cliente(self.sec).patch(
            f'/api/espacos/{self.sala.pk}/', {'situacao': 'Indisponível'},
            format='json',
        )
        bloqueio = Bloqueio.objects.get(recurso='Sala 01')
        self.assertTrue(bloqueio.ativo)
        self.assertEqual(bloqueio.origem, 'SECRETARIA')
        self.assertEqual(bloqueio.criado_por, self.sec)
        self.assertEqual(bloqueio.tipo, 'Sala')

    def test_voltar_a_disponivel_desativa_o_bloqueio(self):
        c = cliente(self.sec)
        url = f'/api/espacos/{self.sala.pk}/'
        c.patch(url, {'situacao': 'Indisponível'}, format='json')
        c.patch(url, {'situacao': 'Disponível'}, format='json')

        bloqueio = Bloqueio.objects.get(recurso='Sala 01')
        self.assertFalse(bloqueio.ativo)
        self.assertIsNotNone(bloqueio.removido_em)
        self.assertEqual(self.reservar(self.prof).status_code, 201)

    def test_nao_duplica_bloqueio_permanente_ja_existente(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='SECRETARIA'
        )
        cliente(self.sec).patch(
            f'/api/espacos/{self.sala.pk}/', {'situacao': 'Indisponível'},
            format='json',
        )
        self.assertEqual(Bloqueio.objects.filter(recurso='Sala 01').count(), 1)

    def test_editar_sem_mudar_situacao_nao_mexe_nos_bloqueios(self):
        cliente(self.sec).patch(
            f'/api/espacos/{self.sala.pk}/', {'capacidade': '40'}, format='json'
        )
        self.assertFalse(Bloqueio.objects.exists())

    def test_atualizacao_registra_a_transicao_de_situacao(self):
        cliente(self.sec).patch(
            f'/api/espacos/{self.sala.pk}/', {'situacao': 'Indisponível'},
            format='json',
        )
        log = LogOperacao.objects.get(acao='atualizar', entidade='Espaco')
        self.assertIn('Disponível -> Indisponível', log.detalhe)

    def test_delete_nao_e_permitido(self):
        r = cliente(self.sec).delete(f'/api/espacos/{self.sala.pk}/')
        self.assertEqual(r.status_code, 405)
        self.assertTrue(Espaco.objects.filter(pk=self.sala.pk).exists())


# --------------------------------------------------------------------------
# Equipamentos
# --------------------------------------------------------------------------

class EquipamentoAPITest(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.eq = Equipamento.objects.create(patrimonio='111', tipo='Projetor')

    def test_atualizar_situacao(self):
        r = cliente(self.sec).patch(
            f'/api/equipamentos/{self.eq.pk}/',
            {'situacao': 'Em manutenção'}, format='json',
        )
        self.assertEqual(r.status_code, 200, r.data)
        self.eq.refresh_from_db()
        self.assertEqual(self.eq.situacao, 'Em manutenção')
        self.assertTrue(
            LogOperacao.objects.filter(
                acao='atualizar', entidade='Equipamento'
            ).exists()
        )

    def test_equipamento_em_manutencao_nao_pode_ser_reservado(self):
        Equipamento.objects.filter(pk=self.eq.pk).update(situacao='Em manutenção')
        self.assertEqual(self.reservar(self.prof, recurso='111').status_code, 400)

    def test_equipamento_disponivel_pode_ser_reservado(self):
        self.assertEqual(self.reservar(self.prof, recurso='111').status_code, 201)

    # --- importação ---------------------------------------------------------
    def test_importar_cria_varios_e_registra_auditoria(self):
        r = cliente(self.sec).post(
            '/api/equipamentos/importar/',
            [
                {'tipo': 'Notebook', 'patrimonio': '301', 'local': 'Sala 1'},
                {'tipo': 'Tablet', 'simplificado': 'T-1'},
            ],
            format='json',
        )
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(len(r.data), 2)
        self.assertEqual(r.data[1]['patrimonio'], '')  # nunca null
        self.assertEqual(Equipamento.objects.count(), 3)
        log = LogOperacao.objects.get(acao='importar')
        self.assertEqual(log.detalhe, '2 equipamentos')

    def test_importar_recusa_item_sem_identificador(self):
        r = cliente(self.sec).post(
            '/api/equipamentos/importar/',
            [{'tipo': 'Notebook', 'patrimonio': '301'}, {'tipo': 'Tablet'}],
            format='json',
        )
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Equipamento.objects.count(), 1)  # nada foi gravado

    def test_importar_com_patrimonio_repetido_no_proprio_arquivo(self):
        r = cliente(self.sec).post(
            '/api/equipamentos/importar/',
            [
                {'tipo': 'Notebook', 'patrimonio': '500'},
                {'tipo': 'Notebook', 'patrimonio': '500'},
            ],
            format='json',
        )
        self.assertEqual(r.status_code, 400)
        self.assertIn('repetido', r.data['detail'])
        self.assertFalse(Equipamento.objects.filter(patrimonio='500').exists())

    def test_importar_so_para_secretaria(self):
        for usuario in (self.prof, self.coord, self.admin_ti):
            with self.subTest(usuario=usuario.username):
                r = cliente(usuario).post(
                    '/api/equipamentos/importar/',
                    [{'tipo': 'X', 'patrimonio': '900'}], format='json',
                )
                self.assertEqual(r.status_code, 403)


# --------------------------------------------------------------------------
# Reservas
# --------------------------------------------------------------------------

class ReservaAPITest(BaseAPITestCase):
    def test_coordenacao_tambem_reserva(self):
        self.assertEqual(self.reservar(self.coord).status_code, 201)

    def test_administrador_nao_reserva_mas_consulta(self):
        self.assertEqual(self.reservar(self.admin_ti).status_code, 403)
        self.assertEqual(cliente(self.admin_ti).get('/api/reservas/').status_code, 200)

    def test_horario_invalido_e_fim_antes_do_inicio(self):
        for horario in ('qualquer', '09h00–08h00'):
            with self.subTest(horario=horario):
                r = self.reservar(self.prof, horario=horario)
                self.assertEqual(r.status_code, 400)
                self.assertIn('horario', r.data)

    def test_bloqueio_com_data_so_vale_naquele_dia(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO',
            data=date(2020, 1, 1),
        )
        self.assertEqual(self.reservar(self.prof).status_code, 201)

    def test_criar_e_cancelar_registram_auditoria(self):
        rid = self.reservar(self.prof).data['id']
        cliente(self.prof).post(f'/api/reservas/{rid}/cancelar/')

        acoes = list(
            LogOperacao.objects.filter(entidade='Reserva')
            .order_by('id').values_list('acao', flat=True)
        )
        self.assertEqual(acoes, ['criar', 'cancelar'])
        self.assertTrue(
            LogOperacao.objects.filter(acao='criar', usuario=self.prof).exists()
        )

    def test_cancelar_reserva_inexistente(self):
        r = cliente(self.prof).post('/api/reservas/9999/cancelar/')
        self.assertEqual(r.status_code, 404)

    def test_secretaria_e_administrador_nao_cancelam(self):
        rid = self.reservar(self.prof).data['id']
        for usuario in (self.sec, self.admin_ti):
            with self.subTest(usuario=usuario.username):
                r = cliente(usuario).post(f'/api/reservas/{rid}/cancelar/')
                self.assertEqual(r.status_code, 403)

    # --- consulta -----------------------------------------------------------
    def test_filtros_da_listagem(self):
        Espaco.objects.create(nome='Sala 02', tipo='Sala')
        self.reservar(self.prof)
        self.reservar(self.prof2, recurso='Sala 02', horario='08h00–08h50')
        c = cliente(self.coord)

        self.assertEqual(len(c.get('/api/reservas/').data), 2)
        self.assertEqual(len(c.get('/api/reservas/?recurso=02').data), 1)
        self.assertEqual(len(c.get('/api/reservas/?recurso=sala').data), 2)
        self.assertEqual(len(c.get('/api/reservas/?usuario=joao').data), 1)
        self.assertEqual(len(c.get('/api/reservas/?usuario=ninguem').data), 0)
        self.assertEqual(len(c.get(f'/api/reservas/?data={self.amanha}').data), 2)
        self.assertEqual(len(c.get('/api/reservas/?data=2001-01-01').data), 0)

    # --- edição (somente coordenação) --------------------------------------
    def test_so_coordenacao_edita_reserva(self):
        rid = self.reservar(self.prof).data['id']
        url = f'/api/reservas/{rid}/'

        self.assertEqual(
            cliente(self.prof).patch(url, {'finalidade': 'x'}, format='json').status_code,
            403,
        )
        r = cliente(self.coord).patch(url, {'finalidade': 'Prova'}, format='json')
        self.assertEqual(r.status_code, 200, r.data)
        self.assertEqual(r.data['finalidade'], 'Prova')
        self.assertTrue(
            LogOperacao.objects.filter(acao='atualizar', entidade='Reserva').exists()
        )

    def test_edicao_nao_pode_criar_conflito(self):
        self.reservar(self.prof, horario='08h00–08h50')
        rid = self.reservar(self.prof2, horario='07h00–07h50').data['id']
        r = cliente(self.coord).patch(
            f'/api/reservas/{rid}/', {'horario': '08h00–08h50'}, format='json'
        )
        self.assertEqual(r.status_code, 400)


# --------------------------------------------------------------------------
# Bloqueios
# --------------------------------------------------------------------------

class BloqueioAPITest(BaseAPITestCase):
    def criar(self, usuario, **extra):
        dados = {'tipo': 'Sala', 'recurso': 'Sala 01', 'motivo': 'Reforma'}
        dados.update(extra)
        return cliente(usuario).post('/api/bloqueios/', dados, format='json')

    def test_origem_depende_do_perfil_de_quem_bloqueia(self):
        r1 = self.criar(self.coord)
        r2 = self.criar(self.sec, recurso='Sala 02')
        self.assertEqual(r1.status_code, 201, r1.data)
        self.assertEqual(r1.data['origem'], 'COORDENACAO')
        self.assertEqual(r2.data['origem'], 'SECRETARIA')

    def test_registra_quem_criou_e_auditoria(self):
        r = self.criar(self.coord)
        self.assertEqual(Bloqueio.objects.get(pk=r.data['id']).criado_por, self.coord)
        self.assertTrue(
            LogOperacao.objects.filter(acao='bloquear', entidade='Bloqueio').exists()
        )

    def test_professor_e_administrador_nao_bloqueiam(self):
        for usuario in (self.prof, self.admin_ti):
            with self.subTest(usuario=usuario.username):
                self.assertEqual(self.criar(usuario).status_code, 403)

    def test_lista_so_bloqueios_ativos(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='A', origem='COORDENACAO', ativo=False
        )
        Bloqueio.objects.create(tipo='Sala', recurso='B', origem='COORDENACAO')
        recursos = [b['recurso'] for b in cliente(self.prof).get('/api/bloqueios/').data]
        self.assertEqual(recursos, ['B'])

    def test_bloqueio_impede_reserva_e_desbloqueio_libera(self):
        bid = self.criar(self.coord).data['id']
        self.assertEqual(self.reservar(self.prof).status_code, 400)

        r = cliente(self.coord).delete(f'/api/bloqueios/{bid}/')
        self.assertEqual(r.status_code, 204)
        self.assertEqual(self.reservar(self.prof).status_code, 201)

    def test_desbloquear_preserva_historico(self):
        bid = self.criar(self.coord).data['id']
        cliente(self.coord).delete(f'/api/bloqueios/{bid}/')

        bloqueio = Bloqueio.objects.get(pk=bid)  # continua no banco
        self.assertFalse(bloqueio.ativo)
        self.assertIsNotNone(bloqueio.removido_em)
        self.assertTrue(
            LogOperacao.objects.filter(acao='desbloquear', objeto_id=str(bid)).exists()
        )

    def test_bloqueio_ja_desativado_some_da_api(self):
        bid = self.criar(self.coord).data['id']
        cliente(self.coord).delete(f'/api/bloqueios/{bid}/')
        self.assertEqual(cliente(self.coord).delete(f'/api/bloqueios/{bid}/').status_code, 404)

    def test_secretaria_nao_desbloqueia_o_da_coordenacao(self):
        bid = self.criar(self.coord).data['id']
        r = cliente(self.sec).delete(f'/api/bloqueios/{bid}/')
        self.assertEqual(r.status_code, 403)
        self.assertIn('Coordenação', r.data['detail'])
        self.assertTrue(Bloqueio.objects.get(pk=bid).ativo)

    def test_bloqueio_de_uma_aula_nao_impede_as_outras(self):
        self.criar(self.coord, aula='1ª aula (07h00–07h50)')
        self.assertEqual(self.reservar(self.prof, horario='07h00–07h50').status_code, 400)
        self.assertEqual(self.reservar(self.prof, horario='08h40–09h30').status_code, 201)

    def test_patch_nao_e_permitido(self):
        bid = self.criar(self.coord).data['id']
        r = cliente(self.coord).patch(f'/api/bloqueios/{bid}/', {'motivo': 'x'}, format='json')
        self.assertEqual(r.status_code, 405)


# --------------------------------------------------------------------------
# Manutenções
# --------------------------------------------------------------------------

class ManutencaoAPITest(BaseAPITestCase):
    def criar(self, **extra):
        dados = {
            'tipo': 'Equipamento', 'recurso': 'Projetor 123',
            'inicio': self.amanha, 'motivo': 'Lâmpada queimada',
        }
        dados.update(extra)
        return cliente(self.sec).post('/api/manutencoes/', dados, format='json')

    def test_criar_registra_criador_e_auditoria(self):
        r = self.criar()
        self.assertEqual(r.status_code, 201, r.data)
        manutencao = Manutencao.objects.get(pk=r.data['id'])
        self.assertEqual(manutencao.criado_por, self.sec)
        self.assertEqual(manutencao.situacao, 'Em manutenção')
        self.assertTrue(
            LogOperacao.objects.filter(acao='criar', entidade='Manutencao').exists()
        )

    def test_bloqueio_gerado_herda_dados_da_manutencao(self):
        r = self.criar()
        bloqueio = Bloqueio.objects.get(manutencao_id=r.data['id'])
        self.assertEqual(bloqueio.recurso, 'Projetor 123')
        self.assertEqual(bloqueio.tipo, 'Equipamento')
        self.assertEqual(bloqueio.motivo, 'Lâmpada queimada')
        self.assertEqual(bloqueio.origem, 'SECRETARIA')

    def test_bloqueio_usa_motivo_padrao_quando_nao_informado(self):
        r = self.criar(motivo='')
        self.assertEqual(Bloqueio.objects.get(manutencao_id=r.data['id']).motivo, 'Manutenção')

    def test_manutencao_impede_reserva_do_recurso(self):
        Espaco.objects.create(nome='Lab 1', tipo='Laboratório')
        self.criar(tipo='Laboratório', recurso='Lab 1')
        self.assertEqual(self.reservar(self.prof, recurso='Lab 1').status_code, 400)

    def test_concluir_desativa_os_bloqueios_da_manutencao(self):
        mid = self.criar().data['id']
        r = cliente(self.sec).patch(
            f'/api/manutencoes/{mid}/', {'situacao': 'Concluída'}, format='json'
        )
        self.assertEqual(r.status_code, 200, r.data)
        bloqueio = Bloqueio.objects.get(manutencao_id=mid)
        self.assertFalse(bloqueio.ativo)
        self.assertIsNotNone(bloqueio.removido_em)
        self.assertEqual(self.reservar(self.prof, recurso='Projetor 123').status_code, 201)

    def test_outras_alteracoes_mantem_o_bloqueio(self):
        mid = self.criar().data['id']
        cliente(self.sec).patch(
            f'/api/manutencoes/{mid}/', {'previsao': self.amanha}, format='json'
        )
        self.assertTrue(Bloqueio.objects.get(manutencao_id=mid).ativo)

    def test_so_secretaria_altera(self):
        mid = self.criar().data['id']
        for usuario in (self.prof, self.coord, self.admin_ti):
            with self.subTest(usuario=usuario.username):
                r = cliente(usuario).patch(
                    f'/api/manutencoes/{mid}/', {'situacao': 'Concluída'}, format='json'
                )
                self.assertEqual(r.status_code, 403)
        self.assertTrue(Bloqueio.objects.get(manutencao_id=mid).ativo)


# --------------------------------------------------------------------------
# Administração de usuários
# --------------------------------------------------------------------------

class UsuarioAPITest(BaseAPITestCase):
    url = '/api/usuarios/'

    def dados(self, **extra):
        base = {
            'username': 'novo', 'first_name': 'Novo', 'last_name': 'Usuário',
            'email': 'novo@escola.test', 'perfil': 'professor',
            'password': 'SenhaSegura@123',
        }
        base.update(extra)
        return base

    def admin(self):
        return cliente(self.admin_ti)

    def test_cadastro_registra_auditoria(self):
        r = self.admin().post(self.url, self.dados(), format='json')
        self.assertEqual(r.status_code, 201, r.data)
        log = LogOperacao.objects.get(acao='criar', entidade='Usuario')
        self.assertEqual(log.usuario, self.admin_ti)
        self.assertIn('novo', log.detalhe)

    def test_novo_usuario_consegue_entrar(self):
        self.admin().post(self.url, self.dados(), format='json')
        c = Client()
        r = c.post(
            '/api/login/',
            json.dumps({'email': 'novo@escola.test', 'senha': 'SenhaSegura@123'}),
            content_type='application/json',
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()['usuario']['perfil'], 'professor')

    def test_cadastro_recusa_dados_invalidos(self):
        casos = {
            'sem senha': {'password': None},
            'senha curta': {'password': 'curta'},
            'perfil inexistente': {'perfil': 'dono'},
            'e-mail inválido': {'email': 'x'},
            'username repetido': {'username': 'MARIA'},
            'e-mail repetido': {'email': 'maria@escola.test'},
        }
        for nome, extra in casos.items():
            with self.subTest(caso=nome):
                dados = self.dados(**extra)
                dados = {k: v for k, v in dados.items() if v is not None}
                r = self.admin().post(self.url, dados, format='json')
                self.assertEqual(r.status_code, 400, r.data)

    def test_atualizar_senha(self):
        r = self.admin().patch(
            f'{self.url}{self.prof.pk}/', {'password': 'NovaSenha@123'}, format='json'
        )
        self.assertEqual(r.status_code, 200)
        self.prof.refresh_from_db()
        self.assertTrue(self.prof.check_password('NovaSenha@123'))
        self.assertNotIn('password', r.data)

    def test_is_active_nao_pode_ser_alterado_por_patch(self):
        self.admin().patch(
            f'{self.url}{self.prof.pk}/', {'is_active': False}, format='json'
        )
        self.prof.refresh_from_db()
        self.assertTrue(self.prof.is_active)

    def test_desativar_usuario_comum(self):
        r = self.admin().post(f'{self.url}{self.prof.pk}/desativar/')
        self.assertEqual(r.status_code, 200)
        self.assertFalse(r.data['is_active'])
        self.assertTrue(
            LogOperacao.objects.filter(acao='desativar', entidade='Usuario').exists()
        )

    def test_usuario_desativado_nao_consegue_entrar(self):
        self.admin().post(f'{self.url}{self.prof.pk}/desativar/')
        r = Client().post(
            '/api/login/',
            json.dumps({'email': 'maria@escola.test', 'senha': SENHA}),
            content_type='application/json',
        )
        self.assertEqual(r.status_code, 401)

    def test_desativar_outro_administrador_quando_ha_mais_de_um(self):
        outro = criar_usuario('outro_admin', 'Administrador TI')
        r = self.admin().post(f'{self.url}{outro.pk}/desativar/')
        self.assertEqual(r.status_code, 200)
        outro.refresh_from_db()
        self.assertFalse(outro.is_active)

    def test_ativar_registra_auditoria(self):
        self.prof.is_active = False
        self.prof.save()
        r = self.admin().post(f'{self.url}{self.prof.pk}/ativar/')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data['is_active'])
        self.assertTrue(
            LogOperacao.objects.filter(acao='ativar', entidade='Usuario').exists()
        )

    def test_outros_perfis_nao_acessam_nenhuma_rota(self):
        for usuario in (self.prof, self.coord, self.sec):
            c = cliente(usuario)
            with self.subTest(usuario=usuario.username):
                self.assertEqual(c.get(self.url).status_code, 403)
                self.assertEqual(c.get(f'{self.url}{self.prof.pk}/').status_code, 403)
                self.assertEqual(c.post(self.url, self.dados(), format='json').status_code, 403)
                self.assertEqual(c.post(f'{self.url}{self.prof.pk}/desativar/').status_code, 403)
