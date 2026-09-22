import type { Snapshot, Journal, CareRecord } from "../domain/types";
import { object, validateJournal, validateCare } from "../domain/validation";
export interface Backup {
  version: 1;
  exportedAt: string;
  journals: Journal[];
  care: CareRecord[];
}
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export function encodeBackup(snapshot: Snapshot, now: Date): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: now.toISOString(),
      journals: snapshot.journals,
      care: snapshot.care,
    },
    null,
    2,
  );
}
export function decodeBackup(text: string, now: Date): Snapshot {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error("备份文件不能超过 10 MB");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("这不是有效的 JSON 备份文件");
  }
  const v = object(parsed);
  if (v.version !== 1) throw new Error("不支持此备份版本");
  if (
    typeof v.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(v.exportedAt))
  )
    throw new Error("导出时间无效");
  if (!Array.isArray(v.journals) || !Array.isArray(v.care))
    throw new Error("备份缺少日记或关怀记录");
  const journals = v.journals.map((j) => validateJournal(j, now)),
    care = v.care.map((c) => validateCare(c, now));
  const ids = new Set(journals.map((j) => j.id));
  if (
    ids.size !== journals.length ||
    new Set(care.map((c) => c.id)).size !== care.length
  )
    throw new Error("备份包含重复记录 ID");
  if (care.some((c) => c.journalId && !ids.has(c.journalId)))
    throw new Error("活动引用了不存在的日记");
  return { journals, care };
}
