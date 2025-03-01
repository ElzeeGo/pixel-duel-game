# Character Models

This directory is intended for 3D character models used in the game.

## Current Implementation

Instead of using external 3D model files, the game currently generates character models programmatically using Three.js. This approach has several advantages:

1. **No external dependencies**: The game doesn't need to load external model files, which can be slow and may fail.
2. **Consistent styling**: All characters share a consistent visual style.
3. **Smaller bundle size**: No need to include large model files in the game bundle.
4. **Easier customization**: Character appearance can be easily modified through code.

## How It Works

The character models are created in `/src/utils/character-models.ts`. Each character type (based on country) has a unique appearance with distinctive features:

- **USA (Gunslinger)**: Cowboy hat, gun, and western-style vest
- **Japan (Samurai)**: Helmet with face mask, katana, and armor
- **UK (Knight)**: Metal helmet with visor, shield, and sword
- **Russia (Brawler)**: Ushanka hat, muscular build, and large fists
- **Brazil (Capoeira)**: Headband, athletic build, and distinctive stance

## Adding External Models

If you want to use external 3D models instead of the programmatically generated ones:

1. Place your GLB/GLTF files in this directory
2. Update the `getModelPath` function in `game-canvas.tsx` to point to your model files
3. Modify the `loadPlayerModel` and `loadOtherPlayerModel` functions to use the GLTFLoader

## Model Requirements

If adding external models, ensure they meet these requirements:

- Format: GLB or GLTF (GLB preferred for smaller file size)
- Animations: Include at least idle, walk, and attack animations
- Scale: Models should be properly scaled (around 1 unit tall)
- Optimization: Keep polygon count reasonable for web performance
- Textures: Use optimized textures (preferably a single texture atlas)

## Backup Directory

The `backup` directory contains placeholder GLB files that were previously used. These are kept for reference but are not currently used by the game. 