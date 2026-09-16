import React, { useState } from 'react';
import { StructuredSignalProfile } from '../types';
import { FileText, Code, Copy, Check, Download, ShieldCheck, AlertOctagon } from 'lucide-react';

interface ProfileViewProps {
  profile: StructuredSignalProfile;
  onExportJson: () => void;
  onExportHtml: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, onExportJson, onExportHtml }) => {
  const [viewMode, setViewMode] = useState<'report' | 'json'>('report');
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(profile, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isConclusive = profile.orchestrationSummary.verdictIsConclusive;

  return (
    <div className="flex-1 bg-[#0b0f17] p-4 overflow-y-auto space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#38bdf8]" />
          <div>
            <h3 className="font-semibold text-xs text-[#f1f5f9] tracking-wider uppercase">
              STAGE 6: STRUCTURED SIGNAL PROFILE &amp; EVIDENCE ARTIFACT
            </h3>
            <p className="text-[11px] text-[#94a3b8]">
              Standardized JSON data structure with complete DSP audit log for downstream consumers.
            </p>
          </div>
        </div>

        {/* View mode toggle & Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-[#111722] border border-[#1e293b] rounded p-0.5 flex">
            <button
              onClick={() => setViewMode('report')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'report' ? 'bg-[#0284c7] text-white' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Formatted Report
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'json' ? 'bg-[#0284c7] text-white' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              JSON Inspector
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#283548] text-[#cbd5e1] border border-[#334155] flex items-center gap-1.5 transition-colors text-[11px]"
            title="Copy Profile JSON"
          >
            {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={onExportJson}
            className="px-2.5 py-1 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center gap-1.5 transition-colors text-[11px]"
          >
            <Download className="w-3 h-3" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {viewMode === 'json' ? (
        /* Raw JSON inspector */
        <div className="bg-[#0d121c] border border-[#1e293b] rounded-md p-4 font-mono text-[11px] text-[#38bdf8] overflow-x-auto leading-relaxed shadow-inner">
          <pre>{jsonString}</pre>
        </div>
      ) : (
        /* Formatted Military Intelligence Report */
        <div className="bg-[#111722] border border-[#1e293b] rounded-md p-5 space-y-5 text-[#cbd5e1]">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b border-[#222e40] pb-4">
            <div>
              <div className="text-base font-bold text-[#f1f5f9] tracking-wider">
                SPECTRASENSE STRUCTURED SIGNAL PROFILE
              </div>
              <div className="text-[11px] text-[#94a3b8] font-mono mt-0.5">
                Standard: {profile.metadata.standard} &bull; Profile ID: {profile.metadata.profileId}
              </div>
              <div className="text-[10px] text-[#64748b] font-mono mt-0.5">
                Captured: {profile.metadata.timestampUtc} | Source: {profile.metadata.sourceFile}
              </div>
            </div>

            <div
              className={`px-3 py-1.5 rounded border flex items-center gap-2 ${
                isConclusive
                  ? 'bg-[#06241a] border-[#059669] text-[#10b981]'
                  : 'bg-[#240b0f] border-[#dc2626] text-[#ef4444]'
              }`}
            >
              {isConclusive ? (
                <ShieldCheck className="w-4 h-4" />
              ) : (
                <AlertOctagon className="w-4 h-4" />
              )}
              <div className="text-right">
                <div className="font-bold text-xs uppercase tracking-wide">
                  {isConclusive ? 'CONCLUSIVE INTELLIGENCE' : 'INCONCLUSIVE / UNRESOLVED'}
                </div>
                <div className="text-[9px] opacity-80 font-mono">
                  {isConclusive ? 'Auto-Classification Verified' : 'Human Review Required'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Characterized Parameters */}
          <div>
            <div className="text-xs font-semibold text-[#f1f5f9] tracking-wider uppercase mb-2">
              1. Extracted Signal Parameters
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="bg-[#161f2e] p-2 rounded border border-[#202c3e]">
                <div className="text-[#64748b] text-[10px]">Carrier Freq (Fc)</div>
                <div className="text-[#f1f5f9] font-bold">
                  {(profile.characterization.carrierFrequencyHz / 1000).toFixed(2)} kHz
                </div>
              </div>
              <div className="bg-[#161f2e] p-2 rounded border border-[#202c3e]">
                <div className="text-[#64748b] text-[10px]">3 dB Bandwidth</div>
                <div className="text-[#f1f5f9] font-bold">
                  {(profile.characterization.bandwidth3dBHz / 1000).toFixed(2)} kHz
                </div>
              </div>
              <div className="bg-[#161f2e] p-2 rounded border border-[#202c3e]">
                <div className="text-[#64748b] text-[10px]">Estimated SNR</div>
                <div className="text-[#38bdf8] font-bold">
                  {profile.characterization.estimatedSnrDb.toFixed(1)} dB
                </div>
              </div>
              <div className="bg-[#161f2e] p-2 rounded border border-[#202c3e]">
                <div className="text-[#64748b] text-[10px]">Symbol Rate (Rs)</div>
                <div className="text-[#f1f5f9] font-bold">
                  {profile.characterization.symbolRateBaud.toLocaleString()} Baud
                </div>
              </div>
              <div className="bg-[#161f2e] p-2 rounded border border-[#202c3e]">
                <div className="text-[#64748b] text-[10px]">Cumulant |C40|</div>
                <div className="text-[#f1f5f9] font-bold">
                  {profile.characterization.cumulantC40.toFixed(3)}
                </div>
              </div>
              <div className="bg-[#161f2e] p-2 rounded border border-[#202c3e]">
                <div className="text-[#64748b] text-[10px]">Cumulant |C42|</div>
                <div className="text-[#f1f5f9] font-bold">
                  {profile.characterization.cumulantC42.toFixed(3)}
                </div>
              </div>
              <div className="bg-[#161f2e] p-2 rounded border border-[#202c3e]">
                <div className="text-[#64748b] text-[10px]">Envelope Variance</div>
                <div className="text-[#f1f5f9] font-bold">
                  {profile.characterization.envelopeVariance.toFixed(4)}
                </div>
              </div>
              <div className="bg-[#161f2e] p-2 rounded border border-[#202c3e]">
                <div className="text-[#64748b] text-[10px]">Residual EVM</div>
                <div className="text-[#10b981] font-bold">
                  {profile.processingAndValidation.evmPercent !== null
                    ? `${profile.processingAndValidation.evmPercent.toFixed(1)}%`
                    : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Ranked Hypotheses Table */}
          <div>
            <div className="text-xs font-semibold text-[#f1f5f9] tracking-wider uppercase mb-2">
              2. Competing Hypotheses &amp; Physics Evidence Chain
            </div>
            <div className="border border-[#202c3e] rounded overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#161f2e] text-[#94a3b8] font-mono text-[10px] border-b border-[#202c3e]">
                  <tr>
                    <th className="p-2">Rank</th>
                    <th className="p-2">Modulation</th>
                    <th className="p-2">Confidence</th>
                    <th className="p-2">Evidence Cues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]">
                  {profile.hypothesesRanked.map((h) => (
                    <tr key={h.rank} className="hover:bg-[#141b27]">
                      <td className="p-2 font-mono text-[#38bdf8]">#{h.rank}</td>
                      <td className="p-2 font-semibold text-[#f1f5f9]">{h.modulation}</td>
                      <td className="p-2 font-mono">{h.confidencePct.toFixed(1)}%</td>
                      <td className="p-2 text-[#94a3b8]">{h.evidence.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Verification Verdict */}
          <div>
            <div className="text-xs font-semibold text-[#f1f5f9] tracking-wider uppercase mb-2">
              3. Processing Trial &amp; Downstream Verification Audit
            </div>
            <div className="bg-[#161f2e] rounded p-3 border border-[#202c3e] space-y-1.5 font-mono text-[11px]">
              <div>
                <span className="text-[#64748b]">Top Candidate:</span>{' '}
                <span className="text-[#38bdf8] font-bold">
                  {profile.processingAndValidation.topCandidate}
                </span>{' '}
                ({profile.processingAndValidation.topCandidateConfidencePct}%)
              </div>
              <div>
                <span className="text-[#64748b]">Validation Status:</span>{' '}
                <span className={isConclusive ? 'text-[#10b981] font-bold' : 'text-[#ef4444] font-bold'}>
                  {profile.processingAndValidation.validationStatus}
                </span>
              </div>
              <div>
                <span className="text-[#64748b]">Verdict:</span>{' '}
                <span className="text-[#f1f5f9]">{profile.processingAndValidation.validationVerdict}</span>
              </div>
              <div>
                <span className="text-[#64748b]">Refinement Cycles Applied:</span>{' '}
                <span className="text-[#f1f5f9]">
                  {profile.processingAndValidation.refinementCyclesUsed}
                </span>
              </div>
              <div className="pt-2 border-t border-[#202c3e] text-[10px] text-[#94a3b8]">
                <strong>Audit Notes:</strong> {profile.processingAndValidation.uncertaintyNotes.join(' | ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
