# Validação local — etapa 10

Não usa credenciais da empresa. O projeto de teste é fixo: `demo-imperio-audit`, Firestore em `127.0.0.1:8180`. Os testes recusam executar com outro host. Não é necessário fazer `firebase login`.

A partir da pasta extraída:

```bash
cd validacao
npm ci
npm run test:local
npm run test:emulator
```

Ambiente utilizado na entrega: Node 24 e Java 17, Firebase CLI 13.35.1 e SDK Firebase 10.14.1. Java precisa estar disponível para o emulador. A primeira execução pode baixar o emulador; a porta 8180 deve estar livre. As dependências de testes ficam nesta pasta, separadas das da aplicação e das funções.

- `funcoes.cjs`: carrega os sete handlers reais com adaptadores de plataforma simulados; verifica as recusas antes de acesso ao Admin SDK e a chegada de chamadas válidas ao corpo original. Não publica nem executa operações administrativas.
- `exportacao.cjs`: executa os utilitários reais de impressão e CSV com entradas adversas e adaptadores de janela/download. Verifica segurança do texto e manutenção dos valores numéricos.
- `regras.cjs`: carrega o arquivo real `firestore.rules` e registra as permissões e negativas atuais no emulador. Algumas negativas representam bloqueios do aplicativo; veja o relatório da etapa 10. O teste passa quando essas incompatibilidades são reproduzidas; não certifica que as regras estão prontas para produção.
- `fluxo.cjs`: executa os serviços e handlers atuais contra o Firestore emulado. Usa um contexto com regras desativadas **somente no emulador**, para separar aritmética de autorização. Testa compra, venda, despesas, empréstimo/pagamento de saldo, caixa, edição, exclusão e preservação de estado/cache após falhas antes da gravação. Limpa os dados fictícios do emulador. Não executa triggers nem prova atomicidade de operações parciais.
- `isolamento.cjs`: impõe host/projeto de teste e adapta os imports do código real para execução Node, sem reproduzir as fórmulas nos testes.
- `auditoria-dependencias.json`: resumo de `npm audit --omit=dev` no frontend em 16/10/2026. Não representa teste de exploração ou auditoria completa de backend.

O teste financeiro possui expectativas fixas de estoque e caixa; não calcula o resultado esperado usando a mesma implementação sob teste. Se os blocos do código-fonte forem movidos ou renomeados, os adaptadores precisam ser ajustados. As verificações de navegador e do build, descritas no relatório, também foram executadas nesta entrega; não fazem parte destes comandos reproduzíveis.
