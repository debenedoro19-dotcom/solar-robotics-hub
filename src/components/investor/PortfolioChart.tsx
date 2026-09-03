import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { money } from '@/components/investor/wallet';

export interface ChartPoint {
  label: string;
  value: number;
}

/**
 * Recharts is heavy, so this lives in its own chunk and is loaded lazily
 * by the dashboard once the page has rendered.
 */
export default function PortfolioChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="finEmerald" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00F59B" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#00F59B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
        <Tooltip
          contentStyle={{ background: '#0D0E12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff' }}
          formatter={(v: number | string) => [money(Number(v)), 'Portfolio']} />
        <Area type="monotone" dataKey="value" stroke="#00F59B" strokeWidth={2} fill="url(#finEmerald)" isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
