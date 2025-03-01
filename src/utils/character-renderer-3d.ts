/**
 * 3D Character Renderer Utility
 * 
 * This utility provides functions for rendering 3D game characters consistently
 * across different components (character creation, open space, duel arena).
 * It uses Three.js for 3D rendering and animations.
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getPlayerColor } from './character-renderer';
import { createFallbackCharacter, createFallbackEnvironment } from './fallback-model-generator';

// Type definitions
export interface Character3DOptions {
  animate?: boolean;
  shadows?: boolean;
  controls?: boolean;
  autoRotate?: boolean;
  useFallback?: boolean;
  health?: number;
  maxHealth?: number;
}

export interface CharacterModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  mixer?: THREE.AnimationMixer;
  actions?: Map<string, THREE.AnimationAction>;
  healthBar?: {
    container: THREE.Group;
    background: THREE.Mesh;
    foreground: THREE.Mesh;
    update: (health: number, maxHealth: number) => void;
  };
}

// Cache for loaded models to avoid reloading
const modelCache = new Map<string, Promise<CharacterModel>>();
const textureCache = new Map<string, THREE.Texture>();

// Helper function to get model path based on country
function getModelPath(country: string): string {
  const modelMap: Record<string, string> = {
    usa: '/models/characters/gunslinger.glb',
    japan: '/models/characters/samurai.glb',
    uk: '/models/characters/knight.glb',
    russia: '/models/characters/brawler.glb',
    brazil: '/models/characters/capoeira.glb',
  };
  
  return modelMap[country] || '/models/characters/default.glb';
}

/**
 * Loads a 3D character model with animations
 */
export async function loadCharacterModel(
  country: string, 
  options: { useFallback?: boolean } = {}
): Promise<CharacterModel> {
  return new Promise((resolve, reject) => {
    if (options.useFallback) {
      // Create fallback character if requested or if in development
      const fallbackModel = createFallbackCharacter(country);
      resolve({
        scene: fallbackModel.scene,
        animations: fallbackModel.animations
      });
      return;
    }
    
    const modelPath = getModelPath(country);
    const cacheKey = `${modelPath}${options.useFallback ? '-fallback' : ''}`;
    
    // Check cache first
    if (modelCache.has(cacheKey)) {
      return modelCache.get(cacheKey)!;
    }
    
    // Load the model
    const loader = new GLTFLoader();
    const modelPromise = new Promise<CharacterModel>((resolve, reject) => {
      loader.load(
        modelPath,
        (gltf: GLTF) => {
          const model: CharacterModel = {
            scene: gltf.scene,
            animations: gltf.animations,
          };
          
          // Setup animations if available
          if (gltf.animations.length > 0) {
            model.mixer = new THREE.AnimationMixer(gltf.scene);
            model.actions = new Map();
            
            // Create actions for each animation
            gltf.animations.forEach((clip: THREE.AnimationClip) => {
              const action = model.mixer!.clipAction(clip);
              model.actions?.set(clip.name, action);
            });
          }
          
          // Apply character color to the model
          gltf.scene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh && child.material) {
              // Apply color to main body parts
              if (child.name.includes('body') || child.name.includes('main')) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    if (mat instanceof THREE.MeshStandardMaterial) {
                      mat.color.set(getPlayerColor(country));
                    }
                  });
                } else if (child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.color.set(getPlayerColor(country));
                }
              }
              
              // Enable shadows
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          resolve(model);
        },
        undefined,
        (error: ErrorEvent) => {
          console.error('Error loading character model:', error);
          
          // Fallback to simple model on error
          const fallbackModel = createFallbackCharacter(country);
          resolve({
            scene: fallbackModel.scene,
            animations: fallbackModel.animations
          });
        }
      );
    });
    
    // Store in cache
    modelCache.set(cacheKey, modelPromise);
    return modelPromise;
  });
}

/**
 * Creates a health bar that floats above the character's head
 */
function createHealthBar(maxHealth: number = 100): CharacterModel['healthBar'] {
  const container = new THREE.Group();
  container.position.y = 2; // Position above head
  
  // Create background (gray bar)
  const backgroundGeometry = new THREE.PlaneGeometry(1, 0.1);
  const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: 0x444444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
  container.add(background);
  
  // Create foreground (health indicator)
  const foregroundGeometry = new THREE.PlaneGeometry(1, 0.1);
  const foregroundMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9
  });
  const foreground = new THREE.Mesh(foregroundGeometry, foregroundMaterial);
  foreground.position.z = 0.01; // Slightly in front of background
  container.add(foreground);
  
  // Health update function
  const update = (health: number, maxHealth: number) => {
    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
    foreground.scale.x = healthPercent;
    foreground.position.x = -0.5 * (1 - healthPercent); // Keep left-aligned
    
    // Update color based on health percentage
    if (healthPercent > 0.6) {
      (foregroundMaterial as THREE.MeshBasicMaterial).color.setHex(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      (foregroundMaterial as THREE.MeshBasicMaterial).color.setHex(0xffff00); // Yellow
    } else {
      (foregroundMaterial as THREE.MeshBasicMaterial).color.setHex(0xff0000); // Red
    }
    
    // Show/hide based on health
    container.visible = health > 0;
  };
  
  // Make health bar always face camera
  container.userData.updateRotation = (camera: THREE.Camera) => {
    container.quaternion.copy(camera.quaternion);
  };
  
  return { container, background, foreground, update };
}

