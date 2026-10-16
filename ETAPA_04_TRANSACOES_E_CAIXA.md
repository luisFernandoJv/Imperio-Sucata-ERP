# Império Sucata — Etapa 4: Transações e Caixa Diário

Data: 15 de outubro de 2026.

## Direção desta revisão

Recuperar o formulário de Transações recebido no projeto, preservando o reconhecimento visual e o fluxo usado no balcão. As melhorias priorizam computadores, sem redesenhar os módulos. Este pacote é cumulativo: inclui as etapas anteriores e substitui a apresentação da etapa 3 pela revisão descrita aqui.

## Transações

- Retorno dos 29 materiais com seus ícones e cores originais, no botão de seleção, na lista de busca e nos materiais recentes.
- Retorno do cartão único com Compra/Venda, material, quantidade, preço/kg e total; pagamentos com os ícones e nomes anteriores; identificação e ações nas posições conhecidas.
- Mantidos os botões “Salvar Transação”, “Salvar e Continuar” e “Limpar”, além das ações de edição e exclusão.
- Ajustes pontuais de largura, alinhamento, espaçamento, leitura numérica, tamanho dos campos e foco por teclado. Quantidade, preço e total ficam na mesma linha no computador.
- Calendário familiar com horário explícito ao lado; o horário escolhido, incluindo 00:00, é preservado. O campo de data obrigatório não oferece limpeza acidental.
- Busca de cliente não altera o vínculo já confirmado enquanto o usuário apenas digita. Selecionar um cadastro ou confirmar um nome continua sendo uma ação explícita.
- Observações permanecem disponíveis para Pix, junto do identificador de transação.
- Confirmação para limpar dados não salvos e excluir; cadastro de cliente com foco controlado, Escape e proteção contra envios repetidos.

### Robustez mantida

Uma falha ao salvar mantém os campos preenchidos, inclusive em “Salvar e Continuar”. O envio fica bloqueado enquanto uma operação está em andamento; há também uma proteção síncrona contra repetição. Após sucesso, nome e vínculo do cliente são limpos juntos. O formulário continua aberto para o próximo lançamento; “Salvar e Continuar” volta o foco para a quantidade.

O preço de uma edição permanece o preço gravado. Consultas tardias não substituem o preço digitado manualmente nem aplicam o preço de um material anterior. Preferências locais inválidas não impedem abrir o formulário. Falta de acesso ao estoque é indicada; uma venda atual exige referência confirmada.

Foram mantidos os identificadores dos materiais, os campos enviados, as formas de pagamento e a sequência de chamadas aos serviços de transação e saldo. O cálculo mantém quantidade e preço arredondados para três casas e o produto arredondado para três casas. Exemplo: 12,345 × 2,789 resulta no valor numérico 34,43. A diferença por kg na venda mantém a fórmula recebida.

## Caixa Diário

- Mantidos o formulário à esquerda e a folha de movimentos à direita, com tipos, materiais, pagamentos, ações, resumo e fechamento existentes.
- Melhor distribuição de largura no computador, campos legíveis e tabela com espaçamento consistente. A rolagem horizontal fica dentro da tabela quando necessária; a página permanece contida.
- Cabeçalho da tabela fixo durante a rolagem e região acessível por teclado. O painel de lançamento considera a altura do cabeçalho da aplicação.
- Carregamento com mensagem, falha com “Tentar novamente” e proteção para uma resposta lenta de outra data não substituir o dia solicitado. O relatório fica indisponível enquanto os dados do dia não estão confirmados.
- A equação visual do saldo passa a mostrar sangrias quando existentes. O saldo calculado pelos serviços não foi alterado.
- A comparação de vendas de hoje usa o início do dia, corrigindo o mesmo problema encontrado em Transações: hoje não é uma data retroativa. Peso e preço inválidos ou não positivos são rejeitados.
- A precisão do Caixa permanece a recebida: quantidade e preço preparados para três casas, produto gravado com duas casas; despesas e sangrias mantêm o tratamento existente.

## Segurança e componente de data

Os avisos dos dois módulos passam a ser renderizados como texto pelo React, removendo a interpolação com `innerHTML`. Mensagens de erro ao salvar Transações não expõem detalhes técnicos e orientam conferir os registros antes de repetir uma operação cuja confirmação falhou.

O seletor de data compartilhado foi ajustado para usar botões separados de seleção e limpeza, corrigindo o HTML com botão dentro de botão. O calendário cabe na largura da janela e fecha com Escape, devolvendo o foco.

## Validação

- ESLint dos cinco arquivos JavaScript/JSX modificados ou adicionados.
- Build de produção com Vite e geração do service worker.
- Chromium com serviços simulados e bloqueio de acessos externos. Nenhum dado real foi gravado, editado ou excluído.
- Transações e Caixa nas larguras 1920, 1440, 1366, 1024, 768, 390 e 320 px; prioridade de inspeção nos computadores.
- Ícones dos 29 materiais, busca e Escape, navegação, total/payload, precisão, prevenção de envio duplicado, falha preservando campos, limpeza do vínculo de cliente, confirmação de limpeza, restrição de estoque de hoje e data à meia-noite.
- Cadastro com conteúdo semelhante a HTML tratado como texto, pagamento de dívida, consulta lenta sem apagar preço manual, estoque indisponível com recuperação, edição e confirmação de exclusão.
- Caixa: ordem dos movimentos, saldo exibido, estrutura de duas colunas, restrição de estoque, rejeição de valores negativos, precisão do lançamento, erro com nova tentativa, troca de datas concorrente e relatório de impressão.
- ZIP conferido por integridade, extração completa e comparação de conteúdo com os arquivos de origem.

A simulação verifica o comportamento da interface e as chamadas esperadas. A integração com o ambiente de produção e a impressão na configuração real da empresa ainda exigem conferência local. Serviços Firebase, contextos de negócio, regras de acesso, Cloud Functions e dependências não foram modificados. As chamadas separadas de transação, estoque e saldo continuam sem uma operação atômica única; essa revisão de interface não substitui idempotência, validação e autorização no servidor.

## Instalação

Siga `LEIA_PRIMEIRO.md`. Dentro da pasta extraída:

```bash
cd sistema
npm ci
npm run dev
```

Para produção: `npm run build`, dentro de `sistema`.
