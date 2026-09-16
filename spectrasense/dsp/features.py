"""
SpectraSense DSP - Feature & Parameter Extraction (Stage 3: CHARACTERIZE)
Calculates:
- Carrier Frequency (Fc)
- 3dB and 99% Occupied Bandwidth (OBW)
- SNR estimation (M2M4 and Spectral Floor)
- Symbol Rate (Rs) estimation (Cyclostationary non-linear transform)
- Higher-Order Cumulants (C40, C42)
- Instantaneous Amplitude & Frequency Variance
"""

import math

try:
    import numpy as np
    from scipy import signal as sp_signal
except ImportError:
    np = None
    sp_signal = None


def estimate_carrier_frequency(iq_data, sample_rate):
    """
    Estimates carrier frequency Fc using spectral peak and power centroid,
    or autocorrelation lag-1 phase angle in pure Python.
    """
    if np is not None:
        n = len(iq_data)
        fft_vals = np.fft.fftshift(np.fft.fft(iq_data))
        psd = np.abs(fft_vals) ** 2
        freqs = np.fft.fftshift(np.fft.fftfreq(n, 1.0 / sample_rate))
        
        # Peak frequency
        peak_idx = np.argmax(psd)
        fc_peak = freqs[peak_idx]
        
        threshold = 0.1 * np.max(psd)
        mask = psd > threshold
        if np.sum(mask) > 0:
            fc_centroid = np.sum(freqs[mask] * psd[mask]) / np.sum(psd[mask])
        else:
            fc_centroid = fc_peak
        return float(fc_peak), float(fc_centroid)
    else:
        # Lag-1 phase angle estimation: angle(sum(x[n] * conj(x[n-1])))
        if len(iq_data) < 2:
            return 0.0, 0.0
        n_sub = min(len(iq_data), 4000)
        # Check squared signal for BPSK/QPSK carrier offset
        r1_sum = sum(iq_data[i] * iq_data[i-1].conjugate() for i in range(1, n_sub))
        ang = math.atan2(r1_sum.imag, r1_sum.real)
        fc = ang * sample_rate / (2.0 * math.pi)
        return float(round(fc, 1)), float(round(fc, 1))


def estimate_bandwidth(iq_data, sample_rate):
    """
    Calculates 3dB Bandwidth and 99% Occupied Bandwidth (OBW).
    """
    if np is None:
        return sample_rate * 0.1, sample_rate * 0.15
        
    n = len(iq_data)
    fft_vals = np.fft.fftshift(np.fft.fft(iq_data))
    psd = np.abs(fft_vals) ** 2
    freqs = np.fft.fftshift(np.fft.fftfreq(n, 1.0 / sample_rate))
    
    max_val = np.max(psd)
    half_power = max_val / 2.0  # -3 dB
    
    # Indices exceeding half power
    indices_3db = np.where(psd >= half_power)[0]
    if len(indices_3db) > 1:
        bw_3db = freqs[indices_3db[-1]] - freqs[indices_3db[0]]
    else:
        bw_3db = sample_rate * 0.05
        
    # 99% Occupied Bandwidth (OBW)
    total_energy = np.sum(psd)
    cumsum = np.cumsum(psd)
    low_idx = np.searchsorted(cumsum, 0.005 * total_energy)
    high_idx = np.searchsorted(cumsum, 0.995 * total_energy)
    
    if high_idx > low_idx and high_idx < len(freqs):
        bw_99 = freqs[high_idx] - freqs[low_idx]
    else:
        bw_99 = bw_3db * 1.3
        
    return abs(float(bw_3db)), abs(float(bw_99))


def estimate_snr_m2m4(iq_data):
    """
    Estimates SNR using the classic M2M4 (2nd and 4th moment) signal-to-noise estimator.
    Works well for constant and near-constant envelope digital modulations.
    """
    if np is not None:
        r = np.abs(iq_data)
        m2 = np.mean(r ** 2)
        m4 = np.mean(r ** 4)
    else:
        n = max(len(iq_data), 1)
        r = [abs(s) for s in iq_data[:4000]]
        m2 = sum(x ** 2 for x in r) / len(r)
        m4 = sum(x ** 4 for x in r) / len(r)
    
    # For complex PSK/QAM, kurtosis ratio
    arg = 2.0 * (m2 ** 2) - m4
    if arg > 0:
        s = math.sqrt(arg)
        noise = max(m2 - s, 1e-12)
        snr_linear = s / noise
        snr_db = 10.0 * math.log10(max(snr_linear, 0.01))
    else:
        # Fallback to spectral floor estimate
        snr_db = estimate_snr_spectral(iq_data)
        
    return max(round(float(snr_db), 1), -10.0)


