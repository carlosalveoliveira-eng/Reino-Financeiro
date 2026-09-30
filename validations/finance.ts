import { z } from 'zod';
const name = z.string().trim().min(1).max(120),
  amount = z.number().int().min(0).max(100_000_000_000),
  positive = amount.min(1),
  id = z.string().uuid();
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => {
    const d = new Date(s + 'T12:00:00Z');
    return !isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === s;
  }, 'Data inválida');
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const entity = z.discriminatedUnion('type', [
  z.object({ type: z.literal('account'), name, initial: amount }),
  z.object({
    type: z.literal('transaction'),
    name,
    amount: positive,
    date,
    accountId: id,
    assetId: id.optional(),
    destinationId: id.optional(),
    cardId: id.optional(),
    kind: z.enum(['income', 'expense', 'transfer', 'card_payment']),
    category: name,
    externalId: z.string().max(160).optional(),
    source: z.enum(['manual', 'csv', 'ofx']).optional(),
    status: z.enum(['posted', 'planned']),
  }),
  z.object({ type: z.literal('goal'), name, target: positive, current: amount, deadline: date }),
  z.object({ type: z.literal('budget'), category: name, amount: positive, month }),
  z.object({
    type: z.literal('card'),
    name,
    limit: positive,
    closing: z.number().int().min(1).max(31),
    due: z.number().int().min(1).max(31),
    dueRule: z.enum(['fixed', 'business7']).optional(),
    holidays: z.array(date).max(100).optional(),
  }),
  z.object({ type: z.literal('card_cycle'), cardId: id, month, closingDate: date, deadline: date }),
  z.object({
    type: z.literal('purchase'),
    name,
    amount: positive,
    date,
    cardId: id,
    category: name,
    installments: z.number().int().min(1).max(60),
    month: month.optional(),
  }),
  z.object({
    type: z.literal('debt'),
    name,
    amount: positive,
    deadline: date,
    rate: z.string().max(30),
  }),
  z.object({
    type: z.literal('investment'),
    name,
    quantity: z.string().regex(/^\d+(\.\d{1,8})?$/),
    cost: amount,
    value: amount,
    quoteAt: date.optional(),
    category: name,
  }),
  z.object({
    type: z.literal('recurring'),
    name,
    amount: positive,
    date,
    endDate: date.optional(),
    kind: z.enum(['income', 'expense']),
    category: name,
    accountId: id,
  }),
]);
export const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('move_purchase'), key: id, id, month }),
  z.object({ action: z.literal('create'), key: id, record: entity }),
  z.object({ action: z.literal('update'), key: id, id, record: entity }),
  z.object({ action: z.literal('delete'), key: id, id }),
  z.object({ action: z.literal('clear'), key: id }),
  z.object({ action: z.literal('demo'), key: id }),
  z.object({
    action: z.literal('contribute'),
    key: id,
    id,
    amount: positive,
    date: date.optional(),
  }),
  z.object({ action: z.literal('pay_debt'), key: id, id, amount: positive, accountId: id, date }),
  z.object({ action: z.literal('settle'), key: id, id }),
  z.object({ action: z.literal('sync_journey'), key: id }),
  z.object({ action: z.literal('review_budget'), key: id, month: month.optional() }),
  z.object({ action: z.literal('review_investments'), key: id }),
  z.object({ action: z.literal('confirm_recurring'), key: id, id, date }),
  z.object({
    action: z.literal('import'),
    key: id,
    accountId: id,
    format: z.enum(['csv', 'ofx']),
    rows: z
      .array(
        z.object({
          name,
          amount: positive,
          date,
          kind: z.enum(['income', 'expense']),
          category: name,
          externalId: z.string().max(160).optional(),
        }),
      )
      .min(1)
      .max(200),
  }),
  z.object({
    action: z.literal('trade'),
    key: id,
    id,
    accountId: id,
    kind: z.enum(['buy', 'sell', 'income']),
    quantity: z.string().regex(/^\d+(\.\d{1,8})?$/),
    amount: positive,
    fee: amount,
    date,
  }),
  z.object({
    action: z.literal('reconcile'),
    key: id,
    id,
    balance: z.number().int().min(-100_000_000_000).max(100_000_000_000),
    date,
  }),
  z.object({ action: z.literal('withdraw_contribution'), key: id, id, amount: positive }),
  z.object({
    action: z.literal('preferences'),
    key: id,
    weeklyTarget: amount,
    reminderDay: z.number().int().min(0).max(6),
  }),
  z.object({ action: z.literal('delete_purchase'), key: id, id }),
]);
