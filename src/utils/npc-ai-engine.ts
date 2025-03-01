/**
 * NPC AI Engine
 * 
 * This utility provides AI behavior for NPC characters in the game.
 * It handles movement, combat decisions, and other behaviors.
 */

import * as THREE from 'three';
import { OnlinePlayer } from '@/types/game';

// AI behavior types
export enum AIBehaviorType {
  PASSIVE = 'passive',      // Wanders around, doesn't attack unless attacked
  AGGRESSIVE = 'aggressive', // Actively seeks and attacks players
  DEFENSIVE = 'defensive',   // Stays in place, attacks only when approached
  COWARDLY = 'cowardly',     // Runs away when approached or health is low
  RANDOM = 'random'          // Unpredictable behavior
}

// AI state interface
export interface AIState {
  behaviorType: AIBehaviorType;
  targetId: string | null;
  lastDecisionTime: number;
  wanderTarget: THREE.Vector3 | null;
  fleeTarget: THREE.Vector3 | null;
  isResting: boolean;
  restUntil: number;
  lastAttackTime: number;
  lastDefendTime: number;
}

// Configuration for AI behavior
export interface AIConfig {
  decisionInterval: number;  // How often AI makes decisions (ms)
  aggroRange: number;        // Distance at which AI detects players
  attackRange: number;       // Distance at which AI can attack
  fleeThreshold: number;     // Health percentage at which AI flees
  wanderRadius: number;      // Maximum distance AI will wander from spawn
  attackCooldown: number;    // Cooldown between attacks (ms)
  defendCooldown: number;    // Cooldown between defend actions (ms)
}

// Default AI configuration
const DEFAULT_AI_CONFIG: AIConfig = {
  decisionInterval: 1000,    // Make decisions every second
  aggroRange: 5,             // Detect players within 5 units
  attackRange: 2,            // Attack players within 2 units
  fleeThreshold: 0.3,        // Flee when health below 30%
  wanderRadius: 10,          // Wander up to 10 units from spawn
  attackCooldown: 2000,      // Attack every 2 seconds
  defendCooldown: 3000       // Defend every 3 seconds
};

/**
 * Creates a new AI state with the specified behavior type
 */
export function createAIState(behaviorType: AIBehaviorType = AIBehaviorType.PASSIVE): AIState {
  return {
    behaviorType,
    targetId: null,
    lastDecisionTime: 0,
    wanderTarget: null,
    fleeTarget: null,
    isResting: false,
    restUntil: 0,
    lastAttackTime: 0,
    lastDefendTime: 0
  };
}

/**
 * Determines if an NPC should make a new decision based on the decision interval
 */
export function shouldMakeDecision(aiState: AIState, config: AIConfig = DEFAULT_AI_CONFIG): boolean {
  const now = Date.now();
  return now - aiState.lastDecisionTime >= config.decisionInterval;
}

/**
 * Finds the nearest player to the NPC
 */
export function findNearestPlayer(
  npc: OnlinePlayer,
  players: OnlinePlayer[],
  maxDistance: number = Infinity
): OnlinePlayer | null {
  let nearestPlayer: OnlinePlayer | null = null;
  let nearestDistance = maxDistance;

  players.forEach(player => {
    // Skip self, dead players, and other NPCs
    if (player.id === npc.id || player.isDead || player.isNPC) {
      return;
    }

    const distance = calculateDistance(npc, player);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPlayer = player;
    }
  });

  return nearestPlayer;
}

/**
 * Calculates distance between two players
 */
