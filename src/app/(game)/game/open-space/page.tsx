import { Metadata } from "next";
import { OpenSpaceGame } from "@/components/game/open-space/open-space-game";

export const metadata: Metadata = {
  title: "Open Space | Pixel Duel",
  description: "Explore the open world of Pixel Duel",
};

export default function OpenSpacePage() {
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-4">Open Space</h1>
      <p className="text-muted-foreground mb-6">
        Explore the world and interact with other players. Use WASD or arrow keys to move.
      </p>
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <OpenSpaceGame />
      </div>
    </div>
  );
} 