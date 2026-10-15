/**
 * Build one mono 32 kHz SFX sprite (ogg + mp3) plus offsets.
 *
 * Each cue is resampled from its ogg, then concatenated with a silence gap so
 * mp3 frames cannot bleed into the next cue. Encoder delay is measured by
 * decoding the sprite and cross-correlating it against the PCM master, then
 * baked into that format's offsets.
 *
 * BGM mp3 leading silence (encoder padding) is measured into the same JSON
 * so the looper can skip it with loopStart/offset. Ogg beds stay at 0.
 */
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "public/audio/manifest.json");
const OUT_DIR = path.join(ROOT, "public/audio/sprite");
const SAMPLE_RATE = 32000;
const GAP_SECONDS = 0.08;
const GAP_SAMPLES = Math.round(SAMPLE_RATE * GAP_SECONDS);

function run(args) {
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
}

function readPcm16(file) {
  const buf = fs.readFileSync(file);
  if (buf.toString("ascii", 0, 4) !== "RIFF") throw new Error(`not a wav: ${file}`);
  let offset = 12;
  let data = null;
  let channels = 0;
  let bits = 0;
  let sampleRate = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "fmt ") {
      channels = buf.readUInt16LE(start + 2);
      sampleRate = buf.readUInt32LE(start + 4);
      bits = buf.readUInt16LE(start + 14);
    } else if (id === "data") {
      data = buf.subarray(start, start + size);
    }
    offset = start + size + (size % 2);
  }
  if (!data || channels !== 1 || bits !== 16) {
    throw new Error(`expected mono s16 wav, got ch=${channels} bits=${bits} (${file})`);
  }
  const samples = new Int16Array(data.length / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = data.readInt16LE(i * 2);
  return { samples, sampleRate };
}

function writePcm16(file, samples, sampleRate) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(samples[i], 44 + i * 2);
  fs.writeFileSync(file, buf);
}

function secondsFromRate(samples, sampleRate) {
  return Math.round((samples / sampleRate) * 1e6) / 1e6;
}

function seconds(samples) {
  return secondsFromRate(samples, SAMPLE_RATE);
}

/**
 * ffmpeg's decoder applies the LAME gapless skip, so a PCM round-trip hides
 * the padding. Safari's decodeAudioData keeps those samples as leading
 * silence, which is the path the mp3 sprite is for. Read the skip the
 * demuxer would have removed.
 */
