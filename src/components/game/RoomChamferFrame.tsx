"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  CHAMFER_LAYERS,
  chamferClipStyle,
  chamferScale,
  scaledChamfer,
} from "@/lib/chamfer-frame";

type LayerProps = {
  layer: keyof typeof CHAMFER_LAYERS;
  scale: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

function ChamferLayer({ layer, scale, className, style, children }: LayerProps) {
  const { corner, padding } = scaledChamfer(CHAMFER_LAYERS[layer], scale);
  return (
    <div
      className={className}
      style={{
        ...chamferClipStyle(corner),
        padding: padding > 0 ? `${padding}px` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type Props = {
  areaRef: React.RefObject<HTMLDivElement | null>;
  roomAreaStyle: CSSProperties | undefined;
  label: ReactNode;
  children: ReactNode;
};

export function RoomChamferFrame({
  areaRef,
  roomAreaStyle,
  label,
  children,
}: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      measureRef.current = node;
      areaRef.current = node;
    },
    [areaRef],
  );

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const update = () => setScale(chamferScale(el.clientWidth));
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, []);

  const f5 = scaledChamfer(CHAMFER_LAYERS.f5, scale);
  const plate = scaledChamfer(CHAMFER_LAYERS.plate, scale);

  return (
    <div className="flex w-full flex-col items-center">
      <div className="room-frame-glow w-max max-w-full">
        <ChamferLayer layer="f1" scale={scale} className="chamfer-frame-f1">
          <ChamferLayer layer="f2" scale={scale} className="chamfer-frame-f2">
            <ChamferLayer layer="f3" scale={scale} className="chamfer-frame-f3">
              <ChamferLayer layer="f4" scale={scale} className="chamfer-frame-f4">
                <div
                  className="chamfer-frame-f5 relative"
                  style={chamferClipStyle(f5.corner)}
                >
                  <div
                    ref={setRefs}
                    className="flex w-full items-center justify-center overflow-hidden"
                    style={roomAreaStyle}
                  >
                    {children}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      boxShadow: `inset 0 ${4 * scale}px ${10 * scale}px rgba(0, 0, 0, 0.5)`,
                    }}
                    aria-hidden
                  />
                </div>
              </ChamferLayer>
            </ChamferLayer>
          </ChamferLayer>
        </ChamferLayer>
      </div>

      <div className="room-frame-glow mt-2.5 w-max max-w-full">
        <div
          className="chamfer-stage-plate font-galmuri-11 text-galmuri-title"
          style={{
            ...chamferClipStyle(plate.corner),
            padding: `${4 * scale}px ${16 * scale}px`,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}
