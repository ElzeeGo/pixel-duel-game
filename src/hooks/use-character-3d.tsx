'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  setupCharacterScene, 
  renderCharacter3D, 
  playAnimation, 
  updateAnimations,
  CharacterModel,
  Character3DOptions
} from '@/utils/character-renderer-3d';

interface UseCharacter3DProps extends Character3DOptions {
  country: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface UseCharacter3DResult {
  isLoading: boolean;
  model: CharacterModel | null;
  playAnimation: (animationName: string) => void;
  scene: THREE.Scene | null;
}

/**
 * React hook for rendering and controlling a 3D character
 */
export function useCharacter3D({
  country,
  containerRef,
  ...options
}: UseCharacter3DProps): UseCharacter3DResult {
  const [isLoading, setIsLoading] = useState(true);
  const [model, setModel] = useState<CharacterModel | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  
  // Setup scene and load character
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Setup scene
    const newScene = setupCharacterScene(containerRef.current, options);
    setScene(newScene);
    
    // Load and render character
    const loadCharacter = async () => {
      try {
        setIsLoading(true);
        const characterModel = await renderCharacter3D(newScene, country, options);
        setModel(characterModel);
      } catch (error) {
        console.error('Failed to load character model:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCharacter();
    
    // Setup animation loop
    const animate = () => {
      if (model?.mixer) {
        const delta = clockRef.current.getDelta();
        updateAnimations(model, delta);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Remove character from scene
      if (model?.scene) {
        newScene.remove(model.scene);
      }
      
      // Remove event listeners
      window.removeEventListener('resize', () => {});
      
      // Dispose of Three.js resources
      if (containerRef.current) {
        const renderer = containerRef.current.querySelector('canvas');
        if (renderer) {
          containerRef.current.removeChild(renderer);
        }
      }
    };
  }, [containerRef, country, options]);
  
  // Function to play a specific animation
  const playCharacterAnimation = (animationName: string) => {
    if (model) {
      playAnimation(model, animationName);
    }
  };
  
  return {
    isLoading,
    model,
    playAnimation: playCharacterAnimation,
    scene,
  };
} 