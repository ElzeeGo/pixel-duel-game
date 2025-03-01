'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { cn } from '@/lib/utils';

interface World3DProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  environmentPath?: string;
  onLoad?: () => void;
}

/**
 * 3D World Component
 * 
 * Renders a 3D environment for the game with terrain, buildings, and props.
 * Uses Three.js for rendering and supports various environment options.
 */
export function World3D({
  className,
  height = '600px',
  width = '100%',
  environmentPath = '/models/environments/duel-arena.glb',
  onLoad,
}: World3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const environmentLoadedRef = useRef<boolean>(false);
  
  // Setup 3D scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    // Use a gradient background instead of skybox
    const topColor = new THREE.Color(0x88ccff); // Light blue
    const bottomColor = new THREE.Color(0xffffff); // White
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      gradient.addColorStop(0, topColor.getStyle());
      gradient.addColorStop(1, bottomColor.getStyle());
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 512);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      scene.background = texture;
    } else {
      scene.background = new THREE.Color(0x87ceeb); // Fallback sky blue
    }
    sceneRef.current = scene;
    
    // Create camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 3, 8); // Lower and closer camera position
    camera.lookAt(0, 1, 0); // Look at character height
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Expose scene and camera to parent components
    // This allows parent components to add their own objects to the scene
    (renderer.domElement as any).__three = {
      scene,
      camera,
      renderer,
    };
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2; // Allow closer zoom
    controls.maxDistance = 20; // Limit max distance
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    controls.target.set(0, 1, 0); // Focus on character height
    controlsRef.current = controls;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // Increase ambient light intensity
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); // Increase directional light intensity
    directionalLight.position.set(5, 10, 5); // Adjust position for better shadows
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
    
    // Add a second directional light from the opposite direction to reduce harsh shadows
    const backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    backLight.position.set(-5, 8, -5);
    backLight.castShadow = true;
    backLight.shadow.mapSize.width = 1024;
    backLight.shadow.mapSize.height = 1024;
    backLight.shadow.camera.near = 0.5;
    backLight.shadow.camera.far = 50;
    backLight.shadow.bias = -0.001;
    scene.add(backLight);
    
    // Add hemisphere light for better ambient lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3d3d3d, 0.5);
    scene.add(hemisphereLight);
    
    // Add a central point light to illuminate the duel area
    const centerLight = new THREE.PointLight(0xffffff, 1.5, 20);
    centerLight.position.set(0, 5, 0);
    centerLight.castShadow = true;
    centerLight.shadow.bias = -0.001;
    scene.add(centerLight);
    
    // Load environment model only once
    const loadEnvironment = () => {
      if (environmentLoadedRef.current) {
        console.log("Environment already loaded, skipping load");
        // If environment is already loaded, just call onLoad callback
        if (onLoad) {
          onLoad();
        }
        return;
      }
      
      const loader = new GLTFLoader();
      loader.load(
        environmentPath,
        (gltf: GLTF) => {
          console.log('Environment model loaded:', environmentPath);
          
          // Debug the model structure
          console.log('Environment model structure:', gltf.scene);
          
          // Scale and position the environment
          gltf.scene.scale.set(5, 5, 5); // Scale up the environment
          gltf.scene.position.set(0, 0, 0);
          
          // Setup shadows for all meshes
          gltf.scene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Debug each mesh
              console.log('Environment mesh:', child.name, child.position);
              
              // Improve material quality
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    if (mat instanceof THREE.MeshStandardMaterial) {
                      mat.envMapIntensity = 1;
                      mat.needsUpdate = true;
                    }
                  });
                } else if (child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.envMapIntensity = 1;
                  child.material.needsUpdate = true;
                }
              }
            }
          });
          
          scene.add(gltf.scene);
          
          // Add a spotlight to highlight the duel area
          const spotlight = new THREE.SpotLight(0xffffff, 1);
          spotlight.position.set(0, 10, 0);
          spotlight.angle = Math.PI / 4;
          spotlight.penumbra = 0.1;
          spotlight.decay = 2;
          spotlight.distance = 50;
          spotlight.castShadow = true;
          spotlight.shadow.mapSize.width = 1024;
          spotlight.shadow.mapSize.height = 1024;
          scene.add(spotlight);
          
          // Mark environment as loaded
          environmentLoadedRef.current = true;
          
          // Call onLoad callback
          if (onLoad) {
            onLoad();
          }
        },
        (progress) => {
          const percentage = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;
          console.log('Loading environment model progress:', percentage + '%');
        },
        (error: ErrorEvent) => {
          console.error('Error loading environment model:', error);
          
          // Call onLoad callback even if there's an error
          // This allows the game to continue without the environment model
          if (onLoad) {
            onLoad();
          }
        }
      );
    };
    
    // Add ground plane if needed
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3d3d3d,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0; // Set exactly at y=0
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Load the environment
    loadEnvironment();
    
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
    
    // Animation loop
    const animate = () => {
      if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
      
      // Update controls
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
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
      
      // Reset environment loaded flag when component unmounts
      environmentLoadedRef.current = false;
    };
  }, [environmentPath, onLoad]);
  
  return (
    <div 
      ref={containerRef}
      className={cn(`world-3d-container`, className)}
      style={{ 
        height, 
        width,
        position: 'relative',
        overflow: 'hidden',
      }}
    />
  );
} 