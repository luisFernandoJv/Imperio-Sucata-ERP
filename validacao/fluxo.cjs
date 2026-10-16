const assert = require("node:assert/strict");
const { initializeTestEnvironment } = require("@firebase/rules-unit-testing");
const sdk = require("firebase/firestore");
const { ROOT, ensureEmulator, loadService, loadHandlers, quiet } = require("./isolamento.cjs");
const fs = require("node:fs"), path = require("node:path");
(async () => {
  ensureEmulator();
  const env = await initializeTestEnvironment({ projectId: "demo-imperio-audit", firestore: { host: "127.0.0.1", port: 8180, rules: fs.readFileSync(path.join(ROOT,"firestore.rules"),"utf8") } });
  try {
    await env.clearFirestore();
    // Só neste contexto do emulador: isola a aritmética das incompatibilidades de autorização.
    await env.withSecurityRulesDisabled(async context => {
      const db = context.firestore(), service = loadService(db);
      let state = [], inventory = {}, persisted = {}, connected = true;
      const dependencies = {
        console: quiet, addTransactionToFirebase: service.addTransaction,
        getTransactionById: service.getTransactionById, updateTransactionFirebase: service.updateTransaction,
        deleteTransactionFirebase: service.deleteTransaction, updateInventoryQuantity: service.updateInventoryQuantity,
        getInventory: service.getInventory, getLiveSummary: service.getLiveSummary,
        setTransactions: fn => { state = typeof fn === "function" ? fn(state) : fn; },
        setInventory: value => { inventory = value; }, setLiveSummary() {},
        setFirebaseConnected: value => { connected = value; },
        localStorage: { setItem: (key, value) => { persisted[key] = value; } },
        transactions: state, setTimeout() {}
      };
      const handlers = loadHandlers(dependencies);
      await sdk.setDoc(sdk.doc(db,"inventory/current"), { ferro: { quantidade: 0, precoCompra: 2, precoVenda: 5 } });
      const date = new Date(2026,9,16,12);
      const base = { material:"ferro", data:date, vendedor:"Pessoa fictícia", formaPagamento:"dinheiro" };
      await handlers.addTransaction({...base,tipo:"compra",quantidade:100,precoUnitario:2,valorTotal:200});
      assert.equal((await service.getInventory()).ferro.quantidade,100);
      await handlers.addTransaction({...base,tipo:"venda",quantidade:20,precoUnitario:5,valorTotal:100});
      assert.equal((await service.getInventory()).ferro.quantidade,80);
      const sale = (await service.getTransactions()).find(t=>t.tipo==="venda");
      await handlers.addTransaction({...base,tipo:"despesa",material:"despesa",quantidade:1,precoUnitario:50,valorTotal:50});
      const client = await service.addCustomer({nome:"Cliente fictício",saldo:0});
      await handlers.addTransaction({...base,tipo:"despesa",material:"despesa",quantidade:1,precoUnitario:70,valorTotal:70,clienteId:client});
      await service.updateCustomerBalance(client,70,"emprestimo");
      await service.updateCustomerBalance(client,20,"pagamento");
      assert.equal((await service.getCustomerById(client)).saldo,50);
      assert.equal((await service.getInventory()).ferro.quantidade,80);
      const cash = await service.setCaixaInicialManual("2026-10-16",500);
      assert.equal(cash.totalCompras,200);assert.equal(cash.totalVendas,100);
      assert.equal(cash.totalDespesas,120);assert.equal(cash.saldoFinal,280);
      await handlers.editTransaction(sale.id,{...sale,quantidade:10,valorTotal:50});
      assert.equal((await service.getInventory()).ferro.quantidade,90);
      assert.equal((await service.calculateCaixaDia("2026-10-16")).saldoFinal,230);
      state = await service.getTransactions();
      await handlers.deleteTransaction(sale.id);
      assert.equal((await service.getInventory()).ferro.quantidade,100);
      assert.equal(state.some(t=>t.id===sale.id),false);
      assert.equal((await service.calculateCaixaDia("2026-10-16")).saldoFinal,180);
      assert.equal(inventory.ferro.quantidade,100);
      // Falhas antes da primeira gravação devem manter estado e cache confirmados.
      const before = JSON.stringify(state), cacheBefore = JSON.stringify(persisted);
      const failing = async () => { throw new Error("permission-denied fixture"); };
      const failed = loadHandlers({...dependencies,transactions:state,addTransactionToFirebase:failing,updateTransactionFirebase:failing,deleteTransactionFirebase:failing});
      await assert.rejects(failed.addTransaction({...base,tipo:"compra",quantidade:1,precoUnitario:2,valorTotal:2}));
      await assert.rejects(failed.editTransaction(state[0].id,{...state[0],valorTotal:999}));
      await assert.rejects(failed.deleteTransaction(state[0].id));
      assert.equal(JSON.stringify(state),before);assert.equal(JSON.stringify(persisted),cacheBefore);assert.equal(connected,false);
      console.log("PASS: código real de serviços/handlers: compra 100kg → venda 20kg → 80kg; despesas sem estoque; saldo cliente 70-20=50; caixa 280; edição → 90kg/230; exclusão → 100kg/180; 3 falhas preservam estado/cache.");
    });
  } finally { await env.cleanup(); }
})().catch(e => { console.error(e); process.exitCode=1; });
