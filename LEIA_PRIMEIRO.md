# Iniciar o Império Sucata

**Este pacote corrige a inicialização e o cache antigo que podem causar tela em branco.** Pare o servidor anterior, extraia em uma pasta nova e siga os comandos abaixo. Se necessário, abra `/recuperar.html` no mesmo endereço e porta do Vite. Consulte `CORRECAO_INICIALIZACAO.md`.

A aplicação de gestão está na pasta **sistema**. O `package.json` da raiz pertence a outra estrutura e não é o usado nesta entrega.

Abra o terminal na pasta extraída e execute:

```bash
cd sistema
npm ci
npm run dev
```

Ou, estando na pasta extraída, use os comandos com o caminho explícito:

```bash
npm --prefix sistema ci
npm --prefix sistema run dev
```

Abra o endereço que o Vite mostrar no terminal. Mantenha suas configurações de ambiente. Não é necessário forçar a resolução de dependências nem atualizar o npm para corrigir o conflito do pacote da raiz.

Para gerar os arquivos de produção, dentro de `sistema`:

```bash
npm run build
```

Este pacote contém as etapas 1 a 10. A etapa 10 corrige falhas de estado após erros do banco, protege impressão/CSV do Estoque e prepara controles de acesso nas funções; consulte `ETAPA_10_SEGURANCA_E_VALIDACAO.md`. A autenticação real e a compatibilidade das regras ainda precisam de migração coordenada antes de produção. A etapa 9 melhora navegação, busca de comandos, ações rápidas, calculadora e avisos globais; consulte `ETAPA_09_NAVEGACAO.md`. A etapa 8 melhora Relatórios, aplicação de período, leitura e exportação; consulte `ETAPA_08_RELATORIOS.md`. A etapa 7 melhora Despesas, seleção de cliente, retorno do salvamento e relatório; consulte `ETAPA_07_DESPESAS.md`. A etapa 6 melhora Clientes, cadastro e navegação do histórico; consulte `ETAPA_06_CLIENTES.md`. A etapa 5 melhora a consulta e a edição de preços do Estoque; consulte `ETAPA_05_ESTOQUE.md`. A etapa 4 recupera a organização original de Transações, incluindo os ícones dos materiais, e melhora a leitura do Caixa Diário com prioridade para computadores. Consulte `ETAPA_04_TRANSACOES_E_CAIXA.md` para o comportamento atual; o documento da etapa 3 registra a versão anterior da interface.

O código-fonte atualizado e o build de produção estão na pasta `sistema`. Nenhuma implantação foi realizada.
