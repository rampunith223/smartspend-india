import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  Check,
  Download,
  Globe2,
  LockKeyhole,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
  UserRound,
  Wallet,
} from 'lucide-react';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/ui/Button.jsx';
import { Field, Input, Toggle } from '../components/ui/Form.jsx';
import {
  Badge,
  PageHeader,
  SectionHeading,
} from '../components/ui/Misc.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api, downloadFile } from '../lib/api.js';
import { cn } from '../lib/cn.js';
import { addMonths, currentMonth, formatDate, formatMonth } from '../lib/dates.js';
import { formatINR, formatRupeeInput, parseRupeeInput } from '../lib/format.js';
import {
  disablePush,
  enablePush,
  getPushStatus,
  isIos,
  isStandalone,
  pushSupported,
  sendTestPush,
} from '../lib/push.js';

const THEMES = [
  { id: 'light', label: 'Light', description: 'Warm and bright', icon: Sun },
  { id: 'dark', label: 'Dark', description: 'Easy on the eyes', icon: Moon },
  { id: 'system', label: 'System', description: 'Match your device', icon: Monitor },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => addMonths(currentMonth(), -index));

function PhoneNotificationsCard() {
  const [state, setState] = useState({ supported: false, subscribed: false, permission: 'unsupported' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPushStatus()
      .then((status) => {
        if (active) setState(status);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const supported = state.supported && pushSupported();
  const needsHomeScreen = supported && isIos() && !isStandalone() && state.permission !== 'granted';

  async function handleEnable() {
    setBusy(true);
    try {
      await enablePush();
      setState(await getPushStatus());
      toast.success('Phone alerts enabled. You’ll get a pop-up with sound even when the app is closed.');
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not enable phone alerts.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      await disablePush();
      setState(await getPushStatus());
      toast.success('Phone alerts turned off.');
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not turn off phone alerts.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    setBusy(true);
    try {
      await sendTestPush();
      toast.success('Test alert sent — check your phone in the next few seconds.');
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not send the test alert.');
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <div className="mt-5 rounded-2xl border border-ink-100 p-4 dark:border-white/10">
        <p className="text-xs leading-relaxed text-ink-500 dark:text-ink-400">
          This browser can’t receive phone alerts. Open SmartSpend in Chrome (Android) or Safari
          (iPhone) to enable them.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3 rounded-2xl border border-ink-100 p-4 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
              state.subscribed
                ? 'bg-forest-50 text-forest-700 dark:bg-forest-500/15 dark:text-forest-300'
                : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300',
            )}
          >
            {state.subscribed ? <BellRing size={16} /> : <Bell size={16} />}
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900 dark:text-white">Alerts on this phone</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
              {state.subscribed
                ? 'Connected. When your budget plan is crossed, this phone gets a pop-up with sound — even with the app closed.'
                : 'Get a pop-up with sound on your phone the moment your budget plan is crossed and a goal saving is pending.'}
            </p>
          </div>
        </div>
        {state.subscribed ? (
          <Badge tone="green">
            <Check size={10} /> On
          </Badge>
        ) : null}
      </div>

      {needsHomeScreen ? (
        <p className="rounded-xl bg-saffron-50 px-3.5 py-2.5 text-[11px] font-medium leading-relaxed text-saffron-800 dark:bg-saffron-400/10 dark:text-saffron-300">
          <strong>iPhone users:</strong> tap Share → <strong>Add to Home Screen</strong> first, then
          open SmartSpend from the home screen icon to allow alerts. iOS only sends notifications to
          installed apps.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {state.subscribed ? (
          <>
            <Button variant="secondary" size="sm" onClick={handleTest} disabled={busy}>
              <BellRing size={14} /> Send test alert
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDisable} disabled={busy}>
              Turn off
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={handleEnable} disabled={busy} loading={busy}>
            <Smartphone size={14} /> Enable alerts on this phone
          </Button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser, applyTheme, logout } = useAuth();
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [income, setIncome] = useState(formatRupeeInput(user?.monthlyIncomePaise || 0));
  const [profileSaving, setProfileSaving] = useState(false);
  const [themeSaving, setThemeSaving] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [reportMonth, setReportMonth] = useState(currentMonth());
  const [exporting, setExporting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function saveProfile(event) {
    event.preventDefault();
    const monthlyIncomePaise = parseRupeeInput(income || '0');
    if (!name.trim()) {
      toast.error('Your name cannot be empty.');
      return;
    }
    if (Number.isNaN(monthlyIncomePaise)) {
      toast.error('Enter a valid monthly income.');
      return;
    }

    setProfileSaving(true);
    try {
      const data = await api('/auth/me', {
        method: 'PATCH',
        body: { name: name.trim(), monthlyIncomePaise },
      });
      updateUser(data.user);
      toast.success('Profile updated.');
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not update your profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function changeTheme(theme) {
    if (theme === user?.theme || themeSaving) return;
    setThemeSaving(true);
    const previous = user;
    applyTheme(theme);
    updateUser({ ...user, theme });
    try {
      const data = await api('/auth/me', { method: 'PATCH', body: { theme } });
      updateUser(data.user);
    } catch (requestError) {
      applyTheme(previous?.theme || 'light');
      updateUser(previous);
      toast.error(requestError?.message || 'Could not save your theme preference.');
    } finally {
      setThemeSaving(false);
    }
  }

  async function toggleNotifications(value) {
    setNotificationsSaving(true);
    const previous = user;
    updateUser({ ...user, notifications: value });
    try {
      const data = await api('/auth/me', {
        method: 'PATCH',
        body: { notifications: value },
      });
      updateUser(data.user);
      toast.success(value ? 'Budget and bill reminders are on.' : 'Reminders are paused.');
    } catch (requestError) {
      updateUser(previous);
      toast.error(requestError?.message || 'Could not update reminders.');
    } finally {
      setNotificationsSaving(false);
    }
  }

  async function exportReport() {
    setExporting(true);
    try {
      await downloadFile(
        `/reports/monthly.csv?month=${reportMonth}`,
        `smartspend-report-${reportMonth}.csv`,
      );
      toast.success('Report downloaded.');
    } catch (requestError) {
      toast.error(requestError?.message || 'Could not download the report.');
    } finally {
      setExporting(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Use at least 8 characters for the new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api('/auth/password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed.');
    } catch (requestError) {
      setPasswordError(requestError?.message || 'Could not change your password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    await mutate(() => true, undefined, { revalidate: false });
    toast.success('Signed out.');
    navigate('/');
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Your account"
        title="Settings"
        description="Profile, preferences and the privacy details that matter."
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="surface p-5 sm:p-6 lg:col-span-7">
          <SectionHeading
            title="Profile"
            description="Used to personalise your dashboard"
            action={<Badge tone="green"><UserRound size={11} /> Private</Badge>}
          />
          <div className="mt-5 flex items-center gap-4">
            <Avatar name={user?.name} size="lg" />
            <div>
              <p className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-950 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-ink-400">{user?.email}</p>
              <p className="mt-0.5 text-[10px] text-ink-400">
                Member since {user?.createdAt ? formatDate(user.createdAt.slice(0, 10), 'month') : '—'}
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Input
                label="Email"
                value={user?.email || ''}
                readOnly
                className="cursor-not-allowed bg-ink-50 text-ink-500 dark:bg-white/[0.03]"
                hint="Email cannot be changed in this version."
              />
            </div>
            <Input
              label="Monthly income or allowance"
              value={income}
              onChange={(event) => setIncome(event.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              prefix="₹"
              hint="If you haven’t set an overall budget, SmartSpend uses this as your monthly plan. Pocket money counts."
            />
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[10px] text-ink-400">
                Current plan: {formatINR(user?.monthlyIncomePaise || 0)} / month
              </p>
              <Button type="submit" size="sm" loading={profileSaving}>
                Save profile
              </Button>
            </div>
          </form>
        </section>

        <section className="surface p-5 sm:p-6 lg:col-span-5">
          <SectionHeading title="Appearance" description="Pick the mood that helps you focus" />
          <div className="mt-4 grid gap-2.5">
            {THEMES.map((theme) => {
              const Icon = theme.icon;
              const active = (user?.theme || 'light') === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => changeTheme(theme.id)}
                  disabled={themeSaving}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border p-3 text-left transition',
                    active
                      ? 'border-forest-600 bg-forest-50/70 dark:border-forest-400/50 dark:bg-forest-500/10'
                      : 'border-ink-100 bg-white/50 hover:border-ink-200 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-xl',
                      active
                        ? 'bg-forest-900 text-white dark:bg-forest-400 dark:text-forest-950'
                        : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300',
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink-900 dark:text-white">{theme.label}</p>
                    <p className="text-[10px] text-ink-400">{theme.description}</p>
                  </div>
                  {active ? <Check size={16} className="text-forest-600 dark:text-forest-300" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-ink-100 p-4 dark:border-white/10">
            <Toggle
              checked={Boolean(user?.notifications)}
              onChange={toggleNotifications}
              disabled={notificationsSaving}
              label="Budget & bill reminders"
              description="Show warnings on the dashboard when budgets approach a limit or a bill is due."
            />
          </div>

          <PhoneNotificationsCard />
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="surface p-5 sm:p-6 lg:col-span-7">
          <SectionHeading
            title="Change password"
            description="Keep your account protected"
            action={<LockKeyhole size={16} className="text-ink-400" />}
          />
          <form onSubmit={changePassword} className="mt-5 space-y-4">
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                hint="At least 8 characters."
              />
              <Input
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            {passwordError ? (
              <p className="rounded-xl bg-clay-50 px-3.5 py-2.5 text-xs font-medium text-clay-700 dark:bg-clay-500/10 dark:text-clay-300">
                {passwordError}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button type="submit" size="sm" loading={passwordSaving}>
                Update password
              </Button>
            </div>
          </form>
        </section>

        <section className="surface p-5 sm:p-6 lg:col-span-5">
          <SectionHeading title="Monthly report" description="Your records, ready to take elsewhere" />
          <div className="mt-5 rounded-2xl border border-ink-100 p-4 dark:border-white/10">
            <label htmlFor="report-month" className="label">
              Choose a month
            </label>
            <select
              id="report-month"
              value={reportMonth}
              onChange={(event) => setReportMonth(event.target.value)}
              className="field"
            >
              {MONTH_OPTIONS.map((month) => (
                <option key={month} value={month}>
                  {formatMonth(month, 'long')}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-400">
              Includes totals, category breakdown, budgets and every transaction as a CSV.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={exportReport}
              loading={exporting}
            >
              <Download size={14} /> Download CSV
            </Button>
          </div>

          <div className="mt-4 rounded-2xl bg-ink-50/70 p-4 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <Globe2 size={15} className="text-ink-500 dark:text-ink-300" />
              <p className="text-sm font-bold text-ink-800 dark:text-ink-100">Language</p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
              English is active today. Hindi and Telugu interfaces are planned for a future version.
            </p>
            <div className="mt-2 flex gap-2">
              <Badge tone="green">English</Badge>
              <Badge tone="neutral">हिन्दी · soon</Badge>
              <Badge tone="neutral">తెలుగు · soon</Badge>
            </div>
          </div>
        </section>
      </div>

      <section className="surface p-5 sm:p-6">
        <SectionHeading
          title="Privacy & data"
          description="What we store, and what we never ask for"
          action={<ShieldCheck size={18} className="text-forest-600 dark:text-forest-300" />}
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              title: 'Only what you enter',
              body: 'SmartSpend stores the transactions, budgets and goals you add. There is no bank or UPI connection.',
            },
            {
              title: 'No payment credentials',
              body: 'We never ask for UPI PINs, OTPs, card numbers or bank passwords. Never enter them anywhere in this app.',
            },
            {
              title: 'Private to your account',
              body: 'Every API request is checked against your session. One account cannot read another account’s records.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-ink-100 p-4 dark:border-white/10">
              <p className="text-[13px] font-bold text-ink-900 dark:text-white">{item.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-clay-50/70 p-4 dark:bg-clay-500/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-clay-800 dark:text-clay-200">Finished for now?</p>
            <p className="mt-0.5 text-[11px] text-clay-700/70 dark:text-clay-200/60">
              Signing out keeps your records safe and ends this session.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 pb-2 text-[10px] text-ink-400 dark:text-ink-600">
        <Wallet size={12} /> SmartSpend India · Built for better everyday money decisions
      </div>
    </div>
  );
}
