import type { Journal, CareRecord } from "../src/domain/types";
export const journal = (value: Partial<Journal> = {}): Journal => ({
  id: "j1",
  occurredAt: "2026-09-20T10:00:00Z",
  localDate: "2026-09-20",
  feeling: 3,
  emotions: ["疲惫"],
  intensity: 3,
  tags: [],
  text: "今天有点累",
  createdAt: "2026-09-20T10:00:00Z",
  updatedAt: "2026-09-20T10:00:00Z",
  ...value,
});
export const care = (value: Partial<CareRecord> = {}): CareRecord => ({
  id: "c1",
  kind: "breathing",
  startedAt: "2026-09-20T10:00:00Z",
  endedAt: "2026-09-20T10:01:00Z",
  endDate: "2026-09-20",
  status: "completed",
  before: 3,
  after: 4,
  ...value,
});
