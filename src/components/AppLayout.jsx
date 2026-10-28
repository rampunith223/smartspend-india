import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import {
  ArrowLeftRight,
  Bell,
  Goal,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { QuickAddProvider, useQuickAdd } from '../context/QuickAddContext.jsx';
import { cn } from '../lib/cn.js';
import Avatar from './Avatar.jsx';
import Logo from './Logo.jsx';
import Button from './ui/Button.jsx';

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/app/budgets', label: 'Budgets', icon: WalletCards },
  { to: '/app/goals', label: 'Savings goals', icon: Goal },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

function NavItem({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
    >
      <Icon size={18} strokeWidth={1.9} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const { openQuickAdd } = useQuickAdd();
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await logout();
    await mutate(() => true, undefined, { revalidate: false });
    toast.success('Signed out. See you soon.');
    navigate('/');
  }

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-ink-100/80 bg-paper/80 px-5 pb-5 pt-6 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/80 lg:flex">
        <Logo to="/app" className="ml-1" />

        <div className="mt-8">
          <p className="eyebrow mb-2 px-3.5">Workspace</p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
        </div>

        <Button
          className="mt-5 w-full justify-start"
          onClick={() => openQuickAdd({ type: 'expense' })}
        >
          <Plus size={18} />
          Log an expense
        </Button>

        <div className="mt-auto space-y-4 pt-6">
          <div className="relative overflow-hidden rounded-3xl bg-forest-950 p-4 text-white shadow-lift">
            <div className="absolute inset-0 dot-pattern opacity-30" />
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-forest-500/30 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-forest-200">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
                  Daily guardrail
                </span>
              </div>
              <p className="mt-2 font-display text-[17px] font-semibold leading-snug">
                Know your safe-to-spend number.
              </p>
              <Link
                to="/app"
                className="mt-3 inline-flex items-center text-[11px] font-bold text-saffron-300 hover:text-saffron-200"
              >
                Check today’s number →
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white/60 p-2.5 dark:border-white/10 dark:bg-white/[0.03]">
            <Link to="/app/settings" className="shrink-0">
              <Avatar name={user?.name} size="md" />
            </Link>
            <Link to="/app/settings" className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">
                {user?.name}
              </p>
              <p className="truncate text-[11px] text-ink-400 dark:text-ink-500">{user?.email}</p>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-400 transition hover:bg-clay-50 hover:text-clay-600 dark:hover:bg-clay-500/10 dark:hover:text-clay-300"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-ink-100/70 bg-cream/85 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1512]/85 lg:hidden">
        <Logo to="/app" markSize="sm" />
        <div className="flex items-center gap-1.5">
          <Link
            to="/app#insights"
            className="grid h-10 w-10 place-items-center rounded-xl text-ink-500 transition hover:bg-white hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="View spending insights"
          >
            <Bell size={19} strokeWidth={1.8} />
          </Link>
          <Link to="/app/settings" className="rounded-full" aria-label="Open settings">
            <Avatar name={user?.name} size="sm" />
          </Link>
        </div>
      </header>

      <main className="min-h-dvh px-4 pb-28 pt-5 sm:px-6 lg:ml-[272px] lg:px-10 lg:pb-12 lg:pt-9">
        <div key={location.pathname} className="page-enter mx-auto w-full max-w-[1400px]">
          <Outlet />
        </div>
      </main>

      <button
        type="button"
        onClick={() => openQuickAdd({ type: 'expense' })}
        className="fixed bottom-7 right-7 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-forest-900 text-white shadow-lift transition hover:-translate-y-0.5 hover:bg-forest-800 dark:bg-forest-400 dark:text-forest-950 dark:hover:bg-forest-300 lg:flex"
        aria-label="Quick add transaction"
      >
        <Plus size={24} />
      </button>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-ink-100/80 bg-paper/95 px-2 pt-1.5 backdrop-blur-xl dark:border-white/10 dark:bg-ink-950/95 lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end">
          <MobileNavItem to="/app" icon={LayoutDashboard} label="Home" end />
          <MobileNavItem to="/app/transactions" icon={ArrowLeftRight} label="Activity" />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => openQuickAdd({ type: 'expense' })}
              className="-mt-6 grid h-14 w-14 place-items-center rounded-full border-4 border-cream bg-forest-900 text-white shadow-lift transition active:scale-95 dark:border-[#0b1512] dark:bg-forest-400 dark:text-forest-950"
              aria-label="Quick add transaction"
            >
              <Plus size={24} />
            </button>
          </div>
          <MobileNavItem to="/app/budgets" icon={WalletCards} label="Budgets" />
          <MobileNavItem to="/app/goals" icon={Goal} label="Goals" />
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({ to, icon: Icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-0.5 rounded-xl px-1 pb-1 pt-2 text-[9px] font-bold transition',
          isActive
            ? 'text-forest-800 dark:text-forest-300'
            : 'text-ink-400 hover:text-ink-700 dark:text-ink-500 dark:hover:text-ink-200',
        )
      }
    >
      <Icon size={20} strokeWidth={1.8} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AppLayout() {
  return (
    <QuickAddProvider>
      <AppShell />
    </QuickAddProvider>
  );
}
