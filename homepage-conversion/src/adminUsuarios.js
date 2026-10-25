const BASE = '/api/usuarios/';

function cookie(nome) {
  const parte = document.cookie
    .split('; ')
    .find(x => x.startsWith(`${nome}=`));

  return parte
    ? decodeURIComponent(parte.slice(nome.length + 1))
    : null;
}

async function csrf() {
  const resposta = await fetch('/api/csrf/', {
    credentials: 'include',
  });

  if (!resposta.ok) {
    throw new Error('Não foi possível obter o token CSRF.');
  }

  const dados = await resposta.json();
  return cookie('csrftoken') || dados.csrfToken;
}

async function requisicao(metodo, caminho = '', corpo) {
  const headers = {};

  if (corpo !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (metodo !== 'GET') {
    headers['X-CSRFToken'] = await csrf();
  }

  const resposta = await fetch(BASE + caminho, {
    method: metodo,
    credentials: 'include',
    headers,
    body: corpo === undefined
      ? undefined
      : JSON.stringify(corpo),
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem = dados?.detail ||
      dados?.erro ||
      (dados && typeof dados === 'object'
        ? Object.entries(dados)
            .map(([campo, valor]) =>
              `${campo}: ${Array.isArray(valor) ? valor.join(', ') : valor}`
            )
            .join('; ')
        : null) ||
      `Erro HTTP ${resposta.status}`;

    throw new Error(mensagem);
  }

  return dados;
}

export const listarUsuarios = () =>
  requisicao('GET');

export const criarUsuario = (dados) =>
  requisicao('POST', '', dados);

export const atualizarUsuario = (id, dados) =>
  requisicao('PATCH', `${id}/`, dados);

export const ativarUsuario = (id) =>
  requisicao('POST', `${id}/ativar/`);

export const desativarUsuario = (id) =>
  requisicao('POST', `${id}/desativar/`);
