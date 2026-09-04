import React from 'react';

const pillars = [
  {
    title: 'Segregated custody',
    body: 'Client capital is held separately from operating funds and reconciled daily.',
  },
  {
    title: 'KYC & AML programme',
    body: 'Identity, source-of-funds and sanctions screening on every account before allocation.',
  },
  {
    title: 'Encrypted infrastructure',
    body: 'TLS 1.3 in transit, AES-256 at rest, and row-level access control on all investor data.',
  },
  {
    title: 'Withdrawal controls',
    body: 'Dual-review payout approval with destination verification on every request.',
  },
];

export default function SecurityComplianceSection() {
  return (
    <section id="security" className="relative z-10 py-20 sm:py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-12 lg:gap-16 items-start">
          <div>
            <p className="fin-label text-primary text-[11px]">Security &amp; Compliance</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Institutional controls on every dollar
            </h2>
            <p className="mt-5 text-sm sm:text-base leading-relaxed text-fin-muted">
              Trade Tesla operates to the standards sophisticated investors expect: verified onboarding,
              auditable money movement, and a compliance desk reachable at{' '}
              <a href="mailto:support@tradeenergyhub.com" className="text-primary hover:underline">
                support@tradeenergyhub.com
              </a>
              .
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {pillars.map((p) => (
              <div key={p.title} className="fin-card rounded-3xl p-6">
                <h3 className="text-sm font-bold tracking-tight text-foreground">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-fin-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
