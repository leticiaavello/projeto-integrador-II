"""Testes unitários dos serializers (cadastros/serializers.py)."""
from datetime import date, time, timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework import serializers

from .helpers_teste import criar_usuario, nova_reserva, requisicao_falsa
from .models import Equipamento, Espaco
from .permissions import nome_exibicao
from .serializers import (
    BloqueioSerializer,
    EquipamentoSerializer,
    EspacoSerializer,
    ManutencaoSerializer,
    ReservaSerializer,
    UsuarioAdminSerializer,
)


class EspacoSerializerTest(TestCase):
    def test_dados_minimos_sao_validos(self):
        s = EspacoSerializer(data={'tipo': 'Sala', 'nome': 'Sala 05'})
        self.assertTrue(s.is_valid(), s.errors)

    def test_nome_e_tipo_sao_obrigatorios(self):
        s = EspacoSerializer(data={})
        self.assertFalse(s.is_valid())
        self.assertEqual(set(s.errors), {'nome', 'tipo'})

    def test_tipo_fora_da_lista_e_recusado(self):
        s = EspacoSerializer(data={'tipo': 'Castelo', 'nome': 'Sala 05'})
        self.assertFalse(s.is_valid())
        self.assertIn('tipo', s.errors)

    def test_nome_repetido_e_recusado_sem_distinguir_maiusculas(self):
        Espaco.objects.create(nome='Sala 01', tipo='Sala')
        s = EspacoSerializer(data={'tipo': 'Sala', 'nome': 'sala 01'})
        self.assertFalse(s.is_valid())
        self.assertEqual(str(s.errors['nome'][0]), 'Já existe um espaço com este nome.')

    def test_atualizar_mantendo_o_proprio_nome_e_valido(self):
        espaco = Espaco.objects.create(nome='Sala 01', tipo='Sala')
        s = EspacoSerializer(espaco, data={'nome': 'Sala 01'}, partial=True)
        self.assertTrue(s.is_valid(), s.errors)


class EquipamentoSerializerTest(TestCase):
    def test_exige_patrimonio_ou_simplificado(self):
        s = EquipamentoSerializer(data={'tipo': 'Projetor'})
        self.assertFalse(s.is_valid())
        self.assertIn('non_field_errors', s.errors)

    def test_apenas_patrimonio_ou_apenas_simplificado_basta(self):
        for dados in ({'patrimonio': '123'}, {'simplificado': 'S-1'}):
            with self.subTest(dados=dados):
                s = EquipamentoSerializer(data={'tipo': 'Projetor', **dados})
                self.assertTrue(s.is_valid(), s.errors)

    def test_texto_em_branco_vira_none(self):
        s = EquipamentoSerializer(data={
            'tipo': 'Projetor', 'patrimonio': '   ', 'simplificado': 'S-1',
        })
        self.assertTrue(s.is_valid(), s.errors)
        self.assertIsNone(s.validated_data['patrimonio'])

    def test_campo_local_grava_em_localizacao(self):
        s = EquipamentoSerializer(data={
            'tipo': 'Projetor', 'patrimonio': '1', 'local': 'Sala 3',
        })
        self.assertTrue(s.is_valid(), s.errors)
        equipamento = s.save()
        self.assertEqual(equipamento.localizacao, 'Sala 3')
        self.assertEqual(EquipamentoSerializer(equipamento).data['local'], 'Sala 3')

    def test_saida_nunca_traz_null_em_patrimonio_ou_simplificado(self):
        equipamento = Equipamento.objects.create(simplificado='S-1')
        dados = EquipamentoSerializer(equipamento).data
        self.assertEqual(dados['patrimonio'], '')
        self.assertEqual(dados['simplificado'], 'S-1')

    def test_atualizacao_parcial_usa_valores_ja_gravados(self):
        equipamento = Equipamento.objects.create(patrimonio='123', tipo='Projetor')
        s = EquipamentoSerializer(equipamento, data={'tipo': 'Notebook'}, partial=True)
        self.assertTrue(s.is_valid(), s.errors)

    def test_nao_pode_limpar_o_unico_identificador(self):
        equipamento = Equipamento.objects.create(patrimonio='123', tipo='Projetor')
        s = EquipamentoSerializer(equipamento, data={'patrimonio': ''}, partial=True)
        self.assertFalse(s.is_valid())

    def test_pode_limpar_patrimonio_se_houver_simplificado(self):
        equipamento = Equipamento.objects.create(
            patrimonio='123', simplificado='S-1', tipo='Projetor'
        )
        s = EquipamentoSerializer(equipamento, data={'patrimonio': ''}, partial=True)
        self.assertTrue(s.is_valid(), s.errors)
        self.assertIsNone(s.save().patrimonio)


