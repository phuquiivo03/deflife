export type AudioCueType = "bgm" | "sfx";

export type AudioCategory = "ui" | "economy" | "time" | "bgm";

export type AudioCue = {
  id: string;
  /** Ogg path relative to `public/audio`, e.g. `ogg/sfx/sfx_ui_click.ogg`. */
  file: string;
  /** Mp3 path. Used for BGM when the browser cannot play ogg, and kept for the per-file pack. */
  mp3?: string;
  type: AudioCueType;
  category: AudioCategory;
  loop: boolean;
  volume: number;
  /** Seconds of leading mp3 encoder silence. Ogg loops ignore this. */
  mp3LeadSeconds?: number;
};

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function mixGain(from: number, to: number, t: number): number {
  const mix = clamp01(t);
  return from + (to - from) * mix;
}

/** Music/SFX slider × cue volume. Mute forces silence. */
export function busGain(slider: number, cueVolume: number, muted: boolean): number {
  if (muted) return 0;
  return clamp01(clamp01(slider) * clamp01(cueVolume));
}

function cueRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of ["assets", "cues", "sounds", "files", "items", "audio"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function asCue(row: unknown): AudioCue | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id.trim() : "";
  if (!id) return null;
  const file =
    typeof record.file === "string" && record.file.trim() ? record.file.trim() : id;
  const mp3 = typeof record.mp3 === "string" && record.mp3.trim() ? record.mp3.trim() : undefined;
  const typeRaw = typeof record.type === "string" ? record.type.trim().toLowerCase() : "";
  const type: AudioCueType =
    typeRaw === "bgm" || typeRaw === "music" || id.startsWith("bgm_") ? "bgm" : "sfx";
  const loop =
    typeof record.loop === "boolean" ? record.loop : type === "bgm";
  const volume =
    typeof record.volume === "number" ? clamp01(record.volume) : 1;
  const lead = record.mp3LeadSeconds;
  const mp3LeadSeconds =
    typeof lead === "number" && Number.isFinite(lead) && lead > 0 ? lead : undefined;
  const category = cueCategory(
    typeof record.category === "string" ? record.category : undefined,
    type,
  );
  const cue: AudioCue = { id, file, mp3, type, category, loop, volume };
  if (mp3LeadSeconds !== undefined) cue.mp3LeadSeconds = mp3LeadSeconds;
  return cue;
}

function cueCategory(value: string | undefined, type: AudioCueType): AudioCategory {
  if (type === "bgm") return "bgm";
  if (value === "economy" || value === "time" || value === "ui") return value;
  return "ui";
}

/** Accepts an array or `{ assets | cues | sounds | files | items | audio }`. Bad rows are dropped. */
export function parseManifest(data: unknown): AudioCue[] {
  const cues: AudioCue[] = [];
  const seen = new Set<string>();
  for (const row of cueRows(data)) {
    const cue = asCue(row);
    if (!cue || seen.has(cue.id)) continue;
    seen.add(cue.id);
    cues.push(cue);
  }
  return cues;
}

export function publicAudioUrl(file: string): string {
  const cleaned = file.replace(/^\/+/, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("audio/")) return `/${cleaned}`;
  return `/audio/${cleaned}`;
}

/**
 * Per-file URLs for the shipped pack. Playback does not use these for SFX
 * (those come from the sprite). BGM selects ogg or mp3 separately via `bgmUrl`.
 */
export function cueUrls(cue: Pick<AudioCue, "file" | "mp3" | "type">): string[] {
  const ogg = publicAudioUrl(cue.file);
  if (!ogg) return [];
  if (cue.type === "bgm") return [ogg];
  const mp3 = cue.mp3 ? publicAudioUrl(cue.mp3) : "";
  return mp3 ? [ogg, mp3] : [ogg];
}

/**
 * Leading silence to skip when looping an mp3. Ogg is gapless, so the lead is 0.
 * `loopStart` / `loopEnd` use this so iOS keeps the seam on the audio, not the padding.
 */
export function loopLeadSeconds(format: "ogg" | "mp3", lead: number | undefined): number {
  if (format !== "mp3") return 0;
  if (typeof lead !== "number" || !Number.isFinite(lead) || lead <= 0) return 0;
  return lead;
}

/** Ogg when the browser can play it. Mp3 otherwise — callers skip encoder padding. */
export function bgmUrl(cue: Pick<AudioCue, "file" | "mp3">, format: "ogg" | "mp3"): string {
  if (format === "mp3" && cue.mp3) return publicAudioUrl(cue.mp3);
  return publicAudioUrl(cue.file);
}

export function resolveCueId(
  ids: Iterable<string>,
  candidates: readonly string[],
): string | null {
  const present = ids instanceof Set ? ids : new Set(ids);
  for (const candidate of candidates) {
    if (present.has(candidate)) return candidate;
  }
  return null;
}
