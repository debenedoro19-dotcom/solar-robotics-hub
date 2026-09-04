import React from 'react';

const portfolioSlices = [
  { label: 'Vehicles', pct: 45, color: '#00D4FF' },
  { label: 'Energy Systems', pct: 30, color: '#00F59B' },
  { label: 'Robotics', pct: 15, color: '#A78BFA' },
  { label: 'Liquidity', pct: 10, color: '#E82127' },
];

const paymentMethods = [
  {
    icon: '🏦',
    name: 'Bank Wire Transfer',
    detail: 'USD · SWIFT available',
    note: 'Contact support after selecting. Full banking details provided securely.',
  },
  {
    icon: '₿',
    name: 'Cryptocurrency',
    detail: 'USDT (TRC20 / ERC20) · BTC',
    note: 'Send only to the wallet address provided after application approval. Always verify.',
  },
  {
    icon: '💳',
    name: 'Credit / Debit Card',
    detail: 'Visa · Mastercard',
    note: 'Processed through a secure payment partner. Fees may apply.',
  },
];

export default function PaymentsSection() {
  return (
    <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portfolio */}
          <div className="glass-premium rounded-3xl p-8 section-reveal depth-card">
            <h3 className="text-lg font-extrabold text-foreground mb-2">Platform Portfolio Snapshot</h3>
            <p className="text-sm text-muted-foreground mb-8">Illustrative allocation across the Tesla ecosystem</p>

            <div className="space-y-4">
              {portfolioSlices?.map((s) => (
                <div key={s?.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-foreground">{s?.label}</span>
                    <span className="font-extrabold" style={{ color: s?.color }}>{s?.pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${s?.pct}%`, background: s?.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total AUM</div>
                <div className="text-xl font-extrabold text-primary">$2.4T+</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Positions</div>
                <div className="text-xl font-extrabold text-foreground">12,400+</div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="glass-premium rounded-3xl p-8 section-reveal depth-card">
            <h3 className="text-lg font-extrabold text-foreground mb-2">Accepted Payment Methods</h3>
            <p className="text-sm text-muted-foreground mb-8">Secure and flexible ways to fund your investments</p>

            <div className="space-y-4">
              {paymentMethods?.map((m) => (
                <div key={m?.name} className="flex gap-4 p-4 rounded-xl border border-border hover:border-primary/30 transition-colors bg-muted/20">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">{m?.icon}</div>
                  <div>
                    <div className="font-bold text-sm text-foreground">{m?.name}</div>
                    <div className="text-xs font-semibold text-primary mb-1">{m?.detail}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{m?.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
