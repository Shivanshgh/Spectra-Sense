import React, { useRef } from 'react';
import { 
  Upload, 
  Play, 
  RefreshCw, 
  FileText, 
  Sliders, 
  Database, 
  Sparkles,
  Layers,
  Download
} from 'lucide-react';
import { PreprocessSettings, FileMetadata, SyntheticSignalSpec } from '../types';
import { SYNTHETIC_PRESETS } from '../dsp/signalEngine';

interface SidebarProps {
  metadata: FileMetadata;
  selectedPresetId: string;
  onSelectPreset: (id: string) => void;
  onFileUpload: (file: File) => void;
  preprocess: PreprocessSettings;
  setPreprocess: React.Dispatch<React.SetStateAction<PreprocessSettings>>;
  onRunPipeline: () => void;
  onRefineLoop: () => void;
  onExportJson: () => void;
  onExportHtml: () => void;
  isRunning: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  metadata,
  selectedPresetId,
  onSelectPreset,
  onFileUpload,
  preprocess,
  setPreprocess,
  onRunPipeline,
  onRefineLoop,
  onExportJson,
  onExportHtml,
  isRunning
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <aside aria-label="Control Deck" className="w-80 bg-[#101622] border-r border-[#222e40] flex flex-col shrink-0 overflow-y-auto text-xs text-[#cbd5e1]">
      {/* 1. Stage 1: Ingest & Source */}
      <div className="p-3.5 border-b border-[#222e40]">
        <div className="flex items-center gap-2 mb-2.5">
          <Database className="w-4 h-4 text-[#38bdf8]" />
          <h2 className="font-semibold text-[#f1f5f9] tracking-wide text-xs">STAGE 1: SIGNAL INGEST</h2>
        </div>

        {/* Synthetic Case Selector */}
        <label className="block text-[11px] text-[#94a3b8] mb-1 font-medium">
          Select Benchmark Test Signal:
        </label>
        <select
          value={selectedPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="w-full bg-[#172030] border border-[#2d3b50] rounded px-2.5 py-1.5 text-xs text-[#e2e8f0] focus:border-[#38bdf8] focus:outline-none mb-3"
        >
          {SYNTHETIC_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* File Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#2d3b50] hover:border-[#38bdf8] bg-[#141b27]/80 rounded-md p-3 text-center cursor-pointer transition-colors"
        >
          <Upload className="w-4 h-4 text-[#64748b] mx-auto mb-1" />
          <div className="text-[11px] text-[#94a3b8]">
            Drop <code className="text-[#38bdf8]">.iq</code> or <code className="text-[#38bdf8]">.wav</code> file here
          </div>
          <div className="text-[10px] text-[#64748b] mt-0.5">Click to browse local files</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".iq,.wav,.bin"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onFileUpload(e.target.files[0]);
            }}
          />
        </div>

