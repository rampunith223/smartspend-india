import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from './Logo.jsx';

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-dvh bg-cream dark:bg-[#0b1512] lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-forest-950 p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="absolute inset-0 dot-pattern opacity-25" />
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-forest-500/25 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-saffron-400/15 blur-3xl" />

        <div className="relative">
          <Logo to="/" inverted />
        </div>

        <div className="relative my-auto max-w-xl py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-saffron-300">
            <Sparkles size={12} /> Your daily money coach
          </div>
          <h1 className="mt-6 text-balance font-display text-[3.2rem] font-semibold leading-[0.98] tracking-[-0.045em] xl:text-[3.8rem]">
            Spend with a plan, not a feeling.
          </h1>
          <p className="mt-5 max-w-md text-pretty text-sm leading-relaxed text-forest-100/65">
            Track the chai runs and the hostel rent. Protect upcoming bills. Know the number you can
            spend today.
          </p>

          <div className="mt-9 rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-forest-200">
                <ShieldCheck size={14} className="text-saffron-300" /> Today’s guardrail
              </div>
              <span className="rounded-full bg-forest-400/15 px-2 py-1 text-[9px] font-bold text-forest-200">
                8 days left
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="font-display text-5xl font-semibold leading-none tracking-[-0.04em]">
                  ₹406
                </p>
                <p className="mt-1.5 text-[11px] text-forest-100/55">
                  safe to spend today, after bills
                </p>
              </div>
              <div className="space-y-1.5 text-right text-[10px] text-forest-100/50">
                <p><span className="font-bold text-white">₹18,000</span> budget</p>
                <p><span className="font-bold text-clay-300">₹13,403</span> spent</p>
                <p><span className="font-bold text-saffron-300">₹1,348</span> protected</p>
              </div>
            </div>
          </div>

          <ul className="mt-8 space-y-3">
            {[
              'Expense tracking in seconds',
              'Category budgets with early warnings',
              'Savings goals that show real progress',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-forest-100/75">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-forest-400/20 text-forest-200">
                  <Check size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[10px] leading-relaxed text-forest-100/35">
          We never ask for bank passwords, UPI PINs or OTPs. Your records are visible only to your
          account.
        </p>
      </aside>

      <main className="relative flex min-h-dvh flex-col">
        <div className="flex items-center justify-between px-5 pt-5 lg:hidden">
          <Logo />
          <span className="pill">
            <ShieldCheck size={12} className="text-forest-600" /> Private
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-10">
          <div className="w-full max-w-[430px]">{children}</div>
        </div>
        <div className="hidden px-8 pb-6 text-center text-[10px] text-ink-400 dark:text-ink-600 lg:block">
          SmartSpend India · A full-stack student project
        </div>
      </main>
    </div>
  );
}
