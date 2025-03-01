import { Metadata } from "next";
import { DuelArena } from "@/components/game/duel-arena/duel-arena";

export const metadata: Metadata = {
  title: "Duel Arena | Pixel Duel",
  description: "Challenge other players to duels in Pixel Duel",
};

export default function DuelArenaPage() {
  return (
    <div className="container mx-auto py-4">
      <h1 className="text-3xl font-bold mb-4">Duel Arena</h1>
      <p className="text-muted-foreground mb-6">
        Challenge other players to duels and stake your points. The winner takes all!
      </p>
      <div className="bg-card rounded-lg p-4 shadow-sm">
        <DuelArena />
      </div>
    </div>
  );
} 