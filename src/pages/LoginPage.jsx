import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/ui/Button.jsx';
import { Field } from '../components/ui/Form.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const DEMO_EMAIL = 'demo@smartspend.in';
const DEMO_PASSWORD = 'Demo@123';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('demo') === '1') {
      setEmail(DEMO_EMAIL);
      setPassword(DEMO_PASSWORD);
    }
  }, [searchParams]);

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError('');
    toast.info('Demo credentials filled. Sign in to explore.');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back.');
      navigate(location.state?.from?.pathname || '/app', { replace: true });
    } catch (requestError) {
      setError(requestError?.message || 'Could not sign you in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-2 font-display text-[2.4rem] font-semibold leading-tight tracking-[-0.04em] text-ink-950 dark:text-white">
          Pick up where you left off.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          Your spending, budgets and goals are waiting.
        </p>

        <div className="mt-7 rounded-2xl border border-saffron-200/80 bg-saffron-50/80 p-3.5 dark:border-saffron-400/20 dark:bg-saffron-400/[0.07]">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-saffron-200/70 text-saffron-800 dark:bg-saffron-400/15 dark:text-saffron-300">
              <Sparkles size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-saffron-900 dark:text-saffron-200">
                Want to look around first?
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-saffron-800/70 dark:text-saffron-100/60">
                Use the demo account with a month of realistic Indian transactions.
              </p>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="shrink-0 self-center text-[11px] font-bold text-saffron-800 underline decoration-saffron-400 underline-offset-2 hover:text-saffron-950 dark:text-saffron-200"
            >
              Fill demo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Email address" htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="field"
            />
          </Field>

          <Field label="Password" htmlFor="login-password">
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
                className="field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {error ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-clay-50 px-3.5 py-3 text-xs font-medium text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Sign in <ArrowRight size={16} />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
          New to SmartSpend?{' '}
          <Link
            to="/register"
            className="font-bold text-forest-800 hover:text-forest-950 dark:text-forest-300 dark:hover:text-forest-200"
          >
            Create an account
          </Link>
        </p>
        <p className="mt-5 text-center text-[11px] text-ink-400 dark:text-ink-600">
          <Link to="/" className="hover:text-ink-700 dark:hover:text-ink-300">
            ← Back to home
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
