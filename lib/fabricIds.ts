// A fabric has two ids: the database uuid and legacy_id, the slug in /fabrics/<slug>. The shop
// uses the slug. Until 2026-11 the fabric page saved the uuid instead, so lists already stored in
// shoppers' browsers hold either one -- anything reading a saved id has to accept both.

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,120}$/i; // also matches uuids

export const isUuid = (id: string) => UUID_PATTERN.test(id);

/** Looks fabrics up by whichever id was given. The map is keyed by both ids of each row found. */
export async function findFabricsByAnyId<Row extends { id: string; legacy_id: string | null }>(
  db: { from: (table: string) => any },
  ids: string[],
  columns: string
): Promise<Map<string, Row>> {
  const wanted = ids.filter((id) => SLUG_PATTERN.test(id));
  const uuids = wanted.filter(isUuid);
  const slugs = wanted.filter((id) => !isUuid(id));
  const select = async (column: string, values: string[]): Promise<Row[]> => {
    if (values.length === 0) return [];
    const { data, error } = await db.from('charlotte_fabrics').select(columns).in(column, values);
    if (error) throw error;
    return data || [];
  };
  const rows = [...(await select('id', uuids)), ...(await select('legacy_id', slugs))];
  const found = new Map<string, Row>();
  for (const row of rows) {
    found.set(row.id, row);
    if (row.legacy_id) found.set(row.legacy_id, row);
  }
  return found;
}

/**
 * Rewrites uuids in a saved list to slugs, dropping the duplicate if the same fabric was saved both
 * ways. Returns the same array when there is nothing to change.
 */
export function replaceSavedIds<Item extends { fabricId: string }>(items: Item[], slugById: Map<string, string>): Item[] {
  if (!items.some((item) => slugById.has(item.fabricId))) return items;
  const seen = new Set<string>();
  return items
    .map((item) => ({ ...item, fabricId: slugById.get(item.fabricId) ?? item.fabricId }))
    .filter((item) => !seen.has(item.fabricId) && !!seen.add(item.fabricId));
}
