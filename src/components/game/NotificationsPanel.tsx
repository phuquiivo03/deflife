"use client";

import { Bell } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StickerCard, StickerCardHeader } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";

export function NotificationsPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <StickerCardHeader
        title="Thông báo"
        icon={
          <IconBadge tone="secondary" floating className="icon-wiggle-on-hover">
            <Bell className="h-4 w-4" strokeWidth={2.5} />
          </IconBadge>
        }
      />
      <ScrollArea className="flex-1">
        <StickerCard className="flex min-h-[200px] flex-col items-center justify-center border-dashed px-4 py-10 text-center">
          <p className="text-sm font-bold text-foreground">Chưa có gì mới</p>
          <p className="mt-2 max-w-[240px] font-readable text-sm text-muted-foreground">
            Nhiệm vụ, hóa đơn và sự kiện trong game sẽ hiện ở đây khi sim phát
            triển thêm.
          </p>
        </StickerCard>
      </ScrollArea>
    </div>
  );
}
