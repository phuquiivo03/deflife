import { Suspense } from "react";
import { GameShell } from "@/components/game/GameShell";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-galmuri-11 text-galmuri-title text-white">
          Đang tải phòng của bạn…
        </div>
      }
    >
      <GameShell />
    </Suspense>
  );
}
