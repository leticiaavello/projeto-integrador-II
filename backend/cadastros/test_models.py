"""Testes unitários dos modelos (cadastros/models.py)."""
from datetime import date, time, timedelta

from django.db import IntegrityError, transaction
from django.db.models import ProtectedError
from django.test import TestCase
from django.utils import timezone

from .helpers_teste import criar_usuario, nova_reserva
from .models import Bloqueio, Equipamento, Espaco, LogOperacao, Manutencao, Reserva


class EspacoModelTest(TestCase):
    def test_str_e_valores_padrao(self):
        espaco = Espaco.objects.create(nome='Sala 01', tipo='Sala')
        self.assertEqual(str(espaco), 'Sala 01')
        self.assertEqual(espaco.situacao, 'Disponível')
        self.assertTrue(espaco.ativo)
        self.assertEqual(espaco.localizacao, '')

    def test_ordenado_por_nome(self):
        for nome in ('Sala C', 'Sala A', 'Sala B'):
            Espaco.objects.create(nome=nome, tipo='Sala')
        self.assertEqual(
            list(Espaco.objects.values_list('nome', flat=True)),
            ['Sala A', 'Sala B', 'Sala C'],
        )


class EquipamentoModelTest(TestCase):
    def test_nome_montado_com_tipo_marca_e_modelo(self):
        eq = Equipamento.objects.create(tipo='Projetor', marca='Epson', modelo='X41')
        self.assertEqual(eq.nome, 'Projetor Epson X41')

    def test_nome_pula_partes_vazias(self):
        eq = Equipamento.objects.create(tipo='Projetor', modelo='X41')
        self.assertEqual(eq.nome, 'Projetor X41')

    def test_nome_cai_para_patrimonio_depois_simplificado_depois_padrao(self):
        self.assertEqual(Equipamento.objects.create(patrimonio='999').nome, '999')
        self.assertEqual(Equipamento.objects.create(simplificado='S-1').nome, 'S-1')
        self.assertEqual(Equipamento.objects.create().nome, 'Equipamento')

    def test_nome_informado_e_preservado(self):
        eq = Equipamento.objects.create(nome='Meu projetor', tipo='Projetor')
        self.assertEqual(eq.nome, 'Meu projetor')

    def test_nome_gerado_e_limitado_a_100_caracteres(self):
        eq = Equipamento.objects.create(tipo='T' * 60, marca='M' * 60)
        self.assertEqual(len(eq.nome), 100)

    def test_nome_nao_e_regerado_ao_salvar_de_novo(self):
        eq = Equipamento.objects.create(tipo='Projetor')
        eq.tipo = 'Outro tipo'
        eq.save()
        self.assertEqual(eq.nome, 'Projetor')

    def test_valores_padrao_e_str(self):
        eq = Equipamento.objects.create(tipo='Projetor')
        self.assertEqual(eq.quantidade, 1)
        self.assertEqual(eq.situacao, 'Disponível')
        self.assertTrue(eq.ativo)
        self.assertEqual(str(eq), 'Projetor')

    def test_patrimonio_repetido_nao_e_permitido(self):
        Equipamento.objects.create(patrimonio='123')
        with self.assertRaises(IntegrityError), transaction.atomic():
            Equipamento.objects.create(patrimonio='123')

    def test_simplificado_repetido_nao_e_permitido(self):
        Equipamento.objects.create(simplificado='S-1')
        with self.assertRaises(IntegrityError), transaction.atomic():
            Equipamento.objects.create(simplificado='S-1')

    def test_varios_equipamentos_sem_patrimonio_sao_permitidos(self):
        Equipamento.objects.create(simplificado='A', patrimonio=None)
        Equipamento.objects.create(simplificado='B', patrimonio=None)
        self.assertEqual(Equipamento.objects.count(), 2)


