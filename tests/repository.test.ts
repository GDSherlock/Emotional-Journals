import { test, expect } from "vitest";
import { openRepository } from "../src/storage/repository";
import { journal, care } from "./fixtures";
test("workspaces persist independently across reopen and reset", async () => {
  const base = "/" + crypto.randomUUID();
  const repo = await openRepository(base);
  await repo.saveJournal("personal", journal());
  await repo.saveJournal("demo", journal({ feeling: 1 }));
  await repo.replace("demo", { journals: [], care: [] });
  repo.close();
  const reopened = await openRepository(base);
  expect((await reopened.read("personal")).journals[0].feeling).toBe(3);
  expect((await reopened.read("demo")).journals).toHaveLength(0);
  expect(
    (await (await openRepository(base + "other")).read("personal")).journals,
  ).toHaveLength(0);
});
test("deleting a journal clears its care link but preserves feedback", async () => {
  const repo = await openRepository("/" + crypto.randomUUID());
  await repo.saveJournal("personal", journal());
  await repo.saveCare("personal", care({ journalId: "j1" }), true);
  await repo.deleteJournal("personal", "j1");
  const saved = await repo.read("personal");
  expect(saved.journals).toHaveLength(0);
  expect(saved.care[0].journalId).toBeUndefined();
  expect(saved.care[0].after).toBe(4);
});
test("failed replacement preserves original snapshot atomically", async () => {
  const repo = await openRepository("/" + crypto.randomUUID());
  await repo.saveJournal("personal", journal());
  // Structured cloning rejects functions after the transaction has begun.
  await expect(
    repo.replace("personal", {
      journals: [{ ...journal(), text: (() => {}) as unknown as string }],
      care: [],
    }),
  ).rejects.toThrow();
  expect((await repo.read("personal")).journals[0].text).toBe("今天有点累");
});
test("an obsolete care session cannot recreate records after clear", async () => {
  const repo = await openRepository("/" + crypto.randomUUID());
  await repo.replace("personal", { journals: [], care: [care()] });
  await repo.replace("personal", { journals: [], care: [] });
  await expect(repo.saveCare("personal", care({ after: 1 }))).rejects.toThrow();
  expect((await repo.read("personal")).care).toEqual([]);
});
