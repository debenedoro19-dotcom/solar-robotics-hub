import React from 'react';

const steps = [
  {
    n: '01',
    title: 'Open your account',
    body: 'Register in minutes and complete identity verification with our compliance desk.',
  },
  {
    n: '02',
    title: 'Fund your wallet',
    body: 'Deposit by bank wire or digital assets. Every deposit is reconciled and confirmed by an officer.',
  },
  {
    n: '03',
    title: 'Select a mandate',
    body: 'Allocate across vehicles, energy systems and robotics with published terms and daily accrual.',
  },
  {
    n: '04',
    title: 'Track and withdraw',
    body: 'Monitor accrual in real time and withdraw to your verified destination whenever you choose.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative z-10 py-20 sm:py-24 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-14">
          <p className="fin-label text-primary text-[11px]">How it works</p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Four steps from capital to allocation
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {steps.map((s) => (
            <div key={s.n} className="fin-card rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1">
              <span className="fin-figure text-sm font-extrabold text-primary">{s.n}</span>
              <h3 className="mt-5 text-base font-bold text-foreground tracking-tight">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fin-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
