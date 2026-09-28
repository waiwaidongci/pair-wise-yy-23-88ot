import { ServiceError } from "../utils/errors";

/**
 * IndexedDB 底层封装：仅负责库/表/事务与种子播种，
 * 不感知任何业务实体字段；业务层请使用 api/*.ts。
 */
const DB_NAME = "braille-trainer";
const DB_VERSION = 1;
export const STORES = {
  brailleSymbol: "brailleSymbol",
  lesson: "lesson",
  practiceSession: "practiceSession",
  answerRecord: "answerRecord"
} as const;

export type StoreName = keyof typeof STORES;

let dbPromise: Promise<IDBDatabase> | null = null;

export function isStorageAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  if (!isStorageAvailable()) {
    return Promise.reject(new ServiceError("STORAGE_UNAVAILABLE"));
  }
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      Object.values(STORES).forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          // autoIncrement：答题记录等可由库生成 id；显式传入的种子 id 同样允许。
          db.createObjectStore(name, { keyPath: "id", autoIncrement: true });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new ServiceError("STORAGE_UNAVAILABLE", request.error));
  });
  return dbPromise;
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, run: (objectStore: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORES[store], mode);
        const request = run(transaction.objectStore(STORES[store]));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
  );
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  return tx<T[]>(store, "readonly", (objectStore) => objectStore.getAll() as IDBRequest<T[]>);
}

export async function getById<T>(store: StoreName, id: number): Promise<T | undefined> {
  return tx<T>(store, "readonly", (objectStore) => objectStore.get(id) as IDBRequest<T>);
}

/** 构造器用 id:0 表示"尚未分配"，写入前剥离以便 IndexedDB 自增，避免多行都落在键 0 上互相覆盖。 */
function stripSentinelId<T extends object>(row: T): Record<string, unknown> {
  const candidate = row as { id?: unknown };
  if (typeof candidate.id === "number" && candidate.id > 0) return row as Record<string, unknown>;
  return Object.fromEntries(Object.entries(row).filter(([key]) => key !== "id"));
}

/** 新增（无 id 或 id 为 0 时自增）或按既有 id 覆盖写入，返回最终记录。 */
export async function put<T extends object>(store: StoreName, row: T): Promise<T & { id: number }> {
  const existingId = (row as { id?: unknown }).id;
  if (typeof existingId !== "number" || existingId <= 0) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES[store], "readwrite");
      const request = transaction.objectStore(STORES[store]).put(stripSentinelId(row));
      request.onsuccess = () => resolve({ ...(row as object), id: Number(request.result) } as T & { id: number });
      request.onerror = () => reject(request.error);
    });
  }
  await tx(store, "readwrite", (objectStore) => objectStore.put(row));
  return row as T & { id: number };
}

/** 批量写入；无 id 的行由库自增生成，返回带最终 id 的行（顺序与入参一致）。 */
export async function bulkPut<T extends object>(store: StoreName, rows: T[]): Promise<Array<T & { id: number }>> {
  const db = await openDatabase();
  return new Promise<Array<T & { id: number }>>((resolve, reject) => {
    const transaction = db.transaction(STORES[store], "readwrite");
    const objectStore = transaction.objectStore(STORES[store]);
    const saved: Array<T & { id: number }> = new Array(rows.length);
    rows.forEach((row, index) => {
      const request = objectStore.put(stripSentinelId(row));
      request.onsuccess = () => {
        saved[index] = { ...(row as object), id: Number(request.result) } as T & { id: number };
      };
    });
    transaction.oncomplete = () => resolve(saved);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function remove(store: StoreName, id: number): Promise<void> {
  await tx(store, "readwrite", (objectStore) => objectStore.delete(id));
}

export async function count(store: StoreName): Promise<number> {
  return tx<number>(store, "readonly", (objectStore) => objectStore.count());
}

export async function nextId(store: StoreName): Promise<number> {
  const db = await openDatabase();
  return new Promise<number>((resolve, reject) => {
    const transaction = db.transaction(STORES[store], "readonly");
    const request = transaction.objectStore(STORES[store]).openCursor(null, "prev");
    request.onsuccess = () => {
      const cursor = request.result;
      resolve(cursor ? Number(cursor.key) + 1 : 1);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function clearAll(): Promise<void> {
  await Promise.all(
    (Object.keys(STORES) as StoreName[]).map((store) => tx(store, "readwrite", (objectStore) => objectStore.clear()))
  );
}
