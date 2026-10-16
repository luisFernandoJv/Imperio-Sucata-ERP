# Etapa 10 — validação integrada e correções de segurança

Entrega de 16/10/2026, cumulativa com as etapas 1 a 9. A organização de Transações, os ícones dos materiais, os cálculos e as regras financeiras foram preservados. Nenhuma implantação ou operação no banco real foi executada.

## Correções entregues

- **Falhas de gravação:** `DataContext.jsx` deixa de criar uma transação local não confirmada quando o registro falha. Uma edição recusada não substitui os dados confirmados; uma exclusão recusada não esconde o registro. Os erros continuam chegando aos formulários, que mantêm o preenchimento. Os caminhos de sucesso e as fórmulas permanecem iguais.
- **Impressão do Estoque:** nomes e categorias são tratados como texto antes da montagem do HTML. A janela de impressão perde a referência `opener` para a aplicação.
- **CSV do Estoque:** campos cadastrais têm aspas e separadores escapados; textos iniciados por caracteres de fórmula são neutralizados, inclusive após espaços ou controles. Os números continuam numéricos, inclusive negativos; foram mantidos separador `;`, vírgula decimal, BOM e nome do arquivo.
- **Funções callable:** as sete entradas agora exigem usuário autenticado antes de acessar o Admin SDK. `backfillHistory` e `generateMonthReport` também exigem a claim administrativa booleana `admin: true`. Esses controles estão preparados no código local; não foram publicados. Não publique as funções separadamente da migração de acesso descrita abaixo.
- **Validação reproduzível:** testes do código real de serviços e handlers, matriz das regras recebidas e testes das correções estão em `validacao/`. O ambiente de teste usa somente o projeto demonstrativo `demo-imperio-audit` no emulador local.

## Resultado dos testes

| Verificação | Resultado e limite |
| --- | --- |
| Compra, venda e estoque | Compra de 100 kg por R$ 200; venda de 20 kg por R$ 100; estoque final de 80 kg. Serviços e handlers reais, Firestore emulado, sem triggers. |
| Despesas e saldo de cliente | Despesa de R$ 50 e empréstimo de R$ 70 não alteram o estoque; atualização de pagamento de R$ 20 deixa saldo de R$ 50. O pagamento foi testado como atualização de saldo, sem lançamento adicional no caixa. |
| Caixa | Inicial manual de R$ 500, compras de R$ 200, vendas de R$ 100 e despesas de R$ 120 resultam em R$ 280. |
| Edição e exclusão | Alterar a venda de 20 para 10 kg deixa 90 kg e caixa de R$ 230; excluir essa venda deixa 100 kg e caixa de R$ 180. |
| Falhas de escrita | Registro, edição e exclusão recusados antes da gravação preservam o estado e o cache confirmados. Não é uma prova de atomicidade quando apenas parte da operação já foi gravada. |
| Regras Firestore | Foram reproduzidas as negativas e permissões das regras atuais. Os testes confirmam as incompatibilidades abaixo; não significam que o fluxo atual tem autorização para funcionar em produção. |
| Guardas das funções | Sete handlers reais recusam 35 identidades ausentes/inválidas antes do Admin SDK. Duas rotinas recusam oito claims ausentes, falsas ou string. Requisições válidas alcançam o corpo existente. Plataforma Firebase simulada; sem teste de implantação. |
| Impressão e CSV | Testes locais e Chromium confirmam texto HTML sem execução, janela sem `opener`, fórmulas neutralizadas e download real. O CSV baixado também foi lido por parser independente: seis colunas, textos e números preservados. |
| Interface existente | Transações e Caixa passaram na regressão em sete larguras, incluindo edição, exclusão, indisponibilidade e troca rápida de data. Estoque passou em cartões/tabela, filtros, preços, envio único, falhas e exportação. |
| Inicialização de produção | Build e teste do login, recarga, worker único, abertura offline dos arquivos já carregados e recuperação de cache foram verificados. Isso não equivale a gravar dados offline. |

A prova aritmética usa `withSecurityRulesDisabled` **exclusivamente no emulador**, para testar o código existente sem mascarar o resultado da matriz de autorização, executada separadamente. Nenhum teste financeiro acionou as Cloud Functions junto com o cliente; a sincronização entre os dois continua pendente.

## Pendências que bloqueiam a conclusão para produção

### 1. Login e permissões precisam de migração coordenada — prioridade crítica

O login atual compara credenciais de variáveis `VITE_*` no navegador e confia em um marcador no `localStorage`. Não cria sessão no Firebase Authentication. Valores `VITE_*` são distribuídos no frontend; esse mecanismo não é autorização de servidor. Há também confirmações administrativas com senha no cliente, que precisam ser substituídas por permissões verificadas no servidor. Nenhum valor de credencial foi reproduzido neste relatório.

