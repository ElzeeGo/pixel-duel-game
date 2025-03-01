"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { CharacterPreview } from "./character-preview";

// Define available countries and their classes
const COUNTRIES = [
  { id: "usa", name: "USA", className: "Gunslinger" },
  { id: "japan", name: "Japan", className: "Samurai" },
  { id: "uk", name: "United Kingdom", className: "Knight" },
  { id: "russia", name: "Russia", className: "Brawler" },
  { id: "brazil", name: "Brazil", className: "Capoeira Fighter" },
];

export function CharacterCreationForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's points balance
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
        toast.error("Failed to fetch points balance");
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchPointsBalance();
    }
  }, [session]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
  };

  const handleCreateCharacter = async () => {
    if (!selectedCountry) {
      toast.error("Please select a country");
      return;
    }

    if (!pointsBalance || pointsBalance < 1) {
      toast.error("Insufficient points to create a character");
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch("/api/character/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: selectedCountry,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create character");
      }

      const data = await response.json();
      toast.success("Character created successfully!");
      
      // Update local points balance
      setPointsBalance((prev) => (prev !== null ? prev - 1 : null));
      
      // Redirect to character page or game dashboard
      router.push("/game");
      router.refresh();
    } catch (error) {
      console.error("Error creating character:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create character");
    } finally {
      setIsCreating(false);
    }
  };

  const selectedCountryData = COUNTRIES.find((c) => c.id === selectedCountry);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Alert variant={pointsBalance && pointsBalance >= 1 ? "default" : "destructive"}>
            <AlertTitle>Character Creation Cost: 1 Point</AlertTitle>
            <AlertDescription>
              Your current balance: {pointsBalance} points
              {pointsBalance && pointsBalance < 1 && (
                <p className="font-semibold mt-1">
                  You don't have enough points to create a character.
                </p>
              )}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Your Country</CardTitle>
                <CardDescription>
                  Your country determines your character class and abilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedCountry}
                  onValueChange={handleCountryChange}
                  disabled={isCreating || !pointsBalance || pointsBalance < 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name} ({country.className})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Character Preview</CardTitle>
                <CardDescription>
                  {selectedCountryData
                    ? `${selectedCountryData.name} - ${selectedCountryData.className}`
                    : "Select a country to see your character"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                {selectedCountry ? (
                  <CharacterPreview country={selectedCountry} size={128} animate={true} />
                ) : (
                  <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                    No preview
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleCreateCharacter}
              disabled={
                isCreating ||
                !selectedCountry ||
                !pointsBalance ||
                pointsBalance < 1
              }
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Character (Cost: 1 Point)
            </Button>
          </div>
        </>
      )}
    </div>
  );
} 