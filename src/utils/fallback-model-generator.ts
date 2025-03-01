/**
 * Fallback Model Generator
 * 
 * This utility creates simple 3D models when actual GLB models are not available.
 * It ensures the game can run in 3D mode even without proper models.
 */

import * as THREE from 'three';
import { getPlayerColor } from './character-renderer';

export interface FallbackModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

/**
 * Creates a simple fallback character model
 */
export function createFallbackCharacter(country: string): FallbackModel {
  const group = new THREE.Group();
  const color = getPlayerColor(country);
  
  // Create body (sphere)
  const bodyGeometry = new THREE.SphereGeometry(0.5, 16, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0.5, 0);
  body.castShadow = true;
  body.name = 'body';
  group.add(body);
  
  // Create head (smaller sphere)
  const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xf8d8b9 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 1.1, 0);
  head.castShadow = true;
  head.name = 'head';
  group.add(head);
  
  // Create eyes
  const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.1, 1.15, 0.2);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.1, 1.15, 0.2);
  group.add(rightEye);
  
  // Create limbs based on character type
  switch(country) {
    case 'usa': // Gunslinger
      addGunslinger(group, color);
      break;
    case 'japan': // Samurai
      addSamurai(group, color);
      break;
    case 'uk': // Knight
      addKnight(group, color);
      break;
    case 'russia': // Brawler
      addBrawler(group, color);
      break;
    case 'brazil': // Capoeira
      addCapoeira(group, color);
      break;
    default:
      // Generic limbs
      addGenericLimbs(group, color);
  }
  
  // Create a simple animation
  const animations = [createIdleAnimation(), createAttackAnimation(), createVictoryAnimation()];
  
  return {
    scene: group,
    animations,
  };
}

/**
 * Creates a simple fallback environment model
 */
export function createFallbackEnvironment(): FallbackModel {
  const group = new THREE.Group();
  
  // Create ground
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3d3d3d,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = true;
  group.add(ground);
  
  // Create some simple structures
  const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
  
  for (let i = 0; i < 5; i++) {
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    const angle = (i / 5) * Math.PI * 2;
    const radius = 8;
    
    box.position.set(
      Math.cos(angle) * radius,
      1,
      Math.sin(angle) * radius
    );
    
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
  }
  
  // Create a central structure
  const centerGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 32);
  const centerMaterial = new THREE.MeshStandardMaterial({ color: 0x475569 });
  const centerPlatform = new THREE.Mesh(centerGeometry, centerMaterial);
  centerPlatform.position.set(0, 0.25, 0);
  centerPlatform.receiveShadow = true;
  group.add(centerPlatform);
  
  return {
    scene: group,
    animations: [],
  };
}

// Helper functions to add character-specific features

function addGunslinger(group: THREE.Group, color: string) {
  // Add hat
  const hatGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16);
  const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
  const hat = new THREE.Mesh(hatGeometry, hatMaterial);
  hat.position.set(0, 1.3, 0);
  hat.castShadow = true;
  group.add(hat);
  
  // Add gun
  const gunGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.4);
  const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
  const gun = new THREE.Mesh(gunGeometry, gunMaterial);
  gun.position.set(0.4, 0.5, 0.2);
  gun.castShadow = true;
  group.add(gun);
  
  // Add arms
  addArms(group, color, 0.4);
}

function addSamurai(group: THREE.Group, color: string) {
  // Add helmet
  const helmetGeometry = new THREE.ConeGeometry(0.3, 0.4, 16);
  const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x111827 });
  const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
  helmet.position.set(0, 1.4, 0);
  helmet.castShadow = true;
  group.add(helmet);
  
  // Add sword
  const swordGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.05);
  const swordMaterial = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
  const sword = new THREE.Mesh(swordGeometry, swordMaterial);
  sword.position.set(0.4, 0.7, 0.2);
  sword.rotation.z = Math.PI / 4;
  sword.castShadow = true;
  group.add(sword);
  
  // Add arms
  addArms(group, color, 0.4);
}

