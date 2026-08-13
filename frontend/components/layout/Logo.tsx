import React from 'react';

import styles from './Logo.module.css';

const NAVY = '#08192f';
const GOLD = '#b18842';

const ROOF_PATH =
  'M963 1633 c15 -2 39 -2 55 0 15 2 2 4 -28 4 -30 0 -43 -2 -27 -4z ' +
  'M2030 1405 c-29 -35 -57 -62 -62 -59 -4 3 -8 -3 -8 -14 0 -19 -151 -200 -310 ' +
  '-372 -149 -161 -361 -412 -357 -424 2 -7 52 -11 146 -11 l143 0 26 31 c15 17 ' +
  '59 68 97 114 39 46 106 124 150 175 44 50 115 133 158 184 43 51 82 91 86 89 ' +
  '9 -3 50 -50 332 -373 105 -121 193 -213 206 -217 26 -7 273 -1 281 7 3 3 -4 ' +
  '15 -15 28 -113 127 -726 830 -753 863 -19 24 -42 43 -51 44 -8 0 -39 -29 -69 ' +
  '-65z';

const H_PATH =
  'M890 1623 c0 -5 -1 -251 -2 -548 l-3 -540 140 0 140 0 3 233 2 233 ' +
  '254 -1 254 -1 39 43 c22 24 85 96 142 161 l102 119 -3 151 -3 152 -142 3 -143 ' +
  '3 0 -210 0 -209 -27 -5 c-30 -6 -414 1 -450 9 -23 4 -23 5 -23 209 l0 205 ' +
  '-140 0 c-77 0 -140 -3 -140 -7z';

const WINDOW = (
  <g transform="translate(209,118)" fill={NAVY}>
    <rect x="-11" y="-11" width="9" height="9" />
    <rect x="1" y="-11" width="9" height="9" />
    <rect x="-11" y="1" width="9" height="9" />
    <rect x="1" y="1" width="9" height="9" />
  </g>
);

const ICON = (
  <>
    <g transform="translate(0,190) scale(0.1,-0.1)" fill={GOLD} stroke="none">
      <path d={ROOF_PATH} />
    </g>
    <g transform="translate(0,190) scale(0.1,-0.1)" fill={NAVY} stroke="none">
      <path d={H_PATH} />
    </g>
    {WINDOW}
  </>
);

type LogoProps = {
  variant?: 'full' | 'icon';
  height?: number;
  className?: string;
};

export function Logo({ variant = 'icon', height = 32, className }: LogoProps) {
  const full = variant === 'full';
  return (
    <svg
      className={`${styles.logo} ${className || ''}`}
      width={full ? height * (352 / 210) : height * (206 / 113)}
      height={height}
      viewBox={full ? '0 0 352 210' : '87 25 206 113'}
      role="img"
      aria-label="House Agent"
    >
      {ICON}
      {full && (
        <text
          x="176"
          y="175"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="800"
          fontSize="32"
          letterSpacing="2"
        >
          <tspan fill={NAVY}>HOUSE </tspan>
          <tspan fill={GOLD}>AGENT</tspan>
        </text>
      )}
    </svg>
  );
}
