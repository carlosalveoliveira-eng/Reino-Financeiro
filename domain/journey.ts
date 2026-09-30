import { type Entity, today } from './finance';
export type Reward = {
  key: string;
  code: string;
  title: string;
  xp: number;
  date: string;
  entityId?: string;
};
export const ACHIEVEMENTS = [
  {
    code: 'first_record',
    title: 'Primeiro capítulo',
    description: 'Registrar uma movimentação confirmada ou compra no cartão.',
    xp: 20,
    icon: 'book',
  },
  {
    code: 'first_recurring',
    title: 'Rotina organizada',
    description: 'Cadastrar a primeira receita ou despesa recorrente.',
    xp: 20,
    icon: 'calendar',
  },
  {
    code: 'first_budget',
    title: 'Mapa do tesouro',
    description: 'Definir seu primeiro orçamento.',
    xp: 30,
    icon: 'map',
  },
  {
    code: 'first_goal',
    title: 'Um destino para o dinheiro',
    description: 'Criar uma meta financeira.',
    xp: 20,
    icon: 'target',
  },
  {
    code: 'first_contribution',
    title: 'O cofre ganhou força',
    description: 'Registrar uma reserva para uma meta.',
    xp: 40,
    icon: 'shield',
  },
  {
    code: 'goal_completed',
    title: 'Obra concluída',
    description: 'Concluir uma meta registrada.',
    xp: 100,
    icon: 'crown',
  },
  {
    code: 'three_days',
    title: 'Construindo constância',
    description: 'Organizar as finanças em três dias distintos.',
    xp: 40,
    icon: 'flame',
  },
  {
    code: 'seven_days',
    title: 'Uma semana de cuidado',
    description: 'Organizar as finanças em sete dias distintos.',
    xp: 100,
    icon: 'star',
  },
  {
    code: 'first_debt_payment',
    title: 'Mais leve no caminho',
    description: 'Registrar um pagamento de dívida.',
    xp: 40,
    icon: 'chain',
  },
  {
    code: 'first_investment_review',
    title: 'Conhecer antes de agir',
    description: 'Revisar a carteira e o planejamento.',
    xp: 30,
    icon: 'library',
  },
] as const;
export function eligibleAchievements(items: Entity[], rewards: Reward[]) {
  const activeDays = new Set(rewards.filter((x) => x.code.startsWith('habit_')).map((x) => x.date))
    .size;
  const eligible: Record<string, boolean> = {
    first_record: items.some(
      (x) => (x.type === 'transaction' && x.status === 'posted') || x.type === 'purchase',
    ),
    first_recurring: items.some((x) => x.type === 'recurring'),
    first_budget: items.some((x) => x.type === 'budget'),
    first_goal: items.some((x) => x.type === 'goal'),
    first_contribution: items.some((x) => x.type === 'contribution'),
    goal_completed: items.some(
      (x) => x.type === 'goal' && x.target! > 0 && x.current! >= x.target!,
    ),
    three_days: activeDays >= 3,
    seven_days: activeDays >= 7,
    first_debt_payment: items.some(
      (x) =>
        x.type === 'transaction' &&
        x.status === 'posted' &&
        x.kind === 'expense' &&
        items.some((d) => d.id === x.parentId && d.type === 'debt'),
    ),
    first_investment_review: rewards.some((x) => x.code === 'habit_review_investments'),
  };
  return ACHIEVEMENTS.filter((a) => eligible[a.code] && !rewards.some((r) => r.code === a.code));
}
export function progress(rewards: Reward[], items: Entity[], date = today()) {
  const xp = rewards.reduce((s, r) => s + r.xp, 0),
    level = 1 + Math.floor(xp / 150),
    levelProgress = xp % 150;
  const achievements = ACHIEVEMENTS.filter((a) => rewards.some((r) => r.code === a.code));
  const activeDays = new Set(rewards.filter((r) => r.code.startsWith('habit_')).map((r) => r.date));
  const distinct = activeDays.size;
  // World evolution follows fulfilled organization milestones, never wealth or investment size.
  const stage = achievements.length >= 5 && distinct >= 3 ? 2 : achievements.length >= 2 ? 1 : 0;
  const stages = ['Primeiro acampamento', 'Vila em construção', 'Reino florescente'];
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 6 + i);
    const day = d.toISOString().slice(0, 10);
    return { date: day, done: activeDays.has(day) };
  });
  let streak = 0;
  const cursor = new Date(date + 'T12:00:00Z');
  if (!activeDays.has(date)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const completedToday = (code: string) => rewards.some((r) => r.code === code && r.date === date);
  const missions = [
    {
      code: 'habit_record',
      title: 'Organize uma movimentação',
      detail: 'Registre ou atualize uma movimentação, compra ou recorrência.',
      xp: 5,
      done: completedToday('habit_record'),
      action: 'transaction',
    },
    {
      code: 'habit_review_budget',
      title: 'Confira o plano do mês',
      detail: 'Crie, ajuste ou confirme a revisão do orçamento atual.',
      xp: 10,
      done: completedToday('habit_review_budget'),
      action: 'review_budget',
    },
    {
      code: 'habit_contribute',
      title: 'Dê um passo na sua meta',
      detail: 'Reserve um valor que caiba no seu planejamento.',
      xp: 15,
      done: completedToday('habit_contribute'),
      action: 'contribute',
    },
    {
      code: 'habit_review_investments',
      title: 'Conheça sua carteira',
      detail: 'Cadastre, atualize a avaliação ou confirme a revisão da carteira.',
      xp: 10,
      done: completedToday('habit_review_investments'),
      action: 'review_investments',
    },
  ];
  const todayDone = missions.filter((m) => m.done).length;
  return {
    xp,
    level,
    levelProgress,
    achievements,
    stage,
    stageName: stages[stage],
    week,
    streak,
    distinct,
    missions,
    todayDone,
  };
}
export function rewardsFor(
  action: string,
  items: Entity[],
  prior: Reward[],
  date = today(),
  kind?: string,
): Reward[] {
  const next: Reward[] = [];
  const habit = (code: string, title: string, xp: number) => {
    const key = code + ':' + date;
    if (!prior.some((r) => r.key === key)) next.push({ key, code, title, xp, date });
  };
  if (
    ['create', 'update', 'settle', 'import', 'confirm_recurring', 'pay_debt'].includes(action) &&
    (kind === 'transaction' || kind === 'purchase' || kind === 'recurring' || action === 'pay_debt')
  )
    habit('habit_record', 'Movimentação organizada', 5);
  if (action === 'contribute' || kind === 'contribution')
    habit('habit_contribute', 'Reserva registrada', 15);
  if (action === 'review_budget' || kind === 'budget')
    habit('habit_review_budget', 'Orçamento revisado', 10);
  if (action === 'review_investments' || kind === 'investment')
    habit('habit_review_investments', 'Carteira revisada', 10);
  for (const a of eligibleAchievements(items, [...prior, ...next]))
    next.push({ key: 'achievement:' + a.code, code: a.code, title: a.title, xp: a.xp, date });
  return next;
}
