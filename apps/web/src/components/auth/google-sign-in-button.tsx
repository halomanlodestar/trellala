"use client";

import { ArrowRight } from "lucide-react";
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
    <Button className="h-12 w-full justify-between rounded-sm px-5 text-base" size="lg" onClick={signIn} disabled={pending}>
      Continue with Google <ArrowRight />
    </Button>
  );
}
