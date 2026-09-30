import {
  readRecords,
  commit,
  getRevision,
  alreadyCommitted,
  readRewards,
  activityKinds,
} from '../repositories/finance';
import { command } from '../validations/finance';
import {
  purchaseMonth,
  splitInstallments,
  addMonths,
  today,
  accountBalance,
  txAll,
  quantityUnits,
  quantityText,
  type Entity,
} from '../domain/finance';
import { rewardsFor } from '../domain/journey';
import { demoRecords } from './demo';
async function hash(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export async function execute(userId: string, input: unknown) {
  const c = command.parse(input),
    digest = await hash(JSON.stringify(c));
  if (await alreadyCommitted(userId, c.key, digest)) return readRecords(userId);
  const revision = await getRevision(userId),
    items = await readRecords(userId),
    priorRewards = await readRewards(userId);
  let add: Entity[] = [],
    remove: string[] = [],
    clear = false,
    rewardKind: string | undefined;
  const find = (id: string, type?: string) => {
    const r = items.find((x) => x.id === id && (!type || x.type === type));
    if (!r) throw new Error('Registro não encontrado.');
    return r;
  };
  const record = (type: string, values: Partial<Entity>) => ({
    id: crypto.randomUUID(),
    type,
    ...values,
  });
  const cardDebt = (id: string, exclude?: string) =>
    items
      .filter((x) => x.type === 'purchase' && x.cardId === id)
      .reduce((s, x) => s + x.amount!, 0) -
    items
      .filter(
        (x) =>
          x.id !== exclude &&
          x.type === 'transaction' &&
          x.kind === 'card_payment' &&
          x.cardId === id &&
          x.status === 'posted',
      )
      .reduce((s, x) => s + x.amount!, 0);
  if (c.action === 'create' || c.action === 'update') {
    const prior = c.action === 'update' ? find(c.id) : null;
    if (
      prior &&
      (prior.type !== c.record.type ||
        prior.type === 'purchase' ||
        prior.parentId ||
        prior.recurringId ||
        prior.source === 'reconcile')
    )
      throw new Error('Este registro vinculado não pode ser alterado isoladamente.');
    const r = { ...c.record, id: c.action === 'update' ? c.id : crypto.randomUUID() } as Entity;
    if (prior) remove = [prior.id];
    if (prior?.fingerprint) {
      r.fingerprint = prior.fingerprint;
      r.externalId = prior.externalId;
      r.source = prior.source;
    }
    if (r.accountId) find(r.accountId, 'account');
    if (r.destinationId) find(r.destinationId, 'account');
    if (r.destinationId && r.kind !== 'transfer')
      throw new Error('Destino permitido apenas em transferências.');
    if (r.cardId && r.type === 'transaction' && r.kind !== 'card_payment')
      throw new Error('Cartão permitido apenas para pagamento de fatura.');
    if (r.type === 'transaction' && r.status === 'posted' && r.date! > today())
      r.status = 'planned';
    if (r.kind === 'transfer' && (!r.destinationId || r.destinationId === r.accountId))
      throw new Error('Selecione uma conta de destino diferente.');
    if (r.type === 'goal') {
      if (r.current! > r.target!)
        throw new Error('O valor reservado deve ser menor ou igual à meta.');
      if (prior && r.current !== prior.current)
        throw new Error(
          'Use Reservar ou Retirar para alterar o valor acumulado e manter o histórico.',
        );
      if (!prior && r.current! > 0)
        add.push(
          record('contribution', {
            parentId: r.id,
            amount: r.current,
            date: today(),
            name: 'Reserva inicial',
            kind: 'contribution',
          }),
        );
    }
    if (
      prior?.type === 'investment' &&
      items.some((x) => x.type === 'trade' && x.parentId === r.id) &&
      (r.quantity !== prior.quantity || r.cost !== prior.cost)
    )
      throw new Error(
        'Use compras e vendas para alterar uma posição com histórico. A avaliação pode ser atualizada manualmente.',
      );
    if (r.type === 'recurring' && r.endDate && r.endDate < r.date!)
      throw new Error('A data final deve ser igual ou posterior à primeira ocorrência.');
    if (r.type === 'investment') r.quoteAt = r.quoteAt || today();
    if (r.type === 'recurring') rewardKind = 'recurring';
    if (
      r.type === 'budget' &&
      items.some(
        (x) =>
          x.id !== r.id && x.type === 'budget' && x.month === r.month && x.category === r.category,
      )
    )
      throw new Error('Já existe orçamento para essa categoria e mês.');
    if (r.type === 'card_cycle') {
      find(r.cardId!, 'card');
      if (r.deadline! < r.closingDate!)
        throw new Error('O vencimento deve ser posterior ao fechamento.');
      if (!r.deadline!.startsWith(r.month!))
        throw new Error('O vencimento deve pertencer ao mês da fatura.');
      const existing = items.find(
        (x) =>
          x.type === 'card_cycle' && x.cardId === r.cardId && x.month === r.month && x.id !== r.id,
      );
      if (existing) throw new Error('Esta fatura já possui datas. Use Editar.');
    }
    if (r.type === 'purchase') {
      const card = find(r.cardId!, 'card');
      if (r.installments! > r.amount!)
        throw new Error('Cada parcela deve ter ao menos um centavo.');
      if (r.date! > today()) throw new Error('Registre compras na data em que elas ocorreram.');
      if (r.amount! > card.limit! - cardDebt(card.id))
        throw new Error('A compra ultrapassa o limite disponível registrado.');
      const base = (r.month || purchaseMonth(items, card, r.date!)) + '-01';
      rewardKind = 'purchase';
      add.push(
        ...splitInstallments(r.amount!, r.installments!).map((amount, i) => ({
          ...r,
          id: crypto.randomUUID(),
          parentId: r.id,
          name: `${r.name} · ${i + 1}/${r.installments}`,
          amount,
          month: addMonths(base, i).slice(0, 7),
        })),
      );
    } else {
      if (r.kind === 'card_payment') {
        if (!r.cardId) throw new Error('Selecione um cartão.');
        find(r.cardId, 'card');
        if (r.amount! > cardDebt(r.cardId, r.id))
          throw new Error('Pagamento superior ao saldo do cartão.');
      }
      add.push(r);
      if (r.type === 'transaction' && r.status === 'posted') rewardKind = 'transaction';
      if (r.type === 'recurring') rewardKind = 'recurring';
      if (r.type === 'budget' && r.month === today().slice(0, 7)) rewardKind = 'budget';
      if (r.type === 'investment') rewardKind = 'investment';
      if (r.type === 'goal' && !prior && r.current! > 0) rewardKind = 'contribution';
    }
  }
  if (c.action === 'delete') {
    const r = find(c.id);
    if (r.type === 'recurring' && items.some((x) => x.recurringId === r.id))
      throw new Error(
        'Esta recorrência possui ocorrências confirmadas. Defina uma data final para encerrá-la e preservar o histórico.',
      );
    if (r.type === 'account' && items.some((x) => x.accountId === r.id || x.destinationId === r.id))
      throw new Error('Esta conta possui movimentações.');
    if (r.type === 'card' && items.some((x) => x.cardId === r.id))
      throw new Error('Este cartão possui movimentações.');
    if (r.type === 'goal' && items.some((x) => x.type === 'contribution' && x.parentId === r.id))
      throw new Error('Esta meta possui reservas. Retire o valor antes de excluí-la.');
    if (r.type === 'investment' && items.some((x) => x.type === 'trade' && x.parentId === r.id))
      throw new Error('Este ativo possui histórico.');
    if (r.parentId || r.recurringId || r.source === 'reconcile')
      throw new Error('Registros vinculados não podem ser excluídos isoladamente.');
    if (
      ![
        'account',
        'card',
        'goal',
        'budget',
        'investment',
        'debt',
        'recurring',
        'transaction',
      ].includes(r.type)
    )
      throw new Error('Tipo de exclusão indisponível.');
    if (r.type === 'debt' && items.some((x) => x.parentId === r.id))
      throw new Error('Esta dívida possui pagamentos.');
    remove = [r.id];
  }
  if (c.action === 'move_purchase') {
    const p = find(c.id, 'purchase');
    remove = [p.id];
    add = [{ ...p, month: c.month }];
  }
  if (c.action === 'delete_purchase') {
    const p = find(c.id, 'purchase');
    if (
      items.some(
        (x) =>
          x.type === 'transaction' &&
          x.cardId === p.cardId &&
          x.kind === 'card_payment' &&
          x.status === 'posted',
      )
    )
      throw new Error('O cartão já possui pagamentos. A exclusão exige reconciliação manual.');
    remove = items
      .filter((x) => x.type === 'purchase' && x.parentId === p.parentId)
      .map((x) => x.id);
  }
  if (c.action === 'clear') clear = true;
  if (c.action === 'demo') {
    if (items.length)
      throw new Error('Os exemplos só podem ser carregados quando não há registros.');
    add = demoRecords(today());
  }
  if (c.action === 'contribute' || c.action === 'withdraw_contribution') {
    const r = find(c.id, 'goal'),
      sign = c.action === 'contribute' ? 1 : -1,
      current = r.current! + sign * c.amount;
    if (current > r.target!) throw new Error('O aporte ultrapassa o valor da meta.');
    if (current < 0) throw new Error('Retirada superior à reserva registrada.');
    add = [
      { ...r, current },
      record('contribution', {
        parentId: r.id,
        amount: c.amount,
        date: today(),
        kind: sign > 0 ? 'contribution' : 'withdrawal',
        name: sign > 0 ? 'Reserva para a meta' : 'Retirada da reserva',
      }),
    ];
    remove = [r.id];
  }
  if (c.action === 'pay_debt') {
    if (c.date > today()) throw new Error('Registre o pagamento apenas quando ele ocorrer.');
    const r = find(c.id, 'debt');
    find(c.accountId, 'account');
    if (c.amount > r.amount!) throw new Error('Pagamento superior ao saldo da dívida.');
    remove = [r.id];
    add = [
      { ...r, amount: r.amount! - c.amount },
      record('transaction', {
        name: `Pagamento · ${r.name}`,
        parentId: r.id,
        amount: c.amount,
        accountId: c.accountId,
        date: c.date,
        kind: 'expense',
        category: 'Dívidas',
        status: 'posted',
      }),
    ];
  }
  if (c.action === 'settle') {
    const r = find(c.id, 'transaction');
    if (r.status !== 'planned') throw new Error('Movimentação já confirmada.');
    if (r.date! > today())
      throw new Error('Confirme a movimentação apenas na data em que ela ocorrer.');
    if (r.kind === 'card_payment' && r.amount! > cardDebt(r.cardId!))
      throw new Error('Pagamento superior ao saldo do cartão.');
    remove = [r.id];
    add = [{ ...r, status: 'posted' }];
    rewardKind = 'transaction';
  }
  if (c.action === 'review_budget' && c.month && c.month !== today().slice(0, 7))
    throw new Error('Selecione o mês atual para registrar a revisão de hoje.');
  if (
    c.action === 'review_budget' &&
    !items.some((x) => x.type === 'budget' && x.month === today().slice(0, 7))
  )
    throw new Error('Crie um orçamento para este mês antes de revisá-lo.');
  if (c.action === 'review_investments' && !items.some((x) => x.type === 'investment'))
    throw new Error('Cadastre sua carteira antes de revisá-la.');
  if (c.action === 'confirm_recurring') {
    const r = find(c.id, 'recurring');
    if (r.endDate && c.date > r.endDate)
      throw new Error('Esta ocorrência é posterior à data final.');
    if (c.date > today()) throw new Error('Confirme apenas ocorrências que já aconteceram.');
    const diff =
      (Number(c.date.slice(0, 4)) - Number(r.date!.slice(0, 4))) * 12 +
      Number(c.date.slice(5, 7)) -
      Number(r.date!.slice(5, 7));
    if (diff < 0 || addMonths(r.date!, diff) !== c.date)
      throw new Error('A data não corresponde a esta recorrência.');
    if (items.some((x) => x.type === 'transaction' && x.recurringId === r.id && x.date === c.date))
      throw new Error('Esta ocorrência já foi confirmada.');
    if (
      items.some(
        (x) =>
          x.type === 'transaction' &&
          x.date === c.date &&
          x.name === r.name &&
          x.amount === r.amount &&
          x.accountId === r.accountId &&
          x.kind === r.kind,
      )
    )
      throw new Error('Já existe uma movimentação correspondente. Confira antes de confirmar.');
    add = [
      record('transaction', {
        name: r.name,
        amount: r.amount,
        date: c.date,
        kind: r.kind,
        category: r.category,
        accountId: r.accountId,
        status: 'posted',
        recurringId: r.id,
        source: 'recurring',
      }),
    ];
    rewardKind = 'transaction';
  }
  if (c.action === 'import') {
    find(c.accountId, 'account');
    const seen = new Set(items.filter((x) => x.fingerprint).map((x) => x.fingerprint!));
    for (const row of c.rows) {
      const fingerprint = await hash(
        c.accountId +
          '|' +
          (row.externalId
            ? 'external:' + row.externalId
            : 'data:' + row.date + '|' + row.name + '|' + row.kind + '|' + row.amount),
      );
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      add.push(
        record('transaction', {
          ...row,
          accountId: c.accountId,
          status: row.date > today() ? 'planned' : 'posted',
          fingerprint,
          source: c.format,
        }),
      );
    }
    if (!add.length) throw new Error('Todas as movimentações deste arquivo já foram importadas.');
    if (add.some((x) => x.status === 'posted')) rewardKind = 'transaction';
  }
  if (c.action === 'trade') {
    const r = find(c.id, 'investment');
    find(c.accountId, 'account');
    if (c.date > today()) throw new Error('Registre operações apenas quando elas ocorrerem.');
    const units = quantityUnits(c.quantity),
      held = quantityUnits(r.quantity!);
    let next = { ...r },
      txAmount = c.amount;
    if (c.kind === 'buy') {
      if (units <= 0n) throw new Error('Informe uma quantidade positiva.');
      next = {
        ...r,
        quantity: quantityText(held + units),
        cost: r.cost! + c.amount + c.fee,
        value: r.value! + c.amount,
      };
      txAmount = c.amount + c.fee;
    } else if (c.kind === 'sell') {
      if (units <= 0n || units > held) throw new Error('Quantidade superior à posição registrada.');
      if (c.fee >= c.amount) throw new Error('A taxa deve ser menor que o valor da venda.');
      const costRemoved = Number((BigInt(r.cost!) * units + held / 2n) / held),
        valueRemoved = Number((BigInt(r.value!) * units + held / 2n) / held);
      next = {
        ...r,
        quantity: quantityText(held - units),
        cost: r.cost! - costRemoved,
        value: r.value! - valueRemoved,
      };
      txAmount = c.amount - c.fee;
    } else {
      if (c.fee >= c.amount) throw new Error('A taxa deve ser menor que o rendimento.');
      txAmount = c.amount - c.fee;
    }
    if (next.cost! > 100_000_000_000 || next.value! > 100_000_000_000)
      throw new Error('Posição fora do limite de valor.');
    const tradeId = crypto.randomUUID();
    remove = [r.id];
    add = [
      next,
      record('trade', {
        id: tradeId,
        parentId: r.id,
        accountId: c.accountId,
        date: c.date,
        kind: c.kind,
        quantity: c.quantity,
        amount: c.amount,
        fee: c.fee,
        name: r.name,
      }),
      record('transaction', {
        parentId: tradeId,
        assetId: r.id,
        accountId: c.accountId,
        date: c.date,
        kind:
          c.kind === 'buy'
            ? 'investment_buy'
            : c.kind === 'sell'
              ? 'investment_sell'
              : 'investment_income',
        amount: txAmount,
        status: 'posted',
        name: `${c.kind === 'buy' ? 'Compra' : c.kind === 'sell' ? 'Venda' : 'Rendimento'} · ${r.name}`,
        category: 'Investimentos',
        source: 'investment',
      }),
    ];
  }
  if (c.action === 'reconcile') {
    const a = find(c.id, 'account');
    if (c.date > today()) throw new Error('Reconcilie apenas saldos já conhecidos.');
    const current = accountBalance(a, txAll(items)),
      delta = c.balance - current;
    if (delta === 0) throw new Error('O saldo registrado já coincide com o informado.');
    add = [
      record('transaction', {
        accountId: a.id,
        date: c.date,
        amount: Math.abs(delta),
        kind: delta > 0 ? 'adjustment_income' : 'adjustment_expense',
        status: 'posted',
        category: 'Ajustes',
        name: 'Reconciliação de saldo',
        source: 'reconcile',
      }),
    ];
  }
  if (c.action === 'preferences') {
    const old = items.find((x) => x.type === 'preferences');
    if (old) remove = [old.id];
    add = [record('preferences', { amount: c.weeklyTarget, due: c.reminderDay })];
  }
  const nextItems = clear ? [] : [...items.filter((x) => !remove.includes(x.id)), ...add];
  const rewards =
    clear || c.action === 'preferences'
      ? []
      : rewardsFor(c.action, nextItems, priorRewards, today(), rewardKind);
  if (c.action === 'sync_journey' && !items.some((x) => x.type === 'metadata' && x.name === 'demo'))
    for (const kind of await activityKinds(userId, today()))
      rewards.push(
        ...rewardsFor('create', nextItems, [...priorRewards, ...rewards], today(), kind),
      );
  try {
    await commit(userId, c.key, digest, revision, add, remove, clear, rewards);
  } catch {
    if (await alreadyCommitted(userId, c.key, digest)) return readRecords(userId);
    throw new Error('Os dados mudaram durante a operação. Atualize a página e tente novamente.');
  }
  return readRecords(userId);
}
