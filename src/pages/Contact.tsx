import { useRef, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Mail, Send } from 'lucide-react';
import { profile, isPlaceholder } from '../data/profile';
import { FadeUp, LineReveal } from '../components/ui/Motion';
import { Seo } from '../components/Seo';
import { useProfile, useT } from '../i18n';

/** A form endpoint that accepts JSON (Formspree, Web3Forms, Getform…). Set VITE_CONTACT_ENDPOINT in .env */
const ENDPOINT = (import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined)?.trim() ?? '';
const EMAIL = isPlaceholder(profile.email) ? '' : profile.email;
const MODE: 'service' | 'mail' | 'off' = ENDPOINT ? 'service' : EMAIL ? 'mail' : 'off';

type Field = 'name' | 'email' | 'organisation' | 'topic' | 'message';
type Status = 'idle' | 'sending' | 'sent' | 'failed';

export function Contact() {
  const t = useT();
  const p = useProfile();
  const f = t.contact.form;
  const [form, setForm] = useState<Record<Field, string>>({ name: '', email: '', organisation: '', topic: f.topics[0], message: '' });
  const [trap, setTrap] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const refs = useRef<Partial<Record<Field, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const linkedin = profile.links.linkedin.verified ? profile.links.linkedin.url : '';
  const phone = isPlaceholder(profile.phone) ? '' : profile.phone;

  const set = (k: Field) => (e: { target: { value: string } }) => {
    setForm((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (MODE === 'off' || status === 'sending') return;
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = t.contact.errors.name;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) next.email = t.contact.errors.email;
    if (form.message.trim().length < 20) next.message = t.contact.errors.message;
    setErrors(next);
    const first = (['name', 'email', 'message'] as Field[]).find((k) => next[k]);
    if (first) {
      refs.current[first]?.focus();
      return;
    }
    if (trap) return setStatus('sent'); // a bot filled the hidden field

    const subject = `${form.topic} — ${form.name.trim()}${form.organisation.trim() ? `, ${form.organisation.trim()}` : ''}`;
    if (MODE === 'mail') {
      const body = `${form.message.trim()}\n\n— ${form.name.trim()}${form.organisation.trim() ? `, ${form.organisation.trim()}` : ''}\n${form.email.trim()}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...form, _subject: subject }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      setForm((s) => ({ ...s, message: '' }));
    } catch {
      setStatus('failed');
    }
  };

  const errorFor = (k: Field) =>
    errors[k] ? (
      <span id={`${k}-err`} className="mt-2 block text-[13px] text-rust">
        {errors[k]}
      </span>
    ) : null;
  const a11y = (k: Field) => ({ 'aria-invalid': !!errors[k] || undefined, 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  return (
    <>
      <Seo title={t.seo.contact.title} description={t.seo.contact.description} />
      <section className="wrap pb-28 pt-[calc(var(--header-h)+72px)] sm:pb-36 sm:pt-[calc(var(--header-h)+112px)]">
        <p className="label mb-8">
          <span className="text-sand">{p.location}</span> / {t.contact.label}
        </p>
        <LineReveal lines={[t.contact.lineA, <span key="2" className="text-bone-mute">{t.contact.lineB}</span>]} className="display h-xl" />

        <FadeUp delay={0.3} className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-10">
            <p className="lede max-w-[36ch]">{t.contact.lede}</p>
            <dl className="flex flex-col">
              {EMAIL && (
                <div className="border-t border-white/[0.08] py-5">
                  <dt className="label mb-2">{t.contact.email}</dt>
                  <dd>
                    <a href={`mailto:${EMAIL}`} className="link-draw break-all text-[19px] text-bone" dir="ltr">
                      {EMAIL}
                    </a>
                  </dd>
                </div>
              )}
              {phone && (
                <div className="border-t border-white/[0.08] py-5">
                  <dt className="label mb-2">{t.contact.phone}</dt>
                  <dd>
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="link-draw text-[19px] text-bone" dir="ltr">
                      {phone}
                    </a>
                  </dd>
                </div>
              )}
              {linkedin && (
                <div className="border-t border-white/[0.08] py-5">
                  <dt className="label mb-2">{t.contact.linkedin}</dt>
                  <dd>
                    <a href={linkedin} target="_blank" rel="noreferrer" className="link-draw inline-flex items-center gap-2 text-[19px] text-bone">
                      {p.shortName} <ArrowUpRight className="icon-dir h-4 w-4" />
                    </a>
                  </dd>
                </div>
              )}
              <div className="border-t border-white/[0.08] py-5">
                <dt className="label mb-2">{t.contact.basedIn}</dt>
                <dd className="text-[19px] text-bone">{p.location}</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={submit} noValidate className="grid gap-5 border border-white/[0.08] bg-ink-900 p-6 sm:grid-cols-2 sm:p-10" aria-describedby="form-mode">
            {status === 'sent' ? (
              <div className="flex flex-col items-start gap-4 sm:col-span-2" role="status">
                <CheckCircle2 className="h-8 w-8 text-sand" />
                <p className="text-[18px] text-bone">{f.sent}</p>
              </div>
            ) : (
              <>
                <label>
                  <span className="field-label">{f.name}</span>
                  <input ref={(n) => void (refs.current.name = n)} className="field" autoComplete="name" value={form.name} onChange={set('name')} disabled={MODE === 'off'} {...a11y('name')} />
                  {errorFor('name')}
                </label>
                <label>
                  <span className="field-label">{f.email}</span>
                  <input ref={(n) => void (refs.current.email = n)} className="field" type="email" inputMode="email" autoComplete="email" dir="ltr" value={form.email} onChange={set('email')} disabled={MODE === 'off'} {...a11y('email')} />
                  {errorFor('email')}
                </label>
                <label>
                  <span className="field-label">
                    {f.organisation} <span className="normal-case tracking-normal text-bone-faint">({f.optional})</span>
                  </span>
                  <input className="field" autoComplete="organization" value={form.organisation} onChange={set('organisation')} disabled={MODE === 'off'} />
                </label>
                <label>
                  <span className="field-label">{f.topic}</span>
                  <select className="field" value={form.topic} onChange={set('topic')} disabled={MODE === 'off'}>
                    {f.topics.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="field-label">{f.message}</span>
                  <textarea ref={(n) => void (refs.current.message = n)} className="field min-h-[170px]" value={form.message} onChange={set('message')} disabled={MODE === 'off'} {...a11y('message')} />
                  {errorFor('message')}
                </label>
                {/* spam trap: hidden from people, filled by bots */}
                <label className="sr-only" aria-hidden="true">
                  Website
                  <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
                </label>
                <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                  <button type="submit" className="btn-solid disabled:cursor-not-allowed disabled:opacity-50" disabled={MODE === 'off' || status === 'sending'}>
                    {MODE === 'mail' ? <Mail className="h-4 w-4" /> : <Send className="icon-dir h-4 w-4" />}
                    {MODE === 'mail' ? f.compose : status === 'sending' ? f.sending : f.send}
                  </button>
                  <p id="form-mode" className="max-w-[38ch] text-[13px] leading-snug text-bone-mute">
                    {MODE === 'service' ? f.viaService : MODE === 'mail' ? f.viaMail : f.unavailable}
                  </p>
                </div>
                {status === 'failed' && (
                  <p role="alert" className="text-[14px] text-rust sm:col-span-2">
                    {f.failed}
                  </p>
                )}
              </>
            )}
          </form>
        </FadeUp>
      </section>
    </>
  );
}
