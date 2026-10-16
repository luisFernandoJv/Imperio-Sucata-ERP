# Correção de inicialização — etapa 4

Data: 15 de outubro de 2026.

## Tela em branco

Foi reproduzida uma falha de inicialização causada por um módulo JavaScript antigo entregue pelo cache do service worker. O código anterior registrava o worker no HTML, na entrada React e no App, inclusive em desenvolvimento. O worker de `public/sw.js` guardava scripts usando cache primeiro. Isso permitia misturar arquivos de versões diferentes ao trocar o projeto na mesma porta do navegador.

A captura enviada mostra a página vazia em `localhost:5173`, mas não contém o console. Portanto, o cenário reproduzido identifica uma causa real no código entregue; não confirma sozinho que seja o único erro na instalação local.

## Correção

- Nova entrada `src/startup.js`, independente do React e Firebase, prepara a abertura antes de importar a aplicação.
- Desenvolvimento: remove o registro antigo do worker e somente os caches de arquivos da aplicação. Quando a página ainda é controlada pelo worker anterior, recarrega antes de importar o React.
- Produção: registro único do worker gerado pelo Vite. O modo offline continua disponível no build.
- O worker manual antigo foi substituído por um worker de desativação para o ambiente de desenvolvimento.
- Falhas ao importar a aplicação exibem uma mensagem e ações de recuperação. Erros de renderização têm um ErrorBoundary envolvendo a raiz.
- Página independente `public/recuperar.html`, sem dependências da aplicação, para remover arquivos antigos e reabrir o sistema.
- Nenhuma limpeza de localStorage, IndexedDB, sessão ou banco de dados. Os caches de outras aplicações são preservados.

## Como usar o pacote corrigido

1. Pare o servidor anterior com Ctrl+C.
2. Extraia este pacote em uma pasta nova e preserve sua configuração `.env.local` em `sistema`.
3. No terminal da pasta extraída:

```bash
cd sistema
npm ci
npm run dev
```

4. Abra o endereço indicado pelo Vite. O padrão é `http://localhost:5173`.
5. Se o navegador ainda mostrar a versão anterior, abra `http://localhost:5173/recuperar.html` e clique em **Recuperar e abrir o sistema**. Use a porta mostrada pelo Vite se for diferente de 5173.

Se aparecer a mensagem de falha mesmo depois da recuperação, confira o erro do console do navegador e o terminal do Vite. O arquivo `sistema/.env.local` precisa continuar com as configurações da instalação. A recuperação corrige o cache; não inventa ou substitui configurações de Firebase ou de acesso.

## Validação

- Reproduzida a tela vazia com o worker anterior e uma entrada inválida guardada no cache.
- Login com os módulos reais de Firebase, sem gravar no banco: abertura normal e após cache antigo com módulo inválido.
- Desenvolvimento sem novo registro de service worker.
- Falhas simuladas de importação, configuração do Firebase e renderização na raiz, todas com interface visível.
- Recuperação independente, preservando dados locais e um cache de outra aplicação.
- Regressão de Transações e Caixa com serviços simulados: ícones, cálculos, navegação, envio, erros e recuperação.
- Build de produção e verificação no navegador, incluindo atualização e uso do worker gerado.
- Integridade e extração completa do ZIP conferidas.

Os testes de regressão de negócio usam serviços simulados. Não foram feitas alterações em dados reais, nas regras do banco ou nos serviços de transação.
