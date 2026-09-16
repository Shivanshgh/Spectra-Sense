/**
 * SpectraSense Type Definitions
 * SIH 2026 Problem Statement ID 26147 (NTRO / Space Technology)
 */

export interface FileMetadata {
  filename: string;
  sizeBytes: number;
  sampleRate: number;
  format: string;
  sampleCount: number;
  durationMs: number;
}

export interface PreprocessSettings {
  dcOffsetRemoval: boolean;
  energyNormalization: boolean;
  bandpassFilter: boolean;
  filterLowKhz: number;
  filterHighKhz: number;
}

export interface CharacterizeFeatures {
  carrierFreqHz: number;
  carrierCentroidHz: number;
  bandwidth3dBHz: number;
  bandwidth99Hz: number;
  snrDb: number;
  symbolRateBaud: number;
  samplesPerSymbol: number;
  cumulantC40: number;
  cumulantC42: number;
  envelopeVariance: number;
  freqInstVariance: number;
}

export interface HypothesisCandidate {
  rank: number;
  modulation: string;
  confidencePct: number;
  evidence: string[];
  suggestedPipeline: string;
}

export interface ValidationVerdict {
  status: 'VALIDATED' | 'REFINEMENT_RECOMMENDED' | 'VALIDATED (AFTER REFINEMENT)' | 'UNRESOLVED / INCONCLUSIVE';
  verdict: string;
  evmPercent: number | null;
  refinementCount: number;
  uncertaintyNotes: string[];
  processingPathUsed: string;
  passed: boolean;
}

export interface StructuredSignalProfile {
  metadata: {
    application: string;
    standard: string;
    timestampUtc: string;
    profileId: string;
    sourceFile: string;
    fileSizeBytes: number;
    fileFormat: string;
  };
  characterization: {
    carrierFrequencyHz: number;
    carrierCentroidHz: number;
    bandwidth3dBHz: number;
    occupiedBandwidth99Hz: number;
    estimatedSnrDb: number;
    symbolRateBaud: number;
    samplesPerSymbol: number;
    cumulantC40: number;
    cumulantC42: number;
    envelopeVariance: number;
    instFreqVariance: number;
  };
  hypothesesRanked: HypothesisCandidate[];
  processingAndValidation: {
    topCandidate: string;
    topCandidateConfidencePct: number;
    validationStatus: string;
    validationVerdict: string;
    evmPercent: number | null;
    refinementCyclesUsed: number;
    processingPipeline: string;
    uncertaintyNotes: string[];
  };
  orchestrationSummary: {
    evidenceChainComplete: boolean;
    verdictIsConclusive: boolean;
    requiresHumanSigintReview: boolean;
  };
}

export interface SyntheticSignalSpec {
  id: string;
  name: string;
  modulation: string;
  carrierKhz: number;
  symbolRateKbaud: number;
  snrDb: number;
  isAmbiguous?: boolean;
  description: string;
}
