/**
 * Character Renderer Utility
 * 
 * This utility provides functions for rendering game characters consistently
 * across different components (character creation, open space, duel arena).
 */

// Helper function to get color based on country
export function getPlayerColor(country: string): string {
  const colorMap: Record<string, string> = {
    usa: '#0055ff', // brighter blue
    japan: '#ff2222', // brighter red
    uk: '#5533ff', // brighter indigo
    russia: '#aa22ff', // brighter purple
    brazil: '#00dd33', // brighter green
  };
  
  return colorMap[country] || '#9ca3af'; // gray as fallback
}

/**
 * Renders a character on a canvas context
 */
export function renderCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  country: string,
  size: number,
  options: {
    useGradient?: boolean;
    useShadows?: boolean;
    animate?: boolean;
  } = {}
) {
  const { useGradient = true, useShadows = true, animate = false } = options;
  
  // Reset shadow and transform
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  
  // Draw body with gradient or solid color
  if (useGradient) {
    const bodyGradient = ctx.createRadialGradient(x, y, size / 4, x, y, size / 2);
    bodyGradient.addColorStop(0, getPlayerColor(country));
    bodyGradient.addColorStop(1, "#000000");
    ctx.fillStyle = bodyGradient;
  } else {
    ctx.fillStyle = getPlayerColor(country);
  }
  
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw character details based on country
  switch(country) {
    case 'usa': // Gunslinger
      // Draw hat
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x - size/3, y - size/3, size*2/3, size/6);
      ctx.fillRect(x - size/4, y - size/3 - size/8, size/2, size/8);
      
      if (useShadows) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 5;
      }
      
      // Draw gun
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(x + size/4, y, size/3, size/8);
      break;
      
    case 'japan': // Samurai
      // Draw helmet
      ctx.fillStyle = '#111827';
      ctx.fillRect(x - size/3, y - size/4, size*2/3, size/6);
      
      if (useShadows) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 5;
      }
      
      // Draw sword
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(x + size/4, y - size/8, size/2, size/12);
      ctx.fillRect(x + size/4, y, size/8, size/4);
      break;
      
    case 'uk': // Knight
      // Draw helmet
      ctx.fillStyle = '#374151';
      ctx.fillRect(x - size/3, y - size/4, size*2/3, size/6);
      
      if (useShadows) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 5;
      }
      
      // Draw shield
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x - size/2, y, size/4, size/3);
      ctx.strokeStyle = '#f8fafc';
      ctx.strokeRect(x - size/2, y, size/4, size/3);
      break;
      
    case 'russia': // Brawler
      // Draw ushanka hat
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x - size/3, y - size/3, size*2/3, size/6);
      ctx.fillRect(x - size/2, y - size/4, size/6, size/6);
      ctx.fillRect(x + size/3, y - size/4, size/6, size/6);
      
      if (useShadows) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 5;
      }
      
      // Draw fists
      ctx.fillStyle = '#f8d8b9';
      ctx.beginPath();
      ctx.arc(x - size/2, y, size/6, 0, Math.PI * 2);
      ctx.arc(x + size/2, y, size/6, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'brazil': // Capoeira Fighter
      // Draw headband
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x - size/3, y - size/4, size*2/3, size/8);
      
      if (useShadows) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 5;
      }
      
      // Draw leg in kick position
      ctx.fillStyle = '#4b5563';
      ctx.save();
      ctx.translate(x, y);
      
      // Add animation if enabled
      if (animate) {
        const angle = Math.PI / 4 + Math.sin(Date.now() / 200) * 0.2;
        ctx.rotate(angle);
      } else {
        ctx.rotate(Math.PI / 4);
      }
      
      ctx.fillRect(0, 0, size/2, size/8);
      ctx.restore();
      break;
  }
  
  // Reset shadow for face
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  
  // Draw face (simple eyes)
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(x - size/6, y - size/8, size/16, 0, Math.PI * 2);
  ctx.arc(x + size/6, y - size/8, size/16, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw mouth (simple smile)
  ctx.beginPath();
  ctx.arc(x, y + size/8, size/12, 0, Math.PI);
  ctx.stroke();
} 