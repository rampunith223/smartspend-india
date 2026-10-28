import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { LogoMark } from '../components/Logo.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-md text-center">
        <LogoMark size="lg" className="mx-auto" />
        <p className="mt-6 font-display text-7xl font-semibold tracking-[-0.06em] text-ink-950 dark:text-white">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink-900 dark:text-white">
          This page isn’t in the budget.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          The link may be old, or the page may have moved. Your transactions are safe.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/">
            <Button variant="secondary">
              <ArrowLeft size={15} /> Home
            </Button>
          </Link>
          <Link to="/app">
            <Button>
              <Compass size={15} /> Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
