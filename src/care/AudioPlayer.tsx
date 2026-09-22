import { useEffect, useRef, useState } from "react";
import { Volume2, Play, Pause } from "lucide-react";
import { StatusMessage } from "../ui/StatusMessage";
export function AudioPlayer({
  running,
  volume,
  onVolume,
  onPlaying,
}: {
  running: boolean;
  volume: number;
  onVolume: (v: number) => void;
  onPlaying: (v: boolean) => void;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false),
    [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.volume = volume;
  }, [volume]);
  useEffect(() => {
    if (!running) ref.current?.pause();
  }, [running]);
  useEffect(
    () => () => {
      ref.current?.pause();
    },
    [],
  );
  async function play() {
    setError(null);
    try {
      if (error) ref.current?.load();
      await ref.current?.play();
    } catch {
      setError("声音暂时无法播放，请重试或换一个活动。");
      onPlaying(false);
    }
  }
  return (
    <div className="audio-player">
      <audio
        ref={ref}
        src={`${import.meta.env.BASE_URL}audio/rain.wav`}
        loop
        preload="none"
        onPlay={() => {
          setPlaying(true);
          onPlaying(true);
        }}
        onPause={() => {
          setPlaying(false);
          onPlaying(false);
        }}
        onError={() => {
          setError("声音加载失败，请重试或换一个活动。");
          onPlaying(false);
        }}
      />
      <button
        onClick={() => (playing ? ref.current?.pause() : void play())}
        disabled={!running}
      >
        {playing ? <Pause size={17} /> : <Play size={17} />}{" "}
        {error ? "重试播放" : playing ? "暂停声音" : "播放雨声"}
      </button>
      <label className="volume">
        <Volume2 size={17} />
        <input
          aria-label="音量"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolume(Number(e.target.value))}
        />
      </label>
      <small>程序化环境音 · 请用舒适的音量聆听</small>
      <StatusMessage error={error} />
    </div>
  );
}
