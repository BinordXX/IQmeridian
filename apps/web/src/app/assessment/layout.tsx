type AssessmentLayoutProps = {
  children: React.ReactNode;
};

export default function AssessmentLayout({ children }: AssessmentLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full">{children}</div>
    </div>
  );
}
