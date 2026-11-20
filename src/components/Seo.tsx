import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { basePath, langOf, withLang } from '../i18n/lang';
import { SITE_URL } from '../lib/site';

let staticRemoved = false;

/**
 * Page title, description, canonical, hreflang and Open Graph. React 19 hoists these into <head>.
 * index.html carries static defaults (for link previews that do not run JavaScript); they are
 * removed once React takes over so the head never holds two titles.
 */
export function Seo({
  title,
  description,
  image = '/og.jpg',
  type = 'website',
  jsonLd,
  noindex = false,
}: {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  jsonLd?: object;
  noindex?: boolean;
}) {
  const { pathname } = useLocation();
  const lang = langOf(pathname);
  const base = basePath(pathname);
  const url = SITE_URL ? SITE_URL + withLang(base, lang) : '';
  const img = image.startsWith('http') || image.startsWith('data:') ? image : SITE_URL + image;

  useEffect(() => {
    if (staticRemoved) return;
    staticRemoved = true;
    document.querySelectorAll('[data-static-seo]').forEach((n) => n.remove());
  }, []);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}
      {url && <link rel="canonical" href={url} />}
      {SITE_URL && <link rel="alternate" hrefLang="en" href={SITE_URL + withLang(base, 'en')} />}
      {SITE_URL && <link rel="alternate" hrefLang="ar" href={SITE_URL + withLang(base, 'ar')} />}
      {SITE_URL && <link rel="alternate" hrefLang="x-default" href={SITE_URL + withLang(base, 'en')} />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:locale" content={lang === 'ar' ? 'ar_SA' : 'en_GB'} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </>
  );
}
