import { AssessmentInstructionsScreen } from '@/components/assessment/assessment-instructions-screen';

import { startConsumerAssessmentAction } from '../../dashboard/actions';

export default function AssessmentInstructionsPage() {
  return (
    <AssessmentInstructionsScreen
      mode="consumer"
      continueAction={startConsumerAssessmentAction}
      continueLabel="Create session and continue"
    />
  );
}
