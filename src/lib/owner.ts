// Owner tools (add, import, export projects) are hidden from visitors on the public site.
// Open the site once with ?owner=1 to show them in that browser, ?owner=0 to hide them again.
// Not access control: these tools only ever write to the visitor's own browser storage.
const KEY = 'ak-owner';

/** Reads ?owner=1 / ?owner=0 from the first URL and remembers it. Call once before rendering. */
export function initOwner() {
  try {
    const q = new URLSearchParams(window.location.search).get('owner');
    if (q === '1') localStorage.setItem(KEY, '1');
    if (q === '0') localStorage.removeItem(KEY);
  } catch {
    /* storage blocked: owner tools stay hidden */
  }
}

export function isOwner(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}
