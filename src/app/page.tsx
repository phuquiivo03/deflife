import { Suspense } from "react";
import { GameShell } from "@/components/game/GameShell";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#15111c] text-zinc-200">
          Loading your room…
        </div>
      }
    >
      <GameShell />
    </Suspense>
  );
}
