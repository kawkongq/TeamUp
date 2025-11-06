import type { MouseEventHandler } from 'react';

interface GoogleAuthButtonProps {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  loading?: boolean;
  loadingText?: string;
  className?: string;
}

export default function GoogleAuthButton({
  label,
  onClick,
  loading = false,
  loadingText = 'Redirecting...',
  className,
}: GoogleAuthButtonProps) {
  const classes = [
    'relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-800 shadow-sm transition-all duration-200',
    'hover:border-gray-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4285F4]',
    'disabled:cursor-not-allowed disabled:opacity-60',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={classes}
    >
      <span className="absolute inset-0 opacity-0 transition-opacity duration-200 hover:opacity-100">
        <span className="absolute inset-0 bg-gradient-to-r from-[#4285F4]/10 via-[#34A853]/10 to-[#FBBC05]/10" />
      </span>

      <span className="relative mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-1 ring-gray-200">
        <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 46 47" fill="none">
          <path
            d="M45.3 24.0365C45.3 22.3937 45.1595 20.8105 44.897 19.2871H23.5V28.2609H35.6C35.0795 30.9948 33.5592 33.2874 31.2666 34.83V40.8441H38.8C43.2 36.8082 45.3 30.9639 45.3 24.0365Z"
            fill="#4285F4"
          />
          <path
            d="M23.5 46.5C29.645 46.5 34.815 44.4541 38.8 40.8441L31.2666 34.83C29.1071 36.2968 26.509 37.1192 23.5 37.1192C17.5548 37.1192 12.445 33.0471 10.6214 27.7233H2.8125V33.9471C6.78036 41.6017 14.5965 46.5 23.5 46.5Z"
            fill="#34A853"
          />
          <path
            d="M10.6214 27.7234C10.1614 26.2566 9.90179 24.7009 9.90179 23.1183C9.90179 21.5357 10.1804 19.98 10.6214 18.5132V12.2893H2.8125C1.25 15.4857 0.3 19.1711 0.3 23.1183C0.3 27.0654 1.25 30.7509 2.8125 33.9472L10.6214 27.7234Z"
            fill="#FBBC05"
          />
          <path
            d="M23.5 9.11741C26.8464 9.11741 29.8393 10.2443 32.2119 12.4789L38.9667 5.72411C34.7964 1.81116 29.645 0 23.5 0C14.5965 0 6.78036 4.8787 2.8125 12.2893L10.6214 18.5131C12.445 13.1893 17.5548 9.11741 23.5 9.11741Z"
            fill="#EA4335"
          />
        </svg>
      </span>

      <span className="relative text-sm font-semibold">
        {loading ? loadingText : label}
      </span>
    </button>
  );
}
