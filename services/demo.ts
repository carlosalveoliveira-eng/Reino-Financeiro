import type { Entity } from '../domain/finance';
export function demoRecords(date: string): Entity[] {
  const month = date.slice(0, 7);
  const account = crypto.randomUUID(),
    savings = crypto.randomUUID();
  const r = (type: string, v: Partial<Entity>) => ({ id: crypto.randomUUID(), type, ...v });
  return [
    r('metadata', { name: 'demo' }),
    r('account', { id: account, name: 'Conta principal', initial: 245000 }),
    r('account', { id: savings, name: 'Reserva', initial: 350000 }),
    ...[
      ['Salário', 650000, 'income', 'Salário', '02'],
      ['Mercado', 42890, 'expense', 'Alimentação', '05'],
      ['Aluguel', 160000, 'expense', 'Moradia', '06'],
      ['Internet', 11990, 'expense', 'Assinaturas', '08'],
      ['Restaurante', 18600, 'expense', 'Alimentação', '12'],
      ['Combustível', 22000, 'expense', 'Transporte', '15'],
      ['Academia', 12990, 'expense', 'Saúde', '18'],
    ].map(([name, amount, kind, category, day]) =>
      r('transaction', {
        name: String(name),
        amount: Number(amount),
        kind: String(kind),
        category: String(category),
        date: month + '-' + day,
        accountId: account,
        status: month + '-' + day > date ? 'planned' : 'posted',
      }),
    ),
    r('goal', {
      name: 'Reserva de emergência',
      target: 1500000,
      current: 350000,
      deadline: '2027-12-01',
    }),
    r('goal', {
      name: 'Viagem de férias',
      target: 800000,
      current: 180000,
      deadline: '2027-06-01',
    }),
    r('budget', { category: 'Alimentação', amount: 80000, month }),
    r('budget', { category: 'Transporte', amount: 40000, month }),
    r('budget', { category: 'Saúde', amount: 30000, month }),
    r('recurring', {
      name: 'Salário mensal',
      kind: 'income',
      category: 'Salário',
      amount: 650000,
      date: month + '-02',
      accountId: account,
    }),
    r('recurring', {
      name: 'Aluguel mensal',
      kind: 'expense',
      category: 'Moradia',
      amount: 160000,
      date: month + '-06',
      accountId: account,
    }),
    r('investment', {
      name: 'Tesouro Selic',
      quantity: '1',
      cost: 200000,
      value: 207500,
      category: 'Renda fixa',
    }),
  ];
}
