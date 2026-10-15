export type AudioCueType = "bgm" | "sfx";

export type AudioCue = {
  id: string;
  file: string;
  type: AudioCueType;
  loop: boolean;
  volume: number;
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
  for (const key of ["cues", "sounds", "files", "items", "audio"]) {
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
  const typeRaw = typeof record.type === "string" ? record.type.trim().toLowerCase() : "";
  const type: AudioCueType =
    typeRaw === "bgm" || typeRaw === "music" || id.startsWith("bgm_") ? "bgm" : "sfx";
  const loop =
    typeof record.loop === "boolean" ? record.loop : type === "bgm";
  const volume =
    typeof record.volume === "number" ? clamp01(record.volume) : 1;
  return { id, file, type, loop, volume };
}

/** Accepts an array or `{ cues | sounds | files | items | audio }`. Bad rows are dropped. */
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

export function fileStem(file: string): string {
  const base = file.split("/").pop() ?? file;
  return base.replace(/\.(ogg|mp3)$/i, "");
}

/**
 * BGM is ogg only — the mp3 exports have leading silence that clicks on loop.
 * SFX tries ogg, then mp3.
 */
export function cueUrls(cue: Pick<AudioCue, "file" | "id" | "type">): string[] {
  const stem = fileStem(cue.file || cue.id);
  if (!stem) return [];
  const ogg = `/audio/ogg/${stem}.ogg`;
  if (cue.type === "bgm") return [ogg];
  return [ogg, `/audio/mp3/${stem}.mp3`];
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
