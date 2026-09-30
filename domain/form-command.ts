import { money, today } from './finance';
import { command as commandSchema } from '../validations/finance';

/** Converts UI decimal text into validated commands; no persistence or UI state. */
export function formCommand(modal: string, form: Record<string, string>) {
  let command: Record<string, unknown>;
  if (modal === 'move_purchase')
    command = { action: 'move_purchase', id: form.id, month: form.month };
  else if (modal === 'trade')
    command = {
      action: 'trade',
      id: form.id,
      accountId: form.accountId,
      kind: form.tradeKind,
      quantity: form.tradeKind === 'income' ? '0' : form.quantity,
      amount: money(form.amount),
      fee: money(form.fee || '0'),
      date: form.date,
    };
  else if (modal === 'reconcile')
    command = {
      action: 'reconcile',
      id: form.id,
      balance: form.balance?.startsWith('-') ? -money(form.balance.slice(1)) : money(form.balance),
      date: form.date,
    };
  else if (modal === 'withdraw_contribution')
    command = { action: 'withdraw_contribution', id: form.id, amount: money(form.amount) };
  else if (modal === 'contribute')
    command = { action: 'contribute', id: form.id, amount: money(form.amount) };
  else if (modal === 'pay_debt')
    command = {
      action: 'pay_debt',
      id: form.id,
      amount: money(form.amount),
      accountId: form.accountId,
      date: form.date,
    };
  else {
    const record: Record<string, unknown> = { type: modal };
    if (
      [
        'account',
        'transaction',
        'goal',
        'card',
        'purchase',
        'debt',
        'investment',
        'recurring',
      ].includes(modal)
    )
      record.name = form.name;
    if (modal === 'account') record.initial = money(form.initial || '0');
    if (['transaction', 'purchase', 'debt', 'recurring', 'budget'].includes(modal))
      record.amount = money(form.amount);
    if (['transaction', 'purchase', 'recurring'].includes(modal)) record.category = form.category;
    if (['transaction', 'purchase', 'recurring'].includes(modal)) record.date = form.date;
    if (['transaction', 'recurring'].includes(modal)) {
      record.accountId = form.accountId;
      record.kind = form.kind;
    }
    if (modal === 'recurring' && form.endDate) record.endDate = form.endDate;
    if (modal === 'transaction') {
      record.status = form.date > today() ? 'planned' : form.status;
      if (form.kind === 'transfer') record.destinationId = form.destinationId;
      if (form.kind === 'card_payment') record.cardId = form.cardId;
    }
    if (modal === 'goal') {
      record.target = money(form.target);
      record.current = money(form.current || '0');
      record.deadline = form.deadline;
    }
    if (modal === 'budget') {
      record.category = form.category;
      record.month = form.month;
    }
    if (modal === 'card') {
      record.limit = money(form.limit);
      record.closing = Number(form.closing);
      record.due = Number(form.due);
      record.dueRule = form.dueRule;
      record.holidays = (form.holidays || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
    }
    if (modal === 'purchase') {
      record.cardId = form.cardId;
      record.installments = Number(form.installments);
      if (form.invoiceMonth) record.month = form.invoiceMonth;
    }
    if (modal === 'card_cycle') {
      record.cardId = form.cardId;
      record.month = form.month;
      record.closingDate = form.closingDate;
      record.deadline = form.deadline;
    }
    if (modal === 'debt') {
      record.deadline = form.deadline;
      record.rate = form.rate;
    }
    if (modal === 'investment') {
      record.quantity = form.quantity;
      record.cost = money(form.cost);
      record.value = money(form.value);
      record.category = form.category;
      record.quoteAt = form.quoteAt || today();
    }
    command = form.editingId
      ? { action: 'update', id: form.editingId, record }
      : { action: 'create', record };
  }
  command.key = form.operationKey;
  const parsed = commandSchema.safeParse(command);
  if (!parsed.success)
    throw new Error(
      'Confira os campos: ' + parsed.error.issues.map((x) => x.path.at(-1)).join(', ') + '.',
    );
  return parsed.data;
}
