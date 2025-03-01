/**
 * Game Types
 * 
 * This file contains type definitions for the game components.
 */

import * as THREE from 'three';

/**
 * Character interface representing a player's character
 */
export interface Character {
  id: string;
  spriteData: string;
  country: string;
  createdAt: string;
}

/**
 * Online player interface representing a player in the game world
 */
export interface OnlinePlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  country: string;
  health: number;
  maxHealth: number;
  points: number;
  lastAttackTime: number;
  lastDefendTime: number;
  isDefending: boolean;
  isAttacking: boolean;
  isDead: boolean;
  respawnTime?: number;
  isNPC?: boolean;  // Flag to identify NPC players
  aiType?: string;  // Type of AI behavior for NPCs
}

/**
 * AI state for NPC players
 */
export interface NPCData {
  id: string;
  aiType: string;
  spawnPosition: THREE.Vector3;
  behaviorState: Record<string, any>;
}

/**
 * Game scene initialization parameters
 */
export interface SceneInit {
  scene: THREE.Scene;
  camera: THREE.Camera;
}

/**
 * Player position in the game world
 */
export interface PlayerPosition {
  x: number;
  y: number;
}

/**
 * Animation state for 3D models
 */
export interface AnimationState {
  mixer: THREE.AnimationMixer;
  actions: {
    idle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
    attack?: THREE.AnimationAction;
  };
  currentAction?: string;
} 