'use client';

import { useState } from 'react';
import { Character3D } from '@/components/character/character-3d';
import { World3D } from '@/components/world/world-3d';

/**
 * 3D Demo Page
 * 
 * This page demonstrates the 3D capabilities of the game,
 * showing characters and environments with animations.
 */
export default function ThreeDDemoPage() {
  const [selectedCountry, setSelectedCountry] = useState<string>('usa');
  const countries = ['usa', 'japan', 'uk', 'russia', 'brazil'];
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Pixel Duel 3D Demo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 3D World Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">3D World</h2>
          <p className="text-muted-foreground">
            Explore the 3D environment where duels take place. Use your mouse to rotate and zoom.
          </p>
          
          <World3D 
            height={400} 
            className="border border-border shadow-lg"
          />
        </div>
        
        {/* 3D Character Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">3D Characters</h2>
          <p className="text-muted-foreground">
            Select a character and see their animations. Each character has unique abilities and styles.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {countries.map((country) => (
              <button
                key={country}
                onClick={() => setSelectedCountry(country)}
                className={`px-4 py-2 rounded-md capitalize ${
                  selectedCountry === country
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
          
          <Character3D
            country={selectedCountry}
            height={400}
            className="border border-border shadow-lg"
            controls={true}
            autoRotate={false}
          />
        </div>
      </div>
      
      {/* Features Section */}
      <div className="mt-16 space-y-8">
        <h2 className="text-2xl font-semibold text-center">New 3D Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">Realistic Animations</h3>
            <p className="text-card-foreground">
              Characters now have fluid, realistic animations for attacks, movements, and victory poses.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">Immersive Environments</h3>
            <p className="text-card-foreground">
              Battle in detailed 3D environments with dynamic lighting, shadows, and atmospheric effects.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-medium mb-2">Interactive Camera</h3>
            <p className="text-card-foreground">
              Control the camera to view the action from any angle, zoom in for close-ups, or pan out for a strategic view.
            </p>
          </div>
        </div>
      </div>
      
      {/* Technical Notes */}
      <div className="mt-16 bg-muted p-6 rounded-lg">
        <h3 className="text-xl font-medium mb-4">Technical Implementation Notes</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>3D Models:</strong> Place GLTF/GLB models in the <code>/public/models/</code> directory.
          </li>
          <li>
            <strong>Animations:</strong> Each character model should include idle, attack, and victory animations.
          </li>
          <li>
            <strong>Environments:</strong> Environment models should be placed in <code>/public/models/environments/</code>.
          </li>
          <li>
            <strong>Skybox:</strong> Skybox textures should be placed in <code>/public/textures/skybox/</code> with px, nx, py, ny, pz, nz naming convention.
          </li>
        </ul>
      </div>
    </div>
  );
} 