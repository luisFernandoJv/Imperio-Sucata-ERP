# Império Sucata — Etapa 6: Clientes e histórico

Data: 15 de outubro de 2026, horário de Fortaleza.

## Direção

Melhorar a consulta e os formulários de Clientes e Fornecedores, preservando os cartões e a lógica financeira recebida. Prioridade para computadores, com adaptação complementar a telas menores. Este pacote inclui as etapas anteriores e a correção de inicialização/cache.

## Consulta e navegação

- Busca por nome com ou sem acento e por CPF/telefone com ou sem pontuação. O formato salvo no cadastro não é alterado pela busca.
- Ordenação explícita por nome A–Z, maior saldo primeiro ou cadastro recente. Os critérios e o padrão por nome foram mantidos.
- Contagem dos resultados, limpeza da busca e mensagens distintas para lista vazia, nenhum resultado, carregamento lento e falha de sincronização.
- Indicadores identificados como “Cadastros” e “Saldo acumulado”, de acordo com os dados que já exibiam. A contagem e a soma continuam as mesmas.
- Ações de editar, excluir, PDF e histórico com nomes acessíveis. O nome do cliente também abre o histórico por teclado; clicar no cartão continua funcionando.
- Ao voltar do histórico, a busca e a ordenação permanecem, com retorno ao ponto de navegação e ao controle de origem.
- Ajustes de largura, espaçamento, texto, foco e rolagem interna da tabela. Animações da lista respeitam a preferência de movimento reduzido.

## Cadastro e edição

Os campos continuam sendo nome, telefone, CPF e observações. Apenas o nome é obrigatório; não foi criada uma nova validação de CPF ou uma máscara que altere os dados.

O cadastro novo envia os mesmos campos e saldo inicial zero. A edição envia os mesmos dados cadastrais, sem incluir ou modificar saldo, totais ou histórico.

- Janela com foco inicial no nome, navegação por teclado e retorno ao controle de origem.
- Confirmação antes de descartar um preenchimento alterado; continuar ou pressionar Escape na confirmação retorna aos campos.
- Envio em andamento bloqueia campos e repetição de chamadas. A falha mantém o preenchimento e oferece uma mensagem visível, sem detalhes internos.
- Exclusão identifica o cadastro, começa com foco na opção de manter e permite nova tentativa após erro. A mesma função de exclusão continua sendo usada, sem novas permissões ou restrições por saldo.
- Exportação rápida mantém a chamada e o gerador PDF existentes; exibe andamento, conclusão ou falha.

## Histórico

O classificador de movimentações, as estatísticas, o mapa de saldo após cada transação, a evolução da dívida e os critérios dos filtros foram comparados com a versão anterior e mantidos idênticos.

Também foi corrigida a altura visual das barras do gráfico e o contraste do título do perfil, mantendo os mesmos valores e percentuais.

A melhoria se limita à interação: voltar para Clientes, foco no título, nomes dos botões, rótulos dos filtros, estado de expansão e tabela navegável com cabeçalho fixo durante a rolagem.

Uma falha na primeira consulta não apresenta saldo zero como se os dados tivessem sido confirmados. Após uma consulta válida, uma falha ao atualizar mantém os dados anteriores e oferece nova tentativa. Exportação, impressão e compartilhamento ficam indisponíveis durante uma consulta em andamento ou após uma atualização não confirmada.

O botão PDF utiliza o gerador existente com os mesmos argumentos. Não foram alterados o formato do extrato, a classificação de dívida ou os cálculos.

## Alteração restrita na assinatura de clientes

`subscribeToCustomers` passa a aceitar um segundo argumento opcional para receber erros do listener. Isso permite mostrar falhas assíncronas e oferecer nova tentativa na tela, em vez de deixá-la aguardando indefinidamente.

A coleção consultada, a ordenação, a transformação dos documentos, o unsubscribe e a compatibilidade com chamadas que passam apenas o callback de dados foram preservados. As funções de criar, editar, excluir, consultar transações e atualizar saldo não foram modificadas. Não houve mudança em regras do banco, autenticação, permissões, dependências ou funções de cálculo.

## Validação

- ESLint dos três componentes JSX alterados/adicionados.
- Comparação direta do classificador, dos cálculos e da filtragem do histórico com a etapa anterior.
- Verificação isolada da assinatura real: consulta, transformação de dados, unsubscribe e callback opcional de erro.
- Chromium com serviços simulados: busca por acento e números, ordenação, sete larguras de tela, cadastro com envio único, payloads, edição sem alterar saldo, falhas sem perder campos, descarte, foco e exclusão confirmada.
- Histórico com cinco movimentações fictícias: saldo calculado, saldo por linha, filtros, retorno à mesma busca/foco, falhas inicial e de atualização, dados anteriores mantidos e PDF real gerado para download.
- Erro assíncrono na leitura de clientes com nova tentativa; nome vazio sem gravação; conteúdo semelhante a HTML tratado como texto; navegação por teclado contida no formulário.
- Build de produção, abertura e recarga com o worker de produção, login offline e recuperação de carregamento.
- Integridade, extração completa e comparação dos arquivos do ZIP conferidas.

As resoluções verificadas incluem larguras 1920, 1440, 1366, 1024, 768, 390 e 320 px. A tabela mantém rolagem interna nas larguras menores.

Os dados de negócio foram simulados. Nenhum cliente, saldo ou lançamento real foi criado, alterado ou excluído. A integração com permissões e dados reais da empresa exige conferência local; esta revisão de interface não substitui autorização e validação no servidor. Nenhuma implantação foi realizada.

## Iniciar

Dentro da pasta extraída:

```bash
cd sistema
npm ci
npm run dev
```

Preserve sua configuração `.env.local`. A página `/recuperar.html`, no mesmo endereço e porta do Vite, permanece disponível conforme `CORRECAO_INICIALIZACAO.md`.
