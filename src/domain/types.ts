export type Space = "personal" | "demo";
export type Score = 1 | 2 | 3 | 4 | 5;
export type Emotion =
  "焦虑" | "烦躁" | "低落" | "疲惫" | "平静" | "开心" | "期待" | "满足";
export type EventTag =
  "工作任务" | "人际沟通" | "通勤" | "睡眠" | "运动" | "个人生活";
export type CareKind = "breathing" | "sound" | "movement";
export interface Journal {
  id: string;
  occurredAt: string;
  localDate: string;
  feeling: Score;
  emotions: Emotion[];
  intensity: Score;
  tags: EventTag[];
  text: string;
  createdAt: string;
  updatedAt: string;
}
export interface CareRecord {
  id: string;
  kind: CareKind;
  startedAt: string;
  endedAt?: string;
  endDate?: string;
  status: "running" | "paused" | "completed" | "exited" | "interrupted";
  before?: Score;
  after?: Score;
  journalId?: string;
}
export interface Snapshot {
  journals: Journal[];
  care: CareRecord[];
}
export interface Preferences {
  space?: Space;
  rangeDays: 7 | 30;
  reduceMotion: boolean;
  volume: number;
  demoInitialized?: boolean;
}
