
from django.contrib import admin
from .models import Equipamento, Espaco, Reserva


@admin.register(Equipamento)
class EquipamentoAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "patrimonio",
        "quantidade",
        "localizacao",
        "ativo",
    )
    search_fields = ("nome", "patrimonio", "localizacao")
    list_filter = ("ativo",)


@admin.register(Espaco)
class EspacoAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "tipo",
        "localizacao",
        "ativo",
    )
    search_fields = ("nome", "localizacao")
    list_filter = ("tipo", "ativo")



@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = (
        "responsavel",
        "espaco",
        "data",
        "horario_inicio",
        "horario_fim",
        "status",
    )

    list_filter = ("status", "data")
    search_fields = ("responsavel__username", "finalidade")

    def get_readonly_fields(self, request, obj=None):
        if not request.user.is_superuser:
            return ("status",)
        return ()