/**
 * Sets up a 3D scene for character rendering
 */
export function setupCharacterScene(
  container: HTMLElement,
  options: Character3DOptions = {}
): { scene: THREE.Scene; camera: THREE.Camera } {
  const { shadows = true, controls = true, autoRotate = false } = options;
  
  // Calculate aspect ratio
  const width = container.clientWidth;
  const height = container.clientHeight;
  const aspect = width / height;
  
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111827);
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(0, 1.5, 4);
  camera.lookAt(0, 1, 0);
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  // Setup shadows
  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  
  // Add renderer to container
  container.innerHTML = '';
  container.appendChild(renderer.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = shadows;
  
  // Configure shadow properties
  if (shadows) {
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.001;
  }
  
  scene.add(directionalLight);
  
  // Add ground plane
  const groundGeometry = new THREE.PlaneGeometry(10, 10);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  ground.receiveShadow = shadows;
  scene.add(ground);
  
  // Add controls if enabled
  let orbitControls: OrbitControls | undefined;
  if (controls) {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.minDistance = 2;
    orbitControls.maxDistance = 10;
    orbitControls.maxPolarAngle = Math.PI / 2;
    orbitControls.autoRotate = autoRotate;
    orbitControls.autoRotateSpeed = 1.0;
  }
  
  // Handle window resize
  const handleResize = () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(newWidth, newHeight);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Animation loop
  const clock = new THREE.Clock();
  const animate = () => {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update controls if enabled
    if (orbitControls) {
      orbitControls.update();
    }
    
    // Update health bar rotations to face camera
    scene.traverse((object) => {
      if (object.userData.updateRotation) {
        object.userData.updateRotation(camera);
      }
    });
    
    // Render scene
    renderer.render(scene, camera);
  };
  
  animate();
  
  // Return both scene and camera for external use
  return { scene, camera };
}

/**
 * Renders a 3D character in the provided scene
 */
export async function renderCharacter3D(
  scene: THREE.Scene,
  country: string,
  options: Character3DOptions = {}
): Promise<CharacterModel> {
  const { animate = true, useFallback = false, health = 100, maxHealth = 100 } = options;
  
  // Load character model
  const model = await loadCharacterModel(country, { useFallback });
  
  // Position the model
  model.scene.position.set(0, 0, 0);
  model.scene.rotation.y = Math.PI;
  
  // Add health bar
  const healthBar = createHealthBar(maxHealth)!;
  model.scene.add(healthBar.container);
  healthBar.update(health, maxHealth);
  model.healthBar = healthBar;
  
  // Add to scene
  scene.add(model.scene);
  
  // Play idle animation if available and animation is enabled
  if (animate && model.actions && model.actions.size > 0) {
    const idleAction = model.actions.get('idle') || model.actions.get('Idle') || 
                      model.actions.values().next().value;
    
    if (idleAction) {
      idleAction.play();
    }
  }
  
  return model;
}

/**
 * Plays a specific animation on a character model
 */
export function playAnimation(
  model: CharacterModel,
  animationName: string,
  options: {
    loop?: THREE.AnimationActionLoopStyles;
    crossFadeDuration?: number;
  } = {}
): void {
  const { loop = THREE.LoopRepeat, crossFadeDuration = 0.3 } = options;
  
  if (!model.actions || !model.mixer) {
    console.warn('Model does not have animations setup');
    return;
  }
  
  const action = model.actions.get(animationName);
  if (!action) {
    console.warn(`Animation "${animationName}" not found`);
    return;
  }
  
  // Stop all current animations
  model.actions.forEach((currentAction) => {
    if (currentAction !== action) {
      currentAction.fadeOut(crossFadeDuration);
    }
  });
  
  // Configure and play the requested animation
  action.reset();
  action.setLoop(loop, Infinity);
  action.fadeIn(crossFadeDuration);
  action.play();
}

/**
 * Updates animation mixers - call this in your animation loop
 */
export function updateAnimations(model: CharacterModel, deltaTime: number): void {
  if (model.mixer) {
    model.mixer.update(deltaTime);
  }
}

/**
 * Loads a 3D environment model
 */
export async function loadEnvironmentModel(
  environmentPath: string,
  options: { useFallback?: boolean } = {}
): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    if (options.useFallback) {
      // Create fallback environment if requested or if in development
      const fallbackEnvironment = createFallbackEnvironment();
      resolve(fallbackEnvironment.scene);
      return;
    }
    
    const loader = new GLTFLoader();
    
    loader.load(
      environmentPath,
      (gltf: GLTF) => {
        const model = gltf.scene;
        
        // Setup shadows for all meshes
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        resolve(model);
      },
      undefined,
      (error: ErrorEvent) => {
        console.error('Error loading environment model:', error);
        
        // Fallback to simple environment on error
        const fallbackEnvironment = createFallbackEnvironment();
        resolve(fallbackEnvironment.scene);
      }
    );
  });
} 