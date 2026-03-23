// Abstract serpent-eye mark for MEDUSA
// Almond eye silhouette + vertical slit pupil
export default function MedusaMark({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.62}
      viewBox="0 0 40 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer almond / eye shape */}
      <path
        d="M2 12.5 Q20 1 38 12.5 Q20 24 2 12.5 Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Snake-eye vertical pupil */}
      <ellipse
        cx="20"
        cy="12.5"
        rx="2.8"
        ry="6.5"
        fill={color}
      />
      {/* Highlight glint */}
      <ellipse
        cx="21.8"
        cy="10"
        rx="0.9"
        ry="1.6"
        fill="rgba(255,255,255,0.55)"
      />
    </svg>
  );
}
