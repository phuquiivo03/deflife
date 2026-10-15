import { Suspense } from "react";
import { GameShell } from "@/components/game/GameShell";
import { listUiIconFiles } from "@/lib/ui-icon-files";

export default function Home() {
  const iconFiles = listUiIconFiles();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center font-galmuri-11 text-galmuri-title text-white">
          Đang tải phòng của bạn…
        </div>
      }
    >
      <GameShell iconFiles={iconFiles} />
    </Suspense>
  );
}
