import React, { useState } from 'react';
import { X, ShoppingBag, Coins, Check, CreditCard, Sparkles } from 'lucide-react';
import { SaveData, ShopItem } from '../types';
import { SHOP_ITEMS } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

interface ShopModalProps {
  saveData: SaveData;
  onUpdateSave: (newSave: SaveData) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'skin' | 'hat' | 'hammer' | 'iap'>('all');
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState<string | null>(null);

  const handleBuyItem = (item: ShopItem) => {
    if (saveData.stats.totalCoins < item.price) {
      soundEngine.playHit();
      setPurchaseSuccessMsg('¡No tienes suficientes bananas doradas!');
      setTimeout(() => setPurchaseSuccessMsg(null), 2500);
      return;
    }

    soundEngine.playCoin();
    const newSave: SaveData = {
      ...saveData,
      stats: {
        ...saveData.stats,
        totalCoins: saveData.stats.totalCoins - item.price,
      },
      unlockedItems: [...saveData.unlockedItems, item.id],
    };

    onUpdateSave(newSave);
    setPurchaseSuccessMsg(`¡${item.name} desbloqueado exitosamente!`);
    setTimeout(() => setPurchaseSuccessMsg(null), 2500);
  };

  // Simulated In-App Purchases (100% Offline Safe & Instant)
  const handleSimulatedIAP = (coinsAmount: number, packName: string) => {
    soundEngine.playVictory();
    const newSave: SaveData = {
      ...saveData,
      stats: {
        ...saveData.stats,
        totalCoins: saveData.stats.totalCoins + coinsAmount,
      },
    };
    onUpdateSave(newSave);
    setPurchaseSuccessMsg(`¡Compra IAP completada! +${coinsAmount} bananas agregadas.`);
    setTimeout(() => setPurchaseSuccessMsg(null), 3000);
  };

  const itemsToDisplay =
    filter === 'all'
      ? SHOP_ITEMS
      : filter === 'iap'
      ? []
      : SHOP_ITEMS.filter(item => item.category === filter);

  return (
    <div id="modal-shop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-zinc-900 border-2 border-yellow-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black font-mono tracking-wide text-yellow-400 uppercase">
                Tienda Integrada Voxel
              </h2>
              <p className="text-xs text-zinc-400">
                Adquiere accesorios exclusivos y paquetes de bananas doradas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Wallet display */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 border border-yellow-400/40 rounded-xl font-mono text-sm text-yellow-300 font-bold">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span>{saveData.stats.totalCoins}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Message */}
        {purchaseSuccessMsg && (
          <div className="p-3 bg-yellow-500/15 border border-yellow-400/40 rounded-xl text-yellow-300 text-xs font-mono font-bold flex items-center justify-between animate-fade-in">
            <span>{purchaseSuccessMsg}</span>
          </div>
        )}

        {/* Filter Navigation */}
        <div className="flex border-b border-zinc-800 gap-1 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Todo' },
            { id: 'skin', label: 'Skins' },
            { id: 'hat', label: 'Sombreros' },
            { id: 'hammer', label: 'Mazos' },
            { id: 'iap', label: '💎 Paquetes IAP' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 font-mono text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Simulated In-App Purchases (IAP) section */}
        {(filter === 'all' || filter === 'iap') && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Compras Integradas (Soporte Offline)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Bolsa Selvática', coins: 300, price: '$0.99 (Prueba)', icon: '🍌', color: 'border-yellow-500/40' },
                { name: 'Barril de Bananas', coins: 1000, price: '$2.49 (Prueba)', icon: '📦', color: 'border-amber-500/60' },
                { name: 'Cofre del Simio Titán', coins: 3500, price: '$4.99 (Prueba)', icon: '👑', color: 'border-yellow-400' },
              ].map((pack, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${pack.color} bg-zinc-800/40 flex flex-col justify-between gap-3 text-center`}
                >
                  <div className="text-2xl">{pack.icon}</div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">{pack.name}</h4>
                    <p className="font-mono text-sm font-black text-yellow-400 mt-1">+{pack.coins} Bananas</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulatedIAP(pack.coins, pack.name)}
                    className="w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-mono text-xs font-bold transition-all shadow active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> {pack.price}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cosmetics Items Grid */}
        {filter !== 'iap' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {itemsToDisplay.map(item => {
              const isUnlocked = saveData.unlockedItems.includes(item.id) || item.unlockedByDefault;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-zinc-800 bg-zinc-800/40 flex flex-col justify-between gap-3"
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
                      <h4 className="font-mono text-sm font-bold text-white">{item.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <div className="font-mono text-xs font-bold text-yellow-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      <span>{item.price === 0 ? 'Gratis' : `${item.price} Bananas`}</span>
                    </div>

                    {isUnlocked ? (
                      <span className="text-emerald-400 font-mono text-xs flex items-center gap-1 font-semibold">
                        <Check className="w-3.5 h-3.5" /> Adquirido
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBuyItem(item)}
                        className="px-3.5 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-mono text-xs font-bold transition-all shadow active:scale-95"
                      >
                        Comprar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
