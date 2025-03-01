import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Authentication | Pixel Duel",
    template: "%s | Pixel Duel",
  },
  description: "Authentication for Pixel Duel game",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
} 