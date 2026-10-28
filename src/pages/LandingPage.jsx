import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Coffee,
  Download,
  IndianRupee,
  LockKeyhole,
  Menu,
  QrCode,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { cn } from '../lib/cn.js';
import Logo, { LogoMark } from '../components/Logo.jsx';

const NAV_LINKS = [
  { href: '#problem', label: 'Why it matters' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#privacy', label: 'Privacy' },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'A daily spending guardrail',
    body: 'We protect your upcoming bills first, then turn what’s left into a simple safe-to-spend number for today.',
    className: 'md:col-span-2 md:row-span-2 bg-forest-950 text-white border-forest-950',
    iconClass: 'bg-white/10 text-saffron-300',
    titleClass: 'text-white',
    bodyClass: 'text-forest-100/70',
    featured: true,
  },
  {
    icon: Sparkles,
    title: 'Insights in plain language',
    body: '“Food is up 18% from last month.” No dashboard archaeology required.',
    className: 'bg-saffron-50 dark:bg-saffron-400/[0.07]',
    iconClass: 'bg-saffron-100 text-saffron-700 dark:bg-saffron-400/15 dark:text-saffron-300',
  },
  {
    icon: Wallet,
    title: 'Budgets that warn you early',
    body: 'Overall and category limits, with gentle alerts at 80% and 100%.',
    className: 'bg-white dark:bg-ink-900/80',
    iconClass: 'bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300',
  },
  {
    icon: QrCode,
    title: 'Built for how India pays',
    body: 'UPI, cash, cards and bank transfers — all in one honest view.',
    className: 'bg-white dark:bg-ink-900/80',
    iconClass: 'bg-[#e8f0f5] text-[#315c75] dark:bg-[#457b9d]/15 dark:text-[#a9c7db]',
  },
  {
    icon: Target,
    title: 'Goals with visible progress',
    body: 'Save for a laptop, fees or an emergency fund — and watch the gap close.',
    className: 'bg-clay-50 dark:bg-clay-500/[0.07]',
    iconClass: 'bg-clay-100 text-clay-700 dark:bg-clay-500/15 dark:text-clay-300',
  },
  {
    icon: Download,
    title: 'Reports you can actually use',
    body: 'Download a clean monthly CSV with totals, categories and budget performance.',
    className: 'bg-white dark:bg-ink-900/80',
    iconClass: 'bg-ink-100 text-ink-700 dark:bg-white/10 dark:text-ink-200',
  },
];

