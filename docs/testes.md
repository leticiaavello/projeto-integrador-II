# Testes automatizados

## Backend (Django)

Os testes ficam em `backend/cadastros/`:

| Arquivo | O que cobre |
|---|---|
| `tests.py` | Testes de API (reservas, cadastros, login, usuários) |
| `test_services.py` | `interpretar_horario`, `registrar`, `travar_recurso`, `motivos_de_indisponibilidade` |
| `test_models.py` | Modelos: nome automático do equipamento, `horario`, ordenação, chaves estrangeiras |
| `test_permissions.py` | `perfil_de`, `nome_exibicao`, `perfis_permitidos` |
| `test_serializers.py` | Validações e regras de cada serializer |
| `test_views.py` | Login/logout/me, filtros, auditoria, bloqueios, manutenções, administração de usuários |
| `test_seed.py` | Comando `seed_inicial` e dados de demonstração |
| `test_admin.py` | Registro no admin e proteção do log de auditoria |
| `helpers_teste.py` | Funções e classe base compartilhadas (não tem testes) |

Para rodar sem precisar do PostgreSQL, use SQLite em memória:

```bash
cd backend
pip install -r requirements.txt coverage

# Linux/macOS
DATABASE_URL=sqlite:///:memory: python manage.py test

# Windows (PowerShell)
$env:DATABASE_URL="sqlite:///:memory:"; python manage.py test
```

Com PostgreSQL (como em produção), basta configurar o `.env` e rodar `python manage.py test`.
O Django cria e apaga um banco `test_<nome>` automaticamente.

Cobertura (opcional):

```bash
coverage run --source=cadastros manage.py test
coverage report -m
```

Alguns testes específicos do PostgreSQL (`travar_recurso`) usam *mock* e funcionam em qualquer banco.

## Frontend (React)

Os testes de `src/api.js` e `src/adminUsuarios.js` usam o executor nativo do Node
(`node:test`, Node 20+)

```bash
cd homepage-conversion
npm test
```

Os arquivos ficam em `homepage-conversion/tests/`. O `fetch`, o `document.cookie` e o
`window.alert` são simulados em `tests/helpers.js`.
