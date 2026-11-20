import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Download } from 'lucide-react';
import { profile, isPlaceholder } from '../../data/profile';
import { NAV } from '../../data/nav';
import { useUi } from '../../store/uiStore';
import { useAlternatePath, useLang, useLocalePath, useProfile, useT } from '../../i18n';
import { cn } from '../../utils/cn';

const ease = [0.22, 1, 0.36, 1] as const;

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden="true">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="2" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <path d="M8 24V9h16v15M8 14h16M16 9v15" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="14" r="2" fill="#c9a46c" />
    </svg>
  );
}

function LangSwitch({ className }: { className?: string }) {
  const t = useT();
  const lang = useLang();
  const to = useAlternatePath();
  return (
    <Link
      to={to}
      hrefLang={lang === 'ar' ? 'en' : 'ar'}
      lang={lang === 'ar' ? 'en' : 'ar'}
      aria-label={t.switchLabel}
      className={cn('label flex min-h-[44px] items-center text-bone transition-colors hover:text-sand', lang === 'en' && 'font-arabic text-[14px] normal-case tracking-normal', className)}
    >
      {t.switchTo}
    </Link>
  );
}

function MenuOverlay() {
  const open = useUi((s) => s.menuOpen);
  const setOpen = useUi((s) => s.setMenuOpen);
  const t = useT();
  const lp = useLocalePath();
  const items = [{ to: '/', label: t.common.home }, ...NAV.map((n) => ({ to: n.to, label: t.nav[n.key] }))];
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="site-menu"
          className="fixed inset-0 z-[95] flex flex-col overflow-y-auto bg-ink-950 pt-[var(--header-h)] lg:hidden"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.5, ease } }}
          exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.35, ease } }}
        >
          <nav className="wrap flex flex-1 flex-col justify-center gap-1 py-8" aria-label="Main">
            {items.map((n, i) => (
              <motion.div
                key={n.to}
                initial={{ y: 32, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.12 + i * 0.05, duration: 0.5, ease } }}
              >
                <Link to={lp(n.to)} onClick={() => setOpen(false)} className="flex min-h-[44px] items-baseline gap-4 py-1">
                  <span className="font-mono text-xs text-sand">0{i + 1}</span>
                  <span className="display text-[clamp(36px,11vw,64px)]">{n.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
          <div className="wrap flex items-center justify-between gap-4 border-t border-white/10 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <LangSwitch />
            <a href={profile.cvUrl} download className="label flex min-h-[44px] items-center gap-2 text-bone">
              <Download className="h-3.5 w-3.5" /> {t.common.downloadCv}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const open = useUi((s) => s.menuOpen);
  const setOpen = useUi((s) => s.setMenuOpen);
  const t = useT();
  const lp = useLocalePath();
  const p = useProfile();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const last = useRef(0);

  useMotionValueEvent(scrollY, 'change', (y) => {
    setSolid(y > 24);
    setHidden(y > last.current && y > 240 && !open);
    last.current = y;
  });

  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <>
      <motion.header
        className={cn(
          'site-chrome fixed inset-x-0 top-0 z-[100] pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-500',
          solid && !open ? 'border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl' : 'border-b border-transparent',
        )}
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.4, ease }}
      >
        <div className="wrap flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link to={lp('/')} className="group flex min-h-[44px] items-center gap-3 text-bone" aria-label={`${p.shortName}, ${t.common.home}`}>
            <Mark className="transition-transform duration-500 group-hover:rotate-90" />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="text-[14px] font-medium tracking-[-0.01em] text-bone">{p.shortName}</span>
              <span className="label mt-1 text-[10px]">{p.titles[1]}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 lg:flex xl:gap-9" aria-label="Main">
            {NAV.filter((n) => n.key !== 'cv').map((n) => (
              <NavLink
                key={n.to}
                to={lp(n.to)}
                className={({ isActive }) =>
                  cn('label link-draw flex min-h-[44px] items-center transition-colors hover:text-bone', isActive && 'text-sand')
                }
              >
                {t.nav[n.key]}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-6 lg:flex">
            <LangSwitch />
            {!isPlaceholder(profile.cvUrl) && (
              <a href={profile.cvUrl} download className="btn-solid min-h-[44px]" aria-label={t.common.downloadCv}>
                <Download className="h-3.5 w-3.5" /> {t.nav.cv}
              </a>
            )}
          </div>
          <button
            type="button"
            className="label flex min-h-[44px] items-center gap-3 text-bone lg:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? t.common.close : t.common.menu}
            <span className="relative block h-3 w-5" aria-hidden="true">
              <span className={cn('absolute left-0 h-px w-5 bg-bone transition-all duration-300', open ? 'top-1.5 rotate-45' : 'top-0')} />
              <span className={cn('absolute left-0 h-px w-5 bg-bone transition-all duration-300', open ? 'top-1.5 -rotate-45' : 'top-3')} />
            </span>
          </button>
        </div>
      </motion.header>
      <MenuOverlay />
    </>
  );
}
