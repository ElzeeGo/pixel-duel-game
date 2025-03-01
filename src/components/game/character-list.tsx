"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { renderCharacter } from "@/utils/character-renderer";

interface Character {
  id: string;
  spriteData: string;
  country: string;
  createdAt: string;
}

export function CharacterList() {
  const { data: session } = useSession();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCharacters() {
      try {
        const response = await fetch("/api/character/list");
        if (response.ok) {
          const data = await response.json();
          setCharacters(data.characters);
        } else {
          toast.error("Failed to fetch characters");
        }
      } catch (error) {
        console.error("Error fetching characters:", error);
        toast.error("Failed to fetch characters");
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchCharacters();
    }
  }, [session]);

  // Function to parse sprite data
  const parseSpriteData = (spriteDataString: string) => {
    try {
      return JSON.parse(spriteDataString);
    } catch (error) {
      console.error("Error parsing sprite data:", error);
      return {};
    }
  };

  // Function to get country class name
  const getClassName = (country: string) => {
    const countryMap: Record<string, string> = {
      usa: "Gunslinger",
      japan: "Samurai",
      uk: "Knight",
      russia: "Brawler",
      brazil: "Capoeira Fighter",
    };
    
    return countryMap[country] || "Unknown";
  };

  // Function to get weapon name
  const getWeaponName = (weaponType: number) => {
    const weapons = ["Knife", "Axe", "Battleaxe", "Sword"];
    return weapons[weaponType] || "Unknown";
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {characters.length === 0
                  ? "No characters yet"
                  : `You have ${characters.length} character${
                      characters.length === 1 ? "" : "s"
                    }`}
              </h2>
            </div>
            <Button asChild>
              <Link href="/game/character/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Character
              </Link>
            </Button>
          </div>

          {characters.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Characters Found</CardTitle>
                <CardDescription>
                  Create your first character to start playing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Characters cost 1 point to create. Each character has unique
                  abilities based on their country of origin.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href="/game/character/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Character
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character) => {
                const spriteData = parseSpriteData(character.spriteData);
                return (
                  <Card key={character.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{getClassName(character.country)}</span>
                        <Badge>{character.country.toUpperCase()}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Created on{" "}
                        {new Date(character.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center relative">
                          <CharacterCanvas country={character.country} />
                        </div>
                        <div>
                          <p>
                            <span className="font-medium">Weapon:</span>{" "}
                            {getWeaponName(spriteData.weaponType)}
                          </p>
                          <p>
                            <span className="font-medium">Color:</span>{" "}
                            {spriteData.baseColor}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" disabled>
                        Select for Battle
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Character canvas component for rendering characters in the list
function CharacterCanvas({ country }: { country: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw character
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const characterSize = 24; // Smaller size for the list view
    
    renderCharacter(ctx, centerX, centerY, country, characterSize, {
      useGradient: true,
      useShadows: true,
      animate: false
    });
  }, [country]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={64} 
      height={64} 
      className="w-full h-full"
    />
  );
} 