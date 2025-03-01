/**
 * Character Models Generator
 * 
 * This utility creates more detailed 3D models for characters
 * using Three.js primitives. These models are more visually appealing
 * than the basic fallback models but still don't require external files.
 */

import * as THREE from 'three';
import { getPlayerColor } from './character-renderer';

export interface CharacterModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

/**
 * Creates a detailed character model for the specified country/character type
 */
export function createCharacterModel(country: string): CharacterModel {
  const group = new THREE.Group();
  const color = getPlayerColor(country);
  
  // Create base model that all characters share
  createBaseHumanoid(group, color);
  
  // Add character-specific features
  switch(country.toLowerCase()) {
    case 'usa':
      createGunslinger(group, color);
      break;
    case 'japan':
      createSamurai(group, color);
      break;
    case 'uk':
      createKnight(group, color);
      break;
    case 'russia':
      createBrawler(group, color);
      break;
    case 'brazil':
      createCapoeira(group, color);
      break;
    default:
      // Generic character if country not recognized
      createGenericCharacter(group, color);
  }
  
  // Scale up the model to make it more visible
  group.scale.set(3, 3, 3);
  
  // Ensure the model is positioned at the origin with feet at y=0
  const box = new THREE.Box3().setFromObject(group);
  const height = box.max.y - box.min.y;
  const offset = -box.min.y; // Calculate offset to place bottom at y=0
  
  // Apply the offset to position the model correctly
  group.position.y = offset;
  
  console.log(`Character model for ${country} created with height ${height} and offset ${offset}`);
  
  // Enhance material properties for better visibility
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              // Increase emissive to make colors more vibrant
              mat.emissive = new THREE.Color(mat.color).multiplyScalar(0.3);
              mat.emissiveIntensity = 0.5;
              
              // Adjust material properties for better rendering
              mat.roughness = 0.5;
              mat.metalness = 0.5;
              mat.needsUpdate = true;
            }
          });
        } else if (object.material instanceof THREE.MeshStandardMaterial) {
          // Increase emissive to make colors more vibrant
          object.material.emissive = new THREE.Color(object.material.color).multiplyScalar(0.3);
          object.material.emissiveIntensity = 0.5;
          
          // Adjust material properties for better rendering
          object.material.roughness = 0.5;
          object.material.metalness = 0.5;
          object.material.needsUpdate = true;
        }
      }
    }
  });
  
  // Add a debug box around the model to help with visibility issues
  const debugBox = new THREE.BoxHelper(group, 0xffff00);
  debugBox.name = 'debugBox';
  debugBox.visible = false; // Hidden by default, can be toggled in debug mode
  group.add(debugBox);
  
  // Create animations
  const animations = [
    createIdleAnimation(),
    createWalkAnimation(),
    createAttackAnimation()
  ];
  
  return {
    scene: group,
    animations
  };
}

/**
 * Creates the base humanoid model shared by all characters
 */
function createBaseHumanoid(group: THREE.Group, color: THREE.ColorRepresentation) {
  // Create torso
  const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 4, 8);
  const torsoMaterial = new THREE.MeshStandardMaterial({ 
    color, 
    roughness: 0.7,
    metalness: 0.3
  });
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.set(0, 0.75, 0);
  torso.castShadow = true;
  torso.name = 'torso';
  group.add(torso);
  
  // Create head
  const headGeometry = new THREE.SphereGeometry(0.2, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf8d8b9,
    roughness: 0.8,
    metalness: 0.1
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 1.25, 0);
  head.castShadow = true;
  head.name = 'head';
  group.add(head);
  
  // Create neck
  const neckGeometry = new THREE.CylinderGeometry(0.08, 0.1, 0.1, 16);
  const neckMaterial = new THREE.MeshStandardMaterial({ color: 0xf8d8b9 });
  const neck = new THREE.Mesh(neckGeometry, neckMaterial);
  neck.position.set(0, 1.1, 0);
  neck.castShadow = true;
  group.add(neck);
  
  // Create eyes
  const eyeGeometry = new THREE.SphereGeometry(0.03, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.07, 1.28, 0.15);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.07, 1.28, 0.15);
  group.add(rightEye);
  
  // Create legs
  createLimb(group, color, 'leftLeg', -0.1, 0.4, 0, 0.08, 0.3);
  createLimb(group, color, 'rightLeg', 0.1, 0.4, 0, 0.08, 0.3);
  
  // Create feet
  const footGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.2);
  const footMaterial = new THREE.MeshStandardMaterial({ color: 0x111827 });
  
  const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
  leftFoot.position.set(-0.1, 0.025, 0.05);
  leftFoot.castShadow = true;
  group.add(leftFoot);
  
  const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
  rightFoot.position.set(0.1, 0.025, 0.05);
  rightFoot.castShadow = true;
  group.add(rightFoot);
  
  // Create arms
  createLimb(group, color, 'leftArm', -0.3, 0.9, 0, 0.07, 0.25);
  createLimb(group, color, 'rightArm', 0.3, 0.9, 0, 0.07, 0.25);
}

