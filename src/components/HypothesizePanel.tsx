import React from 'react';
import { HypothesisCandidate } from '../types';
import { Sparkles, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

interface HypothesizePanelProps {
  hypotheses: HypothesisCandidate[];
}

export const HypothesizePanel: React.FC<HypothesizePanelProps> = ({ hypotheses }) => {
  return (
    <div className="flex-1 bg-[#0b0f17] p-4 overflow-y-auto space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#38bdf8]" />
          <div>
            <h3 className="font-semibold text-xs text-[#f1f5f9] tracking-wider uppercase">
              STAGE 4: MULTI-HYPOTHESIS GENERATION &amp; RANKING
            </h3>
            <p className="text-[11px] text-[#94a3b8]">
              Probabilistic ranking of candidate modulations backed by physics-informed evidence.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#1e293b] text-[#38bdf8] text-[10px] px-2 py-0.5 rounded border border-[#334155] font-mono">
            {hypotheses.length} CANDIDATES EVALUATED
          </span>
        </div>
      </div>

      {/* Philosophy Banner */}
      <div className="bg-[#111c2e] border-l-4 border-[#38bdf8] p-3 rounded-r text-[11px] text-[#cbd5e1] flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#f1f5f9]">Strict Core Mandate: Multi-Hypothesis Ranking</span>
          <p className="text-[#94a3b8] mt-0.5 leading-relaxed">
            In tactical SIGINT and space technology, forcing a single hard decision on noisy or fading signals is dangerous. SpectraSense presents multiple ranked hypotheses with confidence intervals and audit evidence, passing candidate pipelines to downstream verification.
          </p>
        </div>
      </div>

      {/* Candidates List / Cards */}
      <div className="space-y-3">
        {hypotheses.map((cand) => {
          const isTop = cand.rank === 1;
          const isUnresolved = cand.modulation.includes('Unresolved');

          return (
            <div
              key={cand.modulation}
              className={`rounded-md border p-3.5 transition-all ${
                isTop
                  ? isUnresolved
                    ? 'bg-[#1e1416] border-[#7f1d1d]'
                    : 'bg-[#111c2e] border-[#0284c7]/50 shadow-sm'
                  : 'bg-[#111722] border-[#1e293b]'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                      isTop
                        ? isUnresolved
                          ? 'bg-[#ef4444] text-white'
                          : 'bg-[#0284c7] text-white'
                        : 'bg-[#1e293b] text-[#94a3b8]'
                    }`}
                  >
                    #{cand.rank}
                  </span>
                  <div>
                    <div className="font-semibold text-sm text-[#f1f5f9] flex items-center gap-2">
                      <span>{cand.modulation}</span>
                      {isTop && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                            isUnresolved
                              ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40'
                              : 'bg-[#0284c7]/20 text-[#38bdf8] border border-[#0284c7]/40'
                          }`}
                        >
                          Top Candidate
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#64748b] font-mono">
                      Confidence: {cand.confidencePct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Meter */}
                <div className="w-36 text-right">
                  <div className="font-mono font-bold text-sm text-[#f1f5f9]">
                    {cand.confidencePct.toFixed(1)}%
                  </div>
                  <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full ${
                        isUnresolved ? 'bg-[#ef4444]' : isTop ? 'bg-[#38bdf8]' : 'bg-[#64748b]'
                      }`}
                      style={{ width: `${Math.min(100, cand.confidencePct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Evidence Cues */}
              <div className="mt-2 pt-2 border-t border-[#1e293b]/60">
                <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
                  Physics Evidence Drivers:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#cbd5e1]">
                  {cand.evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              {/* Suggested Pipeline Route */}
              <div className="mt-2.5 bg-[#0d131d] rounded p-2 border border-[#1a2333] flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5 text-[#94a3b8]">
                  <ArrowRight className="w-3 h-3 text-[#38bdf8]" />
                  <span>Downstream Demod Path:</span>
                </div>
                <span className="font-mono text-[#38bdf8]">{cand.suggestedPipeline}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
