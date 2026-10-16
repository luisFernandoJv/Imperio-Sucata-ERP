# Império Sucata — Etapa 7: Despesas

Data: 15 de outubro de 2026, horário de Fortaleza.

## Escopo

Melhorar o preenchimento de despesas e a consulta para relatório, com prioridade para computadores. A organização em formulário e painel de relatório foi mantida. O pacote é cumulativo e inclui as etapas anteriores, os ícones de Transações e a recuperação de inicialização/cache.

## Usabilidade

- Campos com rótulos, agrupamento e indicação do que é obrigatório. Erros próximos ao campo, associados ao controle, com foco no primeiro problema.
- Categorias, formas de pagamento e respectivos ícones preservados. A categoria usa seleção nativa, operável por teclado; as formas de pagamento usam um grupo de opções nativas.
- Seleção de cliente em janela com busca por nome sem acento, CPF ou telefone, foco contido, Escape e retorno ao botão de origem. Há estados de carregamento, consulta lenta, falha com nova tentativa e lista vazia.
- Cliente só pode ser selecionado na categoria Empréstimo, como já indicava a interface anterior. Um vínculo existente é mantido ao trocar a categoria, de acordo com o comportamento recebido, e isso fica explícito. Apenas Empréstimo atualiza o saldo.
- O empréstimo sem cliente continua permitido, com explicação de que não atualizará saldo de cliente. Não foi criada uma nova regra de obrigatoriedade.
- Limpar exige confirmação quando há preenchimento. A janela começa em continuar preenchendo; confirmar limpa os campos e devolve o foco ao nome.
- Durante o registro, campos e ações de limpar/enviar ficam bloqueados. Uma referência síncrona também impede chamadas repetidas antes de o React atualizar os botões. Em consulta demorada, a tela pede para aguardar a confirmação.
- Confirmação e erros aparecem na própria tela. O formulário permanece em Despesas após sucesso, como antes, para permitir o próximo lançamento.
- Estilos restritos ao módulo, alvos de interação de pelo menos 44 px e ajustes para larguras menores. A preferência de movimento reduzido desativa a rotação do indicador.

## Correção do retorno de salvamento

O fluxo anterior gravava uma cópia local antes do envio, capturava falhas do Firebase sem interromper o caminho de sucesso e limpava o formulário. Isso podia apresentar uma despesa como concluída sem confirmação no banco.

Agora, o formulário aguarda `addTransaction` e só então atualiza a cópia local. Uma falha no envio mantém o preenchimento e não acrescenta um registro local como se estivesse confirmado. Falhas na cópia do navegador após uma confirmação no banco são informadas sem induzir um novo envio.

No empréstimo vinculado, a chamada seguinte continua sendo `updateCustomerBalance(clienteId, valor, "emprestimo")`. Se essa atualização falhar após o lançamento ter sido salvo, a tela distingue a conclusão parcial e bloqueia o reenvio. Um marcador contendo somente o identificador do lançamento mantém esse aviso ao sair e voltar ao módulo na mesma sessão do navegador. Para iniciar outra despesa, é necessário confirmar que o lançamento já existe; isso não refaz nem corrige automaticamente o saldo.

O serviço recebido realiza lançamento e atualização de saldo em duas operações. Esta etapa não os transforma em uma operação atômica e não implementa idempotência no servidor. Em confirmação incerta ou falha parcial, é necessário conferir os registros antes de qualquer novo lançamento ou ajuste. Nenhum ajuste financeiro automático foi acrescentado.

## Dados e regras preservados

- Mesmo payload enviado para registrar a despesa: tipo/material, quantidade 1, valor unitário e total, favorecido, observações com prefixo da categoria, data, pagamento, número e cliente.
- Mesmas 15 categorias, cinco pagamentos, padrão Operacional/Dinheiro e saldo de empréstimo calculado pelo serviço existente.
- Nome composto apenas por espaços, valor não finito ou não positivo e data vazia são bloqueados. A restrição já existente de centavos no campo de valor é mantida, sem arredondamento automático.
- A data do lançamento preserva o horário local ao trocar o dia.
- O arquivo de serviço Firebase, contextos, estoque, caixa, autenticação, dependências e regras do banco não foram alterados nesta etapa.

A cópia local continua usando `recycling_transactions`; o identificador passa a ser o ID confirmado do lançamento. Essa cópia não é uma fila offline ou mecanismo de reenvio.

## Relatório

- Filtros independentes do formulário, campos bloqueados durante a geração e proteção contra consultas repetidas.
- Datas vazias ou período invertido recebem mensagem e não iniciam consulta. Os valores digitados permanecem após uma falha.
- Exibição das datas em componentes locais, corrigindo a possibilidade de o último dia do mês aparecer como o primeiro dia do mês seguinte por conversão UTC.
- Nenhum resultado é tratado como estado vazio, com indicação de rever período/categoria.
- Filtro por tipo de despesa, filtro por categoria, soma dos valores, conteúdo, aparência e nome do PDF preservados. O corpo do gerador foi comparado diretamente com a etapa anterior.

## Validação

- ESLint dos dois componentes JSX desta etapa e build de produção.
- Chromium com serviços simulados, sem alteração de dados reais.
- Cadastro de despesa comum, empréstimo com e sem cliente, mesmos argumentos de saldo, payload e datas locais.
- Campos inválidos, precisão de centavos, falha mantendo preenchimento, bloqueio de envio repetido, erro parcial e aviso preservado ao voltar ao módulo.
- Confirmação de limpeza, foco, teclado, busca de clientes por nome/CPF/telefone, lista vazia e recuperação de consulta.
- Falha na cópia local após confirmação no banco, registro lento e conteúdo semelhante a HTML exibido como texto.
- Datas vazias/invertidas no relatório, ausência de resultados, falha com filtros preservados e download de um PDF real. O texto do PDF foi extraído para conferir o filtro e o total do cenário de teste.
- Larguras 1920, 1440, 1366, 1024, 768, 390 e 320 px, sem transbordamento horizontal da página ou janela de seleção.
- Abertura, recarga, login offline e recuperação do build de produção, sem exceções JavaScript.
- ZIP validado por integridade, extração completa e comparação dos arquivos extraídos.

Os testes de negócio usam dados simulados. A integração com permissões e dados reais deve ser conferida na instalação local. Nenhuma implantação foi realizada.

## Iniciar

Na pasta extraída:

```bash
cd sistema
npm ci
npm run dev
```

Preserve suas configurações de ambiente. A página `/recuperar.html` permanece disponível no mesmo endereço e porta do Vite, conforme `CORRECAO_INICIALIZACAO.md`.
