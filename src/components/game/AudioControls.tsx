"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_AUDIO_LEVELS,
  getAudioSettings,
  subscribeAudioSettings,
  updateAudioSettings,
  type AudioLevels,
} from "@/game/audio/settings";
import { resolveShippedIcon } from "@/lib/pixel-assets";
import { PixelIcon } from "./PixelIcon";

function VolumeMark({
  name,
  files,
}: {
  name: "volume_low" | "volume_high";
  files: readonly string[];
}) {
  if (!resolveShippedIcon(name, 22, files)) return null;
  return <PixelIcon name={name} size={22} alt="" files={files} />;
}

function AudioSlider({
  label,
  testId,
  value,
  iconFiles,
  onChange,
}: {
  label: string;
  testId: string;
  value: number;
  iconFiles: readonly string[];
  onChange: (value: number) => void;
}) {
  return (
    <label className="audio-slider">
      <span className="font-galmuri-7 text-galmuri-small text-[var(--muted-foreground)]">{label}</span>
      <span className="audio-slider-row">
        <VolumeMark name="volume_low" files={iconFiles} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          aria-label={label}
          data-testid={testId}
          data-sfx="none"
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <VolumeMark name="volume_high" files={iconFiles} />
      </span>
    </label>
  );
}

export function AudioControls({ iconFiles = [] }: { iconFiles?: readonly string[] }) {
  const [levels, setLevels] = useState<AudioLevels>(DEFAULT_AUDIO_LEVELS);

  useEffect(() => {
    setLevels(getAudioSettings());
    return subscribeAudioSettings(setLevels);
  }, []);

  const muteIcon = levels.muted ? "sound_off" : "sound_on";
  const muteArt = resolveShippedIcon(muteIcon, 22, iconFiles);
  const muteLabel = levels.muted ? "Bật tiếng" : "Tắt tiếng";

  return (
    <div className="audio-controls" data-testid="audio-controls">
      <button
        type="button"
        className="audio-mute"
        data-testid="audio-mute"
        data-sfx="none"
        aria-pressed={levels.muted}
        aria-label={muteLabel}
        onClick={() => {
          const current = getAudioSettings();
          setLevels(updateAudioSettings({ muted: !current.muted }));
        }}
      >
        {muteArt ? (
          <PixelIcon name={muteIcon} size={22} alt="" files={iconFiles} />
        ) : (
          <span className="font-galmuri-7 text-galmuri-small">{levels.muted ? "Bật" : "Tắt"}</span>
        )}
      </button>
      <AudioSlider
        label="Nhạc"
        testId="audio-music"
        value={levels.music}
        iconFiles={iconFiles}
        onChange={(music) => setLevels(updateAudioSettings({ music }))}
      />
      <AudioSlider
        label="Hiệu ứng"
        testId="audio-sfx"
        value={levels.sfx}
        iconFiles={iconFiles}
        onChange={(sfx) => setLevels(updateAudioSettings({ sfx }))}
      />
    </div>
  );
}
