"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Swords } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCharacters } from "@/hooks/use-characters";
import { DuelGame } from "./duel-game";

interface OnlinePlayer {
  id: string;
  name: string;
  country: string;
  characterId: string;
}

export function DuelArena() {
  const { data: session } = useSession();
  const { characters, isLoading: isLoadingCharacters } = useCharacters();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<OnlinePlayer | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(1);
  const [isDueling, setIsDueling] = useState(false);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  
  // Fetch online players and points balance
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Mock online players with different countries for variety
        const mockPlayers: OnlinePlayer[] = [
          { id: "1", name: "Gunslinger_Joe", country: "usa", characterId: "char1" },
          { id: "2", name: "SamuraiMaster", country: "japan", characterId: "char2" },
          { id: "3", name: "KnightRider", country: "uk", characterId: "char3" },
          { id: "4", name: "BrawlerBear", country: "russia", characterId: "char4" },
          { id: "5", name: "CapoeiraKing", country: "brazil", characterId: "char5" },
        ];
        
        setOnlinePlayers(mockPlayers);
        
        // Fetch points balance
        const response = await fetch("/api/user/points");
        if (response.ok) {
          const data = await response.json();
          setPointsBalance(data.pointsBalance);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to connect to game server");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session?.user) {
      fetchData();
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
  
  const handleOpponentSelect = (playerId: string) => {
    const opponent = onlinePlayers.find(p => p.id === playerId) || null;
    setSelectedOpponent(opponent);
  };
  
  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setStakeAmount(value);
    }
  };
  
  const handleStartDuel = () => {
    if (!selectedCharacterId || !selectedOpponent) {
      toast.error("Please select a character and an opponent");
      return;
    }
    
    if (!pointsBalance || pointsBalance < stakeAmount) {
      toast.error("Insufficient points for this stake");
      return;
    }
    
    // In a real implementation, this would send a challenge to the opponent
    toast.success(`Challenge sent to ${selectedOpponent.name}`);
    
    // For demo purposes, we'll simulate the opponent accepting
    setTimeout(() => {
      toast.success(`${selectedOpponent.name} accepted your challenge!`);
      setIsDueling(true);
    }, 2000);
  };
  
  const handleDuelComplete = (isWinner: boolean) => {
    setIsDueling(false);
    
    if (isWinner) {
      toast.success("You won the duel!");
      // Update points balance (in a real implementation, this would be done via API)
      setPointsBalance((prev) => (prev !== null ? prev + stakeAmount : null));
    } else {
      toast.error("You lost the duel!");
      // Update points balance
      setPointsBalance((prev) => (prev !== null ? prev - stakeAmount : null));
    }
    
    setSelectedOpponent(null);
  };
  
  const selectedCharacter = characters.find(char => char.id === selectedCharacterId);
  
  if (isLoading || isLoadingCharacters) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading duel arena...</span>
      </div>
    );
  }
  
  if (characters.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">No Characters Available</h2>
        <p className="text-muted-foreground mb-4">
          You need to create a character before entering the Duel Arena.
        </p>
        <Button asChild>
          <a href="/game/character/create">Create Character</a>
        </Button>
      </div>
    );
  }
  
  if (isDueling && selectedOpponent && selectedCharacter) {
    return (
      <DuelGame
        playerCharacter={{
          id: selectedCharacter.id,
          name: session?.user?.name || "You",
          country: selectedCharacter.country,
          spriteData: selectedCharacter.spriteData
        }}
        opponentCharacter={{
          id: selectedOpponent.characterId,
          name: selectedOpponent.name,
          country: selectedOpponent.country,
        }}
        stakeAmount={stakeAmount}
        onComplete={handleDuelComplete}
      />
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Available Opponents</CardTitle>
            <CardDescription>
              Select an opponent to challenge to a duel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onlinePlayers.length === 0 ? (
              <p className="text-muted-foreground">No players available for dueling</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onlinePlayers.map((player) => (
                  <Card key={player.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span>{player.name}</span>
                        <Badge>{player.country.toUpperCase()}</Badge>
                      </CardTitle>
                      <CardDescription>
                        {getClassName(player.country)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                          <div className="text-2xl">{getCharacterEmoji(player.country)}</div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Ready for battle
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/50 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full" 
                            onClick={() => handleOpponentSelect(player.id)}
                          >
                            <Swords className="mr-2 h-4 w-4" />
                            Challenge
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Challenge {player.name}</DialogTitle>
                            <DialogDescription>
                              Set the stake amount for this duel. The winner takes all!
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="character">Your Character</Label>
                              <Select
                                value={selectedCharacterId || ""}
                                onValueChange={handleCharacterSelect}
                              >
                                <SelectTrigger id="character">
                                  <SelectValue placeholder="Select a character" />
                                </SelectTrigger>
                                <SelectContent>
                                  {characters.map((character) => (
                                    <SelectItem key={character.id} value={character.id}>
                                      {getClassName(character.country)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="stake">Stake Amount</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  id="stake"
                                  type="number"
                                  min={1}
                                  max={pointsBalance || 1}
                                  value={stakeAmount}
                                  onChange={handleStakeChange}
                                />
                                <span className="text-sm text-muted-foreground">
                                  / {pointsBalance} points
                                </span>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleStartDuel}>
                              Start Duel
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Your Duelist</CardTitle>
            <CardDescription>
              Select a character for battle
            </CardDescription>
          </CardHeader>
          <CardContent>
            {characters.length > 1 ? (
              <div className="space-y-4">
                <Label>Select Character</Label>
                <Select
                  value={selectedCharacterId || ""}
                  onValueChange={handleCharacterSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a character" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((character) => (
                      <SelectItem key={character.id} value={character.id}>
                        {getClassName(character.country)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                  <div className="text-4xl">
                    {selectedCharacter ? getCharacterEmoji(selectedCharacter.country) : "👾"}
                  </div>
                </div>
                <div>
                  <p className="font-medium">
                    {selectedCharacter ? getClassName(selectedCharacter.country) : "Unknown"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCharacter ? selectedCharacter.country.toUpperCase() : ""}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <div>
              <p className="text-sm font-medium">Points Balance</p>
              <p className="text-2xl font-bold">{pointsBalance}</p>
            </div>
            <Button variant="outline" asChild>
              <a href="/game/character">Manage Characters</a>
            </Button>
          </CardFooter>
        </Card>
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

// Helper function to get emoji for character type
function getCharacterEmoji(country: string) {
  const emojiMap: Record<string, string> = {
    usa: "🤠",
    japan: "⛩️",
    uk: "🛡️",
    russia: "🐻",
    brazil: "🥋",
  };
  
  return emojiMap[country] || "👾";
} 