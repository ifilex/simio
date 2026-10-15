import React, { useState } from 'react';
import {
  Play,
  Users,
  Trophy,
  ShoppingBag,
  Sparkles,
  Award,
  Volume2,
  VolumeX,
  Smartphone,
  Flame,
  Shield,
  Layers,
  Zap,
  Keyboard,
  Tv,
} from 'lucide-react';
import { Difficulty, SaveData } from '../types';
import { DIFFICULTIES } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';
import { LEVELS_CONFIG } from '../game/voxelLevels';
import { formatKeyDisplay } from './ControlsConfigModal';

interface MainMenuProps {
  saveData: SaveData;
  onStartGame: (level: number, difficulty: Difficulty, isCoop: boolean) => void;
  onOpenCustomization: () => void;
  onOpenShop: () => void;
  onOpenAchievements: () => void;
  onOpenLeaderboard: () => void;
  onOpenControlsConfig: () => void;
  onUpdateSave: (newSave: SaveData) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  onStartGame,
  onOpenCustomization,
  onOpenShop,
  onOpenAchievements,
  onOpenLeaderboard,
  onOpenControlsConfig,
  onUpdateSave,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [selectedLevel, setSelectedLevel] = useState<number>(saveData.stats.currentLevel || 1);
  const [isCoop, setIsCoop] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const handleStart = () => {
    soundEngine.playCoin();
    soundEngine.playApeRoar();
    onStartGame(selectedLevel, selectedDifficulty, isCoop);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      soundEngine.setVolumes(0, 0);
    } else {
      soundEngine.setVolumes(saveData.settings.musicVolume, saveData.settings.sfxVolume);
      soundEngine.playCoin();
    }
  };

  const toggleTouchOverride = () => {
    const next = saveData.settings.touchControlsForced === true ? false : true;
    onUpdateSave({
      ...saveData,
      settings: {
        ...saveData.settings,
        touchControlsForced: next,
      },
    });
    soundEngine.playCoin();
  };

  return (
    <div
      id="main-menu-view"
      className="relative w-full h-full min-h-screen flex flex-col items-center justify-between p-4 sm:p-8 bg-gradient-to-b from-emerald-950 via-zinc-950 to-stone-950 text-white select-none overflow-y-auto"
    >
      {/* Background Decorative Grid and Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Controls (Coins, Sound, Touch Toggle) */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between gap-3">
        {/* Bananas / Coins */}
        <div
          onClick={onOpenShop}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 border border-yellow-400/40 rounded-xl font-mono text-sm text-yellow-300 font-bold shadow cursor-pointer hover:bg-yellow-500/30 transition-all active:scale-95"
        >
          <span className="text-xl">🍌</span>
          <span>{saveData.stats.totalCoins} Bananas</span>
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2">
          {/* Controls Config Button */}
          <button
            type="button"
            onClick={onOpenControlsConfig}
            className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-amber-500/40 text-amber-300 hover:bg-zinc-800 transition-colors text-xs font-mono font-bold flex items-center gap-1.5 shadow"
            title="Configurar Controles (Doom 1 / Personalizado)"
          >
            <Keyboard className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Controles (Doom 1)</span>
          </button>

          {/* Force Touch Toggle */}
          <button
            type="button"
            onClick={toggleTouchOverride}
            className={`p-2.5 rounded-xl border transition-all text-xs font-mono flex items-center gap-1.5 ${
              saveData.settings.touchControlsForced
                ? 'bg-emerald-600/30 border-emerald-400/50 text-emerald-300'
                : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
            title="Forzar Joystick Táctil en Pantalla"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">
              Joystick: {saveData.settings.touchControlsForced ? 'ON' : 'AUTO'}
            </span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title={isMuted ? 'Activar Sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Hero Title & Ape Mascot */}
      <div className="relative z-10 flex flex-col items-center text-center my-6 gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono font-bold tracking-widest uppercase animate-pulse">
          <Zap className="w-3.5 h-3.5" /> RECONVERSIÓN 3D EN PRIMERA PERSONA
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight uppercase drop-shadow-2xl">
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            Simio Salvaje
          </span>
          <br />
          <span className="text-white text-2xl sm:text-4xl md:text-5xl tracking-normal">
            Desafío a las Alturas
          </span>
        </h1>

        <p className="text-xs sm:text-sm font-mono text-zinc-400 max-w-lg mt-1">
          Plataformas voxel en primera persona con físicas realistas de barriles,
          escaleras infinitas y banda sonora retro-selvática.
        </p>
      </div>

      {/* Main Central Play Configuration Card */}
      <div className="relative z-10 w-full max-w-2xl bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-6">
        {/* Game Mode Selector (1 Jugador vs Cooperativo Local 2P) */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Modo de Juego
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCoop(false);
                soundEngine.playCoin();
              }}
              className={`p-3.5 rounded-2xl border font-mono font-bold text-xs flex items-center justify-center gap-2.5 transition-all ${
                !isCoop
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg scale-102'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              1 JUGADOR (ASCENSO)
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCoop(true);
                soundEngine.playCoin();
              }}
              className={`p-3.5 rounded-2xl border font-mono font-bold text-xs flex items-center justify-center gap-2.5 transition-all ${
                isCoop
                  ? 'bg-blue-600 text-white border-blue-400 shadow-lg scale-102 ring-2 ring-blue-400/40'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              CO-OP LOCAL (2 JUGADORES)
            </button>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Dificultad de la Partida
            </span>
            <span className="text-[11px] font-mono text-amber-400">
              Multiplicador x{DIFFICULTIES.find(d => d.id === selectedDifficulty)?.scoreMultiplier.toFixed(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {DIFFICULTIES.map(diff => {
              const isSelected = selectedDifficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => {
                    setSelectedDifficulty(diff.id);
                    soundEngine.playCoin();
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-start gap-1 transition-all ${
                    isSelected
                      ? 'bg-zinc-800 border-amber-400 ring-2 ring-amber-400/40 scale-102 shadow-md'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-black uppercase text-white">
                      {diff.subtitle}
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: diff.color }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 line-clamp-1">
                    {diff.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Level Progression Selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Selección de Nivel
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Desbloqueado hasta Nivel {saveData.stats.maxLevelUnlocked}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LEVELS_CONFIG.map(lvl => {
              const isUnlocked = lvl.id <= (saveData.stats.maxLevelUnlocked || 1);
              const isSelected = selectedLevel === lvl.id;

              return (
                <button
                  key={lvl.id}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => {
                    setSelectedLevel(lvl.id);
                    soundEngine.playCoin();
                  }}
                  className={`p-2.5 rounded-xl border font-mono text-xs text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                      : isUnlocked
                      ? 'bg-zinc-800/40 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                      : 'bg-zinc-950/60 border-zinc-900 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <div className="font-bold">Nivel {lvl.id}</div>
                  <div className="text-[10px] text-zinc-400 line-clamp-1">{lvl.themeName}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Capa Visual 8-Bit & Optimización de Rendimiento */}
        <div className="flex flex-col gap-2.5 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5 text-amber-400" /> Filtro Visual 8-Bit & Motor
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              Optimizado 60 FPS
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: '8bit', label: '8-Bit Retro', desc: 'Scanlines + Píxeles' },
              { id: 'crt', label: 'CRT Arcade', desc: 'Curvatura & Viñeta' },
              { id: 'smooth', label: 'Suave 60FPS', desc: 'Tono arcade suave' },
              { id: 'off', label: '3D Nítido', desc: 'Sin filtro' },
            ].map(opt => {
              const isSelected = (saveData.settings.filter8Bit || '8bit') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const res = opt.id === '8bit' ? '8bit_retro' : opt.id === 'crt' ? 'arcade' : 'high';
                    onUpdateSave({
                      ...saveData,
                      settings: {
                        ...saveData.settings,
                        filter8Bit: opt.id as any,
                        renderResolution: res,
                      },
                    });
                    soundEngine.playCoin();
                  }}
                  className={`p-2.5 rounded-xl border text-left font-mono transition-all ${
                    isSelected
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow-md'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500 line-clamp-1">{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Play Button */}
        <button
          id="btn-play-game"
          type="button"
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-zinc-950 font-mono text-base font-black uppercase tracking-wider shadow-xl hover:shadow-orange-500/25 transition-all transform active:scale-98 flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>INICIAR ASCENSO A LAS ALTURAS</span>
        </button>

        {/* Active Key Controls Helper Card */}
        <div
          onClick={onOpenControlsConfig}
          className="w-full p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-amber-400/50 cursor-pointer flex items-center justify-between text-[11px] font-mono text-zinc-400 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Controles: <strong className="text-white">{formatKeyDisplay(saveData.settings.keyBindings?.forward || 'ArrowUp')}</strong>,{' '}
              <strong className="text-white">{formatKeyDisplay(saveData.settings.keyBindings?.backward || 'ArrowDown')}</strong>,{' '}
              <strong className="text-white">{formatKeyDisplay(saveData.settings.keyBindings?.left || 'ArrowLeft')}</strong>,{' '}
              <strong className="text-white">{formatKeyDisplay(saveData.settings.keyBindings?.right || 'ArrowRight')}</strong> • Golpe:{' '}
              <strong className="text-amber-300">{formatKeyDisplay(saveData.settings.keyBindings?.action || 'ControlLeft')}</strong>
            </span>
          </div>
          <span className="text-[10px] text-amber-400 underline font-bold shrink-0 ml-2">
            Reasignar
          </span>
        </div>
      </div>

      {/* Secondary Meta Buttons Navigation (Shop, Customization, Achievements, Leaderboard, Controls) */}
      <div className="relative z-10 w-full max-w-2xl grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-6">
        <button
          type="button"
          onClick={onOpenCustomization}
          className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 flex flex-col items-center gap-1.5 transition-all active:scale-95 shadow-md"
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-mono text-xs font-bold">Personalizar</span>
        </button>

        <button
          type="button"
          onClick={onOpenShop}
          className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-yellow-500/50 flex flex-col items-center gap-1.5 transition-all active:scale-95 shadow-md"
        >
          <ShoppingBag className="w-5 h-5 text-yellow-400" />
          <span className="font-mono text-xs font-bold">Tienda</span>
        </button>

        <button
          type="button"
          onClick={onOpenAchievements}
          className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 flex flex-col items-center gap-1.5 transition-all active:scale-95 shadow-md"
        >
          <Award className="w-5 h-5 text-emerald-400" />
          <span className="font-mono text-xs font-bold">Logros</span>
        </button>

        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-blue-500/50 flex flex-col items-center gap-1.5 transition-all active:scale-95 shadow-md"
        >
          <Trophy className="w-5 h-5 text-blue-400" />
          <span className="font-mono text-xs font-bold">Récords</span>
        </button>

        <button
          type="button"
          onClick={onOpenControlsConfig}
          className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-zinc-900/80 border border-amber-500/30 hover:border-amber-400 flex flex-col items-center gap-1.5 transition-all active:scale-95 shadow-md"
        >
          <Keyboard className="w-5 h-5 text-amber-400" />
          <span className="font-mono text-xs font-bold">Teclas</span>
        </button>
      </div>

      {/* Footer Info & Offline Safe Badge */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between w-full max-w-4xl text-zinc-500 font-mono text-[11px] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Modo Offline Activo • Guardado Automático Local Habilitado</span>
        </div>
        <div>
          <span>Récord Personal: {saveData.stats.highScore.toLocaleString()} PTS</span>
        </div>
      </div>
    </div>
  );
};
