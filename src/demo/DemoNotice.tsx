import { useState } from "react";
import type { PageProps } from "../journal/JournalPage";
import { dateWindow, localDateOf } from "../domain/dates";
import { seedDemo } from "./seed";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { StatusMessage } from "../ui/StatusMessage";
import { allowLeave, setDirty } from "../app/router";
export function DemoNotice({
  repo,
  snapshot,
  refresh,
  onReset,
}: PageProps & { onReset: () => void }) {
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const dates = dateWindow(localDateOf(new Date()), 30),
    stale = !snapshot.journals.some((j) => dates.includes(j.localDate));
  async function reset() {
    setBusy(true);
    try {
      await repo.replace("demo", seedDemo(new Date()));
      setDirty(false);
      onReset();
      await refresh();
      setConfirm(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="demo-reset-note">
        <span>
          {stale
            ? "示例已超出近期范围或被清空，可以重置后继续体验。"
            : "你可以自由修改示例，随时恢复原来的两周故事。"}
        </span>
        <button
          onClick={() => {
            if (allowLeave()) setConfirm(true);
          }}
        >
          重置示例
        </button>
      </div>
      {confirm ? (
        <ConfirmDialog
          title="重置示例故事？"
          onCancel={() => setConfirm(false)}
          onConfirm={() => void reset()}
          busy={busy}
        >
          <p>
            会替换示例空间中的修改，并将故事日期更新到最近两周。个人记录不受影响。
          </p>
          <StatusMessage error={error} />
        </ConfirmDialog>
      ) : null}
    </>
  );
}
