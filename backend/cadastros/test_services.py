"""Testes unitários das regras de negócio (cadastros/services.py)."""
from datetime import date, time
from unittest.mock import patch

from django.contrib.auth.models import AnonymousUser
from django.test import SimpleTestCase, TestCase

from .helpers_teste import criar_usuario, nova_reserva
from .models import Bloqueio, Equipamento, Espaco, LogOperacao
from .services import (
    interpretar_horario,
    motivos_de_indisponibilidade,
    registrar,
    travar_recurso,
)


class InterpretarHorarioTest(SimpleTestCase):
    def test_formatos_aceitos(self):
        esperado = (time(7, 50), time(8, 40))
        entradas = [
            '07h50–08h40',  # travessão (en dash)
            '07h50-08h40',  # hífen
            '07h50—08h40',  # travessão longo (em dash)
            '07h50 – 08h40',  # com espaços
            '2ª aula (07h50–08h40)',  # com rótulo da aula
            'Das 07h50-08h40 de hoje',  # texto ao redor
        ]
        for texto in entradas:
            with self.subTest(texto=texto):
                self.assertEqual(interpretar_horario(texto), esperado)

    def test_hora_com_um_digito(self):
        self.assertEqual(
            interpretar_horario('7h05–8h40'), (time(7, 5), time(8, 40))
        )

    def test_textos_nao_reconhecidos(self):
        entradas = [
            None,
            '',
            'qualquer coisa',
            '07:50–08:40',  # dois-pontos em vez de "h"
            '07h50',  # sem fim
            '7h5–8h4',  # minutos precisam de 2 dígitos
        ]
        for texto in entradas:
            with self.subTest(texto=texto):
                self.assertIsNone(interpretar_horario(texto))

    def test_horas_invalidas_retornam_none(self):
        for texto in ('25h00–26h00', '07h60–08h00', '07h00–08h99'):
            with self.subTest(texto=texto):
                self.assertIsNone(interpretar_horario(texto))


class RegistrarTest(TestCase):
    def test_grava_log_completo(self):
        usuario = criar_usuario('maria', 'Professor')
        registrar(usuario, 'criar', 'Reserva', 7, 'Sala 01 amanhã')

        log = LogOperacao.objects.get()
        self.assertEqual(log.usuario, usuario)
        self.assertEqual(log.acao, 'criar')
        self.assertEqual(log.entidade, 'Reserva')
        self.assertEqual(log.objeto_id, '7')  # sempre texto
        self.assertEqual(log.detalhe, 'Sala 01 amanhã')

    def test_valores_padrao(self):
        registrar(None, 'login', 'Usuario')
        log = LogOperacao.objects.get()
        self.assertEqual(log.objeto_id, '')
        self.assertEqual(log.detalhe, '')

    def test_usuario_anonimo_ou_none_vira_null(self):
        registrar(AnonymousUser(), 'a', 'E')
        registrar(None, 'b', 'E')
        self.assertEqual(LogOperacao.objects.count(), 2)
        self.assertFalse(
            LogOperacao.objects.exclude(usuario__isnull=True).exists()
        )

    def test_detalhe_e_truncado_em_2000_caracteres(self):
        registrar(None, 'a', 'E', detalhe='x' * 2500)
        self.assertEqual(len(LogOperacao.objects.get().detalhe), 2000)


class TravarRecursoTest(SimpleTestCase):
    @patch('cadastros.services.connection')
    def test_fora_do_postgres_nao_faz_nada(self, conexao):
        conexao.vendor = 'sqlite'
        travar_recurso('Sala 01', date(2026, 1, 5))
        conexao.cursor.assert_not_called()

    @patch('cadastros.services.connection')
    def test_postgres_pede_advisory_lock(self, conexao):
        conexao.vendor = 'postgresql'
        cursor = conexao.cursor.return_value.__enter__.return_value

        travar_recurso('Sala 01', date(2026, 1, 5))

        cursor.execute.assert_called_once_with(
            'SELECT pg_advisory_xact_lock(hashtext(%s))',
            ['Sala 01|2026-01-05'],
        )

    @patch('cadastros.services.connection')
    def test_chave_do_lock_depende_de_recurso_e_dia(self, conexao):
        conexao.vendor = 'postgresql'
        cursor = conexao.cursor.return_value.__enter__.return_value

        travar_recurso('Sala 01', date(2026, 1, 5))
        travar_recurso('Sala 02', date(2026, 1, 5))
        travar_recurso('Sala 01', date(2026, 1, 6))

        chaves = [c.args[1][0] for c in cursor.execute.call_args_list]
        self.assertEqual(len(set(chaves)), 3)