function addKnight(group: THREE.Group, color: string) {
  // Add helmet
  const helmetGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x374151 });
  const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
  helmet.position.set(0, 1.3, 0);
  helmet.castShadow = true;
  group.add(helmet);
  
  // Add shield
  const shieldGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.4);
  const shieldMaterial = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
  const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
  shield.position.set(-0.4, 0.5, 0.2);
  shield.castShadow = true;
  group.add(shield);
  
  // Add arms
  addArms(group, color, 0.4);
}

function addBrawler(group: THREE.Group, color: string) {
  // Add ushanka hat
  const hatGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.4);
  const hatMaterial = new THREE.MeshStandardMaterial({ color: 0x7f1d1d });
  const hat = new THREE.Mesh(hatGeometry, hatMaterial);
  hat.position.set(0, 1.3, 0);
  hat.castShadow = true;
  group.add(hat);
  
  // Add fists
  const fistGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  const fistMaterial = new THREE.MeshStandardMaterial({ color: 0xf8d8b9 });
  
  const leftFist = new THREE.Mesh(fistGeometry, fistMaterial);
  leftFist.position.set(-0.5, 0.5, 0.2);
  leftFist.castShadow = true;
  group.add(leftFist);
  
  const rightFist = new THREE.Mesh(fistGeometry, fistMaterial);
  rightFist.position.set(0.5, 0.5, 0.2);
  rightFist.castShadow = true;
  group.add(rightFist);
  
  // Add arms
  addArms(group, color, 0.5);
}

function addCapoeira(group: THREE.Group, color: string) {
  // Add headband
  const headbandGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16);
  const headbandMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
  const headband = new THREE.Mesh(headbandGeometry, headbandMaterial);
  headband.position.set(0, 1.15, 0);
  headband.rotation.x = Math.PI / 2;
  headband.castShadow = true;
  group.add(headband);
  
  // Add leg in kick position
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color });
  const leg = new THREE.Mesh(legGeometry, legMaterial);
  leg.position.set(0.3, 0.3, 0);
  leg.rotation.z = Math.PI / 4;
  leg.castShadow = true;
  group.add(leg);
  
  // Add arms
  addArms(group, color, 0.4);
}

function addGenericLimbs(group: THREE.Group, color: string) {
  // Add arms
  addArms(group, color, 0.4);
  
  // Add legs
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color });
  
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.2, 0.25, 0);
  leftLeg.castShadow = true;
  group.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.2, 0.25, 0);
  rightLeg.castShadow = true;
  group.add(rightLeg);
}

function addArms(group: THREE.Group, color: string, length: number) {
  const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
  const armMaterial = new THREE.MeshStandardMaterial({ color });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.3, 0.7, 0);
  leftArm.rotation.z = Math.PI / 2;
  leftArm.castShadow = true;
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.3, 0.7, 0);
  rightArm.rotation.z = -Math.PI / 2;
  rightArm.castShadow = true;
  group.add(rightArm);
}

// Animation creation helpers

function createIdleAnimation(): THREE.AnimationClip {
  // Create a simple up-down bobbing animation
  const times = [0, 1, 2];
  const positions = new Float32Array([
    0, 0, 0,
    0, 0.1, 0,
    0, 0, 0
  ]);
  
  const positionTrack = new THREE.KeyframeTrack(
    '.position[y]',
    times,
    positions
  );
  
  return new THREE.AnimationClip('idle', 2, [positionTrack]);
}

function createAttackAnimation(): THREE.AnimationClip {
  // Create a simple forward-backward animation
  const times = [0, 0.5, 1];
  const positions = new Float32Array([
    0, 0, 0,
    0, 0, 0.5,
    0, 0, 0
  ]);
  
  const positionTrack = new THREE.KeyframeTrack(
    '.position[z]',
    times,
    positions
  );
  
  return new THREE.AnimationClip('attack', 1, [positionTrack]);
}

function createVictoryAnimation(): THREE.AnimationClip {
  // Create a simple rotation animation
  const times = [0, 1, 2];
  const rotations = new Float32Array([
    0, 0, 0,
    0, Math.PI * 2, 0,
    0, 0, 0
  ]);
  
  const rotationTrack = new THREE.KeyframeTrack(
    '.rotation[y]',
    times,
    rotations
  );
  
  return new THREE.AnimationClip('victory', 2, [rotationTrack]);
} 