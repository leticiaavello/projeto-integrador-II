# Guia: backend, banco de dados e integração (passo a passo no VS Code)

Este guia leva você de "o projeto baixado" até "front-end React conversando com o
Django e gravando no PostgreSQL". Os comandos são para **Windows + PowerShell**
(no Linux/macOS troque `py` por `python3` e `.venv\Scripts\Activate.ps1` por
`source .venv/bin/activate`).

> **Aviso honesto:** o código foi escrito e revisado (sintaxe do Python e do
> JSX conferidas), mas **não foi executado** contra um Django/PostgreSQL de
> verdade. A Etapa 5 (`python manage.py test`) existe justamente para você
> confirmar que tudo funciona na sua máquina.

---

## 0. O que existe agora (mapa dos arquivos)

```
backend/
  .env.example              modelo das variáveis secretas (copie para .env)
  requirements.txt          dependências Python
  config/settings.py        agora lê .env, tem DRF, fuso America/Sao_Paulo
  config/urls.py            rotas /api/...
  cadastros/
    models.py               Espaco, Equipamento, Reserva, Bloqueio, Manutencao, LogOperacao
    permissions.py          perfis Professor / Coordenação / Secretaria
    services.py             regra de conflito de reservas e bloqueios
    serializers.py          converte modelo <-> JSON (no formato que o front já usa)
    views.py                login/logout/me + endpoints da API
    admin.py                telas do /admin
    seed_data.py            27 espaços do protótipo + os nomes usados nas listas do front
    management/commands/seed_inicial.py   cria perfis, usuários de teste e espaços
    tests.py                testes automáticos
homepage-conversion/
  vite.config.js            proxy: /api -> Django
  src/api.js                TODAS as chamadas ao backend ficam aqui
  src/App.jsx               trocou os dados "de mentira" por chamadas a api.js
```

**Como as peças se falam:**
`Tela React → api.js → /api (proxy do Vite) → Django (views → serializers → services → models) → PostgreSQL`.

---

## 1. Pré-requisitos

1. **Python 3.12+** (python.org; marque *Add to PATH*). Teste: `py --version`.
2. **Node.js** recente (LTS) — `node --version`.
3. **PostgreSQL** (postgresql.org) — anote a senha do usuário `postgres`.
4. **VS Code** + extensões: *Python* e *Pylance* (Microsoft), *ESLint* (opcional),
   *SQLTools* + driver PostgreSQL (opcional, para ver as tabelas sem sair do VS Code).

Abra a pasta raiz do projeto em **File → Open Folder** e abra o terminal com
**Ctrl+'** (aspas simples). Use um terminal para o backend e outro (ícone `+`)
para o front-end.

---

## 2. Banco de dados (PostgreSQL)

Crie o banco (uma vez só). Em qualquer terminal:

```powershell
psql -U postgres -c "CREATE DATABASE gestao_escolar ENCODING 'UTF8';"
```

(Sem `psql` no PATH? Abra o **pgAdmin → Databases → Create → Database…** e use o
nome `gestao_escolar`.)

Agora as credenciais. **Nunca** coloque senha no código:

```powershell
cd backend
Copy-Item .env.example .env
code .env
```

Edite o `.env`: coloque a sua senha em `DB_PASSWORD` e gere uma chave nova:

```powershell
py -c "import secrets; print(secrets.token_urlsafe(50))"
```

Cole o resultado em `DJANGO_SECRET_KEY`. O `.env` já está no `.gitignore`
(só o `.env.example` vai para o GitHub).

---

## 3. Backend (Django)

