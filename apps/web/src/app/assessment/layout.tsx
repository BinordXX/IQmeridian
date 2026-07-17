import type { ReactNode } from 'react';

import { AssessmentDeviceGate } from '@/features/assessment/components/assessment-device-gate';

type AssessmentLayoutProps = {
  children: ReactNode;
};

export default function AssessmentLayout({ children }: AssessmentLayoutProps) {
  return (
    <AssessmentDeviceGate>
      <div className="min-h-screen bg-[#020817] text-white">{children}</div>
    </AssessmentDeviceGate>
  );
}
