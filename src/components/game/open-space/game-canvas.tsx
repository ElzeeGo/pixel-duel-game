"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { renderCharacter, getPlayerColor } from "@/utils/character-renderer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { createFallbackCharacter } from "@/utils/fallback-model-generator";
import { createCharacterModel } from "@/utils/character-models";

interface Character {
  id: string;
  spriteData: string;
  country: string;
  createdAt: string;
}

interface OnlinePlayer {
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
  isNPC?: boolean;
  aiType?: string;
}

interface GameCanvasProps {
  selectedCharacter: Character | undefined;
  onlinePlayers: OnlinePlayer[];
  use3D?: boolean;
  onPlayerUpdate: (updatedPlayer: OnlinePlayer) => void;
  onPlayerDeath: (playerId: string) => void;
  onSceneInit?: (params: { scene: THREE.Scene; camera: THREE.Camera }) => void;
}

interface PlayerPosition {
  x: number;
  y: number;
}

// Animation state interfaces
interface AnimationState {
  mixer: THREE.AnimationMixer;
  actions: {
    idle?: THREE.AnimationAction;
    walk?: THREE.AnimationAction;
    attack?: THREE.AnimationAction;
  };
  currentAction?: string;
}

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 32;
const MOVEMENT_SPEED = 3;

// 3D constants
const WORLD_SCALE = 10;
const PLAYER_3D_SCALE = 0.5;

// Combat constants
const MAX_HEALTH = 100;
const ATTACK_COOLDOWN = 1000; // 1 second
const DEFENSE_COOLDOWN = 1500; // 1.5 seconds
const ATTACK_RANGE = 1.5; // Range for attacks in 3D mode
const ATTACK_RANGE_2D = PLAYER_SIZE * 2; // Range for attacks in 2D mode
const RESPAWN_TIME = 5000; // 5 seconds

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

// Helper function to get class name from country
const getClassName = (country: string) => {
  const countryMap: Record<string, string> = {
    usa: "Gunslinger",
    japan: "Samurai",
    uk: "Knight",
    russia: "Brawler",
    brazil: "Capoeira Fighter",
  };
  
  return countryMap[country] || "Unknown";
};

