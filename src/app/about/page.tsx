import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'About — RFR Network',
  description:
    'RFR Network is a premium referral community built on trust, not volume. One seat per category per chapter. Closed-loop tracking. Founded by Wences Navarro.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <section className="relative overflow-hidden border-b border-ink-600">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.25), transparent 50%), radial-gradient(circle at 80% 60%, rgba(212,175,55,0.15), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
            About RFR Network
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight text-white sm:text-5xl">
            Connection is <span className="text-gold">currency.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-300">
            RFR Network was built for operators who are tired of cold outreach and
            generic networking. This is a community where every referral is tracked,
            every member is vetted, and every chapter holds one seat per business
            category — so your trust compounds into real revenue.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
              Mission
            </p>
            <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
              Replace cold outreach with warm trust.
            </h2>
            <p className="mt-4 text-gray-300 leading-relaxed">
              Business is done between people who trust each other. RFR Network gives
              you a weekly forum of operators who know you, vouch for you, and pass you
              the business they can't serve themselves. Every referral is tracked from
              introduction to close, so generosity gets measured — and rewarded.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
              Vision
            </p>
            <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
              The world's most trusted referral network.
            </h2>
            <p className="mt-4 text-gray-300 leading-relaxed">
              A chapter in every major market. One seat per category per chapter.
              Members who actually close. We're building a global operators' network
              where reputation is the only currency that matters.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-600 bg-ink-800/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
            Why we're different
          </p>
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            RFR Network vs. traditional networking groups.
          </h2>
          <p className="mt-3 max-w-2xl text-gray-400">
            We respect what groups like BNI built. But the world has changed — and
            referral networks should too.
          </p>

          <div className="mt-10 overflow-hidden rounded-lg border border-ink-500 bg-ink-800">
            <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-0 border-b border-ink-600 bg-ink-700">
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gold">
                How we stack up
              </div>
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gold">
                RFR Network
              </div>
              <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Traditional groups
              </div>
            </div>
            {[
              { label: 'Seats per category', us: 'One per chapter', them: 'One per chapter' },
              { label: 'Weekly meetings', us: 'Yes', them: 'Yes' },
              { label: 'Closed-loop referral tracking', us: 'Every referral, automated', them: 'Manual slips / limited' },
              { label: 'In-app status updates', us: 'Recipient marks progress', them: 'Phone calls / emails' },
              { label: 'Leaderboards & accountability', us: 'Built-in, per chapter', them: 'Quarterly reports' },
              { label: 'Digital-first experience', us: 'Modern dashboard, mobile-ready', them: 'Paper-based origins' },
              { label: 'Chapter admin tools', us: 'Free, included', them: 'Paid add-ons' },
            ].map((row, idx) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.5fr_1fr_1fr] gap-0 text-sm ${idx % 2 === 0 ? 'bg-ink-800' : 'bg-ink-800/60'}`}
              >
                <div className="px-4 py-3 text-gray-300">{row.label}</div>
                <div className="px-4 py-3 font-medium text-gold">{row.us}</div>
                <div className="px-4 py-3 text-gray-400">{row.them}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:items-start">
          <div>
            <div className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-700 text-4xl font-bold text-ink-900">
              WN
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
              Founder
            </p>
            <h2 className="font-serif text-3xl font-bold text-white">Wences Navarro</h2>
            <p className="mt-4 text-gray-300 leading-relaxed">
              Wences Navarro founded RFR Network after two decades of building referral
              pipelines the hard way. He saw brilliant operators starving for warm
              introductions while traditional networking groups burned their time on
              outdated systems. RFR is the network he wished existed: a premium,
              invitation-driven community for people who close.
            </p>
            <p className="mt-3 text-gray-400 leading-relaxed">
              Based in Miami. Scaling nationally.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-600 bg-ink-800/40">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
            Ready to build the network your business deserves?
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/chapters" className="btn-gold">
              Find a chapter
            </Link>
            <Link href="/signup" className="btn-outline">
              Apply to join
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-600 py-10 text-center text-sm text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} RFR Network. Connection is currency.
          </p>
        </div>
      </footer>
    </>
  );
}
