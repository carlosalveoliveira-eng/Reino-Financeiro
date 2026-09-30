'use client';
import { lazy, Suspense } from 'react';
const FinanceChart = lazy(() => import('./finance-chart'));
export default function Chart({ data }: { data: { date: string; balance: number }[] }) {
  return (
    <Suspense
      fallback={
        <div className="chart loading" role="status">
          Preparando projeção…
        </div>
      }
    >
      <FinanceChart data={data} />
    </Suspense>
  );
}
