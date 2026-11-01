import { afterEach, beforeEach, describe, it } from 'node:test';
import { strict as eq } from 'node:assert';

import { corpoDe, instalarNavegador, resposta, simularFetch } from './helpers.js';
import * as api from '../src/api.js';

let alertas;

beforeEach(() => {
  alertas = instalarNavegador({ cookie: 'csrftoken=tok123; sessionid=abc' });
});

afterEach(() => {
  delete globalThis.fetch;
  delete globalThis.document;
  delete globalThis.window;
});

describe('requisições GET', () => {
  it('chamam /api/... com cookies e sem CSRF nem Content-Type', async () => {
    const chamadas = simularFetch(resposta({ usuario: { nome: 'Maria' } }));

    const dados = await api.me();

    eq.deepEqual(dados, { usuario: { nome: 'Maria' } });
    eq.equal(chamadas.length, 1);
    eq.equal(chamadas[0].url, '/api/me/');
    eq.equal(chamadas[0].opcoes.method, 'GET');
    eq.equal(chamadas[0].opcoes.credentials, 'include');
    eq.deepEqual(chamadas[0].opcoes.headers, {});
    eq.equal(chamadas[0].opcoes.body, undefined);
  });

  it('não buscam o token CSRF mesmo sem cookie', async () => {
    instalarNavegador({ cookie: '' });
    const chamadas = simularFetch(resposta([]));

    await api.listarManutencoes();

    eq.equal(chamadas.length, 1);
    eq.equal(chamadas[0].url, '/api/manutencoes/');
  });
});

describe('requisições com corpo (POST/PATCH)', () => {
  it('enviam JSON e o token CSRF lido do cookie', async () => {
    const chamadas = simularFetch(resposta({ id: 1 }, 201));

    const dados = await api.criarReserva({ recurso: 'Sala 01' });

    eq.deepEqual(dados, { id: 1 });
    eq.equal(chamadas.length, 1); // não precisou pedir /csrf/
    const { url, opcoes } = chamadas[0];
    eq.equal(url, '/api/reservas/');
    eq.equal(opcoes.method, 'POST');
    eq.equal(opcoes.headers['X-CSRFToken'], 'tok123');
    eq.equal(opcoes.headers['Content-Type'], 'application/json');
    eq.deepEqual(corpoDe(chamadas[0]), { recurso: 'Sala 01' });
  });

  it('pedem /api/csrf/ quando o cookie ainda não existe', async () => {
    instalarNavegador({ cookie: '' });
    const chamadas = simularFetch(resposta({ csrfToken: 'do-servidor' }), resposta({ ok: true }));

    await api.criarReserva({});

    eq.equal(chamadas.length, 2);
    eq.equal(chamadas[0].url, '/api/csrf/');
    eq.equal(chamadas[0].opcoes.credentials, 'include');
    eq.equal(chamadas[1].url, '/api/reservas/');
    eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 'do-servidor');
  });

  it('decodifica o valor do cookie', async () => {
    instalarNavegador({ cookie: 'csrftoken=a%20b' });
    const chamadas = simularFetch(resposta({}));

    await api.criarReserva({});

    eq.equal(chamadas[0].opcoes.headers['X-CSRFToken'], 'a b');
  });

  it('não confunde outro cookie com o csrftoken', async () => {
    instalarNavegador({ cookie: 'meucsrftoken=errado' });
    const chamadas = simularFetch(resposta({ csrfToken: 'certo' }), resposta({}));

    await api.criarReserva({});

    eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 'certo');
  });

  it('PATCH leva o corpo informado', async () => {
    const chamadas = simularFetch(resposta({}));

    await api.atualizarEspaco(4, { situacao: 'Indisponível' });

    eq.equal(chamadas[0].url, '/api/espacos/4/');
    eq.equal(chamadas[0].opcoes.method, 'PATCH');
    eq.deepEqual(corpoDe(chamadas[0]), { situacao: 'Indisponível' });
  });

  it('POST sem corpo envia um objeto vazio', async () => {
    const chamadas = simularFetch(resposta({}));

    await api.cancelarReserva(9);

    eq.equal(chamadas[0].url, '/api/reservas/9/cancelar/');
    eq.deepEqual(corpoDe(chamadas[0]), {});
  });

  it('preserva acentos no corpo', async () => {
    const chamadas = simularFetch(resposta({}));

    await api.criarEspaco({ nome: 'Laboratório de Ciências' });

    eq.equal(corpoDe(chamadas[0]).nome, 'Laboratório de Ciências');
  });
});

