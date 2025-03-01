"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users, Bot, Shield, Sword } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { OnlinePlayer } from "@/types/game";
import { Progress } from "@/components/ui/progress";

interface PlayersListProps {
  onlinePlayers: OnlinePlayer[];
}

export function PlayersList({ onlinePlayers }: PlayersListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-muted-foreground" />
            <CardTitle className="text-lg">Online Players</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={toggleExpanded}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isExpanded ? "Collapse" : "Expand"}
            </span>
          </Button>
        </div>
        <CardDescription>
          {onlinePlayers.length} player{onlinePlayers.length !== 1 && "s"} online
          {" • "}
          {onlinePlayers.filter(p => p.isNPC).length} NPC{onlinePlayers.filter(p => p.isNPC).length !== 1 && "s"}
        </CardDescription>
      </CardHeader>
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-0">
            {onlinePlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No other players online
              </p>
            ) : (
              <ul className="space-y-2">
                {onlinePlayers.map((player) => (
                  <li
                    key={player.id}
                    className={cn(
                      "flex flex-col p-2 rounded-md hover:bg-muted",
                      player.isDead && "opacity-50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: getPlayerColor(player.country) }}
                        />
                        <span className="flex items-center">
                          {player.name}
                          {player.isNPC && (
                            <Bot className="h-3 w-3 ml-1 text-muted-foreground" />
                          )}
                          {player.isDead && (
                            <span className="ml-2 text-xs text-red-500">
                              (Dead)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="text-xs">
                          {getClassName(player.country)}
                        </Badge>
                        {player.isAttacking && (
                          <Sword className="h-3 w-3 ml-1 text-red-500" />
                        )}
                        {player.isDefending && (
                          <Shield className="h-3 w-3 ml-1 text-blue-500" />
                        )}
                        {!player.isNPC && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-7 px-2"
                            disabled={player.isDead}
                          >
                            Challenge
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Health bar */}
                    <div className="mt-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span>HP: {player.health}/{player.maxHealth}</span>
                        <span>Points: {player.points}</span>
                      </div>
                      <Progress 
                        value={(player.health / player.maxHealth) * 100} 
                        className="h-1.5"
                        indicatorClassName={cn(
                          player.health > 60 ? "bg-green-500" :
                          player.health > 30 ? "bg-yellow-500" :
                          "bg-red-500"
                        )}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

// Helper function to get color based on country
function getPlayerColor(country: string): string {
  const colorMap: Record<string, string> = {
    usa: '#3b82f6', // blue
    japan: '#ef4444', // red
    uk: '#6366f1', // indigo
    russia: '#a855f7', // purple
    brazil: '#22c55e', // green
  };
  
  return colorMap[country] || '#9ca3af'; // gray as fallback
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