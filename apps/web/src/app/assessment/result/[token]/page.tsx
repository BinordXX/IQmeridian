import { CandidateResultAccessLoader } from '@/features/assessment/components/candidate-result-access-loader';

type CandidateResultAccessPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function CandidateResultAccessPage({
  params,
}: CandidateResultAccessPageProps) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <CandidateResultAccessLoader token={token} />
      </div>
    </main>
  );
}