class ReservaSerializerTest(TestCase):
    def setUp(self):
        self.usuario = criar_usuario(
            'maria', 'Professor', first_name='Maria', last_name='Silva'
        )
        self.contexto = {'request': requisicao_falsa(self.usuario)}
        self.amanha = (timezone.localdate() + timedelta(days=1)).isoformat()

    def dados(self, **extra):
        base = {
            'recurso': 'Sala 01',
            'data': self.amanha,
            'horario': '07h00–07h50',
            'finalidade': 'Aula',
        }
        base.update(extra)
        return base

    def serializer(self, **extra):
        return ReservaSerializer(data=self.dados(**extra), context=self.contexto)

    # --- validação ----------------------------------------------------------
    def test_horario_e_convertido_em_inicio_e_fim(self):
        s = self.serializer()
        self.assertTrue(s.is_valid(), s.errors)
        self.assertEqual(s.validated_data['horario_inicio'], time(7, 0))
        self.assertEqual(s.validated_data['horario_fim'], time(7, 50))
        self.assertNotIn('horario', s.validated_data)

    def test_horario_invalido(self):
        s = self.serializer(horario='amanhã cedo')
        self.assertFalse(s.is_valid())
        self.assertIn('Use o formato', str(s.errors['horario'][0]))

    def test_horario_final_deve_ser_depois_do_inicial(self):
        for horario in ('08h00–07h00', '07h00–07h00'):
            with self.subTest(horario=horario):
                s = self.serializer(horario=horario)
                self.assertFalse(s.is_valid())
                self.assertEqual(
                    str(s.errors['horario'][0]),
                    'O horário final deve ser depois do inicial.',
                )

    def test_data_passada_e_recusada(self):
        s = self.serializer(data='2020-01-01')
        self.assertFalse(s.is_valid())
        self.assertIn('data', s.errors)

    def test_reservar_para_hoje_e_permitido(self):
        s = self.serializer(data=timezone.localdate().isoformat())
        self.assertTrue(s.is_valid(), s.errors)

    def test_recurso_e_horario_sao_obrigatorios(self):
        s = ReservaSerializer(data={'data': self.amanha}, context=self.contexto)
        self.assertFalse(s.is_valid())
        self.assertIn('recurso', s.errors)
        self.assertIn('horario', s.errors)

    def test_recurso_em_branco_e_recusado(self):
        s = self.serializer(recurso='')
        self.assertFalse(s.is_valid())
        self.assertIn('recurso', s.errors)

    def test_atualizacao_parcial_sem_horario_e_valida(self):
        reserva = nova_reserva(usuario=self.usuario)
        s = ReservaSerializer(
            reserva, data={'finalidade': 'Nova'}, partial=True, context=self.contexto
        )
        self.assertTrue(s.is_valid(), s.errors)

    def test_atualizacao_pode_manter_data_passada(self):
        reserva = nova_reserva(usuario=self.usuario, data=date(2020, 1, 1))
        s = ReservaSerializer(
            reserva, data={'data': '2020-01-02'}, partial=True, context=self.contexto
        )
        self.assertTrue(s.is_valid(), s.errors)

    # --- saída --------------------------------------------------------------
    def test_representacao(self):
        reserva = nova_reserva(
            usuario=self.usuario, data=date(2026, 3, 10), turma='7º A'
        )
        dados = ReservaSerializer(reserva).data
        self.assertEqual(dados['status'], 'ativa')  # minúsculo, como o front espera
        self.assertEqual(dados['horario'], '07h00–07h50')
        self.assertEqual(dados['data'], '2026-03-10')
        self.assertEqual(dados['usuario'], 'Maria Silva')
        self.assertEqual(dados['turma'], '7º A')
        self.assertEqual(
            set(dados),
            {'id', 'recurso', 'data', 'horario', 'finalidade',
             'turma', 'status', 'usuario'},
        )

    def test_usuario_sem_conta_mostra_o_responsavel_gravado(self):
        reserva = nova_reserva(usuario=None, responsavel='Visitante')
        self.assertEqual(ReservaSerializer(reserva).data['usuario'], 'Visitante')

    # --- criação ------------------------------------------------------------
    def test_create_preenche_usuario_e_responsavel(self):
        s = self.serializer()
        s.is_valid(raise_exception=True)
        reserva = s.save()
        self.assertEqual(reserva.usuario, self.usuario)
        self.assertEqual(reserva.responsavel, nome_exibicao(self.usuario))
        self.assertEqual(reserva.status, 'ATIVA')

    def test_create_usa_finalidade_padrao_quando_vazia(self):
        s = self.serializer(finalidade='')
        s.is_valid(raise_exception=True)
        self.assertEqual(s.save().finalidade, 'Reserva')

    def test_create_usa_finalidade_padrao_quando_ausente(self):
        dados = self.dados()
        del dados['finalidade']
        s = ReservaSerializer(data=dados, context=self.contexto)
        s.is_valid(raise_exception=True)
        self.assertEqual(s.save().finalidade, 'Reserva')

    def test_create_recusa_horario_ocupado(self):
        primeiro = self.serializer()
        primeiro.is_valid(raise_exception=True)
        primeiro.save()

        segundo = self.serializer(horario='07h30–08h20')
        segundo.is_valid(raise_exception=True)
        with self.assertRaises(serializers.ValidationError) as ctx:
            segundo.save()
        self.assertIn('já está reservado', str(ctx.exception.detail[0]))

    # --- atualização --------------------------------------------------------
    def test_update_para_horario_ocupado_e_recusado(self):
        data = date.fromisoformat(self.amanha)
        nova_reserva(data=data, inicio=time(8, 0), fim=time(8, 50))
        reserva = nova_reserva(data=data, inicio=time(7, 0), fim=time(7, 50))
        s = ReservaSerializer(
            reserva, data={'horario': '08h00–08h50'}, partial=True,
            context=self.contexto,
        )
        s.is_valid(raise_exception=True)
        with self.assertRaises(serializers.ValidationError):
            s.save()

    def test_update_nao_conflita_com_a_propria_reserva(self):
        data = date.fromisoformat(self.amanha)
        reserva = nova_reserva(data=data, inicio=time(7, 0), fim=time(7, 50))
        s = ReservaSerializer(
            reserva, data={'horario': '07h00–07h50', 'finalidade': 'Outra'},
            partial=True, context=self.contexto,
        )
        s.is_valid(raise_exception=True)
        self.assertEqual(s.save().finalidade, 'Outra')

    def test_update_de_reserva_cancelada_nao_checa_conflito(self):
        data = date.fromisoformat(self.amanha)
        nova_reserva(data=data)  # ativa, mesmo horário
        cancelada = nova_reserva(data=data, status='CANCELADA')
        s = ReservaSerializer(
            cancelada, data={'finalidade': 'Ajuste'}, partial=True,
            context=self.contexto,
        )
        s.is_valid(raise_exception=True)
        self.assertEqual(s.save().finalidade, 'Ajuste')


