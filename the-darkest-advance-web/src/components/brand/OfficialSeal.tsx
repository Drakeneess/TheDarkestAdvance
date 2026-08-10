import type { SVGProps } from "react";

type OfficialSealProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function OfficialSeal({
  className,
  title,
  ...props
}: OfficialSealProps) {
  const titleId = title ? "tda-official-seal-title" : undefined;

  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-labelledby={titleId}
      focusable="false"
      {...props}
    >
      {title ? <title id={titleId}>{title}</title> : null}

      {/* Irregular hex frame */}
      <g className="seal-frame">
        <path
          d="
            M50 7
            L74 15
            L83 35
            L80 71
            L50 92
            L21 73
            L16 36
            L26 16
            Z
          "
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        <path
          d="
            M50 15
            L69 21
            L76 37
            L73 67
            L50 84
            L27 68
            L23 38
            L31 22
            Z
          "
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          opacity="0.5"
        />
      </g>

      <g className="seal-rune">
        {/* Central sword / advance */}
        <path
          d="
            M50 10
            L55 22
            L53 73
            L50 89
            L47 73
            L45 22
            Z
          "
          fill="currentColor"
        />

        {/* Crow beak / left gesture */}
        <path
          d="
            M17 43
            L39 39
            L50 44
            L39 48
            L28 51
            L15 45
            Z
          "
          fill="currentColor"
        />

        {/* Wolf ear */}
        <path
          d="
            M54 38
            L63 27
            L68 38
            Z
          "
          fill="currentColor"
        />

        {/* Wolf snout / upper jaw */}
        <path
          d="
            M50 44
            L82 44
            L72 49
            L61 50
            L50 47
            Z
          "
          fill="currentColor"
        />

        {/* Wolf lower jaw / fang */}
        <path
          d="
            M57 51
            L68 64
            L61 73
            L56 61
            Z
          "
          fill="currentColor"
        />

        {/* Lower anchor */}
        <path
          d="
            M41 82
            L50 88
            L57 82
            L50 97
            Z
          "
          fill="currentColor"
        />
      </g>

      <g className="seal-cuts">
        {/* Central cut */}
        <path
          d="M50 18 V78"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />

        {/* Crow definition */}
        <path
          d="M35 42 L25 45"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M33 47 L27 50"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Wolf definition */}
        <path
          d="M60 33 L64 29"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <path
          d="M61 46 L72 46"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />

        <path
          d="M57 62 L62 70"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}