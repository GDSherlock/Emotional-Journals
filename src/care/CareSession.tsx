import { useCallback, useEffect, useRef, useState } from "react";
import { Wind, Footprints, CloudRain, Check, Pause, Play } from "lucide-react";
import type { Repository } from "../storage/repository";
import type { Preferences, Score, Space } from "../domain/types";
import { careNames } from "../domain/catalog";
import { transition, type Session, type SessionEvent } from "./session";
import { RatingInput } from "../ui/RatingInput";
import { StatusMessage } from "../ui/StatusMessage";
import { AudioPlayer } from "./AudioPlayer";
import { setDirty } from "../app/router";
export function CareSession({
  initial,
  repo,
  space,
  prefs,
  setPrefs,
  onClose,
  onSaved,
}: {
  initial: Session;
  repo: Repository;
  space: Space;
  prefs: Preferences;
  setPrefs: (p: Preferences) => void;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [session, setSession] = useState(initial),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [after, setAfter] = useState<Score | undefined>(),
    [saved, setSaved] = useState(false);
  const current = useRef(initial),
    queue = useRef(Promise.resolve()),
    playing = useRef(false),
    alive = useRef(true);
  const persist = useCallback(
    (value: Session) => {
      const promise = queue.current
        .catch(() => {})
        .then(() => repo.saveCare(space, value.record));
      queue.current = promise;
      return promise;
    },
    [repo, space],
  );
  const dispatch = useCallback(
    (event: SessionEvent) => {
      const next = transition(current.current, event);
      current.current = next;
      setSession(next);
      if (event.type !== "tick" || next.record.status === "completed")
        void persist(next).catch((e) => {
          if (alive.current) setError("活动保存失败，请重试。" + String(e));
        });
    },
    [persist],
  );
  useEffect(() => {
    alive.current = true;
    setDirty(true);
    const timer = setInterval(() => {
      const value = current.current;
      if (value.record.status !== "running") return;
      if (value.record.kind === "sound" && !playing.current) {
        current.current = { ...value, lastTick: Date.now() };
        return;
      }
      dispatch({ type: "tick", now: Date.now() });
    }, 250);
    const visibility = () => {
      if (document.hidden && current.current.record.status === "running")
        dispatch({ type: "pause", now: Date.now() });
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      alive.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      setDirty(false);
      const value = current.current;
      if (["running", "paused"].includes(value.record.status)) {
        const next = transition(value, { type: "interrupt", now: Date.now() });
        void persist(next).catch(() => {});
      }
    };
  }, [dispatch, persist]);
  async function feedback() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const value =
        after === undefined
          ? current.current
          : transition(current.current, {
              type: "feedback",
              score: after,
              now: Date.now(),
            });
      await persist(value);
      current.current = value;
      setSession(value);
      setDirty(false);
      await onSaved();
      setSaved(true);
    } catch (e) {
      setError("反馈保存失败，请重试。" + String(e));
    } finally {
      setBusy(false);
    }
  }
  async function exit() {
    if (busy) return;
    setBusy(true);
    try {
      const value = transition(current.current, {
        type: "exit",
        now: Date.now(),
      });
      current.current = value;
      setSession(value);
      await persist(value);
      setDirty(false);
      onClose();
    } catch (e) {
      setError("保存退出状态失败，请重试。" + String(e));
    } finally {
      setBusy(false);
    }
  }
  async function volume(value: number) {
    const next = { ...prefs, volume: value };
    setPrefs(next);
    try {
      await repo.savePreferences(next);
    } catch {
      setError("音量偏好未保存，当前播放仍可继续。");
    }
  }
  const kind = session.record.kind,
    active = ["running", "paused"].includes(session.record.status),
    remaining = Math.max(
      0,
      Math.ceil((session.durationMs - session.elapsedMs) / 1000),
    ),
    paused = session.record.status === "paused";
  const Icon =
    kind === "breathing" ? Wind : kind === "sound" ? CloudRain : Footprints;
  if (saved)
    return (
      <section className="panel saved">
        <span className="success-mark">
          <Check />
        </span>
        <h2>谢谢你，照顾了自己</h2>
        <p>无论感受有没有改变，这段时间都属于你。</p>
        <div className="actions">
          <a href={`#/review/care/${session.record.id}`} className="button">
            查看这次记录
          </a>
          <a href="#/insights" className="button primary">
            回看关怀反馈
          </a>
        </div>
      </section>
    );
  if (!active && session.record.status === "completed")
    return (
      <section className="panel session-feedback">
        <span className="success-mark">
          <Check />
        </span>
        <h2>现在，你感觉怎么样？</h2>
        <p>没有变好也没有关系，记录真实的感受就好。</p>
        <RatingInput label="结束后的感受" value={after} onChange={setAfter} />
        <StatusMessage error={error} />
        <div className="actions">
          <button
            className="primary"
            disabled={busy}
            onClick={() => void feedback()}
          >
            {busy ? "正在保存…" : after ? "保存反馈" : "跳过评分并保存"}
          </button>
        </div>
      </section>
    );
  return (
    <section className="panel session-panel">
      <div className="session-heading">
        <span>{careNames[kind]}</span>
        <button onClick={() => void exit()} disabled={busy}>
          退出活动
        </button>
      </div>
      <div
        className={`breathing-orb ${kind === "breathing" && !paused && !prefs.reduceMotion ? "animate" : ""}`}
      >
        <Icon size={44} strokeWidth={1} />
      </div>
      <h2>
        {paused
          ? "在这里，歇一会儿"
          : kind === "breathing"
            ? Math.floor(session.elapsedMs / 4000) % 2 === 0
              ? "轻轻吸气"
              : "慢慢呼气"
            : kind === "sound"
              ? "让雨声，陪你一会儿"
              : "把注意力，交还给身体"}
      </h2>
      <p>
        {kind === "breathing"
          ? "跟随自己舒服的节奏，不需要屏息。"
          : kind === "sound"
            ? "点击播放后开始计时，让声音成为轻轻的背景。"
            : "放下屏幕，起身走几步，或轻轻活动肩颈。以舒适为准。"}
      </p>
      <div className="timer" aria-label="剩余时间">
        {String(Math.floor(remaining / 60)).padStart(2, "0")}
        <span>:</span>
        {String(remaining % 60).padStart(2, "0")}
      </div>
      {kind === "sound" ? (
        <AudioPlayer
          running={!paused && active}
          volume={prefs.volume}
          onVolume={(v) => void volume(v)}
          onPlaying={(value) => {
            playing.current = value;
            current.current = { ...current.current, lastTick: Date.now() };
          }}
        />
      ) : null}
      <div className="actions">
        <button
          onClick={() =>
            dispatch({ type: paused ? "resume" : "pause", now: Date.now() })
          }
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}{" "}
          {paused ? "继续练习" : "暂停练习"}
        </button>
        {kind === "movement" ? (
          <button
            className="primary"
            onClick={() => dispatch({ type: "finish", now: Date.now() })}
          >
            我已完成
          </button>
        ) : null}
      </div>
      <StatusMessage error={error} />
      {error ? (
        <button
          onClick={() =>
            void persist(current.current)
              .then(() => setError(null))
              .catch((e) => setError(String(e)))
          }
        >
          重试保存
        </button>
      ) : null}
      <p className="fine-print">随时可以停下来。离开页面会中断本次活动。</p>
    </section>
  );
}
