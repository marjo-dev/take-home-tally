// IndexedDB storage operations

import { promisifyRequest, deepClone } from "./utils.js";

// Storage Keys
const LS_SETTINGS = "it_settings_v2";
const LS_ENTRIES = "it_entries_v2";

// IndexedDB
const DB_NAME = "incomeTrackerDB";
const DB_VERSION = 1;
const STORE_SETTINGS = "settings";
const STORE_ENTRIES = "entries";
const SETTINGS_KEY = "current";

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
          db.createObjectStore(STORE_ENTRIES, { keyPath: "id" });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
        };
        resolve(db);
      };
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

async function migrateLocalStorageIfNeeded(db) {
  const hasLegacySettings = localStorage.getItem(LS_SETTINGS);
  const hasLegacyEntries = localStorage.getItem(LS_ENTRIES);

  if (!hasLegacySettings && !hasLegacyEntries) return;

  const tx = db.transaction([STORE_SETTINGS, STORE_ENTRIES], "readwrite");
  const settingsStore = tx.objectStore(STORE_SETTINGS);
  const entriesStore = tx.objectStore(STORE_ENTRIES);

  const existingSettings = await promisifyRequest(settingsStore.get(SETTINGS_KEY));
  const entryCount = await promisifyRequest(entriesStore.count());

  if (!existingSettings && hasLegacySettings) {
    try {
      const parsed = JSON.parse(hasLegacySettings);
      if (parsed && typeof parsed === "object") {
        await promisifyRequest(settingsStore.put({ id: SETTINGS_KEY, value: parsed }));
      }
    } catch (err) {
      console.error("Failed to migrate legacy settings", err);
    }
  }

  if (!entryCount && hasLegacyEntries) {
    try {
      const parsedEntries = JSON.parse(hasLegacyEntries);
      if (Array.isArray(parsedEntries)) {
        for (const entry of parsedEntries) {
          if (entry && entry.id) {
            await promisifyRequest(entriesStore.put(entry));
          }
        }
      }
    } catch (err) {
      console.error("Failed to migrate legacy entries", err);
    }
  }

  tx.commit?.();

  localStorage.removeItem(LS_SETTINGS);
  localStorage.removeItem(LS_ENTRIES);
}

async function backfillSettingsSnapshots(entries, currentSettings) {
  // Backfill existing entries with settings snapshots if they don't have them
  const db = await getDb();
  const tx = db.transaction(STORE_ENTRIES, "readwrite");
  const store = tx.objectStore(STORE_ENTRIES);
  
  let updated = false;
  for (const entry of entries) {
    if (!entry.settingsSnapshot) {
      entry.settingsSnapshot = {
        roleRate: currentSettings.roles[entry.role] || 0,
        k401Rate: currentSettings.k401Rate || 0,
        roth401kRate: currentSettings.roth401kRate || 0,
        employerMatch: currentSettings.employerMatch || 0,
        taxRate: currentSettings.taxRate || 20
      };
      await promisifyRequest(store.put(entry));
      updated = true;
    }
  }
  
  tx.commit?.();
  return updated;
}

export async function initStorage() {
  const db = await getDb();
  await migrateLocalStorageIfNeeded(db);
  return db;
}

export async function loadSettings() {
  const db = await getDb();
  const tx = db.transaction(STORE_SETTINGS, "readonly");
  const store = tx.objectStore(STORE_SETTINGS);
  const record = await promisifyRequest(store.get(SETTINGS_KEY));
  tx.commit?.();
  return record ? record.value : null;
}

export async function saveSettings(settings) {
  const db = await getDb();
  const tx = db.transaction(STORE_SETTINGS, "readwrite");
  const store = tx.objectStore(STORE_SETTINGS);
  await promisifyRequest(store.put({ id: SETTINGS_KEY, value: settings }));
  tx.commit?.();
}

export async function loadEntries() {
  const db = await getDb();
  const tx = db.transaction(STORE_ENTRIES, "readonly");
  const store = tx.objectStore(STORE_ENTRIES);
  const all = await promisifyRequest(store.getAll());
  tx.commit?.();
  return all || [];
}

export async function saveEntries(entries) {
  const db = await getDb();
  const tx = db.transaction(STORE_ENTRIES, "readwrite");
  const store = tx.objectStore(STORE_ENTRIES);
  await promisifyRequest(store.clear());
  for (const entry of entries) {
    await promisifyRequest(store.put(entry));
  }
  tx.commit?.();
}

export async function clearAllData() {
  const existing = await getDb();
  existing.close();
  dbPromise = undefined;
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = req.onblocked = () => resolve();
    req.onerror = () => reject(req.error);
  });
  await initStorage();
}

export async function snapshotSettings() {
  const db = await getDb();
  const tx = db.transaction(STORE_SETTINGS, "readonly");
  const store = tx.objectStore(STORE_SETTINGS);
  const record = await promisifyRequest(store.get(SETTINGS_KEY));
  tx.commit?.();
  return record ? deepClone(record.value) : null;
}

export async function snapshotEntries() {
  const db = await getDb();
  const tx = db.transaction(STORE_ENTRIES, "readonly");
  const store = tx.objectStore(STORE_ENTRIES);
  const all = await promisifyRequest(store.getAll());
  tx.commit?.();
  return all ? all.map(entry => ({ ...entry })) : [];
}

export { backfillSettingsSnapshots };

