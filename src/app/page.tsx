import { Suspense } from "react";
import { GameShell } from "@/components/game/GameShell";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-dot-grid font-heading text-lg font-extrabold text-foreground">
          Đang tải phòng của bạn…
        </div>
      }
    >
      <GameShell />
    </Suspense>
  );
}
