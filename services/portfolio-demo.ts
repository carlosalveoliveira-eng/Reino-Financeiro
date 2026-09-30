import { demoRecords } from './demo';
import { addMonths, calendarDay, type Entity } from '../domain/finance';
import { rewardsFor } from '../domain/journey';

/** Synthetic fixtures only. Never import repositories, authentication or API clients here. */
export function portfolioDemo(date: string) {
  const items = demoRecords(date);
  const month = date.slice(0, 7),
    nextMonth = addMonths(month + '-01', 1).slice(0, 7);
  const cardId = crypto.randomUUID();
  items.push(
    {
      id: cardId,
      type: 'card',
      name: 'Cartão da Vila · fictício',
      limit: 500000,
      closing: 29,
      due: 7,
    },
    {
      id: crypto.randomUUID(),
      type: 'card_cycle',
      cardId,
      month: nextMonth,
      closingDate: calendarDay(month, 29),
      deadline: nextMonth + '-07',
    },
    ...[0, 1, 2].map(
      (i) =>
        ({
          id: crypto.randomUUID(),
          type: 'purchase',
          cardId,
          parentId: 'demo-purchase',
          name: `Mesa de estudos · ${i + 1}/3`,
          date: month + '-01',
          month: addMonths(month + '-01', i).slice(0, 7),
          amount: 30000,
          category: 'Compras',
        }) satisfies Entity,
    ),
  );
  const rent = items.find((x) => x.type === 'recurring' && x.kind === 'expense');
  if (rent) rent.endDate = addMonths(rent.date!, 5);
  return { items, rewards: rewardsFor('sync_journey', items, [], date) };
}
