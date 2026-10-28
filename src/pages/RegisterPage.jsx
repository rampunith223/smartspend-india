import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/ui/Button.jsx';
import { Field } from '../components/ui/Form.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../lib/cn.js';

function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const score = passwordScore(password);
  const strengthLabels = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
  const strengthColors = ['bg-ink-200', 'bg-clay-500', 'bg-saffron-400', 'bg-forest-400', 'bg-forest-600'];

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      toast.success('Your account is ready. Let’s make this month clearer.');
      navigate('/app', { replace: true });
    } catch (requestError) {
      setError(requestError?.message || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div>
        <p className="eyebrow">Start fresh</p>
        <h1 className="mt-2 font-display text-[2.4rem] font-semibold leading-tight tracking-[-0.04em] text-ink-950 dark:text-white">
          A clearer month starts here.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          Create your private account. Add your first expense in under a minute.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <Field label="Your name" htmlFor="register-name">
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Ananya Rao"
              className="field"
            />
          </Field>

          <Field label="Email address" htmlFor="register-email">
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="field"
            />
          </Field>

          <Field label="Password" htmlFor="register-password">
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
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
            {password ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((index) => (
                    <span
                      key={index}
                      className={cn(
                        'h-1 flex-1 rounded-full transition',
                        index < score ? strengthColors[score] : 'bg-ink-100 dark:bg-white/10',
                      )}
                    />
                  ))}
                </div>
                <span className="w-14 text-right text-[10px] font-semibold text-ink-400">
                  {strengthLabels[score]}
                </span>
              </div>
            ) : null}
          </Field>

          <Field label="Confirm password" htmlFor="register-confirm">
            <input
              id="register-confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Type it again"
              className="field"
            />
            {confirmPassword && password === confirmPassword ? (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-forest-700 dark:text-forest-300">
                <Check size={12} /> Passwords match
              </p>
            ) : null}
          </Field>

          {error ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-clay-50 px-3.5 py-3 text-xs font-medium text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Create my account <ArrowRight size={16} />
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-ink-400 dark:text-ink-500">
          <LockKeyhole size={12} className="mt-0.5 shrink-0" />
          Passwords are hashed before storage. We never ask for your UPI PIN, OTP or bank password.
        </div>

        <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-forest-800 hover:text-forest-950 dark:text-forest-300 dark:hover:text-forest-200"
          >
            Sign in
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
