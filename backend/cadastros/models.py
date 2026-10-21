from django.db import models


class Espaco(models.Model):
    TIPOS = [
        ('SALA', 'Sala de aula'),
        ('LABORATORIO', 'Laboratório'),
        ('AUDITORIO', 'Auditório'),
        ('OUTRO', 'Outro'),
    ]

    nome = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    localizacao = models.CharField(max_length=100, blank=True)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome


class Equipamento(models.Model):
    nome = models.CharField(max_length=100)
    patrimonio = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True
    )
    quantidade = models.PositiveIntegerField(default=1)
    localizacao = models.CharField(max_length=100, blank=True)
    descricao = models.TextField(blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome
    
class Reserva(models.Model):
    STATUS_CHOICES = [
        ("PENDENTE", "Pendente"),
        ("APROVADA", "Aprovada"),
        ("RECUSADA", "Recusada"),
        ("CANCELADA", "Cancelada"),
    ]

    responsavel = models.CharField(max_length=150)
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
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="PENDENTE",
    )

    def __str__(self):
        return f"{self.responsavel} - {self.data}"
