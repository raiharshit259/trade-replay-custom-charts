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
    src,
    `https://www.google.com/s2/favicons?sz=128&domain=${encoded}`,
    `https://icons.duckduckgo.com/ip3/${clearbitDomain}.ico`,
  ];
}

function buildDeterministicFallbackIcon(label: string): string {
  const safeLabel = (label || "ASSET").trim().toUpperCase();
  const initials = getInitials(safeLabel);
  const palette = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"];
  const sum = safeLabel.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bg = palette[sum % palette.length];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='64' fill='${bg}'/><text x='64' y='72' text-anchor='middle' font-family='Inter, Arial, sans-serif' font-size='40' font-weight='700' fill='#ffffff'>${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function AssetAvatar({ src, label, className, imgClassName }: AssetAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const imageCandidates = useMemo(() => buildImageCandidates(src), [src]);
  const fallbackIcon = useMemo(() => buildDeterministicFallbackIcon(label), [label]);
  const currentSrc = imageCandidates[candidateIndex];

  useEffect(() => {
    setImageFailed(false);
    setCandidateIndex(0);
  }, [src]);

  const displaySrc = !currentSrc || imageFailed ? fallbackIcon : currentSrc;

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
        setImageFailed(true);
      }}
      referrerPolicy="no-referrer"
      className={imgClassName ?? className ?? "h-5 w-5 rounded-full object-cover ring-1 ring-border/70"}
    />
  );
}
