"""Συνθέτει μια ήρεμη, «επική» μουσική υπόκρουση (χωρίς εξωτερικά αρχεία).

Συγχορδίες σε Ρε ελάσσονα (Dm – B♭ – F – C), απαλά pads, άρπισμα,
μπάσο και ένα απαλό τύμπανο σε κάθε αλλαγή συγχορδίας.
"""
import wave

import numpy as np

SR = 44100


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def _add(buf, start, sig):
    i0 = int(start * SR)
    if i0 >= len(buf):
        return
    n = min(len(sig), len(buf) - i0)
    buf[i0:i0 + n] += sig[:n]


def _tone(f, dur, partials, detune=1.0):
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k, w in enumerate(partials, start=1):
        out += w * np.sin(2 * np.pi * f * detune * k * t + k * 0.7)
    return out, t


def generate(duration, path, intro=9.0):
    n = int(duration * SR) + SR
    L = np.zeros(n)
    R = np.zeros(n)
    chords = [(50, 53, 57), (46, 50, 53), (53, 57, 60), (48, 52, 55)]   # Dm Bb F C
    clen = 4.0
    i = 0
    tpos = 0.0
    while tpos < duration:
        ch = chords[i % 4]
        last = tpos + clen >= duration - 6
        if last:
            ch = (50, 53, 57)
        length = clen + 2.0 if not last else duration - tpos + 1
        # pad
        for m in ch:
            for det, buf in ((0.997, L), (1.003, R)):
                sig, t = _tone(midi(m + 12), length, (1, 0.45, 0.22, 0.1, 0.05), det)
                env = np.minimum(1, t / 1.4) * np.minimum(1, np.maximum(0, (length - t) / 2.0))
                _add(buf, tpos, 0.045 * sig * env)
        # μπάσο
        for b in (0, 2):
            sig, t = _tone(midi(ch[0] - 12), 2.2, (1, 0.35, 0.1))
            env = np.exp(-t * 1.3) * np.minimum(1, t / 0.02)
            _add(L, tpos + b, 0.16 * sig * env)
            _add(R, tpos + b, 0.16 * sig * env)
        if tpos >= intro - 0.1:
            # άρπισμα
            notes = [ch[0] + 24, ch[1] + 24, ch[2] + 24, ch[0] + 36, ch[2] + 24, ch[1] + 24, ch[0] + 24, ch[1] + 24]
            step = clen / 16
            for k in range(16):
                if last and k > 7:
                    break
                sig, t = _tone(midi(notes[k % 8]), 1.2, (1, 0.25, 0.08))
                env = np.exp(-t * 4.5) * np.minimum(1, t / 0.005)
                pan = 0.5 + 0.3 * np.sin(k)
                _add(L, tpos + k * step, 0.05 * (1 - pan) * 2 * sig * env)
                _add(R, tpos + k * step, 0.05 * pan * 2 * sig * env)
            # απαλό τύμπανο
            t = np.arange(int(1.2 * SR)) / SR
            f = 58 * np.exp(-t * 2) + 40
            ph = 2 * np.pi * np.cumsum(f) / SR
            drum = np.sin(ph) * np.exp(-t * 5)
            _add(L, tpos, 0.22 * drum)
            _add(R, tpos, 0.22 * drum)
        tpos += clen
        i += 1
    # απλή αντήχηση (reverb) με καθυστερήσεις
    outL, outR = L.copy(), R.copy()
    for d, g in ((0.089, 0.32), (0.137, 0.26), (0.211, 0.2), (0.293, 0.15), (0.41, 0.1)):
        k = int(d * SR)
        outL[k:] += g * R[:-k]
        outR[k:] += g * L[:-k]
    st = np.stack([outL, outR], axis=1)[: int(duration * SR)]
    tt = np.arange(len(st)) / SR
    fade = np.minimum(1, tt / 2.0) * np.minimum(1, (duration - tt) / 4.0)
    st *= fade[:, None]
    st /= np.max(np.abs(st)) / 0.85
    data = (st * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
