# Império Sucata — Etapa 9: navegação e utilitários

Data: 16 de outubro de 2026, horário de Fortaleza.

## Escopo

Revisão da mecânica geral de uso, com prioridade para computadores: navegação, busca de comandos, ações rápidas, calculadora e avisos globais. O pacote inclui todas as etapas anteriores. Não altera cálculos financeiros, autenticação, permissões, serviços do banco ou dependências.

## Cabeçalho e navegação

- Busca, ações rápidas e calculadora ficam disponíveis no cabeçalho. Removido o menu flutuante que podia cobrir valores e controles do conteúdo.
- As ações rápidas têm nome e descrição completos. “Clientes” informa que abre a consulta, onde é possível criar o cadastro; deixa de prometer abrir diretamente um novo cadastro.
- Ao trocar de módulo, o título recebe foco após o conteúdo carregar. O título do navegador e a indicação do módulo continuam acompanhando a navegação. O menu móvel mantém foco contido e transfere o foco ao abrir a calculadora.
- Clicar novamente no módulo atual leva o foco ao título, mantendo o conteúdo existente.
- Nova Compra e Nova Venda passam a inicializar corretamente o tipo solicitado. Se já estiver em Transações, abrir outro lançamento exige confirmação antes de reiniciar o formulário; continuar mantém os campos atuais.
- A troca de módulo é bloqueada enquanto um formulário sinaliza operação em andamento. O aviso é removido quando essa operação termina. No Caixa Diário foi acrescentado apenas `aria-busy` ao formulário de lançamento para comunicar esse estado.

Essa confirmação de novo lançamento não é um mecanismo geral de rascunhos. Navegar para outro módulo ou recarregar a página não passa a salvar automaticamente preenchimentos não registrados. Os diálogos de cadastro e edição mantêm seus próprios comportamentos de fechamento.

## Busca e atalhos

- Busca por módulo ou ação com pesquisa sem acento, teclado por setas/Enter, lista vazia, Escape, foco contido e retorno ao controle de origem.
- Todos os sete módulos aparecem na busca, incluindo Clientes e Caixa Diário. A ação Calculadora foi conectada à janela real; antes apenas escrevia uma mensagem no console.
- `Ctrl+K` ou `⌘+K` abre/fecha a busca. `Alt+C` e `Alt+K` abrem/fecham a calculadora.
- Atalhos globais não capturam a digitação em campos, composição de caracteres ou combinações extras de modificadores. Não abrem uma segunda ferramenta sobre outro formulário modal. Dentro da busca, seu atalho continua permitindo fechá-la.
- Ações da busca e da janela de tarefas fecham a janela anterior antes de abrir o destino.

## Calculadora

A função aritmética foi comparada diretamente com a etapa 8 e mantida: soma, subtração, multiplicação, divisão e porcentagem. Também foram mantidos a avaliação sequencial, o arredondamento dos resultados a oito casas, a memória e o histórico de até 20 cálculos. AC continua limpando cálculo, memória e histórico; C limpa apenas o cálculo atual.

Melhorias de interação:

- Janela acessível com resultado focado ao abrir, navegação contida, Escape e retorno ao controle de origem. O conteúdo tem rolagem interna em telas baixas.
- Vírgula ou ponto inserem decimal. Teclas de operação afetam somente a janela aberta e não os campos por trás dela.
- Enter em um botão usa a ação nativa desse botão, sem disparar igualdade ao mesmo tempo. Combinações como Ctrl+C não limpam o valor.
- Divisão por zero e resultados não finitos mostram erro recuperável. Digitar um número após o erro inicia outro cálculo, sem concatenar texto inválido ou armazenar NaN na memória.
- Copiar informa sucesso ou falha. Se a área de transferência estiver indisponível, o resultado pode ser selecionado manualmente. A mensagem de cópia é reiniciada ao reabrir.
- Cálculo, memória e histórico permanecem ao fechar/reabrir durante a sessão da aplicação, sem gravar resultados em campos financeiros ou enviá-los ao banco.

## Conexão e instalação

Os avisos ficam no fluxo da página e não cobrem menus ou campos.

O estado online/offline do navegador não confirma sincronização. Por isso, os textos deixam de afirmar que alterações serão sincronizadas ou que dados já foram sincronizados apenas porque a conexão voltou. O aviso orienta conferir a atualização e a confirmação dos registros. Nenhuma fila offline foi criada nesta etapa.

O convite de instalação explica o acesso como aplicativo, sem prometer operações financeiras offline. A preferência de dispensar é opcional; falhas de armazenamento não interrompem a interface. Falha ao abrir a instalação recebe mensagem e permite nova tentativa.

## Preservação e validação

- ESLint dos componentes de navegação e utilitários alterados, sem erros ou avisos.
- Comparação direta da função aritmética. O Caixa foi comparado com a versão anterior para confirmar que a única mudança é o anúncio de salvamento.
- Chromium com serviços simulados: botões do cabeçalho, comandos por teclado, pesquisa sem acento, módulos, troca de foco e título, lista vazia e abertura real da calculadora pela busca.
- Operações, decimais, porcentagem, memória, histórico, erro por divisão por zero e recuperação; Enter em botão, cópia com sucesso/falha e foco contido.
- Digitação sem captura por atalhos, nenhum utilitário global sobre cadastro modal e preenchimento preservado ao abrir/fechar calculadora.
- Ações rápidas de compra/venda, tipo correto, confirmação antes de reiniciar e cancelamento mantendo os campos.
- Bloqueio de navegação durante envio e remoção do aviso após a confirmação.
- Eventos de conexão e instalação simulados, com falha da instalação tratada.
- Utilitários e cabeçalho nas larguras 1920, 1440, 1366, 1024, 768, 390 e 320 px, incluindo telas baixas de 568 px de altura, sem transbordamento horizontal ou janela fora da tela.
- Regressão dos fluxos de Transações, Caixa Diário, Clientes, Despesas e Relatórios, incluindo os downloads existentes.
- Build de produção, abertura, recarga, login offline e recuperação da inicialização.
- ZIP conferido por integridade, extração completa e comparação dos arquivos extraídos.

Os dados usados nos testes de negócio foram simulados. Nenhum lançamento real foi criado, editado ou excluído. A validação integrada com os dados e as permissões reais da empresa continua pendente; a revisão de autenticação e proteção de gravações no servidor é uma etapa separada. Nenhuma implantação foi realizada.

## Iniciar

Na pasta extraída:

```bash
cd sistema
npm ci
npm run dev
```

Mantenha suas configurações de ambiente. A recuperação `/recuperar.html` continua disponível no endereço e porta do Vite.
