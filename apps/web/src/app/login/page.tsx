import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Trophy className="size-6" /> Trellala
        </div>
        <GoogleSignInButton />
      </div>
    </main>
  );
}
