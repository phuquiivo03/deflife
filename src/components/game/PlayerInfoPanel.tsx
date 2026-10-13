"use client";

import { UserRound } from "lucide-react";
import { useGameStore } from "@/game/state/store";
import { StickerCard, StickerCardHeader } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";
import { STAGE_LABELS } from "@/lib/stage-labels";

export function PlayerInfoPanel() {
  const stage = useGameStore((s) => s.stage);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <StickerCardHeader
        title="Thông tin nhân vật"
        icon={
          <IconBadge tone="accent" floating className="icon-wiggle-on-hover">
            <UserRound className="h-4 w-4" strokeWidth={2.5} />
          </IconBadge>
        }
      />
      <StickerCard featured className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <p className="font-heading text-sm font-bold text-foreground">
          Lập trình viên {STAGE_LABELS[stage]}
        </p>
        <p className="mt-2 max-w-[260px] font-readable text-sm text-muted-foreground">
          Tiền, sức khỏe, tài sản và chỉ số sự nghiệp sẽ có ở đây ở milestone
          sau.
        </p>
      </StickerCard>
    </div>
  );
}
