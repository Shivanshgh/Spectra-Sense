import React from 'react';
import { Activity, Minus, Square, X, ShieldAlert, Cpu } from 'lucide-react';

interface TitleBarProps {
  onOpenPythonModal: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenPythonModal }) => {
  return (
    <header className="h-9 bg-[#111722] border-b border-[#222e40] flex items-center justify-between px-3 select-none text-xs text-[#94a3b8] shrink-0">
      {/* Left: Branding */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-5 h-5 rounded bg-[#0284c7]/20 border border-[#0284c7]/50 text-[#38bdf8]">
          <Activity className="w-3.5 h-3.5" />
        </div>
        <span className="font-semibold text-[#f1f5f9] tracking-wider text-xs">SPECTRASENSE</span>
        <span className="text-[#475569]">|</span>
        <span className="text-[#94a3b8] font-mono text-[11px]">Workflow Orchestration &amp; Evidence Layer</span>
        <span className="bg-[#1e293b] text-[#38bdf8] text-[10px] px-2 py-0.5 rounded border border-[#334155] font-mono">
          IQ &amp; WAV Analysis Engine
        </span>
      </div>

      {/* Right: Controls & Windows Chrome */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenPythonModal}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0369a1]/30 hover:bg-[#0369a1]/50 text-[#38bdf8] border border-[#0284c7]/40 text-[11px] font-medium transition-colors"
          title="View &amp; Download Native Windows PyQt6 Python Code"
        >
          <Cpu className="w-3 h-3" />
          <span>Windows PyQt6 Code</span>
        </button>

        <div className="flex items-center text-[#64748b] ml-2">
          <div className="w-7 h-6 flex items-center justify-center hover:bg-[#1e293b] hover:text-[#e2e8f0] rounded cursor-pointer transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </div>
          <div className="w-7 h-6 flex items-center justify-center hover:bg-[#1e293b] hover:text-[#e2e8f0] rounded cursor-pointer transition-colors">
            <Square className="w-2.5 h-2.5" />
          </div>
          <div className="w-7 h-6 flex items-center justify-center hover:bg-[#ef4444] hover:text-white rounded cursor-pointer transition-colors">
            <X className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </header>
  );
};
