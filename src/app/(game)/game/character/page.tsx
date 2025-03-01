import { Metadata } from "next";
import { CharacterList } from "@/components/game/character-list";

export const metadata: Metadata = {
  title: "My Characters | Pixel Duel",
  description: "View and manage your Pixel Duel characters",
};

export default function CharactersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Characters</h1>
      <CharacterList />
    </div>
  );
} 