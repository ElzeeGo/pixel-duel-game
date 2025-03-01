"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import * as THREE from "three";

import { Button } from "@/components/ui/button";
import { GameCanvas } from "./game-canvas";
import { PlayersList } from "./players-list";
import { useCharacters } from "@/hooks/use-characters";
import { useNPCManager } from "@/hooks/use-npc-manager";
import { OnlinePlayer } from "@/types/game";
import { AIBehaviorType } from "@/utils/npc-ai-engine";

interface SceneInit {
  scene: THREE.Scene;
  camera: THREE.Camera;
}

export function OpenSpaceGame() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const { characters, isLoading: isLoadingCharacters } = useCharacters();
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [mapSize] = useState({ width: 800, height: 600 });
  
  // Use refs instead of state for scene and camera to avoid re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize NPC manager
  const { 
    npcs, 
    updateNPCs, 
    addNPC, 
    removeNPC 
  } = useNPCManager({
    mapSize,
    playerCount: 5,
    onNPCUpdate: (updatedNPC) => {
      // This will be called when an NPC is updated by the AI
      handlePlayerUpdate(updatedNPC);
    },
    onPlayerDamage: (playerId, damage) => {
      // This will be called when an NPC damages a player
      toast.info(`You took ${damage} damage from an NPC!`);
    }
  });

  // Add handlers for combat events
  const handlePlayerUpdate = useCallback((updatedPlayer: OnlinePlayer) => {
    setOnlinePlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.id === updatedPlayer.id) {
          // Update the player's health bar in the 3D scene
          const playerModel = sceneRef.current?.getObjectByName(`player-${player.id}`);
          if (playerModel?.userData.characterModel?.healthBar) {
            playerModel.userData.characterModel.healthBar.update(
              updatedPlayer.health,
              updatedPlayer.maxHealth
            );
          }
          return updatedPlayer;
        }
        return player;
      })
    );
  }, []);

  const handlePlayerDeath = useCallback((playerId: string) => {
    setOnlinePlayers(prevPlayers => 
      prevPlayers.map(player => {
        if (player.id === playerId) {
          // Remove the player model from the 3D scene
          const playerModel = sceneRef.current?.getObjectByName(`player-${player.id}`);
          if (playerModel) {
            sceneRef.current?.remove(playerModel);
          }
          
          return {
            ...player,
            isDead: true,
            health: 0,
            points: Math.max(0, player.points - 1),
            respawnTime: Date.now() + 5000 // 5 seconds respawn time
          };
        }
        return player;
      })
    );
  }, []);
  
  // Handle respawning of dead players
  useEffect(() => {
    const respawnInterval = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;
      
      setOnlinePlayers(prevPlayers => {
        const updatedPlayers = prevPlayers.map(player => {
          if (player.isDead && player.respawnTime && player.respawnTime <= now) {
            hasChanges = true;
            return {
              ...player,
              isDead: false,
              health: 100, // MAX_HEALTH
              x: Math.random() * (mapSize.width - 64) + 32, // Random position within canvas
              y: Math.random() * (mapSize.height - 64) + 32,
              respawnTime: undefined
            };
          }
          return player;
        });
        
        if (hasChanges) {
          toast.info("Some players have respawned!");
        }
        
        return hasChanges ? updatedPlayers : prevPlayers; // Only update if there are changes
      });
    }, 5000); // Check every 5 seconds instead of every second
    
    return () => clearInterval(respawnInterval);
  }, [mapSize]);

  // Set up game loop for NPC updates
  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateTime) / 1000; // Convert to seconds
      
      // Update NPCs
      updateNPCs(onlinePlayers, deltaTime);
      
      // Update last update time
      setLastUpdateTime(now);
      
      // Schedule next update
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onlinePlayers, updateNPCs, lastUpdateTime]);

  // Simulate fetching online players
  useEffect(() => {
    const fetchOnlinePlayers = async () => {
      try {
        // In a real implementation, this would be a WebSocket connection
        // or a polling mechanism to get real-time player data
        const mockPlayers: OnlinePlayer[] = [
          { 
            id: "1", 
            name: "Player1", 
            x: 100, 
            y: 150, 
            country: "usa",
            health: 100,
            maxHealth: 100,
            points: 1,
            lastAttackTime: 0,
            lastDefendTime: 0,
            isDefending: false,
            isAttacking: false,
            isDead: false
          },
          { 
            id: "2", 
            name: "Player2", 
            x: 200, 
            y: 250, 
            country: "japan",
            health: 100,
            maxHealth: 100,
            points: 1,
            lastAttackTime: 0,
            lastDefendTime: 0,
            isDefending: false,
            isAttacking: false,
            isDead: false
          },
          { 
            id: "3", 
            name: "Player3", 
            x: 300, 
            y: 100, 
            country: "uk",
            health: 100,
            maxHealth: 100,
            points: 1,
            lastAttackTime: 0,
            lastDefendTime: 0,
            isDefending: false,
            isAttacking: false,
            isDead: false
          },
          { 
            id: "4", 
            name: "Player4", 
            x: 400, 
            y: 200, 
            country: "russia",
            health: 100,
            maxHealth: 100,
            points: 1,
            lastAttackTime: 0,
            lastDefendTime: 0,
            isDefending: false,
            isAttacking: false,
            isDead: false
          },
          { 
            id: "5", 
            name: "Player5", 
            x: 500, 
            y: 300, 
            country: "brazil",
            health: 100,
            maxHealth: 100,
            points: 1,
            lastAttackTime: 0,
            lastDefendTime: 0,
            isDefending: false,
            isAttacking: false,
            isDead: false
          },
        ];
        
        setOnlinePlayers(mockPlayers);
      } catch (error) {
        console.error("Error fetching online players:", error);
        toast.error("Failed to connect to game server");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchOnlinePlayers();
    }
  }, [session]);

  // Select the first character by default if available
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(characters[0].id);
    }
  }, [characters, selectedCharacterId]);

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterId(characterId);
  };

  const selectedCharacter = characters.find(char => char.id === selectedCharacterId);

  // Handle scene initialization - memoize to prevent recreating on every render
  const handleSceneInit = useCallback(({ scene, camera }: SceneInit) => {
    // Store references without triggering re-renders
    sceneRef.current = scene;
    cameraRef.current = camera;
  }, []);

  // Combine online players and NPCs for rendering
  const allPlayers = [...onlinePlayers, ...npcs];

  if (isLoading || isLoadingCharacters) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading game world...</span>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">No Characters Available</h2>
        <p className="text-muted-foreground mb-4">
          You need to create a character before entering the Open Space.
        </p>
        <Button asChild>
          <a href="/game/character/create">Create Character</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="relative bg-muted rounded-lg overflow-hidden">
          <GameCanvas 
            selectedCharacter={selectedCharacter}
            onlinePlayers={allPlayers}
            use3D={true}
            onPlayerUpdate={handlePlayerUpdate}
            onPlayerDeath={handlePlayerDeath}
            onSceneInit={handleSceneInit}
          />
          
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
            <p>Use <kbd className="px-1 py-0.5 bg-muted rounded">W</kbd> <kbd className="px-1 py-0.5 bg-muted rounded">A</kbd> <kbd className="px-1 py-0.5 bg-muted rounded">S</kbd> <kbd className="px-1 py-0.5 bg-muted rounded">D</kbd> or arrow keys to move</p>
            <p>Click on other players to interact</p>
            <p>Use mouse to rotate camera, scroll to zoom</p>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-1">
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Your Character</h2>
            {characters.length > 1 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Select a character:</p>
                <div className="flex flex-wrap gap-2">
                  {characters.map((character) => {
                    return (
                      <Button
                        key={character.id}
                        size="sm"
                        variant={selectedCharacterId === character.id ? "default" : "outline"}
                        onClick={() => handleCharacterSelect(character.id)}
                      >
                        {getClassName(character.country)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <p>
                  <span className="font-medium">Class:</span>{" "}
                  {selectedCharacter ? getClassName(selectedCharacter.country) : "Unknown"}
                </p>
                <p>
                  <span className="font-medium">Country:</span>{" "}
                  {selectedCharacter ? selectedCharacter.country.toUpperCase() : "Unknown"}
                </p>
              </div>
            )}
          </div>
          
          <PlayersList onlinePlayers={allPlayers} />
        </div>
      </div>
    </div>
  );
}

// Helper function to get class name from country
function getClassName(country: string) {
  const countryMap: Record<string, string> = {
    usa: "Gunslinger",
    japan: "Samurai",
    uk: "Knight",
    russia: "Brawler",
    brazil: "Capoeira Fighter",
  };
  
  return countryMap[country] || "Unknown";
} 