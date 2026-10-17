"use client";

import { Modal } from "@/components/ui/modal";
import { useGameStore } from "@/game/state/store";
import { StorePanel } from "./StorePanel";
import { STORE_LABEL, STORE_MODAL_MAX_PX } from "./store-button.config";

/** Existing store list, shown in the shared popup. Open state stays `storeOpen`. */
export function StoreModal() {
  const open = useGameStore((s) => s.storeOpen);
  const setOpen = useGameStore((s) => s.setStoreOpen);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title={STORE_LABEL}
      testId="store-modal"
      maxWidthPx={STORE_MODAL_MAX_PX}
    >
      <StorePanel />
    </Modal>
  );
}
