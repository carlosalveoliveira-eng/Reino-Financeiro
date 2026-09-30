import { addMonths, calendarDay, invoiceDue, today, type Entity } from './finance';

/** Closing is a calendar state, never a financial mutation or payment. */
export function invoiceState(closingDate: string, date = today()) {
  return date < closingDate ? 'Aberta' : date === closingDate ? 'Fecha hoje' : 'Fechada';
}

export function invoiceClosing(items: Entity[], card: Entity, month: string) {
  const explicit = items.find(
    (x) => x.type === 'card_cycle' && x.cardId === card.id && x.month === month,
  );
  if (explicit?.closingDate) return { date: explicit.closingDate, estimated: false };
  const due = invoiceDue(items, card, month);
  const sameMonth = calendarDay(month, card.closing!);
  const closingMonth = sameMonth >= due ? addMonths(month + '-01', -1).slice(0, 7) : month;
  return { date: calendarDay(closingMonth, card.closing!), estimated: true };
}