export function GameCanvas({ selectedCharacter, onlinePlayers, use3D = false, onPlayerUpdate, onPlayerDeath, onSceneInit }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const playerModelRef = useRef<THREE.Group | null>(null);
  const otherPlayerModelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const animationFrameRef = useRef<number | null>(null);
  const playerAnimationRef = useRef<AnimationState | null>(null);
  const otherPlayerAnimationsRef = useRef<Map<string, AnimationState>>(new Map());
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const groundRef = useRef<THREE.Mesh | null>(null);
  
  // Game state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({ x: 400, y: 300 });
  
  // Game state refs for performance
  const keysRef = useRef<Set<string>>(new Set());
  const playerPositionRef = useRef<PlayerPosition>({ x: 400, y: 300 });
  const lastUpdateTimeRef = useRef<number>(0);
  const debugInfoRef = useRef<HTMLDivElement | null>(null);
  
  // Combat state refs
  const [playerHealth, setPlayerHealth] = useState<number>(MAX_HEALTH);
  const [playerPoints, setPlayerPoints] = useState<number>(1);
  const [playerIsDead, setPlayerIsDead] = useState<boolean>(false);
  const [respawnCountdown, setRespawnCountdown] = useState<number>(0);
  const lastAttackTimeRef = useRef<number>(0);
  const lastDefendTimeRef = useRef<number>(0);
  const isDefendingRef = useRef<boolean>(false);
  const isAttackingRef = useRef<number>(0);
  
  // Combat UI refs
  const [targetPlayer, setTargetPlayer] = useState<OnlinePlayer | null>(null);
  const [inRange, setInRange] = useState<boolean>(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  
  // Set initial player position to a random location
  useEffect(() => {
    const newPosition = {
      x: Math.random() * (CANVAS_WIDTH - PLAYER_SIZE * 2) + PLAYER_SIZE,
      y: Math.random() * (CANVAS_HEIGHT - PLAYER_SIZE * 2) + PLAYER_SIZE
    };
    playerPositionRef.current = newPosition;
    setPlayerPosition(newPosition);
  }, []);
  
  // Initialize game immediately
  useEffect(() => {
    setIsInitialized(true);
  }, []);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Toggle debug info with F3 key
      if (key === 'f3') {
        setShowDebugInfo(prev => !prev);
        return;
      }
      
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        setKeysPressed(prev => {
          const newSet = new Set(prev);
          newSet.add(key);
          return newSet;
        });
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
        setKeysPressed(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Function to update debug info
  const updateDebugInfo = () => {
    if (!showDebugInfo) return;
    
    let info = "";
    
    // Add scene info
    if (sceneRef.current) {
      const objectCount = sceneRef.current.children.length;
      info += `Scene Objects: ${objectCount}\n`;
    }
    
    // Add player model info
    if (playerModelRef.current) {
      info += `Player Model: ${playerModelRef.current.uuid}\n`;
      info += `Position: (${playerModelRef.current.position.x.toFixed(2)}, ${playerModelRef.current.position.y.toFixed(2)}, ${playerModelRef.current.position.z.toFixed(2)})\n`;
      
      // Count meshes in the model
      let meshCount = 0;
      playerModelRef.current.traverse(child => {
        if (child instanceof THREE.Mesh) meshCount++;
      });
      
      info += `Meshes: ${meshCount}\n`;
    } else {
      info += "Player Model: Not loaded\n";
    }
    
    // Add other players info
    info += `Other Players: ${otherPlayerModelsRef.current.size}\n`;
    
    setDebugInfo(info);
  };
  
  // Setup 3D scene if use3D is true
  useEffect(() => {
    if (!isInitialized || !use3D || !containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x1e293b); // Match Tailwind slate-800
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    controlsRef.current = controls;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);
    
    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
    
    // Add hemisphere light for better ambient lighting
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    scene.add(hemisphereLight);
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(WORLD_SCALE, WORLD_SCALE, 32, 32);
    
    // Create grid texture
    const gridSize = 512;
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = gridSize;
    gridCanvas.height = gridSize;
    const gridContext = gridCanvas.getContext('2d');
    
    if (gridContext) {
      gridContext.fillStyle = '#1e293b';
      gridContext.fillRect(0, 0, gridSize, gridSize);
      
      gridContext.strokeStyle = '#2a2a2a';
      gridContext.lineWidth = 1;
      
      const cellSize = gridSize / 10;
      
      // Draw vertical grid lines
      for (let x = 0; x <= gridSize; x += cellSize) {
        gridContext.beginPath();
        gridContext.moveTo(x, 0);
        gridContext.lineTo(x, gridSize);
        gridContext.stroke();
      }
      
      // Draw horizontal grid lines
      for (let y = 0; y <= gridSize; y += cellSize) {
        gridContext.beginPath();
        gridContext.moveTo(0, y);
        gridContext.lineTo(gridSize, y);
        gridContext.stroke();
      }
    }
    
    const gridTexture = new THREE.CanvasTexture(gridCanvas);
    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(4, 4);
    
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.8,
      metalness: 0.2,
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Load player model if character is selected
    if (selectedCharacter) {
      const characterCountry = selectedCharacter.country || 'usa';
      
      // Get the character model from the global cache
      const characterModel = createCharacterModel(characterCountry, {
        health: 100, // Default health value
        maxHealth: 100 // Default maxHealth value
      });
      const model = characterModel.scene.clone(); // Clone the model to avoid modifying the cached one
      
      // Store the character model reference in userData for later access
      model.userData.characterModel = characterModel;
      
      // Position the model
      model.position.set(0, 0, 0);
      model.rotation.y = Math.PI;
      model.castShadow = true;
      model.receiveShadow = true;
      
      scene.add(model);
      playerModelRef.current = model;
      
      // Setup animations if available
      if (characterModel.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        const actions: AnimationState['actions'] = {};
        
        characterModel.animations.forEach((clip: THREE.AnimationClip) => {
          const action = mixer.clipAction(clip);
          
          switch(clip.name) {
            case 'idle':
              actions.idle = action;
              break;
            case 'walk':
              actions.walk = action;
              break;
            case 'attack':
              actions.attack = action;
              break;
          }
        });
        
        // Start with idle animation
        if (actions.idle) {
          actions.idle.play();
        }
        
        // Store animation state
        playerAnimationRef.current = {
          mixer,
          actions,
          currentAction: 'idle'
        };
      }
    }
    
    // Load other player models
    const loadedPlayerIds = new Set();
    onlinePlayers.forEach(player => {
      if (player.id !== selectedCharacter?.id) {
        // Skip if player is already loaded
        if (otherPlayerModelsRef.current.has(player.id)) {
          loadedPlayerIds.add(player.id);
          return;
        }
        
        // Get the character model from the global cache
        const characterModel = createCharacterModel(player.country, {
          health: player.health,
          maxHealth: player.maxHealth
        });
        const model = characterModel.scene.clone(); // Clone the model to avoid modifying the cached one
        
        // Store the character model reference in userData for later access
        model.userData.characterModel = characterModel;
        
        // Convert 2D coordinates to 3D world coordinates
        const worldX = (player.x / CANVAS_WIDTH - 0.5) * WORLD_SCALE;
        const worldZ = (player.y / CANVAS_HEIGHT - 0.5) * WORLD_SCALE;
        model.position.set(worldX, 0, worldZ);
        
        // Apply a slight rotation so the model faces forward
        model.rotation.y = Math.PI;
        
        model.castShadow = true;
        model.receiveShadow = true;
        
        // Add player name label
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        if (context) {
          context.fillStyle = '#00000000';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          context.font = 'bold 32px Arial';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillStyle = '#ffffff';
          context.fillText(player.name, canvas.width / 2, canvas.height / 2);
          
          const texture = new THREE.CanvasTexture(canvas);
          const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.position.set(0, 1.5, 0);
          sprite.scale.set(2, 0.5, 1);
          
          model.add(sprite);
        }
        
        // Set a name for the model to identify it later
        model.name = `player-${player.id}`;
        
        scene.add(model);
        otherPlayerModelsRef.current.set(player.id, model);
        loadedPlayerIds.add(player.id);
        
        // Setup animations if available
        if (characterModel.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(model);
          
          // Create animation actions
          const actions: AnimationState['actions'] = {};
          
          characterModel.animations.forEach((clip: THREE.AnimationClip) => {
            const action = mixer.clipAction(clip);
            
            switch(clip.name) {
              case 'idle':
                actions.idle = action;
                break;
              case 'walk':
                actions.walk = action;
                break;
              case 'attack':
                actions.attack = action;
                break;
            }
          });
          
          // Start with idle animation
          if (actions.idle) {
            actions.idle.play();
          }
          
          // Store animation state
          otherPlayerAnimationsRef.current.set(player.id, {
            mixer,
            actions,
            currentAction: 'idle'
          });
        }
      }
    });
    
    // Remove models for players that are no longer in the game
    otherPlayerModelsRef.current.forEach((model, playerId) => {
      if (!loadedPlayerIds.has(playerId)) {
        scene.remove(model);
        otherPlayerModelsRef.current.delete(playerId);
        otherPlayerAnimationsRef.current.delete(playerId);
      }
    });
    
    // Call onSceneInit callback with scene and camera
    if (onSceneInit) {
      onSceneInit({ scene, camera });
    }
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current!);
      }
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of Three.js resources
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      // Clear model references
      playerModelRef.current = null;
      otherPlayerModelsRef.current.clear();
    };
  }, [isInitialized, use3D, selectedCharacter?.id, selectedCharacter?.country]);
  
  // Game loop
  useEffect(() => {
    if (!isInitialized) return;
    
    if (use3D) {
      // 3D game loop
      const update3D = () => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const renderer = rendererRef.current;
        
        // Update player position
        if (playerModelRef.current && !playerIsDead) {
          playerModelRef.current.position.x = playerPositionRef.current.x / 100;
          playerModelRef.current.position.z = playerPositionRef.current.y / 100;
          
          // Update camera to follow player
          if (controlsRef.current) {
            const targetPosition = new THREE.Vector3(
              playerModelRef.current.position.x,
              1.5,
              playerModelRef.current.position.z
            );
            
            // Smoothly move camera target
            controlsRef.current.target.lerp(targetPosition, 0.1);
            controlsRef.current.update();
          }
        }
        
        // Update other players
        onlinePlayers.forEach(player => {
          // Skip current player
          if (selectedCharacter && player.id === selectedCharacter.id) return;
          
          // Get or create player model
          let playerModel = otherPlayerModelsRef.current.get(player.id);
          
          if (!playerModel && !player.isDead) {
            // Create new player model
            const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
            const material = new THREE.MeshStandardMaterial({ 
              color: getPlayerColor(player.country),
              roughness: 0.7,
              metalness: 0.3
            });
            
            playerModel = new THREE.Group();
            
            // If it's an NPC, add a special indicator
            if (player.isNPC) {
              // Add NPC indicator (floating text or icon)
              const npcIndicator = createTextSprite("NPC", { 
                fontsize: 24, 
                backgroundColor: { r: 50, g: 50, b: 50, a: 0.5 } 
              });
              npcIndicator.position.set(0, 1.5, 0);
              playerModel.add(npcIndicator);
              
              // Add behavior type indicator if available
              if (player.aiType) {
                const behaviorIndicator = createTextSprite(player.aiType, { 
                  fontsize: 18, 
                  backgroundColor: { r: 50, g: 50, b: 50, a: 0.5 } 
                });
                behaviorIndicator.position.set(0, 1.8, 0);
                playerModel.add(behaviorIndicator);
              }
            }
            
            // Create character model based on country
            const characterModel = createCharacterModel(player.country, {
              health: player.health,
              maxHealth: player.maxHealth
            });
            
            // Add character model to player model
            playerModel.add(characterModel.scene);
            
            // Store character model for later reference
            playerModel.userData.characterModel = characterModel;
            
            // Add name label
            const nameSprite = createTextSprite(player.name, { fontsize: 24 });
            nameSprite.position.set(0, 2, 0);
            playerModel.add(nameSprite);
            
            // Add to scene
            playerModel.position.set(player.x / 100, 0, player.y / 100);
            playerModel.name = `player-${player.id}`;
            scene.add(playerModel);
            
            // Store in ref
            otherPlayerModelsRef.current.set(player.id, playerModel);
            
            // Setup animations
            if (characterModel.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(characterModel.scene);
              const actions: Record<string, THREE.AnimationAction> = {};
              
              characterModel.animations.forEach(clip => {
                const action = mixer.clipAction(clip);
                actions[clip.name] = action;
                
                // Play idle animation by default
                if (clip.name === 'idle') {
                  action.play();
                }
              });
              
              otherPlayerAnimationsRef.current.set(player.id, {
                mixer,
                actions,
                currentAction: 'idle'
              });
            }
          } else if (playerModel && !player.isDead) {
            // Update existing player model
            playerModel.position.x = player.x / 100;
            playerModel.position.z = player.y / 100;
            
            // Update health bar if available
            if (playerModel.userData.characterModel?.healthBar) {
              playerModel.userData.characterModel.healthBar.update(
                player.health,
                player.maxHealth
              );
            }
            
            // Update animations based on player state
            const animation = otherPlayerAnimationsRef.current.get(player.id);
            if (animation) {
              if (player.isAttacking && animation.actions['attack'] && animation.currentAction !== 'attack') {
                // Play attack animation
                if (animation.currentAction && animation.actions[animation.currentAction as keyof typeof animation.actions]) {
                  animation.actions[animation.currentAction as keyof typeof animation.actions]?.fadeOut(0.2);
                }
                animation.actions['attack'].reset().fadeIn(0.2).play();
                animation.currentAction = 'attack';
                
                // Reset to idle after attack animation
                setTimeout(() => {
                  if (animation.actions['attack'] && animation.actions['idle']) {
                    animation.actions['attack'].fadeOut(0.2);
                    animation.actions['idle'].reset().fadeIn(0.2).play();
                    animation.currentAction = 'idle';
                  }
                }, 1000);
              } else if (player.isDefending && animation.currentAction !== 'defend') {
                // Add visual effect for defending (e.g., shield)
                const shield = playerModel.getObjectByName('shield');
                if (!shield) {
                  const shieldGeometry = new THREE.SphereGeometry(0.6, 16, 16);
                  const shieldMaterial = new THREE.MeshStandardMaterial({
                    color: 0x3366ff,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                  });
                  const newShield = new THREE.Mesh(shieldGeometry, shieldMaterial);
                  newShield.name = 'shield';
                  newShield.position.set(0, 0.5, 0);
                  playerModel.add(newShield);
                  
                  // Remove shield after defend duration
                  setTimeout(() => {
                    const shield = playerModel.getObjectByName('shield');
                    if (shield) {
                      playerModel.remove(shield);
                    }
                  }, 2000);
                }
              }
            }
          }
        });
      };
      
      animationFrameRef.current = requestAnimationFrame(update3D);
    }
  }, [isInitialized, use3D, selectedCharacter?.id, selectedCharacter?.country]);
  
  // Handle canvas click for player interaction
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || playerIsDead) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicked on another player
    const clickedPlayer = onlinePlayers.find(player => {
      if (player.isDead) return false;
      
      const dx = player.x - x;
      const dy = player.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= PLAYER_SIZE / 2;
    });
    
    if (clickedPlayer) {
      setTargetPlayer(clickedPlayer);
      
      // Calculate distance between player and target
      const dx = clickedPlayer.x - playerPosition.x;
      const dy = clickedPlayer.y - playerPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const isInRange = distance <= ATTACK_RANGE_2D;
      setInRange(isInRange);
      
      if (isInRange) {
        // Check if attack is on cooldown
        const now = Date.now();
        if (now - lastAttackTimeRef.current >= ATTACK_COOLDOWN) {
          // Execute attack
          handleAttack(clickedPlayer);
        } else {
          toast.error("Attack on cooldown!");
          setCombatLog(prev => [...prev, "Attack on cooldown!"]);
        }
      } else if (clickedPlayer) {
        toast.info(`Target selected: ${clickedPlayer.name}. Move closer to attack!`);
        setCombatLog(prev => [...prev, `Target selected: ${clickedPlayer.name}. Move closer to attack!`]);
      }
    } else {
      setTargetPlayer(null);
      setInRange(false);
    }
  };
  
  // Handle 3D scene click for player interaction and attacks
  const handle3DClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!use3D || !containerRef.current || !sceneRef.current || !cameraRef.current || playerIsDead) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const rect = containerRef.current.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycaster.setFromCamera(mouse, cameraRef.current);
    
    // Find all intersected objects
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    
    if (intersects.length > 0) {
      // Find the first mesh that was clicked
      const clickedObject = intersects[0].object;
      let clickedPlayerId: string | null = null;
      
      // Check if this object is one of our player models
      otherPlayerModelsRef.current.forEach((model, playerId) => {
        if (model.uuid === clickedObject.uuid || isChildOf(clickedObject, model)) {
          clickedPlayerId = playerId;
        }
      });
      
      if (clickedPlayerId) {
        const clickedPlayer = onlinePlayers.find(p => p.id === clickedPlayerId);
        
        if (clickedPlayer && !clickedPlayer.isDead) {
          setTargetPlayer(clickedPlayer);
          
          // Calculate distance between player and target in 3D space
          const playerModel = playerModelRef.current;
          if (playerModel) {
            const targetModel = otherPlayerModelsRef.current.get(clickedPlayer.id);
            if (targetModel) {
              const distance = playerModel.position.distanceTo(targetModel.position);
              const isInRange = distance <= ATTACK_RANGE;
              setInRange(isInRange);
              
              if (isInRange) {
                // Check if attack is on cooldown
                const now = Date.now();
                if (now - lastAttackTimeRef.current >= ATTACK_COOLDOWN) {
                  // Execute attack
                  handleAttack(clickedPlayer);
                  
                  // Trigger attack animation
                  if (playerAnimationRef.current && playerAnimationRef.current.actions.attack) {
                    // Only trigger if not already attacking
                    if (playerAnimationRef.current.currentAction !== 'attack') {
                      // Fade out current animation
                      if (playerAnimationRef.current.currentAction === 'idle' && playerAnimationRef.current.actions.idle) {
                        playerAnimationRef.current.actions.idle.fadeOut(0.2);
                      } else if (playerAnimationRef.current.currentAction === 'walk' && playerAnimationRef.current.actions.walk) {
                        playerAnimationRef.current.actions.walk.fadeOut(0.2);
                      }
                      
                      // Play attack animation
                      playerAnimationRef.current.actions.attack.reset();
                      playerAnimationRef.current.actions.attack.setLoop(THREE.LoopOnce, 1);
                      playerAnimationRef.current.actions.attack.clampWhenFinished = true;
                      playerAnimationRef.current.actions.attack.fadeIn(0.2);
                      playerAnimationRef.current.actions.attack.play();
                      playerAnimationRef.current.currentAction = 'attack';
                      
                      // Set a timeout to revert back to idle animation after attack completes
                      const animDuration = playerAnimationRef.current.actions.attack.getClip().duration * 1000;
                      isAttackingRef.current = window.setTimeout(() => {
                        if (playerAnimationRef.current && playerAnimationRef.current.actions.idle) {
                          // Fade out attack animation
                          if (playerAnimationRef.current.actions.attack) {
                            playerAnimationRef.current.actions.attack.fadeOut(0.2);
                          }
                          
                          // Fade in idle animation
                          playerAnimationRef.current.actions.idle.reset();
                          playerAnimationRef.current.actions.idle.setLoop(THREE.LoopRepeat, Infinity);
                          playerAnimationRef.current.actions.idle.fadeIn(0.2);
                          playerAnimationRef.current.actions.idle.play();
                          playerAnimationRef.current.currentAction = 'idle';
                          isAttackingRef.current = 0;
                        }
                      }, animDuration);
                    }
                  }
                } else {
                  toast.error("Attack on cooldown!");
                  setCombatLog(prev => [...prev, "Attack on cooldown!"]);
                }
              } else {
                const message = `Target selected: ${clickedPlayer.name}. Move closer to attack!`;
                toast.info(message);
                setCombatLog(prev => [...prev, message]);
              }
            }
          }
        }
      } else {
        setTargetPlayer(null);
        setInRange(false);
      }
    }
  };
  
  // Helper function to check if an object is a child of another
  const isChildOf = (child: THREE.Object3D, parent: THREE.Object3D): boolean => {
    let current: THREE.Object3D | null = child;
    
    while (current) {
      if (current === parent) {
        return true;
      }
      current = current.parent;
    }
    
    return false;
  };
  
  // Handle attack execution
  const handleAttack = (targetPlayer: OnlinePlayer | undefined) => {
    if (!targetPlayer) return;
    
    const now = Date.now();
    lastAttackTimeRef.current = now;
    
    // Calculate damage based on character country
    const playerCountry = selectedCharacter?.country || "usa";
    const damageRange = WEAPON_DAMAGE[playerCountry as keyof typeof WEAPON_DAMAGE] || WEAPON_DAMAGE.usa;
    
    // Calculate random damage within range
    const baseDamage = Math.floor(Math.random() * (damageRange.max - damageRange.min + 1)) + damageRange.min;
    
    // Check if target is defending
    const isTargetDefending = targetPlayer.isDefending;
    const defenseMultiplier = isTargetDefending 
      ? 1 - (DEFENSE_VALUES[targetPlayer.country as keyof typeof DEFENSE_VALUES] || 0.2)
      : 1;
    
    // Apply defense if target is defending
    const finalDamage = Math.floor(baseDamage * defenseMultiplier);
    
    // Update target player's health
    const updatedTargetPlayer = { 
      ...targetPlayer, 
      health: Math.max(0, targetPlayer.health - finalDamage) 
    };
    
    // Check if target is dead
    if (updatedTargetPlayer.health <= 0) {
      updatedTargetPlayer.isDead = true;
      updatedTargetPlayer.respawnTime = now + RESPAWN_TIME;
      
      // Transfer points
      updatedTargetPlayer.points = Math.max(0, updatedTargetPlayer.points - 1);
      setPlayerPoints(prevPoints => prevPoints + 1);
      
      // Show kill message
      toast.success(`You defeated ${targetPlayer.name} and gained 1 point!`);
      setCombatLog(prev => [...prev, `You defeated ${targetPlayer.name} and gained 1 point!`]);
      
      // Notify parent component
      onPlayerDeath(targetPlayer.id);
    } else {
      // Show damage message
      const message = isTargetDefending 
        ? `You hit ${targetPlayer.name} for ${finalDamage} damage (reduced by defense)!`
        : `You hit ${targetPlayer.name} for ${finalDamage} damage!`;
      
      toast.info(message);
      setCombatLog(prev => [...prev, message]);
      
      // Update player in parent component
      onPlayerUpdate(updatedTargetPlayer);
    }
  };
  
  // Handle defense
  const handleDefend = () => {
    const now = Date.now();
    
    // Check if defense is on cooldown
    if (now - lastDefendTimeRef.current < DEFENSE_COOLDOWN) {
      toast.error("Defense on cooldown!");
      setCombatLog(prev => [...prev, "Defense on cooldown!"]);
      return;
    }
    
    // Activate defense
    lastDefendTimeRef.current = now;
    isDefendingRef.current = true;
    
    toast.info("Defensive stance activated!");
    setCombatLog(prev => [...prev, "Defensive stance activated!"]);
    
    // End defense after 2 seconds
    setTimeout(() => {
      isDefendingRef.current = false;
      toast.info("Defensive stance ended");
      setCombatLog(prev => [...prev, "Defensive stance ended"]);
    }, 2000);
  };
  
  // Take damage function
  const takeDamage = (damage: number) => {
    // Apply defense if active
    const finalDamage = isDefendingRef.current 
      ? Math.floor(damage * (1 - (DEFENSE_VALUES[selectedCharacter?.country as keyof typeof DEFENSE_VALUES] || 0.2)))
      : damage;
    
    // Update health
    setPlayerHealth(prev => {
      const newHealth = Math.max(0, prev - finalDamage);
      
      // Update health bar if in 3D mode
      if (use3D && playerModelRef.current?.userData.characterModel?.healthBar) {
        playerModelRef.current.userData.characterModel.healthBar.update(
          newHealth,
          MAX_HEALTH
        );
      }
      
      // Check if player died
      if (newHealth <= 0) {
        handlePlayerDeath();
      }
      
      return newHealth;
    });
    
    // Show damage feedback
    toast.error(`You took ${finalDamage} damage!`);
    setCombatLog(prev => [...prev, `You took ${finalDamage} damage!`]);
  };
  
  // Handle player death
  const handlePlayerDeath = () => {
    if (!selectedCharacter || playerIsDead) return;
    
    // Set player as dead
    setPlayerIsDead(true);
    setPlayerHealth(0);
    setRespawnCountdown(RESPAWN_TIME / 1000);
    
    // Remove player model from scene in 3D mode
    if (use3D && playerModelRef.current) {
      // Fade out the model
      const mesh = playerModelRef.current.children[0] as THREE.Mesh;
      const material = mesh?.material as THREE.Material;
      if (material) {
        material.transparent = true;
        
        // Animate opacity
        const fadeOut = () => {
          if (material.opacity > 0) {
            material.opacity -= 0.05;
            requestAnimationFrame(fadeOut);
          } else {
            // Remove model after fade out
            if (sceneRef.current && playerModelRef.current) {
              sceneRef.current.remove(playerModelRef.current);
              playerModelRef.current = null;
            }
          }
        };
        
        fadeOut();
      } else {
        // If no material, just remove immediately
        if (sceneRef.current && playerModelRef.current) {
          sceneRef.current.remove(playerModelRef.current);
          playerModelRef.current = null;
        }
      }
    }
    
    // Notify other players
    onPlayerDeath(selectedCharacter.id);
    
    toast.error("You died! You lost 1 point. Respawning in 5 seconds...");
    setCombatLog(prev => [...prev, "You died! You lost 1 point. Respawning in 5 seconds..."]);
    
    // Set a single timeout to respawn after RESPAWN_TIME
    const respawnTimeoutId = setTimeout(() => {
      // Generate new position
      const newPosition = {
        x: Math.random() * (CANVAS_WIDTH - PLAYER_SIZE * 2) + PLAYER_SIZE,
        y: Math.random() * (CANVAS_HEIGHT - PLAYER_SIZE * 2) + PLAYER_SIZE
      };
      
      // Update position ref first
      playerPositionRef.current = newPosition;
      
      // Batch state updates
      setPlayerIsDead(false);
      setPlayerHealth(MAX_HEALTH);
      setPlayerPoints(prevPoints => Math.max(0, prevPoints - 1));
      setPlayerPosition(newPosition);
      setRespawnCountdown(0);
      
      toast.success("You have respawned!");
      setCombatLog(prev => [...prev, "You have respawned!"]);
    }, RESPAWN_TIME);
    
    // Store the timeout ID in a ref so we can clear it if needed
    const timeoutRef = { current: respawnTimeoutId };
    
    // Return a cleanup function that can be called if the component unmounts
    return () => clearTimeout(timeoutRef.current);
  };
  
  // Update respawn countdown
  useEffect(() => {
    if (!playerIsDead) return;
    
    const intervalId = window.setInterval(() => {
      setRespawnCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Clean up interval on unmount or when playerIsDead changes
    return () => {
      clearInterval(intervalId);
    };
  }, [playerIsDead]);
  
  // Clean up
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current!);
      }
      
      // Clean up animation mixers
      if (playerAnimationRef.current) {
        playerAnimationRef.current.mixer.stopAllAction();
      }
      
      // Clear any active timeouts
      if (isAttackingRef.current) {
        clearTimeout(isAttackingRef.current);
      }
    };
  }, []);
  
  const renderPlayerModel = (player: OnlinePlayer, isCurrentPlayer: boolean = false) => {
    // Skip if player is dead
    if (player.isDead) return;
    
    // Get player position
    const x = player.x;
    const y = player.y;
    
    // Get player color based on country
    const color = getPlayerColor(player.country);
    
    if (use3D) {
      // 3D rendering handled in update3D
      return;
    }
    
    // 2D rendering
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Draw player circle
      ctx.beginPath();
      ctx.arc(x, y, PLAYER_SIZE, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isCurrentPlayer ? '#ffffff' : '#000000';
      ctx.stroke();
      
      // Draw player name
      ctx.font = '12px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, x, y - PLAYER_SIZE - 5);
      
      // Draw health bar
      const healthBarWidth = PLAYER_SIZE * 2;
      const healthBarHeight = 4;
      const healthPercent = player.health / player.maxHealth;
      
      // Health bar background
      ctx.fillStyle = '#333333';
      ctx.fillRect(
        x - PLAYER_SIZE,
        y + PLAYER_SIZE + 5,
        healthBarWidth,
        healthBarHeight
      );
      
      // Health bar fill
      ctx.fillStyle = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000';
      ctx.fillRect(
        x - PLAYER_SIZE,
        y + PLAYER_SIZE + 5,
        healthBarWidth * healthPercent,
        healthBarHeight
      );
      
      // Draw NPC indicator if applicable
      if (player.isNPC) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.textAlign = 'center';
        ctx.fillText('NPC', x, y + PLAYER_SIZE + 15);
      }
      
      // Draw attack/defend indicators
      if (player.isAttacking) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('⚔️', x + PLAYER_SIZE + 10, y);
      }
      
      if (player.isDefending) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#0000ff';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️', x - PLAYER_SIZE - 10, y);
      }
    }
  };
  
  // Helper function to create text sprites for labels
  function createTextSprite(message: string, parameters: any = {}) {
    if (parameters === undefined) parameters = {};
    
    const fontface = parameters.fontface || 'Arial';
    const fontsize = parameters.fontsize || 18;
    const borderThickness = parameters.borderThickness || 4;
    const borderColor = parameters.borderColor || { r:0, g:0, b:0, a:1.0 };
    const backgroundColor = parameters.backgroundColor || { r:255, g:255, b:255, a:1.0 };
    const textColor = parameters.textColor || { r:0, g:0, b:0, a:1.0 };

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return new THREE.Sprite();
    
    context.font = `Bold ${fontsize}px ${fontface}`;
    
    // Get text metrics
    const metrics = context.measureText(message);
    const textWidth = metrics.width;
    
    // Set canvas dimensions
    const width = textWidth + borderThickness * 2;
    const height = fontsize * 1.4 + borderThickness * 2;
    canvas.width = width;
    canvas.height = height;
    
    // Reset font after resize
    context.font = `Bold ${fontsize}px ${fontface}`;
    
    // Background
    context.fillStyle = `rgba(${backgroundColor.r},${backgroundColor.g},${backgroundColor.b},${backgroundColor.a})`;
    context.strokeStyle = `rgba(${borderColor.r},${borderColor.g},${borderColor.b},${borderColor.a})`;
    context.lineWidth = borderThickness;
    roundRect(context, borderThickness/2, borderThickness/2, width-borderThickness, height-borderThickness, 6);
    
    // Text
    context.fillStyle = `rgba(${textColor.r},${textColor.g},${textColor.b},${textColor.a})`;
    context.fillText(message, borderThickness, fontsize + borderThickness);
    
    // Create texture
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    
    // Create sprite material
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.5, 0.25, 1.0);
    
    return sprite;
  }

  // Helper function to draw rounded rectangles
  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  return (
    <div className="relative w-full h-[600px]">
      {use3D ? (
        <div 
          ref={containerRef} 
          className="w-full h-full object-contain"
          onClick={handle3DClick}
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain"
          onClick={handleCanvasClick}
        />
      )}
    </div>
  );
} 