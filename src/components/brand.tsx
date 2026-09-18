/** One shared wordmark for the public site and the application. */
export default function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M10 25V9h7a6 6 0 0 1 0 12h-2"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        pathshift<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
