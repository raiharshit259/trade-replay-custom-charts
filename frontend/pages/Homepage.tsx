import { useEffect, useRef } from "react";

type VantaBirdsOptions = {
  el: HTMLElement;
  mouseControls: boolean;
  touchControls: boolean;
  gyroControls: boolean;
  backgroundColor: number;
  color1: number;
  color2: number;
  colorMode: string;
  quantity: number;
  birdSize: number;
  wingSpan: number;
  speedLimit: number;
  separation: number;
  alignment: number;
  cohesion: number;
  scale: number;
  scaleMobile: number;
};

type VantaEffect = {
  destroy: () => void;
  setOptions: (options: Partial<VantaBirdsOptions>) => void;
};

declare global {
  interface Window {
    VANTA?: {
      BIRDS?: (config: VantaBirdsOptions) => VantaEffect;
    };
  }
}

export default function Homepage() {
  const vantaRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef<HTMLDivElement | null>(null);
  const effectRef = useRef<VantaEffect | null>(null);
  const progressRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const lastSetOptionsRef = useRef({ speedLimit: 5, quantity: 5, separation: 20, alignment: 20 });

  useEffect(() => {
    document.body.classList.add("homepage-cinematic");
    return () => document.body.classList.remove("homepage-cinematic");
  }, []);

  useEffect(() => {
    const host = vantaRef.current;
    const transformLayer = transformRef.current;
    if (!host || !transformLayer) return;

    let cancelled = false;

    const throttle = <T extends (...args: never[]) => void>(fn: T, wait: number) => {
      let lastTime = 0;
      return (...args: Parameters<T>) => {
        const now = performance.now();
        if (now - lastTime < wait) return;
        lastTime = now;
        fn(...args);
      };
    };

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
          { once: true }
        );
        script.addEventListener("error", () => reject(new Error(`Failed loading ${src}`)), { once: true });
        document.head.appendChild(script);
      });

    const init = async () => {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js");

      if (cancelled || !window.VANTA?.BIRDS) return;
      effectRef.current?.destroy();
      effectRef.current = window.VANTA.BIRDS({
        el: host,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        backgroundColor: 0x07192f,
        color1: 0xff0000,
        color2: 0x00d1ff,
        colorMode: "varianceGradient",
        quantity: 5,
        birdSize: 1,
        wingSpan: 30,
        speedLimit: 5,
        separation: 20,
        alignment: 20,
        cohesion: 20,
        scale: 1.0,
        scaleMobile: 1.0,
      });

      const updateVisualDepth = () => {
        const progress = progressRef.current;
        const scale = 1 + progress * 0.4;
        const translateY = -progress * 50;
        transformLayer.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      };

      const pushVantaScrollOptions = () => {
        const effect = effectRef.current;
        if (!effect) return;
        const progress = progressRef.current;
        const speedLimit = 5 + progress * 5;
        const quantity = 5 + Math.floor(progress * 10);
        const prev = lastSetOptionsRef.current;
        if (Math.abs(prev.speedLimit - speedLimit) < 0.05 && prev.quantity === quantity) return;
        prev.speedLimit = speedLimit;
        prev.quantity = quantity;
        effect.setOptions({ speedLimit, quantity });
      };

      const pushVantaMouseOptions = () => {
        const effect = effectRef.current;
        if (!effect) return;
        const x = mouseRef.current.x;
        const y = mouseRef.current.y;
        const separation = 20 + x * 30;
        const alignment = 20 + y * 30;
        const prev = lastSetOptionsRef.current;
        if (Math.abs(prev.separation - separation) < 0.5 && Math.abs(prev.alignment - alignment) < 0.5) return;
        prev.separation = separation;
        prev.alignment = alignment;
        effect.setOptions({ separation, alignment });
      };

      const onScroll = throttle(() => {
        const viewport = Math.max(window.innerHeight, 1);
        const progress = Math.min(1, Math.max(0, window.scrollY / (2 * viewport)));
        progressRef.current = progress;
        updateVisualDepth();
        pushVantaScrollOptions();
      }, 16);

      const onMouseMove = throttle((event: MouseEvent) => {
        mouseRef.current.x = Math.min(1, Math.max(0, event.clientX / Math.max(window.innerWidth, 1)));
        mouseRef.current.y = Math.min(1, Math.max(0, event.clientY / Math.max(window.innerHeight, 1)));
        pushVantaMouseOptions();
      }, 16);

      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("mousemove", onMouseMove, { passive: true });

      (host as HTMLDivElement & { __vantaCleanup?: () => void }).__vantaCleanup = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("mousemove", onMouseMove);
      };
    };

    init().catch(() => undefined);

    return () => {
      cancelled = true;
      const cleanup = (host as HTMLDivElement & { __vantaCleanup?: () => void }).__vantaCleanup;
      cleanup?.();
      effectRef.current?.destroy();
      effectRef.current = null;
    };
  }, []);

  return (
    <div ref={vantaRef} className="relative min-h-[220vh] overflow-x-hidden bg-[#07192f]">
      <div ref={transformRef} className="vanta-transform relative z-10">
        <section className="min-h-screen" />
        <section className="min-h-screen" />
        <section className="min-h-[20vh]" />
      </div>
    </div>
  );
}
