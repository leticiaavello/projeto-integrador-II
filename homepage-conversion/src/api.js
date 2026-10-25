// Camada de comunicação com o backend Django.
//
// As chamadas usam caminhos relativos ("/api/...") e o Vite (vite.config.js)
// encaminha tudo que começa com /api para o Django em http://127.0.0.1:8000.
// Assim o navegador enxerga uma única origem e o cookie de sessão/CSRF funciona
// sem dor de cabeça de CORS.

const BASE = '/api';

function lerCookie(nome) {
  const par = document.cookie.split('; ').find((c) => c.startsWith(`${nome}=`));
  return par ? decodeURIComponent(par.split('=')[1]) : null;
}

async function obterCsrf() {
  let token = lerCookie('csrftoken');
  if (!token) {
    // Esta chamada faz o Django gravar o cookie "csrftoken".
    const resp = await fetch(`${BASE}/csrf/`, { credentials: 'include' });
    token = (await resp.json()).csrfToken;
  }
  return token;
}

// O Django/DRF devolve erros em formatos diferentes; aqui viram um texto só.
function textoDoErro(dados, padrao) {
  if (!dados) return padrao;
  if (typeof dados === 'string') return dados;
  if (Array.isArray(dados)) return dados.map((d) => textoDoErro(d, '')).join(' ');
  if (dados.erro) return dados.erro;
  if (dados.detail) return dados.detail;
  return (
    Object.entries(dados)
      .map(([campo, msg]) => {
        const texto = textoDoErro(msg, '');
        return campo === 'non_field_errors' ? texto : `${campo}: ${texto}`;
      })
      .join(' ') || padrao
  );
}

async function requisicao(metodo, caminho, corpo) {
  const headers = {};
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (metodo !== 'GET') headers['X-CSRFToken'] = await obterCsrf();

  let resp;
  try {
    resp = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers,
      credentials: 'include',
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    const erro = new Error('Não foi possível conectar ao servidor. O Django está rodando?');
    erro.status = 0;
    throw erro;
  }

  if (resp.status === 204) return null;
  const dados = await resp.json().catch(() => null);
  if (!resp.ok) {
    const erro = new Error(textoDoErro(dados, `Erro ${resp.status} ao falar com o servidor.`));
    erro.status = resp.status;
    throw erro;
  }
  return dados;
}

const get = (c) => requisicao('GET', c);
const post = (c, corpo = {}) => requisicao('POST', c, corpo);
const patch = (c, corpo) => requisicao('PATCH', c, corpo);
const del = (c) => requisicao('DELETE', c);

// --- Sessão ------------------------------------------------------------------
export const login = async (email, senha) => {
  await obterCsrf();
  return post('/login/', { email, senha });
};
export const logout = () => post('/logout/');
export const me = () => get('/me/');

// --- Leitura (todos os perfis) ---------------------------------------------
export async function carregarTudo() {
  const [espacos, equipamentos, reservas, bloqueios] = await Promise.all([
    get('/espacos/'),
    get('/equipamentos/'),
    get('/reservas/'),
    get('/bloqueios/'),
  ]);
  return { espacos, equipamentos, reservas, bloqueios };
}

// --- Reservas --------------------------------------------------------------
export const criarReserva = (dados) => post('/reservas/', dados);
export const cancelarReserva = (id) => post(`/reservas/${id}/cancelar/`);

// --- Bloqueios ---------------------------------------------------------------
export const criarBloqueio = (dados) => post('/bloqueios/', dados);
export const removerBloqueio = (id) => del(`/bloqueios/${id}/`);

// --- Espaços e equipamentos (Secretaria) -----------------------------------
export const criarEspaco = (dados) => post('/espacos/', dados);
export const atualizarEspaco = (id, dados) => patch(`/espacos/${id}/`, dados);
export const criarEquipamento = (dados) => post('/equipamentos/', dados);
export const atualizarEquipamento = (id, dados) => patch(`/equipamentos/${id}/`, dados);
export const importarEquipamentos = (lista) => post('/equipamentos/importar/', lista);

// --- Manutenções (Secretaria) ----------------------------------------------
export const listarManutencoes = () => get('/manutencoes/');
export const criarManutencao = (dados) => post('/manutencoes/', dados);
export const atualizarManutencao = (id, dados) => patch(`/manutencoes/${id}/`, dados);

// Aviso simples de erro. Depois dá para trocar por um <Alert> do React-Bootstrap.
export const avisarErro = (erro) => window.alert(erro?.message || 'Erro inesperado.');
