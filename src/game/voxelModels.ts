import * as THREE from 'three';
import { PlayerCustomization } from '../types';

/**
 * Procedural voxel asset builders for Three.js - High Performance Optimized
 */

// Shared Unit Geometries to avoid allocating hundreds of geometries in GPU memory
export const SHARED_BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
export const SHARED_DEBRIS_GEOMETRY = new THREE.BoxGeometry(0.18, 0.18, 0.18);

// Global Material Cache
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function getCachedVoxelMaterial(
  color: number | string,
  roughness = 0.6,
  metalness = 0.1,
  emissive?: number | string,
  emissiveIntensity = 0.4
): THREE.MeshStandardMaterial {
  const colHex = typeof color === 'string' ? color : color.toString(16);
  const emiHex = emissive !== undefined ? (typeof emissive === 'string' ? emissive : emissive.toString(16)) : 'none';
  const key = `${colHex}_${roughness}_${metalness}_${emiHex}_${emissiveIntensity}`;

  let mat = materialCache.get(key);
  if (!mat) {
    const matParams: THREE.MeshStandardMaterialParameters = {
      color: new THREE.Color(color),
      roughness,
      metalness,
    };
    if (emissive !== undefined) {
      matParams.emissive = new THREE.Color(emissive);
      matParams.emissiveIntensity = emissiveIntensity;
    }
    mat = new THREE.MeshStandardMaterial(matParams);
    materialCache.set(key, mat);
  }
  return mat;
}

