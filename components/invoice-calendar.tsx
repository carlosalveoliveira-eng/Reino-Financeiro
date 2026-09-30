'use client';
import { type Entity, invoiceDue } from '../domain/finance';
import { invoiceClosing, invoiceState } from '../domain/invoices';

export function InvoiceCalendar({
  items,
  month,
  date,
  edit,
}: {
  items: Entity[];
  month: string;
  date: string;
  edit: (item: Entity) => void;
}) {
  return (
    <section className="panel recent invoice-calendar">
      <div className="panel-heading">
        <h2>Datas das faturas</h2>
        <span className="tag">America/Cuiaba</span>
      </div>
      <p className="muted">
        No dia do fechamento: “Fecha hoje”. A partir do dia seguinte: “Fechada”. Fechamento não
        significa pagamento. Datas não movem compras existentes.
      </p>
      {items
        .filter((x) => x.type === 'card')
        .map((card) => {
          const closing = invoiceClosing(items, card, month);
          const cycles = items
            .filter((x) => x.type === 'card_cycle' && x.cardId === card.id)
            .sort((a, b) => a.month!.localeCompare(b.month!));
          return (
            <article key={card.id} className="invoice-summary">
              <h3>
                {card.name} · {month}
              </h3>
              <p>
                <span className="tag" aria-live="polite">
                  {invoiceState(closing.date, date)}
                </span>{' '}
                · Fecha {closing.date} · Vence {invoiceDue(items, card, month)}{' '}
                {closing.estimated && <small>(datas estimadas)</small>}
              </p>
              {cycles.map((cycle) => (
                <div className="invoice-row" key={cycle.id}>
                  <span>
                    {cycle.month} · Fecha {cycle.closingDate} · Vence {cycle.deadline}
                  </span>
                  <strong className="tag">{invoiceState(cycle.closingDate!, date)}</strong>
                  <button className="small-button" onClick={() => edit(cycle)}>
                    Editar datas
                  </button>
                </div>
              ))}
            </article>
          );
        })}
    </section>
  );
}