class MotivosDeIndisponibilidadeTest(TestCase):
    def setUp(self):
        self.dia = date(2026, 3, 10)
        self.inicio = time(7, 0)
        self.fim = time(7, 50)

    def motivos(self, recurso='Sala 01', inicio=None, fim=None, data=None, **kw):
        return motivos_de_indisponibilidade(
            recurso,
            data or self.dia,
            inicio or self.inicio,
            fim or self.fim,
            **kw,
        )

    # --- recurso livre ------------------------------------------------------
    def test_recurso_desconhecido_esta_livre(self):
        self.assertEqual(self.motivos('Recurso que não existe'), [])

    # --- espaços ------------------------------------------------------------
    def test_espaco_indisponivel(self):
        Espaco.objects.create(nome='Sala 01', tipo='Sala', situacao='Indisponível')
        self.assertEqual(self.motivos(), ['Sala 01 está indisponível.'])

    def test_espaco_inativo(self):
        Espaco.objects.create(nome='Sala 01', tipo='Sala', ativo=False)
        self.assertEqual(self.motivos(), ['Sala 01 está indisponível.'])

    # --- equipamentos -------------------------------------------------------
    def test_equipamento_em_manutencao_por_patrimonio(self):
        Equipamento.objects.create(
            patrimonio='123', tipo='Projetor', situacao='Em manutenção'
        )
        self.assertEqual(
            self.motivos('123'), ['123 está com situação "Em manutenção".']
        )

    def test_equipamento_por_numero_simplificado(self):
        Equipamento.objects.create(
            simplificado='P-01', tipo='Projetor', situacao='Fora de uso'
        )
        self.assertEqual(
            self.motivos('P-01'), ['P-01 está com situação "Fora de uso".']
        )

    def test_equipamento_inativo(self):
        Equipamento.objects.create(patrimonio='123', tipo='Projetor', ativo=False)
        self.assertEqual(len(self.motivos('123')), 1)

    # --- bloqueios ----------------------------------------------------------
    def test_bloqueio_permanente_com_motivo(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', motivo='Reforma', origem='COORDENACAO'
        )
        self.assertEqual(
            self.motivos(), ['Sala 01 está bloqueado (Coordenação): Reforma']
        )

    def test_bloqueio_sem_motivo_termina_com_ponto(self):
        Bloqueio.objects.create(tipo='Sala', recurso='Sala 01', origem='SECRETARIA')
        self.assertEqual(self.motivos(), ['Sala 01 está bloqueado (Secretaria).'])

    def test_bloqueio_de_outro_dia_e_ignorado(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO',
            data=date(2026, 3, 11),
        )
        self.assertEqual(self.motivos(), [])

    def test_bloqueio_do_mesmo_dia_vale(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO', data=self.dia
        )
        self.assertEqual(len(self.motivos()), 1)

    def test_bloqueio_desativado_e_ignorado(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO', ativo=False
        )
        self.assertEqual(self.motivos(), [])

    def test_bloqueio_de_aula_sobreposta_vale(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO',
            aula='1ª aula (07h00–07h50)',
        )
        self.assertEqual(len(self.motivos(inicio=time(7, 30), fim=time(8, 20))), 1)

    def test_bloqueio_de_aula_vizinha_nao_vale(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO',
            aula='2ª aula (07h50–08h40)',
        )
        # termina exatamente quando o bloqueio começa
        self.assertEqual(self.motivos(), [])

    def test_bloqueio_com_aula_ilegivel_vale_para_o_dia_todo(self):
        Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO', aula='dia todo'
        )
        self.assertEqual(len(self.motivos()), 1)

    def test_varios_bloqueios_geram_um_unico_motivo(self):
        for origem in ('COORDENACAO', 'SECRETARIA'):
            Bloqueio.objects.create(tipo='Sala', recurso='Sala 01', origem=origem)
        self.assertEqual(len(self.motivos()), 1)

    # --- conflito com reservas ---------------------------------------------
    def test_conflito_com_reserva_ativa(self):
        nova_reserva(data=self.dia)
        self.assertEqual(
            self.motivos(), ['Sala 01 já está reservado nesse horário.']
        )

    def test_conflito_por_sobreposicao_parcial(self):
        nova_reserva(data=self.dia, inicio=time(7, 0), fim=time(7, 50))
        self.assertEqual(len(self.motivos(inicio=time(7, 30), fim=time(8, 20))), 1)

    def test_horarios_vizinhos_nao_conflitam(self):
        nova_reserva(data=self.dia, inicio=time(7, 50), fim=time(8, 40))
        self.assertEqual(self.motivos(), [])

    def test_reserva_cancelada_nao_conflita(self):
        nova_reserva(data=self.dia, status='CANCELADA')
        self.assertEqual(self.motivos(), [])

    def test_reserva_de_outro_dia_ou_recurso_nao_conflita(self):
        nova_reserva(data=date(2026, 3, 11))
        nova_reserva(recurso='Sala 02', data=self.dia)
        self.assertEqual(self.motivos(), [])

    def test_ignorar_reserva_exclui_a_propria_reserva(self):
        reserva = nova_reserva(data=self.dia)
        self.assertEqual(self.motivos(ignorar_reserva=reserva.pk), [])

    def test_ignorar_reserva_nao_esconde_outras(self):
        propria = nova_reserva(data=self.dia)
        nova_reserva(data=self.dia)
        self.assertEqual(len(self.motivos(ignorar_reserva=propria.pk)), 1)

    # --- combinações --------------------------------------------------------
    def test_motivos_se_acumulam(self):
        Espaco.objects.create(nome='Sala 01', tipo='Sala', situacao='Indisponível')
        Bloqueio.objects.create(tipo='Sala', recurso='Sala 01', origem='COORDENACAO')
        nova_reserva(data=self.dia)
        self.assertEqual(len(self.motivos()), 3)
