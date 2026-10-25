
from rest_framework.permissions import BasePermission

# Nome do grupo no Django -> código do perfil usado pelo React.
PERFIS = {
    'Professor': 'professor',
    'Coordenação': 'coordenacao',
    'Secretaria': 'secretaria',
    'Administrador TI': 'administrador',
}


def perfil_de(user):
    """Retorna o código do perfil associado ao usuário."""
    if not user or not user.is_authenticated:
        return None

    grupos = set(user.groups.values_list('name', flat=True))

    for nome_grupo, codigo in PERFIS.items():
        if nome_grupo in grupos:
            return codigo

    return None


def nome_exibicao(user):
    return user.get_full_name() or user.get_username()


def perfis_permitidos(*perfis):
    """Permite acesso somente aos perfis especificados."""

    class _Permissao(BasePermission):
        message = 'Seu perfil não tem permissão para esta operação.'

        def has_permission(self, request, view):
            return perfil_de(request.user) in perfis

    return _Permissao
