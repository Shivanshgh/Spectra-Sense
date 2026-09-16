import React, { useState } from 'react';
import { 
  Play, 
  RefreshCw, 
  Download, 
  FileText, 
  Sliders, 
  Layers, 
  HelpCircle, 
  Sparkles,
  CheckCircle,
  FileCode
} from 'lucide-react';

interface MenuBarProps {
  onRunPipeline: () => void;
  onRefineLoop: () => void;
  onExportJson: () => void;
  onExportHtml: () => void;
  onOpenPythonModal: () => void;
  onSelectPreset: (id: string) => void;
  activeTab: string;
  setActiveTab: (t: string) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onRunPipeline,
  onRefineLoop,
  onExportJson,
  onExportHtml,
  onOpenPythonModal,
  onSelectPreset,
  activeTab,
  setActiveTab
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggle = (m: string) => setOpenMenu(openMenu === m ? null : m);
  const close = () => setOpenMenu(null);

  return (
    <nav aria-label="Main Menu" className="h-7 bg-[#151c28] border-b border-[#222e40] flex items-center px-2 text-xs text-[#cbd5e1] gap-1 relative select-none">
      {/* File Menu */}
      <div className="relative">
        <button
          onClick={() => toggle('file')}
          className={`px-2.5 py-1 rounded text-[11px] ${openMenu === 'file' ? 'bg-[#1e293b] text-white' : 'hover:bg-[#1e293b]/60'}`}
        >
          File
        </button>
        {openMenu === 'file' && (
          <div className="absolute top-7 left-0 w-64 bg-[#111722] border border-[#2a374a] rounded shadow-2xl py-1 z-50 text-[11px] divide-y divide-[#1e293b]">
            <div className="py-1">
              <button
                onClick={() => { onSelectPreset('bpsk_25k'); close(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#0284c7]/20 hover:text-[#38bdf8] flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Load Synthetic BPSK (25 kHz)</span>
              </button>
              <button
                onClick={() => { onSelectPreset('qpsk_40k'); close(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#0284c7]/20 hover:text-[#38bdf8] flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Load Synthetic QPSK (40 kHz)</span>
              </button>
              <button
                onClick={() => { onSelectPreset('ambiguous_case'); close(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#f59e0b]/20 hover:text-[#fbbf24] flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" />
                <span>Load Ambiguous / Degraded Case</span>
              </button>
            </div>
            <div className="py-1">
              <button
                onClick={() => { onExportJson(); close(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#94a3b8]" />
                <span>Export Profile (JSON)</span>
              </button>
              <button
                onClick={() => { onExportHtml(); close(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-[#94a3b8]" />
                <span>Export Audit Report (HTML)</span>
              </button>
              <button
                onClick={() => { onOpenPythonModal(); close(); }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#0369a1]/30 hover:text-[#38bdf8] flex items-center gap-2 font-medium"
              >
                <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>Download Windows Python Package</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Menu */}
      <div className="relative">
        <button
          onClick={() => toggle('pipeline')}
          className={`px-2.5 py-1 rounded text-[11px] ${openMenu === 'pipeline' ? 'bg-[#1e293b] text-white' : 'hover:bg-[#1e293b]/60'}`}
        >
          Pipeline
        </button>
        {openMenu === 'pipeline' && (
          <div className="absolute top-7 left-0 w-64 bg-[#111722] border border-[#2a374a] rounded shadow-2xl py-1 z-50 text-[11px]">
            <button
              onClick={() => { onRunPipeline(); close(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#0284c7]/20 hover:text-[#38bdf8] flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-[#38bdf8]" />
                Execute All Stages
              </span>
              <span className="text-[#64748b] font-mono text-[10px]">F5</span>
            </button>
            <button
              onClick={() => { onRefineLoop(); close(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#f59e0b]/20 hover:text-[#fbbf24] flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-[#f59e0b]" />
                Trigger Bounded Refinement
              </span>
              <span className="text-[#64748b] font-mono text-[10px]">F6</span>
            </button>
          </div>
        )}
      </div>

      {/* View Menu */}
      <div className="relative">
        <button
          onClick={() => toggle('view')}
          className={`px-2.5 py-1 rounded text-[11px] ${openMenu === 'view' ? 'bg-[#1e293b] text-white' : 'hover:bg-[#1e293b]/60'}`}
        >
          View
        </button>
        {openMenu === 'view' && (
          <div className="absolute top-7 left-0 w-52 bg-[#111722] border border-[#2a374a] rounded shadow-2xl py-1 z-50 text-[11px]">
            <button
              onClick={() => { setActiveTab('visualize'); close(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
            >
              <Layers className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>RF Visualizations</span>
            </button>
            <button
              onClick={() => { setActiveTab('characterize'); close(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
            >
              <Sliders className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>Stage 3: Characterize</span>
            </button>
            <button
              onClick={() => { setActiveTab('hypothesize'); close(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>Stage 4: Hypothesize</span>
            </button>
            <button
              onClick={() => { setActiveTab('validate'); close(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
            >
              <CheckCircle className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>Stage 5: Validation Loop</span>
            </button>
            <button
              onClick={() => { setActiveTab('profile'); close(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>Stage 6: Signal Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="relative">
        <button
          onClick={() => toggle('help')}
          className={`px-2.5 py-1 rounded text-[11px] ${openMenu === 'help' ? 'bg-[#1e293b] text-white' : 'hover:bg-[#1e293b]/60'}`}
        >
          Help
        </button>
        {openMenu === 'help' && (
          <div className="absolute top-7 left-0 w-80 bg-[#111722] border border-[#2a374a] rounded shadow-2xl p-3 z-50 text-[11px]">
            <div className="font-semibold text-[#f1f5f9] mb-1">SpectraSense Intelligence Platform</div>
            <div className="text-[#94a3b8] mb-1.5 leading-relaxed">
              <strong className="text-[#cbd5e1]">Automated analysis of .IQ and .wav files along with signal parameter extraction</strong>
            </div>
            <div className="bg-[#1e293b] p-2 rounded text-[10px] text-[#cbd5e1] font-mono mb-2">
              CHARACTERIZE &rarr; HYPOTHESIZE &rarr; PROCESS &rarr; VALIDATE &rarr; BOUNDED REFINEMENT
            </div>
            <div className="text-[10px] text-[#64748b] leading-tight">
              A workflow orchestration layer connecting SDR tools (GNU Radio, Inspectrum, URH) with structured analyst output and honest uncertainty handling.
            </div>
          </div>
        )}
      </div>

      {/* Click outside dismiss */}
      {openMenu && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={close} />
      )}
    </nav>
  );
};
