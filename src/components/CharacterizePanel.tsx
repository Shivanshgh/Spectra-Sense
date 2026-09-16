import React from 'react';
import { CharacterizeFeatures } from '../types';
import { Sliders, Cpu, Gauge, Zap, HelpCircle } from 'lucide-react';

interface CharacterizePanelProps {
  features: CharacterizeFeatures;
}

export const CharacterizePanel: React.FC<CharacterizePanelProps> = ({ features }) => {
  return (
    <div className="flex-1 bg-[#0b0f17] p-4 overflow-y-auto space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#38bdf8]" />
          <div>
            <h3 className="font-semibold text-xs text-[#f1f5f9] tracking-wider uppercase">
              STAGE 3: CHARACTERIZATION &amp; PARAMETER EXTRACTION
            </h3>
            <p className="text-[11px] text-[#94a3b8]">
              Automated physical parameter measurement and higher-order statistical cumulants.
            </p>
          </div>
        </div>
        <span className="bg-[#1e293b] text-[#38bdf8] text-[10px] px-2 py-0.5 rounded border border-[#334155] font-mono">
          DSP METRICS
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Carrier Frequency Card */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">Carrier Frequency (Fc)</span>
            <Gauge className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="text-xl font-mono font-bold text-[#f1f5f9]">
            {(features.carrierFreqHz / 1000).toFixed(2)}{' '}
            <span className="text-xs text-[#64748b] font-normal">kHz</span>
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>Spectral Centroid:</span>
            <span className="text-[#94a3b8]">{(features.carrierCentroidHz / 1000).toFixed(2)} kHz</span>
          </div>
        </div>

        {/* 3 dB Bandwidth Card */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">3 dB &amp; 99% Bandwidth</span>
            <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="text-xl font-mono font-bold text-[#f1f5f9]">
            {(features.bandwidth3dBHz / 1000).toFixed(2)}{' '}
            <span className="text-xs text-[#64748b] font-normal">kHz</span>
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>99% Occupied BW:</span>
            <span className="text-[#94a3b8]">{(features.bandwidth99Hz / 1000).toFixed(2)} kHz</span>
          </div>
        </div>

        {/* SNR Card */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">Estimated SNR (M2M4)</span>
            <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className={`text-xl font-mono font-bold ${features.snrDb < 6 ? 'text-[#ef4444]' : 'text-[#38bdf8]'}`}>
            {features.snrDb.toFixed(1)}{' '}
            <span className="text-xs text-[#64748b] font-normal">dB</span>
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>Reliability Status:</span>
            <span className={features.snrDb < 6 ? 'text-[#ef4444] font-semibold' : 'text-[#10b981]'}>
              {features.snrDb < 6 ? 'DEGRADED (<6 dB)' : 'ACCEPTABLE (>8 dB)'}
            </span>
          </div>
        </div>

        {/* Symbol Rate Card */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">Symbol Rate (Rs)</span>
            <Gauge className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="text-xl font-mono font-bold text-[#f1f5f9]">
            {features.symbolRateBaud.toLocaleString()}{' '}
            <span className="text-xs text-[#64748b] font-normal">Baud</span>
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>Samples / Symbol:</span>
            <span className="text-[#94a3b8]">{features.samplesPerSymbol} pts</span>
          </div>
        </div>

        {/* Higher-Order Cumulants Card */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">4th Order Cumulants</span>
            <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="text-base font-mono font-bold text-[#f1f5f9]">
            |C40|: <span className="text-[#38bdf8]">{features.cumulantC40.toFixed(3)}</span>
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>|C42| (Kurtosis):</span>
            <span className="text-[#94a3b8]">{features.cumulantC42.toFixed(3)}</span>
          </div>
        </div>

        {/* Envelope & Frequency Variance Card */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-3">
          <div className="flex items-center justify-between text-[#94a3b8] mb-1">
            <span className="font-medium text-[11px]">Envelope &amp; Freq Variance</span>
            <Cpu className="w-3.5 h-3.5 text-[#38bdf8]" />
          </div>
          <div className="text-base font-mono font-bold text-[#f1f5f9]">
            &sigma;&sup2;<sub>amp</sub>: <span className="text-[#38bdf8]">{features.envelopeVariance.toFixed(4)}</span>
          </div>
          <div className="mt-2 text-[10px] text-[#64748b] font-mono border-t border-[#1e293b] pt-1.5 flex justify-between">
            <span>&sigma;&sup2;<sub>freq</sub> (Hz&sup2;):</span>
            <span className="text-[#94a3b8]">{features.freqInstVariance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Methodological Context Callout */}
      <div className="bg-[#111722] border border-[#222e40] rounded-md p-3.5 text-[11px] text-[#94a3b8] leading-relaxed">
        <div className="flex items-center gap-1.5 font-semibold text-[#f1f5f9] mb-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>Physics-Informed Feature Separation Rationale</span>
        </div>
        <p>
          - <strong>C40 &amp; C42 Cumulants</strong>: High |C40| (&gt;0.45) cleanly isolates BPSK due to its strict 2-fold phase symmetry, whereas QPSK and 8-PSK have near-zero C40.
          <br />
          - <strong>Envelope Variance (&sigma;&sup2;<sub>amp</sub>)</strong>: Constant envelope PSK and FSK signals maintain &sigma;&sup2;<sub>amp</sub> &lt; 0.03. In contrast, 16-QAM produces &sigma;&sup2;<sub>amp</sub> &ge; 0.05 due to its 3 distinct concentric energy rings.
          <br />
          - <strong>Instantaneous Frequency Variance (&sigma;&sup2;<sub>freq</sub>)</strong>: 2-FSK signals exhibit elevated frequency variance with bimodal clustering, distinct from discrete phase keying.
        </p>
      </div>
    </div>
  );
};
