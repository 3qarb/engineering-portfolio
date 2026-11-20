import { Link } from 'react-router-dom';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { profile, isPlaceholder } from '../../data/profile';
import { NAV } from '../../data/nav';
import { useLocalePath, useProfile, useT } from '../../i18n';

const YEAR = new Date().getFullYear();

export function Footer({ home = false }: { home?: boolean }) {
  const t = useT();
  const lp = useLocalePath();
  const p = useProfile();
  const email = isPlaceholder(profile.email) ? '' : profile.email;
  const linkedin = profile.links.linkedin.verified ? profile.links.linkedin.url : '';

  return (
    <footer className="site-chrome relative overflow-hidden border-t border-white/[0.08] bg-ink-950">
      <div className="wrap pb-10 pt-20 sm:pt-28">
        {!home && (
          <>
            <p className="label mb-8">{t.footer.next}</p>
            <Link to={lp('/contact')} className="group mb-20 block w-fit">
              <span className="display h-lg block transition-colors duration-500 group-hover:text-sand">{t.footer.ctaA}</span>
              <span className="display h-lg flex items-center gap-6">
                <span className="text-bone-mute">{t.footer.ctaB}</span>
                <ArrowUpRight
                  className="icon-dir h-[0.6em] w-[0.6em] shrink-0 text-sand transition-transform duration-500 group-hover:-translate-y-2 group-hover:translate-x-2"
                  strokeWidth={1.2}
                />
              </span>
            </Link>
          </>
        )}

        <div className="grid gap-10 border-t border-white/[0.08] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="label mb-4">{t.footer.write}</p>
            {email ? (
              <a href={`mailto:${email}`} className="link-draw break-all text-[17px] text-bone" dir="ltr">
                {email}
              </a>
            ) : (
              <Link to={lp('/contact')} className="link-draw inline-flex min-h-[44px] items-center text-[17px] text-bone">
                {t.nav.contact}
              </Link>
            )}
          </div>
          <div>
            <p className="label mb-4">{t.footer.pages}</p>
            <ul className="flex flex-col">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={lp(n.to)} className="link-draw inline-flex min-h-[44px] items-center text-[15px] text-bone-dim hover:text-bone">
                    {t.nav[n.key]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-4">{t.footer.elsewhere}</p>
            <ul className="flex flex-col">
              {linkedin && (
                <li>
                  <a href={linkedin} target="_blank" rel="noreferrer" className="link-draw inline-flex min-h-[44px] items-center text-[15px] text-bone-dim hover:text-bone">
                    LinkedIn
                  </a>
                </li>
              )}
              <li>
                <a href={profile.cvUrl} download className="link-draw inline-flex min-h-[44px] items-center text-[15px] text-bone-dim hover:text-bone">
                  {t.common.downloadCv} (PDF)
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="label mb-4">{t.footer.basedIn}</p>
            <p className="text-[15px] text-bone-dim">{p.location}</p>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between gap-6">
          <p className="label">
            © {YEAR} {p.name}
          </p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="label inline-flex min-h-[44px] items-center gap-2 hover:text-bone"
          >
            {t.common.backToTop} <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p
        aria-hidden="true"
        dir="ltr"
        className="display pointer-events-none select-none whitespace-nowrap text-center text-[23vw] leading-[0.75] text-white/[0.035]"
      >
        Kanaan
      </p>
    </footer>
  );
}
