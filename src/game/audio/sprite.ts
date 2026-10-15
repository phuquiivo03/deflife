import { publicAudioUrl } from "./manifest";

export type AudioFormat = "ogg" | "mp3";

export type SpriteCue = {
  offset: number;
  duration: number;
};

export type SpriteFormat = {
  file: string;
  delaySamples: number;
  cues: Record<string, SpriteCue>;
};

export type BgmLead = {
  mp3LeadSeconds: number;
};

export type SpriteMap = {
  sampleRate: number;
  channels: number;
  ogg: SpriteFormat;
  mp3: SpriteFormat;
  bgm: Record<string, BgmLead>;
};

/** Ogg/Vorbis when the browser says it can play it. iOS Safari cannot, so it gets mp3. */
export function preferredAudioFormat(canPlayType: (mime: string) => string): AudioFormat {
  let support = "";
  try {
    support = canPlayType('audio/ogg; codecs="vorbis"').toLowerCase();
  } catch {
    support = "";
  }
  if (support === "probably" || support === "maybe") return "ogg";
  return "mp3";
}

function asCue(value: unknown): SpriteCue | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const offset = record.offset;
  const duration = record.duration;
  if (typeof offset !== "number" || typeof duration !== "number") return null;
  if (!Number.isFinite(offset) || !Number.isFinite(duration)) return null;
  if (offset < 0 || duration <= 0) return null;
  return { offset, duration };
}

function asFormat(value: unknown): SpriteFormat | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const file = typeof record.file === "string" ? record.file.trim() : "";
  const delaySamples = record.delaySamples;
  if (!file || typeof delaySamples !== "number" || !Number.isFinite(delaySamples) || delaySamples < 0) {
    return null;
  }
  const cues: Record<string, SpriteCue> = {};
  if (record.cues && typeof record.cues === "object") {
    for (const [id, cue] of Object.entries(record.cues as Record<string, unknown>)) {
      const parsed = asCue(cue);
      if (parsed) cues[id] = parsed;
    }
  }
  return { file, delaySamples, cues };
}

function asBgm(value: unknown): Record<string, BgmLead> {
  const beds: Record<string, BgmLead> = {};
  if (!value || typeof value !== "object") return beds;
  for (const [id, row] of Object.entries(value as Record<string, unknown>)) {
    if (!row || typeof row !== "object") continue;
    const lead = (row as Record<string, unknown>).mp3LeadSeconds;
    if (typeof lead !== "number" || !Number.isFinite(lead) || lead < 0) continue;
    beds[id] = { mp3LeadSeconds: lead };
  }
  return beds;
}

export function parseSpriteMap(data: unknown): SpriteMap | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const sampleRate = record.sampleRate;
  const channels = record.channels;
  if (typeof sampleRate !== "number" || sampleRate <= 0) return null;
  if (typeof channels !== "number" || channels <= 0) return null;
  const ogg = asFormat(record.ogg);
  const mp3 = asFormat(record.mp3);
  if (!ogg || !mp3) return null;
  return {
    sampleRate,
    channels,
    ogg,
    mp3,
    bgm: asBgm(record.bgm),
  };
}

export function spriteFileUrl(map: SpriteMap, format: AudioFormat): string {
  return publicAudioUrl(map[format].file);
}

export function spriteSlice(map: SpriteMap, format: AudioFormat, id: string): SpriteCue | null {
  return map[format].cues[id] ?? null;
}

/** Mp3 beds skip the measured encoder padding. Ogg beds start at 0. */
export function bgmLeadSeconds(map: SpriteMap | null, format: AudioFormat, id: string): number {
  if (format !== "mp3" || !map) return 0;
  const lead = map.bgm[id]?.mp3LeadSeconds ?? 0;
  if (!Number.isFinite(lead) || lead <= 0) return 0;
  return lead;
}
