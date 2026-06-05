import { getActiveAssessmentForms } from '@/features/employer/api/employer-dashboard-api';
import { EmployerCampaignCreateForm } from '@/features/employer/components/employer-campaign-create-form';

const EMPLOYER_ORGANISATION_ID = 'dev-employer-org';

export default async function NewEmployerCampaignPage() {
  const activeForms = await getActiveAssessmentForms();

  return (
    <EmployerCampaignCreateForm
      activeForms={activeForms}
      organisationId={EMPLOYER_ORGANISATION_ID}
    />
  );
}
