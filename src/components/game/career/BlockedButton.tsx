"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function BlockedButton({
  label,
  reason,
  testId,
}: {
  label: string;
  reason: string;
  testId: string;
}) {
  const [shake, setShake] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        showArrow={false}
        variant="outline"
        aria-disabled
        data-testid={testId}
        title={reason}
        className={shake ? "btn-shake" : undefined}
        onClick={() => {
          setShake(false);
          requestAnimationFrame(() => setShake(true));
        }}
        onAnimationEnd={() => setShake(false)}
      >
        {label}
      </Button>
      <span className="max-w-40 text-right font-galmuri-7 text-galmuri-small text-[var(--accent-coral)]">
        {reason}
      </span>
    </div>
  );
}
