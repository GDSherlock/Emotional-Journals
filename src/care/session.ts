import type { CareRecord, Score } from "../domain/types";
import { localDateOf } from "../domain/dates";
export interface Session {
  record: CareRecord;
  durationMs: number;
  elapsedMs: number;
  lastTick: number;
}
export type SessionEvent =
  | {
      type: "tick" | "pause" | "resume" | "finish" | "exit" | "interrupt";
      now: number;
    }
  | { type: "feedback"; score: Score; now: number };
export function transition(session: Session, event: SessionEvent): Session {
  const state = session.record.status;
  if (event.type === "feedback")
    return state === "completed"
      ? { ...session, record: { ...session.record, after: event.score } }
      : session;
  if (!["running", "paused"].includes(state)) return session;
  const elapsedMs = Math.min(
    session.durationMs,
    session.elapsedMs +
      (state === "running" ? Math.max(0, event.now - session.lastTick) : 0),
  );
  const next = {
    ...session,
    elapsedMs,
    lastTick: event.now,
    record: { ...session.record },
  };
  if (event.type === "pause") next.record.status = "paused";
  if (event.type === "resume") next.record.status = "running";
  if (
    event.type === "finish" ||
    event.type === "exit" ||
    event.type === "interrupt" ||
    (event.type === "tick" && elapsedMs >= session.durationMs)
  ) {
    next.record.status =
      event.type === "exit"
        ? "exited"
        : event.type === "interrupt"
          ? "interrupted"
          : "completed";
    next.record.endedAt = new Date(event.now).toISOString();
    next.record.endDate = localDateOf(new Date(event.now));
  }
  return next;
}
