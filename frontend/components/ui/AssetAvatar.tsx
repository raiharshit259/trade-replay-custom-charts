import { useEffect, useMemo, useState } from "react";

interface AssetAvatarProps {
  src?: string;
  label: string;
  className?: string;
  imgClassName?: string;
}

function getInitials(label: string) {
  const cleaned = label.replace(/[^A-Za-z0-9 ]/g, "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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
    `https://www.google.com/s2/favicons?sz=128&domain=${encoded}`,
    `https://icons.duckduckgo.com/ip3/${clearbitDomain}.ico`,
  ];
}

export default function AssetAvatar({ src, label, className, imgClassName }: AssetAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const initials = useMemo(() => getInitials(label), [label]);
  const imageCandidates = useMemo(() => buildImageCandidates(src), [src]);
  const currentSrc = imageCandidates[candidateIndex];

  useEffect(() => {
    setImageFailed(false);
    setCandidateIndex(0);
  }, [src]);

  if (!currentSrc || imageFailed) {
    return (
      <span
        className={className ?? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary/80 text-[10px] font-semibold text-foreground"}
        aria-label={label}
        title={label}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={label}
      title={label}
      loading="lazy"
      onError={() => {
        if (candidateIndex < imageCandidates.length - 1) {
          setCandidateIndex((index) => index + 1);
          return;
        }
        setImageFailed(true);
      }}
      referrerPolicy="no-referrer"
      className={imgClassName ?? className ?? "h-5 w-5 rounded-full object-cover ring-1 ring-border/70"}
    />
  );
}
