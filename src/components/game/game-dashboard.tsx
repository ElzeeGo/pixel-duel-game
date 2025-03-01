"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function GameDashboard() {
  const { data: session } = useSession();
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCharacters, setHasCharacters] = useState(false);

  useEffect(() => {
    async function fetchPointsBalance() {
      try {
        const response = await fetch("/api/user/points");
        if (response.ok) {
          const data = await response.json();
          setPointsBalance(data.pointsBalance);
        }
      } catch (error) {
        console.error("Failed to fetch points balance:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function checkCharacters() {
      try {
        const response = await fetch("/api/character/list");
        if (response.ok) {
          const data = await response.json();
          setHasCharacters(data.characters.length > 0);
        }
      } catch (error) {
        console.error("Failed to check characters:", error);
      }
    }

    if (session?.user) {
      fetchPointsBalance();
      checkCharacters();
    }
  }, [session]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Player Profile</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Username:</span>{" "}
            {session?.user?.name || "Unknown"}
          </p>
          <p>
            <span className="font-medium">Points Balance:</span>{" "}
            {isLoading ? "Loading..." : pointsBalance}
          </p>
        </div>
        <div className="mt-6 space-y-2">
          <Button asChild className="w-full">
            <Link href="/game/character">
              {hasCharacters ? "Manage Characters" : "Create Character"}
            </Link>
          </Button>
          {!hasCharacters && (
            <p className="text-sm text-muted-foreground">
              You need to create a character to play the game. It costs 1 point.
            </p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Game Options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col" 
            disabled={!hasCharacters}
            asChild={hasCharacters}
          >
            <Link href={hasCharacters ? "/game/open-space" : "#"}>
              <span className="text-lg">Open Space</span>
              <span className="text-xs text-muted-foreground">
                Explore the world
              </span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col" 
            disabled={!hasCharacters}
            asChild={hasCharacters}
          >
            <Link href={hasCharacters ? "/game/duel-arena" : "#"}>
              <span className="text-lg">Duel Arena</span>
              <span className="text-xs text-muted-foreground">
                Challenge players
              </span>
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col"
            asChild
          >
            <Link href="/game/leaderboard">
              <span className="text-lg">Leaderboard</span>
              <span className="text-xs text-muted-foreground">
                View top players
              </span>
            </Link>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col" disabled>
            <span className="text-lg">Shop</span>
            <span className="text-xs text-muted-foreground">
              Buy game items
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
} 