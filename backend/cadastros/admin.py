from django.contrib import admin

from .models import (
    Bloqueio,
    Equipamento,
    Espaco,
    LogOperacao,
    Manutencao,
    Reserva,
)


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'patrimonio', 'simplificado', 'tipo', 'situacao', 'ativo')
    search_fields = ('nome', 'patrimonio', 'simplificado', 'localizacao')
    list_filter = ('situacao', 'ativo')


@admin.register(Espaco)
class EspacoAdmin(admin.ModelAdmin):
    list_display = ('nome', 'tipo', 'localizacao', 'situacao', 'ativo')
    search_fields = ('nome', 'localizacao')
    list_filter = ('tipo', 'situacao', 'ativo')


@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ('recurso', 'responsavel', 'data', 'horario_inicio', 'horario_fim', 'status')
    list_filter = ('status', 'data')
    search_fields = ('recurso', 'responsavel', 'finalidade')


@admin.register(Bloqueio)
class BloqueioAdmin(admin.ModelAdmin):
    list_display = ('recurso', 'tipo', 'origem', 'data', 'aula', 'ativo')
    list_filter = ('origem', 'ativo')
    search_fields = ('recurso', 'motivo')


@admin.register(Manutencao)
class ManutencaoAdmin(admin.ModelAdmin):
    list_display = ('recurso', 'tipo', 'inicio', 'previsao', 'situacao')
    list_filter = ('situacao',)
    search_fields = ('recurso', 'motivo')


@admin.register(LogOperacao)
class LogOperacaoAdmin(admin.ModelAdmin):
    list_display = ('criado_em', 'usuario', 'acao', 'entidade', 'objeto_id')
    list_filter = ('acao', 'entidade')
    readonly_fields = [f.name for f in LogOperacao._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
