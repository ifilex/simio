import React from 'react';
import { X, Award, CheckCircle2, Lock, Coins, Sparkles } from 'lucide-react';
import { SaveData, Achievement } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface AchievementsModalProps {
  saveData: SaveData;
  onUpdateSave: (newSave: SaveData) => void;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const unlockedCount = saveData.achievements.filter(a => a.unlocked).length;
  const totalCount = saveData.achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div id="modal-achievements" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border-2 border-emerald-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black font-mono tracking-wide text-emerald-400 uppercase">
                Logros Desbloqueables
              </h2>
              <p className="text-xs text-zinc-400">
                Supera desafíos y desbloquea recompensas en bananas doradas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col gap-2">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-zinc-300 font-bold">Progreso Total</span>
            <span className="text-emerald-400 font-bold">
              {unlockedCount} de {totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-zinc-700/50 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Achievements List */}
        <div className="flex flex-col gap-3">
          {saveData.achievements.map((ach: Achievement) => (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                ach.unlocked
                  ? 'bg-zinc-800/70 border-emerald-500/40 shadow-sm'
                  : 'bg-zinc-900/50 border-zinc-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    ach.unlocked
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {ach.unlocked ? <CheckCircle2 className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-white flex items-center gap-2">
                    {ach.title}
                    {ach.unlocked && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-normal">
                        Completado
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">{ach.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-400/20 text-yellow-300 font-mono text-xs font-bold">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>+{ach.rewardCoins}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