describe('DELETE', () => {
  it('envia CSRF, não envia corpo e devolve null em 204', async () => {
    const chamadas = simularFetch(resposta(undefined, 204));

    const dados = await api.removerBloqueio(3);

    eq.equal(dados, null);
    const { url, opcoes } = chamadas[0];
    eq.equal(url, '/api/bloqueios/3/');
    eq.equal(opcoes.method, 'DELETE');
    eq.equal(opcoes.headers['X-CSRFToken'], 'tok123');
    eq.equal('Content-Type' in opcoes.headers, false);
    eq.equal(opcoes.body, undefined);
  });
});

describe('sessão', () => {
  it('login garante o CSRF e envia e-mail e senha', async () => {
    const chamadas = simularFetch(resposta({ usuario: { perfil: 'professor' } }));

    const dados = await api.login('maria@escola.test', 'segredo');

    eq.equal(dados.usuario.perfil, 'professor');
    eq.equal(chamadas.length, 1);
    eq.equal(chamadas[0].url, '/api/login/');
    eq.deepEqual(corpoDe(chamadas[0]), { email: 'maria@escola.test', senha: 'segredo' });
  });

  it('login busca o token CSRF antes de enviar as credenciais', async () => {
    instalarNavegador({ cookie: '' });
    // Como no navegador: a chamada a /api/csrf/ grava o cookie "csrftoken".
    const chamadas = simularFetch((url) => {
      if (url === '/api/csrf/') {
        globalThis.document.cookie = 'csrftoken=t';
        return resposta({ csrfToken: 't' });
      }
      return resposta({ usuario: {} });
    });

    await api.login('a@b.c', 'x');

    eq.deepEqual(chamadas.map((c) => c.url), ['/api/csrf/', '/api/login/']);
    eq.equal(chamadas[1].opcoes.headers['X-CSRFToken'], 't');
  });

  it('logout é um POST em /api/logout/', async () => {
    const chamadas = simularFetch(resposta({ mensagem: 'ok' }));

    await api.logout();

    eq.equal(chamadas[0].url, '/api/logout/');
    eq.equal(chamadas[0].opcoes.method, 'POST');
  });
});

describe('carregarTudo', () => {
  it('busca as quatro coleções e devolve tudo junto', async () => {
    const porUrl = {
      '/api/espacos/': [{ id: 1 }],
      '/api/equipamentos/': [{ id: 2 }],
      '/api/reservas/': [{ id: 3 }],
      '/api/bloqueios/': [{ id: 4 }],
    };
    const chamadas = simularFetch((url) => resposta(porUrl[url]));

    const dados = await api.carregarTudo();

    eq.deepEqual(dados, {
      espacos: [{ id: 1 }],
      equipamentos: [{ id: 2 }],
      reservas: [{ id: 3 }],
      bloqueios: [{ id: 4 }],
    });
    eq.deepEqual(chamadas.map((c) => c.url).sort(), Object.keys(porUrl).sort());
  });

  it('falha se qualquer uma das chamadas falhar', async () => {
    simularFetch((url) =>
      url === '/api/reservas/' ? resposta({ detail: 'Sem permissão.' }, 403) : resposta([]),
    );

    await eq.rejects(api.carregarTudo(), { message: 'Sem permissão.', status: 403 });
  });
});