/**
 * Helper function to create a limb (arm or leg)
 */
function createLimb(
  group: THREE.Group, 
  color: THREE.ColorRepresentation, 
  name: string, 
  x: number, 
  y: number, 
  z: number, 
  radius: number, 
  height: number
) {
  const limbGeometry = new THREE.CapsuleGeometry(radius, height, 4, 8);
  const limbMaterial = new THREE.MeshStandardMaterial({ 
    color, 
    roughness: 0.7,
    metalness: 0.3
  });
  const limb = new THREE.Mesh(limbGeometry, limbMaterial);
  limb.position.set(x, y, z);
  limb.castShadow = true;
  limb.name = name;
  group.add(limb);
  
  return limb;
}

/**
 * Creates a gunslinger character (USA)
 */
function createGunslinger(group: THREE.Group, color: THREE.ColorRepresentation) {
  // Create cowboy hat
  const hatRimGeometry = new THREE.TorusGeometry(0.25, 0.05, 8, 24);
  const hatTopGeometry = new THREE.CylinderGeometry(0, 0.2, 0.15, 24);
  const hatMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4b5320,
    roughness: 0.9,
    metalness: 0.1
  });
  
  const hatRim = new THREE.Mesh(hatRimGeometry, hatMaterial);
  hatRim.position.set(0, 1.4, 0);
  hatRim.rotation.x = Math.PI / 2;
  hatRim.castShadow = true;
  group.add(hatRim);
  
  const hatTop = new THREE.Mesh(hatTopGeometry, hatMaterial);
  hatTop.position.set(0, 1.5, 0);
  hatTop.castShadow = true;
  group.add(hatTop);
  
  // Create gun
  const gunHandleGeometry = new THREE.BoxGeometry(0.03, 0.1, 0.05);
  const gunBarrelGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.15);
  const gunMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    roughness: 0.5,
    metalness: 0.8
  });
  
  const gunHandle = new THREE.Mesh(gunHandleGeometry, gunMaterial);
  gunHandle.position.set(0.35, 0.75, 0.1);
  gunHandle.castShadow = true;
  group.add(gunHandle);
  
  const gunBarrel = new THREE.Mesh(gunBarrelGeometry, gunMaterial);
  gunBarrel.position.set(0.35, 0.8, 0.15);
  gunBarrel.castShadow = true;
  group.add(gunBarrel);
  
  // Create belt with holster
  const beltGeometry = new THREE.TorusGeometry(0.25, 0.02, 8, 24);
  const beltMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5c4033,
    roughness: 0.9,
    metalness: 0.2
  });
  
  const belt = new THREE.Mesh(beltGeometry, beltMaterial);
  belt.position.set(0, 0.55, 0);
  belt.rotation.x = Math.PI / 2;
  belt.castShadow = true;
  group.add(belt);
  
  // Create vest
  const vestGeometry = new THREE.CapsuleGeometry(0.26, 0.4, 4, 8);
  const vestMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const vest = new THREE.Mesh(vestGeometry, vestMaterial);
  vest.position.set(0, 0.75, 0);
  vest.scale.set(1, 1, 0.8);
  vest.castShadow = true;
  group.add(vest);
}

