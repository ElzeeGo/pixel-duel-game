import Link from "next/link";
import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | Pixel Duel",
  description: "Login to your Pixel Duel account",
};

export default function LoginPage() {
  return (
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900">
          <div className="h-full w-full bg-[url('/images/auth-bg.svg')] bg-cover bg-center opacity-20" />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center">
            Pixel Duel
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Enter the arena, stake your points, and become the ultimate pixel warrior."
            </p>
            <footer className="text-sm">Pixel Duel Team</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-8 lg:p-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Login to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials below to login to your account
            </p>
          </div>
          <LoginForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 