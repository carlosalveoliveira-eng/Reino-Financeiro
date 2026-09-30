export type Entity = {
  id: string;
  type: string;
  name?: string;
  amount?: number;
  initial?: number;
  accountId?: string;
  destinationId?: string;
  category?: string;
  date?: string;
  kind?: string;
  status?: string;
  target?: number;
  current?: number;
  deadline?: string;
  month?: string;
  limit?: number;
  closing?: number;
  due?: number;
  cardId?: string;
  installments?: number;
  parentId?: string;
  quantity?: string;
  cost?: number;
  value?: number;
  rate?: string;
  externalId?: string;
  fingerprint?: string;
  source?: string;
  recurringId?: string;
  xp?: number;
  code?: string;
  eventKey?: string;
  createdAt?: string;
  quoteAt?: string;
  assetId?: string;
  unitPrice?: number;
  fee?: number;
  reserved?: number;
  dueRule?: string;
  holidays?: string[];
  closingDate?: string;
  endDate?: string;
};
export function money(value: string): number {
  const s = value.trim().replace(/\s/g, '');
  if (!/^\d{1,10}([.,]\d{1,2})?$/.test(s))
    throw new Error('Informe um valor positivo com até duas casas decimais.');
  const [whole, fraction = ''] = s.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > 100_000_000_000)
    throw new Error('Valor fora do limite.');
  return cents;
}
export function brl(cents = 0) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}
export function today(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Cuiaba',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function addMonths(date: string, count: number) {
  const [y, m, d] = date.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + count, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d, last)))
    .toISOString()
    .slice(0, 10);
}
export function splitInstallments(cents: number, count: number) {
  const base = Math.floor(cents / count);
  return Array.from({ length: count }, (_, i) => base + (i < cents % count ? 1 : 0));
}
export function isCashInflow(kind?: string) {
  return ['income', 'investment_sell', 'investment_income', 'adjustment_income'].includes(
    kind || '',
  );
}
export function accountBalance(account: Entity, transactions: Entity[]) {
  return transactions
    .filter((t) => t.status === 'posted')
    .reduce(
      (sum, t) =>
        sum +
        (t.destinationId === account.id ? t.amount || 0 : 0) +
        (t.accountId === account.id
          ? isCashInflow(t.kind)
            ? t.amount || 0
            : -(t.amount || 0)
          : 0),
      account.initial || 0,
    );
}
export function totals(items: Entity[], month: string) {
  const tx = items.filter(
    (t) => t.type === 'transaction' && t.date?.startsWith(month) && t.status === 'posted',
  );
  const income = tx
    .filter((t) => ['income', 'investment_income'].includes(t.kind || ''))
    .reduce((s, t) => s + (t.amount || 0), 0);
  const expenses =
    tx.filter((t) => t.kind === 'expense').reduce((s, t) => s + (t.amount || 0), 0) +
    items
      .filter((t) => t.type === 'purchase' && t.month === month)
      .reduce((s, t) => s + (t.amount || 0), 0);
  const accounts = items.filter((t) => t.type === 'account');
  const balance = accounts.reduce((s, a) => s + accountBalance(a, txAll(items)), 0);
  const investments = items
    .filter((t) => t.type === 'investment')
    .reduce((s, t) => s + (t.value || 0), 0);
  const debts = items.filter((t) => t.type === 'debt').reduce((s, t) => s + (t.amount || 0), 0);
  const cards =
    items.filter((t) => t.type === 'purchase').reduce((s, t) => s + (t.amount || 0), 0) -
    txAll(items)
      .filter((t) => t.kind === 'card_payment' && t.status === 'posted')
      .reduce((s, t) => s + (t.amount || 0), 0);
  return {
    income,
    expenses,
    balance,
    investments,
    debts,
    cards,
    netWorth: balance + investments - debts - cards,
    savings: income ? Math.round(((income - expenses) * 100) / income) : null,
  };
}
export function txAll(items: Entity[]) {
  return items.filter((t) => t.type === 'transaction');
}
export function goalMonthly(g: Entity, date = today()) {
  const months = Math.max(
    1,
    (Number(g.deadline?.slice(0, 4)) - Number(date.slice(0, 4))) * 12 +
      (Number(g.deadline?.slice(5, 7)) - Number(date.slice(5, 7))),
  );
  return Math.ceil(Math.max(0, (g.target || 0) - (g.current || 0)) / months);
}
export function invoiceAmounts(items: Entity[]) {
  const pending: Entity[] = [];
  for (const card of items.filter((x) => x.type === 'card')) {
    let paid = items
      .filter(
        (x) =>
          x.type === 'transaction' &&
          x.kind === 'card_payment' &&
          x.cardId === card.id &&
          x.status === 'posted',
      )
      .reduce((s, x) => s + (x.amount || 0), 0);
    for (const p of items
      .filter((x) => x.type === 'purchase' && x.cardId === card.id)
      .sort((a, b) => a.month!.localeCompare(b.month!))) {
      const used = Math.min(p.amount!, paid);
      paid -= used;
      if (p.amount! - used > 0)
        pending.push({
          ...p,
          amount: p.amount! - used,
          date: invoiceDue(items, card, p.month!),
          kind: 'expense',
        });
    }
  }
  return pending;
}
export function forecast(items: Entity[], days: number, date = today()) {
  let balance = totals(items, date.slice(0, 7)).balance;
  const end = new Date(date + 'T12:00:00Z');
  end.setUTCDate(end.getUTCDate() + days);
  const endDate = end.toISOString().slice(0, 10);
  const events = items
    .filter(
      (t) =>
        t.type === 'transaction' &&
        t.status === 'planned' &&
        t.kind !== 'card_payment' &&
        t.date! >= date &&
        t.date! <= endDate,
    )
    .map((t) => ({ ...t }));
  for (const r of items.filter((t) => t.type === 'recurring')) {
    let index = Math.max(
      0,
      (Number(date.slice(0, 4)) - Number(r.date!.slice(0, 4))) * 12 +
        Number(date.slice(5, 7)) -
        Number(r.date!.slice(5, 7)) -
        1,
    );
    let d = addMonths(r.date!, index);
    let occurrences = 0;
    while (d <= endDate && (!r.endDate || d <= r.endDate) && occurrences++ < 24) {
      if (
        d >= date &&
        !items.some(
          (x) =>
            x.type === 'transaction' &&
            ((x.recurringId === r.id && x.date === d) ||
              (x.date === d &&
                x.accountId === r.accountId &&
                x.kind === r.kind &&
                x.amount === r.amount &&
                x.name === r.name)),
        )
      )
        events.push({ ...r, date: d });
      d = addMonths(r.date!, ++index);
    }
  }
  for (const p of invoiceAmounts(items)) {
    if (p.date! >= date && p.date! <= endDate) events.push(p);
    else if (p.date! < date) events.push({ ...p, date });
  }
  for (const debt of items.filter(
    (x) => x.type === 'debt' && x.amount! > 0 && x.deadline! <= endDate,
  )) {
    events.push({ ...debt, date: debt.deadline! < date ? date : debt.deadline, kind: 'expense' });
  }
  const points = [{ date, balance }];
  for (const t of events.sort((a, b) => a.date!.localeCompare(b.date!))) {
    if (t.kind === 'transfer') continue;
    balance += ['income', 'investment_sell', 'investment_income', 'adjustment_income'].includes(
      t.kind || '',
    )
      ? t.amount || 0
      : -(t.amount || 0);
    points.push({ date: t.date!, balance });
  }
  points.push({ date: endDate, balance });
  return points;
}
export function insights(items: Entity[], month: string) {
  const t = totals(items, month);
  const result: string[] = [];
  for (const b of items.filter((x) => x.type === 'budget' && x.month === month)) {
    const spent = items
      .filter(
        (x) =>
          ((x.type === 'transaction' &&
            x.status === 'posted' &&
            x.kind === 'expense' &&
            x.date?.startsWith(month)) ||
            (x.type === 'purchase' && x.month === month)) &&
          x.category === b.category,
      )
      .reduce((s, x) => s + (x.amount || 0), 0);
    if (spent >= (b.amount || 0) * 0.8)
      result.push(
        `${b.category}: ${Math.round((spent * 100) / (b.amount || 1))}% do orçamento utilizado.`,
      );
  }
  if (t.income && t.savings !== null)
    result.push(`Sua taxa de poupança neste mês é ${t.savings}%, com base nos registros.`);
  const f = forecast(items, 30);
  if (f.some((x) => x.balance < 0))
    result.push('A projeção de 30 dias indica saldo negativo. Revise os compromissos previstos.');
  if (!result.length)
    result.push(
      'Registre suas movimentações e defina um orçamento para receber análises baseadas nos seus dados.',
    );
  return result;
}