export function createVoxelBox(
  w: number,
  h: number,
  d: number,
  color: number | string,
  roughness = 0.6,
  metalness = 0.1,
  emissive?: number | string
): THREE.Mesh {
  const mat = getCachedVoxelMaterial(color, roughness, metalness, emissive);
  const mesh = new THREE.Mesh(SHARED_BOX_GEOMETRY, mat);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function createVoxelApe(): THREE.Group {
  const apeGroup = new THREE.Group();

  // Torso / Chest (Dark Brown/Charcoal)
  const torso = createVoxelBox(2.2, 2.0, 1.4, 0x3d2314);
  torso.position.y = 1.6;
  apeGroup.add(torso);

  // Pectoral / Chest Plate (Tanned/Lighter)
  const chestPlate = createVoxelBox(1.6, 1.3, 0.2, 0x854d0e);
  chestPlate.position.set(0, 1.65, 0.72);
  apeGroup.add(chestPlate);

  // Head
  const head = createVoxelBox(1.5, 1.3, 1.3, 0x3d2314);
  head.position.set(0, 3.1, 0.1);
  apeGroup.add(head);

  // Muzzle / Jaw
  const muzzle = createVoxelBox(1.1, 0.6, 0.5, 0x854d0e);
  muzzle.position.set(0, 2.85, 0.78);
  apeGroup.add(muzzle);

  // Eyes (Fierce glowing voxel arcade eyes)
  const eyeL = createVoxelBox(0.25, 0.25, 0.1, 0xfacc15);
  eyeL.position.set(-0.35, 3.25, 0.72);
  const eyeR = createVoxelBox(0.25, 0.25, 0.1, 0xfacc15);
  eyeR.position.set(0.35, 3.25, 0.72);
  apeGroup.add(eyeL, eyeR);

  // Brow
  const brow = createVoxelBox(1.3, 0.25, 0.25, 0x22120b);
  brow.position.set(0, 3.45, 0.75);
  apeGroup.add(brow);

  // Arms (Articulated for throwing animation)
  const armL = new THREE.Group();
  armL.name = 'armL';
  armL.position.set(-1.4, 2.4, 0);
  const upperArmL = createVoxelBox(0.7, 1.5, 0.7, 0x3d2314);
  upperArmL.position.y = -0.6;
  armL.add(upperArmL);
  const fistL = createVoxelBox(0.85, 0.85, 0.85, 0x22120b);
  fistL.position.y = -1.5;
  armL.add(fistL);
  apeGroup.add(armL);

  const armR = new THREE.Group();
  armR.name = 'armR';
  armR.position.set(1.4, 2.4, 0);
  const upperArmR = createVoxelBox(0.7, 1.5, 0.7, 0x3d2314);
  upperArmR.position.y = -0.6;
  armR.add(upperArmR);
  const fistR = createVoxelBox(0.85, 0.85, 0.85, 0x22120b);
  fistR.position.y = -1.5;
  armR.add(fistR);
  apeGroup.add(armR);

  // Legs / Base
  const legL = createVoxelBox(0.8, 1.0, 0.9, 0x22120b);
  legL.position.set(-0.7, 0.5, 0);
  const legR = createVoxelBox(0.8, 1.0, 0.9, 0x22120b);
  legR.position.set(0.7, 0.5, 0);
  apeGroup.add(legL, legR);

  return apeGroup;
}

export function createVoxelBarrelMesh(type: 'wood' | 'fire' | 'gold' = 'wood'): THREE.Group {
  const barrel = new THREE.Group();
  const radius = 0.55;
  const height = 0.9;

  let baseColor = 0xa16207; // Rich wood brown
  let rimColor = 0x374151;  // Iron bands
  if (type === 'fire') {
    baseColor = 0x2563eb;   // Classic arcade blue fire barrel
    rimColor = 0x38bdf8;
  } else if (type === 'gold') {
    baseColor = 0xf59e0b;
    rimColor = 0xfef08a;
  }

  // Cylindrical voxel approximation using layered boxes for true voxel look
  const centerBody = createVoxelBox(radius * 2, height, radius * 1.8, baseColor);
  barrel.add(centerBody);

  const crossBody = createVoxelBox(radius * 1.8, height, radius * 2, baseColor);
  barrel.add(crossBody);

  // Iron / decorative rims top & bottom
  const rimTop = createVoxelBox(radius * 2.05, 0.14, radius * 2.05, rimColor);
  rimTop.position.y = height * 0.35;
  const rimBottom = createVoxelBox(radius * 2.05, 0.14, radius * 2.05, rimColor);
  rimBottom.position.y = -height * 0.35;
  barrel.add(rimTop, rimBottom);

  if (type === 'fire') {
    // Glowing inner core
    const glow = createVoxelBox(0.3, 0.3, 0.3, 0x60a5fa);
    barrel.add(glow);
  }

  return barrel;
}

export function createFirstPersonArmViewModel(customization: PlayerCustomization): THREE.Group {
  const armViewModel = new THREE.Group();

  const skinColor = customization.colorTheme || '#dc2626';
  const handColor = 0xfbcfe8; // Skin tone

  // Right Forearm
  const forearmR = createVoxelBox(0.24, 0.24, 0.7, skinColor);
  forearmR.position.set(0.42, -0.36, -0.65);
  forearmR.rotation.x = THREE.MathUtils.degToRad(-15);
  forearmR.rotation.y = THREE.MathUtils.degToRad(10);
  armViewModel.add(forearmR);

  // Right Hand
  const handR = createVoxelBox(0.22, 0.22, 0.26, handColor);
  handR.position.set(0.44, -0.32, -1.02);
  armViewModel.add(handR);

  // Hammer holder group (animated on swing)
  const hammerGroup = new THREE.Group();
  hammerGroup.name = 'hammerPivot';
  hammerGroup.position.set(0.44, -0.28, -1.05);

  let handleColor = 0x78350f;
  let headColor = 0x64748b;
  if (customization.hammerId === 'hammer_steel') {
    handleColor = 0x334155;
    headColor = 0x94a3b8;
  } else if (customization.hammerId === 'hammer_banana') {
    handleColor = 0x854d0e;
    headColor = 0xfacc15;
  } else if (customization.hammerId === 'hammer_laser') {
    handleColor = 0x0284c7;
    headColor = 0x38bdf8;
  }

  // Hammer Handle
  const handle = createVoxelBox(0.08, 0.8, 0.08, handleColor);
  handle.position.y = 0.35;
  hammerGroup.add(handle);

  // Hammer Head
  const head = createVoxelBox(0.4, 0.28, 0.32, headColor);
  head.position.y = 0.72;
  hammerGroup.add(head);

  armViewModel.add(hammerGroup);

  // Left Arm (holding flashlight/idle)
  const forearmL = createVoxelBox(0.22, 0.22, 0.6, skinColor);
  forearmL.position.set(-0.42, -0.4, -0.65);
  forearmL.rotation.x = THREE.MathUtils.degToRad(-12);
  forearmL.rotation.y = THREE.MathUtils.degToRad(-10);
  armViewModel.add(forearmL);

  const handL = createVoxelBox(0.2, 0.2, 0.22, handColor);
  handL.position.set(-0.43, -0.36, -0.96);
  armViewModel.add(handL);

  return armViewModel;
}

export function createThirdPersonAvatar(customization: PlayerCustomization): THREE.Group {
  const avatar = new THREE.Group();
  const themeColor = customization.colorTheme || '#dc2626';

  // Body / Overalls
  const body = createVoxelBox(0.8, 0.9, 0.5, themeColor);
  body.position.y = 1.0;
  avatar.add(body);

  // Head
  const head = createVoxelBox(0.6, 0.6, 0.6, 0xfbcfe8);
  head.position.y = 1.75;
  avatar.add(head);

  // Mustache & Eyes
  const mustache = createVoxelBox(0.4, 0.12, 0.1, 0x27272a);
  mustache.position.set(0, 1.62, 0.32);
  const eyeL = createVoxelBox(0.08, 0.12, 0.05, 0x18181b);
  eyeL.position.set(-0.14, 1.82, 0.32);
  const eyeR = createVoxelBox(0.08, 0.12, 0.05, 0x18181b);
  eyeR.position.set(0.14, 1.82, 0.32);
  avatar.add(mustache, eyeL, eyeR);

  // Hat
  let hatColor = 0xdc2626;
  if (customization.hatId === 'hat_miner') hatColor = 0xeab308;
  if (customization.hatId === 'hat_bandana') hatColor = 0xf43f5e;
  if (customization.hatId === 'hat_crown') hatColor = 0xfbbf24;

  const hat = createVoxelBox(0.7, 0.2, 0.7, hatColor);
  hat.position.y = 2.12;
  const brim = createVoxelBox(0.7, 0.08, 0.9, hatColor);
  brim.position.set(0, 2.06, 0.12);
  avatar.add(hat, brim);

  // Limbs
  const legL = createVoxelBox(0.3, 0.6, 0.35, 0x1e3a8a);
  legL.position.set(-0.24, 0.3, 0);
  const legR = createVoxelBox(0.3, 0.6, 0.35, 0x1e3a8a);
  legR.position.set(0.24, 0.3, 0);
  avatar.add(legL, legR);

  return avatar;
}

export function createVoxelBananaCollectible(): THREE.Group {
  const bananaGroup = new THREE.Group();

  // Banana bunch made of curved voxel segments with golden emissive glow
  const center = createVoxelBox(0.18, 0.5, 0.18, 0xfacc15, 0.4, 0.1, 0xeab308);
  center.rotation.z = THREE.MathUtils.degToRad(20);
  const stem = createVoxelBox(0.1, 0.15, 0.1, 0x713f12, 0.8, 0.0);
  stem.position.set(0.1, 0.3, 0);
  bananaGroup.add(center, stem);

  return bananaGroup;
}

export function createVoxelHammerPedestal(skin = 'hammer_classic'): THREE.Group {
  const group = new THREE.Group();

  // Stone/Metal Pedestal
  const base = createVoxelBox(0.8, 0.6, 0.8, 0x475569);
  base.position.y = 0.3;
  group.add(base);

  // Hovering glowing hammer
  const hammer = createVoxelBox(0.5, 0.35, 0.4, 0xfacc15, 0.3, 0.2, 0xf59e0b);
  hammer.position.set(0, 0.9, 0);
  const handle = createVoxelBox(0.1, 0.7, 0.1, 0x78350f);
  handle.position.set(0, 0.55, 0);
  group.add(hammer, handle);

  return group;
}

export function createVolumetricLightRays(count = 5): THREE.Group {
  const raysGroup = new THREE.Group();

  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  for (let i = 0; i < count; i++) {
    // Slanted cone / pyramid light beam
    const geom = new THREE.CylinderGeometry(0.3, 2.8, 18, 6, 1, true);
    const beam = new THREE.Mesh(geom, rayMat);
    beam.position.set(
      (Math.random() - 0.5) * 26,
      14,
      (Math.random() - 0.5) * 8
    );
    beam.rotation.z = (Math.random() - 0.5) * 0.4;
    beam.rotation.x = (Math.random() - 0.5) * 0.3;
    raysGroup.add(beam);
  }

  return raysGroup;
}

export function createFoliageParticleSystem(count = 140): {
  mesh: THREE.InstancedMesh;
  update: (delta: number) => void;
} {
  const geom = new THREE.BoxGeometry(0.15, 0.15, 0.05);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    roughness: 0.8,
  });

  const instanced = new THREE.InstancedMesh(geom, mat, count);
  const dummy = new THREE.Object3D();

  const particles: Array<{
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    rot: THREE.Euler;
    rotSpeed: THREE.Vector3;
  }> = [];

  for (let i = 0; i < count; i++) {
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 32,
      Math.random() * 26,
      (Math.random() - 0.5) * 14
    );
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      -0.5 - Math.random() * 0.8,
      (Math.random() - 0.5) * 0.5
    );
    const rot = new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    const rotSpeed = new THREE.Vector3(
      Math.random() * 2,
      Math.random() * 2,
      Math.random() * 2
    );
    particles.push({ pos, vel, rot, rotSpeed });

    dummy.position.copy(pos);
    dummy.rotation.copy(rot);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
  }
  instanced.instanceMatrix.needsUpdate = true;

  const update = (delta: number) => {
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.pos.addScaledVector(p.vel, delta);
      p.rot.x += p.rotSpeed.x * delta;
      p.rot.y += p.rotSpeed.y * delta;
      p.rot.z += p.rotSpeed.z * delta;

      // Wrap around bounds
      if (p.pos.y < -1) {
        p.pos.y = 25;
        p.pos.x = (Math.random() - 0.5) * 30;
      }

      dummy.position.copy(p.pos);
      dummy.rotation.copy(p.rot);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
  };

  return { mesh: instanced, update };
}
