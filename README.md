# SpectraSense — Signal Workflow Orchestration & Evidence Layer

**Smart India Hackathon 2026 — Problem Statement ID 26147 (NTRO / Space Technology)**

---

## 1. Executive Summary

**SpectraSense** is an intelligence-grade workflow orchestration and evidence platform designed for tactical and space-domain signal analysis. 

Rather than seeking to replace low-level signal workbenches (such as GNU Radio, Inspectrum, or URH), SpectraSense sits on top of them as an **orchestration + evidence layer**. It ingests raw `.iq` (complex float32/int16) and `.wav` captures, coordinates systematic feature extraction, balances competing modulation hypotheses, performs downstream verification trials, and generates tamper-evident, auditable **Structured Signal Profiles**.

### Core Philosophy
1. **Never Force a Single Classification**: In tactical radio environments, signals often suffer from low SNR, multipath fading, or co-channel interference. SpectraSense outputs multiple ranked hypotheses with confidence intervals rather than forced brittle predictions.
2. **Bounded Refinement Loop**: When initial verification is marginal, the orchestrator triggers targeted refinement (fine carrier frequency tracking, loop bandwidth reduction, matched filter adaptation) before concluding.
3. **Honest Uncertainty**: If a signal fails verification or operates below detection limits, SpectraSense explicitly flags it as **`UNRESOLVED / INCONCLUSIVE`** with specific uncertainty notes, preventing false-alarm intelligence from propagating.

---

## 2. Four-Stage Pipeline Architecture

```
 RAW .IQ / .WAV FILE
         │
         ▼
 ┌────────────────────────────────────────────────────────┐
 │  STAGE 1: INPUT & FORMAT HANDLING                      │
 │  • Auto-detection of float32, int16, or .wav frames    │
 │  • Configurable sample rate and center frequency (Fc)  │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │  STAGE 2: PRE-PROCESSING                               │
 │  • DC offset removal (complex mean subtraction)        │
 │  • Energy normalization (unit variance scaling)        │
 │  • Optional FIR digital bandpass pre-filter            │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │  STAGE 3: CHARACTERIZE (PARAMETER EXTRACTION)          │
 │  • Carrier Frequency (Fc) via spectral peak & centroid │
 │  • 3 dB Bandwidth & 99% Occupied Bandwidth (OBW)       │
 │  • SNR estimation via M2M4 ratio and noise floor       │
 │  • Symbol Rate (Rs) estimation via cyclostationary cues│
 │  • Higher-Order Cumulants (C40, C42)                   │
 │  • Envelope & instantaneous frequency variance         │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │  STAGE 4: HYPOTHESIZE (MULTI-CANDIDATE RANKING)        │
 │  • Multi-hypothesis probabilistic scoring engine       │
 │  • Evidence-backed ranking with confidence %           │
 │  • Never forces a single winner                        │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │  STAGE 5: PROCESS + VALIDATE (DOWNSTREAM VERIFICATION) │
 │  • Demodulation trial against top candidates           │
 │  • Error Vector Magnitude (EVM) calculation            │
 │  • Bounded refinement loop (parameter retuning)        │
 │  • Decision: VALIDATED vs. UNRESOLVED/INCONCLUSIVE     │
 └───────────────────────┬────────────────────────────────┘
                         │
                         ▼
 ┌────────────────────────────────────────────────────────┐
 │  STAGE 6: STRUCTURED SIGNAL PROFILE (OUTPUT)           │
 │  • Standardized JSON data structure with audit trail   │
 │  • Print/PDF-ready HTML intelligence report            │
 └────────────────────────────────────────────────────────┘
```

---

## 3. Windows Native Installation & Run Guide

### Prerequisites
- **OS**: Windows 10 or Windows 11 (64-bit)
- **Python**: Python 3.10, 3.11, or 3.12 (ensure *"Add Python to PATH"* was checked during install)

### Option A: One-Click Quick Launch
Double-click `run.bat` in the project root directory. It will automatically:
1. Verify Python availability
2. Create a clean virtual environment (`venv`)
3. Install all dependencies from `requirements.txt`
4. Generate the synthetic sample datasets
5. Launch the PyQt6 desktop interface

