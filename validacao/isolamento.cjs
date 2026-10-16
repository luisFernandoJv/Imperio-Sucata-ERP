const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const ROOT = path.resolve(__dirname, "..");
function ensureEmulator() {
  assert.equal(process.env.FIRESTORE_EMULATOR_HOST, "127.0.0.1:8180", "Execute com o emulador local na porta 8180.");
  if (process.env.GCLOUD_PROJECT) assert.equal(process.env.GCLOUD_PROJECT, "demo-imperio-audit");
}
const quiet = { log() {}, warn() {}, error() {}, info() {} };
function loadService(db) {
  const sdk = require("firebase/firestore");
  let source = fs.readFileSync(path.join(ROOT, "sistema/src/lib/firebaseService.js"), "utf8");
  const names = [...source.matchAll(/export const (\w+)\s*=/g)].map(m => m[1]);
  source = source.replace(/import[\s\S]*?from\s*["']firebase\/firestore["'];?/, "").replace(/import \{ db \} from ["'].\/firebase["'];?/, "").replace(/export const /g, "const ");
  return new Function(...Object.keys(sdk), "db", "console", source + "\nreturn {" + names.join(",") + "};")(...Object.values(sdk), db, quiet);
}
function loadHandlers(dependencies) {
  const source = fs.readFileSync(path.join(ROOT, "sistema/src/contexts/DataContext.jsx"), "utf8");
  const start = source.indexOf("  const addTransaction = async");
  const end = source.indexOf("  const updateInventory = async", start);
  assert(start > 0 && end > start);
  return new Function(...Object.keys(dependencies), source.slice(start, end) + "\nreturn {addTransaction, editTransaction, deleteTransaction};")(...Object.values(dependencies));
}
module.exports = { ROOT, ensureEmulator, loadService, loadHandlers, quiet };
