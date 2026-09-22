import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { Repository } from "../storage/repository";
import type { Preferences } from "../domain/types";
import { PageHeading, StatusMessage } from "../ui/StatusMessage";
export function PreferencesPage({
  repo,
  prefs,
  setPrefs,
}: {
  repo: Repository;
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
}) {
  const [draft, setDraft] = useState(prefs),
    [error, setError] = useState<string | null>(null),
    [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await repo.savePreferences(draft);
      setPrefs(draft);
      setSaved(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <a href="#/data" className="back">
        <ArrowLeft size={15} /> 返回数据管理
      </a>
      <PageHeading
        title="按舒服的方式使用"
        description="让这个小空间，更适合你。"
      />
      <section className="panel preferences">
        <label>
          <div>
            <strong>减少动态效果</strong>
            <p>
              用静态文字提示呼吸节奏。系统开启减少动态效果时，也会优先尊重系统设置。
            </p>
          </div>
          <input
            type="checkbox"
            checked={draft.reduceMotion}
            onChange={(e) => {
              setDraft({ ...draft, reduceMotion: e.target.checked });
              setSaved(false);
            }}
          />
        </label>
        <label>
          <div>
            <strong>默认环境音量</strong>
            <p>从轻柔的音量开始，播放时仍可随时调整。</p>
          </div>
          <input
            aria-label="默认环境音量"
            type="range"
            min="0"
            max="1"
            step=".05"
            value={draft.volume}
            onChange={(e) => {
              setDraft({ ...draft, volume: Number(e.target.value) });
              setSaved(false);
            }}
          />
        </label>
        <label>
          <div>
            <strong>洞察时间范围</strong>
            <p>选择你更常回顾的时间长度。</p>
          </div>
          <select
            aria-label="洞察时间范围"
            value={draft.rangeDays}
            onChange={(e) => {
              setDraft({
                ...draft,
                rangeDays: Number(e.target.value) as 7 | 30,
              });
              setSaved(false);
            }}
          >
            <option value="7">近 7 天</option>
            <option value="30">近 30 天</option>
          </select>
        </label>
        <StatusMessage error={error} />
        {saved ? <p role="status">偏好已保存</p> : null}
        <button className="primary" onClick={() => void save()} disabled={busy}>
          保存偏好
        </button>
      </section>
    </>
  );
}
