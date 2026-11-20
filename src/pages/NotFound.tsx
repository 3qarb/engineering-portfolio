import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Seo } from '../components/Seo';
import { useLocalePath, useT } from '../i18n';

export function NotFound() {
  const t = useT();
  const lp = useLocalePath();
  return (
    <section className="wrap flex min-h-[80svh] flex-col justify-end pb-20 pt-[calc(var(--header-h)+48px)]">
      <Seo title={`${t.notFound.title} — Abdulaziz Kanaan`} description={t.notFound.body} noindex />
      <p className="label mb-6 text-sand" lang="en">
        Error 404
      </p>
      <h1 className="display h-xl">{t.notFound.title}</h1>
      <p className="mt-8 max-w-[44ch] text-[17px] text-bone-dim">{t.notFound.body}</p>
      <Link to={lp('/')} className="btn-solid mt-10 w-fit">
        <ArrowLeft className="icon-dir h-4 w-4" /> {t.notFound.back}
      </Link>
    </section>
  );
}
