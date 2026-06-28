import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { PublicAuthShell } from '../_components/public-auth-shell';
import { RegisterForm } from './_components/register-form';

export const metadata = {
  title: 'Create account | IQMeridian',
  description: 'Create an IQMeridian account.',
};

export default async function RegisterPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <PublicAuthShell
      description="Create an account to access the consumer assessment workspace, complete available assessments, and review your provisional profile dashboard."
      eyebrow="Get started"
      proofPoints={[
        'Consumer accounts can access the assessment workspace after registration.',
        'Completed sessions connect to dashboard score profiles when scoring is available.',
        'Validity notices and score caveats remain visible in the user experience.',
      ]}
      sideDescription="Registration is the entry point into the IQMeridian assessment journey."
      sideTitle="Candidate-ready account flow"
      title="Create your IQMeridian account."
    >
      <RegisterForm />
    </PublicAuthShell>
  );
}