import { CandidateReportLoader } from '@/features/assessment/components/candidate-report-loader';

type CandidateReportPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function CandidateReportPage({
  params,
}: CandidateReportPageProps) {
  const { sessionId } = await params;

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <CandidateReportLoader sessionId={sessionId} />
      </div>
    </main>
  );
}
