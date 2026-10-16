const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { ROOT } = require('./isolamento.cjs');
const safeSource=fs.readFileSync(path.join(ROOT,'sistema/src/lib/safeExport.js'),'utf8').replace(/export function /g,'function ');
const safe=new Function(safeSource+';return {escapeHtml,csvText};')();
const source=fs.readFileSync(path.join(ROOT,'sistema/src/lib/utils.js'),'utf8').replace(/^import .*;\n/gm,'').replace(/export (const|function) /g,'$1 ');
let html='',blob,clicked=false,detached=false;
const printWindow={opener:{},document:{write(value){html=value;},close(){}}};
const document={createElement(){return {setAttribute(){},click(){clicked=true;}};},body:{appendChild(){},removeChild(){detached=true;}}};
const utilities=new Function('clsx','twMerge','escapeHtml','csvText','window','document','URL','alert',source+';return {printInventory,exportInventoryToCSV};')(
 ()=>'',()=>'',safe.escapeHtml,safe.csvText,{open:()=>printWindow},document,{createObjectURL(value){blob=value;return 'blob:fixture';}},()=>{throw new Error('Unexpected popup failure');}
);
(async()=>{
 const name='<img src=x onerror="alert(1)"> & "Ferro"';
 const category=' =HYPERLINK("x");categoria';
 const inventory={teste:{quantidade:-3,precoCompra:2.5,precoVenda:4.5}};
 const materials=[{key:'teste',name,category}];
 utilities.printInventory(inventory,materials);
 assert.equal(printWindow.opener,null);
 assert(!html.includes('<img'));assert(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
 assert(html.includes('&amp; &quot;Ferro&quot;'));assert(html.includes('-3kg'));
 utilities.exportInventoryToCSV(inventory,materials);
 assert(clicked&&detached);
 const csv=await blob.text();
 assert(csv.includes('" =')===false,'Fórmula não neutralizada');
 assert(csv.includes('"\' =HYPERLINK(""x"");categoria"'));
 assert(csv.includes('"<img src=x onerror=""alert(1)""> & ""Ferro"""'));
 assert(csv.endsWith(';-3,00;2,50;4,50;-7,50'));
 for(const text of ['=1','+1','-1','@SUM(A1)','\t=1','\r\n+1'])assert(safe.csvText(text).startsWith('"\''));
 assert.equal(safe.csvText('Ferro; "limpo"\nlinha'),'"Ferro; ""limpo""\nlinha"');
 console.log('PASS: impressão real trata HTML cadastral como texto e remove opener; CSV real neutraliza fórmulas, protege delimitadores/aspas e mantém valores numéricos, inclusive negativos.');
})().catch(e=>{console.error(e);process.exitCode=1;});
