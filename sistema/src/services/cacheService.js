/**
 * Cache Service para otimizar leituras do Firebase
 * Implementa cache em memória e persistência no LocalStorage
 */

const CACHE_KEYS = {
  TRANSACTIONS: "cache_transactions",
  CUSTOMERS: "cache_customers",
  INVENTORY: "cache_inventory",
  LIVE_SUMMARY: "cache_live_summary",
  LAST_FETCH: "cache_last_fetch_",
};

const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos

export const cacheService = {
  set: (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      // Também mantém em memória se necessário (opcional)
    } catch (e) {
      console.error("Erro ao salvar no cache:", e);
    }
  },

  get: (key) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRATION;

      if (isExpired) {
        return null;
      }

      return data;
    } catch (e) {
      return null;
    }
  },

  invalidate: (key) => {
    localStorage.removeItem(key);
  },

  invalidateAll: () => {
    Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
  },
};

export { CACHE_KEYS };
