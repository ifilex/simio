import { LevelConfig } from '../types';

export interface GirderFloor {
  floorIndex: number;
  y: number;
  // Slope: left higher than right or right higher than left
  slopeDir: 'left-to-right' | 'right-to-left' | 'flat';
  slopeAngle: number;
  zMin: number;
  zMax: number;
  xMin: number;
  xMax: number;
}

export interface LadderDef {
  x: number;
  z: number;
  bottomY: number;
  topY: number;
  isBroken?: boolean;
}

export interface ItemDef {
  type: 'banana' | 'hammer';
  x: number;
  y: number;
  z: number;
  collected?: boolean;
}

export const LEVELS_CONFIG: LevelConfig[] = [
  {
    id: 1,
    name: 'Nivel 1: Las Vigas Inclinadas',
    themeName: 'Andamios de la Jungla',
    towerFloors: 5,
    floorHeight: 4.2,
    width: 26,
    depth: 3.4,
    apeFloor: 4,
    themeColors: {
      girder: 0xd9383a, // Classic arcade magenta-red
      girderTop: 0xef4444,
      ladder: 0x38bdf8, // Classic cyan/blue ladder
      foliage: 0x22c55e,
      ambient: 0x1e293b,
      sky: 0x0f172a,
    },
  },
  {
    id: 2,
    name: 'Nivel 2: Cintas y Elevadores',
    themeName: 'Fábrica Mecánica en el Volcán',
    towerFloors: 5,
    floorHeight: 4.2,
    width: 26,
    depth: 3.2,
    apeFloor: 4,
    hasConveyors: true,
    themeColors: {
      girder: 0x0284c7, // Cool industrial steel
      girderTop: 0x38bdf8,
      ladder: 0xf59e0b, // Amber ladders
      foliage: 0x10b981,
      ambient: 0x18181b,
      sky: 0x1c1917,
    },
  },
  {
    id: 3,
    name: 'Nivel 3: Remaches de Acero',
    themeName: 'Estructura Colgante Voxel',
    towerFloors: 5,
    floorHeight: 4.2,
    width: 28,
    depth: 3.0,
    apeFloor: 4,
    hasRivets: true,
    themeColors: {
      girder: 0x9333ea, // Deep arcade purple
      girderTop: 0xa855f7,
      ladder: 0xeab308,
      foliage: 0x4ade80,
      ambient: 0x2e1065,
      sky: 0x170b2e,
    },
  },
  {
    id: 4,
    name: 'Nivel 4: La Cumbre Salvaje',
    themeName: 'Templo del Simio Titán',
    towerFloors: 6,
    floorHeight: 4.2,
    width: 30,
    depth: 3.2,
    apeFloor: 5,
    themeColors: {
      girder: 0xb45309, // Ancient golden stone & brass
      girderTop: 0xf59e0b,
      ladder: 0x10b981,
      foliage: 0x84cc16,
      ambient: 0x451a03,
      sky: 0x1f1003,
    },
  },
];
