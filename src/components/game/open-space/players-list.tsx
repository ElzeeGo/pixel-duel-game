"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Users } from "lucide-react";
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

interface OnlinePlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  country: string;
}

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
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: getPlayerColor(player.country) }}
                      />
                      <span>{player.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline" className="text-xs">
                        {getClassName(player.country)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-7 px-2"
                        disabled
                      >
                        Challenge
                      </Button>
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