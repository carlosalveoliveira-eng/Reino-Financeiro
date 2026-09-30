'use client';
import { useState } from 'react';
import {
  Upload,
  FileText,
  Check,
  AlertTriangle,
  Sparkles,
  Send,
  Target,
  CalendarDays,
  Download,
  ShieldCheck,
} from 'lucide-react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  type Entity,
  brl,
  money,
  simulateGoal,
  goalMonthly,
  today,
  addMonths,
  invoiceAmounts,
} from '../domain/finance';
import { parseImport, type ImportRow } from '../domain/import';
import { answerQuestion } from '../domain/assistant';
export function ImportPanel({
  items,
  mutate,
  busy,
}: {
  items: Entity[];
  mutate: (x: object) => Promise<boolean>;
  busy: boolean;
}) {
  const accounts = items.filter((x) => x.type === 'account'),
    [accountId, setAccountId] = useState(accounts[0]?.id || ''),
    [rows, setRows] = useState<ImportRow[]>([]),
    [selected, setSelected] = useState<Set<number>>(new Set()),
    [error, setError] = useState(''),
    [format, setFormat] = useState<'csv' | 'ofx'>('csv'),
    [filename, setFilename] = useState(''),
    [key, setKey] = useState(crypto.randomUUID());
  const duplicate = (r: ImportRow) =>
    items.some(
      (x) =>
        x.type === 'transaction' &&
        x.accountId === accountId &&
        x.date === r.date &&
        x.amount === r.amount &&
        x.kind === r.kind &&
        x.name === r.name,
    );
  async function load(file: File) {
    try {
      setError('');
      if (file.size > 500000) throw new Error('O arquivo deve ter até 500 KB.');
      const fmt = file.name.toLowerCase().endsWith('.ofx') ? 'ofx' : 'csv';
      const parsed = parseImport(await file.text(), fmt);
      setRows(parsed);
      setFormat(fmt);
      setFilename(file.name);
      setKey(crypto.randomUUID());
      setSelected(new Set(parsed.map((r, i) => i).filter((i) => !duplicate(parsed[i]))));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
    }
  }
  function sample() {
    const blob = new Blob(
      [
        'data;descricao;valor;categoria;id\n2026-09-01;Salário;3500,00;Salário;exemplo-1\n2026-09-02;Mercado;-150,90;Alimentação;exemplo-2\n',
      ],
      { type: 'text/csv;charset=utf-8' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo-extrato.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="notice">
        <ShieldCheck size={18} />
        <p>
          O arquivo é lido no seu dispositivo. Somente as movimentações selecionadas serão salvas na
          sua conta. Nunca envie senhas ou credenciais bancárias.
        </p>
      </div>
      <section className="panel tool-panel">
        <div className="panel-heading">
          <h2>Importar extrato CSV ou OFX</h2>
          <button className="secondary" onClick={sample}>
            <Download size={16} />
            Modelo CSV
          </button>
        </div>
        <div className="import-controls">
          <label className="field">
            Conta de destino
            <Select
              value={accountId || undefined}
              onValueChange={(v) => {
                setAccountId(v);
                setRows([]);
                setSelected(new Set());
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="upload-zone">
            <Upload size={25} />
            <strong>{filename || 'Selecione seu extrato'}</strong>
            <small>CSV com data, descricao e valor · OFX bancário · Até 200 movimentações</small>
            <input
              type="file"
              accept=".csv,.ofx,text/csv,application/x-ofx"
              disabled={!accountId || busy}
              onChange={(e) => {
                if (e.target.files?.[0]) void load(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </label>
        </div>
        {!accounts.length && (
          <p className="red tool-padding">Adicione uma conta antes de importar.</p>
        )}
        {error && (
          <p className="red tool-padding" role="alert">
            {error}
          </p>
        )}
        {rows.length > 0 && (
          <>
            <div className="import-summary">
              <span>
                <FileText size={18} />
                {rows.length} linhas encontradas · {selected.size} selecionadas
              </span>
              <button
                className="primary"
                disabled={busy || !selected.size}
                onClick={async () => {
                  if (
                    await mutate({
                      action: 'import',
                      key,
                      accountId,
                      format,
                      rows: rows.filter((r, i) => selected.has(i)),
                    })
                  ) {
                    setRows([]);
                    setFilename('');
                    setSelected(new Set());
                    setKey(crypto.randomUUID());
                  }
                }}
              >
                {busy ? 'Importando…' : 'Confirmar importação'}
              </button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead />
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Conferência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Checkbox
                        aria-label={'Importar ' + r.name}
                        checked={selected.has(i)}
                        onCheckedChange={(value) =>
                          setSelected((s) => {
                            const next = new Set(s);
                            if (value) next.add(i);
                            else next.delete(i);
                            setKey(crypto.randomUUID());
                            return next;
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>{r.date.split('-').reverse().join('/')}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className={r.kind === 'income' ? 'green' : ''}>
                      {r.kind === 'income' ? '+' : '−'} {brl(r.amount)}
                    </TableCell>
                    <TableCell>
                      {duplicate(r) ? (
                        <span className="duplicate">
                          <AlertTriangle size={14} />
                          Possível duplicata
                        </span>
                      ) : (
                        <span className="muted">Conferir</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="muted tool-padding">
              Importações repetidas com o mesmo identificador são descartadas. Linhas parecidas com
              registros existentes começam desmarcadas para você conferir.
            </p>
          </>
        )}
      </section>
    </>
  );
}
export function AssistantPanel({ items, month }: { items: Entity[]; month: string }) {
  const [question, setQuestion] = useState(''),
    [answer, setAnswer] = useState<{ answer: string; evidence: string } | null>(null);
  const examples = [
    'Quanto gastei com alimentação?',
    'Como está minha carteira?',
    'Qual é a projeção para 30 dias?',
    'Quanto falta para minha meta?',
  ];
  function ask(q: string) {
    setQuestion(q);
    setAnswer(answerQuestion(q, items, month));
  }
  return (
    <section className="panel guide-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PERGUNTAS CLARAS. NÚMEROS DOS SEUS REGISTROS.</p>
          <h2>
            <Sparkles size={20} />
            Seu guia financeiro
          </h2>
        </div>
        <span className="tag">Cálculos locais</span>
      </div>
      <p className="muted tool-padding">
        Consulte gastos, recorrências, metas e projeções. Este guia usa regras explicáveis; IA
        generativa ainda não está conectada.
      </p>
      <div className="question-chips">
        {examples.map((q) => (
          <button key={q} onClick={() => ask(q)}>
            {q}
          </button>
        ))}
      </div>
      <form
        className="question-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input
          aria-label="Sua pergunta sobre os registros"
          maxLength={500}
          required
          placeholder="Pergunte sobre seu dinheiro…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="primary">
          <Send size={17} />
          Consultar
        </button>
      </form>
      {answer && (
        <div className="guide-answer" aria-live="polite">
          <strong>Com base nos seus registros</strong>
          <p>{answer.answer}</p>
          <small>{answer.evidence}</small>
        </div>
      )}
    </section>
  );
}
export function GoalSimulator({ items }: { items: Entity[] }) {
  const goals = items.filter((x) => x.type === 'goal'),
    [selected, setSelected] = useState(goals[0]?.id || ''),
    [amount, setAmount] = useState('100,00');
  const goal = goals.find((x) => x.id === selected) || goals[0];
  let cents = 0;
  try {
    cents = money(amount);
  } catch {}
  const simulation = goal ? simulateGoal(goal, cents) : null;
  return (
    <section className="panel simulator-panel">
      <div className="panel-heading">
        <h2>
          <Target size={19} />
          Simule o ritmo da sua meta
        </h2>
        <span className="tag">Sem rendimentos</span>
      </div>
      {goal ? (
        <>
          <div className="simulator-controls">
            <label className="field">
              Meta
              <Select value={goal.id} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="field">
              Reserva mensal (R$)
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
          </div>
          <div className="simulation-result">
            <div>
              <span>Conclusão estimada</span>
              <strong>
                {simulation
                  ? simulation.months === 0
                    ? 'Meta concluída'
                    : simulation.months > 1200
                      ? 'Acima de 100 anos'
                      : simulation.date.split('-').reverse().join('/')
                  : 'Informe um valor maior que zero'}
              </strong>
              <small>{simulation ? `${simulation.months} meses no ritmo informado` : ''}</small>
            </div>
            <div>
              <span>Ritmo para o prazo cadastrado</span>
              <strong>{brl(goalMonthly(goal))}/mês</strong>
              <small>Restante: {brl(Math.max(0, goal.target! - goal.current!))}</small>
            </div>
          </div>
        </>
      ) : (
        <p className="muted tool-padding">
          Crie uma meta para comparar diferentes ritmos de reserva.
        </p>
      )}
    </section>
  );
}
export function ContributionHistory({ items }: { items: Entity[] }) {
  const records = items
    .filter((x) => x.type === 'contribution')
    .sort((a, b) => b.date!.localeCompare(a.date!));
  if (!records.length) return null;
  return (
    <section className="panel recent">
      <div className="panel-heading">
        <h2>Histórico de reservas</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Meta</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ação</TableHead>
            <TableHead>Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                {items.find((g) => g.id === r.parentId)?.name || 'Meta anterior'}
              </TableCell>
              <TableCell>{r.date?.split('-').reverse().join('/')}</TableCell>
              <TableCell>{r.kind === 'withdrawal' ? 'Retirada' : 'Reserva'}</TableCell>
              <TableCell className={r.kind === 'withdrawal' ? 'muted' : 'green'}>
                {brl(r.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
export function RecurringConfirmations({
  items,
  mutate,
  busy,
}: {
  items: Entity[];
  mutate: (x: object) => Promise<boolean>;
  busy: boolean;
}) {
  const date = today();
  const occurrences = items
    .filter((x) => x.type === 'recurring')
    .flatMap((r) => {
      const diff =
        (Number(date.slice(0, 4)) - Number(r.date!.slice(0, 4))) * 12 +
        Number(date.slice(5, 7)) -
        Number(r.date!.slice(5, 7));
      return [Math.max(0, diff - 1), Math.max(0, diff)]
        .filter((n, i, all) => all.indexOf(n) === i)
        .map((n) => ({ r, date: addMonths(r.date!, n) }));
    })
    .filter(
      (o) =>
        o.date <= date &&
        (!o.r.endDate || o.date <= o.r.endDate) &&
        !items.some(
          (x) =>
            x.type === 'transaction' &&
            x.date === o.date &&
            (x.recurringId === o.r.id ||
              (x.name === o.r.name &&
                x.amount === o.r.amount &&
                x.accountId === o.r.accountId &&
                x.kind === o.r.kind)),
        ),
    );
  return (
    <section className="panel recent">
      <div className="panel-heading">
        <h2>Ocorrências para conferir</h2>
        <span className="tag">Últimos 2 meses</span>
      </div>
      {occurrences.length ? (
        <div className="occurrence-list">
          {occurrences.map((o) => (
            <div key={o.r.id + o.date}>
              <div>
                <strong>{o.r.name}</strong>
                <small>
                  {o.date.split('-').reverse().join('/')} · {brl(o.r.amount)}
                </small>
              </div>
              <button
                className="secondary"
                disabled={busy}
                onClick={() => mutate({ action: 'confirm_recurring', id: o.r.id, date: o.date })}
              >
                <Check size={16} />
                Confirmar ocorrência
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted tool-padding">Todas as ocorrências recentes estão conferidas.</p>
      )}
    </section>
  );
}
export function AlertsPanel({
  items,
  onAction,
}: {
  items: Entity[];
  onAction: (action: string) => void;
}) {
  const date = today(),
    end = new Date(date + 'T12:00:00Z');
  end.setUTCDate(end.getUTCDate() + 7);
  const until = end.toISOString().slice(0, 10);
  const alerts = [
    ...invoiceAmounts(items)
      .filter((i) => i.date! <= until)
      .map((i) => ({
        id: i.id,
        title: i.date! < date ? 'Fatura em aberto' : 'Fatura nos próximos 7 dias',
        body: `${i.name} · ${brl(i.amount)} · ${i.date!.split('-').reverse().join('/')}`,
        action: 'cards',
      })),
    ...items
      .filter((x) => x.type === 'debt' && x.amount! > 0 && x.deadline! <= until)
      .map((x) => ({
        id: x.id,
        title: 'Prazo de dívida para revisar',
        body: `${x.name} · ${brl(x.amount)} · ${x.deadline!.split('-').reverse().join('/')}`,
        action: 'debts',
      })),
    ...items
      .filter((x) => x.type === 'transaction' && x.status === 'planned' && x.date! <= until)
      .map((x) => ({
        id: x.id,
        title: 'Movimentação prevista',
        body: `${x.name} · ${brl(x.amount)} · ${x.date!.split('-').reverse().join('/')}`,
        action: 'transactions',
      })),
  ];
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          <CalendarDays size={20} />
          Agenda financeira
        </h2>
        <span className="tag">Próximos 7 dias</span>
      </div>
      {alerts.length ? (
        <div className="alert-list">
          {alerts.map((a) => (
            <button key={a.id} onClick={() => onAction(a.action)}>
              <span className="alert-icon">
                <CalendarDays size={20} />
              </span>
              <span>
                <strong>{a.title}</strong>
                <small>{a.body}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="muted tool-padding">Nenhum compromisso registrado para os próximos 7 dias.</p>
      )}
      <p className="muted tool-padding">
        Lembretes dentro do aplicativo. Avisos por e-mail e push ainda não estão conectados.
      </p>
    </section>
  );
}
