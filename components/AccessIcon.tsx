/** Icono inspirado en Access (cuaderno granate con "A"). Sustituible por el logo oficial si se dispone de licencia. */
export function AccessIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="Icono de Access" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="18" fill="#A4373A" />
      <path d="M0 18a18 18 0 0 1 18-18h8v100h-8A18 18 0 0 1 0 82z" fill="#7E2A2D" />
      <g fill="none" stroke="#fff" strokeWidth="1.6">
        <ellipse cx="13" cy="34" rx="7" ry="4" /><ellipse cx="13" cy="50" rx="7" ry="4" /><ellipse cx="13" cy="66" rx="7" ry="4" />
      </g>
      <path fillRule="evenodd" fill="#fff" d="M55 22 79 78H68L63 65H47L42 78H31ZM55 38 50 55H60Z" />
    </svg>
  );
}
