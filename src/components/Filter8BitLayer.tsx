import React from 'react';
import { Filter8BitMode } from '../types';

interface Filter8BitLayerProps {
  mode: Filter8BitMode;
}

export const Filter8BitLayer: React.FC<Filter8BitLayerProps> = ({ mode }) => {
  if (mode === 'off') return null;

  return (
    <div
      id="filter-8bit-layer"
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 8-Bit / CRT Scanline Matrix */}
      {(mode === '8bit' || mode === 'crt') && (
        <div
          className={`absolute inset-0 ${
            mode === 'crt'
              ? 'opacity-35 [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_1.5px,transparent_1.5px,transparent_3px)]'
              : 'opacity-22 [background:repeating-linear-gradient(0deg,rgba(0,0,0,0.3)_0px,rgba(0,0,0,0.3)_2px,transparent_2px,transparent_4px)]'
          }`}
        />
      )}

      {/* Phosphor Triad Grid for true 8-bit retro arcade display */}
      {mode === '8bit' && (
        <div
          className="absolute inset-0 opacity-12 mix-blend-overlay"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)`,
            backgroundSize: '4px 4px',
          }}
        />
      )}

      {/* CRT Vignette / Radial Curvature Falloff */}
      {(mode === '8bit' || mode === 'crt') && (
        <div
          className={`absolute inset-0 ${
            mode === 'crt'
              ? 'bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.75)_100%)] shadow-[inset_0_0_90px_rgba(0,0,0,0.85)]'
              : 'bg-[radial-gradient(circle_at_center,transparent_70%,rgba(0,0,0,0.5)_100%)] shadow-[inset_0_0_50px_rgba(0,0,0,0.6)]'
          }`}
        />
      )}

      {/* Subtle Retro Color Grading & Bloom Boost (Smooth & 8bit modes) */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          mode === '8bit'
            ? 'backdrop-contrast-115 backdrop-saturate-125'
            : mode === 'crt'
            ? 'backdrop-contrast-120 backdrop-saturate-130 backdrop-brightness-105'
            : 'backdrop-contrast-105 backdrop-saturate-110'
        }`}
      />
    </div>
  );
};
