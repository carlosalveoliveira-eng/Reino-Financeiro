'use client';
import { type Entity, brl, invoiceAmounts } from '../domain/finance';
import { CreditCard, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Progress } from './ui/progress';
import { Empty } from './empty-state';
import { InvoiceCalendar } from './invoice-calendar';
export function CardsPanel({
  items,
  cards,
  transactions,
  month,
  localDate,
  edit,
  open,
  setConfirm,
}: {
  items: Entity[];
  edit: (r: Entity) => void;
  open: (type: string, preset?: Record<string, string>) => void;
  setConfirm: (r: Entity) => void;
  cards: Entity[];
  transactions: Entity[];
  month: string;
  localDate: string;
}) {
  return (
    <>
      <div className="card-grid">
        {cards.map((c) => {
          const purchases = items.filter((p) => p.type === 'purchase' && p.cardId === c.id);
          const paid = transactions
            .filter((t) => t.kind === 'card_payment' && t.cardId === c.id && t.status === 'posted')
            .reduce((s, t) => s + t.amount!, 0);
          const debt = purchases.reduce((s, p) => s + p.amount!, 0) - paid;
          return (
            <article key={c.id} className="panel account-card">
              <div className="between">
                <CreditCard className="gold" />
                <span className="tag">BRL</span>
              </div>
              <h2>{c.name}</h2>
              <strong className="large-value">{brl(Math.max(0, c.limit! - debt))}</strong>
              <p className="muted">Limite disponível · Total: {brl(c.limit)}</p>
              <Progress
                aria-label={'Limite comprometido de ' + c.name}
                value={Math.min(100, (debt * 100) / c.limit!)}
              />
              <p>Comprometido: {brl(debt)}</p>
              <p className="muted">
                Fechamento previsto: dia {c.closing} ·{' '}
                {c.dueRule === 'business7' ? 'Vence no 7º dia útil' : 'Vence dia ' + c.due}
              </p>
              <div className="heading-actions">
                <button className="secondary" onClick={() => edit(c)}>
                  Editar cartão
                </button>
                <button className="secondary" onClick={() => open('card_cycle', { cardId: c.id })}>
                  Datas da fatura
                </button>
                <button className="primary" onClick={() => open('purchase', { cardId: c.id })}>
                  Nova compra
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    open('transaction', {
                      kind: 'card_payment',
                      cardId: c.id,
                      category: 'Outros',
                      name: 'Pagamento de fatura',
                    })
                  }
                >
                  Pagar fatura
                </button>
              </div>
            </article>
          );
        })}
        {!cards.length && (
          <Empty
            title="Organize suas próximas faturas"
            body="Adicione um cartão para registrar compras e parcelas."
            action="Novo cartão"
            onClick={() => open('card')}
          />
        )}
      </div>
      <InvoiceCalendar items={items} month={month} date={localDate} edit={edit} />
      {items.some((x) => x.type === 'purchase') && (
        <section className="panel recent">
          <div className="panel-heading">
            <h2>Parcelas por fatura</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compra</TableHead>
                <TableHead>Cartão</TableHead>
                <TableHead>Mês de vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Em aberto</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items
                .filter((x) => x.type === 'purchase')
                .sort((a, b) => a.month!.localeCompare(b.month!))
                .map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{cards.find((c) => c.id === p.cardId)?.name}</TableCell>
                    <TableCell>
                      {p.month}
                      <button
                        className="small-button"
                        onClick={() => open('move_purchase', { id: p.id, month: p.month! })}
                      >
                        Mover parcela
                      </button>
                    </TableCell>
                    <TableCell>{brl(p.amount)}</TableCell>
                    <TableCell>
                      {brl(invoiceAmounts(items).find((i) => i.id === p.id)?.amount || 0)}
                    </TableCell>
                    <TableCell>
                      <button
                        className="icon-button"
                        aria-label={'Excluir compra ' + p.name}
                        onClick={() => setConfirm({ ...p, type: 'delete_purchase' })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </section>
      )}
    </>
  );
}
