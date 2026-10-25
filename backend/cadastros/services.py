"""Regras de negócio: disponibilidade, conflitos e auditoria."""
import re
from datetime import time

from django.db import connection

from .models import Bloqueio, Equipamento, Espaco, LogOperacao, Reserva

# Aceita "07h50–08h40", "07h50-08h40" e "2ª aula (07h50–08h40)".
_PADRAO_HORARIO = re.compile(r'(\d{1,2})h(\d{2})\s*[–—-]\s*(\d{1,2})h(\d{2})')


def interpretar_horario(texto):
    """'07h50–08h40' -> (time(7, 50), time(8, 40)); None se não reconhecer."""
    achou = _PADRAO_HORARIO.search(texto or '')
    if not achou:
        return None
    h1, m1, h2, m2 = (int(g) for g in achou.groups())
    try:
        return time(h1, m1), time(h2, m2)
    except ValueError:
        return None


def registrar(usuario, acao, entidade, objeto_id='', detalhe=''):
    LogOperacao.objects.create(
        usuario=usuario if getattr(usuario, 'pk', None) else None,
        acao=acao,
        entidade=entidade,
        objeto_id=str(objeto_id),
        detalhe=detalhe[:2000],
    )


def travar_recurso(recurso, data):
    """Serializa reservas concorrentes do mesmo recurso/dia (só PostgreSQL).

    Sem isso, duas pessoas poderiam reservar o mesmo horário no mesmo
    instante: ambas passariam na checagem antes de qualquer uma gravar.
    O lock é liberado sozinho no fim da transação.
    """
    if connection.vendor != 'postgresql':
        return
    with connection.cursor() as cursor:
        cursor.execute(
            'SELECT pg_advisory_xact_lock(hashtext(%s))', [f'{recurso}|{data}']
        )


def motivos_de_indisponibilidade(recurso, data, inicio, fim, ignorar_reserva=None):
    """Lista os motivos pelos quais o recurso NÃO pode ser reservado."""
    motivos = []

    espaco = Espaco.objects.filter(nome__iexact=recurso).first()
    if espaco and (espaco.situacao != 'Disponível' or not espaco.ativo):
        motivos.append(f'{recurso} está indisponível.')

    equipamento = (
        Equipamento.objects.filter(patrimonio=recurso).first()
        or Equipamento.objects.filter(simplificado=recurso).first()
    )
    if equipamento and (
        equipamento.situacao != 'Disponível' or not equipamento.ativo
    ):
        motivos.append(
            f'{recurso} está com situação "{equipamento.situacao}".'
        )

    for b in Bloqueio.objects.filter(ativo=True, recurso__iexact=recurso):
        if b.data and b.data != data:
            continue
        faixa = interpretar_horario(b.aula)
        if faixa and not (faixa[0] < fim and faixa[1] > inicio):
            continue  # bloqueio de outra aula do mesmo dia
        motivos.append(
            f'{recurso} está bloqueado ({b.get_origem_display()})'
            + (f': {b.motivo}' if b.motivo else '.')
        )
        break

    conflitos = Reserva.objects.filter(
        recurso__iexact=recurso,
        data=data,
        status='ATIVA',
        horario_inicio__lt=fim,
        horario_fim__gt=inicio,
    )
    if ignorar_reserva is not None:
        conflitos = conflitos.exclude(pk=ignorar_reserva)
    if conflitos.exists():
        motivos.append(
            f'{recurso} já está reservado nesse horário.'
        )
    return motivos
