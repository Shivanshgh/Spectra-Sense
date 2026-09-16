"""
SpectraSense Master Pipeline Coordinator
Orchestrates:
  STAGE 1: INPUT & FORMAT HANDLING
  STAGE 2: PRE-PROCESSING (DC removal, normalization, filtering)
  STAGE 3: CHARACTERIZE (Parameter extraction: Fc, BW, SNR, Rs, Cumulants)
  STAGE 4: HYPOTHESIZE (Multi-candidate ranked scoring, honest distribution)
  STAGE 5: PROCESS & VALIDATE (Downstream demod trial, EVM check, refinement loop, unresolved flag)
  STAGE 6: STRUCTURED SIGNAL PROFILE (JSON & HTML report generation)
"""

from spectrasense.dsp.io import read_iq_file, read_wav_file, get_file_metadata, SignalFormat
from spectrasense.dsp.preprocess import preprocess_pipeline
from spectrasense.dsp.features import extract_all_features
from spectrasense.engine.hypothesis_engine import score_hypotheses
from spectrasense.engine.validation import run_process_and_validate
from spectrasense.engine.profile import build_signal_profile, generate_profile_html


class SpectraSensePipeline:
    def __init__(self, sample_rate=200000):
        self.sample_rate = sample_rate
        self.raw_iq = None
        self.preprocessed_iq = None
        self.file_metadata = {}
        self.preprocess_metadata = {}
        self.features = {}
        self.hypotheses = []
        self.validation_result = {}
        self.profile = None

    def load_file(self, filepath, format_type=SignalFormat.FLOAT32_IQ, sample_rate=None):
        """Stage 1: Load file and extract metadata."""
        if sample_rate is not None:
            self.sample_rate = sample_rate
            
        self.file_metadata = get_file_metadata(filepath)
        
        if filepath.lower().endswith(".wav"):
            sig, sr = read_wav_file(filepath)
            self.raw_iq = sig
            self.sample_rate = sr
            self.file_metadata["sample_rate"] = sr
        else:
            self.raw_iq = read_iq_file(filepath, format_type=format_type)
            self.file_metadata["sample_rate"] = self.sample_rate
            
        self.file_metadata["sample_count"] = len(self.raw_iq)
        return self.file_metadata

    def run_preprocess(self, apply_dc=True, apply_norm=True, filter_params=None):
        """Stage 2: Pre-processing."""
        if self.raw_iq is None:
            raise ValueError("No signal loaded. Run load_file() first.")
        self.preprocessed_iq, self.preprocess_metadata = preprocess_pipeline(
            self.raw_iq,
            sample_rate=self.sample_rate,
            apply_dc=apply_dc,
            apply_norm=apply_norm,
            filter_params=filter_params
        )
        return self.preprocess_metadata

    def run_characterize(self):
        """Stage 3: Characterize and extract physical DSP features."""
        sig = self.preprocessed_iq if self.preprocessed_iq is not None else self.raw_iq
        self.features = extract_all_features(sig, self.sample_rate)
        return self.features

    def run_hypothesize(self):
        """Stage 4: Generate multi-candidate ranked hypotheses."""
        if not self.features:
            self.run_characterize()
        self.hypotheses = score_hypotheses(self.features)
        return self.hypotheses

    def run_validation(self, refinement_attempt=0):
        """Stage 5: Downstream process & validation check."""
        if not self.hypotheses:
            self.run_hypothesize()
        top_h = self.hypotheses[0]
        sig = self.preprocessed_iq if self.preprocessed_iq is not None else self.raw_iq
        self.validation_result = run_process_and_validate(
            sig,
            top_h,
            self.features,
            refinement_attempt=refinement_attempt
        )
        return self.validation_result

    def generate_profile(self):
        """Stage 6: Assemble final Structured Signal Profile."""
        self.profile = build_signal_profile(
            self.file_metadata,
            self.preprocess_metadata,
            self.features,
            self.hypotheses,
            self.validation_result
        )
        return self.profile

    def execute_all(self, filepath, sample_rate=200000):
        """Executes full pipeline end-to-end."""
        self.load_file(filepath, sample_rate=sample_rate)
        self.run_preprocess()
        self.run_characterize()
        self.run_hypothesize()
        self.run_validation(refinement_attempt=0)
        
        # Bounded refinement loop: if marginal, attempt 1 bounded refinement cycle
        if self.validation_result.get("status") == "REFINEMENT_RECOMMENDED":
            self.run_validation(refinement_attempt=1)
            
        return self.generate_profile()
