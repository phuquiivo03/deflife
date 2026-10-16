# Credits — devlife audio, batch 1

All audio in this folder (SFX, BGM, demo) was **procedurally generated from code** (`generate.py`) by the devlife team.
No samples, presets, recordings or third-party audio were used. All synthesis is plain math: square/triangle/sine oscillators, filtered noise, envelopes, echo.

License: **CC0 1.0 Universal (public domain dedication)** — https://creativecommons.org/publicdomain/zero/1.0/
No attribution required. Tools used (not part of the output): Python, NumPy, SciPy, soundfile, pyloudnorm, FFmpeg (libvorbis, libmp3lame).

`sprite/sfx.ogg` and `sprite/sfx.mp3` are a mono 32 kHz mix of the SFX cues above (same synthesis, not new recordings). `sprite/offsets.json` stores each cue's offset. The mp3 offsets include the measured LAME encoder delay so Safari, which keeps that padding, still lines up.

## Exception: typing loops (not procedural, not CC0)

`sfx_typing_loop` and `sfx_typing_loop_fast` (ogg and mp3) come from a keyboard recording provided by Quí (síp), approved for use in devlife. Processing: downmix to mono, trim silence, cut a loop between keystrokes, 40 ms equal-power seam crossfade, normalize peak to −3 dBFS. The fast version is time-stretched 1.5× with ffmpeg atempo (pitch preserved).

License: provided by Quí (síp), approved for use.

These two cues stay out of the SFX sprite. The ogg files loop directly. The mp3 files are the iOS fallback; playback skips the leading LAME delay (1105 samples at 44.1 kHz).
