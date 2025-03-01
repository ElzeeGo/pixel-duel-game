"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="container mx-auto flex justify-between items-center py-4">
          <div className="flex items-center gap-8">
            <Link href="/game" className="text-2xl font-bold">
              Pixel Duel
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/game"
                className={`text-sm ${
                  pathname === "/game"
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/game/open-space"
                className={`text-sm ${
                  pathname === "/game/open-space"
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                Open Space
              </Link>
              <Link
                href="/game/duel-arena"
                className={`text-sm ${
                  pathname === "/game/duel-arena"
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                Duel Arena
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              {session?.user?.name || "Player"}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/40">
        {children}
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2023 Pixel Duel Game. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 