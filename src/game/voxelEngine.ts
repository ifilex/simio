import * as THREE from 'three';
import { Difficulty, PlayerCustomization, LevelConfig, SaveData, Filter8BitMode, RenderResolutionMode } from '../types';
import { soundEngine } from '../audio/soundEngine';
import {
  createVoxelBox,
  createVoxelApe,
  createVoxelBarrelMesh,
  createFirstPersonArmViewModel,
  createThirdPersonAvatar,
  createVoxelBananaCollectible,
  createVoxelHammerPedestal,
  createVolumetricLightRays,
  createFoliageParticleSystem,
  SHARED_DEBRIS_GEOMETRY,
  getCachedVoxelMaterial,
} from './voxelModels';
import { LEVELS_CONFIG } from './voxelLevels';

export interface PlayerInput {
  moveForward: number; // -1 to 1
  moveRight: number;   // -1 to 1
  turnLeft?: boolean;
  turnRight?: boolean;
  jump: boolean;
  action: boolean;     // Hammer smash or interact
  lookDeltaX: number;
  lookDeltaY: number;
}

export interface PlayerRuntime {
  id: 'p1' | 'p2';
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: { yaw: number; pitch: number };
  isGrounded: boolean;
  isClimbing: boolean;
  lives: number;
  score: number;
  coinsEarned: number;
  hammerTimeLeft: number; // in seconds
  camera: THREE.PerspectiveCamera;
  armViewModel: THREE.Group;
  avatarMesh: THREE.Group;
  lastJumpTime: number;
  cleanJumps: number;
}

export interface BarrelRuntime {
  id: number;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rotX: number;
  rotZ: number;
  radius: number;
  type: 'wood' | 'fire' | 'gold';
  isGrounded: boolean;
  floor: number;
  passedP1?: boolean;
  passedP2?: boolean;
}

export interface CollectibleRuntime {
  id: number;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  type: 'banana' | 'hammer';
  active: boolean;
}

