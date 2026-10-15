import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Difficulty,
  SaveData,
  LeaderboardEntry,
  Filter8BitMode,
  RenderResolutionMode,
} from './types';
import { loadGameData, saveGameData, DEFAULT_KEY_BINDINGS_DOOM } from './utils/storage';
import { isTouchDevice } from './game/deviceDetection';
import { VoxelGameEngine, PlayerInput, PlayerRuntime } from './game/voxelEngine';
import { soundEngine } from './audio/soundEngine';
import { MainMenu } from './components/MainMenu';
import { GameHUD } from './components/GameHUD';
import { TouchControls } from './components/TouchControls';
import { PauseModal } from './components/PauseModal';
import { EndGameModal } from './components/EndGameModal';
import { CustomizationModal } from './components/CustomizationModal';
import { ShopModal } from './components/ShopModal';
import { AchievementsModal } from './components/AchievementsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ControlsConfigModal } from './components/ControlsConfigModal';
import { Filter8BitLayer } from './components/Filter8BitLayer';

type AppScreen = 'menu' | 'playing';
type ActiveModal = 'none' | 'customization' | 'shop' | 'achievements' | 'leaderboard' | 'controls';

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => loadGameData());
  const [screen, setScreen] = useState<AppScreen>('menu');
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [isPaused, setIsPaused] = useState(false);
  const [endGameResult, setEndGameResult] = useState<{
    isVictory: boolean;
    score: number;
    level: number;
    coinsEarned: number;
  } | null>(null);

  // Runtime Game Config
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('normal');
  const [isCoop, setIsCoop] = useState<boolean>(false);

  // Floating text toast on HUD
  const [floatingMessage, setFloatingMessage] = useState<{ text: string; color: string } | null>(null);

  // Player state snapshots for React HUD rendering
  const [p1State, setP1State] = useState<PlayerRuntime | null>(null);
  const [p2State, setP2State] = useState<PlayerRuntime | null>(null);

  // Touch device flag
  const [isTouch, setIsTouch] = useState<boolean>(false);

  // Three.js Engine References
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VoxelGameEngine | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Inputs Ref (Continuous polling in game loop)
  const p1InputRef = useRef<PlayerInput>({
    moveForward: 0,
    moveRight: 0,
    jump: false,
    action: false,
    lookDeltaX: 0,
    lookDeltaY: 0,
  });

  const p2InputRef = useRef<PlayerInput>({
    moveForward: 0,
    moveRight: 0,
    jump: false,
    action: false,
    lookDeltaX: 0,
    lookDeltaY: 0,
  });

  // Track active keyboard keys
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  const keyBindingsRef = useRef(saveData.settings.keyBindings || DEFAULT_KEY_BINDINGS_DOOM);

  useEffect(() => {
    keyBindingsRef.current = saveData.settings.keyBindings || DEFAULT_KEY_BINDINGS_DOOM;
  }, [saveData.settings.keyBindings]);

  // Detect touch device initially & on resize
  useEffect(() => {
    const check = () => {
      setIsTouch(isTouchDevice(saveData.settings.touchControlsForced));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [saveData.settings.touchControlsForced]);

  // Handle SaveData persistence and runtime sync with engine
  const updateSaveData = useCallback((newSave: SaveData) => {
    setSaveData(newSave);
    saveGameData(newSave);
    if (engineRef.current && newSave.settings) {
      engineRef.current.setFilterAndResolution(
        newSave.settings.filter8Bit || '8bit',
        newSave.settings.renderResolution || '8bit_retro'
      );
    }
  }, []);

  // Quick toggle between 8-bit filter modes (8Bit -> CRT -> Smooth -> Off)
  const handleToggleFilter = useCallback(() => {
    const modes: Filter8BitMode[] = ['8bit', 'crt', 'smooth', 'off'];
    const currentMode = saveData.settings.filter8Bit || '8bit';
    const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    const nextRes: RenderResolutionMode =
      nextMode === '8bit' ? '8bit_retro' : nextMode === 'crt' ? 'arcade' : 'high';

    const updated = {
      ...saveData,
      settings: {
        ...saveData.settings,
        filter8Bit: nextMode,
        renderResolution: nextRes,
      },
    };
    updateSaveData(updated);
    showFloatingToast(`Filtro: ${nextMode.toUpperCase()}`, '#f59e0b');
    soundEngine.playCoin();
  }, [saveData, updateSaveData]);

  // Display brief floating banner in HUD
  const showFloatingToast = (text: string, color: string) => {
    setFloatingMessage({ text, color });
    setTimeout(() => setFloatingMessage(null), 1800);
  };

  // Keyboard Event Handlers (Desktop & Co-Op Support)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser scrolling with Doom 1 arrow keys & space during active gameplay
      if (
        screen === 'playing' &&
        !isPaused &&
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
      ) {
        e.preventDefault();
      }

      keysPressedRef.current[e.code] = true;

      // Quick pause toggle
      if (e.code === 'Escape' && screen === 'playing' && !endGameResult) {
        setIsPaused(prev => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [screen, endGameResult]);

  // Pointer Lock & Mouse Look for Desktop
  useEffect(() => {
    if (screen !== 'playing') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        p1InputRef.current.lookDeltaX += e.movementX;
        p1InputRef.current.lookDeltaY += e.movementY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!isTouch && canvasContainerRef.current && !document.pointerLockElement && !isPaused && !endGameResult) {
        // Request pointer lock for immersive first-person look
        try {
          canvasContainerRef.current.requestPointerLock();
        } catch {}
      }
      if (e.button === 0) {
        p1InputRef.current.action = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        p1InputRef.current.action = false;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
  }, [screen, isTouch, isPaused, endGameResult]);

  // Start a new game session
  const startGame = (level: number, difficulty: Difficulty, coop: boolean) => {
    setCurrentLevel(level);
    setCurrentDifficulty(difficulty);
    setIsCoop(coop);
    setIsPaused(false);
    setEndGameResult(null);
    setScreen('playing');
  };

  // Mount 3D Voxel Engine when entering playing state
  useEffect(() => {
    if (screen !== 'playing' || !canvasContainerRef.current) return;

    const engine = new VoxelGameEngine(
      canvasContainerRef.current,
      currentLevel,
      currentDifficulty,
      isCoop,
      saveData
    );
    engineRef.current = engine;

    // Callbacks from game engine (Throttled to keep main loop running at buttery 60 FPS)
    let lastUiUpdate = 0;
    let lastP1Lives = -1;
    let lastP1Score = -1;
    let lastP1Coins = -1;
    let lastHammerActive = false;

    engine.onStateUpdate = (p1, p2) => {
      const now = performance.now();
      const hammerActive = p1.hammerTimeLeft > 0;
      const isCritical =
        p1.lives !== lastP1Lives ||
        p1.score !== lastP1Score ||
        p1.coinsEarned !== lastP1Coins ||
        hammerActive !== lastHammerActive;

      if (isCritical || now - lastUiUpdate > 85) {
        lastUiUpdate = now;
        lastP1Lives = p1.lives;
        lastP1Score = p1.score;
        lastP1Coins = p1.coinsEarned;
        lastHammerActive = hammerActive;
        setP1State({ ...p1 });
        if (p2) setP2State({ ...p2 });
      }
    };

    engine.onFloatingText = (text, color) => {
      showFloatingToast(text, color);
    };

    engine.onAchievementTrigger = (achId: string) => {
      const ach = saveData.achievements.find(a => a.id === achId);
      if (ach && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedAt = new Date().toISOString();
        const newTotalCoins = saveData.stats.totalCoins + ach.rewardCoins;
        showFloatingToast(`🏆 ¡Logro Desbloqueado: ${ach.title}!`, '#10b981');
        soundEngine.playCoin();
        updateSaveData({
          ...saveData,
          stats: { ...saveData.stats, totalCoins: newTotalCoins },
        });
      }
    };

    engine.onGameOver = (finalScore, lvl) => {
      const isNewHighScore = finalScore > saveData.stats.highScore;
      const updatedHighScore = Math.max(saveData.stats.highScore, finalScore);
      const updatedSave: SaveData = {
        ...saveData,
        stats: {
          ...saveData.stats,
          highScore: updatedHighScore,
          gamesPlayed: saveData.stats.gamesPlayed + 1,
        },
      };
      updateSaveData(updatedSave);

      setEndGameResult({
        isVictory: false,
        score: finalScore,
        level: lvl,
        coinsEarned: engine.p1.coinsEarned + (engine.p2?.coinsEarned || 0),
      });

      if (isNewHighScore) {
        showFloatingToast('¡NUEVO RÉCORD HISTÓRICO!', '#facc15');
      }
    };

    engine.onVictory = (finalScore, lvl, coins) => {
      const nextLevel = Math.min(4, lvl + 1);
      const updatedMaxLevel = Math.max(saveData.stats.maxLevelUnlocked, nextLevel);
      const updatedHighScore = Math.max(saveData.stats.highScore, finalScore);

      const updatedSave: SaveData = {
        ...saveData,
        stats: {
          ...saveData.stats,
          highScore: updatedHighScore,
          totalCoins: saveData.stats.totalCoins + coins,
          maxLevelUnlocked: updatedMaxLevel,
          currentLevel: nextLevel,
          gamesPlayed: saveData.stats.gamesPlayed + 1,
          coopWins: isCoop ? saveData.stats.coopWins + 1 : saveData.stats.coopWins,
        },
      };
      updateSaveData(updatedSave);

      setEndGameResult({
        isVictory: true,
        score: finalScore,
        level: lvl,
        coinsEarned: coins,
      });
    };

    // Main Game Animation Frame Loop
    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const rawDt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      // Clamp dt between 0.001 and 0.033 (maximum 30fps drop) to keep physics smooth and stable
      const dt = Math.min(0.033, Math.max(0.001, rawDt));

      if (engineRef.current && !isPaused && !endGameResult) {
        // Assemble keyboard inputs for Desktop using configured bindings (Doom 1 by default)
        const keys = keysPressedRef.current;
        const binds = keyBindingsRef.current;

        // Player 1 Keyboard
        let p1Fwd = p1InputRef.current.moveForward;
        let p1Right = p1InputRef.current.moveRight;
        let p1TurnLeft = false;
        let p1TurnRight = false;

        // Forward / Backward movement
        if (keys[binds.forward] || (binds.forward !== 'KeyW' && keys['KeyW'])) {
          p1Fwd = 1;
        } else if (keys[binds.backward] || (binds.backward !== 'KeyS' && keys['KeyS'])) {
          p1Fwd = -1;
        }

        // Left / Right controls:
        // In Doom 1, ArrowLeft and ArrowRight turn the camera view!
        if (binds.left === 'ArrowLeft') {
          if (keys['ArrowLeft']) p1TurnLeft = true;
          // Strafe left with Comma, KeyA, or Alt+Arrow
          if (keys['KeyA'] || keys['Comma'] || (keys['AltLeft'] && keys['ArrowLeft'])) {
            p1Right = -1;
          }
        } else {
          if (keys[binds.left] || keys['KeyA']) p1Right = -1;
        }

        if (binds.right === 'ArrowRight') {
          if (keys['ArrowRight']) p1TurnRight = true;
          // Strafe right with Period, KeyD, or Alt+Arrow
          if (keys['KeyD'] || keys['Period'] || (keys['AltLeft'] && keys['ArrowRight'])) {
            p1Right = 1;
          }
        } else {
          if (keys[binds.right] || keys['KeyD']) p1Right = 1;
        }

        const p1Jump =
          keys[binds.jump] ||
          keys['Space'] ||
          p1InputRef.current.jump;

        const p1Action =
          keys[binds.action] ||
          keys['ControlLeft'] ||
          keys['ControlRight'] ||
          keys['KeyF'] ||
          keys['KeyE'] ||
          p1InputRef.current.action;

        // Player 2 Keyboard in Co-op (Dynamic alternate scheme)
        let p2Fwd = p2InputRef.current.moveForward;
        let p2Right = p2InputRef.current.moveRight;
        let p2TurnLeft = false;
        let p2TurnRight = false;

        const p1UsesArrows = binds.forward === 'ArrowUp';
        if (p1UsesArrows) {
          if (keys['KeyW']) p2Fwd = 1;
          else if (keys['KeyS']) p2Fwd = -1;
          if (keys['KeyD']) p2Right = 1;
          else if (keys['KeyA']) p2Right = -1;
        } else {
          if (keys['ArrowUp']) p2Fwd = 1;
          else if (keys['ArrowDown']) p2Fwd = -1;
          if (keys['ArrowRight']) {
            p2TurnRight = true;
            p2Right = 1;
          } else if (keys['ArrowLeft']) {
            p2TurnLeft = true;
            p2Right = -1;
          }
        }

        const p2Jump = p1UsesArrows
          ? keys['ShiftLeft'] || keys['KeyJ'] || p2InputRef.current.jump
          : keys['Enter'] || keys['ShiftRight'] || keys['Numpad0'] || p2InputRef.current.jump;
        const p2Action = p1UsesArrows
          ? keys['KeyE'] || keys['KeyK'] || p2InputRef.current.action
          : keys['KeyL'] || keys['KeyK'] || keys['NumpadDecimal'] || p2InputRef.current.action;

        const p1CompiledInput: PlayerInput = {
          moveForward: p1Fwd,
          moveRight: p1Right,
          turnLeft: p1TurnLeft,
          turnRight: p1TurnRight,
          jump: p1Jump,
          action: p1Action,
          lookDeltaX: p1InputRef.current.lookDeltaX,
          lookDeltaY: p1InputRef.current.lookDeltaY,
        };

        const p2CompiledInput: PlayerInput = {
          moveForward: p2Fwd,
          moveRight: p2Right,
          turnLeft: p2TurnLeft,
          turnRight: p2TurnRight,
          jump: p2Jump,
          action: p2Action,
          lookDeltaX: p2InputRef.current.lookDeltaX,
          lookDeltaY: p2InputRef.current.lookDeltaY,
        };

        // Reset delta mouse movements for next frame
        p1InputRef.current.lookDeltaX = 0;
        p1InputRef.current.lookDeltaY = 0;
        p2InputRef.current.lookDeltaX = 0;
        p2InputRef.current.lookDeltaY = 0;

        engineRef.current.update(dt, p1CompiledInput, isCoop ? p2CompiledInput : undefined);
        engineRef.current.render();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, [screen, currentLevel, currentDifficulty, isCoop, isPaused, endGameResult]);

  // Touch controls input update handlers
  const handleTouchUpdateP1 = (delta: Partial<PlayerInput>) => {
    p1InputRef.current = { ...p1InputRef.current, ...delta };
  };

  const handleTouchUpdateP2 = (delta: Partial<PlayerInput>) => {
    p2InputRef.current = { ...p2InputRef.current, ...delta };
  };

  // Leaderboard save score from EndGame modal
  const handleSaveScoreToLeaderboard = (playerName: string) => {
    if (!endGameResult) return;
    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      playerName,
      score: endGameResult.score,
      level: endGameResult.level,
      difficulty: currentDifficulty,
      date: new Date().toISOString().split('T')[0],
      avatar: '🦍',
      isLocalUser: true,
    };

    const updatedLeaderboard = [newEntry, ...saveData.leaderboard].sort((a, b) => b.score - a.score);
    updateSaveData({
      ...saveData,
      leaderboard: updatedLeaderboard,
    });
  };

  return (
    <div id="simio-salvaje-root" className="relative w-full h-screen overflow-hidden bg-zinc-950 font-sans select-none">
      {/* 1. Main Menu Screen */}
      {screen === 'menu' && (
        <MainMenu
          saveData={saveData}
          onStartGame={startGame}
          onOpenCustomization={() => setActiveModal('customization')}
          onOpenShop={() => setActiveModal('shop')}
          onOpenAchievements={() => setActiveModal('achievements')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenControlsConfig={() => setActiveModal('controls')}
          onUpdateSave={updateSaveData}
        />
      )}

      {/* 2. Active 3D Gameplay Screen */}
      {screen === 'playing' && (
        <div id="gameplay-viewport" className="relative w-full h-full overflow-hidden">
          {/* Three.js Render Target */}
          <div ref={canvasContainerRef} className="w-full h-full cursor-crosshair overflow-hidden" />

          {/* 8-Bit Visual Layer & CRT Filter */}
          <Filter8BitLayer mode={saveData.settings.filter8Bit || '8bit'} />

          {/* HUD Overlay */}
          {p1State && (
            <GameHUD
              p1={p1State}
              p2={p2State}
              isCoop={isCoop}
              highScore={saveData.stats.highScore}
              levelNum={currentLevel}
              difficulty={currentDifficulty}
              isTouch={isTouch}
              keyBindings={saveData.settings.keyBindings}
              filterMode={saveData.settings.filter8Bit}
              onToggleFilter={handleToggleFilter}
              onPause={() => setIsPaused(true)}
              floatingMessage={floatingMessage}
            />
          )}

          {/* Transparent Touch Controls (Only on touch devices / tablets / phones or if forced in settings) */}
          {isTouch && !isPaused && !endGameResult && (
            <>
              {/* P1 Touch Controls */}
              <TouchControls onUpdateInput={handleTouchUpdateP1} idSuffix="-p1" />

              {/* In 2P Co-Op on tablet/mobile: P2 touch controls on top half */}
              {isCoop && (
                <TouchControls
                  onUpdateInput={handleTouchUpdateP2}
                  idSuffix="-p2"
                  isCoopPlayer2={true}
                />
              )}
            </>
          )}

          {/* Pause Modal */}
          {isPaused && (
            <PauseModal
              onResume={() => setIsPaused(false)}
              onRestart={() => {
                setIsPaused(false);
                startGame(currentLevel, currentDifficulty, isCoop);
              }}
              onReturnToMenu={() => {
                setIsPaused(false);
                soundEngine.stopMusic();
                setScreen('menu');
              }}
              onOpenControlsConfig={() => setActiveModal('controls')}
              saveData={saveData}
              onUpdateSave={updateSaveData}
            />
          )}

          {/* End Game Modal (Victory / Game Over) */}
          {endGameResult && (
            <EndGameModal
              isVictory={endGameResult.isVictory}
              score={endGameResult.score}
              level={endGameResult.level}
              coinsEarned={endGameResult.coinsEarned}
              onRestart={() => startGame(currentLevel, currentDifficulty, isCoop)}
              onNextLevel={() => startGame(Math.min(4, currentLevel + 1), currentDifficulty, isCoop)}
              onReturnToMenu={() => {
                setEndGameResult(null);
                soundEngine.stopMusic();
                setScreen('menu');
              }}
              onSaveScore={handleSaveScoreToLeaderboard}
            />
          )}
        </div>
      )}

      {/* Meta Modals */}
      {activeModal === 'controls' && (
        <ControlsConfigModal
          saveData={saveData}
          onUpdateSave={updateSaveData}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'customization' && (
        <CustomizationModal
          saveData={saveData}
          onUpdateSave={updateSaveData}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'shop' && (
        <ShopModal
          saveData={saveData}
          onUpdateSave={updateSaveData}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'achievements' && (
        <AchievementsModal
          saveData={saveData}
          onUpdateSave={updateSaveData}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          saveData={saveData}
          onClose={() => setActiveModal('none')}
        />
      )}
    </div>
  );
}
