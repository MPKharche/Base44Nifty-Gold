/**
 * Local Storage Service using IndexedDB
 * Replaces Base44 API with local browser storage
 */

const DB_NAME = 'MarketDataDB';
const DB_VERSION = 1;
const STORES = {
  MARKET_DATA: 'marketData',
  SIGNALS: 'signals'
};

class LocalStorageService {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create market data store
        if (!db.objectStoreNames.contains(STORES.MARKET_DATA)) {
          const marketStore = db.createObjectStore(STORES.MARKET_DATA, { keyPath: 'id', autoIncrement: true });
          marketStore.createIndex('date', 'date', { unique: false });
          marketStore.createIndex('asset_type', 'asset_type', { unique: false });
          marketStore.createIndex('date_asset', ['date', 'asset_type'], { unique: false });
        }

        // Create signals store
        if (!db.objectStoreNames.contains(STORES.SIGNALS)) {
          const signalStore = db.createObjectStore(STORES.SIGNALS, { keyPath: 'id', autoIncrement: true });
          signalStore.createIndex('date', 'date', { unique: false });
          signalStore.createIndex('asset_type', 'asset_type', { unique: false });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  // Market Data operations
  async createMarketData(data) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.MARKET_DATA, 'readwrite');
    const store = tx.objectStore(STORES.MARKET_DATA);
    
    const record = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(record);
      request.onsuccess = () => resolve({ ...record, id: request.result });
      request.onerror = () => reject(request.error);
    });
  }

  async bulkCreateMarketData(items) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.MARKET_DATA, 'readwrite');
    const store = tx.objectStore(STORES.MARKET_DATA);
    
    const results = [];
    for (const item of items) {
      const record = {
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const request = store.add(record);
      await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          results.push({ ...record, id: request.result });
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }
    
    return results;
  }

  async getMarketData(id) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.MARKET_DATA, 'readonly');
    const store = tx.objectStore(STORES.MARKET_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async filterMarketData(filter = {}, sortBy = '-date', limit = null) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.MARKET_DATA, 'readonly');
    const store = tx.objectStore(STORES.MARKET_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let results = request.result;

        // Apply filters
        if (filter.asset_type) {
          results = results.filter(item => item.asset_type === filter.asset_type);
        }
        if (filter.date) {
          results = results.filter(item => item.date === filter.date);
        }
        if (filter.id) {
          results = results.filter(item => item.id === filter.id);
        }

        // Apply sorting
        if (sortBy) {
          const isDesc = sortBy.startsWith('-');
          const field = isDesc ? sortBy.substring(1) : sortBy;
          
          results.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            // Handle date strings
            if (field === 'date') {
              aVal = new Date(aVal);
              bVal = new Date(bVal);
            }
            
            if (aVal < bVal) return isDesc ? 1 : -1;
            if (aVal > bVal) return isDesc ? -1 : 1;
            return 0;
          });
        }

        // Apply limit
        if (limit && limit > 0) {
          results = results.slice(0, limit);
        }

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMarketData(id) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.MARKET_DATA, 'readwrite');
    const store = tx.objectStore(STORES.MARKET_DATA);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateMarketData(id, data) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.MARKET_DATA, 'readwrite');
    const store = tx.objectStore(STORES.MARKET_DATA);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          reject(new Error('Record not found'));
          return;
        }
        
        const updated = {
          ...existing,
          ...data,
          id,
          updatedAt: new Date().toISOString()
        };
        
        const putRequest = store.put(updated);
        putRequest.onsuccess = () => resolve(updated);
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Signal operations
  async createSignal(data) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.SIGNALS, 'readwrite');
    const store = tx.objectStore(STORES.SIGNALS);
    
    const record = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(record);
      request.onsuccess = () => resolve({ ...record, id: request.result });
      request.onerror = () => reject(request.error);
    });
  }

  async listSignals(sortBy = '-date', limit = null, options = {}) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.SIGNALS, 'readonly');
    const store = tx.objectStore(STORES.SIGNALS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        let results = request.result;

        // Apply sorting
        if (sortBy) {
          const isDesc = sortBy.startsWith('-');
          const field = isDesc ? sortBy.substring(1) : sortBy;
          
          results.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            if (field === 'date') {
              aVal = new Date(aVal);
              bVal = new Date(bVal);
            }
            
            if (aVal < bVal) return isDesc ? 1 : -1;
            if (aVal > bVal) return isDesc ? -1 : 1;
            return 0;
          });
        }

        // Apply limit
        if (limit && limit > 0) {
          results = results.slice(0, limit);
        }

        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSignal(id) {
    const db = await this.ensureDB();
    const tx = db.transaction(STORES.SIGNALS, 'readwrite');
    const store = tx.objectStore(STORES.SIGNALS);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Utility: Clear all data
  async clearAll() {
    const db = await this.ensureDB();
    const tx = db.transaction([STORES.MARKET_DATA, STORES.SIGNALS], 'readwrite');
    
    await Promise.all([
      new Promise((resolve, reject) => {
        const request = tx.objectStore(STORES.MARKET_DATA).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = tx.objectStore(STORES.SIGNALS).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
  }

  // Utility: Get statistics
  async getStats() {
    const db = await this.ensureDB();
    const tx = db.transaction([STORES.MARKET_DATA, STORES.SIGNALS], 'readonly');
    
    const [marketData, signals] = await Promise.all([
      new Promise((resolve, reject) => {
        const request = tx.objectStore(STORES.MARKET_DATA).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = tx.objectStore(STORES.SIGNALS).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
    ]);

    const niftyData = marketData.filter(item => item.asset_type === 'nifty');
    const goldData = marketData.filter(item => item.asset_type === 'gold');

    return {
      totalMarketData: marketData.length,
      niftyRecords: niftyData.length,
      goldRecords: goldData.length,
      totalSignals: signals.length,
      niftyDateRange: niftyData.length > 0 ? {
        start: niftyData.reduce((min, item) => item.date < min ? item.date : min, niftyData[0].date),
        end: niftyData.reduce((max, item) => item.date > max ? item.date : max, niftyData[0].date)
      } : null,
      goldDateRange: goldData.length > 0 ? {
        start: goldData.reduce((min, item) => item.date < min ? item.date : min, goldData[0].date),
        end: goldData.reduce((max, item) => item.date > max ? item.date : max, goldData[0].date)
      } : null
    };
  }
}

// Create singleton instance
const storageService = new LocalStorageService();

// Export MarketData-like API
export const MarketData = {
  create: (data) => storageService.createMarketData(data),
  bulkCreate: (items) => storageService.bulkCreateMarketData(items),
  get: (id) => storageService.getMarketData(id),
  filter: (filter = {}, sortBy = '-date', limit = null, options = {}) => 
    storageService.filterMarketData(filter, sortBy, limit),
  delete: (id) => storageService.deleteMarketData(id),
  update: (id, data) => storageService.updateMarketData(id, data)
};

// Export Signal-like API
export const Signal = {
  create: (data) => storageService.createSignal(data),
  list: (sortBy = '-date', limit = null, options = {}) => 
    storageService.listSignals(sortBy, limit, options),
  delete: (id) => storageService.deleteSignal(id)
};

// Export utility functions
export const clearAllData = () => storageService.clearAll();
export const getStorageStats = () => storageService.getStats();

export default storageService;
