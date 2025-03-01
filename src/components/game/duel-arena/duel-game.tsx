"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Shield, Swords } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createCharacterModel } from "@/utils/character-models";
import { World3D } from "@/components/world/world-3d";

interface Character {
  id: string;
  name?: string;
  country: string;
  spriteData?: string;
}

interface DuelGameProps {
  playerCharacter: Character;
  opponentCharacter: Character;
  stakeAmount: number;
  onComplete: (isWinner: boolean) => void;
}

// Game constants
const MAX_HEALTH = 100;
const ATTACK_COOLDOWN = 1000; // 1 second
const DEFENSE_COOLDOWN = 1500; // 1.5 seconds
const DUEL_DURATION = 60; // 60 seconds

// Weapon damage values
const WEAPON_DAMAGE = {
  usa: { min: 8, max: 12 }, // Gunslinger - balanced
  japan: { min: 10, max: 15 }, // Samurai - high damage
  uk: { min: 5, max: 10 }, // Knight - low damage but better defense
  russia: { min: 12, max: 18 }, // Brawler - highest damage but slow
  brazil: { min: 6, max: 14 }, // Capoeira - variable damage
};

// Defense values
const DEFENSE_VALUES: Record<string, number> = {
  usa: 0.2, // 20% damage reduction
  japan: 0.15, // 15% damage reduction
  uk: 0.3, // 30% damage reduction
  russia: 0.1, // 10% damage reduction
  brazil: 0.25, // 25% damage reduction
};

