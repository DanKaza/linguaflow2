import { cn } from "@/lib/utils";

/**
 * Pre-computed hex values of the Tailwind color palette.
 * Using these directly avoids DOM access (which differs between server & client)
 * and prevents hydration mismatches.
 */
const palette = [
  "#2b3a67", // bg-indigo
  "#c8373a", // bg-vermillion
  "#d9a441", // bg-gold
  "#3d4f82", // bg-indigo-tint
  "#10b981", // bg-success
  "#5a6fa8", // bg-indigo-tint-2
  "#9a6b16", // custom
  "#b22f32", // custom
];

/** Deterministic color from a name string (returns hex). */
export function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  square?: boolean;
}

export function Avatar({ name, size = 40, color, className, square }: AvatarProps) {
  const bg = color ?? colorFromName(name);
  const px = `${size}px`;
  const fs = `${Math.round(size * 0.38)}px`;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-bold text-white shrink-0 select-none",
        square ? "rounded-card" : "rounded-full",
        className,
      )}
      style={{
        width: px,
        height: px,
        backgroundColor: bg,
        fontSize: fs,
      }}
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
