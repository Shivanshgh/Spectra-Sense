import React from 'react';
import { ValidationVerdict, FileMetadata } from '../types';
import { Activity, ShieldCheck, AlertTriangle, XCircle, HardDrive } from 'lucide-react';

interface StatusBarProps {
  metadata: FileMetadata;
  verdict: ValidationVerdict;
  activeStage: string;
  latencyMs: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  metadata,
  verdict,
  activeStage,
  latencyMs
}) => {
  const isPass = verdict.passed;
  const isUnresolved = verdict.status === 'UNRESOLVED / INCONCLUSIVE';

  return (
    <footer className="h-6 bg-[#0e131d] border-t border-[#1e293b] flex items-center justify-between px-3 text-[11px] text-[#94a3b8] font-mono select-none shrink-0">
      {/* Left items */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[#38bdf8]">
          <Activity className="w-3 h-3" />
          <span>Stage: {activeStage}</span>
        </div>
        <span className="text-[#334155]">|</span>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3 h-3 text-[#64748b]" />
          <span>{metadata.filename}</span>
          <span className="text-[#64748b]">({(metadata.sizeBytes / 1024).toFixed(1)} KB)</span>
        </div>
        <span className="text-[#334155]">|</span>
        <div>
          <span>Fs: </span>
          <span className="text-[#f1f5f9]">{(metadata.sampleRate / 1000).toFixed(0)} kS/s</span>
        </div>
        <span className="text-[#334155]">|</span>
        <div>
          <span>Pts: </span>
          <span className="text-[#f1f5f9]">{metadata.sampleCount.toLocaleString()}</span>
        </div>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3">
        <div>
          <span>DSP Latency: </span>
          <span className="text-[#38bdf8]">{latencyMs.toFixed(1)} ms</span>
        </div>
        <span className="text-[#334155]">|</span>
        <div className="flex items-center gap-1.5">
          {isPass ? (
            <span className="flex items-center gap-1 text-[#10b981] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{verdict.status}</span>
            </span>
          ) : isUnresolved ? (
            <span className="flex items-center gap-1 text-[#ef4444] font-semibold">
              <XCircle className="w-3.5 h-3.5" />
              <span>UNRESOLVED</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[#f59e0b] font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>REFINEMENT</span>
            </span>
          )}
        </div>
      </div>
    </footer>
  );
};