class BloqueioSerializerTest(TestCase):
    def test_tipo_e_recurso_sao_obrigatorios(self):
        s = BloqueioSerializer(data={})
        self.assertFalse(s.is_valid())
        self.assertEqual(set(s.errors), {'tipo', 'recurso'})

    def test_campos_opcionais(self):
        s = BloqueioSerializer(data={'tipo': 'Sala', 'recurso': 'Sala 01'})
        self.assertTrue(s.is_valid(), s.errors)

    def test_data_pode_ser_nula(self):
        s = BloqueioSerializer(
            data={'tipo': 'Sala', 'recurso': 'Sala 01', 'data': None}
        )
        self.assertTrue(s.is_valid(), s.errors)
        self.assertIsNone(s.validated_data['data'])

    def test_origem_nao_pode_ser_enviada_pelo_cliente(self):
        s = BloqueioSerializer(data={
            'tipo': 'Sala', 'recurso': 'Sala 01', 'origem': 'SECRETARIA',
        })
        self.assertTrue(s.is_valid(), s.errors)
        self.assertNotIn('origem', s.validated_data)


class ManutencaoSerializerTest(TestCase):
    def test_campos_obrigatorios(self):
        s = ManutencaoSerializer(data={})
        self.assertFalse(s.is_valid())
        self.assertEqual(set(s.errors), {'tipo', 'recurso', 'inicio'})

    def test_previsao_e_motivo_sao_opcionais(self):
        s = ManutencaoSerializer(data={
            'tipo': 'Sala', 'recurso': 'Sala 01', 'inicio': '2026-03-01',
        })
        self.assertTrue(s.is_valid(), s.errors)

    def test_previsao_pode_ser_nula(self):
        s = ManutencaoSerializer(data={
            'tipo': 'Sala', 'recurso': 'Sala 01',
            'inicio': '2026-03-01', 'previsao': None,
        })
        self.assertTrue(s.is_valid(), s.errors)

    def test_situacao_invalida(self):
        s = ManutencaoSerializer(data={
            'tipo': 'Sala', 'recurso': 'Sala 01',
            'inicio': '2026-03-01', 'situacao': 'Quebrada',
        })
        self.assertFalse(s.is_valid())
        self.assertIn('situacao', s.errors)


