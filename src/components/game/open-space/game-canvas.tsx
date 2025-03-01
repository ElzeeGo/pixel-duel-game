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
}

interface GameCanvasProps {
  selectedCharacter: Character | undefined;
  onlinePlayers: OnlinePlayer[];
  use3D?: boolean;
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

export function GameCanvas({ selectedCharacter, onlinePlayers, use3D = false }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerPosition, setPlayerPosition] = useState<PlayerPosition>({ x: 400, y: 300 });
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const animationFrameRef = useRef<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  // 3D specific refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const playerModelRef = useRef<THREE.Group | null>(null);
  const playerModelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const groundRef = useRef<THREE.Mesh | null>(null);
  
  // Animation state refs
  const playerAnimationRef = useRef<AnimationState | null>(null);
  const playerAnimationsRef = useRef<Map<string, AnimationState>>(new Map());
  
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
    info += `Other Players: ${playerModelsRef.current.size}\n`;
    
    setDebugInfo(info);
  };
  
  // Setup 3D scene if use3D is true
  useEffect(() => {
    if (!isInitialized || !use3D || !containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    sceneRef.current = scene;
    
    // Create camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;
    
    // Add lights
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Main directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.001;
    
    // Configure shadow camera frustum
    const shadowSize = 30;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    
    scene.add(directionalLight);
    
    // Add a fill light from the opposite direction
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);
    
    // Add a subtle hemisphere light for more natural lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
    scene.add(hemiLight);
    
    // Add ground plane with grid texture
    const groundSize = WORLD_SCALE * 10;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    
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
    groundRef.current = ground;
    
    // Add a debug helper function to visualize model bounding boxes
    const addBoundingBoxHelper = (model: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(model);
      const helper = new THREE.Box3Helper(box, new THREE.Color(0xffff00));
      scene.add(helper);
      return helper;
    };
    
    // Load player model if character is selected
    if (selectedCharacter) {
      loadPlayerModel(selectedCharacter.country);
    }
    
    // Load other player models
    onlinePlayers.forEach(player => {
      if (player.id !== selectedCharacter?.id) {
        loadOtherPlayerModel(player);
      }
    });
    
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
        cancelAnimationFrame(animationFrameRef.current);
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
      playerModelsRef.current.clear();
    };
  }, [isInitialized, use3D, selectedCharacter?.id]);
  
  // Game loop
  useEffect(() => {
    if (!isInitialized) return;
    
    if (use3D) {
      // 3D game loop
      const update3D = () => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !playerModelRef.current) {
          animationFrameRef.current = requestAnimationFrame(update3D);
          return;
        }
        
        // Update player position based on keys
        let dx = 0;
        let dz = 0;
        
        if (keysPressed.has('w') || keysPressed.has('arrowup')) dz -= MOVEMENT_SPEED / 100;
        if (keysPressed.has('a') || keysPressed.has('arrowleft')) dx -= MOVEMENT_SPEED / 100;
        if (keysPressed.has('s') || keysPressed.has('arrowdown')) dz += MOVEMENT_SPEED / 100;
        if (keysPressed.has('d') || keysPressed.has('arrowright')) dx += MOVEMENT_SPEED / 100;
        
        // Normalize diagonal movement
        if (dx !== 0 && dz !== 0) {
          const factor = 1 / Math.sqrt(2);
          dx *= factor;
          dz *= factor;
        }
        
        // Update animation state based on movement
        if (playerAnimationRef.current) {
          const isMoving = dx !== 0 || dz !== 0;
          
          if (isMoving && playerAnimationRef.current.currentAction !== 'walk') {
            // Switch to walk animation
            if (playerAnimationRef.current.actions.idle) {
              playerAnimationRef.current.actions.idle.fadeOut(0.2);
            }
            if (playerAnimationRef.current.actions.walk) {
              playerAnimationRef.current.actions.walk.reset().fadeIn(0.2).play();
              playerAnimationRef.current.currentAction = 'walk';
            }
          } else if (!isMoving && playerAnimationRef.current.currentAction !== 'idle') {
            // Switch to idle animation
            if (playerAnimationRef.current.actions.walk) {
              playerAnimationRef.current.actions.walk.fadeOut(0.2);
            }
            if (playerAnimationRef.current.actions.idle) {
              playerAnimationRef.current.actions.idle.reset().fadeIn(0.2).play();
              playerAnimationRef.current.currentAction = 'idle';
            }
          }
          
          // Update animation mixer
          const deltaTime = clockRef.current.getDelta();
          playerAnimationRef.current.mixer.update(deltaTime);
        }
        
        // Update 3D model position
        if (dx !== 0 || dz !== 0) {
          playerModelRef.current.position.x += dx;
          playerModelRef.current.position.z += dz;
          
          // Rotate model to face movement direction
          if (dx !== 0 || dz !== 0) {
            const angle = Math.atan2(dx, dz);
            playerModelRef.current.rotation.y = angle;
          }
          
          // Update camera target to follow player
          if (controlsRef.current) {
            controlsRef.current.target.set(
              playerModelRef.current.position.x,
              playerModelRef.current.position.y + 1,
              playerModelRef.current.position.z
            );
          }
          
          // Convert 3D position to 2D for state
          const x = ((playerModelRef.current.position.x / WORLD_SCALE) + 0.5) * CANVAS_WIDTH;
          const y = ((playerModelRef.current.position.z / WORLD_SCALE) + 0.5) * CANVAS_HEIGHT;
          
          // Update player position state
          setPlayerPosition({ x, y });
        }
        
        // Update other players' animations
        playerModelsRef.current.forEach((model, playerId) => {
          const animState = playerAnimationsRef.current.get(playerId);
          if (animState) {
            const deltaTime = clockRef.current.getDelta();
            animState.mixer.update(deltaTime);
          }
        });
        
        // Update controls
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        // Update debug info if enabled
        if (showDebugInfo) {
          updateDebugInfo();
        }
        
        // Render scene
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        
        // Continue animation loop
        animationFrameRef.current = requestAnimationFrame(update3D);
      };
      
      animationFrameRef.current = requestAnimationFrame(update3D);
    } else {
      // 2D game loop
      const update2D = () => {
        let dx = 0;
        let dy = 0;
        
        if (keysPressed.has('w') || keysPressed.has('arrowup')) dy -= MOVEMENT_SPEED;
        if (keysPressed.has('a') || keysPressed.has('arrowleft')) dx -= MOVEMENT_SPEED;
        if (keysPressed.has('s') || keysPressed.has('arrowdown')) dy += MOVEMENT_SPEED;
        if (keysPressed.has('d') || keysPressed.has('arrowright')) dx += MOVEMENT_SPEED;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
          const factor = 1 / Math.sqrt(2);
          dx *= factor;
          dy *= factor;
        }
        
        // Update position with boundary checks
        setPlayerPosition(prev => ({
          x: Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_WIDTH - PLAYER_SIZE / 2, prev.x + dx)),
          y: Math.max(PLAYER_SIZE / 2, Math.min(CANVAS_HEIGHT - PLAYER_SIZE / 2, prev.y + dy)),
        }));
        
        renderGame();
        animationFrameRef.current = requestAnimationFrame(update2D);
      };
      
      animationFrameRef.current = requestAnimationFrame(update2D);
    }
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      
      // Clean up animation mixers
      if (playerAnimationRef.current) {
        playerAnimationRef.current.mixer.stopAllAction();
      }
      
      playerAnimationsRef.current.forEach(animState => {
        animState.mixer.stopAllAction();
      });
    };
  }, [isInitialized, keysPressed, use3D, showDebugInfo]);
  
  // Render 2D game
  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    
    // Draw vertical grid lines
    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let y = 0; y <= canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw other players
    onlinePlayers.forEach(player => {
      if (player.id === selectedCharacter?.id) return; // Skip self
      
      // Draw player character using shared renderer
      renderCharacter(ctx, player.x, player.y, player.country, PLAYER_SIZE, {
        useGradient: false, // Simpler rendering for better performance with many players
        useShadows: false
      });
      
      // Draw player name
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(player.name, player.x, player.y - PLAYER_SIZE / 2 - 5);
    });
    
    // Draw player character
    if (selectedCharacter) {
      const country = selectedCharacter.country || 'usa';
      
      // Use shared renderer with animation for player character
      renderCharacter(ctx, playerPosition.x, playerPosition.y, country, PLAYER_SIZE, {
        useGradient: true,
        useShadows: true,
        animate: true
      });
      
      // Draw player name
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('You', playerPosition.x, playerPosition.y - PLAYER_SIZE / 2 - 5);
    }
  };
  
  // Handle canvas click for player interaction
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicked on another player
    const clickedPlayer = onlinePlayers.find(player => {
      const dx = player.x - x;
      const dy = player.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= PLAYER_SIZE / 2;
    });
    
    if (clickedPlayer) {
      toast.info(`Clicked on ${clickedPlayer.name}`);
      // In a real implementation, this would open a dialog to challenge the player
    }
  };
  
  // Handle 3D scene click for player interaction and attacks
  const handle3DClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!use3D || !containerRef.current || !sceneRef.current || !cameraRef.current) return;
    
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
        const attackAction = playerAnimationRef.current.actions.attack;
        attackAction.reset().fadeIn(0.2).play();
        attackAction.clampWhenFinished = true;
        attackAction.loop = THREE.LoopOnce;
        
        playerAnimationRef.current.currentAction = 'attack';
        
        // Return to idle after attack animation completes
        setTimeout(() => {
          if (playerAnimationRef.current) {
            if (playerAnimationRef.current.actions.attack) {
              playerAnimationRef.current.actions.attack.fadeOut(0.2);
            }
            
            if (playerAnimationRef.current.actions.idle) {
              playerAnimationRef.current.actions.idle.reset().fadeIn(0.2).play();
              playerAnimationRef.current.currentAction = 'idle';
            }
          }
        }, 1000); // Adjust timing based on your animation length
      }
    }
    
    // Check if clicked on another player
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create a raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    
    // Get all objects intersected by the ray
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
    
    // Check if we hit another player
    if (intersects.length > 0) {
      // Find which player was clicked by traversing up the parent chain
      let clickedObject = intersects[0].object;
      let clickedPlayer: OnlinePlayer | undefined;
      
      // Traverse up to find the root model
      while (clickedObject.parent && clickedObject.parent !== sceneRef.current) {
        clickedObject = clickedObject.parent;
      }
      
      // Check if this object is one of our player models
      playerModelsRef.current.forEach((model, playerId) => {
        if (model.uuid === clickedObject.uuid) {
          clickedPlayer = onlinePlayers.find(p => p.id === playerId);
        }
      });
      
      if (clickedPlayer) {
        toast.info(`Clicked on ${clickedPlayer.name}`);
        // In a real implementation, this would open a dialog to challenge the player
      }
    }
  };
  
  // Function to load player model
  const loadPlayerModel = (country: string) => {
    if (!sceneRef.current) return;
    
    // Instead of loading GLB files, use our character model generator
    const characterModel = createCharacterModel(country);
    const model = characterModel.scene;
    
    if (sceneRef.current) {
      if (playerModelRef.current) {
        sceneRef.current.remove(playerModelRef.current);
      }
      
      // Position the model
      model.position.set(0, 0, 0);
      
      // Apply a slight rotation so the model faces forward
      model.rotation.y = Math.PI;
      
      model.castShadow = true;
      model.receiveShadow = true;
      
      sceneRef.current.add(model);
      playerModelRef.current = model;
      
      // Setup animations if available
      if (characterModel.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        
        // Create animation actions
        const actions: AnimationState['actions'] = {};
        
        characterModel.animations.forEach(clip => {
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
  };
  
  // Function to load other player models
  const loadOtherPlayerModel = (player: OnlinePlayer) => {
    if (!sceneRef.current) return;
    
    // Use character model generator instead of loading GLB files
    const characterModel = createCharacterModel(player.country);
    const model = characterModel.scene;
    
    if (sceneRef.current) {
      // Remove previous model if exists
      if (playerModelsRef.current.has(player.id)) {
        const existingModel = playerModelsRef.current.get(player.id);
        if (existingModel) {
          sceneRef.current.remove(existingModel);
        }
      }
      
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
      
      sceneRef.current.add(model);
      playerModelsRef.current.set(player.id, model);
      
      // Setup animations if available
      if (characterModel.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(model);
        
        // Create animation actions
        const actions: AnimationState['actions'] = {};
        
        characterModel.animations.forEach(clip => {
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
        playerAnimationsRef.current.set(player.id, {
          mixer,
          actions,
          currentAction: 'idle'
        });
      }
    }
  };
  
  // Helper function to get model path based on country
  // This is kept for reference but no longer used
  function getModelPath(country: string): string {
    // Ensure the path starts with a leading slash for proper URL resolution
    const modelMap: Record<string, string> = {
      usa: '/models/characters/gunslinger.glb',
      japan: '/models/characters/samurai.glb',
      uk: '/models/characters/knight.glb',
      russia: '/models/characters/brawler.glb',
      brazil: '/models/characters/capoeira.glb',
    };
    
    return modelMap[country.toLowerCase()] || '/models/characters/default.glb';
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