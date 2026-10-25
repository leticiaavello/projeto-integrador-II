from datetime import time

from django.conf import settings
from django.db import models


class Espaco(models.Model):
    """Sala, laboratório, laboratório móvel, auditório etc."""

    # Os valores guardados no banco são exatamente os textos que o front-end usa.
    TIPOS = [
        ('Sala', 'Sala'),
        ('Laboratório', 'Laboratório'),
        ('Lab. Móvel', 'Laboratório móvel'),
        ('Auditório', 'Auditório'),
        ('Outro', 'Outro'),
    ]
    SITUACOES = [
        ('Disponível', 'Disponível'),
        ('Indisponível', 'Indisponível'),
    ]

    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    localizacao = models.CharField(max_length=100, blank=True)
    bloco = models.CharField(max_length=100, blank=True)
    capacidade = models.CharField(max_length=50, blank=True)
    descricao = models.TextField(blank=True)
    situacao = models.CharField(
        max_length=20, choices=SITUACOES, default='Disponível'
    )
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ['nome']

    def __str__(self):
        return self.nome


class Equipamento(models.Model):
    SITUACOES = [
        ('Disponível', 'Disponível'),
        ('Em manutenção', 'Em manutenção'),
        ('Indisponível', 'Indisponível'),
        ('Fora de uso', 'Fora de uso'),
    ]

    nome = models.CharField(max_length=100, blank=True)
    patrimonio = models.CharField(
        max_length=50, unique=True, null=True, blank=True
    )
    simplificado = models.CharField(
        max_length=50, unique=True, null=True, blank=True
    )
    tipo = models.CharField(max_length=60, blank=True)
    marca = models.CharField(max_length=60, blank=True)
    modelo = models.CharField(max_length=60, blank=True)
    quantidade = models.PositiveIntegerField(default=1)
    localizacao = models.CharField(max_length=100, blank=True)
    descricao = models.TextField(blank=True)
    situacao = models.CharField(
        max_length=20, choices=SITUACOES, default='Disponível'
    )
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ['id']

    def save(self, *args, **kwargs):
        if not self.nome:
            partes = [self.tipo, self.marca, self.modelo]
            self.nome = (
                ' '.join(p for p in partes if p)
                or self.patrimonio
                or self.simplificado
                or 'Equipamento'
            )[:100]
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nome


class Reserva(models.Model):
    STATUS_CHOICES = [
        ('ATIVA', 'Ativa'),
        ('CANCELADA', 'Cancelada'),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='reservas',
    )
    # Nome de quem reservou, guardado como "foto" no momento da reserva.
    responsavel = models.CharField(max_length=150)
    # Nome do recurso exatamente como aparece na tela (ex.: "Sala 03").
    recurso = models.CharField(max_length=150, blank=True)
    espaco = models.ForeignKey(
        Espaco, on_delete=models.PROTECT, null=True, blank=True
    )
    equipamento = models.ForeignKey(
        Equipamento, on_delete=models.PROTECT, null=True, blank=True
    )
    data = models.DateField()
    horario_inicio = models.TimeField()
    horario_fim = models.TimeField()
    finalidade = models.TextField()
    turma = models.CharField(max_length=50, blank=True)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='ATIVA'
    )
    criada_em = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['data', 'horario_inicio']
        indexes = [models.Index(fields=['recurso', 'data'])]

    @property
    def horario(self):
        ini: time = self.horario_inicio
        fim: time = self.horario_fim
        return f'{ini:%Hh%M}–{fim:%Hh%M}'

    def __str__(self):
        return f'{self.recurso} - {self.data} ({self.responsavel})'


class Manutencao(models.Model):
    SITUACOES = [
        ('Em manutenção', 'Em manutenção'),
        ('Bloqueada', 'Bloqueada'),
        ('Concluída', 'Concluída'),
    ]

    tipo = models.CharField(max_length=20)
    recurso = models.CharField(max_length=150)
    inicio = models.DateField()
    previsao = models.DateField(null=True, blank=True)
    motivo = models.TextField(blank=True)
    situacao = models.CharField(
        max_length=20, choices=SITUACOES, default='Em manutenção'
    )
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-inicio', '-id']

    def __str__(self):
        return f'{self.recurso} - {self.situacao}'


class Bloqueio(models.Model):
    ORIGENS = [
        ('COORDENACAO', 'Coordenação'),
        ('SECRETARIA', 'Secretaria'),
    ]

    tipo = models.CharField(max_length=20)
    recurso = models.CharField(max_length=150)
    motivo = models.CharField(max_length=255, blank=True)
    # data vazia = bloqueio permanente; aula vazia = dia inteiro.
    data = models.DateField(null=True, blank=True)
    aula = models.CharField(max_length=60, blank=True)
    origem = models.CharField(max_length=12, choices=ORIGENS)
    manutencao = models.ForeignKey(
        Manutencao,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bloqueios',
    )
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    # Bloqueios não são apagados: ao desbloquear, ativo=False (histórico).
    ativo = models.BooleanField(default=True)
    removido_em = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.recurso} ({self.origem})'


class LogOperacao(models.Model):
    """Trilha de auditoria (RF40, RNF15, RNF23)."""

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
    )
    acao = models.CharField(max_length=40)
    entidade = models.CharField(max_length=40)
    objeto_id = models.CharField(max_length=40, blank=True)
    detalhe = models.TextField(blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.criado_em:%d/%m/%Y %H:%M} {self.acao} {self.entidade}'
