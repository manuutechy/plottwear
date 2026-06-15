import React from 'react';

interface LogoProps {
  className?: string;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-6', light = false }) => {
  const primaryColor = light ? '#FFFFFF' : '#0D0D0D';
  const accentColor = '#E8A0B4'; // Brand pink

  return (
    <svg
      className={className}
      viewBox="0 0 380 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Brand Monogram: A premium geometric street hanger/cross mark */}
      <g transform="translate(10, 5)">
        {/* Diamond Outer Frame */}
        <path
          d="M30 0L60 30L30 60L0 30L30 0Z"
          fill="none"
          stroke={accentColor}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Inner Street Cross */}
        <rect x="27" y="15" width="6" height="30" fill={primaryColor} rx="1" />
        <rect x="15" y="27" width="30" height="6" fill={primaryColor} rx="1" />
      </g>

      {/* Brand Typography: Custom geometric letters for "PLOTTWEAR" */}
      <g transform="translate(90, 48)" fill={primaryColor} className="font-bold">
        {/* P */}
        <path d="M0 -34H14C20.5 -34 25 -30.5 25 -24C25 -17.5 20.5 -14 14 -14H7V0H0V-34ZM7 -20H13C16.5 -20 18 -21 18 -24C18 -27 16.5 -28 13 -28H7V-20Z" />
        
        {/* L */}
        <path d="M34 -34H41V-7H56V0H34-34Z" />
        
        {/* O */}
        <path d="M66 -17C66 -27 73.5 -34.5 84.5 -34.5C95.5 -34.5 103 -27 103 -17C103 -7 95.5 0.5 84.5 0.5C73.5 0.5 66 -7 66 -17ZM95.5 -17C95.5 -23 91.5 -28 84.5 -28C77.5 -28 73.5 -23 73.5 -17C73.5 -11 77.5 -6 84.5 -6C91.5 -6 95.5 -11 95.5 -17Z" />
        
        {/* T */}
        <path d="M112 -34H136V-27H127.5V0H120.5V-27H112V-34Z" />
        
        {/* T */}
        <path d="M144 -34H168V-27H159.5V0H152.5V-27H144V-34Z" />
        
        {/* W */}
        <path d="M177 -34H184.5L191 -11L197 -34H204L210 -11L216.5 -34H224L213.5 0H206L199 -20L192 0H184.5L177 -34Z" />
        
        {/* E */}
        <path d="M234 -34H254V-27.5H241V-20H252V-14H241V-7.5H254V0H234V-34Z" />
        
        {/* A */}
        <path d="M263.5 0L274 -34H282L292.5 0H285L282.5 -9H273.5L271 0H263.5ZM275 -15H281L278 -26.5L275 -15Z" />
        
        {/* R */}
        <path d="M302.5 -34H317C323.5 -34 327.5 -30.5 327.5 -24C327.5 -18.5 324 -15.5 319.5 -14.5L329 0H321L312 -13.5H309.5V0H302.5V-34ZM309.5 -20H315C318.5 -20 320.5 -21 320.5 -24C320.5 -27 318.5 -28 315 -28H309.5V-20Z" />
      </g>
    </svg>
  );
};