export function calculateDistance(player1: OnlinePlayer, player2: OnlinePlayer): number {
  const dx = player1.x - player2.x;
  const dy = player1.y - player2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generates a random position within the wander radius
 */
export function generateWanderTarget(
  npc: OnlinePlayer,
  spawnPosition: THREE.Vector3,
  config: AIConfig = DEFAULT_AI_CONFIG
): THREE.Vector3 {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * config.wanderRadius;
  
  const x = spawnPosition.x + Math.cos(angle) * distance;
  const z = spawnPosition.z + Math.sin(angle) * distance;
  
  return new THREE.Vector3(x, 0, z);
}

/**
 * Generates a position to flee to (away from target)
 */
export function generateFleeTarget(
  npc: OnlinePlayer,
  target: OnlinePlayer,
  config: AIConfig = DEFAULT_AI_CONFIG
): THREE.Vector3 {
  // Calculate direction away from target
  const dx = npc.x - target.x;
  const dy = npc.y - target.y;
  
  // Normalize and scale by wander radius
  const length = Math.sqrt(dx * dx + dy * dy);
  const normalizedX = dx / length;
  const normalizedY = dy / length;
  
  const fleeDistance = config.wanderRadius;
  
  const x = npc.x + normalizedX * fleeDistance;
  const z = npc.y + normalizedY * fleeDistance;
  
  return new THREE.Vector3(x, 0, z);
}

/**
 * Updates the AI state based on the current game state
 */
export function updateAIState(
  npc: OnlinePlayer,
  aiState: AIState,
  players: OnlinePlayer[],
  spawnPosition: THREE.Vector3,
  config: AIConfig = DEFAULT_AI_CONFIG
): AIState {
  const now = Date.now();
  
  // Don't make decisions if resting
  if (aiState.isResting && now < aiState.restUntil) {
    return aiState;
  }
  
  // Don't make decisions too frequently
  if (!shouldMakeDecision(aiState, config)) {
    return aiState;
  }
  
  // Update last decision time
  const updatedState: AIState = {
    ...aiState,
    lastDecisionTime: now,
    isResting: false
  };
  
  // Check if health is low and should flee
  const healthPercentage = npc.health / npc.maxHealth;
  if (healthPercentage <= config.fleeThreshold && aiState.behaviorType !== AIBehaviorType.COWARDLY) {
    // Temporarily become cowardly when health is low
    updatedState.behaviorType = AIBehaviorType.COWARDLY;
  } else if (healthPercentage > config.fleeThreshold && aiState.behaviorType === AIBehaviorType.COWARDLY) {
    // Restore original behavior when health recovers
    // This assumes the original behavior wasn't cowardly
    updatedState.behaviorType = AIBehaviorType.PASSIVE;
  }
  
  // Find nearest player
  const nearestPlayer = findNearestPlayer(npc, players, 
    aiState.behaviorType === AIBehaviorType.AGGRESSIVE ? Infinity : config.aggroRange);
  
  // Update target based on behavior type
  switch (updatedState.behaviorType) {
    case AIBehaviorType.AGGRESSIVE:
      if (nearestPlayer) {
        updatedState.targetId = nearestPlayer.id;
        updatedState.wanderTarget = null;
        updatedState.fleeTarget = null;
      } else if (!updatedState.wanderTarget) {
        updatedState.wanderTarget = generateWanderTarget(npc, spawnPosition, config);
      }
      break;
      
    case AIBehaviorType.DEFENSIVE:
      if (nearestPlayer && calculateDistance(npc, nearestPlayer) <= config.aggroRange) {
        updatedState.targetId = nearestPlayer.id;
        updatedState.wanderTarget = null;
        updatedState.fleeTarget = null;
      } else {
        updatedState.targetId = null;
      }
      break;
      
    case AIBehaviorType.COWARDLY:
      if (nearestPlayer) {
        updatedState.targetId = null;
        updatedState.wanderTarget = null;
        updatedState.fleeTarget = generateFleeTarget(npc, nearestPlayer, config);
      } else if (!updatedState.wanderTarget) {
        updatedState.wanderTarget = generateWanderTarget(npc, spawnPosition, config);
      }
      break;
      
    case AIBehaviorType.RANDOM:
      // Randomly change behavior
      if (Math.random() < 0.2) { // 20% chance to change behavior
        const behaviors = Object.values(AIBehaviorType);
        updatedState.behaviorType = behaviors[Math.floor(Math.random() * behaviors.length)];
      }
      
      if (nearestPlayer && Math.random() < 0.7) { // 70% chance to target nearest player
        updatedState.targetId = nearestPlayer.id;
        updatedState.wanderTarget = null;
        updatedState.fleeTarget = null;
      } else if (Math.random() < 0.3) { // 30% chance to wander
        updatedState.targetId = null;
        updatedState.wanderTarget = generateWanderTarget(npc, spawnPosition, config);
        updatedState.fleeTarget = null;
      }
      break;
      
    case AIBehaviorType.PASSIVE:
    default:
      if (nearestPlayer && npc.health < npc.maxHealth) {
        // If attacked (health reduced), target the attacker
        updatedState.targetId = nearestPlayer.id;
        updatedState.wanderTarget = null;
        updatedState.fleeTarget = null;
      } else if (!updatedState.wanderTarget || Math.random() < 0.1) { // 10% chance to change wander target
        updatedState.wanderTarget = generateWanderTarget(npc, spawnPosition, config);
      }
      break;
  }
  
  return updatedState;
}

/**
 * Determines the next action for an NPC based on its AI state
 */
export function determineNextAction(
  npc: OnlinePlayer,
  aiState: AIState,
  players: OnlinePlayer[],
  config: AIConfig = DEFAULT_AI_CONFIG
): {
  moveDirection: THREE.Vector3 | null;
  shouldAttack: boolean;
  shouldDefend: boolean;
  targetId: string | null;
} {
  const now = Date.now();
  let moveDirection: THREE.Vector3 | null = null;
  let shouldAttack = false;
  let shouldDefend = false;
  
  // Find target player if we have a targetId
  const targetPlayer = aiState.targetId 
    ? players.find(p => p.id === aiState.targetId) || null
    : null;
  
  // Handle movement based on AI state
  if (aiState.fleeTarget) {
    // Move towards flee target
    moveDirection = new THREE.Vector3(
      aiState.fleeTarget.x - npc.x,
      0,
      aiState.fleeTarget.z - npc.y
    ).normalize();
  } else if (targetPlayer && !targetPlayer.isDead) {
    const distance = calculateDistance(npc, targetPlayer);
    
    if (distance <= config.attackRange) {
      // In attack range, stop moving
      moveDirection = null;
      
      // Attack if cooldown has passed
      if (now - aiState.lastAttackTime >= config.attackCooldown) {
        shouldAttack = true;
      }
      
      // Randomly decide to defend
      if (now - aiState.lastDefendTime >= config.defendCooldown && Math.random() < 0.3) {
        shouldDefend = true;
      }
    } else {
      // Move towards target
      moveDirection = new THREE.Vector3(
        targetPlayer.x - npc.x,
        0,
        targetPlayer.y - npc.y
      ).normalize();
    }
  } else if (aiState.wanderTarget) {
    // Move towards wander target
    moveDirection = new THREE.Vector3(
      aiState.wanderTarget.x - npc.x,
      0,
      aiState.wanderTarget.z - npc.y
    ).normalize();
    
    // Check if we've reached the wander target
    const distanceToTarget = Math.sqrt(
      Math.pow(aiState.wanderTarget.x - npc.x, 2) +
      Math.pow(aiState.wanderTarget.z - npc.y, 2)
    );
    
    if (distanceToTarget < 0.5) {
      // Close enough to target, clear it
      moveDirection = null;
    }
  }
  
  return {
    moveDirection,
    shouldAttack,
    shouldDefend,
    targetId: targetPlayer?.id || null
  };
}

/**
 * Updates an NPC's position based on the move direction
 */
export function updateNPCPosition(
  npc: OnlinePlayer,
  moveDirection: THREE.Vector3,
  deltaTime: number,
  moveSpeed: number = 2
): OnlinePlayer {
  if (!moveDirection) return npc;
  
  // Calculate new position
  const newX = npc.x + moveDirection.x * moveSpeed * deltaTime;
  const newY = npc.y + moveDirection.z * moveSpeed * deltaTime;
  
  // Return updated player
  return {
    ...npc,
    x: newX,
    y: newY
  };
}

/**
 * Processes an attack action for an NPC
 */
export function processNPCAttack(
  npc: OnlinePlayer,
  targetId: string | null,
  players: OnlinePlayer[],
  aiState: AIState
): {
  updatedNPC: OnlinePlayer;
  updatedTarget: OnlinePlayer | null;
  updatedAIState: AIState;
} {
  if (!targetId) {
    return { updatedNPC: npc, updatedTarget: null, updatedAIState: aiState };
  }
  
  const targetPlayer = players.find(p => p.id === targetId);
  if (!targetPlayer || targetPlayer.isDead) {
    return { updatedNPC: npc, updatedTarget: null, updatedAIState: aiState };
  }
  
  // Calculate damage based on character country/class
  const damageMin = 5;
  const damageMax = 15;
  const damage = Math.floor(Math.random() * (damageMax - damageMin + 1)) + damageMin;
  
  // Check if target is defending
  const actualDamage = targetPlayer.isDefending ? Math.floor(damage / 2) : damage;
  
  // Update target's health
  const updatedTarget = {
    ...targetPlayer,
    health: Math.max(0, targetPlayer.health - actualDamage),
    isDead: targetPlayer.health - actualDamage <= 0
  };
  
  // Update NPC state
  const updatedNPC = {
    ...npc,
    isAttacking: true,
    lastAttackTime: Date.now()
  };
  
  // Update AI state
  const updatedAIState = {
    ...aiState,
    lastAttackTime: Date.now()
  };
  
  return { updatedNPC, updatedTarget, updatedAIState };
}

/**
 * Processes a defend action for an NPC
 */
export function processNPCDefend(
  npc: OnlinePlayer,
  aiState: AIState
): {
  updatedNPC: OnlinePlayer;
  updatedAIState: AIState;
} {
  // Update NPC state
  const updatedNPC = {
    ...npc,
    isDefending: true,
    lastDefendTime: Date.now()
  };
  
  // Update AI state
  const updatedAIState = {
    ...aiState,
    lastDefendTime: Date.now()
  };
  
  return { updatedNPC, updatedAIState };
}

/**
 * Main function to update an NPC based on AI behavior
 */
export function updateNPC(
  npc: OnlinePlayer,
  aiState: AIState,
  players: OnlinePlayer[],
  spawnPosition: THREE.Vector3,
  deltaTime: number,
  config: AIConfig = DEFAULT_AI_CONFIG
): {
  updatedNPC: OnlinePlayer;
  updatedAIState: AIState;
  updatedTarget: OnlinePlayer | null;
} {
  // Don't update dead NPCs
  if (npc.isDead) {
    return { updatedNPC: npc, updatedAIState: aiState, updatedTarget: null };
  }
  
  // Update AI state
  const newAIState = updateAIState(npc, aiState, players, spawnPosition, config);
  
  // Determine next action
  const { moveDirection, shouldAttack, shouldDefend, targetId } = 
    determineNextAction(npc, newAIState, players, config);
  
  // Apply movement
  let updatedNPC = npc;
  if (moveDirection) {
    updatedNPC = updateNPCPosition(updatedNPC, moveDirection, deltaTime);
  }
  
  // Reset attack/defend flags
  updatedNPC = {
    ...updatedNPC,
    isAttacking: false,
    isDefending: false
  };
  
  let updatedTarget: OnlinePlayer | null = null;
  
  // Process attack if needed
  if (shouldAttack) {
    const attackResult = processNPCAttack(updatedNPC, targetId, players, newAIState);
    updatedNPC = attackResult.updatedNPC;
    updatedTarget = attackResult.updatedTarget;
    newAIState.lastAttackTime = Date.now();
  }
  
  // Process defend if needed
  if (shouldDefend) {
    const defendResult = processNPCDefend(updatedNPC, newAIState);
    updatedNPC = defendResult.updatedNPC;
    newAIState.lastDefendTime = Date.now();
  }
  
  return {
    updatedNPC,
    updatedAIState: newAIState,
    updatedTarget
  };
} 