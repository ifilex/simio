import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, Coins, Star, ArrowRight } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface EndGameModalProps {
  isVictory: boolean;
  score: number;
  level: number;
  coinsEarned: number;
  onRestart: () => void;
  onNextLevel?: () => void;
  onReturnToMenu: () => void;
  onSaveScore: (playerName: string) => void;
}

export const EndGameModal: React.FC<EndGameModalProps> = ({
  isVictory,
  score,
  level,
  coinsEarned,
  onRestart,
  onNextLevel,
  onReturnToMenu,
  onSaveScore,
}) => {
  const [name, setName] = useState('JugadorVoxel');
  const [scoreSaved, setScoreSaved] = useState(false);

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isVictory]);

  const handleRegisterScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || scoreSaved) return;
    soundEngine.playCoin();
    onSaveScore(name.trim());
    setScoreSaved(true);
  };

  return (
    <div id="modal-end-game" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-zinc-900 border-2 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5 text-white border-amber-500/40 animate-scale-up">
        {/* Title & Icon */}
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 ${
            isVictory
              ? 'bg-amber-500/20 border-amber-400 text-amber-400'
              : 'bg-red-500/20 border-red-400 text-red-400'
          }`}
        >
          {isVictory ? '👑' : '💥'}
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-tight uppercase">
            {isVictory ? '¡CUMBRE CONQUISTADA!' : '¡CAÍDA A LAS PROFUNDIDADES!'}
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            {isVictory
              ? 'Has evadido todos los barriles y alcanzado la cima del Simio.'
              : 'El Simio Salvaje defendió su territorio. ¡Vuelve a intentarlo!'}
          </p>
        </div>

        {/* Stats Card */}
        <div className="w-full bg-zinc-800/60 border border-zinc-700/60 rounded-2xl p-4 flex items-center justify-around font-mono">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">Puntuación</span>
            <span className="text-xl font-black text-amber-300">{score.toLocaleString()}</span>
          </div>
          <div className="w-px h-8 bg-zinc-700" />
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">Nivel</span>
            <span className="text-xl font-black text-white">{level}</span>
          </div>
          <div className="w-px h-8 bg-zinc-700" />
          <div>
            <span className="text-[10px] text-zinc-400 uppercase block">Bananas</span>
            <span className="text-xl font-black text-yellow-400 flex items-center gap-1 justify-center">
              <Coins className="w-4 h-4" /> +{coinsEarned}
            </span>
          </div>
        </div>

        {/* Register to Leaderboard Form */}
        {!scoreSaved ? (
          <form onSubmit={handleRegisterScore} className="w-full flex flex-col gap-2">
            <span className="text-xs font-mono text-zinc-400">Registrar en Tabla de Clasificación</span>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={15}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu Nombre"
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-bold rounded-xl transition-all shadow"
              >
                Guardar
              </button>
            </div>
          </form>
        ) : (
          <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 font-bold">
            <Star className="w-4 h-4" /> ¡Puntaje registrado con éxito!
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 pt-2">
          {isVictory && onNextLevel && level < 4 && (
            <button
              type="button"
              onClick={onNextLevel}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <span>SIGUIENTE NIVEL ({level + 1})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow"
          >
            <RefreshCw className="w-4 h-4" />
            <span>REINTENTAR NIVEL</span>
          </button>

          <button
            type="button"
            onClick={onReturnToMenu}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>MENÚ PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