Ainda dentro de `backend/`:

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1          # se bloquear: Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
pip install -r requirements.txt
```

No VS Code: **Ctrl+Shift+P → "Python: Select Interpreter"** → escolha o
`.venv` de `backend`. Isso faz o Pylance reconhecer o Django.

### 3.1 Criar as tabelas

O projeto já tinha as migrações `0001` e `0002`. Eu alterei os modelos
(novos campos, tabelas de bloqueio, manutenção e log), então gere a `0003`:

```powershell
python manage.py makemigrations
python manage.py migrate
```

O `makemigrations` **não deve perguntar nada** (todos os campos novos têm
padrão). Se perguntar, pare e me envie a pergunta. Faça commit do arquivo
`cadastros/migrations/0003_*.py` — o grupo inteiro precisa dele.

> Se você já cadastrou espaços de teste com os tipos antigos (`SALA`,
> `LABORATORIO`), apague-os pelo `/admin` ou recrie o banco
> (`DROP DATABASE gestao_escolar;` + criar de novo + `migrate`). Os tipos
> agora são `Sala`, `Laboratório`, `Lab. Móvel`, `Auditório`, `Outro`.

### 3.2 Perfis, usuários de teste e espaços

```powershell
python manage.py seed_inicial
```

Cria os grupos **Professor / Coordenação / Secretaria**, 3 usuários e os
espaços do protótipo. Logins de teste (senha `Escola@2026`, ou use
`--senha SuaSenha`):

| Perfil | E-mail |
|---|---|
| Professor | professor@escola.test |
| Coordenação | coordenacao@escola.test |
| Secretaria | secretaria@escola.test |

Crie também o seu administrador (acesso ao `/admin`, **sem** perfil de uso):

```powershell
python manage.py createsuperuser
```

### 3.3 Subir o servidor

```powershell
python manage.py runserver
```

Abra `http://127.0.0.1:8000/admin/` e confira as tabelas. Abra também
`http://127.0.0.1:8000/api/espacos/` — vai dar *"Authentication credentials
were not provided"*. **Isso é o esperado**: a API exige login.

### 3.4 Rodar os testes automáticos

Em outro terminal (com o `.venv` ativo, dentro de `backend/`):

```powershell
python manage.py test
```

Cobrem: reserva duplicada/sobreposta, bloqueios, perfis (quem pode o quê),
cancelamento, equipamento com patrimônio repetido e login. **Se algum falhar,
copie a saída inteira para mim** — corrigimos juntos.

---

## 4. Front-end e integração

```powershell
cd homepage-conversion
npm install
npm run dev
```

Abra **`http://localhost:8443`** (com o Django rodando em paralelo).

Como a integração funciona:

* `vite.config.js` encaminha tudo que começa com `/api` para
  `http://127.0.0.1:8000`. O navegador só enxerga `localhost:8443`, então o
  cookie de sessão e o token CSRF funcionam sem configuração de CORS.
* `src/api.js` concentra todo o `fetch` (envio do CSRF, tratamento de erros).
  Quando precisar de um endpoint novo, **crie a função lá** e chame no
  `App.jsx`.
* No `App.jsx`, os `useState` de reservas, espaços, equipamentos e bloqueios
  agora começam **vazios** e são preenchidos por `recarregarDados()` assim que
  o usuário entra. Toda ação (reservar, cancelar, bloquear, cadastrar) chama a
  API e depois `recarregarDados()` — assim a tela sempre mostra o que está no
  banco (RNF07/RNF24).
* Erros do servidor (ex.: "Sala 01 já está reservada nesse horário.") aparecem
  em um `alert`. Troque depois por um `<Alert>` do React-Bootstrap.

---

## 5. Roteiro de teste da integração (faça nesta ordem)

1. **Professor:** entre → *Solicitar Reserva* → escolha amanhã, uma aula, "Sala 01" → confirmar.
   Em *Minhas Reservas* ela deve aparecer. Recarregue com **F5**: continua lá (veio do banco).
2. **Conflito:** com outro navegador/janela anônima, entre como Coordenação e tente
   reservar a **mesma sala no mesmo horário** → deve aparecer a mensagem de conflito.
3. **Coordenação:** *Bloquear Recursos* → bloqueie "Sala 02" → volte ao Professor e tente reservar → recusa.
4. **Secretaria:** *Salas e Laboratórios* → cadastre uma sala; marque como indisponível; veja o bloqueio
   aparecer na tela da Coordenação. *Equipamentos* → cadastre um (patrimônio repetido deve ser recusado).
   *Histórico e Manutenção* → registre uma manutenção (cria o bloqueio) e conclua (remove o bloqueio).
