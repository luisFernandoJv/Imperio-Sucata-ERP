/**
 * cleanupInventory.js
 *
 * EXECUTE UMA VEZ para limpar todas as chaves corrompidas do Firestore.
 * Chaves corrompidas são do tipo "ferro.quantidade", "cobre.quantidade", etc.
 * criadas acidentalmente por dot-notation em updateDoc.
 *
 * Como usar:
 *   Importe e chame cleanupCorruptedInventoryKeys() em um botão de admin,
 *   ou rode diretamente no console do browser uma vez.
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const INVENTORY_COLLECTION = "inventory";

/**
 * Remove todas as chaves corrompidas (com ponto) do documento inventory/current
 * e garante que as chaves válidas estejam com valores numéricos corretos.
 *
 * Retorna um relatório do que foi feito.
 */
export const cleanupCorruptedInventoryKeys = async () => {
  const docRef = doc(db, INVENTORY_COLLECTION, "current");
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    console.warn("[Cleanup] Documento inventory/current não existe.");
    return { cleaned: false, removed: [], kept: [] };
  }

  const rawData = docSnap.data();
  const allKeys = Object.keys(rawData);

  const corruptedKeys = allKeys.filter(
    (k) => k !== "updatedAt" && k.includes("."),
  );
  const validKeys = allKeys.filter(
    (k) => k !== "updatedAt" && !k.includes("."),
  );

  console.log(`[Cleanup] Total de chaves: ${allKeys.length}`);
  console.log(
    `[Cleanup] Chaves corrompidas encontradas: ${corruptedKeys.length}`,
  );
  console.log("[Cleanup] Chaves corrompidas:", corruptedKeys);
  console.log("[Cleanup] Chaves válidas:", validKeys);

  if (corruptedKeys.length === 0) {
    console.log(
      "[Cleanup] ✅ Nenhuma chave corrompida encontrada. Nada a fazer.",
    );
    return { cleaned: false, removed: [], kept: validKeys };
  }

  // Montar objeto limpo apenas com chaves válidas
  const cleanInventory = {};

  // Migrar "perfil" → "perfil natural" se necessário
  const keyMappings = {
    perfil: "perfil natural",
  };

  for (const key of validKeys) {
    const mappedKey = keyMappings[key] || key;

    if (typeof rawData[key] === "object" && rawData[key] !== null) {
      if (cleanInventory[mappedKey]) {
        // Mesclar se já existe (caso "perfil" e "perfil natural" coexistam)
        cleanInventory[mappedKey].quantidade =
          (cleanInventory[mappedKey].quantidade || 0) +
          (Number(rawData[key].quantidade) || 0);
      } else {
        cleanInventory[mappedKey] = {
          quantidade: Number(rawData[key].quantidade) || 0,
          precoCompra: Number(rawData[key].precoCompra) || 0,
          precoVenda: Number(rawData[key].precoVenda) || 0,
        };
      }
    }
  }

  cleanInventory.updatedAt = new Date();

  // Salvar documento limpo (isso sobrescreve TODO o documento, removendo as chaves corrompidas)
  await setDoc(docRef, cleanInventory);

  console.log(`[Cleanup] ✅ Limpeza concluída!`);
  console.log(`[Cleanup] Removidas ${corruptedKeys.length} chaves corrompidas`);
  console.log(
    `[Cleanup] Mantidas ${Object.keys(cleanInventory).length - 1} chaves válidas`,
  );

  return {
    cleaned: true,
    removed: corruptedKeys,
    kept: Object.keys(cleanInventory).filter((k) => k !== "updatedAt"),
  };
};

/**
 * Versão para usar no console do browser sem import.
 * Cole isso no console do Chrome DevTools com o app aberto:
 *
 * (Requer que firebase/firestore e db já estejam disponíveis globalmente)
 */
export const runCleanupFromConsole = () => {
  console.log(
    "[Cleanup] Use cleanupCorruptedInventoryKeys() importando este módulo.",
  );
  console.log(
    "[Cleanup] Ou adicione um botão temporário na UI que chame esta função.",
  );
};
