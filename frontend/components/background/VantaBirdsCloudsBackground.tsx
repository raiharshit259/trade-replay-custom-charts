import { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";

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

declare global {
  interface Window {
    VANTA?: {
      BIRDS?: VantaFactory;
      CLOUDS?: VantaFactory;
    };
  }
}

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[data-vanta-src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.vantaSrc = src;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)), { once: true });
    document.head.appendChild(script);
  });

const defaultCloudsClassName = "absolute inset-0 z-0 pointer-events-none";
const defaultBirdsClassName = "absolute inset-0 z-[1] pointer-events-none";

export default function VantaBirdsCloudsBackground({
  wrapperClassName = "absolute inset-0 pointer-events-none",
  cloudsClassName = defaultCloudsClassName,
  birdsClassName = defaultBirdsClassName,
  onReadyChange,
}: VantaBirdsCloudsBackgroundProps) {
  const { theme } = useTheme();
  const cloudsRef = useRef<HTMLDivElement | null>(null);
  const birdsRef = useRef<HTMLDivElement | null>(null);
  const cloudsEffectRef = useRef<VantaEffect | null>(null);
  const birdsEffectRef = useRef<VantaEffect | null>(null);

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      if (typeof window === "undefined" || !cloudsRef.current || !birdsRef.current) return;

      try {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js");
        await Promise.all([
          loadScript("https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js"),
          loadScript("https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js"),
        ]);

        if (disposed || !cloudsRef.current || !birdsRef.current) return;

        const makeClouds = window.VANTA?.CLOUDS;
        const makeBirds = window.VANTA?.BIRDS;
        if (!makeClouds || !makeBirds) return;

        cloudsEffectRef.current = makeClouds({
          el: cloudsRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          backgroundColor: theme === "dark" ? 0x050d1a : 0x8baac6,
          skyColor: theme === "dark" ? 0x0a1628 : 0x6b94b8,
          cloudColor: theme === "dark" ? 0x0e2244 : 0xb0cfea,
          cloudShadowColor: theme === "dark" ? 0x06101e : 0x5a7d9e,
          sunColor: theme === "dark" ? 0x1a3a66 : 0xffd080,
          sunGlareColor: theme === "dark" ? 0x0d2040 : 0xf5c860,
          sunlightColor: theme === "dark" ? 0x142d52 : 0xfff0c0,
          speed: 0.8,
        }) ?? null;

        birdsEffectRef.current = makeBirds({
          el: birdsRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          backgroundColor: theme === "dark" ? 0x000000 : 0xffffff,
          color1: theme === "dark" ? 0x3b82f6 : 0x1d4ed8,
          color2: theme === "dark" ? 0x00d1ff : 0x0284c7,
          colorMode: "varianceGradient",
          quantity: 4,
          birdSize: 1.1,
          wingSpan: 30,
          speedLimit: 4,
          separation: 25,
          alignment: 25,
          cohesion: 20,
          scale: 1,
          scaleMobile: 1,
        }) ?? null;

      } catch {
        // Keep app usable even when animation init fails.
      } finally {
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
  }, [onReadyChange, theme]);

  return (
    <div className={wrapperClassName} aria-hidden="true">
      <div ref={cloudsRef} className={cloudsClassName} />
      <div ref={birdsRef} className={`${birdsClassName} ${theme === "dark" ? "mix-blend-screen" : "mix-blend-multiply"}`} style={{ background: "transparent" }} />
    </div>
  );
}