/**
 * Creates a samurai character (Japan)
 */
function createSamurai(group: THREE.Group, color: THREE.ColorRepresentation) {
  // Create samurai helmet (kabuto)
  const helmetBaseGeometry = new THREE.SphereGeometry(0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const helmetTopGeometry = new THREE.ConeGeometry(0.15, 0.2, 16);
  const helmetMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111,
    roughness: 0.5,
    metalness: 0.8
  });
  
  const helmetBase = new THREE.Mesh(helmetBaseGeometry, helmetMaterial);
  helmetBase.position.set(0, 1.35, 0);
  helmetBase.castShadow = true;
  group.add(helmetBase);
  
  const helmetTop = new THREE.Mesh(helmetTopGeometry, helmetMaterial);
  helmetTop.position.set(0, 1.5, 0);
  helmetTop.castShadow = true;
  group.add(helmetTop);
  
  // Create face mask (menpo)
  const maskGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.1);
  const maskMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.6,
    metalness: 0.7
  });
  
  const mask = new THREE.Mesh(maskGeometry, maskMaterial);
  mask.position.set(0, 1.25, 0.15);
  mask.castShadow = true;
  group.add(mask);
  
  // Create armor plates (do)
  const armorGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.3);
  const armorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b0000,
    roughness: 0.7,
    metalness: 0.5
  });
  
  const armor = new THREE.Mesh(armorGeometry, armorMaterial);
  armor.position.set(0, 0.75, 0);
  armor.castShadow = true;
  group.add(armor);
  
  // Create katana
  const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
  const bladeGeometry = new THREE.BoxGeometry(0.02, 0.5, 0.04);
  const handleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x000000,
    roughness: 0.8,
    metalness: 0.2
  });
  const bladeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    roughness: 0.3,
    metalness: 0.9
  });
  
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(0.35, 0.7, 0.1);
  handle.rotation.x = Math.PI / 2;
  handle.castShadow = true;
  group.add(handle);
  
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade.position.set(0.35, 0.95, 0.1);
  blade.castShadow = true;
  group.add(blade);
}

/**
 * Creates a knight character (UK)
 */
function createKnight(group: THREE.Group, color: THREE.ColorRepresentation) {
  // Create helmet
  const helmetGeometry = new THREE.SphereGeometry(0.22, 16, 16);
  const helmetMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x7a7a7a,
    roughness: 0.4,
    metalness: 0.8
  });
  
  const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
  helmet.position.set(0, 1.25, 0);
  helmet.scale.set(1, 1.1, 1);
  helmet.castShadow = true;
  group.add(helmet);
  
  // Create visor
  const visorGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.05);
  const visorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.4,
    metalness: 0.8
  });
  
  const visor = new THREE.Mesh(visorGeometry, visorMaterial);
  visor.position.set(0, 1.25, 0.15);
  visor.castShadow = true;
  group.add(visor);
  
  // Create armor
  const chestplateGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.3);
  const chestplateMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x7a7a7a,
    roughness: 0.4,
    metalness: 0.8
  });
  
  const chestplate = new THREE.Mesh(chestplateGeometry, chestplateMaterial);
  chestplate.position.set(0, 0.75, 0);
  chestplate.castShadow = true;
  group.add(chestplate);
  
  // Create shield
  const shieldGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.3);
  const shieldMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x003366,
    roughness: 0.7,
    metalness: 0.5
  });
  
  const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
  shield.position.set(-0.35, 0.8, 0.1);
  shield.castShadow = true;
  group.add(shield);
  
  // Create sword
  const swordHandleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
  const swordBladeGeometry = new THREE.BoxGeometry(0.03, 0.4, 0.01);
  const swordGuardGeometry = new THREE.BoxGeometry(0.15, 0.02, 0.03);
  
  const swordHandleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x5c4033,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const swordBladeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    roughness: 0.3,
    metalness: 0.9
  });
  
  const swordHandle = new THREE.Mesh(swordHandleGeometry, swordHandleMaterial);
  swordHandle.position.set(0.35, 0.7, 0.1);
  swordHandle.rotation.x = Math.PI / 2;
  swordHandle.castShadow = true;
  group.add(swordHandle);
  
  const swordGuard = new THREE.Mesh(swordGuardGeometry, swordBladeMaterial);
  swordGuard.position.set(0.35, 0.75, 0.1);
  swordGuard.castShadow = true;
  group.add(swordGuard);
  
  const swordBlade = new THREE.Mesh(swordBladeGeometry, swordBladeMaterial);
  swordBlade.position.set(0.35, 0.95, 0.1);
  swordBlade.castShadow = true;
  group.add(swordBlade);
}

