import { AssessmentInstructionsScreen } from '@/components/assessment/assessment-instructions-screen';

export default function AssessmentInstructionsPage() {
  return (
    <AssessmentInstructionsScreen
      mode="consumer"
      nextHref="/assessment/readiness"
    />
  );
}
