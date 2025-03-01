"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Box, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GameCanvas } from "./game-canvas";
import { PlayersList } from "./players-list";
import { useCharacters } from "@/hooks/use-characters";

interface OnlinePlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  country: string;
}

export function OpenSpaceGame() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const { characters, isLoading: isLoadingCharacters } = useCharacters();
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [use3D, setUse3D] = useState(false);
  
  // Simulate fetching online players
  useEffect(() => {
    const fetchOnlinePlayers = async () => {
      try {
        // In a real implementation, this would be a WebSocket connection
        // or a polling mechanism to get real-time player data
        const mockPlayers: OnlinePlayer[] = [
          { id: "1", name: "Player1", x: 100, y: 150, country: "usa" },
          { id: "2", name: "Player2", x: 200, y: 250, country: "japan" },
          { id: "3", name: "Player3", x: 300, y: 100, country: "uk" },
          { id: "4", name: "Player4", x: 400, y: 200, country: "russia" },
          { id: "5", name: "Player5", x: 500, y: 300, country: "brazil" },
        ];
        
        setOnlinePlayers(mockPlayers);
      } catch (error) {
        console.error("Error fetching online players:", error);
        toast.error("Failed to connect to game server");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchOnlinePlayers();
    }
  }, [session]);

  // Select the first character by default if available
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(characters[0].id);
    }
  }, [characters, selectedCharacterId]);

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterId(characterId);
  };
  
  const toggleRenderMode = () => {
    setUse3D(!use3D);
    toast.info(`Switched to ${!use3D ? '3D' : '2D'} mode`);
  };

  const selectedCharacter = characters.find(char => char.id === selectedCharacterId);

  if (isLoading || isLoadingCharacters) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading game world...</span>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">No Characters Available</h2>
        <p className="text-muted-foreground mb-4">
          You need to create a character before entering the Open Space.
        </p>
        <Button asChild>
          <a href="/game/character/create">Create Character</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-3">
        <div className="relative bg-muted rounded-lg overflow-hidden">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-md">
            <Square className={`h-5 w-5 ${!use3D ? 'text-primary' : 'text-muted-foreground'}`} />
            <button 
              onClick={toggleRenderMode}
              className={`relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${use3D ? 'bg-primary' : 'bg-input'}`}
              role="switch"
              aria-checked={use3D}
            >
              <span 
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${use3D ? 'translate-x-5' : 'translate-x-0'}`} 
              />
            </button>
            <Box className={`h-5 w-5 ${use3D ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="sr-only">Toggle 3D Mode</span>
          </div>
          
          <GameCanvas 
            selectedCharacter={selectedCharacter}
            onlinePlayers={onlinePlayers}
            use3D={use3D}
          />
          
          <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
            <p>Use <kbd className="px-1 py-0.5 bg-muted rounded">W</kbd> <kbd className="px-1 py-0.5 bg-muted rounded">A</kbd> <kbd className="px-1 py-0.5 bg-muted rounded">S</kbd> <kbd className="px-1 py-0.5 bg-muted rounded">D</kbd> or arrow keys to move</p>
            <p>Click on other players to interact</p>
            {use3D && <p>Use mouse to rotate camera, scroll to zoom</p>}
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-1">
        <div className="space-y-4">
          <div className="bg-card rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Your Character</h2>
            {characters.length > 1 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Select a character:</p>
                <div className="flex flex-wrap gap-2">
                  {characters.map((character) => {
                    return (
                      <Button
                        key={character.id}
                        size="sm"
                        variant={selectedCharacterId === character.id ? "default" : "outline"}
                        onClick={() => handleCharacterSelect(character.id)}
                      >
                        {getClassName(character.country)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm">
                <p>
                  <span className="font-medium">Class:</span>{" "}
                  {selectedCharacter ? getClassName(selectedCharacter.country) : "Unknown"}
                </p>
                <p>
                  <span className="font-medium">Country:</span>{" "}
                  {selectedCharacter ? selectedCharacter.country.toUpperCase() : "Unknown"}
                </p>
              </div>
            )}
          </div>
          
          <PlayersList onlinePlayers={onlinePlayers} />
        </div>
      </div>
    </div>
  );
}

// Helper function to get class name from country
function getClassName(country: string) {
  const countryMap: Record<string, string> = {
    usa: "Gunslinger",
    japan: "Samurai",
    uk: "Knight",
    russia: "Brawler",
    brazil: "Capoeira Fighter",
  };
  
  return countryMap[country] || "Unknown";
} 