export interface VoxelDebrisParticle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export class VoxelGameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private animFrameId: number | null = null;
  private lastTime = 0;

  // Level & Difficulty
  public currentLevelConfig: LevelConfig;
  public difficulty: Difficulty;
  public isCoop = false;
  public isPaused = false;
  public isGameOver = false;
  public isVictory = false;

  // 8-Bit Filter & Optimization Modes
  public filterMode: Filter8BitMode = '8bit';
  public resolutionMode: RenderResolutionMode = '8bit_retro';
  private bufferWidth = 320;
  private bufferHeight = 240;

  // Players
  public p1: PlayerRuntime;
  public p2: PlayerRuntime | null = null;

  // World entities
  private apeGroup!: THREE.Group;
  private apeThrowTimer = 0;
  private apeArmSwing = 0;
  private barrels: BarrelRuntime[] = [];
  private barrelIdCounter = 0;
  private collectibles: CollectibleRuntime[] = [];
  private debrisParticles: VoxelDebrisParticle[] = [];
  private foliageSystem?: { mesh: THREE.InstancedMesh; update: (delta: number) => void };

  // Callbacks for UI updates
  public onStateUpdate?: (p1: PlayerRuntime, p2: PlayerRuntime | null) => void;
  public onGameOver?: (score: number, level: number) => void;
  public onVictory?: (score: number, level: number, coins: number) => void;
  public onAchievementTrigger?: (achId: string) => void;
  public onFloatingText?: (text: string, color: string) => void;

  // Level layout geometry bounds
  private floorsData: Array<{
    index: number;
    baseY: number;
    slope: number; // dy/dx
    xMin: number;
    xMax: number;
    zMin: number;
    zMax: number;
  }> = [];

  private laddersData: Array<{
    x: number;
    z: number;
    yBottom: number;
    yTop: number;
  }> = [];

  // Goal area
  private goalPos = new THREE.Vector3(0, 0, 0);

  constructor(
    container: HTMLElement,
    levelNum: number,
    difficulty: Difficulty,
    isCoop: boolean,
    saveData: SaveData
  ) {
    this.container = container;
    this.difficulty = difficulty;
    this.isCoop = isCoop;
    this.currentLevelConfig = LEVELS_CONFIG.find(l => l.id === levelNum) || LEVELS_CONFIG[0];
    this.filterMode = saveData.settings.filter8Bit || '8bit';
    this.resolutionMode = saveData.settings.renderResolution || '8bit_retro';

    // Initialize Three.js Scene (Enclosed Industrial Facility Atmosphere)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a10);
    this.scene.fog = new THREE.FogExp2(0x0a0a10, 0.012);

    // High performance renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      precision: 'mediump',
      stencil: false,
    });
    
    // Configure internal resolution scaling (drastically reduces GPU fill rate)
    this.updateRendererSize();

    // Lighting setup (optimized for high FPS)
    this.renderer.shadowMap.enabled = this.resolutionMode === 'high';
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    container.appendChild(this.renderer.domElement);

    // Setup Lighting
    this.setupLighting();

    // Setup Environment Particles & Volumetric Rays
    if (saveData.settings.volumetricRays) {
      const godRays = createVolumetricLightRays(6);
      this.scene.add(godRays);
    }
    if (saveData.settings.foliageParticles) {
      this.foliageSystem = createFoliageParticleSystem(120);
      this.scene.add(this.foliageSystem.mesh);
    }

    // Build World Architecture (Girders, Ladders, Ape Summit)
    this.buildLevelArchitecture();

    // Initialize Players
    const lives = this.getStartingLives();
    this.p1 = this.createPlayer('p1', saveData.customizationP1, lives, new THREE.Vector3(-10, 1.2, 0));
    if (this.isCoop) {
      this.p2 = this.createPlayer('p2', saveData.customizationP2, lives, new THREE.Vector3(-7, 1.2, 0));
      // In co-op, add 3D avatars so players can see each other in first person!
      this.scene.add(this.p1.avatarMesh);
      this.scene.add(this.p2.avatarMesh);
    }

    // Resize listener
    window.addEventListener('resize', this.handleResize);

    // Start Audio
    soundEngine.startMusic();
    soundEngine.playApeRoar();
  }

  public updateRendererSize() {
    if (!this.container || !this.renderer) return;
    const clientW = this.container.clientWidth || window.innerWidth;
    const clientH = this.container.clientHeight || window.innerHeight;

    let targetW = clientW;
    let targetH = clientH;
    let pixelRatio = 1;

    if (this.resolutionMode === '8bit_retro') {
      // Authentic retro 8-bit resolution (low buffer resolution for 5x FPS and genuine pixel look)
      const targetHeight = Math.min(320, Math.max(220, Math.floor(clientH * 0.42)));
      const aspect = clientW / clientH;
      targetH = targetHeight;
      targetW = Math.floor(targetH * aspect);
      pixelRatio = 1;
      this.renderer.domElement.style.imageRendering = 'pixelated';
    } else if (this.resolutionMode === 'arcade') {
      const targetHeight = Math.min(540, Math.max(340, Math.floor(clientH * 0.65)));
      const aspect = clientW / clientH;
      targetH = targetHeight;
      targetW = Math.floor(targetH * aspect);
      pixelRatio = 1;
      this.renderer.domElement.style.imageRendering = 'pixelated';
    } else {
      // High/Smooth native resolution
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      targetW = clientW;
      targetH = clientH;
      this.renderer.domElement.style.imageRendering = 'auto';
    }

    this.bufferWidth = targetW;
    this.bufferHeight = targetH;
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(targetW, targetH, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
  }

  public setFilterAndResolution(filter: Filter8BitMode, res: RenderResolutionMode) {
    this.filterMode = filter;
    this.resolutionMode = res;
    this.renderer.shadowMap.enabled = this.resolutionMode === 'high';
    this.updateRendererSize();
  }

  private getStartingLives(): number {
    if (this.difficulty === 'facil') return 5;
    if (this.difficulty === 'normal') return 3;
    if (this.difficulty === 'dificil') return 2;
    return 1;
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(this.currentLevelConfig.themeColors.ambient, 1.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfffbeb, 2.2);
    sun.position.set(15, 30, 20);
    sun.castShadow = this.resolutionMode === 'high';
    sun.shadow.mapSize.width = 512;
    sun.shadow.mapSize.height = 512;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 70;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -5;
    this.scene.add(sun);

    // Colored rim light for arcade retro vibrance
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-20, 15, -15);
    this.scene.add(rimLight);
  }

  private buildEnclosedSector(width: number, depth: number, numFloors: number, fh: number) {
    const roomWidth = width + 8;
    const roomHeight = (numFloors + 1) * fh + 6;
    const roomDepth = depth + 7;
    const backWallZ = -depth / 2 - 1.4;
    const frontWallZ = depth / 2 + 3.4;
    const leftWallX = -width / 2 - 2.8;
    const rightWallX = width / 2 + 2.8;

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x111827, // Heavy industrial bunker steel
      roughness: 0.75,
      metalness: 0.35,
    });
    const panelBorderMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.6,
      metalness: 0.4,
    });
    const hazardYellowMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.4,
      emissive: 0x854d0e,
      emissiveIntensity: 0.25,
    });
    const hazardDarkMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.8,
    });

    // 1. Massive Back Wall (Continuous solid industrial containment wall)
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth + 6, roomHeight + 4, 1.2),
      wallMat
    );
    backWall.position.set(0, roomHeight / 2 - 1, backWallZ - 0.6);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Hazard Stripes & Industrial Ribs on Back Wall (Flat against wall, purely visual)
    for (let f = 1; f <= numFloors + 1; f++) {
      const stripeY = (f - 0.5) * fh;
      const yellowBar = new THREE.Mesh(
        new THREE.BoxGeometry(roomWidth + 2, 0.45, 0.08),
        hazardYellowMat
      );
      yellowBar.position.set(0, stripeY, backWallZ + 0.02);
      this.scene.add(yellowBar);

      for (let s = -roomWidth / 2; s < roomWidth / 2; s += 2.6) {
        const blk = new THREE.Mesh(
          new THREE.BoxGeometry(1.0, 0.47, 0.1),
          hazardDarkMat
        );
        blk.position.set(s, stripeY, backWallZ + 0.04);
        this.scene.add(blk);
      }
    }

    // Heavy vertical wall pilasters (flat against back wall - completely behind platforms!)
    for (let px = -width / 2; px <= width / 2; px += 6.5) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, roomHeight + 2, 0.2),
        panelBorderMat
      );
      rib.position.set(px, roomHeight / 2 - 1, backWallZ + 0.08);
      this.scene.add(rib);
    }

    // Industrial Conduits / Ventilation Pipes along back wall
    const pipeMatOrange = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.4, metalness: 0.6 });
    const pipeMatCyan = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.6 });
    
    const pipe1 = new THREE.Mesh(new THREE.BoxGeometry(roomWidth + 2, 0.22, 0.22), pipeMatOrange);
    pipe1.position.set(0, roomHeight * 0.38, backWallZ + 0.12);
    this.scene.add(pipe1);

    const pipe2 = new THREE.Mesh(new THREE.BoxGeometry(roomWidth + 2, 0.18, 0.18), pipeMatCyan);
    pipe2.position.set(0, roomHeight * 0.72, backWallZ + 0.12);
    this.scene.add(pipe2);

    // Wall warning emergency lights
    for (let f = 1; f <= numFloors; f += 2) {
      const sirenL = createVoxelBox(0.35, 0.45, 0.35, 0xef4444, 0.2, 0.1, 0xef4444);
      sirenL.position.set(-width / 2 + 1, f * fh + 1.2, backWallZ + 0.15);
      this.scene.add(sirenL);

      const sirenR = createVoxelBox(0.35, 0.45, 0.35, 0xf59e0b, 0.2, 0.1, 0xf59e0b);
      sirenR.position.set(width / 2 - 1, f * fh + 1.2, backWallZ + 0.15);
      this.scene.add(sirenR);
    }

    // High Wall Stenciled Signage: "SECTOR CERRADO - SIN ESCAPE"
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(15, 1.5, 0.2),
      hazardDarkMat
    );
    signBoard.position.set(0, roomHeight - 2.0, backWallZ + 0.12);
    this.scene.add(signBoard);

    const signTextPlaque = new THREE.Mesh(
      new THREE.BoxGeometry(14.2, 0.95, 0.08),
      hazardYellowMat
    );
    signTextPlaque.position.set(0, roomHeight - 2.0, backWallZ + 0.22);
    this.scene.add(signTextPlaque);

    // 2. Left Blast Wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, roomHeight + 4, roomDepth + 4),
      wallMat
    );
    leftWall.position.set(leftWallX - 0.6, roomHeight / 2 - 1, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Ape Containment Gate on Left Wall
    const topFloorY = numFloors * fh;
    const gateFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 5.5, depth + 1.6),
      panelBorderMat
    );
    gateFrame.position.set(leftWallX + 0.1, topFloorY + 2.5, -0.4);
    this.scene.add(gateFrame);

    const gateArchLight = new THREE.PointLight(0xef4444, 2.2, 14);
    gateArchLight.position.set(leftWallX + 1.6, topFloorY + 4.2, -0.4);
    this.scene.add(gateArchLight);

    // 3. Right Blast Wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, roomHeight + 4, roomDepth + 4),
      wallMat
    );
    rightWall.position.set(rightWallX + 0.6, roomHeight / 2 - 1, 0);
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    // Right Wall Emergency Beacon over Goal
    const goalBeacon = new THREE.PointLight(0x10b981, 2.2, 14);
    goalBeacon.position.set(rightWallX - 1.6, topFloorY + 4.2, 0);
    this.scene.add(goalBeacon);

    // 4. Heavy Overhead Vault Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth + 6, 1.2, roomDepth + 6),
      wallMat
    );
    ceiling.position.set(0, roomHeight, 0);
    this.scene.add(ceiling);

    // Overhead Industrial Cross-Girder Truss
    for (let zTruss = -depth; zTruss <= depth + 2; zTruss += 3.5) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(roomWidth + 2, 0.7, 0.35),
        panelBorderMat
      );
      beam.position.set(0, roomHeight - 0.7, zTruss);
      this.scene.add(beam);
    }

    // Overhead warehouse industrial high-bay lamps
    for (let lx = -width / 3; lx <= width / 3; lx += width / 3) {
      const lampHousing = createVoxelBox(1.1, 0.45, 1.1, 0x334155, 0.5, 0.8);
      lampHousing.position.set(lx, roomHeight - 1.1, 0);
      this.scene.add(lampHousing);

      const lampCone = new THREE.SpotLight(0xffedd5, 1.8, 38, Math.PI / 4, 0.5);
      lampCone.position.set(lx, roomHeight - 1.3, 0);
      lampCone.target.position.set(lx, 0, 0);
      this.scene.add(lampCone);
      this.scene.add(lampCone.target);
    }

    // 5. Front Enclosure Boundary (Bottom curb & outer corner structural columns)
    const frontCurb = new THREE.Mesh(
      new THREE.BoxGeometry(roomWidth + 4, 1.4, 0.6),
      wallMat
    );
    frontCurb.position.set(0, -0.1, frontWallZ + 0.3);
    this.scene.add(frontCurb);

    const cornerPillarL = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, roomHeight + 2, 1.2),
      panelBorderMat
    );
    cornerPillarL.position.set(leftWallX, roomHeight / 2 - 1, frontWallZ);
    this.scene.add(cornerPillarL);

    const cornerPillarR = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, roomHeight + 2, 1.2),
      panelBorderMat
    );
    cornerPillarR.position.set(rightWallX, roomHeight / 2 - 1, frontWallZ);
    this.scene.add(cornerPillarR);
  }

  private buildLevelArchitecture() {
    this.floorsData = [];
    this.laddersData = [];
    const cfg = this.currentLevelConfig;
    const numFloors = cfg.towerFloors;
    const fh = cfg.floorHeight;
    const width = cfg.width;
    const depth = cfg.depth;

    // 1. Build the Fully Enclosed Industrial Sector ("Sin Escape")
    this.buildEnclosedSector(width, depth, numFloors, fh);

    // Ground Floor 0 (Base of the enclosed sector)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
    });
    const ground = new THREE.Mesh(new THREE.BoxGeometry(width + 12, 1.8, depth + 10), groundMat);
    ground.position.set(0, -0.9, 0);
    ground.receiveShadow = true;
    this.scene.add(ground);

    this.floorsData.push({
      index: 0,
      baseY: 0,
      slope: 0,
      xMin: -(width / 2) - 4,
      xMax: width / 2 + 4,
      zMin: -(depth / 2) - 2.5,
      zMax: depth / 2 + 2.5,
    });

    // Elevated Girders with alternating slopes (Classic DK Girder Ramps - ZERO COLUMNS TO PREVENT STICKING!)
    const girderMat = new THREE.MeshStandardMaterial({
      color: cfg.themeColors.girder,
      roughness: 0.5,
      metalness: 0.2,
    });
    const girderTopMat = new THREE.MeshStandardMaterial({
      color: cfg.themeColors.girderTop,
      roughness: 0.4,
    });

    for (let f = 1; f <= numFloors; f++) {
      const isTop = f === numFloors;
      const baseY = f * fh;
      // Slanted slope: floor 1 tilts right (slope < 0), floor 2 tilts left (slope > 0), etc.
      const slope = isTop ? 0 : (f % 2 === 1 ? -0.045 : 0.045);
      const floorWidth = isTop ? width * 0.85 : width;

      const girderGroup = new THREE.Group();
      girderGroup.position.set(0, baseY, 0);

      // Clean girder deck (unobstructed walking surface)
      const deckGeom = new THREE.BoxGeometry(floorWidth, 0.45, depth);
      const deck = new THREE.Mesh(deckGeom, girderMat);
      deck.castShadow = true;
      deck.receiveShadow = true;
      girderGroup.add(deck);

      // Top walking plate with voxel texture
      const topPlate = new THREE.Mesh(new THREE.BoxGeometry(floorWidth, 0.08, depth * 0.95), girderTopMat);
      topPlate.position.y = 0.24;
      topPlate.receiveShadow = true;
      girderGroup.add(topPlate);

      // Front hazard stripe painted on the floor edge (zero collision, clear visual border)
      const hazardEdgeMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        roughness: 0.4,
      });
      const hazardEdge = new THREE.Mesh(
        new THREE.BoxGeometry(floorWidth, 0.04, 0.16),
        hazardEdgeMat
      );
      hazardEdge.position.set(0, 0.28, depth / 2 - 0.1);
      girderGroup.add(hazardEdge);

      // Apply slope rotation
      girderGroup.rotation.z = Math.atan(slope);
      this.scene.add(girderGroup);

      this.floorsData.push({
        index: f,
        baseY,
        slope,
        xMin: -floorWidth / 2,
        xMax: floorWidth / 2,
        zMin: -depth / 2,
        zMax: depth / 2,
      });

      // Ladders connecting floor (f - 1) to floor f (Placed directly in walking lane z=0)
      if (f <= numFloors) {
        const ladderX1 = f % 2 === 1 ? floorWidth * 0.36 : -floorWidth * 0.36;
        this.buildLadder(ladderX1, 0, (f - 1) * fh, baseY, cfg.themeColors.ladder);

        // Second ladder on middle section
        if (f < numFloors) {
          const ladderX2 = f % 2 === 1 ? -floorWidth * 0.15 : floorWidth * 0.15;
          this.buildLadder(ladderX2, 0, (f - 1) * fh, baseY, cfg.themeColors.ladder);
        }
      }

      // Collectible Bananas along girders
      if (!isTop) {
        for (let b = 0; b < 3; b++) {
          const bx = (Math.random() - 0.5) * (floorWidth * 0.7);
          const by = baseY + 0.9 + slope * bx;
          this.addCollectible('banana', new THREE.Vector3(bx, by, 0));
        }
      }

      // Power Hammer on Floors 2 and 4
      if (f === 2 || f === 4) {
        const hx = f === 2 ? -floorWidth * 0.3 : floorWidth * 0.3;
        const hy = baseY + 0.3 + slope * hx;
        this.addCollectible('hammer', new THREE.Vector3(hx, hy, 0));
      }
    }

    // Top Platform Ape & Goal
    const topFloorData = this.floorsData[numFloors];
    const topY = topFloorData.baseY;

    // Giant Voxel Ape ("Simio Salvaje")
    this.apeGroup = createVoxelApe();
    this.apeGroup.position.set(-6, topY + 0.25, -0.4);
    this.apeGroup.scale.set(1.4, 1.4, 1.4);
    this.scene.add(this.apeGroup);

    // Barrel Stockpile next to Ape
    for (let i = 0; i < 4; i++) {
      const stockBarrel = createVoxelBarrelMesh('wood');
      stockBarrel.position.set(-9 - (i % 2) * 1.2, topY + 0.5 + Math.floor(i / 2) * 0.9, -0.4);
      this.scene.add(stockBarrel);
    }

    // Goal Platform (Golden Banana Trophy rescue stand)
    this.goalPos.set(7, topY + 0.25, 0);
    const goalStand = createVoxelBox(2.8, 0.6, 2.8, 0xf59e0b);
    goalStand.position.copy(this.goalPos);
    this.scene.add(goalStand);

    const goalTrophy = createVoxelBananaCollectible();
    goalTrophy.position.set(this.goalPos.x, topY + 1.6, this.goalPos.z);
    goalTrophy.scale.set(2.0, 2.0, 2.0);
    this.scene.add(goalTrophy);

    const goalLight = new THREE.PointLight(0xfef08a, 2.2, 10);
    goalLight.position.set(this.goalPos.x, topY + 2.5, this.goalPos.z);
    this.scene.add(goalLight);
  }

  private buildLadder(x: number, z: number, yBottom: number, yTop: number, color: number) {
    const ladderHeight = yTop - yBottom;
    const ladderGroup = new THREE.Group();
    // Centered directly on (x, y, z) without arbitrary Z offsets
    ladderGroup.position.set(x, (yBottom + yTop) / 2, z);

    const railMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });

    // Left and Right Rails
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.1, ladderHeight + 0.3, 0.1), railMat);
    railL.position.x = -0.45;
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.1, ladderHeight + 0.3, 0.1), railMat);
    railR.position.x = 0.45;
    ladderGroup.add(railL, railR);

    // Rungs spaced every 0.45 units
    const numRungs = Math.floor(ladderHeight / 0.45);
    for (let r = 0; r <= numRungs; r++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), railMat);
      rung.position.y = -ladderHeight / 2 + r * 0.45;
      ladderGroup.add(rung);
    }

    this.scene.add(ladderGroup);

    this.laddersData.push({
      x,
      z,
      yBottom,
      yTop,
    });
  }

  private addCollectible(type: 'banana' | 'hammer', pos: THREE.Vector3) {
    let mesh: THREE.Group;
    if (type === 'banana') {
      mesh = createVoxelBananaCollectible();
    } else {
      mesh = createVoxelHammerPedestal();
    }
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.collectibles.push({
      id: this.collectibles.length + 1,
      mesh,
      pos,
      type,
      active: true,
    });
  }

  private createPlayer(
    id: 'p1' | 'p2',
    customization: PlayerCustomization,
    lives: number,
    startPos: THREE.Vector3
  ): PlayerRuntime {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);

    const armViewModel = createFirstPersonArmViewModel(customization);
    camera.add(armViewModel);
    this.scene.add(camera);

    const avatarMesh = createThirdPersonAvatar(customization);

    return {
      id,
      position: startPos.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      rotation: { yaw: 0, pitch: 0 },
      isGrounded: true,
      isClimbing: false,
      lives,
      score: 0,
      coinsEarned: 0,
      hammerTimeLeft: 0,
      camera,
      armViewModel,
      avatarMesh,
      lastJumpTime: 0,
      cleanJumps: 0,
    };
  }

  // --- Main Update Loop ---
  public update(dt: number, p1Input: PlayerInput, p2Input?: PlayerInput) {
    if (this.isPaused || this.isGameOver || this.isVictory) return;
    const delta = Math.min(dt, 0.1); // clamp delta to avoid tunneling

    // 1. Update Players
    this.updatePlayer(this.p1, p1Input, delta);
    if (this.isCoop && this.p2 && p2Input) {
      this.updatePlayer(this.p2, p2Input, delta);
    }

    // 2. Update Ape AI & Throwing Barrels
    this.updateApe(delta);

    // 3. Update Voxel Barrels (Realistic Physics)
    this.updateBarrels(delta);

    // 4. Update Collectibles & Animations
    this.updateCollectibles(delta);

    // 5. Update Debris & Foliage Particles
    this.updateParticles(delta);

    // 6. Dynamic Music Intensity based on height
    const highestPlayerY = Math.max(this.p1.position.y, this.p2 ? this.p2.position.y : 0);
    const topY = this.floorsData[this.floorsData.length - 1].baseY;
    const heightRatio = Math.max(0, Math.min(1, highestPlayerY / topY));
    const hammerBonus = (this.p1.hammerTimeLeft > 0 || (this.p2 && this.p2.hammerTimeLeft > 0)) ? 0.8 : 0;
    soundEngine.setIntensity(1.0 + heightRatio * 0.9 + hammerBonus);

    // Notify UI
    if (this.onStateUpdate) {
      this.onStateUpdate(this.p1, this.p2);
    }
  }

  private updatePlayer(player: PlayerRuntime, input: PlayerInput, dt: number) {
    // Keyboard Turn (Classic Doom 1 style turning with arrow keys)
    if (input.turnLeft) {
      player.rotation.yaw += 2.8 * dt;
    }
    if (input.turnRight) {
      player.rotation.yaw -= 2.8 * dt;
    }

    // Look Rotation from Mouse or Touch swipe (Pitch & Yaw)
    player.rotation.yaw -= input.lookDeltaX * 0.0035;
    player.rotation.pitch -= input.lookDeltaY * 0.0035;
    // Clamp pitch (-80 deg to +80 deg)
    player.rotation.pitch = Math.max(-1.4, Math.min(1.4, player.rotation.pitch));

    // Update Camera Orientation
    player.camera.rotation.order = 'YXZ';
    player.camera.rotation.y = player.rotation.yaw;
    player.camera.rotation.x = player.rotation.pitch;

    // Check if player is near any ladder
    let nearLadder: { x: number; z: number; yBottom: number; yTop: number } | null = null;
    for (const lad of this.laddersData) {
      const distHoriz = Math.hypot(player.position.x - lad.x, player.position.z - lad.z);
      if (distHoriz < 1.35 && player.position.y >= lad.yBottom - 0.2 && player.position.y <= lad.yTop + 1.3) {
        nearLadder = lad;
        break;
      }
    }

    // Ladder climbing mode
    if (nearLadder && Math.abs(input.moveForward) > 0.15) {
      const isAtTop = player.position.y >= nearLadder.yTop + 1.0;
      // If at top and moving forward (trying to walk onto the platform), don't trap on ladder
      if (isAtTop && input.moveForward > 0) {
        player.isClimbing = false;
      } else {
        player.isClimbing = true;
        player.velocity.y = input.moveForward * 4.6;
        player.velocity.x = (nearLadder.x - player.position.x) * 6.0;
        player.velocity.z = (nearLadder.z - player.position.z) * 6.0;
        soundEngine.playLadderClimb();

        // Check if climbed off the top of ladder
        if (player.position.y >= nearLadder.yTop + 1.15) {
          player.isClimbing = false;
          player.position.y = nearLadder.yTop + 1.25;
          player.velocity.y = 0;
          player.isGrounded = true;
        } else if (player.position.y <= nearLadder.yBottom + 1.1 && input.moveForward < 0) {
          player.isClimbing = false;
          player.position.y = nearLadder.yBottom + 1.2;
          player.velocity.y = 0;
          player.isGrounded = true;
        }
      }
    } else {
      player.isClimbing = false;
    }

    if (!player.isClimbing) {
      // Horizontal Movement aligned with camera yaw
      const moveSpeed = player.hammerTimeLeft > 0 ? 8.5 : 7.2;
      const forwardX = -Math.sin(player.rotation.yaw);
      const forwardZ = -Math.cos(player.rotation.yaw);
      const rightX = Math.cos(player.rotation.yaw);
      const rightZ = -Math.sin(player.rotation.yaw);

      const targetVx = (forwardX * input.moveForward + rightX * input.moveRight) * moveSpeed;
      const targetVz = (forwardZ * input.moveForward + rightZ * input.moveRight) * moveSpeed;

      // Air control vs grounded acceleration
      const accel = player.isGrounded ? 18.0 : 6.0;
      player.velocity.x += (targetVx - player.velocity.x) * accel * dt;
      player.velocity.z += (targetVz - player.velocity.z) * accel * dt;

      // Jump Physics
      if (input.jump && player.isGrounded) {
        player.velocity.y = 8.6;
        player.isGrounded = false;
        player.lastJumpTime = performance.now();
        soundEngine.playJump();
      }

      // Gravity
      player.velocity.y -= 22.0 * dt;
    }

    // Apply Velocity
    player.position.x += player.velocity.x * dt;
    player.position.y += player.velocity.y * dt;
    player.position.z += player.velocity.z * dt;

    // Floor Collisions and Realistic Slope Height
    if (!player.isClimbing) {
      const currentFloorHeight = this.getFloorHeightAt(player.position.x, player.position.z, player.position.y);
      if (player.position.y <= currentFloorHeight + 1.2) {
        player.position.y = currentFloorHeight + 1.2;
        player.velocity.y = 0;
        player.isGrounded = true;
      } else {
        player.isGrounded = false;
      }
    }

    // Keep within world horizontal bounds for narrow platforms inside the enclosed room
    const maxBound = this.currentLevelConfig.width / 2 + 1.8;
    player.position.x = Math.max(-maxBound, Math.min(maxBound, player.position.x));
    const maxZ = Math.max(1.3, this.currentLevelConfig.depth / 2 + 0.2);
    player.position.z = Math.max(-maxZ, Math.min(maxZ, player.position.z));

    // Update Camera position (head height)
    player.camera.position.set(player.position.x, player.position.y + 0.4, player.position.z);

    // Update 3D avatar position (for co-op visibility)
    player.avatarMesh.position.copy(player.position);
    player.avatarMesh.rotation.y = player.rotation.yaw;

    // View Model Arm Bobbing & Hammer Swing
    const moveMagnitude = Math.hypot(player.velocity.x, player.velocity.z);
    const bob = Math.sin(performance.now() * 0.01) * (player.isGrounded ? Math.min(moveMagnitude * 0.02, 0.05) : 0);
    player.armViewModel.position.y = bob;

    // Hammer Countdown & Action Swing
    if (player.hammerTimeLeft > 0) {
      player.hammerTimeLeft -= dt;
      if (player.hammerTimeLeft <= 0) {
        player.hammerTimeLeft = 0;
        if (this.onFloatingText) this.onFloatingText('¡Martillo Agotado!', '#ef4444');
      }
    }

    // Hammer swing animation
    const hammerPivot = player.armViewModel.getObjectByName('hammerPivot');
    if (hammerPivot) {
      if (player.hammerTimeLeft > 0) {
        hammerPivot.visible = true;
        // Continuous rapid pounding when holding hammer or pressing action
        const swingSpeed = input.action ? 22 : 12;
        const swing = Math.sin(performance.now() * 0.001 * swingSpeed) * 0.8 - 0.3;
        hammerPivot.rotation.x = swing;
      } else {
        hammerPivot.visible = false;
      }
    }

    // Check Victory (Reached Goal Area on top floor!)
    const distToGoal = player.position.distanceTo(this.goalPos);
    if (distToGoal < 2.5 && player.position.y >= this.floorsData[this.floorsData.length - 1].baseY) {
      this.triggerVictory();
    }
  }

  private getFloorHeightAt(x: number, z: number, playerY: number): number {
    // Find the highest floor that is below or at the player position
    let bestY = 0;
    for (const f of this.floorsData) {
      // Allow slight edge tolerance so player doesn't fall through near ramp limits
      if (x >= f.xMin - 0.6 && x <= f.xMax + 0.6 && z >= f.zMin - 0.8 && z <= f.zMax + 0.8) {
        const floorY = f.baseY + f.slope * Math.max(f.xMin, Math.min(f.xMax, x));
        if (floorY <= playerY + 0.8) {
          if (floorY > bestY) {
            bestY = floorY;
          }
        }
      }
    }
    return bestY;
  }

  private updateApe(dt: number) {
    // Ape Throw Interval based on difficulty (Noticeably faster for higher tension!)
    let throwInterval = 1.8;
    if (this.difficulty === 'facil') throwInterval = 2.7;
    if (this.difficulty === 'dificil') throwInterval = 1.1;
    if (this.difficulty === 'caos') throwInterval = 0.75;

    this.apeThrowTimer += dt;
    this.apeArmSwing += dt * 5;

    // Ape Idle animation: chest beating / arm flexing
    const armL = this.apeGroup.getObjectByName('armL');
    const armR = this.apeGroup.getObjectByName('armR');
    if (armL && armR) {
      armL.rotation.x = Math.sin(this.apeArmSwing) * 0.5;
      armR.rotation.x = -Math.sin(this.apeArmSwing) * 0.5;
    }

    if (this.apeThrowTimer >= throwInterval) {
      this.apeThrowTimer = 0;
      this.throwBarrel();
    }
  }

  private throwBarrel() {
    const topFloor = this.floorsData[this.floorsData.length - 1];
    const spawnX = -4.5;
    const spawnY = topFloor.baseY + 2.5;
    const spawnZ = 0;

    let type: 'wood' | 'fire' | 'gold' = 'wood';
    if (this.difficulty === 'dificil' || this.difficulty === 'caos') {
      if (Math.random() < 0.4) type = 'fire';
    }
    if (Math.random() < 0.15) type = 'gold';

    const mesh = createVoxelBarrelMesh(type);
    mesh.position.set(spawnX, spawnY, spawnZ);
    this.scene.add(mesh);

    let speedMul = 1.4;
    if (this.difficulty === 'facil') speedMul = 1.0;
    if (this.difficulty === 'dificil') speedMul = 2.0;
    if (this.difficulty === 'caos') speedMul = 2.6;

    // Fast initial rolling velocity rightward onto top ramp
    this.barrels.push({
      id: ++this.barrelIdCounter,
      mesh,
      pos: new THREE.Vector3(spawnX, spawnY, spawnZ),
      vel: new THREE.Vector3(6.5 * speedMul, -2.5, 0),
      rotX: 0,
      rotZ: 0,
      radius: 0.55,
      type,
      isGrounded: true,
      floor: topFloor.index,
    });

    soundEngine.playBarrelRoll();
    if (Math.random() < 0.25) {
      soundEngine.playApeRoar();
    }
  }

  private updateBarrels(dt: number) {
    const topFloorIdx = this.floorsData.length - 1;

    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const b = this.barrels[i];

      // Gravity: High gravity makes drums plummet down rapidly like heavy metal projectiles!
      b.vel.y -= 45.0 * dt;

      // Realistic ramp rolling physics:
      // Floor index determines direction (alternates floor by floor)
      const currentFloor = this.floorsData[b.floor] || this.floorsData[0];
      const floorY = currentFloor.baseY + currentFloor.slope * b.pos.x;

      if (b.pos.y <= floorY + b.radius) {
        b.pos.y = floorY + b.radius;
        b.vel.y = 0;
        b.isGrounded = true;

        // Fast horizontal acceleration along slope
        const rollDir = b.floor % 2 === 1 ? 1 : -1;
        let speedMultiplier = 1.4;
        if (this.difficulty === 'facil') speedMultiplier = 1.1;
        if (this.difficulty === 'dificil') speedMultiplier = 1.8;
        if (this.difficulty === 'caos') speedMultiplier = 2.4;

        const targetSpeed = rollDir * 7.5 * speedMultiplier;
        b.vel.x += (targetSpeed - b.vel.x) * 6.5 * dt;

        // Ladder drop chance: if barrel is near a ladder, rapid plunge down!
        if (b.floor > 0 && Math.random() < 0.05) {
          for (const lad of this.laddersData) {
            if (Math.abs(b.pos.x - lad.x) < 0.9 && b.pos.y >= lad.yTop - 0.4) {
              b.floor = Math.max(0, b.floor - 1);
              b.vel.y = -14.0; // Plunge down ladder instantly!
              b.vel.x *= 0.15;
              soundEngine.playBarrelRoll();
              break;
            }
          }
        }
      } else {
        b.isGrounded = false;
      }

      // Check if barrel rolled off edge of current floor
      if (b.pos.x < currentFloor.xMin - 0.3 || b.pos.x > currentFloor.xMax + 0.3) {
        // Drop down to next lower floor with swift vertical dive
        if (b.floor > 0) {
          b.floor--;
          b.vel.y = -10.0; // Rapid drop!
          const nextDir = b.floor % 2 === 1 ? 1 : -1;
          b.vel.x = nextDir * 3.5;
          soundEngine.playBarrelRoll();
        }
      }

      // Apply positions & realistic rotational inertia
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.pos.z += b.vel.z * dt;

      // Barrel rotation around Z-axis matching linear speed
      b.rotZ -= (b.vel.x / b.radius) * dt;
      b.mesh.rotation.z = b.rotZ;
      b.mesh.position.copy(b.pos);

      // Check collision with Player 1 and Player 2
      this.checkBarrelPlayerCollision(b, this.p1);
      if (this.isCoop && this.p2) {
        this.checkBarrelPlayerCollision(b, this.p2);
      }

      // Despawn if fallen below ground or out of bounds
      if (b.pos.y < -3 || (b.floor === 0 && (b.pos.x < currentFloor.xMin - 6 || b.pos.x > currentFloor.xMax + 6))) {
        this.createVoxelSmashParticles(b.pos, b.type === 'fire' ? 0xef4444 : 0x78350f, 15);
        this.scene.remove(b.mesh);
        this.barrels.splice(i, 1);
      }
    }
  }

  private checkBarrelPlayerCollision(b: BarrelRuntime, player: PlayerRuntime) {
    const distHoriz = Math.hypot(b.pos.x - player.position.x, b.pos.z - player.position.z);
    const distVert = Math.abs(b.pos.y - player.position.y);

    // 1. Hammer Smash: If player is wielding hammer and close to barrel
    if (player.hammerTimeLeft > 0 && distHoriz < 2.2 && distVert < 1.8) {
      // Pulverize barrel!
      this.createVoxelSmashParticles(b.pos, b.type === 'fire' ? 0xef4444 : 0xf59e0b, 25);
      soundEngine.playHammerSmash();
      player.score += 300;
      player.coinsEarned += 5;

      if (this.onFloatingText) this.onFloatingText('¡DEMOLIDO! +300', '#f59e0b');
      if (this.onAchievementTrigger) this.onAchievementTrigger('ach_barrel_smasher');

      // Remove barrel
      this.scene.remove(b.mesh);
      const idx = this.barrels.indexOf(b);
      if (idx !== -1) this.barrels.splice(idx, 1);
      return;
    }

    // 2. Clean Jump Check: Player jumped over barrel!
    // Player is airborne above the barrel
    const isPassingP = player.id === 'p1' ? b.passedP1 : b.passedP2;
    if (!isPassingP && distHoriz < 1.4 && player.position.y > b.pos.y + 0.6 && !player.isGrounded) {
      if (player.id === 'p1') b.passedP1 = true;
      else b.passedP2 = true;

      player.score += 100;
      player.cleanJumps++;
      soundEngine.playCoin();
      if (this.onFloatingText) this.onFloatingText('¡SALTO LIMPIO! +100', '#10b981');
      if (this.onAchievementTrigger) this.onAchievementTrigger('ach_first_jump');
      return;
    }

    // 3. Collision Hit: Barrel hits player!
    if (distHoriz < 1.1 && distVert < 1.2) {
      this.playerTakeHit(player);
      // knock barrel away
      b.vel.x = -b.vel.x;
    }
  }

  private playerTakeHit(player: PlayerRuntime) {
    soundEngine.playHit();
    player.lives--;
    this.createVoxelSmashParticles(player.position, 0xef4444, 20);

    if (this.onFloatingText) this.onFloatingText('¡GOLPEADO! -1 VIDA', '#ef4444');

    if (player.lives <= 0) {
      player.lives = 0;
      this.checkGameOver();
    } else {
      // Respawn player at safe start of current floor
      player.position.x = -10;
      player.velocity.set(0, 0, 0);
    }
  }

  private checkGameOver() {
    const p1Dead = this.p1.lives <= 0;
    const p2Dead = this.isCoop ? (this.p2?.lives ?? 0) <= 0 : true;

    if (p1Dead && p2Dead) {
      this.isGameOver = true;
      soundEngine.stopMusic();
      const finalScore = this.p1.score + (this.p2 ? this.p2.score : 0);
      if (this.onGameOver) {
        this.onGameOver(finalScore, this.currentLevelConfig.id);
      }
    }
  }

  private triggerVictory() {
    if (this.isVictory) return;
    this.isVictory = true;
    soundEngine.stopMusic();
    soundEngine.playVictory();

    const finalScore = this.p1.score + (this.p2 ? this.p2.score : 0) + 1000;
    const finalCoins = this.p1.coinsEarned + (this.p2 ? this.p2.coinsEarned : 0) + 25;

    if (this.onAchievementTrigger) {
      this.onAchievementTrigger('ach_level1_clear');
      if (this.difficulty === 'dificil' || this.difficulty === 'caos') {
        this.onAchievementTrigger('ach_hardcore');
      }
      if (this.isCoop) {
        this.onAchievementTrigger('ach_coop_play');
      }
    }

    if (this.onVictory) {
      this.onVictory(finalScore, this.currentLevelConfig.id, finalCoins);
    }
  }

  private updateCollectibles(dt: number) {
    for (const item of this.collectibles) {
      if (!item.active) continue;

      // Rotate and float
      item.mesh.rotation.y += dt * 2.5;
      item.mesh.position.y = item.pos.y + Math.sin(performance.now() * 0.003 + item.id) * 0.15;

      // Check pickup with P1 and P2
      const checkPickup = (player: PlayerRuntime) => {
        const dist = player.position.distanceTo(item.mesh.position);
        if (dist < 1.4) {
          item.active = false;
          this.scene.remove(item.mesh);

          if (item.type === 'banana') {
            soundEngine.playCoin();
            player.score += 150;
            player.coinsEarned += 3;
            if (this.onFloatingText) this.onFloatingText('+150 BANANA', '#facc15');
            if (this.onAchievementTrigger) this.onAchievementTrigger('ach_banana_hoarder');
          } else if (item.type === 'hammer') {
            soundEngine.playHammerSmash();
            player.hammerTimeLeft = 12.0; // 12 seconds of power hammer!
            player.score += 200;
            if (this.onFloatingText) this.onFloatingText('¡MARTILLO DESTRUCTOR ACTIVADO!', '#38bdf8');
          }
        }
      };

      checkPickup(this.p1);
      if (this.isCoop && this.p2) {
        checkPickup(this.p2);
      }
    }
  }

  private createVoxelSmashParticles(pos: THREE.Vector3, color: number, count = 10) {
    // Limit active particles to prevent memory buildup and stutter
    if (this.debrisParticles.length > 25) {
      const excess = this.debrisParticles.splice(0, 10);
      for (const p of excess) {
        this.scene.remove(p.mesh);
      }
    }

    const mat = getCachedVoxelMaterial(color, 0.6, 0.1);

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(SHARED_DEBRIS_GEOMETRY, mat);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 7,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * 7
      );

      this.debrisParticles.push({
        pos: pos.clone(),
        vel,
        mesh,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 1.0,
      });
    }
  }

  private updateParticles(dt: number) {
    // Update Foliage
    if (this.foliageSystem) {
      this.foliageSystem.update(dt);
    }

    // Update Debris Particles
    for (let i = this.debrisParticles.length - 1; i >= 0; i--) {
      const p = this.debrisParticles[i];
      p.life -= dt;
      p.vel.y -= 18.0 * dt;
      p.pos.addScaledVector(p.vel, dt);
      p.mesh.position.copy(p.pos);
      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.y += dt * 6;

      const scale = Math.max(0.01, p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.debrisParticles.splice(i, 1);
      }
    }
  }

  // --- Render Loop (Supports Single & Split-Screen Local Co-Op!) ---
  public render() {
    const screenWidth = this.container.clientWidth || window.innerWidth;
    const screenHeight = this.container.clientHeight || window.innerHeight;
    const bufW = this.bufferWidth;
    const bufH = this.bufferHeight;

    if (!this.isCoop || !this.p2) {
      // Single Player: Full Screen Viewport using scaled retro/smooth buffer
      this.renderer.setScissorTest(false);
      this.renderer.setViewport(0, 0, bufW, bufH);
      this.p1.camera.aspect = screenWidth / screenHeight;
      this.p1.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.p1.camera);
    } else {
      // Split Screen Co-Op Mode (Horizontal or Vertical split depending on aspect ratio)
      this.renderer.setScissorTest(true);

      const isLandscape = screenWidth >= screenHeight;
      if (isLandscape) {
        // Side-by-side split (Player 1 Left, Player 2 Right)
        const halfBufWidth = Math.floor(bufW / 2);
        const halfAspect = (screenWidth / 2) / screenHeight;

        // Player 1 Left Viewport
        this.renderer.setViewport(0, 0, halfBufWidth, bufH);
        this.renderer.setScissor(0, 0, halfBufWidth, bufH);
        this.p1.camera.aspect = halfAspect;
        this.p1.camera.updateProjectionMatrix();
        this.p1.avatarMesh.visible = false; // Hide own avatar from first person view
        this.p2.avatarMesh.visible = true;
        this.renderer.render(this.scene, this.p1.camera);

        // Player 2 Right Viewport
        this.renderer.setViewport(halfBufWidth, 0, halfBufWidth, bufH);
        this.renderer.setScissor(halfBufWidth, 0, halfBufWidth, bufH);
        this.p2.camera.aspect = halfAspect;
        this.p2.camera.updateProjectionMatrix();
        this.p1.avatarMesh.visible = true;
        this.p2.avatarMesh.visible = false;
        this.renderer.render(this.scene, this.p2.camera);
      } else {
        // Top-and-Bottom split (Player 1 Top, Player 2 Bottom for portrait mobile/tablets)
        const halfBufHeight = Math.floor(bufH / 2);
        const halfAspect = screenWidth / (screenHeight / 2);

        // Player 1 Top Viewport
        this.renderer.setViewport(0, halfBufHeight, bufW, halfBufHeight);
        this.renderer.setScissor(0, halfBufHeight, bufW, halfBufHeight);
        this.p1.camera.aspect = halfAspect;
        this.p1.camera.updateProjectionMatrix();
        this.p1.avatarMesh.visible = false;
        this.p2.avatarMesh.visible = true;
        this.renderer.render(this.scene, this.p1.camera);

        // Player 2 Bottom Viewport
        this.renderer.setViewport(0, 0, bufW, halfBufHeight);
        this.renderer.setScissor(0, 0, bufW, halfBufHeight);
        this.p2.camera.aspect = halfAspect;
        this.p2.camera.updateProjectionMatrix();
        this.p1.avatarMesh.visible = true;
        this.p2.avatarMesh.visible = false;
        this.renderer.render(this.scene, this.p2.camera);
      }
    }
  }

  private handleResize = () => {
    this.updateRendererSize();
  };

  public destroy() {
    window.removeEventListener('resize', this.handleResize);
    soundEngine.stopMusic();
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.renderer && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