export function simulateGoal(goal: Entity, monthly: number) {
  const remaining = Math.max(0, goal.target! - goal.current!);
  if (remaining === 0) return { months: 0, date: today() };
  if (monthly <= 0) return null;
  const months = Math.ceil(remaining / monthly);
  return { months, date: addMonths(today(), Math.min(months, 1200)) };
}
export function quantityUnits(value: string): bigint {
  if (!/^\d+(\.\d{1,8})?$/.test(value)) throw new Error('Quantidade inválida.');
  const [whole, decimals = ''] = value.split('.');
  return BigInt(whole) * 100000000n + BigInt(decimals.padEnd(8, '0'));
}
export function quantityText(value: bigint) {
  const sign = value < 0n ? '-' : '';
  const v = value < 0n ? -value : value;
  const decimals = (v % 100000000n).toString().padStart(8, '0').replace(/0+$/, '');
  return sign + (v / 100000000n).toString() + (decimals ? '.' + decimals : '');
}
export function positionValue(quantity: string, unitPrice: number) {
  const value = (quantityUnits(quantity) * BigInt(unitPrice) + 50000000n) / 100000000n;
  if (value > 100000000000n) throw new Error('Valor da posição fora do limite.');
  return Number(value);
}

export function calendarDay(month: string, day: number) {
  return addMonths(month + '-' + String(day).padStart(2, '0'), 0);
}
export function businessDay(month: string, n = 7, holidays: string[] = []) {
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const date = month + '-' + String(day).padStart(2, '0'),
      d = new Date(date + 'T12:00:00Z');
    if (d.toISOString().slice(0, 7) !== month) break;
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6 && !holidays.includes(date) && ++count === n)
      return date;
  }
  throw new Error('Não há dias úteis suficientes neste mês.');
}
export function invoiceDue(items: Entity[], card: Entity, month: string) {
  const cycle = items.find(
    (x) => x.type === 'card_cycle' && x.cardId === card.id && x.month === month,
  );
  return (
    cycle?.deadline ||
    (card.dueRule === 'business7'
      ? businessDay(month, 7, card.holidays || [])
      : calendarDay(month, card.due!))
  );
}
export function purchaseMonth(items: Entity[], card: Entity, date: string) {
  const cycle = items
    .filter(
      (x) =>
        x.type === 'card_cycle' &&
        x.cardId === card.id &&
        x.closingDate! >= date &&
        date > addMonths(x.closingDate!, -1),
    )
    .sort((a, b) => a.closingDate!.localeCompare(b.closingDate!))[0];
  if (cycle) return cycle.month!;
  const closing = calendarDay(date.slice(0, 7), card.closing!);
  return addMonths(
    date,
    (date >= closing ? 1 : 0) +
      (card.dueRule === 'business7' || card.due! <= card.closing! ? 1 : 0),
  ).slice(0, 7);
}
