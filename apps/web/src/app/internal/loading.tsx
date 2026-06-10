import { InternalStatePanel } from './_components/internal-state-panel';

export default function InternalLoading() {
  return (
    <InternalStatePanel
      variant="loading"
      title="Loading internal tooling"
      message="The internal view is retrieving database-backed records. Sparse data can be normal during early platform operation."
    />
  );
}
