import { useState } from "react";
import { Plus, ArrowLeft, Pencil, Trash2, Activity } from "lucide-react";
import type { PageProps } from "./JournalPage";
import { PageHeading, EmptyState, StatusMessage } from "../ui/StatusMessage";
import { MoodFace } from "../ui/RatingInput";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { JournalForm } from "./JournalForm";
import { feelings, emotions, tags, careNames } from "../domain/catalog";
import { navigate } from "../app/router";
export function ReviewPage({
  repo,
  space,
  snapshot,
  refresh,
  route,
}: PageProps & { route: string }) {
  const [emotion, setEmotion] = useState(""),
    [tag, setTag] = useState(""),
    [editing, setEditing] = useState(false),
    [deleting, setDeleting] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const parts = route.split("/"),
    detail = parts.length === 4,
    isJournal = parts[2] === "journal",
    id = parts[3];
  const entry = isJournal
      ? snapshot.journals.find((j) => j.id === id)
      : undefined,
    activity = !isJournal ? snapshot.care.find((c) => c.id === id) : undefined;
  async function remove() {
    setBusy(true);
    try {
      if (isJournal) await repo.deleteJournal(space, id);
      else await repo.deleteCare(space, id);
      await refresh();
      setDeleting(false);
      navigate("/review");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  if (detail)
    return (
      <>
        <a className="back" href="#/review">
          <ArrowLeft size={16} /> 返回回顾
        </a>
        {entry || activity ? (
          <>
            <PageHeading
              title={entry ? "那一天的自己" : careNames[activity!.kind]}
              description={
                entry?.localDate ??
                activity!.endDate ??
                activity!.startedAt.slice(0, 10)
              }
            />
            {editing && entry ? (
              <JournalForm
                initial={entry}
                onSave={async (value) => {
                  await repo.saveJournal(space, value);
                  await refresh();
                }}
              />
            ) : (
              <section className="panel detail">
                {entry ? (
                  <>
                    <MoodFace score={entry.feeling} size={64} />
                    <h2>
                      {feelings[entry.feeling - 1]} ·{" "}
                      {entry.emotions.join("、")}
                    </h2>
                    <p className="muted">
                      情绪强度 {entry.intensity} / 5 ·{" "}
                      {entry.tags.join(" · ") || "未填写相关事件"}
                    </p>
                    <p className="diary-text">
                      {entry.text || "这一次，只记录了感受。"}
                    </p>
                    <button onClick={() => setEditing(true)}>
                      <Pencil size={16} /> 修改记录
                    </button>
                  </>
                ) : (
                  <>
                    <Activity />
                    <h2>
                      {activity!.status === "completed"
                        ? "已完成"
                        : activity!.status === "exited"
                          ? "已退出"
                          : "已中断"}
                    </h2>
                    <p>
                      开始前：
                      {activity!.before
                        ? feelings[activity!.before - 1]
                        : "未填写"}{" "}
                      · 结束后：
                      {activity!.after
                        ? feelings[activity!.after - 1]
                        : "未填写"}
                    </p>
                    {activity!.journalId ? (
                      <a href={`#/review/journal/${activity!.journalId}`}>
                        查看关联日记
                      </a>
                    ) : null}
                  </>
                )}
                <button
                  className="danger-text"
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 size={16} /> 删除记录
                </button>
              </section>
            )}
          </>
        ) : (
          <EmptyState title="这条记录已不存在">
            它可能已被删除或属于另一个空间。
          </EmptyState>
        )}
        <StatusMessage error={error} />
        {deleting ? (
          <ConfirmDialog
            title="删除这条记录？"
            onCancel={() => setDeleting(false)}
            onConfirm={remove}
            busy={busy}
          >
            <p>删除后无法撤销，相关洞察会重新计算。</p>
            <StatusMessage error={error} />
          </ConfirmDialog>
        ) : null}
      </>
    );
  const journals = snapshot.journals.filter(
    (j) =>
      (!emotion || j.emotions.includes(emotion as never)) &&
      (!tag || j.tags.includes(tag as never)),
  );
  const items = [
    ...journals.map((j) => ({
      id: j.id,
      date: j.localDate,
      time: j.occurredAt,
      j,
    })),
    ...(!emotion && !tag
      ? snapshot.care.map((c) => ({
          id: c.id,
          date: c.endDate ?? c.startedAt.slice(0, 10),
          time: c.startedAt,
          c,
        }))
      : []),
  ].sort(
    (a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time),
  );
  const dates = [...new Set(items.map((x) => x.date))];
  return (
    <>
      <PageHeading
        title="回头看，慢慢懂自己"
        description="那些被记下的日子，都是你认真生活的痕迹。"
        action={
          <a className="button primary" href="#/record">
            <Plus size={17} /> 记录此刻
          </a>
        }
      />
      <div className="review-filters">
        <label>
          情绪{" "}
          <select value={emotion} onChange={(e) => setEmotion(e.target.value)}>
            <option value="">全部情绪</option>
            {emotions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          事件{" "}
          <select value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="">全部事件</option>
            {tags.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <span className="muted">{items.length} 条记录</span>
      </div>
      {!items.length ? (
        <EmptyState title="这里，等着你的第一段记录">
          {emotion || tag
            ? "没有符合筛选的日记，试试其他条件。"
            : "不需要特别的一天，普通的此刻也值得记下。"}
        </EmptyState>
      ) : (
        <div className="timeline">
          {dates.map((date) => (
            <section key={date}>
              <h2>{date.replaceAll("-", " / ")}</h2>
              {items
                .filter((x) => x.date === date)
                .map((item) => (
                  <a
                    className="timeline-entry"
                    href={`#/review/${"j" in item ? "journal" : "care"}/${item.id}`}
                    key={("j" in item ? "j" : "c") + item.id}
                  >
                    {"j" in item ? (
                      <>
                        <MoodFace score={item.j.feeling} />
                        <div>
                          <h3>
                            {feelings[item.j.feeling - 1]}{" "}
                            <span>{item.j.emotions.join(" · ")}</span>
                          </h3>
                          <p>{item.j.text || "记录了此刻的感受"}</p>
                          <div className="tags">
                            {item.j.tags.map((t) => (
                              <span key={t}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="activity-icon">
                          <Activity />
                        </span>
                        <div>
                          <h3>
                            {careNames[item.c.kind]}{" "}
                            <span>
                              {item.c.status === "completed"
                                ? "已完成"
                                : "已退出 / 中断"}
                            </span>
                          </h3>
                          <p>
                            {item.c.before && item.c.after
                              ? `${feelings[item.c.before - 1]} → ${feelings[item.c.after - 1]}`
                              : "留了一点时间照顾自己"}
                          </p>
                        </div>
                      </>
                    )}
                    <span className="entry-arrow">↗</span>
                  </a>
                ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
