import React from 'react';
import { Play, RefreshCw, Home, Volume2, Keyboard, Tv, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { SaveData, Filter8BitMode, RenderResolutionMode } from '../types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnToMenu: () => void;
  onOpenControlsConfig: () => void;
  saveData: SaveData;
  onUpdateSave: (newSave: SaveData) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onReturnToMenu,
  onOpenControlsConfig,
  saveData,
  onUpdateSave,
}) => {
  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundEngine.setVolumes(val, saveData.settings.sfxVolume);
    onUpdateSave({
      ...saveData,
      settings: { ...saveData.settings, musicVolume: val },
    });
  };

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundEngine.setVolumes(saveData.settings.musicVolume, val);
    soundEngine.playCoin();
    onUpdateSave({
      ...saveData,
      settings: { ...saveData.settings, sfxVolume: val },
    });
  };

  const handleSetFilter = (mode: Filter8BitMode) => {
    const res: RenderResolutionMode = mode === '8bit' ? '8bit_retro' : mode === 'crt' ? 'arcade' : 'high';
    onUpdateSave({
      ...saveData,
      settings: {
        ...saveData.settings,
        filter8Bit: mode,
        renderResolution: res,
      },
    });
    soundEngine.playCoin();
  };

  return (
    <div id="modal-pause" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 text-white animate-scale-up my-auto">
        <h2 className="text-xl font-mono font-black tracking-wider uppercase text-amber-400">
          Juego en Pausa
        </h2>

        {/* 8-Bit Visual Layer & Performance Selector */}
        <div className="w-full bg-zinc-800/60 p-3.5 rounded-2xl flex flex-col gap-2 font-mono text-xs border border-zinc-700/50">
          <div className="flex items-center justify-between text-zinc-300">
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Tv className="w-3.5 h-3.5 text-amber-400" /> Capa Visual 8-Bit
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">Optimizado</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: '8bit', label: '8-Bit Retro' },
              { id: 'crt', label: 'CRT Arcade' },
              { id: 'smooth', label: 'Suave 60FPS' },
              { id: 'off', label: 'Sin Filtro' },
            ].map(f => {
              const active = (saveData.settings.filter8Bit || '8bit') === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleSetFilter(f.id as Filter8BitMode)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    active
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Volume Controls */}
        <div className="w-full bg-zinc-800/60 p-3.5 rounded-2xl flex flex-col gap-2.5 font-mono text-xs border border-zinc-700/50">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-zinc-400">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Música Selvática
              </span>
              <span>{Math.round(saveData.settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={saveData.settings.musicVolume}
              onChange={handleMusicChange}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-zinc-400">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-yellow-400" /> Efectos 8-Bit
              </span>
              <span>{Math.round(saveData.settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={saveData.settings.sfxVolume}
              onChange={handleSfxChange}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>CONTINUAR ASCENSO</span>
          </button>

          <button
            type="button"
            onClick={onOpenControlsConfig}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 border border-amber-500/30"
          >
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span>CONFIGURAR CONTROLES (DOOM 1)</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>REINICIAR NIVEL</span>
          </button>

          <button
            type="button"
            onClick={onReturnToMenu}
            className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>VOLVER AL MENÚ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
