import { ItemFormPlacementClient } from '../../../../_components/item-form-placement-client';
import {
  fetchInternalItemById,
  fetchInternalAssessmentForms,
} from '../../../../_lib/internal-api';

export default async function AttachItemToFormPage({
  params,
}: {
  params: Promise<{
    itemId: string;
  }>;
}) {
  const { itemId } = await params;

  const [item, forms] = await Promise.all([
    fetchInternalItemById(itemId),
    fetchInternalAssessmentForms(),
  ]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
          Item placement
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Attach item to assessment form
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-600">
          Attach <span className="font-semibold">{item.id}</span> to a real
          database-backed assessment form and section. The selected mapping will
          update form blueprint counts and item traceability.
        </p>
      </section>

      <ItemFormPlacementClient item={item} forms={forms} />
    </main>
  );
}
