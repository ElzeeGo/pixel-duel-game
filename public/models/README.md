# 3D Models Directory

This directory contains the 3D models used in the game.

## Structure

- `characters/`: Character models for each class (gunslinger, samurai, knight, brawler, capoeira)
- `environments/`: Environment models for different game areas

## Model Requirements

### Character Models

Each character model should:
- Be in GLB format
- Include animations: idle, attack, victory
- Have properly named meshes (body parts should include "body" or "main" in their names)
- Be properly rigged and weighted for animations
- Be oriented facing forward (negative Z direction)

### Environment Models

Environment models should:
- Be in GLB format
- Include the arena/world geometry
- Have properly named materials
- Be centered at the origin (0,0,0)

## Placeholder Models

Until you add your own models, the game will display placeholder shapes or may not render properly in 3D mode.

## Recommended Tools

- Blender: For creating and editing 3D models
- glTF Tools: For optimizing and validating models
- Three.js Editor: For previewing models before importing

## Resources

- [Three.js Model Viewer](https://threejs.org/editor/)
- [Blender glTF Exporter Guide](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
- [glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models) 