def estimate_snr_spectral(iq_data):
    """Spectral noise floor SNR estimation."""
    if np is None:
        return 12.0
    fft_mag = np.abs(np.fft.fft(iq_data))
    psd = fft_mag ** 2
    
    # Sort PSD values to isolate noise floor (bottom 30%)
    sorted_psd = np.sort(psd)
    n = len(sorted_psd)
    noise_floor = np.median(sorted_psd[:int(n * 0.35)])
    signal_peak = np.percentile(psd, 99.5)
    
    if noise_floor > 0 and signal_peak > noise_floor:
        snr_db = 10.0 * math.log10(signal_peak / noise_floor)
        return round(float(snr_db), 1)
    return 6.0


def estimate_symbol_rate(iq_data, sample_rate, fc=0.0):
    """
    Estimates Symbol Rate (Rs) using non-linear cyclostationary cues:
    - Signal squaring / 4th-power or delay-and-multiply |x(t)|^2
    - FFT peak detection on envelope variation
    """
    if np is None:
        return sample_rate * 0.05
        
    # Envelope power spectrum: |x(t)|^2 - mean(|x(t)|^2)
    env = np.abs(iq_data) ** 2
    env_ac = env - np.mean(env)
    
    fft_env = np.abs(np.fft.rfft(env_ac))
    freqs = np.fft.rfftfreq(len(env_ac), 1.0 / sample_rate)
    
    # Mask out DC and very high frequencies (> sample_rate / 2.5)
    valid_mask = (freqs > (sample_rate * 0.005)) & (freqs < (sample_rate * 0.45))
    if np.sum(valid_mask) == 0:
        return float(sample_rate * 0.05)
        
    sub_psd = fft_env[valid_mask]
    sub_freqs = freqs[valid_mask]
    
    # Check if there is a dominant spectral peak
    peak_idx = np.argmax(sub_psd)
    median_val = np.median(sub_psd)
    peak_val = sub_psd[peak_idx]
    
    # Also test delay-and-multiply (x(t) * conj(x(t-1)))
    d_sig = iq_data[1:] * np.conj(iq_data[:-1])
    d_fft = np.abs(np.fft.rfft(d_sig - np.mean(d_sig)))
    d_freqs = np.fft.rfftfreq(len(d_sig), 1.0 / sample_rate)
    d_mask = (d_freqs > (sample_rate * 0.005)) & (d_freqs < (sample_rate * 0.45))
    
    if np.sum(d_mask) > 0:
        d_peak_idx = np.argmax(d_fft[d_mask])
        rs_candidate2 = d_freqs[d_mask][d_peak_idx]
    else:
        rs_candidate2 = sub_freqs[peak_idx]
        
    if peak_val > 3.0 * median_val:
        return float(sub_freqs[peak_idx])
    return float(rs_candidate2)


