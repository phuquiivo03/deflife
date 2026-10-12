import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DebugCanvas } from "./DebugCanvas";

export default function DebugPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return (
    <Suspense fallback={<div className="text-white">Loading…</div>}>
      <DebugCanvas />
    </Suspense>
  );
}
