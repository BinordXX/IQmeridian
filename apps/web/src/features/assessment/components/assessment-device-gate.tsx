'use client';

import { type ReactNode } from 'react';

type AssessmentDeviceGateProps = {
  children: ReactNode;
  minSupportedWidth?: number;
};

export const AssessmentDeviceGate = ({
  children,
}: AssessmentDeviceGateProps) => {
  return <>{children}</>;
};
