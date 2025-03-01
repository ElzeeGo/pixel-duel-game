# Pixel Duel Game - 3D Implementation Guide

This guide explains how to use and extend the 3D features in the Pixel Duel Game.

## Overview

The game now supports both 2D and 3D rendering modes. The 3D implementation uses Three.js to render characters and environments with realistic lighting, shadows, and animations.

## Features

- Toggle between 2D and 3D modes in the open space
- 3D character models with animations
- 3D environments with lighting and shadows
- Camera controls for exploring the 3D world
- Character movement in 3D space

## Directory Structure

```
public/
  ├── models/
  │   ├── characters/
  │   │   ├── gunslinger.glb
  │   │   ├── samurai.glb
  │   │   ├── knight.glb
  │   │   ├── brawler.glb
  │   │   └── capoeira.glb
  │   └── environments/
  │       └── duel-arena.glb
  └── textures/
      └── skybox/
          ├── px.jpg
          ├── nx.jpg
          ├── py.jpg
          ├── ny.jpg
          ├── pz.jpg
          └── nz.jpg
```

## Required 3D Models

For the 3D mode to work properly, you need to create or obtain the following GLTF/GLB models:

### Character Models

Each character model should:
- Be in GLB format
- Include at least these animations: idle, attack, victory
- Have properly named meshes (body parts should include "body" or "main" in their names for color application)
- Be properly rigged and weighted for animations
- Be oriented facing forward (negative Z direction)
- Have a reasonable polygon count (10-20k polygons recommended)

### Environment Models

The environment model should:
- Be in GLB format
- Include the arena/world geometry
- Have properly named materials for customization
- Include collision meshes if needed
- Be centered at the origin (0,0,0)

## Implementation Details

### Core Components

1. **character-renderer-3d.ts**: Utility functions for loading and rendering 3D characters
2. **use-character-3d.tsx**: React hook for using 3D characters in components
3. **character-3d.tsx**: React component for displaying a 3D character
4. **world-3d.tsx**: React component for rendering 3D environments
5. **game-canvas.tsx**: Updated to support both 2D and 3D rendering

### How to Use

#### Toggle Between 2D and 3D

In the open space, use the toggle switch in the top-right corner to switch between 2D and 3D modes.

#### Controls in 3D Mode

- **WASD/Arrow Keys**: Move character
- **Mouse Drag**: Rotate camera
- **Mouse Wheel**: Zoom in/out
- **Click on Players**: Interact with other players

#### Adding New Character Models

1. Create or obtain a GLB model with animations
2. Place it in `/public/models/characters/`
3. Update the `getModelPath` function in `game-canvas.tsx` to include the new model

```typescript
function getModelPath(country: string): string {
  const modelMap: Record<string, string> = {
    usa: '/models/characters/gunslinger.glb',
    japan: '/models/characters/samurai.glb',
    // Add your new character here
    newCountry: '/models/characters/new-character.glb',
  };
  
  return modelMap[country] || '/models/characters/default.glb';
}
```

#### Adding New Environments

1. Create or obtain a GLB model for the environment
2. Place it in `/public/models/environments/`
3. Update the environment path in the World3D component

## Performance Considerations

- Use model compression tools like gltf-pipeline to reduce file sizes
- Optimize textures (use WebP format when possible)
- Consider using Level of Detail (LOD) for complex models
- Limit the number of lights and shadows in the scene
- Use object pooling for frequently created objects
- Implement frustum culling for large environments

## Troubleshooting

### Common Issues

1. **Models not loading**: Check file paths and ensure models are in GLB format
2. **Missing textures**: Ensure textures are properly embedded in the GLB file
3. **Poor performance**: Reduce model complexity, optimize lighting, or reduce shadow quality
4. **Animation issues**: Check animation names and ensure they match what's expected in the code

### Debug Tools

Enable debug mode by adding `?debug=true` to the URL. This will show:
- FPS counter
- Scene statistics
- Model bounding boxes
- Shadow camera frustums

## Future Enhancements

- Physics-based interactions
- Particle effects for abilities
- Dynamic lighting for day/night cycles
- Procedural environment generation
- Multiplayer synchronization in 3D space
- VR support

## Credits

- Three.js: https://threejs.org/
- Model sources: [Add your model sources/credits here] 