import { Fzf, byLengthAsc, byStartAsc, extendedMatch } from "fzf";

export interface FuzzySearchOptions<T> {
   /** Returns the string a candidate is matched against. */
   selector: (item: T) => string;
   /** Cap on how many matches come back. Defaults to all of them. */
   limit?: number;
   /**
    * Treat whitespace in the query as a term separator: every term has to match
    * somewhere in the candidate, in any order. Useful when the selected text
    * concatenates several fields and the caller should not have to type them in
    * the order they happen to be joined.
    *
    * Enables fzf's extended search syntax as a side effect, so `!`, `^`, `$` and
    * `'` become operators rather than literal characters.
    *
    * @defaultValue `false`
    */
   extendedSearch?: boolean;
}

/** Queries a list that was indexed once, best match first. */
export type FuzzySearcher<T> = (query: string) => T[];

/** What actually goes into the index: the selected text plus a way back to the item. */
interface IndexEntry {
   position: number;
   text: string;
}

/**
 * Index `items` once and hand back a searcher, so an interactive prompt does
 * not rebuild the index on every keystroke.
 *
 * Matching is fzf's FuzzyMatchV2: the query has to appear as a subsequence of
 * the candidate — so typos do not match — ranked by fzf's bonuses for word
 * boundaries, camelCase humps and consecutive characters. Ties break towards
 * the shorter candidate, then the earlier match.
 */
export function createFuzzySearcher<T>(
   items: readonly T[],
   { selector, limit, extendedSearch = false }: FuzzySearchOptions<T>
): FuzzySearcher<T> {
   const entries: IndexEntry[] = items.map((item, position) => ({
      position,
      text: selector(item)
   }));

   const fzf = new Fzf(entries, {
      selector: (entry) => entry.text,
      limit: limit ?? Number.POSITIVE_INFINITY,
      tiebreakers: [byLengthAsc, byStartAsc],
      ...(extendedSearch ? { match: extendedMatch } : {})
   });

   return (query) => {
      // fzf scores every candidate 0 for a blank query, which would leave the
      // tiebreakers to reorder the whole list. Keep the original order instead.
      if (!query.trim()) {
         return limit === undefined ? [...items] : items.slice(0, limit);
      }
      return fzf.find(query).map((result) => items[result.item.position]);
   };
}

/** One-shot fuzzy search, for when the query is known up front. */
export function fuzzySearch<T>(
   items: readonly T[],
   query: string,
   opts: FuzzySearchOptions<T>
): T[] {
   return createFuzzySearcher(items, opts)(query);
}
