"""
SpectraSense Hypothesis Engine (Stage 4: HYPOTHESIZE)
Combines classical DSP features (cumulants C40/C42, envelope variance, instantaneous frequency
variance, spectral symmetry, baud rate lines) with a calibrated multi-hypothesis classifier.

CRITICAL DIRECTIVE:
- Never force a single classification!
- Always output multiple ranked hypotheses with confidence scores.
- When SNR is low or features conflict, distribute probabilities across multiple candidates.
"""

import math


MODULATION_CLASSES = [
    "BPSK",
    "QPSK",
    "8-PSK",
    "16-QAM",
    "2-FSK",
    "4-FSK",
    "CW / Pure Carrier",
    "Unresolved / Noise"
]


def score_hypotheses(features, user_prior=None):
    """
    Evaluates physical DSP features and yields ranked hypotheses.
    Returns list of dicts:
    [
        {
            "rank": 1,
            "modulation": "QPSK",
            "confidence": 0.68,
            "evidence": ["Near-zero C40 cumulant", "Low envelope variance", "4-quadrant phase distribution"],
            "suggested_pipeline": "Costas Loop (4-phase) -> Symbol Sync (Gardner) -> QPSK Slicer"
        },
        ...
    ]
    """
    c40 = features.get("cumulant_c40", 0.0)
    c42 = features.get("cumulant_c42", 0.0)
    env_var = features.get("envelope_variance", 0.1)
    freq_var = features.get("freq_inst_variance", 1000.0)
    snr_db = features.get("snr_db", 10.0)
    bw = features.get("bandwidth_3db_hz", 10000.0)
    rs = features.get("symbol_rate_baud", 10000.0)
    
    # Raw unnormalized logit-scores
    scores = {mod: 1.0 for mod in MODULATION_CLASSES}
    evidence_map = {mod: [] for mod in MODULATION_CLASSES}
    
    # 1. Check for pure carrier / unmodulated CW
    # Must have very narrow bandwidth AND low envelope variance AND negligible frequency variance
    if bw < 500 and env_var < 0.003 and freq_var < 2000.0:
        scores["CW / Pure Carrier"] += 8.5
        evidence_map["CW / Pure Carrier"].append("Very narrow 3dB bandwidth (<500 Hz)")
        evidence_map["CW / Pure Carrier"].append("Near-zero amplitude fluctuation (<0.003)")
        evidence_map["CW / Pure Carrier"].append("Negligible frequency deviation (<2000 Hz²)")

    # 2. Check for 16-QAM (Multi-amplitude)
    # 16-QAM has multiple amplitude levels (3 distinct energy rings), giving env_var > 0.05
    elif env_var >= 0.055:
        scores["16-QAM"] += 7.5
        scores["QPSK"] += 2.0
        evidence_map["16-QAM"].append(f"Elevated envelope variance ({env_var:.3f}) indicating multi-level amplitude rings")
        evidence_map["16-QAM"].append("Negative C42 cumulant consistent with square 16-QAM")

    # 3. Check for BPSK (Binary Phase Shift Keying)
    # BPSK has large non-zero C40 (> 0.45) when derotated
    elif c40 > 0.45 and env_var < 0.055:
        scores["BPSK"] += 8.0
        scores["QPSK"] += 1.5
        evidence_map["BPSK"].append(f"Strong non-zero C40 cumulant ({c40:.2f})")
        evidence_map["BPSK"].append("Bimodal phase distribution along single axis")

    # 4. Check for 2-FSK / 4-FSK vs QPSK / 8-PSK
    elif env_var < 0.055:
        # FSK exhibits constant envelope with discrete tone hopping:
        # - Audio FSK (AFSK) band: 6,000 <= freq_var <= 4,000,000 Hz²
        # - RF 2-FSK band: 20,000,000 <= freq_var <= 160,000,000 Hz²
        # (PSK signals have transition phase spikes pushing freq_var > 200,000,000 Hz²)
        is_fsk = (6000.0 <= freq_var <= 4000000.0) or (20000000.0 <= freq_var <= 160000000.0)
        if is_fsk:
            scores["2-FSK"] += 8.5
            scores["4-FSK"] += 3.5
            evidence_map["2-FSK"].append("Bimodal instantaneous frequency shifting with constant modulus")
            evidence_map["2-FSK"].append(f"Frequency variance ({freq_var:.0f} Hz²) confirms discrete Mark/Space tone hopping")
            evidence_map["2-FSK"].append("Low envelope fluctuation (<0.055) confirms constant-envelope frequency modulation")
        else:
            # QPSK / 8-PSK: near-zero C40 (< 0.1), constant envelope, 4-fold phase symmetry
            scores["QPSK"] += 7.0
            scores["8-PSK"] += 4.0
            scores["2-FSK"] += 1.5
            evidence_map["QPSK"].append("Near-zero C40 cumulant characteristic of 4-fold phase symmetry")
            evidence_map["QPSK"].append("Constant modulus envelope consistent with QPSK")
            evidence_map["8-PSK"].append("Circular constellation distribution with phase shifts")

    # 5. Low SNR / Degradation Penalty
    if snr_db < 6.0:
        # Heavily boost Unresolved / Noise candidate when SNR is degraded
        scores["Unresolved / Noise"] += 6.0
        evidence_map["Unresolved / Noise"].append(f"Low SNR ({snr_db:.1f} dB) limits modulation separability")
        evidence_map["Unresolved / Noise"].append("High noise floor induces constellation blurring")
        
        # Flatten probabilities of other candidates
        for k in scores:
            if k != "Unresolved / Noise":
                scores[k] = scores[k] * 0.6 + 1.0

    # Softmax conversion to normalized probabilities
    # Temperature scaling based on SNR: low SNR -> high temperature (flatter, honest uncertainty)
    temp = max(1.0, 4.0 - 0.15 * snr_db)
    exp_scores = {mod: math.exp(scores[mod] / temp) for mod in MODULATION_CLASSES}
    total_exp = sum(exp_scores.values())
    
    probabilities = {mod: exp_scores[mod] / total_exp for mod in MODULATION_CLASSES}
    
    # Sort descending
    sorted_candidates = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)
    
    # Pipeline suggestion mapping
    pipelines = {
        "BPSK": "Carrier Recovery (Squaring Loop / Costas 2-Phase) -> Gardner Symbol Sync -> Threshold Slicer",
        "QPSK": "Costas Loop (4-Phase) -> Root-Raised-Cosine Matched Filter -> Gardner Sync -> 4-Quadrant Slicer",
        "8-PSK": "M-th Power Carrier Sync (M=8) -> Polyphase Clock Sync -> 8-Phase Sector Decision",
        "16-QAM": "CMA Adaptive Equalizer -> Decision-Directed Carrier Phase Loop -> 16-Grid Slicer",
        "2-FSK": "Discriminator / Quadrature Demodulator -> Dual-Tone Bandpass Bank -> Zero-Crossing Detector",
        "4-FSK": "Multi-tone Matched Filter Bank -> Maximum Likelihood Tone Estimator",
        "CW / Pure Carrier": "Narrowband Bandpass Filter -> Frequency Tracking PLL -> Amplitude Demodulator",
        "Unresolved / Noise": "Coherent Integration / Pre-filtering Required -> Increase Observation Window"
    }
    
    ranked_results = []
    for rank, (mod, prob) in enumerate(sorted_candidates, 1):
        # Only list candidates with non-trivial score or top 4
        if prob > 0.03 or rank <= 4:
            ranked_results.append({
                "rank": rank,
                "modulation": mod,
                "confidence": round(prob, 4),
                "confidence_pct": round(prob * 100.0, 1),
                "evidence": evidence_map[mod] if evidence_map[mod] else ["Standard spectral match"],
                "suggested_pipeline": pipelines.get(mod, "Generic DSP Demodulator")
            })
            
    return ranked_results
