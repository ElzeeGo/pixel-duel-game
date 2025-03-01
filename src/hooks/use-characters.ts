"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Character {
  id: string;
  spriteData: string;
  country: string;
  createdAt: string;
}

interface UseCharactersReturn {
  characters: Character[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useCharacters(): UseCharactersReturn {
  const { data: session } = useSession();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCharacters = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/character/list");
      
      if (!response.ok) {
        throw new Error("Failed to fetch characters");
      }
      
      const data = await response.json();
      setCharacters(data.characters);
    } catch (err) {
      console.error("Error fetching characters:", err);
      setError(err instanceof Error ? err : new Error("An unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [session]);

  return {
    characters,
    isLoading,
    error,
    refetch: fetchCharacters,
  };
} 