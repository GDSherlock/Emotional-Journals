import type {
  Space,
  Snapshot,
  Journal,
  CareRecord,
  Preferences,
} from "../domain/types";
import { openDatabase, result, complete } from "./database";
export interface Repository {
  read(space: Space): Promise<Snapshot>;
  saveJournal(space: Space, entry: Journal): Promise<void>;
  deleteJournal(space: Space, id: string): Promise<void>;
  saveCare(space: Space, entry: CareRecord, create?: boolean): Promise<void>;
  deleteCare(space: Space, id: string): Promise<void>;
  replace(space: Space, snapshot: Snapshot): Promise<void>;
  readPreferences(): Promise<Preferences>;
  savePreferences(value: Preferences): Promise<void>;
  close(): void;
}
const range = (space: Space) =>
  IDBKeyRange.bound([space, ""], [space, "\uffff"]);
export async function openRepository(base: string): Promise<Repository> {
  const db = await openDatabase(base);
  async function write(stores: string[], action: (tx: IDBTransaction) => void) {
    const tx = db.transaction(stores, "readwrite");
    const done = complete(tx);
    try {
      action(tx);
    } catch (error) {
      tx.abort();
      await done.catch(() => {});
      throw error;
    }
    await done;
  }
  return {
    async read(space) {
      const tx = db.transaction(["journals", "care"], "readonly");
      const done = complete(tx);
      const [journals, care] = await Promise.all([
        result(tx.objectStore("journals").getAll(range(space))),
        result(tx.objectStore("care").getAll(range(space))),
      ]);
      await done;
      return {
        journals: journals.map((x) => x.data),
        care: care.map((x) => x.data),
      };
    },
    saveJournal: (space, data) =>
      write(["journals"], (tx) => {
        tx.objectStore("journals").put({ space, id: data.id, data });
      }),
    saveCare: (space, data, create = false) =>
      write(["care"], (tx) => {
        const store = tx.objectStore("care");
        if (create) {
          store.add({ space, id: data.id, data });
          return;
        }
        const request = store.get([space, data.id]);
        request.onsuccess = () => {
          if (!request.result) {
            tx.abort();
            return;
          }
          store.put({ space, id: data.id, data });
        };
      }),
    deleteCare: (space, id) =>
      write(["care"], (tx) => {
        tx.objectStore("care").delete([space, id]);
      }),
    deleteJournal: (space, id) =>
      write(["journals", "care"], (tx) => {
        tx.objectStore("journals").delete([space, id]);
        const cursor = tx.objectStore("care").openCursor(range(space));
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (!c) return;
          if (c.value.data.journalId === id) {
            const data = { ...c.value.data };
            delete data.journalId;
            c.update({ ...c.value, data });
          }
          c.continue();
        };
      }),
    replace: (space, snapshot) =>
      write(["journals", "care"], (tx) => {
        for (const name of ["journals", "care"] as const) {
          const store = tx.objectStore(name);
          store.delete(range(space));
          for (const data of snapshot[name])
            store.add({ space, id: data.id, data });
        }
      }),
    async readPreferences() {
      const value = await result(
        db
          .transaction("preferences")
          .objectStore("preferences")
          .get("settings"),
      );
      return (
        value ?? {
          rangeDays: 7,
          reduceMotion:
            globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
              .matches ?? false,
          volume: 0.4,
        }
      );
    },
    savePreferences: (value) =>
      write(["preferences"], (tx) => {
        tx.objectStore("preferences").put(value, "settings");
      }),
    close: () => db.close(),
  };
}
