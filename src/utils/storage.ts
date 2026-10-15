import { DifficultyConfig, SaveData, ShopItem, Achievement, LeaderboardEntry, KeyBindingsConfig } from '../types';

export const DEFAULT_KEY_BINDINGS_DOOM: KeyBindingsConfig = {
  forward: 'ArrowUp',
  backward: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  jump: 'Space',
  action: 'ControlLeft',
};

export const DEFAULT_KEY_BINDINGS_WASD: KeyBindingsConfig = {
  forward: 'KeyW',
  backward: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  jump: 'Space',
  action: 'KeyF',
};

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: 'facil',
    name: 'Selva Serena',
    subtitle: 'Fácil',
    description: 'Barriles más lentos, 5 vidas y ritmo relajado para explorar.',
    barrelSpeed: 0.8,
    throwInterval: 4.5,
    playerLives: 5,
    scoreMultiplier: 1.0,
    color: '#10b981',
  },
  {
    id: 'normal',
    name: 'Desafío Clásico',
    subtitle: 'Normal',
    description: 'La experiencia auténtica arcade. 3 vidas, velocidad estándar.',
    barrelSpeed: 1.2,
    throwInterval: 3.2,
    playerLives: 3,
    scoreMultiplier: 1.5,
    color: '#f59e0b',
  },
  {
    id: 'dificil',
    name: 'Furia del Simio',
    subtitle: 'Difícil',
    description: 'Barriles veloces, rebotes impredecibles y barriles de fuego.',
    barrelSpeed: 1.7,
    throwInterval: 2.2,
    playerLives: 2,
    scoreMultiplier: 2.5,
    color: '#ef4444',
  },
  {
    id: 'caos',
    name: 'Caos Salvaje',
    subtitle: 'Extremo',
    description: 'Sobrecarga de barriles ígneos, 1 sola vida y máxima velocidad.',
    barrelSpeed: 2.2,
    throwInterval: 1.5,
    playerLives: 1,
    scoreMultiplier: 4.0,
    color: '#a855f7',
  },
];

export const SHOP_ITEMS: ShopItem[] = [
  // Skins
  {
    id: 'skin_classic',
    name: 'Mono Clásico Azul/Rojo',
    category: 'skin',
    price: 0,
    description: 'El clásico overol del carpintero intrépido.',
    previewColor: '#dc2626',
    unlockedByDefault: true,
  },
  {
    id: 'skin_safari',
    name: 'Explorador Selvático',
    category: 'skin',
    price: 150,
    description: 'Traje caqui con cinturón de herramientas para expedición.',
    previewColor: '#84cc16',
  },
  {
    id: 'skin_cyber',
    name: 'Voxel Cyber Runner',
    category: 'skin',
    price: 350,
    description: 'Armadura voxel con luces de neón cian y magenta.',
    previewColor: '#06b6d4',
  },
  {
    id: 'skin_golden',
    name: 'Rey de las Alturas',
    category: 'skin',
    price: 600,
    description: 'Overol bañado en oro puro de 24 kilates.',
    previewColor: '#fbbf24',
  },
  // Hats
  {
    id: 'hat_cap',
    name: 'Gorra Roja Voxel',
    category: 'hat',
    price: 0,
    description: 'Gorra retro con visera frontal.',
    previewColor: '#ef4444',
    unlockedByDefault: true,
  },
  {
    id: 'hat_miner',
    name: 'Casco de Minero con Linterna',
    category: 'hat',
    price: 120,
    description: 'Protección para la cabeza con potente foco frontal.',
    previewColor: '#eab308',
  },
  {
    id: 'hat_bandana',
    name: 'Bandana de Supervivencia',
    category: 'hat',
    price: 200,
    description: 'Cinta roja que da +100 a la determinación.',
    previewColor: '#f43f5e',
  },
  {
    id: 'hat_crown',
    name: 'Corona Imperial Voxel',
    category: 'hat',
    price: 500,
    description: 'Corona enjoyada digna del que escala la cima.',
    previewColor: '#eab308',
  },
  // Hammers
  {
    id: 'hammer_classic',
    name: 'Mazo de Madera Rústica',
    category: 'hammer',
    price: 0,
    description: 'Mazo clásico de carpintero para pulverizar barriles.',
    previewColor: '#78350f',
    unlockedByDefault: true,
  },
  {
    id: 'hammer_steel',
    name: 'Mazo de Acero Voxel',
    category: 'hammer',
    price: 180,
    description: 'Aleación reforzada que destruye barriles con un solo golpe.',
    previewColor: '#94a3b8',
  },
  {
    id: 'hammer_banana',
    name: 'Mazo de Banana Sagrada',
    category: 'hammer',
    price: 300,
    description: 'Poder frutal concentrado que suelta destellos.',
    previewColor: '#facc15',
  },
  {
    id: 'hammer_laser',
    name: 'Mazo de Plasma Electrificado',
    category: 'hammer',
    price: 550,
    description: 'Energía pura que desintegra los barriles con chispas 8-bit.',
    previewColor: '#38bdf8',
  },
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_first_jump',
    title: '¡Por los Aires!',
    description: 'Salta por encima de tu primer barril con éxito.',
    icon: 'ArrowUpCircle',
    unlocked: false,
    rewardCoins: 50,
  },
  {
    id: 'ach_barrel_smasher',
    title: 'Demoledor Voxel',
    description: 'Destruye 5 barriles usando el mazo de poder.',
    icon: 'Hammer',
    unlocked: false,
    rewardCoins: 100,
  },
  {
    id: 'ach_climb_master',
    title: 'Rey de las Escaleras',
    description: 'Sube 3 pisos completos en menos de 45 segundos.',
    icon: 'TrendingUp',
    unlocked: false,
    rewardCoins: 120,
  },
  {
    id: 'ach_level1_clear',
    title: 'Desafío a las Alturas',
    description: 'Supera el nivel 1 de vigas y llega hasta la cima del Simio.',
    icon: 'Award',
    unlocked: false,
    rewardCoins: 200,
  },
  {
    id: 'ach_banana_hoarder',
    title: 'Banquete Primate',
    description: 'Recolecta 30 bananas/monedas doradas durante tus ascensos.',
    icon: 'Coins',
    unlocked: false,
    rewardCoins: 150,
  },
  {
    id: 'ach_coop_play',
    title: 'Dúo Dinámico',
    description: 'Juega una partida en modo cooperativo local de 2 jugadores.',
    icon: 'Users',
    unlocked: false,
    rewardCoins: 100,
  },
  {
    id: 'ach_hardcore',
    title: 'Espíritu Salvaje',
    description: 'Alcanza el piso superior en dificultad Furia o Caos.',
    icon: 'Flame',
    unlocked: false,
    rewardCoins: 300,
  },
  {
    id: 'ach_fashion',
    title: 'Estilo en las Alturas',
    description: 'Equipa una skin y un sombrero personalizados.',
    icon: 'Sparkles',
    unlocked: false,
    rewardCoins: 80,
  },
];

