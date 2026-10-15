import React from 'react';
import { Heart, Coins, Trophy, Hammer, AlertTriangle, Pause, Tv } from 'lucide-react';
import { PlayerRuntime } from '../game/voxelEngine';
import { Difficulty, KeyBindingsConfig, Filter8BitMode } from '../types';
import { formatKeyDisplay } from './ControlsConfigModal';

interface GameHUDProps {
  p1: PlayerRuntime;
  p2: PlayerRuntime | null;
  isCoop: boolean;
  highScore: number;
  levelNum: number;
  difficulty: Difficulty;
  isTouch: boolean;
  keyBindings?: KeyBindingsConfig;
  filterMode?: Filter8BitMode;
  onToggleFilter?: () => void;
  onPause: () => void;
  floatingMessage: { text: string; color: string } | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  p1,
  p2,
  isCoop,
  highScore,
  levelNum,
  difficulty,
  isTouch,
  keyBindings,
  filterMode = '8bit',
  onToggleFilter,
  onPause,
  floatingMessage,
}) => {
  return (
    <div id="game-hud-overlay" className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* P1 Stats */}
        <div className="flex flex-col gap-1.5 bg-black/40 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-red-600/80 text-white">
              {isCoop ? 'J1' : 'P1'}
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.max(0, p1.lives) }).map((_, i) => (
                <Heart key={i} className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-mono">
            <div>
              <span className="text-white/50 text-[10px] uppercase block">Puntos</span>
              <span className="font-bold text-amber-300">{p1.score.toString().padStart(6, '0')}</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins className="w-4 h-4" />
              <span className="font-bold">+{p1.coinsEarned}</span>
            </div>
          </div>
          {p1.hammerTimeLeft > 0 && (
            <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-amber-400/50">
              <div
                className="bg-amber-400 h-full transition-all duration-100"
                style={{ width: `${(p1.hammerTimeLeft / 12) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Center: Mission / Level & Floating Alert */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-xs px-4 py-1.5 rounded-full border border-white/15 text-white font-mono text-xs">
            <span className="text-white/60">NIVEL {levelNum}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span
              className={`font-bold uppercase ${
                difficulty === 'caos'
                  ? 'text-purple-400'
                  : difficulty === 'dificil'
                  ? 'text-red-400'
                  : difficulty === 'normal'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {difficulty}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <div className="flex items-center gap-1 text-amber-300">
              <Trophy className="w-3.5 h-3.5" />
              <span>RÉCORD: {highScore}</span>
            </div>
          </div>

          {/* Floating Action Notifications */}
          {floatingMessage && (
            <div
              className="px-4 py-1.5 rounded-lg text-sm font-mono font-black tracking-wide uppercase shadow-lg animate-bounce border"
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: floatingMessage.color,
                borderColor: floatingMessage.color,
              }}
            >
              {floatingMessage.text}
            </div>
          )}
        </div>

        {/* Right Side: P2 Stats (if Co-op) or Pause Button */}
        <div className="flex items-start gap-3">
          {isCoop && p2 && (
            <div className="flex flex-col gap-1.5 bg-black/40 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-white text-right">
              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.max(0, p2.lives) }).map((_, i) => (
                    <Heart key={i} className="w-5 h-5 text-blue-400 fill-blue-400 animate-pulse" />
                  ))}
                </div>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-blue-600/80 text-white">
                  J2
                </span>
              </div>
              <div className="flex items-center justify-end gap-4 text-sm font-mono">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Coins className="w-4 h-4" />
                  <span className="font-bold">+{p2.coinsEarned}</span>
                </div>
                <div>
                  <span className="text-white/50 text-[10px] uppercase block">Puntos</span>
                  <span className="font-bold text-amber-300">{p2.score.toString().padStart(6, '0')}</span>
                </div>
              </div>
              {p2.hammerTimeLeft > 0 && (
                <div className="w-full bg-black/50 rounded-full h-2 overflow-hidden border border-blue-400/50">
                  <div
                    className="bg-blue-400 h-full transition-all duration-100"
                    style={{ width: `${(p2.hammerTimeLeft / 12) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {onToggleFilter && (
            <button
              id="btn-hud-filter-toggle"
              type="button"
              onClick={onToggleFilter}
              className="pointer-events-auto px-2.5 py-2 rounded-xl bg-black/50 backdrop-blur-xs border border-amber-400/40 text-amber-300 hover:text-amber-200 hover:bg-black/70 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-mono font-bold shadow"
              title="Alternar Capa Visual 8-Bit (8Bit / CRT / Suave / Off)"
            >
              <Tv className="w-4 h-4 text-amber-400" />
              <span>
                {filterMode === '8bit'
                  ? '8-BIT'
                  : filterMode === 'crt'
                  ? 'CRT'
                  : filterMode === 'smooth'
                  ? 'SUAVE'
                  : '3D'}
              </span>
            </button>
          )}

          <button
            id="btn-hud-pause"
            type="button"
            onClick={onPause}
            className="pointer-events-auto p-2.5 rounded-xl bg-black/40 backdrop-blur-xs border border-white/15 text-white/80 hover:text-white hover:bg-black/60 transition-colors active:scale-95"
            title="Pausar Partida"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Screen Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center opacity-60">
        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
        <div className="absolute w-6 h-0.5 bg-white/30" />
        <div className="absolute h-6 w-0.5 bg-white/30" />
      </div>

      {/* Bottom Desktop Control Hints (Only on non-touch desktop) */}
      {!isTouch && (
        <div className="flex items-center justify-center w-full">
          <div className="bg-black/50 backdrop-blur-xs px-4 py-1.5 rounded-xl border border-white/15 text-white/80 text-xs font-mono flex items-center gap-3 shadow-lg">
            <span>
              <strong className="text-white">
                {keyBindings?.forward === 'ArrowUp'
                  ? '↑ ↓ ← →'
                  : `${formatKeyDisplay(keyBindings?.forward || 'ArrowUp')} / ${formatKeyDisplay(keyBindings?.backward || 'ArrowDown')}`}
              </strong>{' '}
              Moverse
            </span>
            <span>•</span>
            <span>
              <strong className="text-white">{formatKeyDisplay(keyBindings?.jump || 'Space')}</strong> Saltar
            </span>
            <span>•</span>
            <span>
              <strong className="text-amber-300">{formatKeyDisplay(keyBindings?.action || 'ControlLeft')} / Click</strong> Golpe
            </span>
            <span>•</span>
            <span>
              <strong className="text-zinc-300">Ratón / Teclas</strong> Mirar
            </span>
            {isCoop && (
              <>
                <span>•</span>
                <span className="text-blue-300">
                  <strong>J2: WASD</strong> + <strong>Espacio</strong>
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
