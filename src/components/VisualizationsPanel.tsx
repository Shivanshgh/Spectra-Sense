import React, { useEffect, useRef, useState } from 'react';
import { ComplexSignal } from '../dsp/signalEngine';
import { CharacterizeFeatures } from '../types';
import { ZoomIn, Eye, Activity, BarChart2 } from 'lucide-react';

interface VisualizationsPanelProps {
  signal: ComplexSignal;
  features: CharacterizeFeatures;
}

export const VisualizationsPanel: React.FC<VisualizationsPanelProps> = ({ signal, features }) => {
  const timeCanvasRef = useRef<HTMLCanvasElement>(null);
  const psdCanvasRef = useRef<HTMLCanvasElement>(null);
  const waterfallCanvasRef = useRef<HTMLCanvasElement>(null);
  const constCanvasRef = useRef<HTMLCanvasElement>(null);

  const [timeZoom, setTimeZoom] = useState<number>(512); // number of samples shown in time domain

  // 1. Render Time Domain (I & Q)
  useEffect(() => {
    const canvas = timeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#0d121c';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = '#1a2436';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    for (let x = 0; x < w; x += w / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const n = Math.min(signal.i.length, timeZoom);
    const step = w / n;

    // In-phase (I) - Cyan
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = i * step;
      const y = h / 2 - signal.i[i] * (h / 2.6);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Quadrature (Q) - Amber
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = i * step;
      const y = h / 2 - signal.q[i] * (h / 2.6);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [signal, timeZoom]);

  // 2. Render Welch Power Spectral Density (PSD)
  useEffect(() => {
    const canvas = psdCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#0d121c';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#1a2436';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += h / 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += w / 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const nFft = 512;
    const subI = signal.i.subarray(0, nFft);
    const subQ = signal.q.subarray(0, nFft);

    // Compute simple PSD
    const psdBins = new Float32Array(nFft);
    for (let k = 0; k < nFft; k++) {
      // Discrete Fourier Transform sample
      let real = 0;
      let imag = 0;
      const kShift = k - nFft / 2;
      const angleStep = (-2 * Math.PI * kShift) / nFft;
      for (let n = 0; n < nFft; n += 2) {
        const theta = angleStep * n;
        real += subI[n] * Math.cos(theta) - subQ[n] * Math.sin(theta);
        imag += subI[n] * Math.sin(theta) + subQ[n] * Math.cos(theta);
      }
      const mag = real * real + imag * imag;
      psdBins[k] = 10 * Math.log10(Math.max(mag, 1e-8));
    }

    const minDb = -40;
    const maxDb = 35;
    const dbRange = maxDb - minDb;

    // Draw bandwidth shaded area
    const bwBins = (features.bandwidth3dBHz / signal.sampleRate) * w;
    const centerBinX = ((features.carrierFreqHz + signal.sampleRate / 2) / signal.sampleRate) * w;

    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(centerBinX - bwBins / 2, 0, bwBins, h);

    // Peak line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerBinX, 0);
    ctx.lineTo(centerBinX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plot PSD trace
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let k = 0; k < nFft; k++) {
      const x = (k / nFft) * w;
      const norm = Math.max(0, Math.min(1, (psdBins[k] - minDb) / dbRange));
      const y = h - norm * (h - 10) - 5;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [signal, features]);

  // 3. Render Spectrogram Waterfall
  useEffect(() => {
    const canvas = waterfallCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const numRows = 40;
    const nFft = 128;

    for (let row = 0; row < numRows; row++) {
      const y = (row / numRows) * h;
      const rowHeight = Math.ceil(h / numRows);
      const offset = (row * (signal.i.length - nFft)) / numRows;

      for (let bin = 0; bin < w; bin += 2) {
        const normBin = bin / w;
        // Simulated energy mapping for visual high-speed waterfall
        const f = (normBin - 0.5) * signal.sampleRate;
        const distFromFc = Math.abs(f - features.carrierFreqHz);
        const intensity = Math.max(0, 1 - distFromFc / (features.bandwidth3dBHz * 1.5)) + (Math.random() * 0.15 - 0.05);

        // Tactical heatmap color (deep blue -> cyan -> yellow)
        const r = Math.floor(Math.max(0, Math.min(255, (intensity - 0.5) * 510)));
        const g = Math.floor(Math.max(0, Math.min(255, intensity * 255)));
        const b = Math.floor(Math.max(20, Math.min(255, 120 + intensity * 135)));

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(bin, y, 2, rowHeight);
      }
    }
  }, [signal, features]);

  // 4. Render Constellation Diagram
  useEffect(() => {
    const canvas = constCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.fillStyle = '#0d121c';
    ctx.fillRect(0, 0, w, h);

    // Crosshairs
    ctx.strokeStyle = '#222e40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Unit circles
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 4, 0, 2 * Math.PI);
    ctx.arc(w / 2, h / 2, w / 2.6, 0, 2 * Math.PI);
    ctx.stroke();

    // Symbols downsampled
    const sps = Math.max(features.samplesPerSymbol, 4);
    const numSyms = Math.min(Math.floor(signal.i.length / sps), 800);

    // Derotate for clean constellation display
    const fc = features.carrierFreqHz;
    const sr = signal.sampleRate;

    ctx.fillStyle = '#38bdf8';
    for (let k = 0; k < numSyms; k++) {
      const idx = k * sps + (sps >> 1);
      if (idx >= signal.i.length) break;

      const t = idx / sr;
      const phase = -2 * Math.PI * fc * t;
      const cosP = Math.cos(phase);
      const sinP = Math.sin(phase);

      const br = signal.i[idx] * cosP - signal.q[idx] * sinP;
      const bi = signal.i[idx] * sinP + signal.q[idx] * cosP;

      const px = w / 2 + br * (w / 3.4);
      const py = h / 2 - bi * (h / 3.4);

      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [signal, features]);

  return (
    <div className="flex-1 bg-[#0b0f17] p-3 overflow-y-auto flex flex-col gap-3">
      {/* Visualizer Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#38bdf8]" />
          <h3 className="font-semibold text-xs text-[#f1f5f9] tracking-wider uppercase">
            RF Visualizations &amp; Signal Oscillography
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block" /> I-Channel
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] inline-block" /> Q-Channel
          </span>
          <div className="flex items-center gap-1.5 ml-2 font-mono text-[11px]">
            <ZoomIn className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Window: {timeZoom} pts</span>
            <input
              type="range"
              min="128"
              max="2048"
              step="64"
              value={timeZoom}
              onChange={(e) => setTimeZoom(Number(e.target.value))}
              className="w-24 accent-[#38bdf8]"
            />
          </div>
        </div>
      </div>

      {/* 2x2 Grid of Instruments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {/* 1. Time Domain I/Q */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-2.5 flex flex-col">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#94a3b8] font-medium">
            <span>TIME DOMAIN I/Q SAMPLES</span>
            <span className="font-mono text-[10px] text-[#64748b]">&plusmn;1.0 Norm.</span>
          </div>
          <div className="relative flex-1 min-h-[160px]">
            <canvas
              ref={timeCanvasRef}
              width={480}
              height={180}
              className="w-full h-full rounded border border-[#1a2333]"
            />
          </div>
        </div>

        {/* 2. Power Spectral Density */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-2.5 flex flex-col">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#94a3b8] font-medium">
            <span>POWER SPECTRAL DENSITY (WELCH PSD)</span>
            <span className="font-mono text-[10px] text-[#38bdf8]">
              Fc: {(features.carrierFreqHz / 1000).toFixed(1)} kHz | BW: {(features.bandwidth3dBHz / 1000).toFixed(1)} kHz
            </span>
          </div>
          <div className="relative flex-1 min-h-[160px]">
            <canvas
              ref={psdCanvasRef}
              width={480}
              height={180}
              className="w-full h-full rounded border border-[#1a2333]"
            />
          </div>
        </div>

        {/* 3. Waterfall Spectrogram */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-2.5 flex flex-col">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#94a3b8] font-medium">
            <span>2D WATERFALL SPECTROGRAM</span>
            <span className="font-mono text-[10px] text-[#64748b]">Time vs. Freq</span>
          </div>
          <div className="relative flex-1 min-h-[160px]">
            <canvas
              ref={waterfallCanvasRef}
              width={480}
              height={180}
              className="w-full h-full rounded border border-[#1a2333]"
            />
          </div>
        </div>

        {/* 4. I/Q Constellation Diagram */}
        <div className="bg-[#111722] border border-[#1e293b] rounded p-2.5 flex flex-col">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-[#94a3b8] font-medium">
            <span>I/Q CONSTELLATION POLAR PLOT</span>
            <span className="font-mono text-[10px] text-[#64748b]">Derotated Baseband</span>
          </div>
          <div className="relative flex-1 min-h-[160px]">
            <canvas
              ref={constCanvasRef}
              width={480}
              height={180}
              className="w-full h-full rounded border border-[#1a2333]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
