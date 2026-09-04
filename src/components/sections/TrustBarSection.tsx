import React from 'react';

const metrics = [
  { value: '$412M', label: 'Assets under management' },
  { value: '18,400+', label: 'Verified investors' },
  { value: '99.98%', label: 'Payout reliability' },
  { value: '24/7', label: 'Institutional desk' },
];

export default function TrustBarSection() {
  return (
    <section aria-label="Platform metrics" className="relative z-10 border-y border-fin-border bg-[var(--surface-1)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {metrics.map((m) => (
            <div key={m.label} className="text-center lg:text-left">
              <div className="fin-figure text-2xl sm:text-3xl font-extrabold text-foreground">{m.value}</div>
              <div className="fin-label mt-2 text-[10px] sm:text-[11px] text-fin-muted">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
