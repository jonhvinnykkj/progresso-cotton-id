import type { Bale } from "@shared/schema";

const DB_NAME = "BaleTrackerOfflineDB";
const DB_VERSION = 1;
const STORE_NAME = "bales";

class OfflineStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          objectStore.createIndex("status", "status", { unique: false });
          objectStore.createIndex("talhao", "talhao", { unique: false });
        }
      };
    });
  }

  async saveBales(bales: Bale[]): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing data
      store.clear();

      // Add all bales
      bales.forEach((bale) => {
        store.add({
          ...bale,
          _cachedAt: new Date().toISOString(),
        });
      });

      transaction.oncomplete = () => {
        console.log(`💾 ${bales.length} fardos salvos no cache offline`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllBales(): Promise<Bale[]> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const bales = request.result as Bale[];
        console.log(`📦 ${bales.length} fardos carregados do cache offline`);
        resolve(bales);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getBaleById(id: string): Promise<Bale | null> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async updateBaleStatus(id: string, status: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const bale = getRequest.result;
        if (bale) {
          bale.status = status;
          bale._updatedOfflineAt = new Date().toISOString();
          const updateRequest = store.put(bale);
          
          updateRequest.onsuccess = () => {
            console.log(`✅ Status do fardo ${id} atualizado no cache offline para: ${status}`);
            resolve();
          };
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error(`Bale ${id} not found in offline storage`));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getPendingUpdates(): Promise<Array<{ id: string; status: string; updatedAt: string }>> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const bales = request.result as any[];
        const pending = bales
          .filter((bale) => bale._updatedOfflineAt)
          .map((bale) => ({
            id: bale.id,
            status: bale.status,
            updatedAt: bale._updatedOfflineAt,
          }));
        resolve(pending);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingUpdate(id: string): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const bale = getRequest.result;
        if (bale && bale._updatedOfflineAt) {
          delete bale._updatedOfflineAt;
          const updateRequest = store.put(bale);
          
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("🗑️ Cache offline limpo");
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
