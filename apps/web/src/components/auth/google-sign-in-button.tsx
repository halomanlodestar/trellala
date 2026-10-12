"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function GoogleSignInButton() {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (error) {
      toast.error(error.message ?? "Sign-in failed");
      setPending(false);
    }
  }

  return (
    <Button className="w-full" size="lg" onClick={signIn} disabled={pending}>
      <LogIn /> Continue with Google
    </Button>
  );
}
