import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function NotFound() {
  return (
    <section className="wrap flex min-h-[80svh] flex-col justify-end pb-20 pt-[calc(var(--header-h)+48px)]">
      <p className="label mb-6 text-sand">Error 404</p>
      <h1 className="display h-xl">
        Load path
        <br />
        <span className="serif-accent">not found</span>
      </h1>
      <p className="mt-8 max-w-[40ch] text-[17px] text-bone-dim">This page was never built, or it has been taken down.</p>
      <Link to="/" className="btn-solid mt-10 w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to the start
      </Link>
    </section>
  );
}
