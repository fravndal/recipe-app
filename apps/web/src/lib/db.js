/**
 * IndexedDB wrapper for offline shopping list support
 */

const DB_NAME = "recipe-app";
const DB_VERSION = 1;

let db = null;

export async function initDB() {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Store for shopping list items (offline cache)
      if (!database.objectStoreNames.contains("shopping_items")) {
        const store = database.createObjectStore("shopping_items", {
          keyPath: "id",
        });
        store.createIndex("listId", "shopping_list_id", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
      }

      // Store for pending operations (to sync when online)
      if (!database.objectStoreNames.contains("pending_ops")) {
        database.createObjectStore("pending_ops", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      // Store for active shopping list metadata
      if (!database.objectStoreNames.contains("active_list")) {
        database.createObjectStore("active_list", { keyPath: "id" });
      }
    };
  });
}

export async function getDB() {
  if (!db) {
    await initDB();
  }
  return db;
}

// Shopping items operations
export async function cacheShoppingItems(listId, items) {
  const database = await getDB();
  const tx = database.transaction("shopping_items", "readwrite");
  const store = tx.objectStore("shopping_items");

  // Clear existing items for this list
  const index = store.index("listId");
  const existingKeys = await new Promise((resolve) => {
    const keys = [];
    const request = index.openKeyCursor(IDBKeyRange.only(listId));
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        keys.push(cursor.primaryKey);
        cursor.continue();
      } else {
        resolve(keys);
      }
    };
  });

  for (const key of existingKeys) {
    store.delete(key);
  }

  // Add new items
  for (const item of items) {
    store.put({ ...item, synced: true });
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedShoppingItems(listId) {
  const database = await getDB();
  const tx = database.transaction("shopping_items", "readonly");
  const store = tx.objectStore("shopping_items");
  const index = store.index("listId");

  return new Promise((resolve, reject) => {
    const request = index.getAll(IDBKeyRange.only(listId));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateCachedItem(item) {
  const database = await getDB();
  const tx = database.transaction("shopping_items", "readwrite");
  const store = tx.objectStore("shopping_items");

  store.put({ ...item, synced: false });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Pending operations (for offline sync)
export async function addPendingOp(operation) {
  const database = await getDB();
  const tx = database.transaction("pending_ops", "readwrite");
  const store = tx.objectStore("pending_ops");

  store.add({
    ...operation,
    timestamp: Date.now(),
  });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingOps() {
  const database = await getDB();
  const tx = database.transaction("pending_ops", "readonly");
  const store = tx.objectStore("pending_ops");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearPendingOps() {
  const database = await getDB();
  const tx = database.transaction("pending_ops", "readwrite");
  const store = tx.objectStore("pending_ops");

  store.clear();

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Active list cache
export async function cacheActiveList(list) {
  const database = await getDB();
  const tx = database.transaction("active_list", "readwrite");
  const store = tx.objectStore("active_list");

  // Clear and set new
  store.clear();
  store.put(list);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedActiveList() {
  const database = await getDB();
  const tx = database.transaction("active_list", "readonly");
  const store = tx.objectStore("active_list");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result[0] || null);
    request.onerror = () => reject(request.error);
  });
}