class ReservaModelTest(TestCase):
    def test_horario_formatado(self):
        reserva = nova_reserva(inicio=time(7, 0), fim=time(7, 50))
        self.assertEqual(reserva.horario, '07h00–07h50')

    def test_horario_com_minutos_de_um_digito(self):
        reserva = nova_reserva(inicio=time(13, 5), fim=time(14, 0))
        self.assertEqual(reserva.horario, '13h05–14h00')

    def test_str(self):
        reserva = nova_reserva(
            recurso='Sala 03', data=date(2026, 3, 10), responsavel='Maria'
        )
        self.assertEqual(str(reserva), 'Sala 03 - 2026-03-10 (Maria)')

    def test_status_padrao_e_data_de_criacao(self):
        reserva = Reserva.objects.create(
            responsavel='Maria', recurso='Sala 01', data=date(2026, 3, 10),
            horario_inicio=time(7, 0), horario_fim=time(7, 50), finalidade='x',
        )
        self.assertEqual(reserva.status, 'ATIVA')
        self.assertIsNotNone(reserva.criada_em)

    def test_ordenada_por_data_e_horario(self):
        tarde = nova_reserva(data=date(2026, 3, 10), inicio=time(13, 0), fim=time(13, 50))
        manha = nova_reserva(data=date(2026, 3, 10), inicio=time(7, 0), fim=time(7, 50))
        outro_dia = nova_reserva(data=date(2026, 3, 9), inicio=time(15, 0), fim=time(15, 50))
        self.assertEqual(list(Reserva.objects.all()), [outro_dia, manha, tarde])

    def test_usuario_com_reserva_nao_pode_ser_apagado(self):
        usuario = criar_usuario('maria', 'Professor')
        nova_reserva(usuario=usuario)
        with self.assertRaises(ProtectedError):
            usuario.delete()


class ManutencaoModelTest(TestCase):
    def test_valores_padrao_e_str(self):
        m = Manutencao.objects.create(
            tipo='Equipamento', recurso='Projetor 1', inicio=date(2026, 3, 1)
        )
        self.assertEqual(m.situacao, 'Em manutenção')
        self.assertIsNone(m.previsao)
        self.assertEqual(str(m), 'Projetor 1 - Em manutenção')

    def test_mais_recentes_primeiro(self):
        antiga = Manutencao.objects.create(
            tipo='Sala', recurso='A', inicio=date(2026, 1, 1)
        )
        recente = Manutencao.objects.create(
            tipo='Sala', recurso='B', inicio=date(2026, 2, 1)
        )
        self.assertEqual(list(Manutencao.objects.all()), [recente, antiga])


class BloqueioModelTest(TestCase):
    def test_valores_padrao_e_str(self):
        b = Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO'
        )
        self.assertTrue(b.ativo)
        self.assertIsNone(b.data)  # permanente
        self.assertEqual(b.aula, '')  # dia inteiro
        self.assertIsNone(b.removido_em)
        self.assertEqual(str(b), 'Sala 01 (COORDENACAO)')

    def test_apagar_manutencao_preserva_o_bloqueio(self):
        m = Manutencao.objects.create(
            tipo='Sala', recurso='Sala 01', inicio=date(2026, 3, 1)
        )
        b = Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='SECRETARIA', manutencao=m
        )
        m.delete()
        b.refresh_from_db()
        self.assertIsNone(b.manutencao)

    def test_apagar_usuario_preserva_o_bloqueio(self):
        usuario = criar_usuario('carlos', 'Coordenação')
        b = Bloqueio.objects.create(
            tipo='Sala', recurso='Sala 01', origem='COORDENACAO', criado_por=usuario
        )
        usuario.delete()
        b.refresh_from_db()
        self.assertIsNone(b.criado_por)


class LogOperacaoModelTest(TestCase):
    def test_str(self):
        log = LogOperacao.objects.create(acao='criar', entidade='Espaco')
        self.assertEqual(
            str(log), f'{log.criado_em:%d/%m/%Y %H:%M} criar Espaco'
        )

    def test_mais_recentes_primeiro(self):
        primeiro = LogOperacao.objects.create(acao='a', entidade='E')
        segundo = LogOperacao.objects.create(acao='b', entidade='E')
        # auto_now_add pode empatar em relógios de baixa resolução (Windows)
        agora = timezone.now()
        LogOperacao.objects.filter(pk=primeiro.pk).update(
            criado_em=agora - timedelta(hours=1)
        )
        LogOperacao.objects.filter(pk=segundo.pk).update(criado_em=agora)
        self.assertEqual(
            list(LogOperacao.objects.values_list('pk', flat=True)),
            [segundo.pk, primeiro.pk],
        )
