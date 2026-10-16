"use client";

import { useState, type ReactNode } from "react";
import { TASK_RUN } from "@/game/task-run/content";

export function Term({ id, children }: { id: string; children: ReactNode }) {
  const text = TASK_RUN.glossary[id];
  const [pinned, setPinned] = useState(false);
  if (!text) return <>{children}</>;
  return (
    <span className={pinned ? "terminal-term is-pinned" : "terminal-term"}>
      <button
        type="button"
        className="terminal-term-btn"
        aria-describedby={`tip-${id}`}
        onClick={() => setPinned((open) => !open)}
      >
        {children}
      </button>
      <span role="tooltip" id={`tip-${id}`} className="terminal-tip">
        {text}
      </span>
    </span>
  );
}
