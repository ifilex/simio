import React, { useState } from 'react';
import { X, Trophy, Medal, Flame, Calendar, User } from 'lucide-react';
import { SaveData, LeaderboardEntry, Difficulty } from '../types';

interface LeaderboardModalProps {
  saveData: SaveData;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  saveData,
  onClose,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');

  const filteredEntries = saveData.leaderboard
    .filter(entry => selectedDifficulty === 'all' || entry.difficulty === selectedDifficulty)
    .sort((a, b) => b.score - a.score);

  return (
    <div id="modal-leaderboard" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black font-mono tracking-wide text-amber-400 uppercase">
                Tablas de Clasificación Global
              </h2>
              <p className="text-xs text-zinc-400">
                Compite con amigos y escala en el salón de la fama arcade
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

        {/* Difficulty Filter Tabs */}
        <div className="flex border-b border-zinc-800 gap-1 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todas las Dificultades' },
            { id: 'facil', label: 'Selva Serena' },
            { id: 'normal', label: 'Clásico' },
            { id: 'dificil', label: 'Furia' },
            { id: 'caos', label: 'Caos Salvaje' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedDifficulty(tab.id as any)}
              className={`px-3.5 py-1.5 font-mono text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                selectedDifficulty === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className="flex flex-col gap-2.5">
          {filteredEntries.map((entry: LeaderboardEntry, index: number) => {
            const isTop3 = index < 3;
            const rankBadgeColor =
              index === 0
                ? 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50'
                : index === 1
                ? 'text-zinc-300 bg-zinc-300/20 border-zinc-300/50'
                : index === 2
                ? 'text-amber-600 bg-amber-600/20 border-amber-600/50'
                : 'text-zinc-500 bg-zinc-800 border-zinc-700';

            return (
              <div
                key={entry.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  entry.isLocalUser
                    ? 'bg-amber-500/10 border-amber-400/50 shadow-md ring-1 ring-amber-400/30'
                    : isTop3
                    ? 'bg-zinc-800/60 border-zinc-700'
                    : 'bg-zinc-900/40 border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center font-mono font-black text-sm shrink-0 ${rankBadgeColor}`}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xl">{entry.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-white">
                          {entry.playerName}
                        </span>
                        {entry.isLocalUser && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            TÚ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-0.5">
                        <span className="capitalize">{entry.difficulty}</span>
                        <span>•</span>
                        <span>Nivel {entry.level}</span>
                        <span>•</span>
                        <span>{entry.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-base font-black text-amber-300">
                    {entry.score.toLocaleString()} PTS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