        {/* Load bundled real files from Vercel static public/samples */}
        <div className="mt-2">
          <label className="block text-[10px] text-[#64748b] mb-1">
            Or test bundled .IQ / .wav file:
          </label>
          <select
            defaultValue=""
            onChange={async (e) => {
              const val = e.target.value;
              if (!val) return;
              try {
                const res = await fetch(`/samples/${val}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const file = new File([blob], val, { type: val.endsWith('.wav') ? 'audio/wav' : 'application/octet-stream' });
                onFileUpload(file);
              } catch (err) {
                console.error('Failed to load sample:', err);
              }
              e.target.value = '';
            }}
            className="w-full bg-[#172030] border border-[#2d3b50] rounded px-2 py-1 text-[11px] text-[#cbd5e1] focus:border-[#38bdf8] focus:outline-none"
          >
            <option value="">Load bundled real file...</option>
            <option value="bpsk_25k_18db.iq">bpsk_25k_18db.iq (RF BPSK, 18 dB)</option>
            <option value="qpsk_40k_16db.iq">qpsk_40k_16db.iq (RF QPSK, 16 dB)</option>
            <option value="2fsk_30k_15db.iq">2fsk_30k_15db.iq (RF 2-FSK, 15 dB)</option>
            <option value="16qam_bb_22db.iq">16qam_bb_22db.iq (Baseband 16-QAM)</option>
            <option value="ambiguous_degraded_case.iq">ambiguous_degraded_case.iq (Low SNR / Spurs)</option>
            <option value="audio_fsk_sample.wav">audio_fsk_sample.wav (Audio WAV)</option>
          </select>
        </div>

        {/* Ingest Stats Card */}
        <div className="mt-3 bg-[#151c2a] rounded p-2.5 border border-[#202c3e] text-[11px] font-mono space-y-1">
          <div className="flex justify-between text-[#94a3b8]">
            <span>Active File:</span>
            <span className="text-[#38bdf8] truncate max-w-[140px]">{metadata.filename}</span>
          </div>
          <div className="flex justify-between text-[#94a3b8]">
            <span>Sample Rate:</span>
            <span className="text-[#f1f5f9]">{(metadata.sampleRate / 1000).toFixed(0)} kS/s</span>
          </div>
          <div className="flex justify-between text-[#94a3b8]">
            <span>Sample Count:</span>
            <span className="text-[#f1f5f9]">{metadata.sampleCount.toLocaleString()} pts</span>
          </div>
          <div className="flex justify-between text-[#94a3b8]">
            <span>Format:</span>
            <span className="text-[#f1f5f9]">{metadata.format}</span>
          </div>
        </div>
      </div>

      {/* 2. Stage 2: Preprocess Settings */}
      <div className="p-3.5 border-b border-[#222e40]">
        <div className="flex items-center gap-2 mb-2.5">
          <Sliders className="w-4 h-4 text-[#38bdf8]" />
          <h2 className="font-semibold text-[#f1f5f9] tracking-wide text-xs">STAGE 2: PRE-PROCESSING</h2>
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preprocess.dcOffsetRemoval}
              onChange={(e) => setPreprocess((prev) => ({ ...prev, dcOffsetRemoval: e.target.checked }))}
              className="rounded border-[#334155] bg-[#1e293b] text-[#0284c7] focus:ring-0"
            />
            <span className="text-[#cbd5e1]">DC Offset Removal</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preprocess.energyNormalization}
              onChange={(e) => setPreprocess((prev) => ({ ...prev, energyNormalization: e.target.checked }))}
              className="rounded border-[#334155] bg-[#1e293b] text-[#0284c7] focus:ring-0"
            />
            <span className="text-[#cbd5e1]">Unit Energy Normalization</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={preprocess.bandpassFilter}
              onChange={(e) => setPreprocess((prev) => ({ ...prev, bandpassFilter: e.target.checked }))}
              className="rounded border-[#334155] bg-[#1e293b] text-[#0284c7] focus:ring-0"
            />
            <span className="text-[#cbd5e1]">Digital Bandpass Pre-filter</span>
          </label>
        </div>
      </div>

      {/* 3. Pipeline Execution Controls */}
      <div className="p-3.5 border-b border-[#222e40] space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-[#38bdf8]" />
          <h2 className="font-semibold text-[#f1f5f9] tracking-wide text-xs">PIPELINE ORCHESTRATION</h2>
        </div>

        <button
          onClick={onRunPipeline}
          disabled={isRunning}
          className="w-full py-2.5 px-3 rounded bg-[#0284c7] hover:bg-[#0369a1] text-white font-medium flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 text-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? 'PROCESSING PIPELINE...' : 'EXECUTE FULL PIPELINE'}</span>
        </button>

        <button
          onClick={onRefineLoop}
          disabled={isRunning}
          className="w-full py-2 px-3 rounded bg-[#1e293b] hover:bg-[#283548] text-[#fbbf24] border border-[#d97706]/40 font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-xs"
          title="Adjusts receiver parameters (loop bandwidth, matched filter) when EVM is marginal"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>TRIGGER BOUNDED REFINEMENT</span>
        </button>
      </div>

      {/* 4. Stage 6: Export & Evidence Actions */}
      <div className="p-3.5 mt-auto">
        <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
          Evidence Artifacts
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onExportJson}
            className="py-1.5 px-2 bg-[#172030] hover:bg-[#1e293b] border border-[#2a384c] rounded text-[11px] text-[#cbd5e1] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3 h-3 text-[#38bdf8]" />
            <span>Profile JSON</span>
          </button>
          <button
            onClick={onExportHtml}
            className="py-1.5 px-2 bg-[#172030] hover:bg-[#1e293b] border border-[#2a384c] rounded text-[11px] text-[#cbd5e1] flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileText className="w-3 h-3 text-[#38bdf8]" />
            <span>Audit HTML</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
