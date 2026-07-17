'use client';

type EmployerErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function EmployerErrorPage({
  error,
  reset,
}: EmployerErrorPageProps) {
  return (
    <main className="min-h-screen bg-[#020817] px-6 py-10 text-white">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-red-300/20 bg-red-400/10 p-8 text-red-100">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">
          Employer workspace error
        </p>

        <h1 className="mt-3 text-3xl font-black text-white">
          The employer workspace could not be loaded
        </h1>

        <p className="mt-3 text-sm leading-6 text-red-100/80">
          {error.message || 'An unexpected employer workspace error occurred.'}
        </p>

        <button
          className="mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/15"
          onClick={reset}
          type="button"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
