"use client";

import { useEffect, useRef } from "react";
import { renderCharacter } from "@/utils/character-renderer";

interface CharacterPreviewProps {
  country: string;
  size?: number;
  animate?: boolean;
}

export function CharacterPreview({ country, size = 128, animate = false }: CharacterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !country) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw character based on country
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const characterSize = size / 2;
    
    // Use the shared character renderer
    renderCharacter(ctx, centerX, centerY, country, characterSize, {
      useGradient: true,
      useShadows: true,
      animate
    });
    
    // If animation is enabled, create an animation loop
    if (animate) {
      let animationFrame: number;
      
      const animateCharacter = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderCharacter(ctx, centerX, centerY, country, characterSize, {
          useGradient: true,
          useShadows: true,
          animate: true
        });
        animationFrame = requestAnimationFrame(animateCharacter);
      };
      
      animationFrame = requestAnimationFrame(animateCharacter);
      
      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }
  }, [country, size, animate]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size} 
      className="bg-muted rounded-md"
    />
  );
}

// Helper function to get color based on country
function getPlayerColor(country: string): string {
  const colorMap: Record<string, string> = {
    usa: '#3b82f6', // blue
    japan: '#ef4444', // red
    uk: '#6366f1', // indigo
    russia: '#a855f7', // purple
    brazil: '#22c55e', // green
  };
  
  return colorMap[country] || '#9ca3af'; // gray as fallback
} 