class UsuarioAdminSerializerTest(TestCase):
    def dados(self, **extra):
        base = {
            'username': 'novo',
            'email': 'novo@escola.test',
            'perfil': 'professor',
            'password': 'SenhaSegura@123',
        }
        base.update(extra)
        return base

    def criar(self, **extra):
        s = UsuarioAdminSerializer(data=self.dados(**extra))
        s.is_valid(raise_exception=True)
        return s.save(), s

    # --- criação ------------------------------------------------------------
    def test_cria_usuario_com_senha_criptografada_e_grupo(self):
        usuario, s = self.criar()
        self.assertNotEqual(usuario.password, 'SenhaSegura@123')
        self.assertTrue(usuario.check_password('SenhaSegura@123'))
        self.assertEqual(
            list(usuario.groups.values_list('name', flat=True)), ['Professor']
        )
        self.assertTrue(usuario.is_active)

    def test_cada_perfil_vai_para_o_grupo_certo(self):
        esperado = {
            'professor': 'Professor',
            'coordenacao': 'Coordenação',
            'secretaria': 'Secretaria',
            'administrador': 'Administrador TI',
        }
        for perfil, grupo in esperado.items():
            with self.subTest(perfil=perfil):
                usuario, _ = self.criar(
                    perfil=perfil, username=f'u_{perfil}', email=f'{perfil}@escola.test'
                )
                self.assertEqual(
                    list(usuario.groups.values_list('name', flat=True)), [grupo]
                )

    def test_senha_nunca_aparece_na_resposta(self):
        _, s = self.criar()
        self.assertNotIn('password', s.data)

    def test_senha_preserva_espacos(self):
        senha = '  senha com espacos  '
        usuario, _ = self.criar(password=senha)
        self.assertTrue(usuario.check_password(senha))

    def test_senha_e_obrigatoria_no_cadastro(self):
        dados = self.dados()
        del dados['password']
        s = UsuarioAdminSerializer(data=dados)
        self.assertFalse(s.is_valid())
        self.assertIn('password', s.errors)

    def test_senha_com_menos_de_10_caracteres_e_recusada(self):
        s = UsuarioAdminSerializer(data=self.dados(password='Curta@123'))
        self.assertFalse(s.is_valid())
        self.assertIn('password', s.errors)

    def test_perfil_invalido(self):
        s = UsuarioAdminSerializer(data=self.dados(perfil='dono'))
        self.assertFalse(s.is_valid())
        self.assertIn('perfil', s.errors)

    def test_username_repetido_sem_distinguir_maiusculas(self):
        criar_usuario('novo', 'Professor')
        s = UsuarioAdminSerializer(data=self.dados(username='NOVO'))
        self.assertFalse(s.is_valid())
        self.assertIn('username', s.errors)

    def test_email_repetido_sem_distinguir_maiusculas(self):
        criar_usuario('outro', 'Professor', email='novo@escola.test')
        s = UsuarioAdminSerializer(data=self.dados(email='NOVO@escola.test'))
        self.assertFalse(s.is_valid())
        self.assertIn('email', s.errors)

    # --- atualização --------------------------------------------------------
    def test_atualizar_mantendo_username_e_email_e_valido(self):
        usuario = criar_usuario('maria', 'Professor')
        s = UsuarioAdminSerializer(
            usuario,
            data={'username': 'maria', 'email': usuario.email},
            partial=True,
        )
        self.assertTrue(s.is_valid(), s.errors)

    def test_atualizar_para_email_de_outro_usuario_e_recusado(self):
        criar_usuario('joao', 'Professor', email='joao@escola.test')
        maria = criar_usuario('maria', 'Professor')
        s = UsuarioAdminSerializer(
            maria, data={'email': 'joao@escola.test'}, partial=True
        )
        self.assertFalse(s.is_valid())
        self.assertIn('email', s.errors)

    def test_atualizar_perfil_e_senha(self):
        usuario = criar_usuario('maria', 'Professor')
        s = UsuarioAdminSerializer(
            usuario,
            data={'perfil': 'secretaria', 'password': 'OutraSenha@123'},
            partial=True,
        )
        s.is_valid(raise_exception=True)
        usuario = s.save()
        self.assertEqual(
            list(usuario.groups.values_list('name', flat=True)), ['Secretaria']
        )
        self.assertTrue(usuario.check_password('OutraSenha@123'))

    def test_atualizar_sem_perfil_nem_senha_preserva_ambos(self):
        usuario = criar_usuario('maria', 'Professor')
        s = UsuarioAdminSerializer(
            usuario, data={'first_name': 'Maria Clara'}, partial=True
        )
        s.is_valid(raise_exception=True)
        usuario = s.save()
        self.assertEqual(usuario.first_name, 'Maria Clara')
        self.assertTrue(usuario.check_password('Senha@12345'))
        self.assertTrue(usuario.groups.filter(name='Professor').exists())

    # --- saída --------------------------------------------------------------
    def test_representacao(self):
        usuario = criar_usuario('maria', 'Coordenação', last_name='Silva')
        dados = UsuarioAdminSerializer(usuario).data
        self.assertEqual(
            set(dados),
            {'id', 'username', 'first_name', 'last_name', 'email',
             'perfil', 'is_active', 'date_joined'},
        )
        self.assertEqual(dados['perfil'], 'coordenacao')
        self.assertEqual(dados['last_name'], 'Silva')
        self.assertTrue(dados['is_active'])
        self.assertIsInstance(dados['date_joined'], str)

    def test_usuario_sem_grupo_tem_perfil_nulo(self):
        dados = UsuarioAdminSerializer(criar_usuario('sem_grupo')).data
        self.assertIsNone(dados['perfil'])
