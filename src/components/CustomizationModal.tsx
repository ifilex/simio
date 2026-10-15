import React, { useState } from 'react';
import { X, Check, Sparkles, User, ShieldCheck } from 'lucide-react';
import { SaveData, ShopItem } from '../types';
import { SHOP_ITEMS } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

interface CustomizationModalProps {
  saveData: SaveData;
  onUpdateSave: (newSave: SaveData) => void;
  onClose: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<'p1' | 'p2'>('p1');
  const [activeTab, setActiveTab] = useState<'skin' | 'hat' | 'hammer'>('skin');

  const playerConfig = selectedPlayer === 'p1' ? saveData.customizationP1 : saveData.customizationP2;

  const handleEquip = (item: ShopItem) => {
    soundEngine.playCoin();
    const isUnlocked = saveData.unlockedItems.includes(item.id) || item.unlockedByDefault;
    if (!isUnlocked) return;

    const newSave = { ...saveData };
    const targetPlayer = selectedPlayer === 'p1' ? 'customizationP1' : 'customizationP2';

    if (item.category === 'skin') {
      newSave[targetPlayer].skinId = item.id;
      newSave[targetPlayer].colorTheme = item.previewColor;
    } else if (item.category === 'hat') {
      newSave[targetPlayer].hatId = item.id;
    } else if (item.category === 'hammer') {
      newSave[targetPlayer].hammerId = item.id;
    }

    // Trigger fashion achievement
    const ach = newSave.achievements.find(a => a.id === 'ach_fashion');
    if (ach && !ach.unlocked) {
      ach.unlocked = true;
      ach.unlockedAt = new Date().toISOString();
      newSave.stats.totalCoins += ach.rewardCoins;
    }

    onUpdateSave(newSave);
  };

  const filteredItems = SHOP_ITEMS.filter(item => item.category === activeTab);

  return (
    <div id="modal-customization" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black font-mono tracking-wide text-amber-400 uppercase">
                Personalización de Avatar
              </h2>
              <p className="text-xs text-zinc-400">
                Personaliza la apariencia y herramientas de los escaladores voxel
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

        {/* Player Selector (P1 vs P2) */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setSelectedPlayer('p1')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
              selectedPlayer === 'p1'
                ? 'bg-red-600 text-white shadow-lg scale-105 ring-2 ring-red-400/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <User className="w-4 h-4" />
            JUGADOR 1 (ROJO)
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlayer('p2')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all ${
              selectedPlayer === 'p2'
                ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-400/50'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            <User className="w-4 h-4" />
            JUGADOR 2 (CO-OP AZUL)
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-zinc-800">
          {(['skin', 'hat', 'hammer'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-center font-mono text-xs font-bold uppercase transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab === 'skin' ? 'Skins / Trajes' : tab === 'hat' ? 'Sombreros' : 'Mazos de Poder'}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const isUnlocked = saveData.unlockedItems.includes(item.id) || item.unlockedByDefault;
            const isEquipped =
              (activeTab === 'skin' && playerConfig.skinId === item.id) ||
              (activeTab === 'hat' && playerConfig.hatId === item.id) ||
              (activeTab === 'hammer' && playerConfig.hammerId === item.id);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  isEquipped
                    ? 'bg-zinc-800/90 border-amber-400 shadow-md ring-1 ring-amber-400/30'
                    : isUnlocked
                    ? 'bg-zinc-800/40 border-zinc-700/60 hover:border-zinc-500'
                    : 'bg-zinc-900/60 border-zinc-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner"
                    style={{ backgroundColor: item.previewColor }}
                  >
                    <span className="text-xl">
                      {item.category === 'skin' ? '👕' : item.category === 'hat' ? '🧢' : '🔨'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-white">{item.name}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                  <div className="text-xs font-mono">
                    {isUnlocked ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Adquirido
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold">🛒 {item.price} Bananas (En Tienda)</span>
                    )}
                  </div>

                  {isUnlocked && (
                    <button
                      type="button"
                      disabled={isEquipped}
                      onClick={() => handleEquip(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                        isEquipped
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 cursor-default'
                          : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                      }`}
                    >
                      {isEquipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Equipado
                        </>
                      ) : (
                        'Equipar'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
