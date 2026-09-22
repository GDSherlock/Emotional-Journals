import { test, expect } from "vitest";
import { recommend } from "../src/care/recommend";
import { transition, type Session } from "../src/care/session";
import { care } from "./fixtures";
const initial: Session = {
  record: care({
    status: "running",
    after: undefined,
    endedAt: undefined,
    endDate: undefined,
  }),
  durationMs: 60000,
  elapsedMs: 0,
  lastTick: 0,
};
test("recommendation handles priority and absence of current emotions", () => {
  expect(recommend(["疲惫", "焦虑"])?.kind).toBe("breathing");
  expect(recommend(["疲惫"])?.kind).toBe("movement");
  expect(recommend(["平静"])?.kind).toBe("sound");
  expect(recommend([])).toBeNull();
});
test("paused time does not inflate active duration and resume resets baseline", () => {
  const paused = transition(initial, { type: "pause", now: 1000 });
  expect(transition(paused, { type: "tick", now: 60000 }).elapsedMs).toBe(1000);
  const resumed = transition(paused, { type: "resume", now: 90000 });
  expect(transition(resumed, { type: "tick", now: 91000 }).elapsedMs).toBe(
    2000,
  );
});
test("interruption and exit cannot become completed", () => {
  for (const type of ["interrupt", "exit"] as const) {
    const ended = transition(initial, { type, now: 1000 });
    expect(ended.record.status).toBe(
      type === "exit" ? "exited" : "interrupted",
    );
    expect(transition(ended, { type: "finish", now: 2000 })).toEqual(ended);
  }
});
test("completion is idempotent and declines can be recorded", () => {
  const done = transition(initial, { type: "finish", now: 60000 });
  expect(done.record.status).toBe("completed");
  expect(transition(done, { type: "finish", now: 70000 })).toEqual(done);
  expect(
    transition(done, { type: "feedback", score: 1, now: 70000 }).record.after,
  ).toBe(1);
});
