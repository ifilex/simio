export type Difficulty = 'facil' | 'normal' | 'dificil' | 'caos';

export interface DifficultyConfig {
  id: Difficulty;
  name: string;
  subtitle: string;
  description: string;
  barrelSpeed: number;
  throwInterval: number; // seconds
  playerLives: number;
  scoreMultiplier: number;
  color: string;
}

export interface PlayerCustomization {
  skinId: string;
  hatId: string;
  hammerId: string;
  colorTheme: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'skin' | 'hat' | 'hammer';
  price: number;
  description: string;
  previewColor: string;
  unlockedByDefault?: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rewardCoins: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  level: number;
  difficulty: Difficulty;
  date: string;
  avatar: string;
  isLocalUser?: boolean;
}

export interface GameStats {
  highScore: number;
  totalCoins: number;
  currentLevel: number;
  maxLevelUnlocked: number;
  totalBarrelsJumped: number;
  totalBarrelsSmashed: number;
  gamesPlayed: number;
  coopWins: number;
}

export interface KeyBindingsConfig {
  forward: string;
  backward: string;
  left: string;
  right: string;
  jump: string;
  action: string;
}

export type Filter8BitMode = '8bit' | 'crt' | 'smooth' | 'off';
export type RenderResolutionMode = '8bit_retro' | 'arcade' | 'high';

export interface SaveData {
  stats: GameStats;
  customizationP1: PlayerCustomization;
  customizationP2: PlayerCustomization;
  unlockedItems: string[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  settings: {
    musicVolume: number;
    sfxVolume: number;
    foliageParticles: boolean;
    volumetricRays: boolean;
    touchControlsForced?: boolean;
    keyBindings: KeyBindingsConfig;
    filter8Bit: Filter8BitMode;
    renderResolution: RenderResolutionMode;
  };
}

export interface VoxelBarrel {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  radius: number;
  type: 'wood' | 'fire' | 'gold';
  isGrounded: boolean;
  onLadder: boolean;
  floor: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  themeName: string;
  towerFloors: number;
  floorHeight: number;
  width: number;
  depth: number;
  apeFloor: number;
  hasConveyors?: boolean;
  hasRivets?: boolean;
  themeColors: {
    girder: number;
    girderTop: number;
    ladder: number;
    foliage: number;
    ambient: number;
    sky: number;
  };
}