function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100/70 bg-cream/85 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1512]/85">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-semibold text-ink-500 transition hover:text-ink-950 dark:text-ink-400 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Link
              to="/app"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-forest-900 px-4 text-sm font-semibold text-white transition hover:bg-forest-800 dark:bg-forest-400 dark:text-forest-950"
            >
              Open dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-ink-600 transition hover:bg-white hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-forest-900 px-4 text-sm font-semibold text-white transition hover:bg-forest-800 dark:bg-forest-400 dark:text-forest-950 dark:hover:bg-forest-300"
              >
                Start free <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white/70 text-ink-700 dark:border-white/10 dark:bg-white/5 dark:text-white lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-ink-100 bg-paper px-4 py-4 dark:border-white/10 dark:bg-ink-950 lg:hidden">
          <nav className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-ink-200 text-sm font-semibold text-ink-700 dark:border-white/10 dark:text-ink-200"
            >
              Sign in
            </Link>
            <Link
              to={user ? '/app' : '/register'}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-forest-900 text-sm font-semibold text-white dark:bg-forest-400 dark:text-forest-950"
            >
              {user ? 'Dashboard' : 'Start free'}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-8 rounded-full bg-saffron-300/20 blur-3xl" />
      <div className="relative rotate-[-1.2deg] rounded-[2.2rem] border border-ink-200/60 bg-paper p-3 shadow-lift transition duration-500 hover:rotate-0 dark:border-white/10 dark:bg-ink-900">
        <div className="rounded-[1.7rem] border border-ink-100 bg-cream/80 p-4 dark:border-white/10 dark:bg-ink-950/70">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogoMark size="sm" />
              <div>
                <p className="text-[11px] font-bold text-ink-900 dark:text-white">October budget</p>
                <p className="text-[9px] text-ink-400">Aarav’s money coach</p>
              </div>
            </div>
            <span className="rounded-full bg-forest-50 px-2 py-1 text-[9px] font-bold text-forest-700 dark:bg-forest-500/15 dark:text-forest-300">
              On track
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-forest-950 p-4 text-white">
            <div className="absolute inset-0 dot-pattern opacity-25" />
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-forest-500/30 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-forest-200">
                  Safe to spend today
                </span>
                <ShieldCheck size={14} className="text-saffron-300" />
              </div>
              <p className="mt-1 font-display text-[2.4rem] font-semibold leading-none tracking-[-0.04em]">
                ₹406
              </p>
              <p className="mt-1.5 text-[10px] text-forest-100/70">
                ₹3,249 free for 8 days · ₹1,348 bills protected
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[74%] rounded-full bg-saffron-400" />
              </div>
              <div className="mt-2 flex justify-between text-[8px] font-semibold text-forest-200/70">
                <span>₹13,403 spent</span>
                <span>₹18,000 budget</span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              ['Income', '₹24,000', 'text-forest-700 dark:text-forest-300'],
              ['Spent', '₹13,403', 'text-clay-600 dark:text-clay-300'],
              ['Saved', '₹10,597', 'text-ink-900 dark:text-white'],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="rounded-xl border border-ink-100 bg-white/70 p-2.5 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <p className="text-[8px] font-semibold uppercase tracking-wide text-ink-400">{label}</p>
                <p className={cn('mt-0.5 text-[12px] font-bold', color)}>{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-[1fr_1.15fr] gap-2">
            <div className="rounded-xl border border-ink-100 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[8px] font-bold uppercase tracking-wide text-ink-400">Where it went</p>
              <div className="mt-2 flex items-center gap-2.5">
                <div
                  className="relative h-14 w-14 shrink-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(#E76F51 0 38%, #F2A65A 38% 55%, #2A9D8F 55% 68%, #457B9D 68% 79%, #8D99AE 79% 100%)',
                  }}
                >
                  <div className="absolute inset-[5px] grid place-items-center rounded-full bg-white text-[8px] font-bold text-ink-500 dark:bg-ink-900">
                    ₹13.4k
                  </div>
                </div>
                <div className="space-y-1 text-[7px] font-semibold text-ink-500 dark:text-ink-400">
                  <p><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#E76F51]" />Food</p>
                  <p><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#F2A65A]" />Groceries</p>
                  <p><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#2A9D8F]" />Transport</p>
                  <p><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[#457B9D]" />Bills</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-ink-100 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-[8px] font-bold uppercase tracking-wide text-ink-400">Recent</p>
              <div className="mt-2 space-y-2">
                {[
                  ['Chai & snacks', '₹40', '☕'],
                  ['Metro recharge', '₹120', '🚇'],
                  ['Groceries', '₹640', '🛒'],
                ].map(([label, amount, emoji]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-ink-50 text-[9px] dark:bg-white/10">
                      {emoji}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[8px] font-semibold text-ink-600 dark:text-ink-300">
                      {label}
                    </span>
                    <span className="text-[8px] font-bold text-ink-900 dark:text-white">{amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-float absolute -left-5 top-24 hidden rounded-2xl border border-ink-100 bg-paper/95 p-3 shadow-lift backdrop-blur dark:border-white/10 dark:bg-ink-900/95 sm:block">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-saffron-100 text-saffron-700 dark:bg-saffron-400/15 dark:text-saffron-300">
            <ReceiptText size={15} />
          </span>
          <div>
            <p className="text-[9px] font-bold text-ink-900 dark:text-white">Bills protected</p>
            <p className="text-[8px] text-ink-400">Electricity + recharge</p>
          </div>
          <span className="ml-1 text-[10px] font-bold text-forest-700 dark:text-forest-300">₹1,149</span>
        </div>
      </div>

      <div className="animate-float absolute -right-3 bottom-12 hidden rounded-2xl border border-ink-100 bg-paper/95 p-3 shadow-lift backdrop-blur [animation-delay:1.4s] dark:border-white/10 dark:bg-ink-900/95 sm:block">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300">
            <TrendingUp size={15} />
          </span>
          <div>
            <p className="text-[9px] font-bold text-ink-900 dark:text-white">Food is down 29%</p>
            <p className="text-[8px] text-ink-400">vs. last month</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const { user } = useAuth();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-saffron-300/20 blur-3xl" />
      <div className="absolute -right-24 top-40 h-96 w-96 rounded-full bg-forest-300/25 blur-3xl dark:bg-forest-500/10" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-forest-200/70 bg-white/70 px-3 py-1.5 text-[11px] font-bold text-forest-800 shadow-sm backdrop-blur dark:border-forest-500/20 dark:bg-white/5 dark:text-forest-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-600" />
            </span>
            A daily money coach for Indian budgets
          </div>
          <h1 className="mt-5 text-balance font-display text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.045em] text-ink-950 dark:text-white sm:text-6xl lg:text-[4.3rem]">
            Know where your money goes.
            <span className="mt-2 block text-forest-800 dark:text-forest-300">
              And what you can spend{' '}
              <span className="relative whitespace-nowrap">
                today.
                <svg
                  className="absolute -bottom-2 left-0 w-full text-saffron-400"
                  viewBox="0 0 160 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M2 9C38 3 95 2 158 6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-ink-500 dark:text-ink-400 sm:text-base">
            Small UPI payments add up quietly. SmartSpend turns your income, spending and upcoming
            bills into one clear daily limit — so the month doesn’t surprise you.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to={user ? '/app' : '/register'}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-forest-900 px-6 text-sm font-bold text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-forest-800 dark:bg-forest-400 dark:text-forest-950 dark:hover:bg-forest-300"
            >
              {user ? 'Open your dashboard' : 'Start tracking free'}
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/login?demo=1"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white/80 px-6 text-sm font-bold text-ink-800 shadow-sm backdrop-blur transition hover:border-ink-300 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-ink-100 dark:hover:bg-white/10"
            >
              <Sparkles size={16} className="text-saffron-500" />
              Explore the demo
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-ink-400 dark:text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <Check size={13} className="text-forest-600" /> No bank login
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={13} className="text-forest-600" /> No UPI PIN
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={13} className="text-forest-600" /> Your data stays yours
            </span>
          </div>
        </div>
        <div className="lg:pl-4">
          <DashboardPreview />
        </div>
      </div>

      <div className="relative border-y border-ink-100/80 bg-white/50 py-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400 dark:text-ink-500 sm:gap-x-12">
          <span>Students</span>
          <span className="hidden h-1 w-1 rounded-full bg-ink-300 sm:block" />
          <span>First-jobbers</span>
          <span className="hidden h-1 w-1 rounded-full bg-ink-300 sm:block" />
          <span>Families</span>
          <span className="hidden h-1 w-1 rounded-full bg-ink-300 sm:block" />
          <span>UPI-first budgets</span>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="problem" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="max-w-2xl">
        <p className="eyebrow">The quiet money problem</p>
        <h2 className="mt-3 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink-950 dark:text-white sm:text-5xl">
          Small spends don’t feel small at month-end.
        </h2>
        <p className="mt-4 text-pretty text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
          Payment apps show transactions. They rarely show the story: what’s left, what’s already
          spoken for, and whether today’s spending is actually safe.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          {
            icon: Coffee,
            stat: '₹1,500',
            label: '₹50 chai & snacks × 30 days',
            title: 'The invisible daily habit',
            body: 'Individually, it’s pocket change. Across a month, it’s a significant slice of a student’s budget.',
          },
          {
            icon: Smartphone,
            stat: '5 ways',
            label: 'UPI · cash · cards · bank · wallets',
            title: 'Spending is spread everywhere',
            body: 'When money moves across payment methods, the full picture disappears. Convenience is not the same as clarity.',
          },
          {
            icon: Wallet,
            stat: 'No idea',
            label: 'until the money is already gone',
            title: 'A budget without a guardrail',
            body: 'Most people know their income. Fewer know how much is safe to spend before the next bill arrives.',
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="surface group p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-100 text-ink-700 transition group-hover:bg-forest-900 group-hover:text-white dark:bg-white/10 dark:text-ink-200">
                  <Icon size={20} strokeWidth={1.7} />
                </span>
                <span className="font-display text-2xl font-semibold tracking-[-0.03em] text-ink-900 dark:text-white">
                  {item.stat}
                </span>
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">
                {item.label}
              </p>
              <h3 className="mt-1.5 font-display text-xl font-semibold tracking-[-0.02em] text-ink-950 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{item.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UspSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-forest-950 px-6 py-12 text-white shadow-lift sm:px-10 lg:px-16 lg:py-16">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-forest-500/25 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-saffron-400/15 blur-3xl" />
        <div className="relative grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-saffron-300">
              The SmartSpend difference
            </p>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] sm:text-5xl">
              The number most money apps don’t show you.
            </h2>
            <p className="mt-5 max-w-lg text-pretty text-[15px] leading-relaxed text-forest-100/70">
              A remaining balance is not the same as money you can spend. We subtract the bills
              you’ve already committed to, then divide what’s left across the days ahead.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {['Protect bills first', 'Respect the days left', 'No guesswork'].map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-forest-100"
                >
                  <Check size={12} className="text-saffron-300" /> {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-forest-200">
                  Your month, simplified
                </p>
                <span className="rounded-full bg-forest-400/15 px-2.5 py-1 text-[10px] font-bold text-forest-200">
                  October
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ['Monthly budget', '₹8,000', 'text-white'],
                  ['Spent so far', '− ₹5,000', 'text-clay-300'],
                  ['Reserved for bills', '− ₹1,000', 'text-saffron-300'],
                ].map(([label, value, color]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-forest-100/60">{label}</span>
                    <span className={cn('font-bold tabular-nums', color)}>{value}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-forest-100">Actually available</span>
                    <span className="font-display text-2xl font-semibold text-white">₹2,000</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-saffron-400 p-4 text-ink-950">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-950/60">
                      10 days left → safe daily limit
                    </p>
                    <p className="mt-1 font-display text-4xl font-semibold leading-none tracking-[-0.04em]">
                      ₹200<span className="ml-1 font-sans text-sm font-bold">/day</span>
                    </p>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-ink-950/10">
                    <ShieldCheck size={26} />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-[10px] text-forest-100/40">
                Illustrative example. Your number uses your real budget and bills.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: ReceiptText,
      title: 'Log it in seconds',
      body: 'Amount, category, date, payment method. Quick-add keeps the friction low so records stay complete.',
    },
    {
      number: '02',
      icon: ShieldCheck,
      title: 'Protect what’s committed',
      body: 'Rent, recharge and subscriptions are set aside automatically, so tomorrow’s bills don’t become today’s temptation.',
    },
    {
      number: '03',
      icon: IndianRupee,
      title: 'Spend with a number',
      body: 'See one safe daily limit, budget warnings and plain-language insights. Adjust the plan, not your peace of mind.',
    },
  ];

  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink-950 dark:text-white sm:text-5xl">
            From receipts to a real plan.
          </h2>
        </div>
        <Link
          to="/register"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-800 hover:text-forest-950 dark:text-forest-300 dark:hover:text-forest-200"
        >
          Try it with your own numbers <ChevronRight size={16} />
        </Link>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="relative">
              <div className="surface h-full p-6">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300">
                    <Icon size={20} strokeWidth={1.7} />
                  </span>
                  <span className="font-display text-3xl font-semibold tracking-[-0.04em] text-ink-200 dark:text-white/15">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold tracking-[-0.02em] text-ink-950 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{step.body}</p>
              </div>
              {index < steps.length - 1 ? (
                <ChevronRight
                  size={18}
                  className="absolute -right-3.5 top-1/2 z-10 hidden -translate-y-1/2 text-ink-300 dark:text-ink-600 md:block"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative overflow-hidden border-y border-ink-100/80 bg-white/35 py-20 dark:border-white/10 dark:bg-white/[0.015] sm:py-24">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Everything you need, nothing you don’t</p>
          <h2 className="mt-3 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink-950 dark:text-white sm:text-5xl">
            A calmer way to handle money.
          </h2>
          <p className="mt-4 text-pretty text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
            Core expense tracking, done properly — plus the smart layer that turns records into
            decisions.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            if (feature.featured) {
              return (
                <div
                  key={feature.title}
                  className={cn(
                    'relative overflow-hidden rounded-3xl border p-6 shadow-soft md:col-span-2 md:row-span-2 md:p-8',
                    feature.className,
                  )}
                >
                  <div className="absolute inset-0 dot-pattern opacity-20" />
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-forest-500/25 blur-3xl" />
                  <div className="relative flex h-full flex-col">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-saffron-300">
                      <Icon size={22} strokeWidth={1.7} />
                    </span>
                    <h3 className="mt-6 max-w-sm font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-forest-100/70">
                      {feature.body}
                    </p>
                    <div className="mt-auto pt-8">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-forest-100/60">
                          <span>Budget left after bills</span>
                          <span className="text-white">₹3,249</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[68%] rounded-full bg-saffron-400" />
                        </div>
                        <div className="mt-3 flex items-end justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-200/50">
                              Today’s safe limit
                            </p>
                            <p className="mt-1 font-display text-3xl font-semibold text-white">₹406</p>
                          </div>
                          <span className="rounded-full bg-forest-400/15 px-2.5 py-1 text-[10px] font-bold text-forest-200">
                            8 days left
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={feature.title}
                className={cn(
                  'group rounded-3xl border border-ink-100/80 p-6 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift dark:border-white/10',
                  feature.className,
                )}
              >
                <span className={cn('grid h-10 w-10 place-items-center rounded-xl', feature.iconClass)}>
                  <Icon size={19} strokeWidth={1.7} />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-[-0.02em] text-ink-950 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function IndiaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">India-first by default</p>
          <h2 className="mt-3 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] text-ink-950 dark:text-white sm:text-5xl">
            Built around the way money actually moves here.
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-[15px] leading-relaxed text-ink-500 dark:text-ink-400">
            From ₹ formatting to UPI, chai runs to hostel rent — the details are designed for Indian
            student and household budgets, not adapted from somewhere else.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ['₹ Indian numbering', '₹1,50,000 reads the way you expect.'],
              ['UPI, cash & cards', 'One view across every payment method.'],
              ['Local categories', 'Chai, auto, hostel, recharge, fees.'],
              ['Student mode', 'Pocket money works as well as salary.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-ink-100 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-sm font-bold text-ink-900 dark:text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-saffron-300/15 blur-3xl" />
          <div className="surface relative overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow">This month, by category</p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-ink-950 dark:text-white">
                  ₹13,403 spent
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300">
                <BarChart3 size={19} />
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                ['Food & dining', 1550, 38, '#E76F51'],
                ['Groceries', 2660, 20, '#F2A65A'],
                ['Shopping', 1349, 13, '#D5A021'],
                ['Bills & utilities', 950, 9, '#457B9D'],
                ['Transport', 345, 7, '#2A9D8F'],
              ].map(([label, amount, percent, color]) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-ink-700 dark:text-ink-200">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      {label}
                    </span>
                    <span className="font-bold text-ink-900 dark:text-white">
                      ₹{amount.toLocaleString('en-IN')}
                      <span className="ml-1.5 font-medium text-ink-400">{percent}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${percent * 2.2}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-saffron-50 p-4 dark:bg-saffron-400/[0.08]">
              <Sparkles size={17} className="mt-0.5 shrink-0 text-saffron-600 dark:text-saffron-300" />
              <p className="text-xs leading-relaxed text-saffron-900/80 dark:text-saffron-100/70">
                <span className="font-bold">Insight:</span> Food is down 29% from last month. Your
                biggest remaining risk is shopping.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  return (
    <section id="privacy" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="rounded-[2rem] border border-ink-100 bg-white/55 p-6 dark:border-white/10 dark:bg-white/[0.025] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-forest-50 px-3 py-1.5 text-[11px] font-bold text-forest-800 dark:bg-forest-500/15 dark:text-forest-200">
              <LockKeyhole size={13} /> Privacy by design
            </div>
            <h2 className="mt-4 text-balance font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-ink-950 dark:text-white sm:text-4xl">
              Your money story is nobody else’s business.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-500 dark:text-ink-400">
              SmartSpend only knows what you choose to enter. We never ask for bank passwords, UPI
              PINs or OTPs — and every account only sees its own records.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [LockKeyhole, 'Hashed passwords', 'Passwords are salted and hashed with bcrypt.'],
              [ShieldCheck, 'Private by default', 'Every API request is scoped to your account.'],
              [QrCode, 'No payment access', 'We never connect to your UPI or bank account.'],
              [Download, 'Export anytime', 'Download your monthly data as a CSV.'],
            ].map(([Icon, title, body]) => (
              <div key={title} className="rounded-2xl border border-ink-100 bg-paper/70 p-4 dark:border-white/10 dark:bg-ink-900/60">
                <Icon size={18} className="text-forest-700 dark:text-forest-300" />
                <p className="mt-2.5 text-sm font-bold text-ink-900 dark:text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-saffron-400 px-6 py-14 text-center shadow-lift sm:px-10 sm:py-16">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-forest-900/10 blur-3xl" />
        <div className="relative mx-auto max-w-2xl">
          <LogoMark size="lg" className="mx-auto border-2 border-white/30" />
          <h2 className="mt-5 text-balance font-display text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-ink-950 sm:text-5xl">
            Make this month feel less like a guess.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-ink-950/65">
            Start with one expense. SmartSpend will help you build the rest of the picture — and
            protect what matters.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink-950 px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-ink-900"
            >
              Create your free account <ArrowRight size={17} />
            </Link>
            <Link
              to="/login?demo=1"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-ink-950/15 bg-white/35 px-6 text-sm font-bold text-ink-950 transition hover:bg-white/55"
            >
              Try the demo first
            </Link>
          </div>
          <p className="mt-4 text-[11px] font-semibold text-ink-950/50">
            No card required · Demo account included · Built for Indian budgets
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-100/80 bg-white/40 dark:border-white/10 dark:bg-white/[0.015]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Logo />
          <p className="max-w-sm text-xs leading-relaxed text-ink-400 dark:text-ink-500">
            A full-stack daily expense tracker and money coach for Indian students, families and
            budget-conscious people.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-ink-500 dark:text-ink-400">
          <a href="#features" className="hover:text-ink-900 dark:hover:text-white">Features</a>
          <a href="#how-it-works" className="hover:text-ink-900 dark:hover:text-white">How it works</a>
          <a href="#privacy" className="hover:text-ink-900 dark:hover:text-white">Privacy</a>
          <Link to="/login" className="hover:text-ink-900 dark:hover:text-white">Sign in</Link>
        </div>
      </div>
      <div className="border-t border-ink-100/70 px-4 py-4 text-center text-[10px] text-ink-400 dark:border-white/10 dark:text-ink-600">
        SmartSpend India · An educational full-stack project. Not a financial advisory service.
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <UspSection />
        <HowItWorks />
        <Features />
        <IndiaSection />
        <PrivacySection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