function mp3SkipSamples(file) {
  const probe = spawnSync("ffprobe", ["-hide_banner", "-v", "trace", "-i", file], {
    encoding: "utf8",
  });
  const text = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`;
  const match = text.match(/injecting skip (\d+)/);
  if (!match) throw new Error(`no mp3 encoder delay in ${file}`);
  return Number(match[1]);
}

function streamSampleRate(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  ).trim();
  const rate = Number(out);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error(`no sample rate for ${file}`);
  return rate;
}

/** Integer lag that best aligns `decoded` onto `reference` (decoded is delayed). */
function findDelaySamples(reference, decoded) {
  let origin = 0;
  for (let i = 0; i < reference.length; i++) {
    if (Math.abs(reference[i]) > 400) {
      origin = i;
      break;
    }
  }
  const window = 2400;
  const maxLag = 8000;
  const score = (lag, step) => {
    let dot = 0;
    const end = Math.min(window, reference.length - origin, decoded.length - origin - lag);
    for (let i = 0; i < end; i += step) {
      dot += reference[origin + i] * decoded[origin + lag + i];
    }
    return dot;
  };
  let bestLag = 0;
  let best = -Infinity;
  for (let lag = 0; lag <= maxLag; lag += 4) {
    const dot = score(lag, 2);
    if (dot > best) {
      best = dot;
      bestLag = lag;
    }
  }
  const from = Math.max(0, bestLag - 6);
  const to = Math.min(maxLag, bestLag + 6);
  best = -Infinity;
  for (let lag = from; lag <= to; lag++) {
    const dot = score(lag, 1);
    if (dot > best) {
      best = dot;
      bestLag = lag;
    }
  }
  if (!(best > 0)) throw new Error("encoder delay correlation failed");
  return bestLag;
}

function leadingSilenceSeconds(samples, sampleRate) {
  const threshold = 32;
  for (let i = 0; i < samples.length; i++) {
    if (Math.abs(samples[i]) > threshold) return Math.round((i / sampleRate) * 1e6) / 1e6;
  }
  return 0;
}

function decodeToWav(input, output, sampleRate) {
  run(["-y", "-i", input, "-ac", "1", "-ar", String(sampleRate), "-c:a", "pcm_s16le", output]);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const sfx = (manifest.assets ?? []).filter((asset) => asset.type === "sfx");
const bgm = (manifest.assets ?? []).filter((asset) => asset.type === "bgm");
if (sfx.length === 0) throw new Error("no sfx in manifest");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "devlife-sfx-"));
try {
  const pieces = [];
  let cursor = 0;
  const layout = [];
  for (const cue of sfx) {
    const source = path.join(ROOT, "public/audio", cue.file);
    const wav = path.join(tmp, `${cue.id}.wav`);
    decodeToWav(source, wav, SAMPLE_RATE);
    const { samples, sampleRate } = readPcm16(wav);
    if (sampleRate !== SAMPLE_RATE) throw new Error(`${cue.id} sample rate ${sampleRate}`);
    layout.push({ id: cue.id, start: cursor, length: samples.length });
    pieces.push(samples);
    cursor += samples.length;
    if (cue !== sfx[sfx.length - 1]) {
      pieces.push(new Int16Array(GAP_SAMPLES));
      cursor += GAP_SAMPLES;
    }
  }
  const total = pieces.reduce((sum, piece) => sum + piece.length, 0);
  const master = new Int16Array(total);
  let writeAt = 0;
  for (const piece of pieces) {
    master.set(piece, writeAt);
    writeAt += piece.length;
  }
  const masterWav = path.join(tmp, "sprite.wav");
  writePcm16(masterWav, master, SAMPLE_RATE);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const oggPath = path.join(OUT_DIR, "sfx.ogg");
  const mp3Path = path.join(OUT_DIR, "sfx.mp3");
  run(["-y", "-i", masterWav, "-c:a", "libvorbis", "-q:a", "4", oggPath]);
  run(["-y", "-i", masterWav, "-c:a", "libmp3lame", "-b:a", "64k", mp3Path]);

  const formats = [
    { key: "ogg", file: oggPath, publicFile: "sprite/sfx.ogg" },
    { key: "mp3", file: mp3Path, publicFile: "sprite/sfx.mp3" },
  ];
  const encoded = {};
  for (const format of formats) {
    const decodedWav = path.join(tmp, `decoded-${format.key}.wav`);
    decodeToWav(format.file, decodedWav, SAMPLE_RATE);
    const decoded = readPcm16(decodedWav);
    const aligned = findDelaySamples(master, decoded.samples);
    const delaySamples = format.key === "mp3" ? mp3SkipSamples(format.file) + aligned : aligned;
    const cues = {};
    for (const cue of layout) {
      cues[cue.id] = {
        offset: seconds(cue.start + delaySamples),
        duration: seconds(cue.length),
      };
    }
    encoded[format.key] = {
      file: format.publicFile,
      delaySamples,
      cues,
    };
    console.log(
      `${format.key}: delay ${delaySamples} samples (${seconds(delaySamples)}s), cues ${layout.length}`,
    );
  }

  const beds = {};
  for (const cue of bgm) {
    const mp3 = path.join(ROOT, "public/audio", cue.mp3);
    const ogg = path.join(ROOT, "public/audio", cue.file);
    const mp3Wav = path.join(tmp, `${cue.id}-mp3.wav`);
    const oggWav = path.join(tmp, `${cue.id}-ogg.wav`);
    decodeToWav(mp3, mp3Wav, 44100);
    decodeToWav(ogg, oggWav, 44100);
    const mp3Pcm = readPcm16(mp3Wav);
    const oggPcm = readPcm16(oggWav);
    const rate = streamSampleRate(mp3);
    const skip = mp3SkipSamples(mp3);
    const residual = leadingSilenceSeconds(mp3Pcm.samples, mp3Pcm.sampleRate);
    const mp3LeadSeconds = secondsFromRate(skip, rate) + (residual < 0.001 ? 0 : residual);
    const oggLeadSeconds = leadingSilenceSeconds(oggPcm.samples, oggPcm.sampleRate);
    beds[cue.id] = { mp3LeadSeconds: Math.round(mp3LeadSeconds * 1e6) / 1e6, mp3SkipSamples: skip, oggLeadSeconds };
    console.log(
      `${cue.id}: mp3 skip ${skip} @ ${rate}Hz = ${beds[cue.id].mp3LeadSeconds}s (residual ${residual}s), ogg lead ${oggLeadSeconds}s`,
    );
  }

  const payload = {
    sampleRate: SAMPLE_RATE,
    channels: 1,
    gapSeconds: GAP_SECONDS,
    ogg: encoded.ogg,
    mp3: encoded.mp3,
    bgm: beds,
  };
  const jsonPath = path.join(OUT_DIR, "offsets.json");
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);

  if (encoded.mp3.delaySamples < 100) {
    throw new Error(`mp3 delay looks too small: ${encoded.mp3.delaySamples}`);
  }
  const first = layout[0].id;
  const expected =
    (encoded.mp3.delaySamples - encoded.ogg.delaySamples) / SAMPLE_RATE;
  const actual = encoded.mp3.cues[first].offset - encoded.ogg.cues[first].offset;
  if (Math.abs(actual - expected) > 1e-5) {
    throw new Error(`mp3 padding was not baked into offsets (${actual} vs ${expected})`);
  }
  console.log(`wrote ${path.relative(ROOT, oggPath)}, ${path.relative(ROOT, mp3Path)}, offsets.json`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
