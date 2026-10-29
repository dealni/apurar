import type { Snapshot } from "../../../../packages/contracts/snapshot";

/** Um relógio corrigido não pode prender o cliente a uma publicação futura. */
export function validatePublication(
  snapshot: Snapshot,
  previous: Snapshot | null | undefined,
  now = Date.now(),
) {
  if (
    previous &&
    Date.parse(previous.published_at) <= now + 60000 &&
    Date.parse(snapshot.published_at) < Date.parse(previous.published_at)
  )
    throw new Error(
      "Publicação anterior à última atualização válida; aguardando sincronização.",
    );
}
