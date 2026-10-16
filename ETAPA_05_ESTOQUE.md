# Império Sucata — Etapa 5: usabilidade do Estoque

Data: 15 de outubro de 2026, horário de Fortaleza.

## Escopo

Esta etapa melhora a consulta e a edição de preços do Estoque, com prioridade para computadores. Mantém os cartões, a tabela, os ícones e as regras existentes. O pacote inclui as etapas anteriores e a correção de inicialização/cache.

## Mecânica de uso

- Busca com rótulo visível, limpeza rápida e pesquisa com ou sem acento: “aluminio” encontra “Alumínio”. Espaços externos são ignorados.
- Categorias visíveis em linhas, com indicação de seleção. Removida a opção “Todos os Materiais” duplicada.
- Contagem de materiais encontrados, botão para limpar todos os filtros e ação para sair de uma busca sem resultados.
- Botões nomeados “Cartões” e “Tabela”, com o estado ativo anunciado. A visualização inicial continua sendo cartões.
- Ações dos cartões ficam visíveis e possuem nomes acessíveis; deixam de depender de passar o mouse sobre o cartão.
- Tabela com cabeçalho fixo durante a rolagem, valores alinhados e região de rolagem acessível por teclado. Configurar e remover materiais usam os mesmos fluxos já disponíveis nos cartões; remoção continua restrita aos materiais dinâmicos.
- Impressão e exportação mantêm os dados do estoque completo, como antes. Os botões e a mensagem próxima deixam esse alcance explícito mesmo com filtros aplicados.
- Erro de carregamento oferece nova tentativa. Se uma atualização falhar com dados já disponíveis, a referência exibida e o preenchimento são mantidos.

## Edição de preços

O botão de editar da tabela anteriormente alterava um estado interno, mas não exibia campos. A edição de preços agora abre uma janela consistente nos cartões e na tabela.

A janela identifica o material, mostra sua quantidade atual e oferece somente os dois preços por kg que já eram editáveis. A quantidade não vira um campo de ajuste. O fluxo usa o mesmo `useUpdateInventory` e o mesmo serviço `updateInventoryItem`, com a mesma estrutura de dados existente.

- Foco inicial no preço de compra, navegação contida na janela e retorno ao botão de origem ao fechar.
- Cancelar ou Escape com alterações abre confirmação de descarte; continuar editando preserva os valores. Escape na confirmação retorna ao preenchimento.
- Campos vazios ou não numéricos não são enviados. A precisão numérica já existente é aceita, sem impor um novo arredondamento.
- Salvamento bloqueia os campos e chamadas simultâneas. Em falha, os valores permanecem na janela para conferência e nova tentativa; detalhes internos não aparecem na mensagem.
- Ao salvar, os campos de preço são convertidos para números, como no fluxo anterior; os demais campos recebidos do inventário são preservados.

## Lógica preservada

Não foram modificados serviços Firebase, hooks de negócio, contextos, regras de acesso, funções de cálculo, formatos de exportação ou dependências.

Os cálculos dos indicadores foram comparados com o código anterior e permanecem idênticos: peso, investimento e potencial de venda desconsideram quantidades negativas no resumo global; a margem mantém a fórmula existente. As fórmulas e a apresentação de estoque baixo/negativo dos cartões e da tabela foram preservadas.

A confirmação administrativa para criar, configurar ou remover materiais permanece a recebida no projeto. Esta etapa não substitui esse mecanismo por uma nova autenticação nem altera suas permissões. A revisão de autorização no servidor continua fora do escopo.

Os avisos deste módulo deixam de interpolar nomes em `innerHTML` e passam a usar o componente de mensagens React já presente no projeto.

## Validação

- ESLint dos seis componentes JSX do módulo.
- Build de produção e verificação de abertura, recarga, modo offline e recuperação de inicialização.
- Chromium com serviços de estoque simulados; nenhum registro real alterado.
- Cartões e tabela nas larguras de 1920, 1440, 1366, 1024, 768, 390 e 320 px, sem rolagem horizontal na página. A tabela preserva rolagem interna quando necessária.
- Busca por acento, categorias, estoque baixo, contagem, ausência de resultados e limpeza de filtros.
- Edição pelas duas visualizações, dados enviados, precisão preservada, quantidade intacta inclusive negativa, foco, confirmação de descarte e proteção contra envio simultâneo.
- Falha ao salvar mantendo os campos; erro inicial de leitura com recuperação; validação de campo vazio sem gravação.
- Abertura de configuração e confirmação de remoção existentes, cancelamento sem gravar e exportação completa mesmo com busca aplicada.
- ZIP validado por integridade, extração completa e comparação dos arquivos extraídos.

A simulação valida a interface e a integração esperada com os hooks e serviços. A operação com o banco real, impressora e configurações específicas da empresa ainda deve ser conferida na instalação local. Nenhuma implantação foi realizada.

## Iniciar

Dentro da pasta extraída:

```bash
cd sistema
npm ci
npm run dev
```

Preserve seu `.env.local`. A página `/recuperar.html` permanece disponível no endereço e porta do Vite para recuperar arquivos antigos do navegador, conforme `CORRECAO_INICIALIZACAO.md`.
