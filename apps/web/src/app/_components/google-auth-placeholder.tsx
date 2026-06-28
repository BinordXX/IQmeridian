type GoogleAuthPlaceholderProps = {
  label?: string;
};

export function GoogleAuthPlaceholder({
  label = 'Continue with Google — coming soon',
}: GoogleAuthPlaceholderProps) {
  return (
    <button
      className="inline-flex cursor-not-allowed items-center justify-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-slate-400"
      disabled
      title="Google OAuth is not connected yet."
      type="button"
    >
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 48 48">
        <path
          d="M44.5 20H24v8.5h11.8C34.7 34.1 30 37.5 24 37.5c-7.4 0-13.5-6.1-13.5-13.5S16.6 10.5 24 10.5c3.2 0 6.2 1.1 8.5 3.1l6-6C34.7 4.2 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.4-.2-2.7-.5-4Z"
          fill="#FFC107"
        />
        <path
          d="M4.5 14.1 11.5 19.2C13.4 14.1 18.3 10.5 24 10.5c3.2 0 6.2 1.1 8.5 3.1l6-6C34.7 4.2 29.6 2 24 2 15.5 2 8.2 6.8 4.5 14.1Z"
          fill="#FF3D00"
        />
        <path
          d="M24 46c5.5 0 10.5-2.1 14.2-5.6l-6.6-5.6c-2.1 1.6-4.8 2.7-7.6 2.7-5.9 0-10.9-3.8-12.7-9.1l-7 5.4C7.9 41 15.4 46 24 46Z"
          fill="#4CAF50"
        />
        <path
          d="M44.5 20H24v8.5h11.8c-.5 2.5-2 4.7-4.2 6.3l6.6 5.6C42 36.8 45 31.5 45 24c0-1.4-.2-2.7-.5-4Z"
          fill="#1976D2"
        />
      </svg>
      {label}
    </button>
  );
}