/**
 * Supabase (PostgREST) silently caps every query at 1000 rows — no error, just a truncated result.
 * The charlotte_fabrics table has ~7000 rows, so any "read them all" query must page through with
 * .range(). Pass a function that builds a fresh query each call (query builders are single-use),
 * e.g.  fetchAllRows(() => supabase.from('charlotte_fabrics').select('id, sku'))
 *
 * Rows are ordered by `orderBy` (default "id") so pages don't overlap or skip while paging.
 */
const PAGE_SIZE = 1000;

async function fetchAllRows(buildQuery, orderBy = 'id') {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery()
      .order(orderBy)
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

module.exports = { fetchAllRows };