### Option B: Manual Terminal Launch
Open **Command Prompt (cmd.exe)** or **PowerShell** in the project folder:

```cmd
:: 1. Create a Python virtual environment
python -m venv venv

:: 2. Activate the environment
venv\Scripts\activate

:: 3. Install dependencies
pip install -r requirements.txt

:: 4. Generate synthetic demonstration signals
python generate_samples.py

:: 5. Launch the SpectraSense Desktop Application
python main.py
```

---

## 4. Synthetic Demonstration Signals

Located in `samples/`:
1. **`bpsk_25k_18db.iq`**: BPSK modulated carrier at $f_c = 25\text{ kHz}$, $R_s = 10\text{ kBaud}$, $\text{SNR} = 18\text{ dB}$. Demonstrates high $C_{40}$ cumulant alignment.
2. **`qpsk_40k_16db.iq`**: QPSK modulated carrier at $f_c = 40\text{ kHz}$, $R_s = 20\text{ kBaud}$, $\text{SNR} = 16\text{ dB}$. Shows 4-fold constellation clustering and low $C_{40}$.
3. **`2fsk_30k_15db.iq`**: Continuous-phase 2-FSK with tone frequencies at $30\text{ kHz}$ and $45\text{ kHz}$. Demonstrates constant modulus with bimodal instantaneous frequency.
4. **`16qam_bb_22db.iq`**: Baseband 16-QAM signal ($16$ distinct grid states). Highlights multi-ring envelope variance.
5. **`ambiguous_degraded_case.iq`** (*Critical Test Case*): Degraded signal with low SNR ($\approx 3\text{ dB}$), severe phase jitter, and co-channel continuous-wave interference. Demonstrates the system's honest uncertainty: the classifier outputs split probabilities (e.g. QPSK 32%, 8-PSK 28%, Noise 26%), the EVM check fails threshold, and the signal is cleanly flagged as **`UNRESOLVED / INCONCLUSIVE`**.
6. **`audio_fsk_sample.wav`**: Standard 16-bit PCM audio WAV file demonstrating audio/baseband ingest capability.

---

## 5. Structured Signal Profile Specification

The final output is saved as both JSON and formatted HTML. Key schema sections:
- **`metadata`**: Ingest source, timestamps, standard ID, unique profile UUID.
- **`characterization`**: Extracted physical parameters ($F_c$, $F_{centroid}$, $BW_{3\text{dB}}$, $OBW_{99\%}$, $\text{SNR}$, $R_s$, $C_{40}$, $C_{42}$, $\sigma^2_A$, $\sigma^2_f$).
- **`hypotheses_ranked`**: Array of modulation candidates with confidence percentages and physics-informed evidence justifications.
- **`processing_and_validation`**: Top candidate, validation status, EVM %, refinement cycles, processing path used, and uncertainty notes.
- **`orchestration_summary`**: Conclusive status flag and human SIGINT review requirements.

Refer to `sample_output_signal_profile.json` and `sample_output_signal_profile.html` for complete reference output files.

---

## 6. Directory Structure

```
SpectraSense/
├── main.py                             # Windows Desktop entry point
├── run.bat                             # Windows 1-click launch batch script
├── requirements.txt                    # Python dependencies
├── generate_samples.py                 # Synthetic signal generator
├── sample_output_signal_profile.json   # Sample structured profile output
├── sample_output_signal_profile.html   # Sample HTML intelligence report
├── README.md                           # Documentation
├── samples/                            # Sample .iq and .wav test files
└── spectrasense/                       # Modular package
    ├── dsp/
    │   ├── io.py                       # File ingest (.iq, .wav)
    │   ├── preprocess.py               # DC removal, normalization, filtering
    │   └── features.py                 # Parameter & feature extraction
    ├── engine/
    │   ├── hypothesis_engine.py        # Multi-hypothesis ranking engine
    │   ├── validation.py               # Downstream verification & refine loop
    │   ├── profile.py                  # Structured Signal Profile generator
    │   └── pipeline.py                 # Master pipeline orchestrator
    └── gui/
        ├── theme.py                    # Dark tactical stylesheet
        └── main_window.py              # PyQt6 Windows desktop UI
```
