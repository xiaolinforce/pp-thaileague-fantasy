export function ClubColor({
  color,
  secondaryColor,
  label,
  size = "medium",
}: {
  color: string;
  secondaryColor?: string;
  label: string;
  size?: "small" | "medium" | "large";
}) {
  const hasSecondaryColor =
    secondaryColor && secondaryColor.toLowerCase() !== color.toLowerCase();

  return (
    <span
      className={`club-color color-${size}`}
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
