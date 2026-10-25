import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Bloqueio, Equipamento, Espaco, Manutencao, Reserva
from .permissions import nome_exibicao, perfil_de, perfis_permitidos
from .serializers import (
    BloqueioSerializer,
    EquipamentoSerializer,
    EspacoSerializer,
    ManutencaoSerializer,
    ReservaSerializer,
    UsuarioAdminSerializer,
)
from .services import registrar

PROFESSOR = 'professor'
COORDENACAO = 'coordenacao'
SECRETARIA = 'secretaria'
ADMINISTRADOR = 'administrador'


# --------------------------------------------------------------------------
# Autenticação (sessão + CSRF)
# --------------------------------------------------------------------------

def _dados_do_usuario(usuario, perfil):
    return {
        'nome': nome_exibicao(usuario),
        'email': usuario.email,
        'perfil': perfil,
    }


@ensure_csrf_cookie
def csrf_token_api(request):
    return JsonResponse({'csrfToken': get_token(request)})


@require_POST
def login_api(request):
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'erro': 'Dados de login inválidos.'}, status=400)

    email = str(dados.get('email', '')).strip()
    senha = dados.get('senha', '')
    if not email or not senha:
        return JsonResponse({'erro': 'Informe o e-mail e a senha.'}, status=400)

    Usuario = get_user_model()
    cadastrado = Usuario.objects.filter(email__iexact=email).first()
    if cadastrado is None:
        return JsonResponse({'erro': 'E-mail ou senha incorretos.'}, status=401)

    usuario = authenticate(
        request, username=cadastrado.get_username(), password=senha
    )
    if usuario is None or not usuario.is_active:
        return JsonResponse({'erro': 'E-mail ou senha incorretos.'}, status=401)

    perfil = perfil_de(usuario)
    if perfil is None:
        return JsonResponse(
            {'erro': 'Usuário sem um perfil de acesso válido.'}, status=403
        )

    login(request, usuario)
    registrar(usuario, 'login', 'Usuario', usuario.pk)
    return JsonResponse({
        'mensagem': 'Login realizado com sucesso.',
        'usuario': _dados_do_usuario(usuario, perfil),
    })


@require_POST
def logout_api(request):
    logout(request)
    return JsonResponse({'mensagem': 'Sessão encerrada.'})


@require_GET
def me_api(request):
    """Diz se a sessão ainda é válida (o front chama ao abrir a página)."""
    perfil = perfil_de(request.user)
    if perfil is None:
        return JsonResponse({'erro': 'Não autenticado.'}, status=401)
    return JsonResponse({'usuario': _dados_do_usuario(request.user, perfil)})


# --------------------------------------------------------------------------
# API de dados (Django REST Framework)
# --------------------------------------------------------------------------


class SomenteLeituraOuPerfis(viewsets.ModelViewSet):
    """Base: qualquer perfil autorizado lê; só os perfis informados escrevem."""

    perfis_escrita = ()
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [
                IsAuthenticated(),
                perfis_permitidos(
                    PROFESSOR,
                    COORDENACAO,
                    SECRETARIA,
                    ADMINISTRADOR,
                )(),
            ]

        return [
            IsAuthenticated(),
            perfis_permitidos(*self.perfis_escrita)(),
        ]



def _bloquear_por_situacao(request, tipo, recurso, bloqueado, motivo):
    """Mantém a lista de bloqueios coerente com a situação do recurso."""
    if bloqueado:
        if not Bloqueio.objects.filter(
            ativo=True, recurso__iexact=recurso, origem='SECRETARIA', data__isnull=True
        ).exists():
            Bloqueio.objects.create(
                tipo=tipo, recurso=recurso, motivo=motivo,
                origem='SECRETARIA', criado_por=request.user,
            )
    else:
        Bloqueio.objects.filter(
            ativo=True, recurso__iexact=recurso, origem='SECRETARIA'
        ).update(ativo=False, removido_em=timezone.now())


class EspacoViewSet(SomenteLeituraOuPerfis):
    serializer_class = EspacoSerializer
    perfis_escrita = (SECRETARIA,)

    def get_queryset(self):
        return Espaco.objects.filter(ativo=True)

    @transaction.atomic
    def perform_create(self, serializer):
        espaco = serializer.save()
        registrar(self.request.user, 'criar', 'Espaco', espaco.pk, espaco.nome)

    @transaction.atomic
    def perform_update(self, serializer):
        antes = serializer.instance.situacao
        espaco = serializer.save()
        registrar(self.request.user, 'atualizar', 'Espaco', espaco.pk,
                  f'{espaco.nome}: {antes} -> {espaco.situacao}')
        if antes != espaco.situacao:
            _bloquear_por_situacao(
                self.request, espaco.tipo, espaco.nome,
                espaco.situacao == 'Indisponível',
                'Manutenção/Indisponibilidade',
            )


