"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Button } from "@/components/ui/button";

export function ModelTest() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Function to test loading a specific model
  const testLoadModel = (modelPath: string) => {
    if (!containerRef.current) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    
    // Create camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add ground
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Load model
    console.log(`Testing model load: ${modelPath}`);
    const loader = new GLTFLoader();
    
    // Add loading indicator
    const loadingElem = document.createElement('div');
    loadingElem.style.position = 'absolute';
    loadingElem.style.top = '50%';
    loadingElem.style.left = '50%';
    loadingElem.style.transform = 'translate(-50%, -50%)';
    loadingElem.style.color = 'white';
    loadingElem.style.fontSize = '16px';
    loadingElem.textContent = 'Loading model...';
    containerRef.current.appendChild(loadingElem);
    
    loader.load(
      modelPath,
      (gltf) => {
        console.log('Model loaded successfully:', gltf);
        
        // Remove loading indicator
        if (loadingElem.parentNode) {
          loadingElem.parentNode.removeChild(loadingElem);
        }
        
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        
        // Enable shadows
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        
        // Center camera on model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Adjust camera position based on model size
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
        
        // Set camera to look at center of model
        camera.position.set(center.x, center.y + (size.y / 2), center.z + cameraZ * 1.5);
        camera.lookAt(center);
        controls.target.copy(center);
      },
      (xhr) => {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        loadingElem.textContent = `Loading: ${Math.round(percentComplete)}%`;
        console.log(`${Math.round(percentComplete)}% loaded`);
      },
      (error) => {
        console.error('Error loading model:', error);
        loadingElem.textContent = `Error loading model: ${error.message}`;
      }
    );
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => testLoadModel('/models/characters/gunslinger.glb')}>
          Test Gunslinger
        </Button>
        <Button onClick={() => testLoadModel('/models/characters/samurai.glb')}>
          Test Samurai
        </Button>
        <Button onClick={() => testLoadModel('/models/characters/knight.glb')}>
          Test Knight
        </Button>
        <Button onClick={() => testLoadModel('/models/characters/brawler.glb')}>
          Test Brawler
        </Button>
        <Button onClick={() => testLoadModel('/models/characters/capoeira.glb')}>
          Test Capoeira
        </Button>
        <Button onClick={() => testLoadModel('/models/characters/default.glb')}>
          Test Default
        </Button>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-[400px] bg-muted rounded-lg overflow-hidden relative"
      />
      
      <div className="text-sm text-muted-foreground">
        <p>This component tests loading 3D models directly. Check the browser console for detailed loading information.</p>
      </div>
    </div>
  );
} 