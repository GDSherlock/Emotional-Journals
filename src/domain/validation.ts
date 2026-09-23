import type { Journal, CareRecord, Score } from "./types";
import { emotions, tags } from "./catalog";
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("数据格式不正确");
  return value as Record<string, unknown>;
}
function text(value: unknown, name: string, max = 200): string {
  if (
    typeof value !== "string" ||
    Array.from(value).length > max ||
    (max !== 5000 && !value.trim())
  )
    throw new Error(`${name}格式不正确`);
  return value;
}
function timestamp(value: unknown, now: Date): string {
  const s = text(value, "时间");
  if (
    !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(s) ||
    !Number.isFinite(Date.parse(s)) ||
    Date.parse(s) > now.getTime()
  )
    throw new Error("时间无效或晚于现在");
  day(s.slice(0, 10));
  return s;
}
function day(value: unknown): string {
  const s = text(value, "日期");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(s) ||
    !Number.isFinite(Date.parse(s)) ||
    new Date(s).toISOString().slice(0, 10) !== s
  )
    throw new Error("日期无效");
  return s;
}
function score(value: unknown): Score {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 5
  )
    throw new Error("请选择 1–5 级评分");
  return value as Score;
}
function choices<T extends string>(
  value: unknown,
  options: T[],
  required = false,
): T[] {
  if (
    !Array.isArray(value) ||
    (required && !value.length) ||
    new Set(value).size !== value.length ||
    value.some((x) => !options.includes(x))
  )
    throw new Error("情绪或事件选项无效");
  return [...value] as T[];
}
function id(value: unknown): string {
  const valueText = text(value, "ID");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(valueText))
    throw new Error("记录 ID 无效");
  return valueText;
}
function checkDatePair(date: string, instant: string) {
  // UTC-12 through UTC+14: saved local midnight remains within 36h of the instant.
  if (Math.abs(Date.parse(date) - Date.parse(instant)) > 36 * 60 * 60 * 1000)
    throw new Error("日期与记录时间不一致");
}
export function validateJournal(value: unknown, now: Date): Journal {
  const v = object(value);
  const result: Journal = {
    id: id(v.id),
    occurredAt: timestamp(v.occurredAt, now),
    localDate: day(v.localDate),
    feeling: score(v.feeling),
    emotions: choices(v.emotions, emotions, true),
    intensity: score(v.intensity),
    tags: choices(v.tags, tags),
    text: text(v.text, "日记", 5000),
    createdAt: timestamp(v.createdAt, now),
    updatedAt: timestamp(v.updatedAt, now),
  };
  checkDatePair(result.localDate, result.occurredAt);
  return result;
}
export function validateCare(value: unknown, now: Date): CareRecord {
  const v = object(value);
  const kind = v.kind,
    status = v.status;
  if (
    !["breathing", "sound", "movement"].includes(String(kind)) ||
    !["running", "paused", "completed", "exited", "interrupted"].includes(
      String(status),
    )
  )
    throw new Error("活动类型或状态无效");
  const result: CareRecord = {
    id: id(v.id),
    kind: kind as CareRecord["kind"],
    status: status as CareRecord["status"],
    startedAt: timestamp(v.startedAt, now),
  };
  if (v.endedAt !== undefined) result.endedAt = timestamp(v.endedAt, now);
  if (v.endDate !== undefined) result.endDate = day(v.endDate);
  if (v.before !== undefined) result.before = score(v.before);
  if (v.after !== undefined) result.after = score(v.after);
  if (v.journalId !== undefined) result.journalId = id(v.journalId);
  if (status === "completed" && (!result.endedAt || !result.endDate))
    throw new Error("完成的活动缺少结束时间");
  if (
    result.endedAt &&
    Date.parse(result.endedAt) < Date.parse(result.startedAt)
  )
    throw new Error("结束时间早于开始时间");
  if (status !== "completed" && result.after !== undefined)
    throw new Error("未完成活动不能有结束评分");
  if (result.endDate && result.endedAt)
    checkDatePair(result.endDate, result.endedAt);
  return result;
}
