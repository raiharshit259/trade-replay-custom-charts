import VantaBirdsCloudsBackground from "@/components/background/VantaBirdsCloudsBackground";

interface PageBirdsCloudsBackgroundProps {
  showShellLayers?: boolean;
  showGradientOverlay?: boolean;
  showBirds?: boolean;
  cloudsClassName?: string;
  birdsClassName?: string;
  onReadyChange?: (ready: boolean) => void;
}

export default function PageBirdsCloudsBackground({
  showShellLayers = false,
  showGradientOverlay = false,
  showBirds = true,
  cloudsClassName,
  birdsClassName,
  onReadyChange,
}: PageBirdsCloudsBackgroundProps) {
  return (
    <>
      {showShellLayers ? (
        <>
          <div className="page-bg-orb page-bg-orb--one" aria-hidden="true" />
          <div className="page-bg-orb page-bg-orb--two" aria-hidden="true" />
          <div className="page-bg-orb page-bg-orb--three" aria-hidden="true" />
          <div className="page-bg-grid" aria-hidden="true" />
        </>
      ) : null}

      <VantaBirdsCloudsBackground
        showBirds={showBirds}
        cloudsClassName={cloudsClassName}
        birdsClassName={birdsClassName}
        onReadyChange={onReadyChange}
      />

      {showGradientOverlay ? <div className="absolute inset-0 z-[2] pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/80" /> : null}
    </>
  );
}
