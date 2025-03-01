import { Metadata } from "next";
import { CharacterCreationForm } from "@/components/game/character-creation-form";

export const metadata: Metadata = {
  title: "Create Character | Pixel Duel",
  description: "Create your character for Pixel Duel",
};

export default function CreateCharacterPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create Your Character</h1>
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg p-6 shadow-sm">
          <CharacterCreationForm />
        </div>
      </div>
    </div>
  );
} 