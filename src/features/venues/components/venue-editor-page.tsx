import { useOrganization } from "@clerk/tanstack-react-start";
import type { FC } from "react";
import { Suspense } from "react";

import { Spinner } from "@/components/ui/spinner";
import { VenueEditor } from "@/features/venues/components/venue-editor";
import { useVenueEditorData } from "@/features/venues/hooks/use-venues";

/** The "Espacio" dashboard section: the venue editor with its live preview. The
 * `/dashboard` shell already guarantees an admin; the loader prefetched the
 * editor payload, so the Suspense boundary resolves on first paint. */
export const VenueEditorPage: FC = () => {
  const { isLoaded, organization } = useOrganization();

  if (!isLoaded) {
    return <Spinner className="mx-auto my-24" />;
  }

  if (!organization) {
    return <Preparing />;
  }

  return (
    <Suspense fallback={<Spinner className="mx-auto my-24" />}>
      <VenueEditorInner orgId={organization.id} />
    </Suspense>
  );
};

const VenueEditorInner: FC<{ orgId: string }> = ({ orgId }) => {
  const { data } = useVenueEditorData(orgId);

  if (!data) {
    return <Preparing />;
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-2xl tracking-tight">Tu espacio</h1>
        <p className="text-muted-foreground text-sm">
          Configura lo que ofreces. Tu espacio se publica automáticamente cuando
          la información esté completa.
        </p>
      </header>
      <VenueEditor
        venue={data.venue}
        units={data.units}
        equipment={data.equipment}
      />
    </div>
  );
};

const Preparing: FC = () => (
  <div className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">
    Estamos preparando tu espacio. Recarga en unos segundos.
  </div>
);
