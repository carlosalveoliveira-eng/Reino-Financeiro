import { brl, totals, forecast, insights, goalMonthly, type Entity } from './finance';
export function answerQuestion(question: string, items: Entity[], month: string) {
  const q = question
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
    t = totals(items, month);
  const evidence = `Período ${month}. Dados registrados por você.`;
  if (/meta|objetivo|quando/.test(q)) {
    const goals = items.filter((x) => x.type === 'goal');
    const g =
      goals.find((x) =>
        q.includes(
          x
            .name!.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase(),
        ),
      ) || goals[0];
    return {
      answer: g
        ? `Para “${g.name}”, faltam ${brl(Math.max(0, g.target! - g.current!))}. A reserva mensal estimada até o prazo é ${brl(goalMonthly(g))}, sem considerar rendimentos.`
        : 'Crie uma meta com valor e prazo para calcular o ritmo necessário.',
      evidence,
    };
  }
  if (/comida|alimenta|mercado/.test(q)) {
    const amount = items
      .filter(
        (x) =>
          x.category === 'Alimentação' &&
          ((x.type === 'transaction' &&
            x.kind === 'expense' &&
            x.status === 'posted' &&
            x.date?.startsWith(month)) ||
            (x.type === 'purchase' && x.month === month)),
      )
      .reduce((s, x) => s + x.amount!, 0);
    return { answer: `Você registrou ${brl(amount)} em Alimentação neste mês.`, evidence };
  }
  if (/invest|carteira/.test(q))
    return {
      answer: `As posições registradas somam ${brl(t.investments)}. Os valores são manuais. Revise reserva, obrigações e objetivos antes de assumir novos compromissos.`,
      evidence,
    };
  if (/recorrent|assinatura/.test(q)) {
    const rs = items.filter((x) => x.type === 'recurring');
    return {
      answer: rs.length
        ? rs
            .map(
              (x) =>
                `${x.name}: ${brl(x.amount)} por mês (${x.kind === 'income' ? 'receita' : 'despesa'}).`,
            )
            .join('\n')
        : 'Nenhuma recorrência cadastrada.',
      evidence,
    };
  }
  if (/proje|futuro|30 dias|posso gastar/.test(q)) {
    const f = forecast(items, 30);
    return {
      answer: `O saldo projetado em 30 dias é ${brl(f.at(-1)!.balance)}. O menor saldo estimado é ${brl(Math.min(...f.map((p) => p.balance)))}. Isso não define um limite seguro para gastar: despesas não registradas não entram na projeção.`,
      evidence,
    };
  }
  if (/gasto|despesa/.test(q))
    return {
      answer: `Despesas registradas neste mês: ${brl(t.expenses)}. Inclui compras de cartão no mês da fatura, sem contar novamente pagamentos da fatura.`,
      evidence,
    };
  if (/receita|ganhei|salario/.test(q))
    return {
      answer: `Receitas confirmadas: ${brl(t.income)}. Resultado do mês: ${brl(t.income - t.expenses)}.`,
      evidence,
    };
  return {
    answer: insights(items, month).join('\n'),
    evidence: 'Assistente local por regras e cálculos. Não usa IA generativa nem recomenda ativos.',
  };
}
