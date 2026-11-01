import { afterEach, beforeEach, describe, it } from 'node:test';
import { strict as eq } from 'node:assert';

import { corpoDe, instalarNavegador, resposta, simularFetch } from './helpers.js';
import {
  ativarUsuario,
  atualizarUsuario,
  criarUsuario,
  desativarUsuario,
  listarUsuarios,
} from '../src/adminUsuarios.js';

beforeEach(() => {
  instalarNavegador({ cookie: '' });
});

afterEach(() => {
  delete globalThis.fetch;
  delete globalThis.document;
  delete globalThis.window;
});

describe('listarUsuarios', () => {
  it('faz GET em /api/usuarios/ sem pedir CSRF', async () => {
    const chamadas = simularFetch(resposta([{ id: 1, username: 'maria' }]));

    const dados = await listarUsuarios();

    eq.deepEqual(dados, [{ id: 1, username: 'maria' }]);
    eq.equal(chamadas.length, 1);
    eq.equal(chamadas[0].url, '/api/usuarios/');
    eq.equal(chamadas[0].opcoes.method, 'GET');
    eq.equal(chamadas[0].opcoes.credentials, 'include');
    eq.deepEqual(chamadas[0].opcoes.headers, {});
  });
});

describe('criarUsuario', () => {
  const novo = { username: 'novo', perfil: 'professor', password: 'SenhaSegura@123' };

  it('busca o CSRF e envia o usuário como JSON', async () => {
    const chamadas = simularFetch(resposta({ csrfToken: 'do-corpo' }), resposta({ id: 9 }, 201));

    const dados = await criarUsuario(novo);

    eq.deepEqual(dados, { id: 9 });
    eq.deepEqual(chamadas.map((c) => c.url), ['/api/csrf/', '/api/usuarios/']);
    eq.equal(chamadas[0].opcoes.credentials, 'include');
    eq.equal(chamadas[1].opcoes.method, 'POST');
    eq.equal(chamadas[1].opcoes.headers['Content-Type'], 'application/json');
    eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 'do-corpo');
    eq.deepEqual(corpoDe(chamadas[1]), novo);
  });

  it('prefere o token do cookie ao do corpo da resposta', async () => {
    instalarNavegador({ cookie: 'sessionid=s; csrftoken=do-cookie' });
    const chamadas = simularFetch(resposta({ csrfToken: 'do-corpo' }), resposta({}));

    await criarUsuario(novo);

    eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 'do-cookie');
  });

  it('mantém o "=" que fizer parte do valor do cookie', async () => {
    instalarNavegador({ cookie: 'csrftoken=abc=def' });
    const chamadas = simularFetch(resposta({ csrfToken: 'x' }), resposta({}));

    await criarUsuario(novo);

    eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 'abc=def');
  });

  it('decodifica o valor do cookie', async () => {
    instalarNavegador({ cookie: 'csrftoken=a%20b' });
    const chamadas = simularFetch(resposta({ csrfToken: 'x' }), resposta({}));

    await criarUsuario(novo);

    eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 'a b');
  });

  it('não confunde outro cookie com o csrftoken', async () => {
    instalarNavegador({ cookie: 'meucsrftoken=errado' });
    const chamadas = simularFetch(resposta({ csrfToken: 'certo' }), resposta({}));

    await criarUsuario(novo);

    eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 'certo');
  });

  it('desiste sem enviar o POST se não conseguir o CSRF', async () => {
    const chamadas = simularFetch(resposta({}, 500));

    await eq.rejects(criarUsuario(novo), { message: 'Não foi possível obter o token CSRF.' });
    eq.equal(chamadas.length, 1);
  });
});

describe('atualizarUsuario, ativarUsuario e desativarUsuario', () => {
  it('atualizarUsuario faz PATCH em /api/usuarios/:id/', async () => {
    const chamadas = simularFetch(resposta({ csrfToken: 't' }), resposta({ id: 7 }));

    await atualizarUsuario(7, { perfil: 'secretaria' });

    eq.equal(chamadas[1].url, '/api/usuarios/7/');
    eq.equal(chamadas[1].opcoes.method, 'PATCH');
    eq.deepEqual(corpoDe(chamadas[1]), { perfil: 'secretaria' });
  });

  for (const [nome, funcao, sufixo] of [
    ['ativarUsuario', ativarUsuario, 'ativar'],
    ['desativarUsuario', desativarUsuario, 'desativar'],
  ]) {
    it(`${nome} faz POST em /api/usuarios/:id/${sufixo}/ sem corpo`, async () => {
      const chamadas = simularFetch(resposta({ csrfToken: 't' }), resposta({ is_active: true }));

      const dados = await funcao(7);

      eq.deepEqual(dados, { is_active: true });
      eq.equal(chamadas[1].url, `/api/usuarios/7/${sufixo}/`);
      eq.equal(chamadas[1].opcoes.method, 'POST');
      eq.equal(chamadas[1].opcoes.body, undefined);
      eq.equal('Content-Type' in chamadas[1].opcoes.headers, false);
      eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 't');
    });
  }
});

describe('mensagens de erro', () => {
  // Para GET não há chamada de CSRF: a primeira resposta já é a do erro.
  const casos = [
    ['"detail" do DRF', { detail: 'Sem permissão.' }, 403, 'Sem permissão.'],
    ['"erro" do login', { erro: 'Não autenticado.' }, 401, 'Não autenticado.'],
    ['"detail" tem prioridade sobre "erro"', { detail: 'a', erro: 'b' }, 400, 'a'],
    ['erros de campo em lista', { email: ['Inválido.', 'Repetido.'] }, 400, 'email: Inválido., Repetido.'],
    ['erro de campo como texto', { username: 'Repetido' }, 400, 'username: Repetido'],
    ['vários campos', { email: ['x'], password: ['y'] }, 400, 'email: x; password: y'],
    ['corpo vazio', {}, 400, 'Erro HTTP 400'],
    ['corpo nulo', null, 503, 'Erro HTTP 503'],
  ];

  for (const [descricao, corpo, status, mensagem] of casos) {
    it(`traduz ${descricao}`, async () => {
      simularFetch(resposta(corpo, status));

      await eq.rejects(listarUsuarios(), (erro) => {
        eq.ok(erro instanceof Error);
        eq.equal(erro.message, mensagem);
        return true;
      });
    });
  }

  it('usa "Erro HTTP" quando a resposta não é JSON', async () => {
    simularFetch(resposta(undefined, 500));

    await eq.rejects(listarUsuarios(), { message: 'Erro HTTP 500' });
  });

  it('erros do POST (depois do CSRF) também são traduzidos', async () => {
    simularFetch(
      resposta({ csrfToken: 't' }),
      resposta({ password: ['Esta senha é muito curta.'] }, 400),
    );

    await eq.rejects(criarUsuario({}), { message: 'password: Esta senha é muito curta.' });
  });
});
