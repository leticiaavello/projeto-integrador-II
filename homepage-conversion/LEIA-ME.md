# Gestão Escolar Integrada — versão JavaScript + React-Bootstrap

Esta versão foi convertida do projeto TypeScript/TSX para JavaScript/JSX, mantendo a lógica e os estilos inline da interface original para reduzir mudanças visuais.

## Tecnologias

- HTML: `index.html`
- JavaScript/JSX: `src/main.jsx` e `src/App.jsx`
- CSS convencional: `src/index.css`
- React-Bootstrap: componente `Button` usado nos botões da interface
- Bootstrap 5: folha de estilos carregada em `src/main.jsx`
- Vite: desenvolvimento e build

## Como executar no Windows

1. Instale uma versão recente do Node.js compatível com o Vite 8.
2. Extraia o ZIP para uma pasta local.
3. Abra essa pasta no VS Code.
4. No terminal, execute:

   ```powershell
   npm install
   ```

5. Inicie o servidor de desenvolvimento:

   ```powershell
   npm run dev
   ```

6. Abra o endereço que o Vite mostrar no terminal. A porta preferida é `8443`; se estiver ocupada, o Vite poderá escolher outra.

## Verificar a compilação de produção

```powershell
npm run build
```

Os arquivos de produção serão gerados na pasta `dist`.

## Observações sobre a conversão

- As funções, estados e navegação da aplicação foram preservados na conversão de sintaxe TypeScript para JavaScript.
- Os 68 botões foram convertidos para o componente `Button` do React-Bootstrap; uma regra específica em `src/index.css` neutraliza estilos padrão que poderiam alterar o visual original.
- As classes utilitárias do Tailwind usadas no cabeçalho, carrossel, faixa de indicadores e rodapé foram substituídas por classes CSS convencionais com regras responsivas.
- Os campos nativos de formulário foram mantidos em HTML para preservar a aparência e o comportamento já implementados.
- O projeto foi verificado estaticamente quanto à sintaxe JavaScript/JSX. O `npm install` não foi concluído no ambiente de preparação por indisponibilidade de acesso ao registro npm, portanto faça a instalação e execute `npm run build` no seu computador para validar as dependências.
- Os dados de reservas e os equipamentos continuam sendo dados de demonstração/client-side do protótipo. Esta conversão não adiciona banco de dados ou autenticação real.
