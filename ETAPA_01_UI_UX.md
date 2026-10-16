# Império Sucata — Etapa 1 de UI/UX

Data: 14 de outubro de 2026. Responsável pelo projeto: Luis Fernando.

## Objetivo e escopo

Melhorar a estrutura de navegação do sistema existente, em uma etapa pequena e revisável. O projeto recebido contém um frontend React/Vite em `sistema/`, com Firebase/Firestore e Cloud Functions. Esta entrega não transforma o produto em um SaaS multiempresa nem certifica sua segurança.

## O que mudou

- Menu lateral persistente a partir de 1280 px, com as seções Visão geral, Operação e Gestão. Abaixo dessa largura, menu sobreposto para evitar apertar o conteúdo.
- Mesmos sete módulos e mesmos identificadores de navegação; ícones vetoriais padronizados, estado ativo com texto, seta e destaque laranja alinhado à identidade existente.
- Cabeçalho com identificação do sistema, módulo atual e acesso à calculadora existente.
- Menu móvel com bloqueio da interação ao fundo, controle de foco, Escape, fechamento pelo fundo e retorno do foco. Implementado com o Radix Dialog, que já estava nas dependências.
- Caminho de navegação com nome acessível, lista semântica e indicação da seção atual. Marca acessível pelo teclado.
- Link para pular diretamente ao conteúdo, foco visível, título da aba atualizado e foco no conteúdo ao trocar de módulo.
- Transição entre módulos respeita a preferência por movimento reduzido.
- Impressão sem a barra lateral e sem a margem reservada para ela.
- Carregamento do painel dentro do conteúdo: remove o bloqueio visual de tela inteira e permite navegar enquanto os dados carregam. A consulta de dados continua igual.

Os callbacks de compra/venda, formulários, cálculos, persistência, consultas e autenticação foram preservados. O CSS novo usa classes `shell-*`, limitadas à estrutura de navegação. Não houve atualização de dependências nem alteração de lockfiles.

## Arquivos para revisar

| Arquivo | Mudança |
| --- | --- |
| `sistema/src/App.jsx` | Integra a nova estrutura, preserva a seleção de módulos e os callbacks. |
| `sistema/src/components/layouts/AppShell.jsx` | Nova estrutura responsiva e menu móvel acessível. |
| `sistema/src/components/navigation/navigationItems.js` | Lista centralizada dos módulos, ícones e grupos. |
| `sistema/src/components/navigation/Breadcrumbs.jsx` | Caminho de navegação semântico. |
| `sistema/src/styles/app-shell.css` | Estilos isolados, responsividade e impressão. |
| `sistema/src/components/dashboard/ExecutiveDashboard.jsx` | Apenas a apresentação do carregamento; mantém a lógica. |

`DashboardLayout.jsx`, que já existia, não é o layout usado pelo `App.jsx` recebido. Foi preservado para evitar alterar código fora desta etapa. O build em `sistema/dist/` foi regenerado.

## Como executar e conferir

Na pasta extraída, execute:

```bash
cd sistema
npm ci
npm run dev
```

Mantenha a configuração de ambiente necessária ao seu projeto. Não publique as credenciais administrativas. Para gerar o build:

```bash
npm run build
```

Confira o menu em computador e celular; navegue pelos sete módulos; abra a calculadora; feche o menu por Escape; use Tab e o link Pular para o conteúdo; confira o preview de impressão. Para reverter somente esta etapa, restaure os três arquivos originais modificados (`App.jsx`, `Breadcrumbs.jsx` e `ExecutiveDashboard.jsx`) e remova os três novos arquivos listados na tabela. Depois gere o build novamente.

## Validação e limites

- Build de produção do frontend e geração do service worker concluídos.
- ESLint sem erros em App.jsx, AppShell.jsx, Breadcrumbs.jsx e navigationItems.js. Isso não representa uma aprovação do lint de todo o projeto.
- Verificação em Chromium com larguras de 320, 390, 768, 1024, 1280 e 1440 px: estrutura do painel sem rolagem horizontal, navegação e foco.
- Cenário de Firebase indisponível: navegação permanece disponível durante o carregamento do painel.
- Testes da interface com leituras simuladas vazias, bloqueando o acesso externo: troca dos sete módulos, estado ativo, foco no conteúdo, contenção de foco no menu, Escape, calculadora, impressão e saída da sessão local.
- Inspeção visual do painel em computador e celular usando esse cenário vazio.

Não foram testadas gravações no Firebase, transações financeiras, implantação, regras em produção ou uso com dados reais. As simulações e ferramentas de QA não integram o código entregue. Não foram preenchidos dados comerciais fictícios no sistema.

## Achados prioritários para as próximas etapas

### Alto — autenticação antes de disponibilizar como SaaS

Em `sistema/src/App.jsx`, o login compara `VITE_ADMIN_USER` e `VITE_ADMIN_PASS` no navegador e libera a interface por um marcador no localStorage. Variáveis VITE são incorporadas ao frontend; uma senha administrativa ali não é um segredo de servidor. O marcador local também não comprova identidade para o backend. As regras Firestore enviadas, por sua vez, dependem de `request.auth`.

Próxima ação: revisar o fluxo completo de autenticação e adotar uma sessão validada pelo provedor/backend, mantendo autorização nas regras e funções. Também será necessário isolamento por empresa antes de qualquer oferta multiempresa. O fluxo de login não foi migrado nesta etapa; é um trabalho funcional específico. Não se deve flexibilizar regras do banco para contornar falhas de login.

### Médio — estados de espera nos outros módulos

O painel tinha um carregamento sobreposto que bloqueava a navegação; sua apresentação foi corrigida nesta entrega. Ainda é necessário revisar carregamentos, falhas e estados vazios de cada módulo, para distinguir ausência de registros de falha de consulta.

### Médio — hierarquia do painel e uso no celular

Os indicadores existentes usam muitas cores, pesos altos e algumas abreviações ou truncamentos em telas pequenas. Próxima etapa visual sugerida: painel, com prioridade dos indicadores, legibilidade de valores, rótulos e estados vazios. Não mudar fórmulas nessa revisão.

### Médio — fluxo operacional

Depois do painel, revisar Transações e Caixa Diário, depois Estoque, Clientes e Relatórios: foco nos campos, confirmação de ações, mensagens de erro, tabelas e filtros móveis. Cada módulo deve ter uma entrega separada para facilitar validação pelo operador.

## Pontos preservados

A divisão em módulos, carregamento sob demanda, componentes reutilizáveis e acesso rápido à calculadora fornecem uma base útil. A navegação continua usando os callbacks existentes, reduzindo a superfície desta mudança.
