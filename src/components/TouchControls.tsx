import React, { useRef, useState, useEffect } from 'react';
import { PlayerInput } from '../game/voxelEngine';
import { ArrowUp, Hammer } from 'lucide-react';

interface TouchControlsProps {
  onUpdateInput: (inputDelta: Partial<PlayerInput>) => void;
  idSuffix?: string;
  isCoopPlayer2?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onUpdateInput,
  idSuffix = '',
  isCoopPlayer2 = false,
}) => {
  const stickRef = useRef<HTMLDivElement>(null);
  const [stickActive, setStickActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef<{ id: number; startX: number; startY: number } | null>(null);

  // Camera swipe zone
  const cameraTouchRef = useRef<{ id: number; lastX: number; lastY: number } | null>(null);

  // Joystick touch handlers
  const handleStickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    touchStartRef.current = { id: touch.identifier, startX: centerX, startY: centerY };
    setStickActive(true);
    updateJoystick(touch.clientX, touch.clientY, centerX, centerY);
  };

  const handleStickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStartRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchStartRef.current.id) {
        updateJoystick(touch.clientX, touch.clientY, touchStartRef.current.startX, touchStartRef.current.startY);
        break;
      }
    }
  };

  const handleStickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (!touchStartRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchStartRef.current.id) {
        touchStartRef.current = null;
        setStickActive(false);
        setKnobPos({ x: 0, y: 0 });
        onUpdateInput({ moveForward: 0, moveRight: 0 });
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number, centerX: number, centerY: number) => {
    const maxRadius = 46;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    const clampedDist = Math.min(dist, maxRadius);
    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    setKnobPos({ x: knobX, y: knobY });

    // Normalized outputs: forward is -dy, right is +dx
    const normForward = -knobY / maxRadius;
    const normRight = knobX / maxRadius;
    onUpdateInput({
      moveForward: Math.abs(normForward) < 0.15 ? 0 : normForward,
      moveRight: Math.abs(normRight) < 0.15 ? 0 : normRight,
    });
  };

  // Camera swipe look handlers on right side of screen
  const handleCameraTouchStart = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    cameraTouchRef.current = { id: touch.identifier, lastX: touch.clientX, lastY: touch.clientY };
  };

  const handleCameraTouchMove = (e: React.TouchEvent) => {
    if (!cameraTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchRef.current.id) {
        const deltaX = touch.clientX - cameraTouchRef.current.lastX;
        const deltaY = touch.clientY - cameraTouchRef.current.lastY;
        cameraTouchRef.current.lastX = touch.clientX;
        cameraTouchRef.current.lastY = touch.clientY;

        onUpdateInput({
          lookDeltaX: deltaX * 1.5,
          lookDeltaY: deltaY * 1.5,
        });
        break;
      }
    }
  };

  const handleCameraTouchEnd = (e: React.TouchEvent) => {
    if (!cameraTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchRef.current.id) {
        cameraTouchRef.current = null;
        onUpdateInput({ lookDeltaX: 0, lookDeltaY: 0 });
        break;
      }
    }
  };

  return (
    <div
      id={`touch-controls-container${idSuffix}`}
      className="absolute inset-0 pointer-events-none select-none z-30"
    >
      {/* Right screen half: Camera look swipe area */}
      <div
        id={`touch-camera-area${idSuffix}`}
        className="absolute top-0 right-0 w-3/5 h-full pointer-events-auto"
        onTouchStart={handleCameraTouchStart}
        onTouchMove={handleCameraTouchMove}
        onTouchEnd={handleCameraTouchEnd}
        onTouchCancel={handleCameraTouchEnd}
      />

      {/* Bottom-Left Transparent Virtual Joystick */}
      <div
        id={`touch-stick-wrapper${idSuffix}`}
        className="absolute bottom-6 left-6 pointer-events-auto flex flex-col items-center gap-1.5"
      >
        <div
          ref={stickRef}
          id={`touch-stick-base${idSuffix}`}
          className="w-28 h-28 rounded-full bg-black/25 backdrop-blur-xs border-2 border-white/20 relative flex items-center justify-center shadow-lg active:border-amber-400/50 transition-colors"
          onTouchStart={handleStickTouchStart}
          onTouchMove={handleStickTouchMove}
          onTouchEnd={handleStickTouchEnd}
          onTouchCancel={handleStickTouchEnd}
        >
          {/* Center Crosshair guides */}
          <div className="absolute w-8 h-0.5 bg-white/15" />
          <div className="absolute w-0.5 h-8 bg-white/15" />

          {/* Stick Knob */}
          <div
            id={`touch-stick-knob${idSuffix}`}
            className="w-12 h-12 rounded-full bg-white/30 border border-white/40 shadow-inner flex items-center justify-center transition-transform duration-75"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              backgroundColor: stickActive ? 'rgba(251, 191, 36, 0.4)' : 'rgba(255, 255, 255, 0.25)',
            }}
          >
            <div className="w-4 h-4 rounded-full bg-white/60" />
          </div>
        </div>
        <span className="text-[10px] font-mono tracking-wider text-white/50 uppercase font-semibold">
          {isCoopPlayer2 ? 'Mover J2' : 'Mover'}
        </span>
      </div>

      {/* Bottom-Right Transparent Action Buttons (Jump & Hammer) */}
      <div
        id={`touch-actions-wrapper${idSuffix}`}
        className="absolute bottom-6 right-6 pointer-events-auto flex items-end gap-3"
      >
        {/* Hammer / Action Button */}
        <button
          id={`touch-btn-hammer${idSuffix}`}
          type="button"
          className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-xs border-2 border-amber-400/40 active:bg-amber-500/40 text-amber-300 flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95"
          onTouchStart={(e) => {
            e.stopPropagation();
            onUpdateInput({ action: true });
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onUpdateInput({ action: false });
          }}
          onMouseDown={() => onUpdateInput({ action: true })}
          onMouseUp={() => onUpdateInput({ action: false })}
          title="Golpe con Martillo"
        >
          <Hammer className="w-6 h-6" />
          <span className="text-[9px] font-mono font-bold tracking-tighter mt-0.5">GOLPE</span>
        </button>

        {/* Jump Button */}
        <button
          id={`touch-btn-jump${idSuffix}`}
          type="button"
          className="w-20 h-20 rounded-full bg-black/35 backdrop-blur-xs border-2 border-emerald-400/50 active:bg-emerald-500/45 text-emerald-300 flex flex-col items-center justify-center shadow-xl transition-transform active:scale-95"
          onTouchStart={(e) => {
            e.stopPropagation();
            onUpdateInput({ jump: true });
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            onUpdateInput({ jump: false });
          }}
          onMouseDown={() => onUpdateInput({ jump: true })}
          onMouseUp={() => onUpdateInput({ jump: false })}
          title="Saltar"
        >
          <ArrowUp className="w-8 h-8 stroke-[2.5]" />
          <span className="text-[10px] font-mono font-bold tracking-wider mt-0.5">SALTO</span>
        </button>
      </div>
    </div>
  );
};
