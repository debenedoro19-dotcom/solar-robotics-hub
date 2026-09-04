import React, { useEffect, useRef, useState } from 'react';

const tickerItems = [
  { symbol: 'TSLA', name: 'Tesla Inc', price: '$319.53', change: '−0.63%', up: false },
  { symbol: 'MSFT', name: 'Microsoft Corp', price: '$499.86', change: '+2.54%', up: true },
  { symbol: 'AAPL', name: 'Apple Inc', price: '$312.41', change: '+1.85%', up: true },
  { symbol: 'GOOGL', name: 'Alphabet Inc', price: '$357.75', change: '+1.29%', up: true },
  { symbol: 'NVDA', name: 'NVIDIA Corp', price: '$218.99', change: '−0.10%', up: false },
  { symbol: 'META', name: 'Meta Platforms', price: '$589.90', change: '+0.19%', up: true },
  { symbol: 'AMZN', name: 'Amazon.com', price: '$272.26', change: '−0.14%', up: false },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: '$356.30', change: '−0.82%', up: false },
];

// Pre-computed chart bar heights to avoid Math.sin() in render (prevents hydration mismatch)
const chartBarHeights = Array.from({ length: 20 }, (_, i) => Math.round(20 + Math.sin(i * 0.8) * 15));


export default function PlatformCredibilitySection() {
  const tickerRef = useRef<HTMLDivElement>(null);
  const [tickerWidth, setTickerWidth] = useState(0);

  useEffect(() => {
    if (tickerRef?.current) {
      setTickerWidth(tickerRef?.current?.scrollWidth / 2);
    }
  }, []);

  return (
    <section id="market" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Live Market Data */}
        <div className="mb-16 section-reveal">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-bold text-green-400 tracking-[0.25em] uppercase">Live Market Data</span>
            <span className="text-xs text-muted-foreground">Real-time prices powered by institutional-grade feeds</span>
          </div>

          {/* Ticker */}
          <div className="overflow-hidden border border-border rounded-xl bg-muted/20 py-3 mb-8">
            <div ref={tickerRef} className="ticker-track">
              {[...tickerItems, ...tickerItems]?.map((t, i) => (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-extrabold text-foreground">{t?.symbol}</span>
                  <span className="text-xs text-muted-foreground">{t?.price}</span>
                  <span className={`text-xs font-bold ${t?.up ? 'text-green-400' : 'text-accent'}`}>{t?.change}</span>
                  <span className="text-muted-foreground/30 text-xs">·</span>
                </div>
              ))}
            </div>
          </div>

          {/* Featured stock cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tickerItems?.slice(0, 3)?.map((t) => (
              <div key={t?.symbol} className="glass-premium glass-card-hover rounded-xl p-5 depth-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{t?.symbol}</div>
                    <div className="text-sm font-semibold text-foreground">{t?.name}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${t?.up ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-accent/10 text-accent border border-accent/20'}`}>
                    {t?.change}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-foreground">{t?.price}</div>
                {/* Mini chart bar decoration */}
                <div className="mt-3 flex items-end gap-0.5 h-8">
                  {chartBarHeights?.map((height, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${t?.up ? 'bg-green-400/30' : 'bg-accent/30'}`}
                      style={{ height: `${height + (t?.up ? 5 : -5)}px` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}