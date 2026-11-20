/** Absolute site address for canonical/OG links, e.g. https://example.com — set VITE_SITE_URL in .env */
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