def calculate_cumulants(iq_data):
    """
    Higher-order cumulants:
    C20 = E[x^2]
    C21 = E[|x|^2]
    C40 = E[x^4] - 3*(E[x^2])^2
    C42 = E[|x|^4] - |E[x^2]|^2 - 2*(E[|x|^2])^2
    """
    if np is None:
        n = max(len(iq_data), 1)
        mean_r = sum(s.real for s in iq_data) / n
        mean_i = sum(s.imag for s in iq_data) / n
        x = [complex(s.real - mean_r, s.imag - mean_i) for s in iq_data]
        m20 = sum(s ** 2 for s in x) / n
        m21 = sum(abs(s) ** 2 for s in x) / n
        m40 = sum(s ** 4 for s in x) / n
        m41 = sum(abs(s) ** 4 for s in x) / n
        c40 = m40 - 3.0 * (m20 ** 2)
        c42 = m41 - abs(m20) ** 2 - 2.0 * (m21 ** 2)
        return {
            "c20": m20, "c21": m21, "c40": c40, "c42": c42,
            "c40_abs": float(abs(c40)), "c42_abs": float(abs(c42))
        }
        
    x = iq_data
    # Ensure zero-mean
    x = x - np.mean(x)
    m20 = np.mean(x ** 2)
    m21 = np.mean(np.abs(x) ** 2)
    m40 = np.mean(x ** 4)
    m42 = np.mean((np.abs(x) ** 2) * (x ** 2))
    m41 = np.mean(np.abs(x) ** 4)
    
    c40 = m40 - 3.0 * (m20 ** 2)
    c42 = m41 - np.abs(m20) ** 2 - 2.0 * (m21 ** 2)
    
    return {
        "c20": complex(m20),
        "c21": float(m21),
        "c40": complex(c40),
        "c42": float(c42),
        "c40_abs": float(abs(c40)),
        "c42_abs": float(abs(c42))
    }


def extract_all_features(iq_data, sample_rate):
    """
    Master feature extraction pipeline for Stage 3: CHARACTERIZE.
    """
    fc_peak, fc_centroid = estimate_carrier_frequency(iq_data, sample_rate)
    bw_3db, bw_99 = estimate_bandwidth(iq_data, sample_rate)
    snr_db = estimate_snr_m2m4(iq_data)
    rs_est = estimate_symbol_rate(iq_data, sample_rate, fc=fc_peak)
    # Derotate to baseband for cumulant & phase analysis
    if abs(fc_peak) > 200:
        if np is not None:
            t = np.arange(len(iq_data)) / float(sample_rate)
            bb_data = iq_data * np.exp(-1j * 2 * np.pi * fc_peak * t)
        else:
            bb_data = []
            for idx, s in enumerate(iq_data[:4000]):
                t = idx / float(sample_rate)
                phase = -2.0 * math.pi * fc_peak * t
                cos_p = math.cos(phase)
                sin_p = math.sin(phase)
                bb_data.append(complex(s.real * cos_p - s.imag * sin_p, s.real * sin_p + s.imag * cos_p))
    else:
        bb_data = iq_data
        
    cumulants = calculate_cumulants(bb_data)
    
    # Instantaneous amplitude and phase cues
    if np is not None:
        amp = np.abs(iq_data)
        amp_var = float(np.var(amp / (np.mean(amp) + 1e-12)))
        
        # Instantaneous frequency variance
        phase = np.unwrap(np.angle(iq_data))
        freq_inst = np.diff(phase) * (sample_rate / (2.0 * math.pi))
        freq_var = float(np.var(freq_inst))
    else:
        amps = [abs(s) for s in iq_data[:3000]]
        m_amp = sum(amps) / max(len(amps), 1)
        amp_var = sum(((a / (m_amp + 1e-12)) - 1.0) ** 2 for a in amps) / max(len(amps), 1)
        
        phases = [math.atan2(s.imag, s.real) for s in iq_data[:3000]]
        # Unwrapped diff
        d_phases = []
        for i in range(1, len(phases)):
            diff = phases[i] - phases[i-1]
            while diff > math.pi: diff -= 2 * math.pi
            while diff < -math.pi: diff += 2 * math.pi
            d_phases.append(diff * (sample_rate / (2.0 * math.pi)))
        m_dp = sum(d_phases) / max(len(d_phases), 1)
        freq_var = sum((d - m_dp) ** 2 for d in d_phases) / max(len(d_phases), 1)
        
    return {
        "carrier_freq_hz": fc_peak,
        "carrier_centroid_hz": fc_centroid,
        "bandwidth_3db_hz": bw_3db,
        "bandwidth_99_hz": bw_99,
        "snr_db": snr_db,
        "symbol_rate_baud": rs_est,
        "samples_per_symbol": round(sample_rate / max(rs_est, 1.0), 2),
        "cumulant_c40": cumulants["c40_abs"],
        "cumulant_c42": cumulants["c42_abs"],
        "envelope_variance": round(amp_var, 4),
        "freq_inst_variance": round(freq_var, 1)
    }