/**
 * Creates a brawler character (Russia)
 */
function createBrawler(group: THREE.Group, color: THREE.ColorRepresentation) {
  // Create ushanka hat
  const hatBaseGeometry = new THREE.SphereGeometry(0.22, 16, 16);
  const hatEarflapGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
  const hatMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x654321,
    roughness: 0.9,
    metalness: 0.1
  });
  
  const hatBase = new THREE.Mesh(hatBaseGeometry, hatMaterial);
  hatBase.position.set(0, 1.35, 0);
  hatBase.castShadow = true;
  group.add(hatBase);
  
  const leftEarflap = new THREE.Mesh(hatEarflapGeometry, hatMaterial);
  leftEarflap.position.set(-0.2, 1.25, 0);
  leftEarflap.castShadow = true;
  group.add(leftEarflap);
  
  const rightEarflap = new THREE.Mesh(hatEarflapGeometry, hatMaterial);
  rightEarflap.position.set(0.2, 1.25, 0);
  rightEarflap.castShadow = true;
  group.add(rightEarflap);
  
  // Create muscular torso (replace the default one)
  const torsoGeometry = new THREE.CapsuleGeometry(0.3, 0.5, 4, 8);
  const torsoMaterial = new THREE.MeshStandardMaterial({ 
    color, 
    roughness: 0.7,
    metalness: 0.3
  });
  
  // Find and remove the default torso
  const defaultTorso = group.getObjectByName('torso');
  if (defaultTorso) {
    group.remove(defaultTorso);
  }
  
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.set(0, 0.75, 0);
  torso.castShadow = true;
  torso.name = 'torso';
  group.add(torso);
  
  // Create larger arms
  const leftArm = group.getObjectByName('leftArm');
  const rightArm = group.getObjectByName('rightArm');
  
  if (leftArm) {
    group.remove(leftArm);
  }
  if (rightArm) {
    group.remove(rightArm);
  }
  
  createLimb(group, color, 'leftArm', -0.35, 0.9, 0, 0.09, 0.25);
  createLimb(group, color, 'rightArm', 0.35, 0.9, 0, 0.09, 0.25);
  
  // Create fists
  const fistGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const fistMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf8d8b9,
    roughness: 0.8,
    metalness: 0.1
  });
  
  const leftFist = new THREE.Mesh(fistGeometry, fistMaterial);
  leftFist.position.set(-0.35, 0.7, 0);
  leftFist.castShadow = true;
  group.add(leftFist);
  
  const rightFist = new THREE.Mesh(fistGeometry, fistMaterial);
  rightFist.position.set(0.35, 0.7, 0);
  rightFist.castShadow = true;
  group.add(rightFist);
}

/**
 * Creates a capoeira character (Brazil)
 */
