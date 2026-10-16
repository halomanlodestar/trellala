import type { Metadata } from "next";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export const metadata: Metadata = { title: "Sign in" };

const LINES = [
  { time: "09:00", text: "One queue for every deadline" },
  { time: "13:30", text: "Full timelines, not one due date" },
  { time: "18:00", text: "Several teams per hackathon" },
];

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col">
        <p className="caps text-muted-foreground">The hackathon timetable</p>
        <h1 className="mt-3 font-serif text-7xl leading-none tracking-tight italic md:text-8xl">Trellala</h1>
        <div className="mt-6 h-1 border-y border-rule" />
        <ol className="mt-2">
          {LINES.map((l) => (
            <li key={l.time} className="grid grid-cols-[4rem_1fr] items-baseline border-b py-3 text-sm">
              <span className="figures text-muted-foreground">{l.time}</span>
              <span>{l.text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <GoogleSignInButton />
        </div>
      </div>
    </main>
  );
}
