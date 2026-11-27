"use client";

import { useState } from "react";

/**
 * Returns the ids that appeared after the list first finished loading, so a
 * newly created item can settle into place once without animating the
 * initial render.
 */
export default function useNewIds(ids: string[], isLoading: boolean) {
  const [baseline, setBaseline] = useState<Set<string> | null>(null);

  // Capture the first loaded set during render (React's "adjust state while
  // rendering" pattern) so no extra effect pass or flash occurs.
  if (!isLoading && baseline === null) {
    setBaseline(new Set(ids));
    return new Set<string>();
  }

  return new Set(baseline ? ids.filter((id) => !baseline.has(id)) : []);
}
