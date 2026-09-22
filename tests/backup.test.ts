import { test, expect } from "vitest";
import { encodeBackup, decodeBackup } from "../src/storage/backup";
import { journal, care } from "./fixtures";
const now = new Date("2026-09-22T12:00:00Z");
const snapshot = { journals: [journal()], care: [care({ journalId: "j1" })] };
const backup = { version: 1, exportedAt: now.toISOString(), ...snapshot };
test("valid backup round-trips personal diary and feedback", () => {
  expect(decodeBackup(encodeBackup(snapshot, now), now)).toEqual(snapshot);
});
test("rejects unknown version, duplicate IDs, orphan references and invalid records", () => {
  for (const change of [
    { version: 2 },
    { journals: [journal(), journal()] },
    { care: [care({ journalId: "missing" })] },
    { journals: [journal({ feeling: 6 as never })] },
    { journals: [journal({ text: "字".repeat(5001) })] },
    { care: [care({ status: "interrupted", after: 4 })] },
    { care: [care({ endedAt: "2026-09-19T00:00:00Z" })] },
  ])
    expect(() =>
      decodeBackup(JSON.stringify({ ...backup, ...change }), now),
    ).toThrow();
  expect(decodeBackup(JSON.stringify(backup), now).journals).toHaveLength(1);
});
test("enforces byte limit before parsing and rejects malformed timestamps", () => {
  expect(() => decodeBackup(" ".repeat(10 * 1024 * 1024 + 1), now)).toThrow();
  expect(() =>
    decodeBackup(JSON.stringify({ ...backup, exportedAt: "not-a-date" }), now),
  ).toThrow();
  expect(() => decodeBackup("{", now)).toThrow();
});
