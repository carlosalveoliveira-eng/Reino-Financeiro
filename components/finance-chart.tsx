'use client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { brl } from '../domain/finance';
export default function FinanceChart({ data }: { data: { date: string; balance: number }[] }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="cash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6bdab3" stopOpacity={0.27} />
              <stop offset="100%" stopColor="#6bdab3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ffffff0b" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => d.slice(8) + '/' + d.slice(5, 7)}
            stroke="#748982"
            fontSize={12}
            minTickGap={40}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => 'R$ ' + Math.round(v / 100)}
            stroke="#748982"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => brl(Number(v))}
            labelFormatter={(v) => String(v).split('-').reverse().join('/')}
            contentStyle={{
              background: '#152823',
              border: '1px solid #365047',
              borderRadius: 8,
              color: '#e6efea',
            }}
          />
          <Area
            type="stepAfter"
            dataKey="balance"
            name="Saldo projetado"
            stroke="#6bdab3"
            strokeWidth={2}
            fill="url(#cash)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
