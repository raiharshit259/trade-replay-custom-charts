import { useMemo, useState } from "react";

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

export default function AssetAvatar({ src, label, className, imgClassName }: AssetAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = useMemo(() => getInitials(label), [label]);

  if (!src || imageFailed) {
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
      src={src}
      alt={label}
      title={label}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className={imgClassName ?? className ?? "h-5 w-5 rounded-full object-cover ring-1 ring-border/70"}
    />
  );
}
