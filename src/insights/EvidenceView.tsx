import type { Snapshot } from "../domain/types";
import { feelings, careNames } from "../domain/catalog";
export function EvidenceView({
  ids,
  snapshot,
  kind = "journal",
}: {
  ids: string[];
  snapshot: Snapshot;
  kind?: "journal" | "care";
}) {
  return (
    <ul className="evidence">
      {ids.map((id) => {
        const j = snapshot.journals.find((x) => x.id === id),
          c = snapshot.care.find((x) => x.id === id);
        return (
          <li key={id}>
            <a href={`#/review/${kind}/${id}`}>
              {kind === "journal" && j ? (
                <>
                  <span>
                    {j.localDate} · {feelings[j.feeling - 1]}
                  </span>
                  <p>{j.text || j.emotions.join("、")}</p>
                </>
              ) : c ? (
                <>
                  <span>
                    {c.endDate} · {careNames[c.kind]}
                  </span>
                  <p>
                    {c.before && c.after
                      ? `${feelings[c.before - 1]} → ${feelings[c.after - 1]}`
                      : "未填写完整评分"}
                  </p>
                </>
              ) : (
                id
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