5. **Auditoria:** no `/admin`, tabela **Logs de operação** — tudo foi registrado (RF40/RNF15).

---

## 6. Como cada parte funciona (para você explicar no relatório)

**Perfis (RF38, RNF02).** O perfil é o *grupo* do usuário no Django
(`permissions.py`). O seletor "perfil" da janela de login do front é só
visual: quem manda é o grupo gravado no banco. Cada endpoint declara quem pode:

| Recurso | Ler | Escrever |
|---|---|---|
| Espaços, Equipamentos | todos | Secretaria |
| Reservas | todos | criar: Professor/Coordenação · alterar: Coordenação · cancelar: dono ou Coordenação |
| Bloqueios | todos | Coordenação e Secretaria (cada um só remove os seus) |
| Manutenções | Secretaria | Secretaria |

**Sem conflito de reservas (RF07, RF08, RNF05).** `services.py` recusa a reserva se
o recurso estiver (a) indisponível, (b) bloqueado naquela data/aula ou (c) já
reservado em horário que se sobreponha. No PostgreSQL, um *advisory lock* por
recurso+dia faz duas pessoas clicando ao mesmo tempo serem atendidas uma de cada vez.

**Histórico (RNF16).** Reservas canceladas e bloqueios removidos **não são
apagados**: mudam de status/`ativo`. A tabela `LogOperacao` guarda quem fez o quê e quando.

**Senhas (RNF03).** O Django guarda hash (PBKDF2) — nunca a senha em texto.

**Sessão.** Login por cookie de sessão + proteção CSRF (token enviado no cabeçalho
`X-CSRFToken` pelo `api.js`). `GET /api/me/` diz se a sessão continua válida.

---

## 7. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| `password authentication failed` | `DB_PASSWORD` errada no `.env` |
| `database "gestao_escolar" does not exist` | Faltou o `CREATE DATABASE` (Etapa 2) |
| `ModuleNotFoundError: dotenv/rest_framework` | `.venv` não ativo / faltou `pip install -r requirements.txt` |
| Tela diz "Não foi possível conectar ao servidor" | Django parado (`runserver`) ou front aberto em outra porta que não a 8443 |
| `403 CSRF verification failed` | Acesse por `localhost:8443` (não pelo IP da rede) e confira `CSRF_TRUSTED_ORIGINS` |
| `Forbidden` ao abrir dados logo após login | Usuário sem grupo — rode `seed_inicial` ou ponha o usuário em um grupo no `/admin` |
| `makemigrations` pergunta um valor padrão | Me envie a pergunta (não responda no escuro) |

Quando tudo estiver funcionando, **fixe as versões** que deram certo:

```powershell
pip freeze > requirements.txt
```

---

## 8. Limitações conhecidas e próximos passos

* **Recursos por nome.** A reserva guarda o nome do recurso (`"Sala 03"`), como o
  front já usa. É simples, mas renomear uma sala não atualiza reservas antigas. O
  passo seguinte é usar as chaves estrangeiras `espaco`/`equipamento`, que já
  existem no modelo `Reserva`.
* **Equipamentos genéricos** ("Projetor", "Webcam") são tratados como um único
  recurso: se a escola tem 3 projetores, só 1 reserva por horário. Para isso,
  evoluir para reservar uma unidade específica (patrimônio) ou usar `quantidade`.
* **Listas fixas no front** (`SALAS`, `LABS`, `RECURSOS_POR_TIPO`): substituir por
  `espacos`/`equipamentos` vindos da API, para novos cadastros aparecerem na hora de reservar.
* **Relatórios (RF21)** ainda são calculados no front; podem virar endpoint
  `/api/relatorios/` com agregações no banco.
* **Alterar cadastro / esqueci a senha / cadastro de usuários**: hoje usuários são
  criados pelo `/admin`.
* **Nuvem (requisito do PI):** em produção use `DJANGO_DEBUG=False`,
  `DJANGO_ALLOWED_HOSTS`, HTTPS, `gunicorn` + `whitenoise`, e backups do PostgreSQL
  (RNF17/RNF18).
* **Limite de tentativas de login** (proteção contra força bruta) ainda não existe.
