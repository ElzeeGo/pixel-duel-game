'use client';

import { useRef, useState } from 'react';
import { useCharacter3D } from '@/hooks/use-character-3d';
import { Character3DOptions } from '@/utils/character-renderer-3d';
import { cn } from '@/lib/utils';

interface Character3DProps extends Character3DOptions {
  country: string;
  className?: string;
  height?: string | number;
  width?: string | number;
  onLoad?: () => void;
}

/**
 * 3D Character Component
 * 
 * Renders a 3D character model with animations in a container.
 * Uses Three.js for rendering and supports various animation options.
 */
export function Character3D({
  country,
  className,
  height = '300px',
  width = '100%',
  animate = true,
  shadows = true,
  controls = true,
  autoRotate = false,
  onLoad,
}: Character3DProps) {
  // Use non-null assertion to ensure TypeScript knows this ref will be assigned to a div
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentAnimation, setCurrentAnimation] = useState<string>('idle');
  
  const { isLoading, playAnimation } = useCharacter3D({
    country,
    containerRef,
    animate,
    shadows,
    controls,
    autoRotate,
  });
  
  // Play animation when currentAnimation changes
  const handleAnimationChange = (animationName: string) => {
    setCurrentAnimation(animationName);
    playAnimation(animationName);
  };
  
  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden rounded-md bg-slate-900",
          className
        )}
        style={{ height, width }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-transparent" />
        </div>
      )}
      
      {!isLoading && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          <button
            onClick={() => handleAnimationChange('idle')}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              currentAnimation === 'idle' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Idle
          </button>
          <button
            onClick={() => handleAnimationChange('attack')}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              currentAnimation === 'attack' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Attack
          </button>
          <button
            onClick={() => handleAnimationChange('victory')}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-medium",
              currentAnimation === 'victory' 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            Victory
          </button>
        </div>
      )}
    </div>
  );
} 