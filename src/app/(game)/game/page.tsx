import { Metadata } from "next";
import { GameDashboard } from "@/components/game/game-dashboard";

export const metadata: Metadata = {
  title: "Game Dashboard | Pixel Duel",
  description: "Your Pixel Duel game dashboard",
};

export default function GamePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Game Dashboard</h1>
      <GameDashboard />
    </div>
  );
} 