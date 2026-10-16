"use client";

import type { ReactNode } from "react";

export function TerminalWindow({
  status,
  children,
}: {
  status: string;
  children: ReactNode;
}) {
  return (
    <div className="terminal-root flex h-full min-h-0 flex-col" data-testid="task-terminal">
      <div className="terminal-titlebar">
        <span className="terminal-lights" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span>dev@devlife: ~/tasks</span>
        <span className="terminal-nav">
          <span className="is-here">~/tasks</span>
          <span>~/skills</span>
          <span>~/inbox</span>
          <span className="terminal-blip">{status}</span>
        </span>
      </div>
      <div className="terminal-body min-h-0 flex-1">{children}</div>
    </div>
  );
}
