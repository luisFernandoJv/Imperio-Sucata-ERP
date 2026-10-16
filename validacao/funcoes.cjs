const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { ROOT, quiet } = require('./isolamento.cjs');
class HttpsError extends Error { constructor(code,message) { super(message);this.code=code; } }
const authenticated = ['getAggregatedReports','generateReportFile','getAggregatedReport','getLastTransactionPrice','getLiveSummary'];
const administrative = ['backfillHistory','generateMonthReport'];
let accesses=0;
const reached = () => { accesses++;throw new Error('BUSINESS_REACHED'); };
const firestore = Object.assign(() => ({collection:reached,doc:reached}), {FieldPath:{documentId(){return '__name__';}}});
const imports = {
  'firebase-functions/v2/https':{HttpsError,onCall:(_options,handler)=>handler},
  'firebase-functions/v2/firestore':{onDocumentWritten:(_options,handler)=>handler},
  'firebase-functions/v2/scheduler':{onSchedule:(_options,handler)=>handler},
  'firebase-functions':{logger:quiet},
  'firebase-admin':{initializeApp(){},firestore,storage:reached},
  'jspdf':{},'jspdf-autotable':{},'xlsx':{}
};
function load(file) {
  const module={exports:{}};
  const sandbox={module,exports:module.exports,require(name){if(name in imports)return imports[name];throw new Error('Unexpected import '+name);},console:quiet};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT,'functions',file),'utf8'),sandbox,{filename:file});
  return module.exports;
}
imports['./security']=load('security.js');
const functions=load('index.js');
(async()=>{
  for(const name of [...authenticated,...administrative]){
    for(const auth of [undefined,null,{}, {uid:''},{uid:42}]){
      await assert.rejects(functions[name]({auth}),e=>e.code==='unauthenticated',name);
      assert.equal(accesses,0,'Acesso sem autenticação chegou ao Admin SDK');
    }
  }
  for(const name of administrative){
    for(const token of [undefined,{}, {admin:false},{admin:'true'}]){
      await assert.rejects(functions[name]({auth:{uid:'qa-user',token}}),e=>e.code==='permission-denied',name);
      assert.equal(accesses,0,'Operação administrativa chegou ao banco sem claim booleana');
    }
  }
  const data={startDate:'2026-10-01',endDate:'2026-10-16',material:'ferro',tipo:'compra',format:'pdf',year:2026,month:9};
  for(const name of [...authenticated,...administrative]){
    const before=accesses;
    await assert.rejects(functions[name]({auth:{uid:'qa-user',token:{admin:administrative.includes(name)}},data}));
    assert.equal(accesses,before+1,'Requisição autorizada não alcançou o corpo de '+name);
  }
  console.log('PASS: 7 handlers reais recusam 35 identidades ausentes/inválidas antes do Admin SDK; 2 rotinas recusam 8 claims ausentes/falsas/string; credenciais válidas alcançam os 7 corpos existentes. Plataforma simulada, sem implantação.');
})().catch(e=>{console.error(e);process.exitCode=1;});
