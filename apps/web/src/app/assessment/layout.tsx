import type { ReactNode } from 'react';

import { AssessmentDeviceGate } from '@/features/assessment/components/assessment-device-gate';

type AssessmentLayoutProps = {
  children: ReactNode;
};

export default function AssessmentLayout({ children }: AssessmentLayoutProps) {
  return (
    <AssessmentDeviceGate>
      <div className="min-h-screen bg-slate-50 text-slate-950">{children}</div>
    </AssessmentDeviceGate>
  );
}
