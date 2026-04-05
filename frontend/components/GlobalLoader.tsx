import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BrandLottie from "@/components/BrandLottie";
import { subscribeApiLoading } from "@/lib/api";

interface GlobalLoaderProps {
  isRouteLoading: boolean;
}

export default function GlobalLoader({ isRouteLoading }: GlobalLoaderProps) {
  const [isApiLoading, setIsApiLoading] = useState(false);

  useEffect(() => {
    return subscribeApiLoading(setIsApiLoading);
  }, []);

  const visible = isApiLoading || isRouteLoading;
  const statusLabel = isApiLoading ? "Synchronizing market data" : "Preparing route transition";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-background/75 backdrop-blur-md flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="glass-strong rounded-2xl px-8 py-6 border border-primary/40 shadow-[0_0_40px_hsl(var(--neon-blue)/0.22)] max-w-[92vw]"
          >
            <div className="flex items-center gap-3.5">
              <BrandLottie size={92} className="shrink-0 drop-shadow-[0_0_18px_hsl(var(--neon-blue)/0.3)]" />
              <div>
                <p className="font-display text-[1.35rem] leading-none font-semibold text-foreground">Trade Replay</p>
                <p className="text-sm text-muted-foreground">{statusLabel}...</p>
                <div className="mt-2 flex items-center gap-1.5">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="h-1.5 w-1.5 rounded-full bg-primary/80"
                      animate={{ opacity: [0.25, 1, 0.25], y: [0, -1, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: dot * 0.14, ease: "easeInOut" }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