export function DuelGame({ playerCharacter, opponentCharacter, stakeAmount, onComplete }: DuelGameProps) {
  const [playerHealth, setPlayerHealth] = useState(MAX_HEALTH);
  const [opponentHealth, setOpponentHealth] = useState(MAX_HEALTH);
  const [isAttackCooldown, setIsAttackCooldown] = useState(false);
  const [isDefenseCooldown, setIsDefenseCooldown] = useState(false);
  const [isDefending, setIsDefending] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DUEL_DURATION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<"player" | "opponent" | null>(null);
  const [worldLoaded, setWorldLoaded] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const opponentAttackRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Three.js references
  const worldSceneRef = useRef<THREE.Scene | null>(null);
  const worldCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerModelRef = useRef<THREE.Group | null>(null);
  const opponentModelRef = useRef<THREE.Group | null>(null);
  const playerAnimationRef = useRef<{
    mixer: THREE.AnimationMixer;
    actions: {
      idle?: THREE.AnimationAction;
      walk?: THREE.AnimationAction;
      attack?: THREE.AnimationAction;
    };
    currentAction?: string;
  } | null>(null);
  const opponentAnimationRef = useRef<{
    mixer: THREE.AnimationMixer;
    actions: {
      idle?: THREE.AnimationAction;
      walk?: THREE.AnimationAction;
      attack?: THREE.AnimationAction;
    };
    currentAction?: string;
  } | null>(null);
  
  // Start the duel
  useEffect(() => {
    if (!worldLoaded) return;
    
    console.log("World loaded, starting duel countdown");
    
    const countdown = setTimeout(() => {
      setGameStarted(true);
      
      // Start the timer
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - determine winner based on health
            clearInterval(timerRef.current!);
            handleGameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Start opponent AI
      scheduleOpponentAttack();
    }, 3000); // 3 second countdown
    
    return () => {
      clearTimeout(countdown);
      if (timerRef.current) clearInterval(timerRef.current);
      if (opponentAttackRef.current) clearTimeout(opponentAttackRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [worldLoaded]);
  
  // Check for game over conditions
  useEffect(() => {
    if (gameStarted && !gameOver) {
      if (playerHealth <= 0 || opponentHealth <= 0) {
        handleGameOver();
      }
    }
  }, [playerHealth, opponentHealth, gameStarted, gameOver]);
  
  // Animation update loop
  useEffect(() => {
    if (!worldLoaded) return;
    
    const updateAnimations = () => {
      // Update animations
      if (playerAnimationRef.current?.mixer) {
        playerAnimationRef.current.mixer.update(0.016);
      }
      
      if (opponentAnimationRef.current?.mixer) {
        opponentAnimationRef.current.mixer.update(0.016);
      }
      
      animationFrameRef.current = requestAnimationFrame(updateAnimations);
    };
    
    updateAnimations();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up animations
      if (playerAnimationRef.current?.mixer) {
        playerAnimationRef.current.mixer.stopAllAction();
      }
      
      if (opponentAnimationRef.current?.mixer) {
        opponentAnimationRef.current.mixer.stopAllAction();
      }
    };
  }, [worldLoaded]);
  
  const handleGameOver = () => {
    setGameOver(true);
    
    // Clear all timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (opponentAttackRef.current) clearTimeout(opponentAttackRef.current);
    
    // Determine winner
    let gameWinner: "player" | "opponent" | null = null;
    
    if (playerHealth <= 0) {
      gameWinner = "opponent";
    } else if (opponentHealth <= 0) {
      gameWinner = "player";
    } else {
      // Time's up - compare health
      gameWinner = playerHealth > opponentHealth ? "player" : "opponent";
      
      // In case of a tie, player wins (slight advantage)
      if (playerHealth === opponentHealth) {
        gameWinner = "player";
      }
    }
    
    setWinner(gameWinner);
    
    // Play victory/defeat animation
    if (gameWinner === "player" && playerAnimationRef.current?.actions.idle) {
      // Play victory animation (using idle for now)
      const currentAction = playerAnimationRef.current.actions.idle;
      currentAction.play();
    }
    
    // Delay to show the final state before completing
    setTimeout(() => {
      onComplete(gameWinner === "player");
    }, 3000);
  };
  
  const scheduleOpponentAttack = () => {
    // Random delay between 2-4 seconds
    const delay = 2000 + Math.random() * 2000;
    
    opponentAttackRef.current = setTimeout(() => {
      if (!gameOver) {
        // Opponent attacks
        const damage = calculateDamage(opponentCharacter.country);
        const defenseValue = DEFENSE_VALUES[playerCharacter.country] || 0.2;
        const actualDamage = isDefending 
          ? Math.floor(damage * (1 - defenseValue))
          : damage;
        
        setPlayerHealth(prev => Math.max(0, prev - actualDamage));
        
        // Show attack message
        toast.info(`${opponentCharacter.name || 'Opponent'} attacks for ${actualDamage} damage!`);
        
        // Play attack animation
        if (opponentAnimationRef.current?.actions.attack) {
          const currentAction = opponentAnimationRef.current.currentAction;
          const attackAction = opponentAnimationRef.current.actions.attack;
          
          if (currentAction && opponentAnimationRef.current.actions[currentAction as keyof typeof opponentAnimationRef.current.actions]) {
            const prevAction = opponentAnimationRef.current.actions[currentAction as keyof typeof opponentAnimationRef.current.actions];
            if (prevAction) {
              prevAction.fadeOut(0.2);
            }
          }
          
          attackAction.reset().fadeIn(0.2).play();
          opponentAnimationRef.current.currentAction = 'attack';
          
          // Return to idle after attack
          setTimeout(() => {
            if (opponentAnimationRef.current?.actions.idle && !gameOver) {
              attackAction.fadeOut(0.2);
              opponentAnimationRef.current.actions.idle.reset().fadeIn(0.2).play();
              opponentAnimationRef.current.currentAction = 'idle';
            }
          }, 1000);
        }
        
        // Schedule next attack if game not over
        scheduleOpponentAttack();
      }
    }, delay);
  };
  
  const handleAttack = () => {
    if (isAttackCooldown || gameOver) return;
    
    // Player attacks
    const damage = calculateDamage(playerCharacter.country);
    setOpponentHealth(prev => Math.max(0, prev - damage));
    
    // Show attack message
    toast.info(`You attack for ${damage} damage!`);
    
    // Play attack animation
    if (playerAnimationRef.current?.actions.attack) {
      const currentAction = playerAnimationRef.current.currentAction;
      const attackAction = playerAnimationRef.current.actions.attack;
      
      if (currentAction && playerAnimationRef.current.actions[currentAction as keyof typeof playerAnimationRef.current.actions]) {
        const prevAction = playerAnimationRef.current.actions[currentAction as keyof typeof playerAnimationRef.current.actions];
        if (prevAction) {
          prevAction.fadeOut(0.2);
        }
      }
      
      attackAction.reset().fadeIn(0.2).play();
      playerAnimationRef.current.currentAction = 'attack';
      
      // Return to idle after attack
      setTimeout(() => {
        if (playerAnimationRef.current?.actions.idle && !gameOver) {
          attackAction.fadeOut(0.2);
          playerAnimationRef.current.actions.idle.reset().fadeIn(0.2).play();
          playerAnimationRef.current.currentAction = 'idle';
        }
      }, 1000);
    }
    
    // Start cooldown
    setIsAttackCooldown(true);
    setTimeout(() => {
      setIsAttackCooldown(false);
    }, ATTACK_COOLDOWN);
  };
  
  const handleDefend = () => {
    if (isDefenseCooldown || gameOver) return;
    
    // Player defends
    setIsDefending(true);
    toast.info("You raise your defenses!");
    
    // Add shield effect to player model
    if (playerModelRef.current && worldSceneRef.current) {
      const shieldGeometry = new THREE.SphereGeometry(1.5, 16, 16);
      const shieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
      shield.position.copy(playerModelRef.current.position);
      shield.name = 'defense-shield';
      worldSceneRef.current.add(shield);
      
      // Remove shield after defense duration
      setTimeout(() => {
        if (worldSceneRef.current) {
          const shield = worldSceneRef.current.getObjectByName('defense-shield');
          if (shield) {
            worldSceneRef.current.remove(shield);
          }
        }
      }, 2000);
    }
    
    // Defense lasts for 2 seconds
    setTimeout(() => {
      setIsDefending(false);
    }, 2000);
    
    // Start cooldown
    setIsDefenseCooldown(true);
    setTimeout(() => {
      setIsDefenseCooldown(false);
    }, DEFENSE_COOLDOWN);
  };
  
  const calculateDamage = (country: string) => {
    const damageRange = WEAPON_DAMAGE[country as keyof typeof WEAPON_DAMAGE] || WEAPON_DAMAGE.usa;
    return Math.floor(damageRange.min + Math.random() * (damageRange.max - damageRange.min));
  };
  
  const loadPlayerModel = () => {
    if (!worldSceneRef.current) return;
    
    console.log('Loading player model for country:', playerCharacter.country);
    
    // Remove existing model if any
    if (playerModelRef.current) {
      worldSceneRef.current.remove(playerModelRef.current);
      playerModelRef.current = null;
    }
    
    try {
      // Create character model
      const characterModel = createCharacterModel(playerCharacter.country);
      const model = characterModel.scene;
      
      // Position the model - move further left and ensure it's visible
      model.position.set(-3, 0, 0);
      model.rotation.y = Math.PI / 4; // Rotate to face opponent
      model.scale.set(3, 3, 3); // Scale up the model to make it more visible
      
      // Debug visualization - add a sphere to mark the position
      const debugSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      debugSphere.position.copy(model.position);
      debugSphere.name = 'playerPositionMarker';
      if (worldSceneRef.current) {
        worldSceneRef.current.add(debugSphere);
      }
      
      console.log('Player model position:', model.position);
      
      // Make sure model casts shadows and materials are properly configured
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          
          // Ensure materials have proper rendering settings
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.needsUpdate = true;
                  mat.roughness = 0.5; // Reduced roughness for better light reflection
                  mat.metalness = 0.5; // Increased metalness for better visibility
                  
                  // Increase emissive properties to make the model more visible
                  if (mat.color) {
                    mat.emissive = mat.color.clone().multiplyScalar(0.3);
                    mat.emissiveIntensity = 0.5;
                  }
                }
              });
            } else if (object.material instanceof THREE.MeshStandardMaterial) {
              object.material.needsUpdate = true;
              object.material.roughness = 0.5;
              object.material.metalness = 0.5;
              
              // Increase emissive properties to make the model more visible
              if (object.material.color) {
                object.material.emissive = object.material.color.clone().multiplyScalar(0.3);
                object.material.emissiveIntensity = 0.5;
              }
            }
          }
        }
      });
      
      // Add multiple lights to illuminate the player character from different angles
      // Main character light
      const characterLight = new THREE.PointLight(0xffffff, 2, 10);
      characterLight.position.set(-3, 3, 0); // Position above the character
      characterLight.castShadow = true;
      characterLight.shadow.bias = -0.001;
      characterLight.name = 'playerMainLight';
      worldSceneRef.current.add(characterLight);
      
      // Front fill light
      const frontLight = new THREE.PointLight(0xffffcc, 1, 8);
      frontLight.position.set(-2, 2, 2); // In front of character
      frontLight.name = 'playerFrontLight';
      worldSceneRef.current.add(frontLight);
      
      // Back rim light
      const rimLight = new THREE.PointLight(0xccccff, 1, 8);
      rimLight.position.set(-4, 2, -2); // Behind character
      rimLight.name = 'playerRimLight';
      worldSceneRef.current.add(rimLight);
      
      // Add to scene
      worldSceneRef.current.add(model);
      playerModelRef.current = model;
      
      console.log('Player model loaded successfully');
      
      // Setup animations
      if (characterModel.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const actions: {
          idle?: THREE.AnimationAction;
          walk?: THREE.AnimationAction;
          attack?: THREE.AnimationAction;
        } = {};
        
        characterModel.animations.forEach(clip => {
          const action = mixer.clipAction(clip);
          actions[clip.name as keyof typeof actions] = action;
        });
        
        playerAnimationRef.current = {
          mixer,
          actions,
          currentAction: 'idle'
        };
        
        // Play idle animation by default
        if (actions.idle) {
          actions.idle.play();
        }
      }
    } catch (error) {
      console.error('Error loading player model:', error);
      
      // Create a fallback model if there's an error
      const geometry = new THREE.BoxGeometry(1, 2, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
      });
      const fallbackModel = new THREE.Mesh(geometry, material);
      fallbackModel.position.set(-3, 1, 0);
      fallbackModel.castShadow = true;
      
      const group = new THREE.Group();
      group.add(fallbackModel);
      worldSceneRef.current.add(group);
      playerModelRef.current = group;
    }
  };
  
  const loadOpponentModel = () => {
    if (!worldSceneRef.current) return;
    
    console.log('Loading opponent model for country:', opponentCharacter.country);
    
    // Remove existing model if any
    if (opponentModelRef.current) {
      worldSceneRef.current.remove(opponentModelRef.current);
      opponentModelRef.current = null;
    }
    
    try {
      // Create character model
      const characterModel = createCharacterModel(opponentCharacter.country);
      const model = characterModel.scene;
      
      // Position the model - move further right and ensure it's visible
      model.position.set(3, 0, 0);
      model.rotation.y = -Math.PI / 4; // Rotate to face player
      model.scale.set(3, 3, 3); // Scale up the model to make it more visible
      
      // Debug visualization - add a sphere to mark the position
      const debugSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x0000ff })
      );
      debugSphere.position.copy(model.position);
      debugSphere.name = 'opponentPositionMarker';
      if (worldSceneRef.current) {
        worldSceneRef.current.add(debugSphere);
      }
      
      console.log('Opponent model position:', model.position);
      
      // Make sure model casts shadows and materials are properly configured
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          
          // Ensure materials have proper rendering settings
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.needsUpdate = true;
                  mat.roughness = 0.5; // Reduced roughness for better light reflection
                  mat.metalness = 0.5; // Increased metalness for better visibility
                  
                  // Increase emissive properties to make the model more visible
                  if (mat.color) {
                    mat.emissive = mat.color.clone().multiplyScalar(0.3);
                    mat.emissiveIntensity = 0.5;
                  }
                }
              });
            } else if (object.material instanceof THREE.MeshStandardMaterial) {
              object.material.needsUpdate = true;
              object.material.roughness = 0.5;
              object.material.metalness = 0.5;
              
              // Increase emissive properties to make the model more visible
              if (object.material.color) {
                object.material.emissive = object.material.color.clone().multiplyScalar(0.3);
                object.material.emissiveIntensity = 0.5;
              }
            }
          }
        }
      });
      
      // Add multiple lights to illuminate the opponent character from different angles
      // Main character light
      const characterLight = new THREE.PointLight(0xffffff, 2, 10);
      characterLight.position.set(3, 3, 0); // Position above the character
      characterLight.castShadow = true;
      characterLight.shadow.bias = -0.001;
      characterLight.name = 'opponentMainLight';
      worldSceneRef.current.add(characterLight);
      
      // Front fill light
      const frontLight = new THREE.PointLight(0xffffcc, 1, 8);
      frontLight.position.set(2, 2, 2); // In front of character
      frontLight.name = 'opponentFrontLight';
      worldSceneRef.current.add(frontLight);
      
      // Back rim light
      const rimLight = new THREE.PointLight(0xccccff, 1, 8);
      rimLight.position.set(4, 2, -2); // Behind character
      rimLight.name = 'opponentRimLight';
      worldSceneRef.current.add(rimLight);
      
      // Add to scene
      worldSceneRef.current.add(model);
      opponentModelRef.current = model;
      
      console.log('Opponent model loaded successfully');
      
      // Setup animations
      if (characterModel.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const actions: {
          idle?: THREE.AnimationAction;
          walk?: THREE.AnimationAction;
          attack?: THREE.AnimationAction;
        } = {};
        
        characterModel.animations.forEach(clip => {
          const action = mixer.clipAction(clip);
          actions[clip.name as keyof typeof actions] = action;
        });
        
        opponentAnimationRef.current = {
          mixer,
          actions,
          currentAction: 'idle'
        };
        
        // Play idle animation by default
        if (actions.idle) {
          actions.idle.play();
        }
      }
    } catch (error) {
      console.error('Error loading opponent model:', error);
      
      // Create a fallback model if there's an error
      const geometry = new THREE.BoxGeometry(1, 2, 1);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x0000ff,
        emissive: 0x0000ff,
        emissiveIntensity: 0.5
      });
      const fallbackModel = new THREE.Mesh(geometry, material);
      fallbackModel.position.set(3, 1, 0);
      fallbackModel.castShadow = true;
      
      const group = new THREE.Group();
      group.add(fallbackModel);
      worldSceneRef.current.add(group);
      opponentModelRef.current = group;
    }
  };

  // Function to toggle debug mode
  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
    
    if (worldSceneRef.current) {
      // Toggle visibility of debug helpers
      const gridHelper = worldSceneRef.current.getObjectByName('gridHelper');
      if (gridHelper) gridHelper.visible = !debugMode;
      
      const axesHelper = worldSceneRef.current.getObjectByName('axesHelper');
      if (axesHelper) axesHelper.visible = !debugMode;
      
      // Toggle debug boxes on character models
      if (playerModelRef.current) {
        const debugBox = playerModelRef.current.getObjectByName('debugBox');
        if (debugBox) debugBox.visible = !debugMode;
      }
      
      if (opponentModelRef.current) {
        const debugBox = opponentModelRef.current.getObjectByName('debugBox');
        if (debugBox) debugBox.visible = !debugMode;
      }
      
      // Add wireframe to all meshes when debug mode is on
      worldSceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.wireframe = !debugMode;
                }
              });
            } else if (object.material instanceof THREE.MeshStandardMaterial) {
              object.material.wireframe = !debugMode;
            }
          }
        }
      });
      
      // Add a debug sphere at the origin to help with positioning
      if (!debugMode) {
        const originSphere = worldSceneRef.current.getObjectByName('originSphere');
        if (!originSphere) {
          const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff00ff })
          );
          sphere.name = 'originSphere';
          sphere.position.set(0, 0, 0);
          worldSceneRef.current.add(sphere);
        } else {
          originSphere.visible = true;
        }
      } else {
        const originSphere = worldSceneRef.current.getObjectByName('originSphere');
        if (originSphere) {
          originSphere.visible = false;
        }
      }
    }
  };

  // Function to handle when the World3D component is loaded
  const handleWorldLoaded = () => {
    console.log("World3D environment loaded");
    
    // Prevent multiple initializations
    if (worldLoaded) {
      console.log("World already loaded, skipping initialization");
      return;
    }
    
    // Add a small delay to ensure the DOM is fully updated
    setTimeout(() => {
      // Get access to the World3D scene and camera
      if (containerRef.current) {
        // Find the scene and camera from the World3D component
        const worldElement = containerRef.current.querySelector('.world-3d-container');
        if (worldElement) {
          // The scene and camera are stored in the userData of the renderer's domElement
          const canvas = worldElement.querySelector('canvas');
          if (canvas && (canvas as any).__three) {
            const threeData = (canvas as any).__three;
            worldSceneRef.current = threeData.scene;
            worldCameraRef.current = threeData.camera;
            
            console.log("Got access to World3D scene and camera");
            
            // Add global ambient light to ensure everything is visible
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            ambientLight.name = 'globalAmbient';
            if (worldSceneRef.current) {
              worldSceneRef.current.add(ambientLight);
            }
            
            // Add a hemisphere light for better outdoor lighting
            const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
            hemiLight.position.set(0, 20, 0);
            hemiLight.name = 'hemisphereLight';
            if (worldSceneRef.current) {
              worldSceneRef.current.add(hemiLight);
            }
            
            // Add a debug grid to help visualize the scene
            const gridHelper = new THREE.GridHelper(10, 10);
            gridHelper.name = 'gridHelper';
            gridHelper.visible = debugMode;
            if (worldSceneRef.current) {
              worldSceneRef.current.add(gridHelper);
            }
            
            // Add axes helper to visualize coordinate system
            const axesHelper = new THREE.AxesHelper(5);
            axesHelper.name = 'axesHelper';
            axesHelper.visible = debugMode;
            if (worldSceneRef.current) {
              worldSceneRef.current.add(axesHelper);
            }
            
            // Now we can load our models into the scene
            loadPlayerModel();
            loadOpponentModel();
            
            // Set world loaded state
            setWorldLoaded(true);
          } else {
            console.error("Could not find Three.js data in the canvas");
          }
        } else {
          console.error("Could not find World3D element");
        }
      }
    }, 100); // 100ms delay
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-3xl mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <Badge className="mr-2">{playerCharacter.country.toUpperCase()}</Badge>
            <span className="font-bold">You</span>
          </div>
          <div className="text-center">
            <Badge variant="outline" className="mb-1">
              Stake: {stakeAmount} points
            </Badge>
            <div className="text-2xl font-bold">
              {gameStarted ? timeRemaining : "Ready"}
            </div>
          </div>
          <div className="flex items-center">
            <span className="font-bold">{opponentCharacter.name || "Opponent"}</span>
            <Badge className="ml-2">{opponentCharacter.country.toUpperCase()}</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Your Health</span>
              <span className="text-sm">{playerHealth}/{MAX_HEALTH}</span>
            </div>
            <Progress value={(playerHealth / MAX_HEALTH) * 100} className="h-4" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Opponent Health</span>
              <span className="text-sm">{opponentHealth}/{MAX_HEALTH}</span>
            </div>
            <Progress value={(opponentHealth / MAX_HEALTH) * 100} className="h-4" />
          </div>
        </div>
      </div>
      
      <div className="relative w-full max-w-3xl h-[400px] bg-muted rounded-lg overflow-hidden mb-6" ref={containerRef}>
        {!gameStarted ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-2">Preparing Duel</h2>
            <p>The duel will begin shortly...</p>
          </div>
        ) : gameOver ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <h2 className="text-4xl font-bold mb-4 text-white">
              {winner === "player" ? "Victory!" : "Defeat!"}
            </h2>
            <p className="text-xl text-white mb-2">
              {winner === "player" 
                ? `You won ${stakeAmount} points!` 
                : `You lost ${stakeAmount} points!`}
            </p>
          </div>
        ) : null}
        
        {/* Debug mode button */}
        <button 
          onClick={toggleDebugMode}
          className="absolute top-2 right-2 z-10 bg-black/50 text-white px-2 py-1 text-xs rounded"
        >
          {debugMode ? "Exit Debug" : "Debug Mode"}
        </button>
        
        {/* Use the World3D component */}
        <World3D 
          className="w-full h-full" 
          environmentPath="/models/environments/duel-arena.glb"
          onLoad={handleWorldLoaded}
        />
      </div>
      
      <div className="flex gap-4">
        <Button
          size="lg"
          onClick={handleAttack}
          disabled={!gameStarted || gameOver || isAttackCooldown}
          className="w-32"
        >
          {isAttackCooldown ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Swords className="h-4 w-4 mr-2" />
          )}
          Attack
        </Button>
        
        <Button
          size="lg"
          variant="outline"
          onClick={handleDefend}
          disabled={!gameStarted || gameOver || isDefenseCooldown}
          className="w-32"
        >
          {isDefenseCooldown ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          Defend
        </Button>
      </div>
    </div>
  );
} 