function createCapoeira(group: THREE.Group, color: THREE.ColorRepresentation) {
  // Create headband
  const headbandGeometry = new THREE.TorusGeometry(0.2, 0.03, 8, 24);
  const headbandMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffff00,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const headband = new THREE.Mesh(headbandGeometry, headbandMaterial);
  headband.position.set(0, 1.25, 0);
  headband.rotation.x = Math.PI / 2;
  headband.castShadow = true;
  group.add(headband);
  
  // Create capoeira pants
  const pantsGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.5, 16);
  const pantsMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.1
  });
  
  const pants = new THREE.Mesh(pantsGeometry, pantsMaterial);
  pants.position.set(0, 0.25, 0);
  pants.castShadow = true;
  group.add(pants);
  
  // Modify legs for capoeira stance
  const leftLeg = group.getObjectByName('leftLeg');
  const rightLeg = group.getObjectByName('rightLeg');
  
  if (leftLeg) {
    leftLeg.position.set(-0.15, 0.4, 0.1);
    leftLeg.rotation.x = Math.PI / 6;
  }
  
  if (rightLeg) {
    rightLeg.position.set(0.15, 0.4, -0.1);
    rightLeg.rotation.x = -Math.PI / 6;
  }
  
  // Create athletic torso
  const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.4, 4, 8);
  const torsoMaterial = new THREE.MeshStandardMaterial({ 
    color, 
    roughness: 0.7,
    metalness: 0.3
  });
  
  // Find and remove the default torso
  const defaultTorso = group.getObjectByName('torso');
  if (defaultTorso) {
    group.remove(defaultTorso);
  }
  
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.set(0, 0.75, 0);
  torso.castShadow = true;
  torso.name = 'torso';
  group.add(torso);
}

/**
 * Creates a generic character for any unrecognized country
 */
function createGenericCharacter(group: THREE.Group, color: THREE.ColorRepresentation) {
  // Create simple hat
  const hatGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
  const hatMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const hat = new THREE.Mesh(hatGeometry, hatMaterial);
  hat.position.set(0, 1.4, 0);
  hat.castShadow = true;
  group.add(hat);
}

/**
 * Creates an idle animation
 */
function createIdleAnimation(): THREE.AnimationClip {
  const times = [0, 1, 2];
  const values = [
    // Head position at time 0
    0, 1.25, 0,
    // Head position at time 1
    0, 1.27, 0,
    // Head position at time 2
    0, 1.25, 0
  ];
  
  const track = new THREE.VectorKeyframeTrack(
    'head.position',
    times,
    values
  );
  
  return new THREE.AnimationClip('idle', 2, [track]);
}

/**
 * Creates a walking animation
 */
function createWalkAnimation(): THREE.AnimationClip {
  const times = [0, 0.5, 1];
  
  // Left leg animation
  const leftLegValues = [
    // Position at time 0
    -0.1, 0.4, 0,
    // Position at time 0.5
    -0.1, 0.45, 0.1,
    // Position at time 1
    -0.1, 0.4, 0
  ];
  
  // Right leg animation
  const rightLegValues = [
    // Position at time 0
    0.1, 0.45, 0.1,
    // Position at time 0.5
    0.1, 0.4, 0,
    // Position at time 1
    0.1, 0.45, 0.1
  ];
  
  const leftLegTrack = new THREE.VectorKeyframeTrack(
    'leftLeg.position',
    times,
    leftLegValues
  );
  
  const rightLegTrack = new THREE.VectorKeyframeTrack(
    'rightLeg.position',
    times,
    rightLegValues
  );
  
  return new THREE.AnimationClip('walk', 1, [leftLegTrack, rightLegTrack]);
}

/**
 * Creates an attack animation
 */
function createAttackAnimation(): THREE.AnimationClip {
  const times = [0, 0.3, 0.6, 1];
  
  // Right arm animation
  const rightArmValues = [
    // Position at time 0
    0.3, 0.9, 0,
    // Position at time 0.3
    0.2, 0.9, 0.3,
    // Position at time 0.6
    0.4, 0.9, 0.3,
    // Position at time 1
    0.3, 0.9, 0
  ];
  
  const rightArmTrack = new THREE.VectorKeyframeTrack(
    'rightArm.position',
    times,
    rightArmValues
  );
  
  return new THREE.AnimationClip('attack', 1, [rightArmTrack]);
} 