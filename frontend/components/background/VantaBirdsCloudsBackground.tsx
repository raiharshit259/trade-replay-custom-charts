import { useEffect, useRef } from "react";

interface VantaBirdsCloudsBackgroundProps {
  wrapperClassName?: string;
  cloudsClassName?: string;
  birdsClassName?: string;
  onReadyChange?: (ready: boolean) => void;
}

type VantaEffect = {
  destroy?: () => void;
};

type VantaFactory = (config: Record<string, unknown>) => VantaEffect | undefined;

const defaultCloudsClassName = "absolute inset-0 z-0 pointer-events-none opacity-40";
const defaultBirdsClassName = "absolute inset-0 z-[1] pointer-events-none opacity-70 mix-blend-screen";

export default function VantaBirdsCloudsBackground({
  wrapperClassName = "absolute inset-0 pointer-events-none",
  cloudsClassName = defaultCloudsClassName,
  birdsClassName = defaultBirdsClassName,
  onReadyChange,
}: VantaBirdsCloudsBackgroundProps) {
  const cloudsRef = useRef<HTMLDivElement | null>(null);
  const birdsRef = useRef<HTMLDivElement | null>(null);
  const cloudsEffectRef = useRef<VantaEffect | null>(null);
  const birdsEffectRef = useRef<VantaEffect | null>(null);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      if (typeof window === "undefined" || !cloudsRef.current || !birdsRef.current) return;

      try {
        const [{ default: CLOUDS }, { default: BIRDS }] = await Promise.all([
          import("vanta/dist/vanta.clouds.min"),
          import("vanta/dist/vanta.birds.min"),
        ]);

        if (disposed || !cloudsRef.current || !birdsRef.current) return;

        const makeClouds = CLOUDS as unknown as VantaFactory;
        const makeBirds = BIRDS as unknown as VantaFactory;

        cloudsEffectRef.current = makeClouds({
          el: cloudsRef.current,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          skyColor: 0x10233f,
          cloudColor: 0x2c4f80,
          cloudShadowColor: 0x1a2e4f,
          speed: 0.35,
          texturePath: "./gallery/noise.png",
        }) ?? null;

        birdsEffectRef.current = makeBirds({
          el: birdsRef.current,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          backgroundAlpha: 0,
          color1: 0x4cc3ff,
          color2: 0x3f8cff,
          birdSize: 1.15,
          wingSpan: 22,
          speedLimit: 3.4,
          separation: 60,
          alignment: 46,
          cohesion: 45,
          quantity: 2,
        }) ?? null;

        onReadyChange?.(true);
      } catch {
        onReadyChange?.(true);
      }
    };

    void init();

    return () => {
      disposed = true;
      onReadyChange?.(false);
      birdsEffectRef.current?.destroy?.();
      birdsEffectRef.current = null;
      cloudsEffectRef.current?.destroy?.();
      cloudsEffectRef.current = null;
    };
  }, [onReadyChange]);

  return (
    <div className={wrapperClassName} aria-hidden="true">
      <div ref={cloudsRef} className={cloudsClassName} />
      <div ref={birdsRef} className={birdsClassName} />
    </div>
  );
}
