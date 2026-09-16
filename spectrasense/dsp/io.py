"""
SpectraSense DSP - Input & Format Handling
Handles .iq (complex float32, int16, int8) and .wav files.
"""

import os
import wave
import struct
import math

try:
    import numpy as np
except ImportError:
    np = None


class SignalFormat:
    FLOAT32_IQ = "Complex Float32 (cfile / .iq)"
    INT16_IQ = "Complex Int16 (sc16 / .iq)"
    INT8_IQ = "Complex Int8 (sc8 / .iq)"
    WAV_AUDIO = "WAV Audio (.wav)"


def read_iq_file(filepath, format_type=SignalFormat.FLOAT32_IQ, max_samples=200000):
    """
    Reads a raw IQ file into complex numbers (I + 1j*Q).
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File not found: {filepath}")

    file_size = os.path.getsize(filepath)

    if np is not None:
        if format_type == SignalFormat.FLOAT32_IQ or filepath.endswith((".iq", ".cfile", ".fc32")):
            # Float32 interleaved I, Q
            count = min(file_size // 4, max_samples * 2)
            raw = np.fromfile(filepath, dtype=np.float32, count=count)
            i_data = raw[0::2]
            q_data = raw[1::2]
            min_len = min(len(i_data), len(q_data))
            signal = i_data[:min_len] + 1j * q_data[:min_len]
        elif format_type == SignalFormat.INT16_IQ or filepath.endswith(".sc16"):
            count = min(file_size // 2, max_samples * 2)
            raw = np.fromfile(filepath, dtype=np.int16, count=count).astype(np.float32) / 32768.0
            i_data = raw[0::2]
            q_data = raw[1::2]
            min_len = min(len(i_data), len(q_data))
            signal = i_data[:min_len] + 1j * q_data[:min_len]
        elif format_type == SignalFormat.INT8_IQ or filepath.endswith(".sc8"):
            count = min(file_size, max_samples * 2)
            raw = np.fromfile(filepath, dtype=np.int8, count=count).astype(np.float32) / 128.0
            i_data = raw[0::2]
            q_data = raw[1::2]
            min_len = min(len(i_data), len(q_data))
            signal = i_data[:min_len] + 1j * q_data[:min_len]
        else:
            raw = np.fromfile(filepath, dtype=np.float32, count=max_samples * 2)
            signal = raw[0::2] + 1j * raw[1::2]
        return signal
    else:
        # Fallback pure python
        signal = []
        with open(filepath, "rb") as f:
            data = f.read(max_samples * 8)
            num_floats = len(data) // 4
            floats = struct.unpack(f"<{num_floats}f", data[:num_floats * 4])
            for i in range(0, len(floats) - 1, 2):
                signal.append(complex(floats[i], floats[i+1]))
        return signal


def read_wav_file(filepath, max_samples=200000):
    """
    Reads a .wav file into float signal array and extracts sample rate.
    """
    with wave.open(filepath, "rb") as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = min(wf.getnframes(), max_samples)
        raw_frames = wf.readframes(n_frames)

    if np is not None:
        if sampwidth == 2:
            dtype = np.int16
            scale = 32768.0
        elif sampwidth == 1:
            dtype = np.uint8
            scale = 128.0
        elif sampwidth == 4:
            dtype = np.int32
            scale = 2147483648.0
        else:
            dtype = np.int16
            scale = 32768.0

        audio_data = np.frombuffer(raw_frames, dtype=dtype).astype(np.float32) / scale
        if n_channels == 2:
            # Stereo represents I/Q channels
            i_data = audio_data[0::2]
            q_data = audio_data[1::2]
            signal = i_data + 1j * q_data
        else:
            # Mono real-valued audio: compute true analytic signal z[n] = x[n] + j*H{x[n]}
            try:
                from scipy.signal import hilbert
                signal = hilbert(audio_data)
            except Exception:
                n_fft = len(audio_data)
                X = np.fft.fft(audio_data)
                h = np.zeros(n_fft)
                if n_fft % 2 == 0:
                    h[0] = h[n_fft // 2] = 1.0
                    h[1:n_fft // 2] = 2.0
                else:
                    h[0] = 1.0
                    h[1:(n_fft + 1) // 2] = 2.0
                signal = np.fft.ifft(X * h)
        return signal, framerate
    else:
        # Pure python fallback
        fmt = f"<{len(raw_frames) // 2}h"
        samples = struct.unpack(fmt, raw_frames)
        real_x = [float(s) / 32768.0 for s in samples]
        
        # Pure python Radix-2 FFT Hilbert transform
        def _fft(seq):
            L = len(seq)
            if L <= 1: return seq
            even = _fft(seq[0::2])
            odd = _fft(seq[1::2])
            t = [complex(math.cos(-2 * math.pi * k / L), math.sin(-2 * math.pi * k / L)) * odd[k] for k in range(L // 2)]
            return [even[k] + t[k] for k in range(L // 2)] + [even[k] - t[k] for k in range(L // 2)]
        
        def _ifft(seq):
            L = len(seq)
            conj_seq = [c.conjugate() for c in seq]
            res = _fft(conj_seq)
            return [c.conjugate() / L for c in res]
            
        chunk_size = 2048
        signal = []
        for start in range(0, len(real_x), chunk_size):
            chunk = real_x[start:start + chunk_size]
            if len(chunk) < chunk_size:
                pad = chunk_size - len(chunk)
                chunk = chunk + [0.0] * pad
            X = _fft([complex(v, 0.0) for v in chunk])
            H = [0.0] * chunk_size
            H[0] = 1.0
            H[chunk_size // 2] = 1.0
            for k in range(1, chunk_size // 2):
                H[k] = 2.0
            XH = [X[k] * H[k] for k in range(chunk_size)]
            z_chunk = _ifft(XH)
            signal.extend(z_chunk[:min(len(real_x) - start, chunk_size)])
            
        return signal, framerate


def get_file_metadata(filepath):
    """Returns basic file size and metadata dict."""
    size_bytes = os.path.getsize(filepath)
    ext = os.path.splitext(filepath)[1].lower()
    return {
        "filepath": filepath,
        "filename": os.path.basename(filepath),
        "size_bytes": size_bytes,
        "size_mb": round(size_bytes / (1024 * 1024), 2),
        "extension": ext,
        "format_guess": "WAV Audio" if ext == ".wav" else "Raw Complex Float32 IQ"
    }
