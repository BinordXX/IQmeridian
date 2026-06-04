'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { AssessmentStatePanel } from './assessment-state-panel';

type AssessmentDeviceGateProps = {
  children: ReactNode;
  minSupportedWidth?: number;
};

const DEFAULT_MIN_SUPPORTED_WIDTH = 768;

export const AssessmentDeviceGate = ({
  children,
  minSupportedWidth = DEFAULT_MIN_SUPPORTED_WIDTH,
}: AssessmentDeviceGateProps) => {
  const [hasCheckedDevice, setHasCheckedDevice] = useState(false);
  const [isUnsupportedDevice, setIsUnsupportedDevice] = useState(false);

  useEffect(() => {
    const checkDeviceSupport = (): void => {
      setIsUnsupportedDevice(window.innerWidth < minSupportedWidth);
      setHasCheckedDevice(true);
    };

    checkDeviceSupport();

    window.addEventListener('resize', checkDeviceSupport);

    return () => {
      window.removeEventListener('resize', checkDeviceSupport);
    };
  }, [minSupportedWidth]);

  if (!hasCheckedDevice) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <AssessmentStatePanel
          eyebrow="Checking device"
          title="Checking assessment compatibility"
          body="The system is confirming that this device can display the assessment interface reliably."
          tone="neutral"
          action={
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          }
        />
      </main>
    );
  }

  if (isUnsupportedDevice) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <AssessmentStatePanel
          eyebrow="Unsupported screen size"
          title="Use a larger screen to take this assessment"
          body="This assessment is not currently supported on small mobile screens. Please use a laptop, desktop, or larger tablet so the item content, timing information, and answer options remain clear and reliable."
          tone="warning"
        />
      </main>
    );
  }

  return <>{children}</>;
};
