/**
 * Serviço de Migração - Corrige inconsistências de chaves de material no Firestore
 *
 * PROBLEMA: A chave "perfil" foi usada em alguns lugares e "perfil natural" em outros
 * SOLUÇÃO: Migrar dados de "perfil" para "perfil natural" no documento de inventário
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const INVENTORY_COLLECTION = "inventory";

/**
 * Migra dados do inventário de chaves antigas para chaves novas
 * Exemplo: "perfil" → "perfil natural"
 */
export const migrateInventoryKeys = async () => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.log("[Migration] Documento de inventário não existe ainda");
      return;
    }

    const currentInventory = docSnap.data();
    let needsUpdate = false;
    const updatedInventory = { ...currentInventory };

    // Mapeamento de chaves antigas para novas
    const keyMappings = {
      perfil: "perfil natural",
      // Adicionar mais mapeamentos conforme necessário
    };

    // Processar cada mapeamento
    for (const [oldKey, newKey] of Object.entries(keyMappings)) {
      if (oldKey in updatedInventory && !(newKey in updatedInventory)) {
        console.log(`[Migration] Migrando "${oldKey}" → "${newKey}"`);
        updatedInventory[newKey] = updatedInventory[oldKey];
        delete updatedInventory[oldKey];
        needsUpdate = true;
      } else if (oldKey in updatedInventory && newKey in updatedInventory) {
        // Se ambas as chaves existem, mesclar os dados (somar quantidades)
        console.log(`[Migration] Mesclando "${oldKey}" e "${newKey}"`);
        const oldQty = updatedInventory[oldKey].quantidade || 0;
        const newQty = updatedInventory[newKey].quantidade || 0;
        updatedInventory[newKey].quantidade = oldQty + newQty;
        delete updatedInventory[oldKey];
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      updatedInventory.updatedAt = new Date();
      await setDoc(docRef, updatedInventory);
      console.log("[Migration] ✅ Inventário migrado com sucesso!");
      return true;
    } else {
      console.log("[Migration] ℹ️ Nenhuma migração necessária");
      return false;
    }
  } catch (error) {
    console.error("[Migration] ❌ Erro ao migrar inventário:", error);
    throw error;
  }
};

/**
 * Valida se todas as chaves de material são consistentes
 * Retorna um relatório de inconsistências
 */
export const validateInventoryKeys = async () => {
  try {
    const docRef = doc(db, INVENTORY_COLLECTION, "current");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { valid: true, issues: [] };
    }

    const inventory = docSnap.data();
    const issues = [];

    // Chaves esperadas (baseado em TransactionForm.jsx)
    const expectedKeys = [
      "ferro",
      "aluminio",
      "cobre",
      "cobre_mel",
      "bronze",
      "magnesio",
      "latinha",
      "panela",
      "bloco2",
      "chapa",
      "perfil natural",
      "perfil pintado",
      "bloco",
      "metal",
      "inox",
      "bateria",
      "motor_gel",
      "roda",
      "papelao",
      "papel_branco",
      "rad_metal",
      "rad_cobre",
      "rad_chapa",
      "tela",
      "antimonio",
      "cabo_ai",
      "tubo_limpo",
    ];

    // Verificar chaves inesperadas
    for (const key of Object.keys(inventory)) {
      if (key !== "updatedAt" && !expectedKeys.includes(key)) {
        issues.push({
          type: "unexpected_key",
          key,
          quantity: inventory[key].quantidade || 0,
          message: `Chave inesperada: "${key}" com ${inventory[key].quantidade || 0}kg`,
        });
      }
    }

    // Verificar chaves antigas problemáticas
    if ("perfil" in inventory) {
      issues.push({
        type: "old_key",
        key: "perfil",
        quantity: inventory.perfil.quantidade || 0,
        message: `Chave antiga "perfil" encontrada com ${inventory.perfil.quantidade || 0}kg. Deve ser migrada para "perfil natural"`,
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      totalKeys: Object.keys(inventory).length,
      expectedKeys: expectedKeys.length,
    };
  } catch (error) {
    console.error("[Validation] ❌ Erro ao validar inventário:", error);
    throw error;
  }
};
