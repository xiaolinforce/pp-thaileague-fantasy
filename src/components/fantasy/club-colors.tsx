export function ClubColor({
  color,
  secondaryColor,
  label,
  size = "medium",
  className,
}: {
  color: string;
  secondaryColor?: string;
  label: string;
  size?: "small" | "medium" | "large";
  className?: string;
}) {
  const hasSecondaryColor =
    secondaryColor && secondaryColor.toLowerCase() !== color.toLowerCase();

  return (
    <span
      className={`club-color color-${size}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={label}
      style={{
        background: hasSecondaryColor
          ? `linear-gradient(90deg, ${color} 0 50%, ${secondaryColor} 50% 100%)`
          : color,
      }}
    />
  );
}