As regras recebidas exigem `request.auth` e `userId` nas transações; o cliente atual não envia esse identificador. Não existem permissões para `clients` e `daily_cash`; escritas de estoque e relatórios pelo cliente são negadas. `cheque`, `prazo` e `pagamento_divida`, disponíveis na interface, também não estão na lista aceita pelas regras. Os testes reproduziram essas negativas. A leitura de transações entre usuários autenticados é permitida nas regras atuais; não há separação entre empresas.

**Próxima implementação:** definir contas e perfis da empresa, integrar Firebase Authentication ao login/logout, substituir a confiança no armazenamento local, adicionar identidade nas operações e alinhar regras aos fluxos autorizados. As funções locais protegidas passarão a recusar chamadas sem sessão Firebase válida. Não se deve liberar leitura/escrita pública para contornar os bloqueios. Não alterei nem publiquei `firestore.rules`; não verifiquei quais regras estão implantadas no projeto real.

A configuração pública do SDK Firebase identifica o projeto; não deve ser confundida com uma senha administrativa. A proteção dos dados depende da autenticação e das permissões aplicadas pelo backend.

### 2. Estoque e relatórios têm mais de um escritor — prioridade crítica

O cliente atual altera estoque após registrar/editar transações; o trigger `updateInventoryAndStatsOnChange` também tenta alterá-lo. O trigger monta chaves com ponto em `set(..., { merge: true })`; o normalizador do cliente descarta chaves com ponto. Além disso, o trigger calcula movimento de estoque para despesas e, numa edição do mesmo material, sobrescreve no objeto o incremento que pretendia reverter. Essas inconsistências foram identificadas por inspeção de código; não executei o trigger contra dados reais.

Corrigir apenas a forma das chaves do trigger criaria risco de movimentação duplicada com o cliente. É necessário escolher um único responsável pelo estoque, aplicar a diferença de edição corretamente, excluir despesas desse movimento e tratar repetição de eventos antes de migrar. Os cálculos do trigger e do cliente não foram alterados nesta etapa. A exclusão também tenta atualizar agregados no cliente e no servidor; isso precisa entrar na mesma revisão.

### 3. Gravações parciais e concorrência — prioridade alta

Transação, estoque, saldo do cliente e agregados são gravados em operações separadas. Um erro após a primeira gravação pode deixar somente parte do fluxo concluída; uma nova tentativa pode duplicar o lançamento. Há atualizações de estoque/saldo que leem e sobrescrevem valores, sem proteção contra concorrência. A exclusão pode concluir no banco e falhar em uma atualização posterior. A correção do estado local entregue aqui não resolve esses casos. A próxima revisão precisa de operações atômicas ou idempotentes no servidor, reconciliação e retorno explícito de conclusão parcial na interface.

### 4. Dependências — prioridade alta

`npm audit --omit=dev --json`, executado em `sistema`, apontou **22 entradas de pacotes afetados: 3 críticas, 4 altas e 15 moderadas**. São alertas da árvore de dependências, com possíveis relações entre si; não equivalem a 22 explorações demonstradas. Há avisos em `jspdf`, `xlsx`, Firebase e dependências transitivas. Algumas correções sugeridas exigem atualização principal; para `xlsx` o npm não ofereceu correção automática. As versões não foram alteradas nesta etapa. O resumo por pacote está em `validacao/auditoria-dependencias.json`; o backend e as dependências de validação não estão incluídos nessa contagem.

## Arquivos e execução

Aplicação: `sistema/src/contexts/DataContext.jsx`, `sistema/src/lib/utils.js`, novo `sistema/src/lib/safeExport.js`. Servidor: `functions/index.js` e novo `functions/security.js`. Testes e instruções: `validacao/README.md` e `firebase.validacao.json`.

Para usar a aplicação localmente, extraia o pacote em pasta nova e execute:

```bash
cd sistema
npm ci
npm run dev
```

O pacote inclui o build atualizado em `sistema/dist`. Não é necessário atualizar globalmente o npm ou usar `--force`/`--legacy-peer-deps`.

Lint dos dois utilitários alterados passou; a checagem de sintaxe das funções passou. O lint de `DataContext.jsx` mantém dois apontamentos já existentes na versão anterior: exportação do hook junto com o provider e variável de exemplos não utilizada. Não foi declarado lint global aprovado. O build concluiu com aviso de base Browserslist desatualizada.

## Referências oficiais

- Testes de regras com emulador: https://firebase.google.com/docs/firestore/security/test-rules-emulator
- Testes e identidades simuladas: https://firebase.google.com/docs/rules/unit-tests
- Chaves públicas do SDK e proteção de dados: https://firebase.google.com/docs/projects/api-keys

**Situação final:** correções locais entregues e testes delimitados concluídos. Autenticação real, regras compatíveis, consistência entre cliente/trigger e atualização de dependências ainda precisam ser tratadas antes de considerar o sistema pronto para produção.
