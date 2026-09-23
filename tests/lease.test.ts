import { test, expect } from "vitest";
import { acquireWorkspaceLease } from "../src/app/lease";
// Fake browser boundary: holding the callback Promise owns the lock.
function lockManager() {
  const held = new Set<string>();
  return {
    async request(
      name: string,
      _options: LockOptions,
      callback: (lock: Lock | null) => Promise<unknown>,
    ) {
      if (held.has(name)) return callback(null);
      held.add(name);
      try {
        return await callback({ name, mode: "exclusive" } as Lock);
      } finally {
        held.delete(name);
      }
    },
  } as unknown as Pick<LockManager, "request">;
}
test("a second workspace cannot acquire live write ownership; releasing permits retry", async () => {
  const locks = lockManager(),
    release = await acquireWorkspaceLease(locks, "/a/");
  await expect(acquireWorkspaceLease(locks, "/a/")).rejects.toThrow();
  const otherRelease = await acquireWorkspaceLease(locks, "/b/");
  otherRelease();
  release();
  await new Promise((r) => setTimeout(r, 0));
  const acquired = await acquireWorkspaceLease(locks, "/a/");
  acquired();
});
test("unsupported lock API reports a clear error instead of unprotected writes", async () => {
  await expect(acquireWorkspaceLease(undefined, "/a/")).rejects.toThrow();
});
