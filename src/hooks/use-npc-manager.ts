"use client";

import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OnlinePlayer, NPCData } from "@/types/game";
import { 
  AIBehaviorType, 
  AIState, 
  createAIState, 
  updateNPC 
} from "@/utils/npc-ai-engine";

interface UseNPCManagerProps {
  mapSize: { width: number; height: number };
  playerCount?: number;
  onNPCUpdate?: (npc: OnlinePlayer) => void;
  onPlayerDamage?: (playerId: string, damage: number) => void;
}

interface UseNPCManagerReturn {
  npcs: OnlinePlayer[];
  npcData: Map<string, NPCData>;
  addNPC: (npc: Partial<OnlinePlayer>) => OnlinePlayer;
  removeNPC: (id: string) => void;
  updateNPCs: (players: OnlinePlayer[], deltaTime: number) => void;
}

/**
 * Hook for managing NPC players with AI behavior
 */
export function useNPCManager({
  mapSize,
  playerCount = 5,
  onNPCUpdate,
  onPlayerDamage
}: UseNPCManagerProps): UseNPCManagerReturn {
  const [npcs, setNPCs] = useState<OnlinePlayer[]>([]);
  const npcDataRef = useRef<Map<string, NPCData>>(new Map());
  const aiStatesRef = useRef<Map<string, AIState>>(new Map());
  
  // Initialize NPCs
  useEffect(() => {
    const initialNPCs: OnlinePlayer[] = [];
    const countries = ["usa", "japan", "uk", "russia", "brazil"];
    const aiTypes = Object.values(AIBehaviorType);
    
    for (let i = 0; i < playerCount; i++) {
      const id = `npc-${i + 1}`;
      const country = countries[Math.floor(Math.random() * countries.length)];
      const aiType = aiTypes[Math.floor(Math.random() * aiTypes.length)];
      
      // Random position within map bounds
      const x = Math.random() * (mapSize.width - 64) + 32;
      const y = Math.random() * (mapSize.height - 64) + 32;
      
      // Create NPC
      const npc: OnlinePlayer = {
        id,
        name: `NPC ${i + 1}`,
        x,
        y,
        country,
        health: 100,
        maxHealth: 100,
        points: Math.floor(Math.random() * 5) + 1,
        lastAttackTime: 0,
        lastDefendTime: 0,
        isDefending: false,
        isAttacking: false,
        isDead: false,
        isNPC: true,
        aiType
      };
      
      initialNPCs.push(npc);
      
      // Create AI state
      const aiState = createAIState(aiType as AIBehaviorType);
      aiStatesRef.current.set(id, aiState);
      
      // Store NPC data
      npcDataRef.current.set(id, {
        id,
        aiType,
        spawnPosition: new THREE.Vector3(x, 0, y),
        behaviorState: {}
      });
    }
    
    setNPCs(initialNPCs);
    
    // Cleanup
    return () => {
      aiStatesRef.current.clear();
      npcDataRef.current.clear();
    };
  }, [mapSize, playerCount]);
  
  /**
   * Add a new NPC to the game
   */
  const addNPC = (npcPartial: Partial<OnlinePlayer>): OnlinePlayer => {
    const id = npcPartial.id || `npc-${Date.now()}`;
    const country = npcPartial.country || "usa";
    const aiType = npcPartial.aiType || AIBehaviorType.PASSIVE;
    
    // Create NPC with default values
    const npc: OnlinePlayer = {
      id,
      name: npcPartial.name || `NPC ${npcs.length + 1}`,
      x: npcPartial.x || Math.random() * (mapSize.width - 64) + 32,
      y: npcPartial.y || Math.random() * (mapSize.height - 64) + 32,
      country,
      health: npcPartial.health || 100,
      maxHealth: npcPartial.maxHealth || 100,
      points: npcPartial.points || 1,
      lastAttackTime: 0,
      lastDefendTime: 0,
      isDefending: false,
      isAttacking: false,
      isDead: false,
      isNPC: true,
      aiType
    };
    
    // Create AI state
    const aiState = createAIState(aiType as AIBehaviorType);
    aiStatesRef.current.set(id, aiState);
    
    // Store NPC data
    npcDataRef.current.set(id, {
      id,
      aiType,
      spawnPosition: new THREE.Vector3(npc.x, 0, npc.y),
      behaviorState: {}
    });
    
    // Add to state
    setNPCs(prev => [...prev, npc]);
    
    return npc;
  };
  
  /**
   * Remove an NPC from the game
   */
  const removeNPC = (id: string) => {
    setNPCs(prev => prev.filter(npc => npc.id !== id));
    aiStatesRef.current.delete(id);
    npcDataRef.current.delete(id);
  };
  
  /**
   * Update all NPCs based on AI behavior
   */
  const updateNPCs = (players: OnlinePlayer[], deltaTime: number) => {
    if (npcs.length === 0) return;
    
    // Combine players and NPCs for AI decisions
    const allPlayers = [...players, ...npcs];
    
    // Update each NPC
    const updatedNPCs = npcs.map(npc => {
      // Skip if not an NPC or is dead
      if (!npc.isNPC || npc.isDead) return npc;
      
      // Get AI state
      const aiState = aiStatesRef.current.get(npc.id);
      if (!aiState) return npc;
      
      // Get spawn position
      const npcData = npcDataRef.current.get(npc.id);
      if (!npcData) return npc;
      
      // Update NPC based on AI behavior
      const { updatedNPC, updatedAIState, updatedTarget } = updateNPC(
        npc,
        aiState,
        allPlayers,
        npcData.spawnPosition,
        deltaTime
      );
      
      // Update AI state
      aiStatesRef.current.set(npc.id, updatedAIState);
      
      // Notify about player damage if needed
      if (updatedTarget && onPlayerDamage && !updatedTarget.isNPC) {
        const damage = updatedTarget.health - (players.find(p => p.id === updatedTarget.id)?.health || 0);
        if (damage > 0) {
          onPlayerDamage(updatedTarget.id, damage);
        }
      }
      
      // Notify about NPC update
      if (onNPCUpdate) {
        onNPCUpdate(updatedNPC);
      }
      
      return updatedNPC;
    });
    
    // Update state
    setNPCs(updatedNPCs);
  };
  
  return {
    npcs,
    npcData: npcDataRef.current,
    addNPC,
    removeNPC,
    updateNPCs
  };
} 