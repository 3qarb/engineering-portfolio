import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { profile } from '../../data/profile';
import { NAV } from '../../data/nav';
import { useUi } from '../../store/uiStore';
import { cn } from '../../utils/cn';


const ease = [0.22, 1, 0.36, 1] as const;

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('h-8 w-8', className)} aria-hidden="true">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7" fill="none" stroke="currentColor" strokeOpacity=".35" />
      <path d="M8 24V9h16v15M8 14h16M16 9v15" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="14" r="2" fill="#c9a46c" />
    </svg>
  );
}

function MenuOverlay() {
  const open = useUi((s) => s.menuOpen);
  const setOpen = useUi((s) => s.setMenuOpen);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="site-menu"
          className="fixed inset-0 z-[95] flex flex-col bg-ink-950 pt-[var(--header-h)] md:hidden"
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)', transition: { duration: 0.6, ease } }}
          exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.45, ease } }}
        >
          <nav className="wrap flex flex-1 flex-col justify-center gap-2" aria-label="Main">
            {[{ to: '/', label: 'Home' }, ...NAV].map((n, i) => (
              <motion.div
                key={n.to}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0.15 + i * 0.06, duration: 0.6, ease } }}
              >
                <Link to={n.to} onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-1">
                  <span className="font-mono text-xs text-sand">0{i + 1}</span>
                  <span className="display text-[17vw]">{n.label}</span>
                </Link>
              </motion.div>
            ))}
          </nav>
          <div className="wrap flex justify-between border-t border-white/10 py-6">
            <a className="label text-bone" href={`mailto:${profile.email}`}>
              Email
            </a>
            <a className="label text-bone" href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
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
  }, [open]);

  return (
    <>
      <motion.header
        className={cn(
          'fixed inset-x-0 top-0 z-[100] transition-[background-color,border-color] duration-500',
          solid && !open ? 'border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl' : 'border-b border-transparent',
        )}
        animate={{ y: hidden ? '-100%' : '0%' }}
        transition={{ duration: 0.45, ease }}
      >
        <div className="wrap flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link to="/" className="group flex min-h-[44px] items-center gap-3 text-bone" aria-label="Abdulaziz Kanaan, home">
            <Mark className="transition-transform duration-500 group-hover:rotate-90" />
            <span className="label hidden text-bone sm:inline">Abdulaziz Kanaan</span>
          </Link>
          <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
            {NAV.map((n, i) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn('label link-draw flex min-h-[44px] items-center gap-2 transition-colors hover:text-bone', isActive && 'text-sand')
                }
              >
                <span className="text-bone-faint">0{i + 1}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/contact" className="btn-solid hidden min-h-[42px] md:inline-flex">
            Hire me
          </Link>
          <button
            type="button"
            className="label flex min-h-[44px] items-center gap-3 text-bone md:hidden"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen(!open)}
          >
            {open ? 'Close' : 'Menu'}
            <span className="relative block h-3 w-5">
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
