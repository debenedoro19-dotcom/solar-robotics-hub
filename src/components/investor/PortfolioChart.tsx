import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { money } from '@/components/investor/wallet';

export interface ChartPoint {
  label: string;
  value: number;
}

/**
 * Recharts is heavy, so this lives in its own chunk and is loaded lazily
 * by the dashboard once the page has rendered. Colours come from theme
 * tokens so the chart follows the light/dark switch.
 */
export default function PortfolioChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="finEmerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-emerald)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--chart-emerald)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
        <Tooltip
          contentStyle={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 12, color: 'var(--text-1)' }}
          labelStyle={{ color: 'var(--text-3)' }}
          formatter={(v: number | string) => [money(Number(v)), 'Portfolio']} />
        <Area type="monotone" dataKey="value" stroke="var(--chart-emerald)" strokeWidth={2} fill="url(#finEmerald)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
