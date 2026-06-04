export type AssessmentTelemetryEventName =
  | 'assessment_started'
  | 'section_entered'
  | 'autosave_triggered'
  | 'section_completed'
  | 'submission_initiated'
  | 'submission_completed'
  | 'resume_flow_triggered';

type AssessmentTelemetryPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

type AssessmentTelemetryEvent = {
  name: AssessmentTelemetryEventName;
  payload: AssessmentTelemetryPayload;
  occurredAt: string;
};

const getTelemetryEndpoint = (): string | undefined => {
  return process.env.NEXT_PUBLIC_ASSESSMENT_TELEMETRY_URL;
};

export const trackAssessmentEvent = async (
  name: AssessmentTelemetryEventName,
  payload: AssessmentTelemetryPayload = {}
): Promise<void> => {
  if (typeof window === 'undefined') {
    return;
  }

  const event: AssessmentTelemetryEvent = {
    name,
    payload,
    occurredAt: new Date().toISOString(),
  };

  window.dispatchEvent(
    new CustomEvent<AssessmentTelemetryEvent>(
      'iqmeridian:assessment-telemetry',
      {
        detail: event,
      }
    )
  );

  const endpoint = getTelemetryEndpoint();

  if (!endpoint) {
    return;
  }

  const body = JSON.stringify(event);

  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        endpoint,
        new Blob([body], { type: 'application/json' })
      );

      if (sent) {
        return;
      }
    }

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    });
  } catch {
    // Telemetry must never interrupt the candidate assessment flow.
  }
};