export const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', playerName: 'KongoKing_99', score: 12450, level: 4, difficulty: 'caos', date: '2026-09-12', avatar: '🦍' },
  { id: '2', playerName: 'VoxelMario_Retro', score: 9800, level: 3, difficulty: 'dificil', date: '2026-09-13', avatar: '🔨' },
  { id: '3', playerName: 'SelvaRunner_AR', score: 7650, level: 3, difficulty: 'normal', date: '2026-09-11', avatar: '🌴' },
  { id: '4', playerName: 'JumpPro_Pixel', score: 5400, level: 2, difficulty: 'normal', date: '2026-09-14', avatar: '⭐' },
  { id: '5', playerName: 'ArcadeMaster_84', score: 4200, level: 2, difficulty: 'facil', date: '2026-09-10', avatar: '🕹️' },
];

const STORAGE_KEY = 'simio_salvaje_save_v1';

export function getInitialSaveData(): SaveData {
  return {
    stats: {
      highScore: 0,
      totalCoins: 100, // Bono inicial de bienvenida
      currentLevel: 1,
      maxLevelUnlocked: 1,
      totalBarrelsJumped: 0,
      totalBarrelsSmashed: 0,
      gamesPlayed: 0,
      coopWins: 0,
    },
    customizationP1: {
      skinId: 'skin_classic',
      hatId: 'hat_cap',
      hammerId: 'hammer_classic',
      colorTheme: '#dc2626',
    },
    customizationP2: {
      skinId: 'skin_safari',
      hatId: 'hat_bandana',
      hammerId: 'hammer_steel',
      colorTheme: '#2563eb',
    },
    unlockedItems: ['skin_classic', 'hat_cap', 'hammer_classic'],
    achievements: INITIAL_ACHIEVEMENTS,
    leaderboard: DEFAULT_LEADERBOARD,
    settings: {
      musicVolume: 0.7,
      sfxVolume: 0.8,
      foliageParticles: true,
      volumetricRays: true,
      touchControlsForced: undefined,
      keyBindings: DEFAULT_KEY_BINDINGS_DOOM,
      filter8Bit: '8bit',
      renderResolution: '8bit_retro',
    },
  };
}

export function loadGameData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialSaveData();
    const parsed = JSON.parse(raw);
    const initial = getInitialSaveData();

    // Merge to preserve newly added achievements or items
    return {
      ...initial,
      ...parsed,
      stats: { ...initial.stats, ...(parsed.stats || {}) },
      customizationP1: { ...initial.customizationP1, ...(parsed.customizationP1 || {}) },
      customizationP2: { ...initial.customizationP2, ...(parsed.customizationP2 || {}) },
      settings: {
        ...initial.settings,
        ...(parsed.settings || {}),
        filter8Bit: parsed.settings?.filter8Bit || '8bit',
        renderResolution: parsed.settings?.renderResolution || '8bit_retro',
        keyBindings: {
          ...initial.settings.keyBindings,
          ...(parsed.settings?.keyBindings || {}),
        },
      },
      unlockedItems: Array.from(new Set([...initial.unlockedItems, ...(parsed.unlockedItems || [])])),
      achievements: initial.achievements.map(initAch => {
        const found = parsed.achievements?.find((a: Achievement) => a.id === initAch.id);
        return found ? { ...initAch, ...found } : initAch;
      }),
      leaderboard: parsed.leaderboard && parsed.leaderboard.length > 0 ? parsed.leaderboard : initial.leaderboard,
    };
  } catch {
    return getInitialSaveData();
  }
}

export function saveGameData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Auto-save locally error:', e);
  }
}
