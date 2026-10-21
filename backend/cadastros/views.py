from django.shortcuts import render

# Create your views here.

import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.middleware.csrf import get_token

from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def csrf_token_api(request):
    return JsonResponse({"csrfToken": 
get_token(request)})

@require_POST
def login_api(request):
    try:
        dados = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"erro": "Dados de login inválidos."},
            status=400,
        )

    email = dados.get("email", "").strip()
    senha = dados.get("senha", "")

    if not email or not senha:
        return JsonResponse(
            {"erro": "Informe o e-mail e a senha."},
            status=400,
        )

    from django.contrib.auth import get_user_model

    Usuario = get_user_model()
    usuario_cadastrado = Usuario.objects.filter(
        email__iexact=email
    ).first()

    if usuario_cadastrado is None:
        return JsonResponse(
            {"erro": "E-mail ou senha incorretos."},
            status=401,
        )

    usuario = authenticate(
        request,
        username=usuario_cadastrado.get_username(),
        password=senha,
    )

    if usuario is None or not usuario.is_active:
        return JsonResponse(
            {"erro": "E-mail ou senha incorretos."},
            status=401,
        )

    grupos = list(usuario.groups.values_list("name", flat=True))

    perfis = {
        "Professor": "professor",
        "Coordenação": "coordenacao",
        "Secretaria": "secretaria",
    }

    perfil = next(
        (perfis[g] for g in grupos if g in perfis),
        None,
    )

    if perfil is None:
        return JsonResponse(
            {"erro": "Usuário sem um perfil de acesso válido."},
            status=403,
        )

    login(request, usuario)

    return JsonResponse({
        "mensagem": "Login realizado com sucesso.",
        "usuario": {
            "nome": usuario.get_full_name() or usuario.get_username(),
            "email": usuario.email,
            "perfil": perfil,
        },
    })


@require_POST
def logout_api(request):
    logout(request)
    return JsonResponse({"mensagem": "Sessão encerrada."})
