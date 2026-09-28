// 极简 IndexedDB 封装：仅为本机训练数据服务，不引入第三方库
const DB_NAME = "braille-trainer-db";
const DB_VERSION = 1;

export const STORES = {
  brailleSymbol: "brailleSymbol",
  lesson: "lesson",
  practiceSession: "practiceSession",
  answerRecord: "answerRecord"
} as const;

export type StoreName = keyof typeof STORES;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      Object.values(STORES).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb();
  return requestToPromise<T[]>(db.transaction(STORES[store], "readonly").objectStore(STORES[store]).getAll());
}

export async function idbPut<T>(store: StoreName, row: T): Promise<T> {
  const db = await openDb();
  await requestToPromise(db.transaction(STORES[store], "readwrite").objectStore(STORES[store]).put(row));
  return row;
}

export async function idbPutMany<T>(store: StoreName, rows: T[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(STORES[store], "readwrite");
  const objectStore = tx.objectStore(STORES[store]);
  rows.forEach((row) => objectStore.put(row));
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDelete(store: StoreName, id: number): Promise<void> {
  const db = await openDb();
  await requestToPromise(db.transaction(STORES[store], "readwrite").objectStore(STORES[store]).delete(id));
}

export async function idbCount(store: StoreName): Promise<number> {
  const db = await openDb();
  return requestToPromise<number>(db.transaction(STORES[store], "readonly").objectStore(STORES[store]).count());
}
