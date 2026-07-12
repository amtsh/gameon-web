type SearchParams = Record<string, string | string[] | undefined>;

export function buildRedirectPath(
  pathname: string,
  searchParams?: SearchParams,
): string {
  if (!searchParams) return pathname;

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") {
      query.set(key, value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry);
      }
    }
  }

  const remainder = query.toString();
  return remainder ? `${pathname}?${remainder}` : pathname;
}
