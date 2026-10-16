# Império Sucata — Etapa 8: Relatórios

Data: 16 de outubro de 2026, horário de Fortaleza.

## Escopo

Melhorar a consulta, a leitura e a exportação do módulo ativo `OptimizedReports`, com prioridade para computadores. A estrutura de indicadores e abas foi preservada. Este pacote inclui as etapas anteriores e a recuperação de inicialização/cache.

## Período e consulta

- Datas digitadas ficam separadas do período confirmado. “Aplicar período” valida as duas datas e impede consulta com intervalo vazio ou invertido. Enquanto as datas aguardam aplicação, o período usado pelos dados continua identificado e a exportação permanece desabilitada.
- Os atalhos Hoje, Semana, Mês, Trimestre e Ano e a navegação entre meses mantêm os critérios existentes. O atalho ativo é anunciado; os botões de mês têm nomes acessíveis.
- “Atualizar período” repete a consulta completa desse período, sem representar uma sincronização de todos os módulos.
- Erro inicial não apresenta indicadores financeiros como se os dados tivessem sido confirmados. Uma falha de atualização mantém a consulta anterior do mesmo período como referência e bloqueia a exportação até nova confirmação.
- A resposta vazia da consulta é respeitada. Removido o fallback que podia substituir essa resposta pela lista recente do contexto.
- Uma resposta antiga não substitui os dados de uma consulta mais recente. Há indicação de consulta em andamento, consulta lenta e falha com nova tentativa.
- Quantidade encontrada e total consultado são exibidos separadamente. Limpar filtros de consulta mantém o período aplicado.

## Filtros e leitura

- Rótulos associados às datas, tipo, material, pagamento e busca. Busca aceita nomes com ou sem acento e ignora espaços externos.
- Materiais presentes no período consultado entram na lista de seleção, mesmo quando não constam da lista recente do contexto. O filtro continua usando a mesma igualdade do material armazenado.
- Pagamentos incluem as cinco opções já usadas no sistema e eventuais formas presentes na consulta. Não houve conversão dos valores armazenados.
- Indicadores monetários sem reticências que escondam o valor. Ajustes de tamanho, espaçamento e quebra de texto no painel de investimento.
- Rótulo “Período aplicado” substitui a indicação fixa de mês atual. “Vendas menos despesas” explicita o cálculo existente antes das compras; o valor não foi modificado.
- Abas adaptáveis à largura e tabelas com rolagem interna por teclado, cabeçalhos identificados e cabeçalho fixo na tabela de transações.
- A lista continua com 15 transações por página. A página efetiva é ajustada quando os resultados diminuem, evitando uma página vazia artificial.

## Exportação

O botão “Exportar” abre uma janela com teclado, Escape e retorno ao controle de origem. A janela descreve cada opção e esclarece que os arquivos filtrados incluem todas as páginas, não somente as linhas visíveis.

As oito opções PDF e o Excel existentes permanecem. O Excel continua com três abas: Resumo, Transacoes e Materiais; foi corrigido o texto da interface que prometia cinco abas.

O relatório geral de clientes mantém a fonte que já usava: a lista recente de transações carregada no contexto, que pode ser limitada. A opção e o cabeçalho desse PDF agora deixam claro que não usam o período/filtros desta tela e não representam todo o histórico. Esse ajuste é de identificação do alcance; o agrupamento e os cálculos desse relatório permanecem os mesmos.

Os demais relatórios mantêm seus dados, filtros, tabelas, totais, numeração e nomes de arquivo. A aparência geral dos documentos foi preservada. A exportação não é permitida enquanto a consulta está pendente, falhou ou há datas ainda não aplicadas.

Mensagens de andamento, sucesso e falha usam o componente React existente em vez de inserir HTML diretamente no documento. Falhas não expõem detalhes internos na interface.

## Ações de transação

- Detalhes/exclusão em janela com foco contido, nomes acessíveis e retorno ao botão de origem. A confirmação de exclusão começa na opção de manter o lançamento.
- Falha de exclusão mantém a janela e permite nova tentativa. O envio repetido é bloqueado. A mesma função de exclusão e suas reversões existentes continuam sendo usadas.
- A edição mantém o payload, validação e cálculo de quantidade × preço recebidos. A falha é propagada para o editor, que exibe mensagem e preserva os campos, sem indicar sucesso.
- Correção restrita da data/hora inicial do editor: o valor de `datetime-local` usa componentes locais, evitando mostrar UTC como horário local e deslocar a transação ao salvar.
- O editor compartilhado também ganha foco contido e bloqueio de campos, fechamento e envio repetido durante o salvamento. Seu CSS é carregado pelo próprio componente para funcionar no Caixa Diário mesmo antes de abrir Relatórios.

## Regras preservadas

O bloco de cálculo dos indicadores foi comparado diretamente com a etapa 7 e permanece idêntico: vendas, compras, despesas, resultado, investimento, margem, ROI, quantidades, tickets, médias e agrupamentos por material, pagamento e dia.

Não houve alteração em `DataContext`, serviços Firebase, regras do banco, autenticação, permissões ou dependências. A correção da fonte vazia e a identificação do estado da consulta evitam apresentar dados de outra referência como confirmação do período, sem introduzir uma nova fórmula financeira.

## Validação

- ESLint dos três componentes JSX alterados/adicionados, sem erros ou avisos.
- Comparação direta das fórmulas e integridade de contexto/serviço.
- Chromium com dados simulados: totais, filtros, pagamentos, materiais fora da lista recente, busca sem acento, aplicação de datas e paginação.
- Datas vazias/invertidas sem consulta, resposta vazia sem fallback indevido, falha inicial sem valores fictícios, atualização com referência preservada, nova tentativa e consulta lenta.
- Concorrência entre consultas de meses diferentes, com a resposta antiga ignorada.
- Geração e download real dos oito PDFs e do Excel. A planilha foi lida para conferir as três abas e a presença de registros de outras páginas; textos dos PDFs financeiro e de clientes foram extraídos para conferir valores e alcance.
- Detalhes, foco, cancelamento, falha/repetição da exclusão; edição com erro mantendo campos, sucesso e horário local preservado.
- Quatro abas nas larguras 1920, 1440, 1366, 1024, 768, 390 e 320 px, sem rolagem horizontal da página. Tabelas usam rolagem interna.
- Regressão do formulário de Transações e do Caixa Diário. Editor compartilhado aberto diretamente no Caixa, com estilo, horário local e foco contido.
- Build de produção, abertura, recarga, login offline e recuperação da inicialização.
- Integridade do ZIP, extração completa e comparação dos arquivos extraídos.

Os testes de negócio usam dados simulados; nenhum lançamento real foi criado, alterado ou excluído. A integração com os dados e permissões da empresa deve ser conferida na instalação local. Nenhuma implantação foi realizada.

## Iniciar

Na pasta extraída:

```bash
cd sistema
npm ci
npm run dev
```

Preserve as configurações de ambiente. `/recuperar.html` continua disponível no endereço e porta do Vite, conforme `CORRECAO_INICIALIZACAO.md`.
