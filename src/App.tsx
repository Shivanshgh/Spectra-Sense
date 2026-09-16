import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { MenuBar } from './components/MenuBar';
import { Sidebar } from './components/Sidebar';
import { VisualizationsPanel } from './components/VisualizationsPanel';
import { CharacterizePanel } from './components/CharacterizePanel';
import { HypothesizePanel } from './components/HypothesizePanel';
import { ValidatePanel } from './components/ValidatePanel';
import { ProfileView } from './components/ProfileView';
import { StatusBar } from './components/StatusBar';
import { PythonPackageModal } from './components/PythonPackageModal';
import { 
  ComplexSignal, 
  generateSyntheticSignal, 
  parseUploadedSignal, 
  preprocessSignal, 
  extractFeatures, 
  rankHypotheses, 
  validateHypothesis, 
  buildProfile, 
  SYNTHETIC_PRESETS 
} from './dsp/signalEngine';
import { 
  FileMetadata, 
  PreprocessSettings, 
  CharacterizeFeatures, 
  HypothesisCandidate, 
  ValidationVerdict, 
  StructuredSignalProfile 
} from './types';
import { Layers, Sliders, Sparkles, CheckCircle, FileText } from 'lucide-react';

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('visualize');
  const [isPythonModalOpen, setIsPythonModalOpen] = useState<boolean>(false);

  // Signal State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('qpsk_40k');
  const [rawSignal, setRawSignal] = useState<ComplexSignal>(() =>
    generateSyntheticSignal(SYNTHETIC_PRESETS[1], 200000)
  );
  const [processedSignal, setProcessedSignal] = useState<ComplexSignal>(() =>
    generateSyntheticSignal(SYNTHETIC_PRESETS[1], 200000)
  );

  const [metadata, setMetadata] = useState<FileMetadata>({
    filename: 'qpsk_40k_16db.iq',
    sizeBytes: 131072,
    sampleRate: 200000,
    format: 'Complex Float32 (.iq)',
    sampleCount: 16384,
    durationMs: 81.92,
  });

  const [preprocess, setPreprocess] = useState<PreprocessSettings>({
    dcOffsetRemoval: true,
    energyNormalization: true,
    bandpassFilter: false,
    filterLowKhz: 5,
    filterHighKhz: 80,
  });

  // Pipeline Results
  const [features, setFeatures] = useState<CharacterizeFeatures>(() =>
    extractFeatures(rawSignal)
  );
  const [hypotheses, setHypotheses] = useState<HypothesisCandidate[]>(() =>
    rankHypotheses(extractFeatures(rawSignal))
  );
  const [verdict, setVerdict] = useState<ValidationVerdict>(() =>
    validateHypothesis(hypotheses[0], features, 0)
  );
  const [profile, setProfile] = useState<StructuredSignalProfile>(() =>
    buildProfile(metadata, features, hypotheses, verdict)
  );

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<string>('Ready');
  const [latencyMs, setLatencyMs] = useState<number>(14.2);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  }, []);

  // Pipeline Orchestration
  const executePipeline = useCallback(
    (signalToProcess = rawSignal, customMetadata = metadata, refinementAttempt = 0) => {
      const t0 = performance.now();
      setIsRunning(true);
      setActiveStage('STAGE 2: PRE-PROCESSING');

      // Stage 2: Preprocess
      const pre = preprocessSignal(signalToProcess, preprocess);
      setProcessedSignal(pre);

      // Stage 3: Characterize
      setActiveStage('STAGE 3: CHARACTERIZE');
      const feat = extractFeatures(pre);
      setFeatures(feat);

      // Stage 4: Hypothesize
      setActiveStage('STAGE 4: HYPOTHESIZE');
      const hyps = rankHypotheses(feat);
      setHypotheses(hyps);

      // Stage 5: Process & Validate
      setActiveStage('STAGE 5: PROCESS & VALIDATE');
      const verd = validateHypothesis(hyps[0], feat, refinementAttempt, pre);
      setVerdict(verd);

      // Stage 6: Profile
      setActiveStage('STAGE 6: SIGNAL PROFILE');
      const prof = buildProfile(customMetadata, feat, hyps, verd);
      setProfile(prof);

      const elapsed = performance.now() - t0;
      setLatencyMs(elapsed);
      setIsRunning(false);
      setActiveStage('Completed');
    },
    [rawSignal, metadata, preprocess]
  );

  // Trigger Bounded Refinement Loop (Stage 5 refinement)
  const handleRefineLoop = useCallback(() => {
    const currentAttempt = verdict.refinementCount;
    if (currentAttempt >= 2) {
      showToast('Maximum bounded refinement attempts (2) reached. Signal marked inconclusive.', 'info');
      return;
    }
    executePipeline(rawSignal, metadata, currentAttempt + 1);
  }, [verdict.refinementCount, executePipeline, rawSignal, metadata, showToast]);

  // Load Preset
  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const spec = SYNTHETIC_PRESETS.find((p) => p.id === id) || SYNTHETIC_PRESETS[0];
    const sig = generateSyntheticSignal(spec, 200000);
    const meta: FileMetadata = {
      filename: `${spec.modulation.toLowerCase()}_sample.iq`,
      sizeBytes: sig.i.length * 8,
      sampleRate: sig.sampleRate,
      format: 'Synthetic Complex Float32',
      sampleCount: sig.i.length,
      durationMs: Math.round((sig.i.length / sig.sampleRate) * 100000) / 100,
    };
    setRawSignal(sig);
    setMetadata(meta);
    executePipeline(sig, meta, 0);
  };

  // Upload File Handler (.iq or .wav)
  const handleFileUpload = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const sig = parseUploadedSignal(buffer, file.name);
      const meta: FileMetadata = {
        filename: file.name,
        sizeBytes: file.size,
        sampleRate: sig.sampleRate,
        format: file.name.endsWith('.wav') ? 'RIFF WAV Audio' : 'Raw Complex Float32 (.iq)',
        sampleCount: sig.i.length,
        durationMs: Math.round((sig.i.length / sig.sampleRate) * 100000) / 100,
      };
      setRawSignal(sig);
      setMetadata(meta);
      executePipeline(sig, meta, 0);
    } catch (err) {
      console.error('File parsing error:', err);
      showToast('Error parsing uploaded signal file. Ensure valid .iq float32 or .wav file.', 'error');
    }
  };

  // Profile Exports
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${metadata.filename.replace(/\.[^/.]+$/, '')}_signal_profile.json`;
    a.click();
  };

  const handleExportHtml = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SpectraSense Intelligence Report - ${profile.metadata.profileId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; }
    .card { background: #1e293b; border-radius: 8px; padding: 24px; margin-bottom: 20px; border: 1px solid #334155; }
    h1 { color: #38bdf8; font-size: 22px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { text-align: left; padding: 10px; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; font-size: 11px; text-transform: uppercase; }
    .badge { padding: 4px 10px; border-radius: 4px; font-weight: bold; }
    .badge-pass { background: #065f46; color: #34d399; }
    .badge-unresolved { background: #7f1d1d; color: #f87171; }
  </style>
</head>
<body>
  <div class="card">
    <h1>SPECTRASENSE STRUCTURED SIGNAL PROFILE</h1>
    <p>Standard: ${profile.metadata.standard} | Profile ID: ${profile.metadata.profileId}</p>
    <p>Timestamp: ${profile.metadata.timestampUtc} | Source: ${profile.metadata.sourceFile}</p>
  </div>
  <div class="card">
    <h2>Validation Status</h2>
    <span class="badge ${profile.orchestrationSummary.verdictIsConclusive ? 'badge-pass' : 'badge-unresolved'}">
      ${profile.processingAndValidation.validationStatus}
    </span>
    <p style="margin-top: 10px;">${profile.processingAndValidation.validationVerdict}</p>
    <p>Residual EVM: ${profile.processingAndValidation.evmPercent !== null ? profile.processingAndValidation.evmPercent + '%' : 'N/A'}</p>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.filename.replace(/\.[^/.]+$/, '')}_audit_report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard Shortcuts (F5 = Run Pipeline, F6 = Refinement)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        executePipeline();
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleRefineLoop();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [executePipeline, handleRefineLoop]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d121c] text-[#cbd5e1] overflow-hidden select-none font-sans">
      {/* 1. Title Bar */}
      <TitleBar onOpenPythonModal={() => setIsPythonModalOpen(true)} />

      {/* 2. Menu Bar */}
      <MenuBar
        onRunPipeline={() => executePipeline()}
        onRefineLoop={handleRefineLoop}
        onExportJson={handleExportJson}
        onExportHtml={handleExportHtml}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onSelectPreset={handleSelectPreset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 3. Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side Control Deck */}
        <Sidebar
          metadata={metadata}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          onFileUpload={handleFileUpload}
          preprocess={preprocess}
          setPreprocess={setPreprocess}
          onRunPipeline={() => executePipeline()}
          onRefineLoop={handleRefineLoop}
          onExportJson={handleExportJson}
          onExportHtml={handleExportHtml}
          isRunning={isRunning}
        />

        {/* Center Main Stage Tabs */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0b0f17]">
          {/* Workflow Tabs Header */}
          <nav aria-label="Workflow Stages" className="h-9 bg-[#111722] border-b border-[#222e40] flex items-center px-3 gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('visualize')}
              className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'visualize'
                  ? 'bg-[#1e293b] text-[#38bdf8] border border-[#2d3b50]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>RF Visualizations</span>
            </button>

            <button
              onClick={() => setActiveTab('characterize')}
              className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'characterize'
                  ? 'bg-[#1e293b] text-[#38bdf8] border border-[#2d3b50]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Stage 3: Characterize</span>
            </button>

            <button
              onClick={() => setActiveTab('hypothesize')}
              className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'hypothesize'
                  ? 'bg-[#1e293b] text-[#38bdf8] border border-[#2d3b50]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stage 4: Hypothesize</span>
              <span className="bg-[#0284c7]/20 text-[#38bdf8] text-[10px] px-1.5 rounded font-mono">
                {hypotheses.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('validate')}
              className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'validate'
                  ? 'bg-[#1e293b] text-[#38bdf8] border border-[#2d3b50]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Stage 5: Validation Loop</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`h-7 px-3 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                activeTab === 'profile'
                  ? 'bg-[#1e293b] text-[#38bdf8] border border-[#2d3b50]'
                  : 'text-[#94a3b8] hover:text-[#e2e8f0]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Stage 6: Signal Profile</span>
            </button>
          </nav>

          {/* Active Tab View */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'visualize' && (
              <VisualizationsPanel signal={processedSignal} features={features} />
            )}
            {activeTab === 'characterize' && (
              <CharacterizePanel features={features} />
            )}
            {activeTab === 'hypothesize' && (
              <HypothesizePanel hypotheses={hypotheses} />
            )}
            {activeTab === 'validate' && (
              <ValidatePanel
                verdict={verdict}
                features={features}
                topHypothesis={hypotheses[0]}
                onRefineLoop={handleRefineLoop}
                isRunning={isRunning}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileView
                profile={profile}
                onExportJson={handleExportJson}
                onExportHtml={handleExportHtml}
              />
            )}
          </div>
        </main>
      </div>

      {/* 4. Windows Desktop Bottom Status Bar */}
      <StatusBar
        metadata={metadata}
        verdict={verdict}
        activeStage={activeStage}
        latencyMs={latencyMs}
      />

      {/* 5. Python PyQt6 Desktop Package Modal */}
      <PythonPackageModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
      />

      {/* 6. Floating Notification Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-8 right-6 z-50 px-4 py-2.5 rounded-md border text-xs shadow-2xl flex items-center gap-2 transition-all ${
            toast.type === 'error'
              ? 'bg-[#450a0a] border-[#b91c1c] text-[#fca5a5]'
              : toast.type === 'success'
              ? 'bg-[#064e3b] border-[#059669] text-[#6ee7b7]'
              : 'bg-[#1e293b] border-[#38bdf8] text-[#e0f2fe]'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-[#94a3b8] hover:text-[#f8fafc] font-bold"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
export default App;
