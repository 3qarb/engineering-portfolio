import { useState } from 'react';
import { ArrowUpRight, Mail, Send } from 'lucide-react';
import { profile } from '../data/profile';
import { FadeUp, LineReveal } from '../components/ui/Motion';

const isPlaceholderPhone = (p: string) => /0{3}\s?0{4}/.test(p);

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [opened, setOpened] = useState(false);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Tell me your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter an email I can reply to.';
    if (form.message.trim().length < 10) next.message = 'Write a few words about the project.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = `${form.message.trim()}\n\n— ${form.name.trim()} (${form.email.trim()})`;
    const subject = form.subject.trim() || `Project enquiry from ${form.name.trim()}`;
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  return (
    <section className="wrap pb-28 pt-[calc(var(--header-h)+72px)] sm:pb-40 sm:pt-[calc(var(--header-h)+112px)]">
      <p className="label mb-8">
        <span className="text-sand">{profile.location}</span> / Contact
      </p>
      <LineReveal lines={['Start a', <span key="2">conversation</span>]} className="display h-xl" />

      <FadeUp delay={0.3} className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-10">
          <p className="lede max-w-[34ch]">
            Structural assessment, shop drawings, temporary works or a heritage building that needs a careful hand.
          </p>
          <dl className="flex flex-col">
            <div className="border-t border-white/[0.08] py-5">
              <dt className="label mb-2">Email</dt>
              <dd>
                <a href={`mailto:${profile.email}`} className="link-draw break-all text-[19px] text-bone">
                  {profile.email}
                </a>
              </dd>
            </div>
            {!isPlaceholderPhone(profile.phone) && (
              <div className="border-t border-white/[0.08] py-5">
                <dt className="label mb-2">Phone</dt>
                <dd>
                  <a href={`tel:${profile.phone.replace(/\s/g, '')}`} className="link-draw text-[19px] text-bone">
                    {profile.phone}
                  </a>
                </dd>
              </div>
            )}
            <div className="border-t border-white/[0.08] py-5">
              <dt className="label mb-2">LinkedIn</dt>
              <dd>
                <a href={profile.linkedin} target="_blank" rel="noreferrer" className="link-draw inline-flex items-center gap-2 text-[19px] text-bone">
                  Abdulaziz Kanaan <ArrowUpRight className="h-4 w-4" />
                </a>
              </dd>
            </div>
            <div className="border-t border-white/[0.08] py-5">
              <dt className="label mb-2">Based in</dt>
              <dd className="text-[19px] text-bone">{profile.location}</dd>
            </div>
          </dl>
        </div>

        <form onSubmit={submit} noValidate className="grid gap-5 rounded-3xl border border-white/[0.08] bg-ink-900 p-6 sm:grid-cols-2 sm:p-10">
          {(
            [
              ['name', 'Your name', 'text', 'name'],
              ['email', 'Your email', 'email', 'email'],
            ] as const
          ).map(([k, label, type, ac]) => (
            <label key={k}>
              <span className="field-label">{label}</span>
              <input className="field" type={type} autoComplete={ac} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-err` : undefined} />
              {errors[k] && (
                <span id={`${k}-err`} className="mt-2 block font-mono text-[12px] text-rust">
                  {errors[k]}
                </span>
              )}
            </label>
          ))}
          <label className="sm:col-span-2">
            <span className="field-label">Subject</span>
            <input className="field" value={form.subject} onChange={set('subject')} />
          </label>
          <label className="sm:col-span-2">
            <span className="field-label">About the project</span>
            <textarea className="field min-h-[160px]" value={form.message} onChange={set('message')} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'message-err' : undefined} />
            {errors.message && (
              <span id="message-err" className="mt-2 block font-mono text-[12px] text-rust">
                {errors.message}
              </span>
            )}
          </label>
          <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <button type="submit" className="btn-solid">
              <Send className="h-4 w-4" /> Write the email
            </button>
            <p className="flex items-center gap-2 text-[13px] text-bone-mute">
              <Mail className="h-3.5 w-3.5" />
              {opened ? 'Your email app should be open with the message ready.' : 'Opens your email app with the message filled in.'}
            </p>
          </div>
        </form>
      </FadeUp>
    </section>
  );
}
