import { useEffect, useMemo, useState } from "react";

interface AssetAvatarProps {
  src?: string;
  label: string;
  className?: string;
  imgClassName?: string;
}

function extractDomainFromClearbitUrl(src: string): string | null {
  const marker = "logo.clearbit.com/";
  const markerIndex = src.indexOf(marker);
  if (markerIndex === -1) return null;

  const afterMarker = src.slice(markerIndex + marker.length);
  const domain = afterMarker.split("?")[0]?.trim();
  if (!domain) return null;
  return domain;
}

function buildImageCandidates(src?: string): string[] {
  if (!src) return [];

  const clearbitDomain = extractDomainFromClearbitUrl(src);
  if (!clearbitDomain) return [src];

  const encoded = encodeURIComponent(clearbitDomain);
  return [
    src,
    `https://www.google.com/s2/favicons?sz=128&domain=${encoded}`,
    `https://icons.duckduckgo.com/ip3/${clearbitDomain}.ico`,
  ];
}

export default function AssetAvatar({ src, label, className, imgClassName }: AssetAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const imageCandidates = useMemo(() => buildImageCandidates(src), [src]);
  const fallbackIcon = "/icons/exchange/default.svg";
  const currentSrc = imageCandidates[candidateIndex] || fallbackIcon;

  useEffect(() => {
    setImageFailed(false);
    setCandidateIndex(0);
  }, [src]);

  const displaySrc = imageFailed ? fallbackIcon : currentSrc;

  return (
    <img
      src={displaySrc}
      alt={label}
      title={label}
      loading="lazy"
      onError={() => {
        if (candidateIndex < imageCandidates.length - 1) {
          setCandidateIndex((index) => index + 1);
          return;
        }
        if (displaySrc !== fallbackIcon) {
          setImageFailed(true);
        }
      }}
      referrerPolicy="no-referrer"
      className={imgClassName ?? className ?? "h-5 w-5 rounded-full object-cover ring-1 ring-border/70"}
    />
  );
}
