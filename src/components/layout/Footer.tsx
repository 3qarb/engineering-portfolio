import { Link } from 'react-router-dom';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { profile } from '../../data/profile';
import { NAV } from '../../data/nav';

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.08] bg-ink-950">
      <div className="wrap pb-10 pt-24 sm:pt-32">
        <p className="label mb-8">Next step</p>
        <Link to="/contact" className="group block w-fit">
          <span className="display h-lg block transition-colors duration-500 group-hover:text-sand">Let's build</span>
          <span className="display h-lg flex items-center gap-6">
            <span className="serif-accent">something that lasts</span>
            <ArrowUpRight className="h-[0.6em] w-[0.6em] shrink-0 text-sand transition-transform duration-500 group-hover:-translate-y-2 group-hover:translate-x-2" strokeWidth={1.2} />
          </span>
        </Link>

        <div className="mt-20 grid gap-10 border-t border-white/[0.08] pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="label mb-4">Write to me</p>
            <a href={`mailto:${profile.email}`} className="link-draw break-all text-[17px] text-bone">
              {profile.email}
            </a>
          </div>
          <div>
            <p className="label mb-4">Pages</p>
            <ul className="flex flex-col gap-2">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="link-draw text-[15px] text-bone-dim hover:text-bone">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-4">Elsewhere</p>
            <ul className="flex flex-col gap-2">
              <li>
                <a href={profile.linkedin} target="_blank" rel="noreferrer" className="link-draw text-[15px] text-bone-dim hover:text-bone">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href={profile.cvUrl} download className="link-draw text-[15px] text-bone-dim hover:text-bone">
                  Download CV (PDF)
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="label mb-4">Based in</p>
            <p className="text-[15px] text-bone-dim">{profile.location}</p>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between gap-6">
          <p className="label">© {YEAR} {profile.name}</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="label inline-flex min-h-[44px] items-center gap-2 hover:text-bone"
          >
            Back to top <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p
        aria-hidden="true"
        className="display pointer-events-none select-none whitespace-nowrap text-center text-[23vw] leading-[0.75] text-white/[0.035]"
      >
        Kanaan
      </p>
    </footer>
  );
}
