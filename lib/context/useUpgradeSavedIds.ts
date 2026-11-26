import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { findFabricsByAnyId, isUuid, replaceSavedIds } from '@/lib/fabricIds';
import { supabase } from '@/lib/supabase/client';

/** Once a saved list has loaded, swaps any old uuid entries for slugs (see lib/fabricIds.ts). */
export function useUpgradeSavedIds<Item extends { fabricId: string }>(items: Item[], setItems: Dispatch<SetStateAction<Item[]>>) {
  const uuids = items.map((item) => item.fabricId).filter(isUuid).join(',');

  useEffect(() => {
    if (!uuids || !supabase) return;
    const ids = uuids.split(',');
    findFabricsByAnyId<{ id: string; legacy_id: string | null }>(supabase, ids, 'id, legacy_id')
      .then((rows) => {
        const slugById = new Map<string, string>();
        for (const id of ids) {
          const slug = rows.get(id)?.legacy_id;
          if (slug) slugById.set(id, slug);
        }
        setItems((prev) => replaceSavedIds(prev, slugById));
      })
      .catch(() => {}); // offline or blocked: the old ids still work on the server
  }, [uuids, setItems]);
}