describe('rotas da API', () => {
  const casos = [
    ['criarReserva', () => api.criarReserva({ a: 1 }), 'POST', '/api/reservas/', { a: 1 }],
    ['cancelarReserva', () => api.cancelarReserva(5), 'POST', '/api/reservas/5/cancelar/', {}],
    ['criarBloqueio', () => api.criarBloqueio({ b: 1 }), 'POST', '/api/bloqueios/', { b: 1 }],
    ['removerBloqueio', () => api.removerBloqueio(6), 'DELETE', '/api/bloqueios/6/', undefined],
    ['criarEspaco', () => api.criarEspaco({ c: 1 }), 'POST', '/api/espacos/', { c: 1 }],
    ['atualizarEspaco', () => api.atualizarEspaco(7, { d: 1 }), 'PATCH', '/api/espacos/7/', { d: 1 }],
    ['criarEquipamento', () => api.criarEquipamento({ e: 1 }), 'POST', '/api/equipamentos/', { e: 1 }],
    ['atualizarEquipamento', () => api.atualizarEquipamento(8, { f: 1 }), 'PATCH', '/api/equipamentos/8/', { f: 1 }],
    ['importarEquipamentos', () => api.importarEquipamentos([{ g: 1 }]), 'POST', '/api/equipamentos/importar/', [{ g: 1 }]],
    ['listarManutencoes', () => api.listarManutencoes(), 'GET', '/api/manutencoes/', undefined],
    ['criarManutencao', () => api.criarManutencao({ h: 1 }), 'POST', '/api/manutencoes/', { h: 1 }],
    ['atualizarManutencao', () => api.atualizarManutencao(9, { i: 1 }), 'PATCH', '/api/manutencoes/9/', { i: 1 }],
  ];

  for (const [nome, chamar, metodo, url, corpo] of casos) {
    it(`${nome} → ${metodo} ${url}`, async () => {
      const chamadas = simularFetch(resposta({}));

      await chamar();

      eq.equal(chamadas.length, 1);
      eq.equal(chamadas[0].url, url);
      eq.equal(chamadas[0].opcoes.method, metodo);
      if (corpo === undefined) eq.equal(chamadas[0].opcoes.body, undefined);
      else eq.deepEqual(corpoDe(chamadas[0]), corpo);
    });
  }
});

describe('tratamento de erros', () => {
  const casos = [
    ['campo "erro" (login)', { erro: 'E-mail ou senha incorretos.' }, 401, 'E-mail ou senha incorretos.'],
    ['campo "detail" (DRF)', { detail: 'Sem permissão.' }, 403, 'Sem permissão.'],
    ['erro de um campo', { recurso: ['Sala indisponível.'] }, 400, 'recurso: Sala indisponível.'],
    ['erro de campo como texto', { horario: 'Inválido' }, 400, 'horario: Inválido'],
    ['vários erros no mesmo campo', { recurso: ['a', 'b'] }, 400, 'recurso: a b'],
    ['vários campos', { data: ['x'], horario: ['y'] }, 400, 'data: x horario: y'],
    ['non_field_errors sem prefixo', { non_field_errors: ['Informe o patrimônio.'] }, 400, 'Informe o patrimônio.'],
    ['lista de mensagens', ['Sala ocupada.', 'Sala bloqueada.'], 400, 'Sala ocupada. Sala bloqueada.'],
    ['texto puro', 'Falhou', 400, 'Falhou'],
    ['objeto vazio', {}, 400, 'Erro 400 ao falar com o servidor.'],
    ['corpo nulo', null, 502, 'Erro 502 ao falar com o servidor.'],
  ];

  for (const [descricao, corpo, status, mensagem] of casos) {
    it(`traduz ${descricao}`, async () => {
      simularFetch(resposta(corpo, status));

      await eq.rejects(api.me(), (erro) => {
        eq.ok(erro instanceof Error);
        eq.equal(erro.message, mensagem);
        eq.equal(erro.status, status);
        return true;
      });
    });
  }

  it('usa mensagem padrão quando a resposta não é JSON', async () => {
    simularFetch(resposta(undefined, 500));

    await eq.rejects(api.me(), { message: 'Erro 500 ao falar com o servidor.', status: 500 });
  });

  it('avisa quando o servidor está fora do ar', async () => {
    simularFetch(new TypeError('Failed to fetch'));

    await eq.rejects(api.me(), (erro) => {
      eq.match(erro.message, /Não foi possível conectar ao servidor/);
      eq.equal(erro.status, 0);
      return true;
    });
  });

  it('erros de POST também são traduzidos', async () => {
    simularFetch(resposta({ recurso: ['Sala 01 já está reservado nesse horário.'] }, 400));

    await eq.rejects(api.criarReserva({}), {
      message: 'recurso: Sala 01 já está reservado nesse horário.',
      status: 400,
    });
  });
});

describe('avisarErro', () => {
  it('mostra a mensagem do erro em um alert', () => {
    api.avisarErro(new Error('Deu ruim'));
    eq.deepEqual(alertas, ['Deu ruim']);
  });

  it('usa texto padrão quando não há mensagem', () => {
    api.avisarErro(undefined);
    api.avisarErro(null);
    api.avisarErro(new Error(''));
    eq.deepEqual(alertas, ['Erro inesperado.', 'Erro inesperado.', 'Erro inesperado.']);
  });
});
