export function BrandMark({
  className,
  mono = false,
}: {
  className?: string;
  mono?: boolean;
}) {
  const stroke = mono ? "currentColor" : "url(#medusa-mark-stroke)";
  const fill = mono ? "currentColor" : "url(#medusa-mark-fill)";

  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={["h-10 w-10", className].filter(Boolean).join(" ")}
      fill="none"
    >
      {!mono && (
        <defs>
          <linearGradient id="medusa-mark-stroke" x1="18" y1="12" x2="78" y2="84" gradientUnits="userSpaceOnUse">
            <stop stopColor="#8F221F" />
            <stop offset="0.52" stopColor="#C37A52" />
            <stop offset="1" stopColor="#6B1821" />
          </linearGradient>
          <linearGradient id="medusa-mark-fill" x1="31" y1="34" x2="66" y2="69" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F7E3D4" />
            <stop offset="1" stopColor="#E9AE84" />
          </linearGradient>
        </defs>
      )}

      <path
        d="M48 14c-12.7 0-22 9.7-22 22.4v27.2C26 74.3 34.7 83 45.4 83h5.2C61.3 83 70 74.3 70 63.6V36.4C70 23.7 60.7 14 48 14Z"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 23v6"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M40.5 24.5c2.2-1.8 4.7-2.7 7.5-2.7s5.3.9 7.5 2.7"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M30 36h36"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M33 50.5c4.7-6.8 9.7-10.2 15-10.2 5.3 0 10.3 3.4 15 10.2-4.7 6.8-9.7 10.2-15 10.2-5.3 0-10.3-3.4-15-10.2Z"
        stroke={stroke}
        strokeWidth="4"
        fill={fill}
        strokeLinejoin="round"
      />
      <path
        d="M48 45.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
        fill={mono ? "none" : "#FFF7F1"}
        stroke={stroke}
        strokeWidth="3.5"
      />
      <path
        d="M34 69h28"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M40 78h16"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