class EquipamentoViewSet(SomenteLeituraOuPerfis):
    serializer_class = EquipamentoSerializer
    perfis_escrita = (SECRETARIA,)

    def get_queryset(self):
        return Equipamento.objects.filter(ativo=True)

    @transaction.atomic
    def perform_create(self, serializer):
        eq = serializer.save()
        registrar(self.request.user, 'criar', 'Equipamento', eq.pk, eq.nome)

    @transaction.atomic
    def perform_update(self, serializer):
        antes = serializer.instance.situacao
        eq = serializer.save()
        registrar(self.request.user, 'atualizar', 'Equipamento', eq.pk,
                  f'{eq.nome}: {antes} -> {eq.situacao}')

    @action(detail=False, methods=['post'])
    def importar(self, request):
        """Recebe uma lista de equipamentos (importação de CSV)."""
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                criados = serializer.save()
        except IntegrityError:
            return Response(
                {'detail': 'O arquivo tem nº de patrimônio ou simplificado repetido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        registrar(request.user, 'importar', 'Equipamento', '',
                  f'{len(criados)} equipamentos')
        return Response(
            EquipamentoSerializer(criados, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class ReservaViewSet(viewsets.ModelViewSet):
    serializer_class = ReservaSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [
                perfis_permitidos(
                    PROFESSOR,
                    COORDENACAO,
                    SECRETARIA,
                    ADMINISTRADOR,
                )()
            ]
        if self.action == 'create':
            return [perfis_permitidos(PROFESSOR, COORDENACAO)()]
        if self.action == 'cancelar':
            return [perfis_permitidos(PROFESSOR, COORDENACAO)()]
        return [perfis_permitidos(COORDENACAO)()]

    def get_queryset(self):
        # Todos os perfis autorizados podem consultar a agenda.
        qs = Reserva.objects.select_related('usuario')
        params = self.request.query_params

        if params.get('data'):
            qs = qs.filter(data=params['data'])
        if params.get('recurso'):
            qs = qs.filter(recurso__icontains=params['recurso'])
        if params.get('usuario'):
            qs = qs.filter(responsavel__icontains=params['usuario'])

        return qs

    def perform_create(self, serializer):
        reserva = serializer.save()
        registrar(self.request.user, 'criar', 'Reserva', reserva.pk,
                  f'{reserva.recurso} {reserva.data} {reserva.horario}')

    def perform_update(self, serializer):
        reserva = serializer.save()
        registrar(self.request.user, 'atualizar', 'Reserva', reserva.pk,
                  f'{reserva.recurso} {reserva.data} {reserva.horario}')

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        reserva = self.get_object()
        e_dono = reserva.usuario_id == request.user.pk
        if not e_dono and perfil_de(request.user) != COORDENACAO:
            return Response(
                {'detail': 'Você só pode cancelar as suas próprias reservas.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        reserva.status = 'CANCELADA'
        reserva.save(update_fields=['status'])
        registrar(request.user, 'cancelar', 'Reserva', reserva.pk,
                  f'{reserva.recurso} {reserva.data} {reserva.horario}')
        return Response(ReservaSerializer(reserva, context={'request': request}).data)


class BloqueioViewSet(viewsets.ModelViewSet):
    serializer_class = BloqueioSerializer
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [
                perfis_permitidos(
                    PROFESSOR,
                    COORDENACAO,
                    SECRETARIA,
                    ADMINISTRADOR,
                )()
            ]
        return [perfis_permitidos(COORDENACAO, SECRETARIA)()]

    def get_queryset(self):
        return Bloqueio.objects.filter(ativo=True)

    def _origem(self):
        return 'COORDENACAO' if perfil_de(self.request.user) == COORDENACAO else 'SECRETARIA'

    def perform_create(self, serializer):
        bloqueio = serializer.save(
            origem=self._origem(), criado_por=self.request.user
        )
        registrar(self.request.user, 'bloquear', 'Bloqueio', bloqueio.pk,
                  f'{bloqueio.recurso}: {bloqueio.motivo}')

    def destroy(self, request, *args, **kwargs):
        """Desbloquear = desativar (o histórico é preservado, RNF16)."""
        bloqueio = self.get_object()
        if bloqueio.origem != self._origem():
            return Response(
                {'detail': f'Este bloqueio foi feito pela {bloqueio.get_origem_display()} '
                           'e só ela pode desbloqueá-lo.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        bloqueio.ativo = False
        bloqueio.removido_em = timezone.now()
        bloqueio.save(update_fields=['ativo', 'removido_em'])
        registrar(request.user, 'desbloquear', 'Bloqueio', bloqueio.pk, bloqueio.recurso)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ManutencaoViewSet(viewsets.ModelViewSet):
    serializer_class = ManutencaoSerializer
    queryset = Manutencao.objects.all()
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [
                perfis_permitidos(
                    PROFESSOR,
                    COORDENACAO,
                    SECRETARIA,
                    ADMINISTRADOR,
                )()
            ]

        return [
            IsAuthenticated(),
            perfis_permitidos(SECRETARIA)(),
        ]

    @transaction.atomic
    def perform_create(self, serializer):
        manutencao = serializer.save(criado_por=self.request.user)
        Bloqueio.objects.create(
            tipo=manutencao.tipo,
            recurso=manutencao.recurso,
            motivo=manutencao.motivo or 'Manutenção',
            origem='SECRETARIA',
            manutencao=manutencao,
            criado_por=self.request.user,
        )
        registrar(
            self.request.user,
            'criar',
            'Manutencao',
            manutencao.pk,
            manutencao.recurso,
        )

    @transaction.atomic
    def perform_update(self, serializer):
        manutencao = serializer.save()

        if manutencao.situacao == 'Concluída':
            manutencao.bloqueios.filter(ativo=True).update(
                ativo=False,
                removido_em=timezone.now(),
            )

        registrar(
            self.request.user,
            'atualizar',
            'Manutencao',
            manutencao.pk,
            f'{manutencao.recurso}: {manutencao.situacao}',
        )
class UsuarioAdminViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioAdminSerializer
    queryset = get_user_model().objects.all().order_by('username')
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        return [
            IsAuthenticated(),
            perfis_permitidos(ADMINISTRADOR)(),
        ]

    def perform_create(self, serializer):
        usuario = serializer.save()
        registrar(
            self.request.user,
            'criar',
            'Usuario',
            usuario.pk,
            f'Cadastro de {usuario.username}',
        )


    def perform_update(self, serializer):
        usuario_atual = serializer.instance
        novo_perfil = serializer.validated_data.get('perfil')

        if novo_perfil is not None:
            perfil_atual = perfil_de(usuario_atual)

            if (
                perfil_atual == ADMINISTRADOR
                and novo_perfil != ADMINISTRADOR
                and usuario_atual.is_active
            ):
                Usuario = get_user_model()
                outros_administradores = Usuario.objects.filter(
                    is_active=True,
                    groups__name='Administrador TI',
                ).exclude(pk=usuario_atual.pk).distinct().count()

                if outros_administradores == 0:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError({
                        'perfil': (
                            'Não é possível retirar o perfil de '
                            'Administrador TI do último administrador ativo.'
                        )
                    })

        usuario = serializer.save()
        registrar(
            self.request.user,
            'atualizar',
            'Usuario',
            usuario.pk,
            f'Atualizacao de {usuario.username}',
        )


    @action(detail=True, methods=['post'])
    def ativar(self, request, pk=None):
        usuario = self.get_object()
        usuario.is_active = True
        usuario.save(update_fields=['is_active'])

        registrar(
            request.user,
            'ativar',
            'Usuario',
            usuario.pk,
            usuario.username,
        )

        return Response(self.get_serializer(usuario).data)

    @action(detail=True, methods=['post'])
    def desativar(self, request, pk=None):
        usuario = self.get_object()

        if usuario.pk == request.user.pk:
            return Response(
                {'detail': 'Voce nao pode desativar sua propria conta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if usuario.is_active:
            grupos = usuario.groups.filter(
                name='Administrador TI'
            ).exists()

            if grupos:
                Usuario = get_user_model()
                administradores_ativos = Usuario.objects.filter(
                    is_active=True,
                    groups__name='Administrador TI',
                ).distinct().count()

                if administradores_ativos <= 1:
                    return Response(
                        {
                            'detail':
                                'Nao e possivel desativar o ultimo '
                                'administrador ativo.'
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

        usuario.is_active = False
        usuario.save(update_fields=['is_active'])

        registrar(
            request.user,
            'desativar',
            'Usuario',
            usuario.pk,
            usuario.username,
        )

        return Response(self.get_serializer(usuario).data)
