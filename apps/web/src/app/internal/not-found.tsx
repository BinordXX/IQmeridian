import { InternalStatePanel } from './_components/internal-state-panel';

export default function InternalNotFound() {
  return (
    <InternalStatePanel
      variant="empty"
      title="Internal record not found"
      message="The requested item, session, report, export, or analytics record could not be found. This may mean the record does not exist yet, was removed, or the route was opened with an invalid identifier."
      actionHref="/internal"
      actionLabel="Return to internal dashboard"
    />
  );
}
