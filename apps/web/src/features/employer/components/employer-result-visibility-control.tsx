type EmployerResultVisibilityControlProps = {
  campaignStatus: string;
};

export const EmployerResultVisibilityControl = ({
  campaignStatus,
}: EmployerResultVisibilityControlProps) => {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <h3 className="text-lg font-black text-white">
        Candidate result visibility
      </h3>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
        Candidate-facing result visibility is governed separately from
        employer-facing reporting. In the current MVP, employer reports remain
        available only to authorised employer users, while candidate result
        release remains restricted unless explicitly enabled by product rules.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="candidate-result-visibility"
            className="text-sm font-black text-slate-300"
          >
            Candidate result access
          </label>

          <select
            id="candidate-result-visibility"
            value="hidden"
            disabled
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-500 outline-none"
          >
            <option value="hidden">Hidden from candidate</option>
            <option value="summary">Limited summary visible</option>
          </select>
        </div>

        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100">
          <p className="font-black text-white">Current campaign state</p>
          <p className="mt-1">{campaignStatus}</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        This control is shown deliberately so the employer workspace is ready
        for campaign-level visibility governance, but it is disabled until the
        backend exposes a permitted setting for candidate result release.
      </p>
    </section>
  );
};