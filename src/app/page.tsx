import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold">Pixel Duel</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800">
          <div className="container mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6">Enter the Arena</h2>
            <p className="text-xl mb-10 max-w-2xl mx-auto">
              Create your pixelated fighter, challenge other players, and stake your points in epic duels.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="px-8">Get Started</Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="px-8">Learn More</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Create Your Fighter</h4>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Choose your country and get a unique pixelated character with special abilities.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Challenge Players</h4>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Enter the arena and challenge other fighters to duels with your points at stake.
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Win Rewards</h4>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Defeat your opponents in combat and claim their staked points as your reward.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto text-center text-zinc-600 dark:text-zinc-400">
          <p>© 2023 Pixel Duel Game. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
