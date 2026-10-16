"use client";

import type { ReactNode } from "react";
import { CHAMFER_LAYERS, chamferClipStyle, scaledChamfer } from "@/lib/chamfer-frame";

/** Side panels stay at the room's design scale so bevel thickness matches the canvas frame. */
const SCALE = 1;

const LAYER_CLASS = "flex min-h-0 flex-1 flex-col";

type LayerProps = {
  layer: keyof typeof CHAMFER_LAYERS;
  className: string;
  children: ReactNode;
};

function PanelChamferLayer({ layer, className, children }: LayerProps) {
  const { corner, padding } = scaledChamfer(CHAMFER_LAYERS[layer], SCALE);
  return (
    <div
      className={`${LAYER_CLASS} ${className}`}
      style={{
        ...chamferClipStyle(corner),
        padding: padding > 0 ? `${padding}px` : undefined,
      }}
    >
      {children}
    </div>
  );
}

export function PanelChamferFrame({ children }: { children: ReactNode }) {
  const f5 = scaledChamfer(CHAMFER_LAYERS.f5, SCALE);

  return (
    <div className="panel-frame-glow flex h-full min-h-0 w-full flex-1 flex-col">
      <PanelChamferLayer layer="f1" className="panel-frame-f1">
        <PanelChamferLayer layer="f2" className="panel-frame-f2">
          <PanelChamferLayer layer="f3" className="panel-frame-f3">
            <div
              className={`${LAYER_CLASS} panel-frame-well relative overflow-hidden`}
              style={chamferClipStyle(f5.corner)}
            >
              {children}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: "inset 0 4px 10px rgba(0, 0, 0, 0.5)" }}
                aria-hidden
              />
            </div>
          </PanelChamferLayer>
        </PanelChamferLayer>
      </PanelChamferLayer>
    </div>
  );
}
