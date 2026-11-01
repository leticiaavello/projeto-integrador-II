export function instalarNavegador({ cookie = '' } = {}) {
  const alertas = [];
  globalThis.document = { cookie };
  globalThis.window = { alert: (mensagem) => alertas.push(mensagem) };
  return alertas;
}

export function resposta(corpo, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      if (corpo === undefined) throw new SyntaxError('Unexpected end of JSON input');
      return corpo;
    },
  };
}

export function simularFetch(...respostas) {
  const chamadas = [];
  globalThis.fetch = async (url, opcoes = {}) => {
    chamadas.push({ url, opcoes });
    const proxima =
      typeof respostas[0] === 'function' ? respostas[0](url, opcoes) : respostas.shift();
    if (proxima instanceof Error) throw proxima;
    if (!proxima) throw new Error(`fetch inesperado: ${opcoes.method ?? 'GET'} ${url}`);
    return proxima;
  };
  return chamadas;
}

export function corpoDe(chamada) {
  return JSON.parse(chamada.opcoes.body);
}
