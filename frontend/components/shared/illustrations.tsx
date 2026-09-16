/**
 * Inline SVG illustrations for empty states.
 * Uses the Topshop brand palette (rose #D83F5E, blush #FDE8EB, navy #253654).
 */

export function EmptyCartIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse cx="120" cy="185" rx="85" ry="11" fill="#FDE8EB" opacity="0.7" />

      {/* Shopping bag body */}
      <rect x="55" y="82" width="130" height="96" rx="16" fill="#FFF0F2" stroke="#FAB7B9" strokeWidth="2" />

      {/* Bag handles */}
      <path
        d="M88 82 C88 58 152 58 152 82"
        stroke="#D83F5E"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Handle rings */}
      <rect x="84" y="70" width="16" height="22" rx="8" fill="none" stroke="#D83F5E" strokeWidth="2.5" />
      <rect x="140" y="70" width="16" height="22" rx="8" fill="none" stroke="#D83F5E" strokeWidth="2.5" />

      {/* Question mark */}
      <text
        x="120"
        y="152"
        textAnchor="middle"
        fontSize="44"
        fontWeight="700"
        fill="#FAB7B9"
        fontFamily="system-ui, sans-serif"
      >
        ?
      </text>

      {/* Floating cosmetic tube left */}
      <rect x="18" y="108" width="22" height="48" rx="6" fill="#FAB7B9" opacity="0.5" />
      <rect x="18" y="102" width="22" height="12" rx="4" fill="#D83F5E" opacity="0.4" />

      {/* Floating cosmetic bottle right */}
      <rect x="200" y="110" width="20" height="42" rx="6" fill="#FDE8EB" stroke="#FAB7B9" strokeWidth="1.5" opacity="0.85" />
      <rect x="203" y="102" width="14" height="13" rx="4" fill="#FAB7B9" opacity="0.5" />

      {/* Sparkle dots */}
      <circle cx="40" cy="72" r="4" fill="#D83F5E" opacity="0.35" />
      <circle cx="54" cy="52" r="2.5" fill="#FAB7B9" opacity="0.7" />
      <circle cx="196" cy="68" r="3" fill="#D83F5E" opacity="0.3" />
      <circle cx="210" cy="90" r="2" fill="#FAB7B9" opacity="0.55" />

      {/* Sparkle crosses */}
      <line x1="30" y1="88" x2="34" y2="92" stroke="#D83F5E" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="30" y1="92" x2="34" y2="88" stroke="#D83F5E" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <line x1="202" y1="52" x2="206" y2="56" stroke="#FAB7B9" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      <line x1="202" y1="56" x2="206" y2="52" stroke="#FAB7B9" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

export function EmptyWishlistIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Shadow */}
      <ellipse cx="120" cy="183" rx="84" ry="12" fill="#FDE8EB" opacity="0.65" />

      {/* Main heart */}
      <path
        d="M120 158 C82 129 42 100 42 70 C42 50 57 38 76 38 C93 38 108 52 120 65 C132 52 147 38 164 38 C183 38 198 50 198 70 C198 100 158 129 120 158Z"
        fill="#FDE8EB"
        stroke="#FAB7B9"
        strokeWidth="2"
      />

      {/* Inner heart soft tint */}
      <path
        d="M120 146 C89 121 56 96 56 69 C56 53 67 45 79 45 C93 45 107 57 120 70 C133 57 147 45 161 45 C173 45 184 53 184 69 C184 96 151 121 120 146Z"
        fill="#FAB7B9"
        opacity="0.3"
      />

      {/* Dashed "empty" line inside heart */}
      <path
        d="M106 82 L114 97 L122 82 L130 97"
        stroke="#D83F5E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="4 3"
        opacity="0.5"
        fill="none"
      />

      {/* Floating small hearts */}
      <path
        d="M44 44 C42.5 40.5 37 40.5 37 45 C37 49 44 54.5 44 54.5 C44 54.5 51 49 51 45 C51 40.5 45.5 40.5 44 44Z"
        fill="#D83F5E"
        opacity="0.28"
      />
      <path
        d="M198 38 C196.5 34.5 191 34.5 191 39 C191 43 198 48.5 198 48.5 C198 48.5 205 43 205 39 C205 34.5 199.5 34.5 198 38Z"
        fill="#D83F5E"
        opacity="0.22"
      />
      <path
        d="M30 118 C29 115.5 25.5 115.5 25.5 118.5 C25.5 121 30 124.5 30 124.5 C30 124.5 34.5 121 34.5 118.5 C34.5 115.5 31 115.5 30 118Z"
        fill="#FAB7B9"
        opacity="0.6"
      />
      <path
        d="M210 108 C209 105.5 205.5 105.5 205.5 108.5 C205.5 111 210 114.5 210 114.5 C210 114.5 214.5 111 214.5 108.5 C214.5 105.5 211 105.5 210 108Z"
        fill="#FAB7B9"
        opacity="0.55"
      />

      {/* Sparkle dots */}
      <circle cx="62" cy="62" r="3" fill="#D83F5E" opacity="0.28" />
      <circle cx="178" cy="60" r="2.5" fill="#D83F5E" opacity="0.22" />

      {/* Sparkle crosses */}
      <line x1="24" y1="74" x2="28" y2="78" stroke="#FAB7B9" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <line x1="24" y1="78" x2="28" y2="74" stroke="#FAB7B9" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
      <line x1="212" y1="80" x2="216" y2="84" stroke="#D83F5E" strokeWidth="1.5" strokeLinecap="round" opacity="0.38" />
      <line x1="212" y1="84" x2="216" y2="80" stroke="#D83F5E" strokeWidth="1.5" strokeLinecap="round" opacity="0.38" />
    </svg>
  );
}
