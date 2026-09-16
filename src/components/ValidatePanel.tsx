import React from 'react';
import { ValidationVerdict, CharacterizeFeatures, HypothesisCandidate } from '../types';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';

interface ValidatePanelProps {
  verdict: ValidationVerdict;
  features: CharacterizeFeatures;
  topHypothesis: HypothesisCandidate;
  onRefineLoop: () => void;
  isRunning: boolean;
}

export const ValidatePanel: React.FC<ValidatePanelProps> = ({
  verdict,
  features,
  topHypothesis,
  onRefineLoop,
  isRunning,
}) => {
  const isPass = verdict.passed;
  const isUnresolved = verdict.status === 'UNRESOLVED / INCONCLUSIVE';
  const isRefinementNeeded = verdict.status === 'REFINEMENT_RECOMMENDED';

  return (
    <div className="flex-1 bg-[#0b0f17] p-4 overflow-y-auto space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
          <div>
            <h3 className="font-semibold text-xs text-[#f1f5f9] tracking-wider uppercase">
              STAGE 5: DOWNSTREAM VERIFICATION &amp; BOUNDED REFINEMENT
            </h3>
            <p className="text-[11px] text-[#94a3b8]">
              Automated trial demodulation, EVM residual measurement, and honest uncertainty handling.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#1e293b] text-[#38bdf8] text-[10px] px-2 py-0.5 rounded border border-[#334155] font-mono">
            BOUNDED CYCLES: {verdict.refinementCount} / 2
          </span>
        </div>
      </div>

      {/* Main Status Banner */}
      <div
        className={`rounded-md p-4 border flex items-start justify-between gap-4 ${
          isPass
            ? 'bg-[#06241a] border-[#059669]'
            : isRefinementNeeded
            ? 'bg-[#291b08] border-[#d97706]'
            : 'bg-[#240b0f] border-[#dc2626]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isPass ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            ) : isRefinementNeeded ? (
              <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
            ) : (
              <XCircle className="w-5 h-5 text-[#ef4444]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#f1f5f9] tracking-wide">
                STATUS: {verdict.status}
              </span>
              {verdict.refinementCount > 0 && (
                <span className="bg-[#1e293b] text-[#38bdf8] text-[9px] px-2 py-0.5 rounded font-mono">
                  Cycle #{verdict.refinementCount}
                </span>
              )}
            </div>
            <p className="text-[#cbd5e1] text-xs mt-1 leading-relaxed">{verdict.verdict}</p>
          </div>
        </div>

        {/* Refinement trigger if recommended */}
        {isRefinementNeeded && (
          <button
            onClick={onRefineLoop}
            disabled={isRunning}
            className="px-3 py-2 bg-[#d97706] hover:bg-[#b45309] text-white rounded font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Execute Refinement</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* EVM Meter */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex justify-between items-center text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">Error Vector Magnitude (EVM)</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="text-xl font-mono font-bold text-[#f1f5f9]">
            {verdict.evmPercent !== null ? `${verdict.evmPercent.toFixed(1)}%` : 'N/A (Unresolved)'}
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>Pass Threshold:</span>
            <span className="text-[#10b981]">&le; 18.0% RMS</span>
          </div>
        </div>

        {/* Top Candidate */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex justify-between items-center text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">Trial Demod Target</span>
            <span className="font-mono text-[10px] text-[#38bdf8]">Rank #1</span>
          </div>
          <div className="text-xl font-mono font-bold text-[#38bdf8]">
            {topHypothesis.modulation}
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>Hypothesis Confidence:</span>
            <span className="text-[#f1f5f9]">{topHypothesis.confidencePct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Operating SNR */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex justify-between items-center text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">Operating SNR</span>
            <span className="font-mono text-[10px] text-[#94a3b8]">Input RF</span>
          </div>
          <div className={`text-xl font-mono font-bold ${features.snrDb < 6 ? 'text-[#ef4444]' : 'text-[#f1f5f9]'}`}>
            {features.snrDb.toFixed(1)} dB
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>Min Separation SNR:</span>
            <span className="text-[#94a3b8]">6.0 dB</span>
          </div>
        </div>
      </div>

      {/* Uncertainty & Audit Trail Box */}
      <div className="bg-[#111722] border border-[#1e293b] rounded p-3.5 space-y-2">
        <div className="text-xs font-semibold text-[#f1f5f9] flex items-center justify-between">
          <span>Uncertainty Audit Trail &amp; Evidence Log:</span>
          <span className="text-[10px] text-[#64748b] font-mono">AUDIT VERIFIED</span>
        </div>
        <ul className="space-y-1.5 border-t border-[#1e293b] pt-2 text-[11px] text-[#94a3b8]">
          {verdict.uncertaintyNotes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#38bdf8] font-mono">&bull;</span>
              <span className="text-[#cbd5e1]">{note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Verification Path Applied */}
      <div className="bg-[#0d131d] rounded p-3 border border-[#1a2333] text-[11px]">
        <span className="text-[#94a3b8] font-medium">Applied Receiver Processing Chain:</span>
        <div className="mt-1 font-mono text-[#38bdf8] bg-[#111722] p-2 rounded border border-[#1e293b]">
          {verdict.processingPathUsed}
        </div>
      </div>
    </div>
  );
};
