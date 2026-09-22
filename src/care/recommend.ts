import type { Emotion, CareKind } from "../domain/types";
export function recommend(
  emotions: Emotion[],
): { kind: CareKind; reason: string } | null {
  if (!emotions.length) return null;
  if (emotions.includes("焦虑") || emotions.includes("烦躁"))
    return {
      kind: "breathing",
      reason: "你记录了焦虑或烦躁。可以先停下来，跟着舒适的节奏呼吸。",
    };
  if (emotions.includes("疲惫"))
    return {
      kind: "movement",
      reason: "你记录了疲惫。可以试试短暂离屏，让身体换一个状态。",
    };
  return {
    kind: "sound",
    reason: `你选择了${emotions.join("、")}。如果愿意，可以留一小段安静的时间给自己。`,
  };
}
