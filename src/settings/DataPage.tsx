import { useRef, useState, useEffect } from "react";
import {
  Download,
  Upload,
  LockKeyhole,
  Trash2,
  SlidersHorizontal,
} from "lucide-react";
import type { PageProps } from "../journal/JournalPage";
import type { Snapshot } from "../domain/types";
import {
  decodeBackup,
  encodeBackup,
  MAX_BACKUP_BYTES,
} from "../storage/backup";
import { PageHeading, StatusMessage } from "../ui/StatusMessage";
import { ConfirmDialog } from "../ui/ConfirmDialog";
export function DataPage({ repo, refresh }: PageProps) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Snapshot | null>(null),
    [clear, setClear] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    [counts, setCounts] = useState({ journals: 0, care: 0 });
  async function loadCounts() {
    const s = await repo.read("personal");
    setCounts({ journals: s.journals.length, care: s.care.length });
  }
  useEffect(() => {
    void loadCounts().catch((e) => setError(String(e)));
  }, [repo]);
  async function exportData() {
    setBusy(true);
    setError(null);
    try {
      const value = await repo.read("personal");
      const blob = new Blob([encodeBackup(value, new Date())], {
          type: "application/json",
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `心晴备份-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("备份已准备下载，请妥善保存。");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    setError(null);
    setMessage("");
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > MAX_BACKUP_BYTES)
        throw new Error("备份文件不能超过 10 MB");
      setPreview(decodeBackup(await file.text(), new Date()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取备份失败");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function replace() {
    if (busy) return;
    setBusy(true);
    try {
      await repo.replace(
        "personal",
        clear ? { journals: [], care: [] } : preview!,
      );
      setPreview(null);
      setClear(false);
      await loadCounts();
      await refresh();
      setMessage("个人数据已更新。示例空间不受影响。");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="你的记录，由你保管"
        description="这里只管理个人空间的数据，示例故事不会被导出或清空。"
        action={
          <a className="button" href="#/preferences">
            <SlidersHorizontal size={16} /> 使用偏好
          </a>
        }
      />
      <div className="privacy-note">
        <LockKeyhole size={25} />
        <div>
          <h2>保存在这里，也记得留一份备份</h2>
          <p>
            记录仅保存在当前浏览器，不会上传到服务器。清除站点数据或更换浏览器后，记录不会自动保留。
          </p>
          <small>
            当前个人空间：{counts.journals} 条日记 · {counts.care} 条关怀记录
          </small>
        </div>
      </div>
      <StatusMessage error={error} />
      {message ? (
        <p role="status" className="success-message">
          {message}
        </p>
      ) : null}
      <div className="data-actions">
        <section className="panel">
          <Download size={25} />
          <h2>导出我的记录</h2>
          <p>把日记与关怀反馈保存为 JSON 文件，留一份属于自己的副本。</p>
          <small>备份含私人内容，文件并未加密，请妥善保管。</small>
          <button
            className="primary"
            onClick={() => void exportData()}
            disabled={busy}
          >
            导出备份
          </button>
        </section>
        <section className="panel">
          <Upload size={25} />
          <h2>从备份恢复</h2>
          <p>选择之前导出的 JSON 备份。检查内容后，再决定是否替换现有记录。</p>
          <small>支持第 1 版备份，最大 10 MB。导入会完整替换个人数据。</small>
          <input
            ref={input}
            type="file"
            accept=".json,application/json"
            aria-label="选择备份文件"
            hidden
            onChange={(e) => void importFile(e.target.files?.[0])}
          />
          <button onClick={() => input.current?.click()} disabled={busy}>
            选择备份文件
          </button>
        </section>
      </div>
      <section className="clear-data">
        <div>
          <h2>清空个人数据</h2>
          <p>删除当前浏览器中的个人日记与关怀记录。建议先导出备份。</p>
        </div>
        <button
          className="danger-text"
          onClick={() => {
            setError(null);
            setClear(true);
          }}
          disabled={busy}
        >
          <Trash2 size={15} /> 清空个人数据
        </button>
      </section>
      <p className="fine-print">
        心晴是日常自我记录与关怀工具，不能替代专业帮助。本地保存不等于加密或账户访问保护。
      </p>
      {preview || clear ? (
        <ConfirmDialog
          title={clear ? "确认清空个人数据？" : "确认替换个人数据？"}
          onCancel={() => {
            setPreview(null);
            setClear(false);
          }}
          onConfirm={() => void replace()}
          busy={busy}
        >
          <p>
            {clear
              ? "此操作无法撤销。已有备份仍可用于恢复。"
              : `将导入 ${preview!.journals.length} 条日记、${preview!.care.length} 条关怀记录，并完整替换当前个人空间。建议先取消并导出现有数据。`}
          </p>
          <StatusMessage error={error} />
        </ConfirmDialog>
      ) : null}
    </>
  );
}
