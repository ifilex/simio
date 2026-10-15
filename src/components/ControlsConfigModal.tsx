import React, { useState, useEffect } from 'react';
import { X, Keyboard, RotateCcw, Check, Flame, Gamepad2 } from 'lucide-react';
import { SaveData, KeyBindingsConfig } from '../types';
import { DEFAULT_KEY_BINDINGS_DOOM, DEFAULT_KEY_BINDINGS_WASD } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

interface ControlsConfigModalProps {
  saveData: SaveData;
  onUpdateSave: (newSave: SaveData) => void;
  onClose: () => void;
}

type ActionKey = keyof KeyBindingsConfig;

const ACTION_LABELS: { key: ActionKey; label: string; desc: string; icon: string }[] = [
  {
    key: 'forward',
    label: 'Avanzar / Mover Adelante',
    desc: 'Caminar hacia adelante y subir escaleras',
    icon: '⬆️',
  },
  {
    key: 'backward',
    label: 'Retroceder / Mover Atrás',
    desc: 'Caminar hacia atrás y bajar escaleras',
    icon: '⬇️',
  },
  {
    key: 'left',
    label: 'Girar / Desplazar Izquierda',
    desc: 'Giro de cámara estilo Doom o paso lateral',
    icon: '⬅️',
  },
  {
    key: 'right',
    label: 'Girar / Desplazar Derecha',
    desc: 'Giro de cámara estilo Doom o paso lateral',
    icon: '➡️',
  },
  {
    key: 'jump',
    label: 'Saltar',
    desc: 'Impulso vertical para evadir barriles',
    icon: '⏫',
  },
  {
    key: 'action',
    label: 'Golpe de Mazo / Acción',
    desc: 'Demoler barriles o activar mecanismos',
    icon: '🔨',
  },
];

export function formatKeyDisplay(code: string): string {
  switch (code) {
    case 'ArrowUp':
      return '↑ Flecha Arriba';
    case 'ArrowDown':
      return '↓ Flecha Abajo';
    case 'ArrowLeft':
      return '← Flecha Izq';
    case 'ArrowRight':
      return '→ Flecha Der';
    case 'Space':
      return 'Barra Espaciadora';
    case 'ControlLeft':
      return 'Ctrl Izquierdo';
    case 'ControlRight':
      return 'Ctrl Derecho';
    case 'ShiftLeft':
      return 'Shift Izq';
    case 'ShiftRight':
      return 'Shift Der';
    case 'Enter':
      return 'Intro / Enter';
    case 'KeyW':
      return 'Tecla W';
    case 'KeyS':
      return 'Tecla S';
    case 'KeyA':
      return 'Tecla A';
    case 'KeyD':
      return 'Tecla D';
    case 'KeyF':
      return 'Tecla F';
    case 'KeyE':
      return 'Tecla E';
    case 'KeyL':
      return 'Tecla L';
    case 'KeyK':
      return 'Tecla K';
    default:
      return code.replace('Key', 'Tecla ').replace('Digit', 'Número ');
  }
}

export const ControlsConfigModal: React.FC<ControlsConfigModalProps> = ({
  saveData,
  onUpdateSave,
  onClose,
}) => {
  const [bindings, setBindings] = useState<KeyBindingsConfig>(
    saveData.settings.keyBindings || DEFAULT_KEY_BINDINGS_DOOM
  );
  const [listeningAction, setListeningAction] = useState<ActionKey | null>(null);

  // Keyboard capture listener for remapping
  useEffect(() => {
    if (!listeningAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Avoid binding Escape so user can cancel listening
      if (e.code === 'Escape') {
        setListeningAction(null);
        return;
      }

      const updated = {
        ...bindings,
        [listeningAction]: e.code,
      };

      setBindings(updated);
      setListeningAction(null);
      soundEngine.playCoin();

      onUpdateSave({
        ...saveData,
        settings: {
          ...saveData.settings,
          keyBindings: updated,
        },
      });
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [listeningAction, bindings, saveData, onUpdateSave]);

  const applyPreset = (preset: KeyBindingsConfig) => {
    setBindings(preset);
    setListeningAction(null);
    soundEngine.playCoin();
    onUpdateSave({
      ...saveData,
      settings: {
        ...saveData.settings,
        keyBindings: preset,
      },
    });
  };

  return (
    <div
      id="modal-controls-config"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none"
    >
      <div className="w-full max-w-xl bg-zinc-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white max-h-[92vh] overflow-y-auto animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black font-mono tracking-wide text-amber-400 uppercase">
                Configuración de Controles
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Asigna cualquier tecla o elige el perfil clásico de DOOM 1
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
            Perfiles Rápidos
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => applyPreset(DEFAULT_KEY_BINDINGS_DOOM)}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                bindings.forward === 'ArrowUp' && bindings.left === 'ArrowLeft'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-md'
                  : 'bg-zinc-800/40 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="p-2 rounded-xl bg-zinc-800 text-amber-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-mono text-xs font-black uppercase text-white flex items-center gap-1.5">
                  <span>DOOM 1 Clásico</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 border border-amber-400/40">
                    POR DEFECTO
                  </span>
                </div>
                <div className="font-mono text-[11px] text-zinc-400">
                  Flechas ↑ ↓ ← → • Ctrl (Golpe) • Espacio
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => applyPreset(DEFAULT_KEY_BINDINGS_WASD)}
              className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                bindings.forward === 'KeyW' && bindings.left === 'KeyA'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-md'
                  : 'bg-zinc-800/40 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <div className="p-2 rounded-xl bg-zinc-800 text-blue-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <div className="font-mono text-xs font-black uppercase text-white">
                  Moderno FPS (WASD)
                </div>
                <div className="font-mono text-[11px] text-zinc-400">
                  W, A, S, D • F (Golpe) • Espacio • Ratón
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Action Rebinding List */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
              Asignación Personalizada
            </span>
            {listeningAction && (
              <span className="text-xs font-mono text-amber-400 animate-pulse font-bold">
                Presiona una tecla ahora... (Esc para cancelar)
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
            {ACTION_LABELS.map(item => {
              const currentKey = bindings[item.key];
              const isListening = listeningAction === item.key;

              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="font-mono text-xs font-bold text-white">
                        {item.label}
                      </div>
                      <div className="font-mono text-[10px] text-zinc-500">
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setListeningAction(item.key)}
                    className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border transition-all ${
                      isListening
                        ? 'bg-amber-500 text-zinc-950 border-amber-300 ring-2 ring-amber-400 animate-pulse'
                        : 'bg-zinc-800 border-zinc-700 text-amber-300 hover:border-amber-400/50 hover:bg-zinc-750 active:scale-95'
                    }`}
                  >
                    {isListening ? 'ESCUCHANDO...' : formatKeyDisplay(currentKey)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => applyPreset(DEFAULT_KEY_BINDINGS_DOOM)}
            className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer a Doom 1</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-xs font-black uppercase tracking-wider transition-all shadow flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>LISTO Y GUARDADO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
