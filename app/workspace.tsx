'use client';
import { formCommand } from '../domain/form-command';
import { portfolioDemo } from '../services/portfolio-demo';
import { CardsPanel } from '../components/cards-panel';
import { RecurringPanel } from '../components/recurring-panel';
import { Empty } from '../components/empty-state';
import { useLocalDate } from '../hooks/use-local-date';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  Crown,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  ChartNoAxesCombined,
  CreditCard,
  Landmark,
  BookOpen,
  Settings,
  Plus,
  Download,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  Flame,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Check,
  Coins,
  CalendarDays,
  Repeat,
  Trash2,
  Pencil,
  Trophy,
  Bell,
  Upload,
  MessageCircle,
  Minus,
  Scale,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import JourneyPanel from './journey-panel';
import { Companion, World, companions } from './companion';
import { progress, type Reward } from '../domain/journey';
import {
  ImportPanel,
  AssistantPanel,
  GoalSimulator,
  ContributionHistory,
  AlertsPanel,
} from './financial-tools';
import CelebrationToast, { playChime, type Celebration } from './celebration';
import { Toaster, toast } from 'sonner';
import Chart from '../components/lazy-finance-chart';
import {
  type Entity,
  brl,
  money,
  today,
  totals,
  txAll,
  accountBalance,
  isCashInflow,
  goalMonthly,
  forecast,
  insights,
} from '../domain/finance';
const navigation = [
  ['dashboard', 'Visão geral', LayoutDashboard],
  ['transactions', 'Movimentações', ArrowLeftRight],
  ['accounts', 'Minhas contas', Wallet],
  ['cards', 'Cartões', CreditCard],
  ['budgets', 'Orçamentos', ChartNoAxesCombined],
  ['goals', 'Metas', Target],
  ['investments', 'Investimentos', Landmark],
  ['debts', 'Dívidas', Coins],
  ['forecast', 'Projeção de saldo', TrendingUp],
  ['recurring', 'Recorrências', Repeat],
  ['reports', 'Relatórios', BookOpen],
  ['journey', 'Minha jornada', Trophy],
  ['import', 'Importar extrato', Upload],
  ['assistant', 'Guia financeiro', MessageCircle],
  ['alerts', 'Agenda e lembretes', Bell],
] as const;
const categories = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Lazer',
  'Assinaturas',
  'Educação',
  'Compras',
  'Salário',
  'Investimentos',
  'Dívidas',
  'Outros',
];
const titles: Record<string, string> = {
  dashboard: 'Seu reino, em evolução.',
  transactions: 'Movimentações',
  accounts: 'Minhas contas',
  cards: 'Cartões de crédito',
  budgets: 'Orçamentos',
  goals: 'Construa seus próximos passos.',
  investments: 'Investimentos',
  debts: 'Dívidas',
  forecast: 'Olhe para o próximo capítulo.',
  recurring: 'Recorrências',
  reports: 'Seu dinheiro em perspectiva.',
  settings: 'Seus dados, seu controle.',
  journey: 'Seu progresso merece ser visto.',
  import: 'Traga sua história financeira.',
  assistant: 'Entenda. Planeje. Avance.',
  alerts: 'Um passo à frente dos compromissos.',
};
function Choose({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="select-control">
        <SelectValue placeholder="Selecione" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export default function Workspace({ name, demo = false }: { name: string; demo?: boolean }) {
  const [rewards, setRewards] = useState<Reward[]>([]),
    [celebration, setCelebration] = useState<Celebration | null>(null),
    [sound, setSound] = useState(false),
    [energy, setEnergy] = useState(true),
    [tablePage, setTablePage] = useState(1),
    [weeklyTarget, setWeeklyTarget] = useState('100,00'),
    [reminderDay, setReminderDay] = useState('0');
  const localDate = useLocalDate();
  const pendingKeys = useRef(new Map<string, string>());
  const closeCelebration = useCallback(() => setCelebration(null), []);
  const [items, setItems] = useState<Entity[]>([]),
    [view, setView] = useState('dashboard'),
    [month, setMonth] = useState(today().slice(0, 7)),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [modal, setModal] = useState(''),
    [form, setForm] = useState<Record<string, string>>({}),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [days, setDays] = useState('30'),
    [confirm, setConfirm] = useState<Entity | null>(null);
  const accounts = items.filter((x) => x.type === 'account'),
    goals = items.filter((x) => x.type === 'goal'),
    cards = items.filter((x) => x.type === 'card');
  const summary = useMemo(() => totals(items, month), [items, month]);
  const transactions = txAll(items);
  const journey = progress(rewards, items);
  const { xp, level } = journey;
  const financialItemCount = items.filter(
    (x) => !['preferences', 'metadata'].includes(x.type),
  ).length;
  const analysis = insights(items, month);
  const points = forecast(items, Number(days));
  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value, operationKey: crypto.randomUUID() }));
  const load = useCallback(async () => {
    if (demo) {
      const snapshot = portfolioDemo(today());
      setItems(snapshot.items);
      setRewards(snapshot.rewards);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/finance', { cache: 'no-store' });
      const j = (await r.json()) as { error?: string; items: Entity[]; rewards: Reward[] };
      if (!r.ok) throw new Error(j.error);
      setItems(j.items);
      setRewards(j.rewards || []);
      const prefs = j.items.find((x) => x.type === 'preferences');
      if (prefs) {
        setWeeklyTarget(((prefs.amount || 0) / 100).toFixed(2));
        setReminderDay(String(prefs.due || 0));
      }
      if (j.items.length) {
        const init = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync_journey', key: crypto.randomUUID() }),
        });
        if (init.ok) {
          const snapshot = (await init.json()) as { items: Entity[]; rewards: Reward[] };
          setItems(snapshot.items);
          setRewards(snapshot.rewards);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [demo]);
  useEffect(() => {
    load();
    setSound(localStorage.getItem('reino-sound') === 'true');
    setEnergy(localStorage.getItem('reino-energy') !== 'false');
    if (!demo && 'serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, [demo, load]);
  useEffect(() => {
    setTablePage(1);
  }, [month, search, filter, view]);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: {
              name: string;
              description: string;
              inputSchema: object;
              annotations: object;
              execute: () => object;
            },
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (demo || !context?.registerTool) return;
    const controller = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: 'read_financial_overview',
          description:
            'Leia o resumo financeiro calculado a partir dos registros visíveis do mês selecionado.',
          inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: () => ({ month, ...summary }),
        },
        { signal: controller.signal },
      ),
    ).catch(() => {});
    return () => controller.abort();
  }, [summary, month, demo]);
  async function mutate(payload: object) {
    if (demo) {
      toast.info(
        'Passeio demonstrativo: edições desativadas. Explore as telas e o simulador de metas.',
      );
      return false;
    }
    setBusy(true);
    const signature = JSON.stringify(payload);
    const key =
      'key' in payload && typeof payload.key === 'string'
        ? payload.key
        : pendingKeys.current.get(signature) || crypto.randomUUID();
    pendingKeys.current.set(signature, key);
    try {
      const r = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, key }),
      });
      const j = (await r.json()) as { error?: string; items: Entity[]; rewards: Reward[] };
      if (!r.ok) throw new Error(j.error);
      const gained = (j.rewards || []).filter((x) => !rewards.some((old) => old.key === x.key));
      const next = progress(j.rewards || [], j.items);
      setItems(j.items);
      setRewards(j.rewards || []);
      pendingKeys.current.delete(signature);
      if (gained.length) {
        const points = gained.reduce((sum, r) => sum + r.xp, 0),
          achievement = gained.find((r) => !r.code.startsWith('habit_'));
        setCelebration({
          title: achievement?.title || gained[0].title,
          xp: points,
          levelUp: next.level > level,
          index: 'action' in payload && payload.action === 'contribute' ? 3 : 4,
        });
        if (sound) playChime();
      } else toast.success('Registro salvo. Seu reino está atualizado.');
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao salvar.');
      return false;
    } finally {
      setBusy(false);
    }
  }
  function missionAction(action: string) {
    if (action === 'transaction') open('transaction');
    else if (action === 'contribute') {
      if (goals.length) open('contribute', { id: goals[0].id });
      else {
        setView('goals');
        open('goal');
      }
    } else if (action === 'review_budget') {
      setView('budgets');
      setMonth(today().slice(0, 7));
      if (!items.some((x) => x.type === 'budget' && x.month === today().slice(0, 7)))
        open('budget');
    } else if (action === 'review_investments') {
      setView('investments');
      if (!items.some((x) => x.type === 'investment')) open('investment');
    } else setView(action);
  }
  function open(type: string, preset: Record<string, string> = {}) {
    setModal(type);
    setForm({
      operationKey: crypto.randomUUID(),
      date: today(),
      deadline: today(),
      month,
      kind: 'expense',
      category: 'Alimentação',
      status: 'posted',
      accountId: accounts[0]?.id || '',
      cardId: cards[0]?.id || '',
      installments: '1',
      closing: '25',
      due: '5',
      dueRule: 'fixed',
      holidays: '',
      invoiceMonth: '',
      quantity: '1',
      fee: '0',
      tradeKind: 'buy',
      rate: '',
      ...preset,
    });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (await mutate(formCommand(modal, form))) setModal('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Confira os valores.');
    }
  }
  function edit(row: Entity) {
    const preset: Record<string, string> = { editingId: row.id };
    for (const [k, v] of Object.entries(row)) if (v !== undefined) preset[k] = String(v);
    for (const k of ['amount', 'initial', 'target', 'current', 'limit', 'cost', 'value'] as const)
      if (row[k] !== undefined) preset[k] = (row[k]! / 100).toFixed(2);
    open(row.type, preset);
  }
  function exportData() {
    if (demo) {
      toast.info('Exportação desativada na demonstração.');
      return;
    }
    const blob = new Blob(
      [
        JSON.stringify(
          { version: 1, currency: 'BRL', exportedAt: new Date().toISOString(), items },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reino-financeiro-' + today() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  const input = (key: string, label: string, type = 'text', placeholder = '') => (
    <label className="field" key={key}>
      {label}
      <input
        required={
          !['rate', 'initial', 'current', 'holidays', 'invoiceMonth', 'endDate'].includes(key)
        }
        type={type}
        step={type === 'number' ? '1' : undefined}
        value={form[key] || ''}
        placeholder={placeholder}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );
  const moneyField = (key: string, label: string) => input(key, label, 'text', '0,00');
  const select = (key: string, label: string, options: { value: string; label: string }[]) => (
    <label className="field" key={key}>
      {label}
      <Choose
        value={form[key] || ''}
        onChange={(v) => update(key, v)}
        options={options}
        label={label}
      />
    </label>
  );
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name! })),
    cardOptions = cards.map((a) => ({ value: a.id, label: a.name! }));

  function GoalCard({ g }: { g: Entity }) {
    const pct = Math.min(100, Math.round((g.current! * 100) / g.target!));
    return (
      <article className="goal-card">
        <div className="between">
          <span className="goal-icon">
            <Target size={20} />
          </span>
          <span className="goal-percent">{pct}%</span>
        </div>
        <h3>{g.name}</h3>
        <p>
          <strong>{brl(g.current)}</strong>
          <span className="muted"> / {brl(g.target)}</span>
        </p>
        <Progress aria-label={'Progresso da meta ' + g.name} value={pct} />
        <div className="between goal-bottom">
          <span className="muted">
            {pct === 100
              ? 'Meta alcançada'
              : `${brl(goalMonthly(g))}/mês até ${g.deadline?.split('-').reverse().join('/')}`}
          </span>
          <button className="icon-button" aria-label={'Editar ' + g.name} onClick={() => edit(g)}>
            <Pencil size={15} />
          </button>
          <button
            className="icon-button"
            aria-label={'Reservar para ' + g.name}
            onClick={() => open('contribute', { id: g.id })}
          >
            <Plus size={18} />
          </button>
          <button
            className="icon-button"
            aria-label={'Retirar da reserva ' + g.name}
            onClick={() => open('withdraw_contribution', { id: g.id })}
          >
            <Minus size={16} />
          </button>
        </div>
      </article>
    );
  }
  function TransactionTable({ compact = false }: { compact?: boolean }) {
    const rows = transactions
      .filter(
        (t) =>
          t.date?.startsWith(month) &&
          (filter === 'all' || t.kind === filter) &&
          t.name?.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => b.date!.localeCompare(a.date!));
    return !rows.length ? (
      <Empty
        title="Nenhuma movimentação neste período"
        body="Receitas, despesas e transferências aparecem aqui."
        action="Registrar movimentação"
        onClick={() => open('transaction')}
      />
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            {!compact && <TableHead>Conta</TableHead>}
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            {!compact && <TableHead>Status</TableHead>}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(compact ? 0 : (tablePage - 1) * 25, compact ? 5 : tablePage * 25).map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <div className="transaction-label">
                  <span className={'transaction-icon ' + (isCashInflow(t.kind) ? 'income' : '')}>
                    {isCashInflow(t.kind) ? (
                      <ArrowDownLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </span>
                  <div>
                    <strong>{t.name}</strong>
                    <small>{t.category}</small>
                  </div>
                </div>
              </TableCell>
              {!compact && (
                <TableCell>{accounts.find((a) => a.id === t.accountId)?.name}</TableCell>
              )}
              <TableCell className="muted">{t.date?.split('-').reverse().join('/')}</TableCell>
              <TableCell className={'text-right ' + (isCashInflow(t.kind) ? 'green' : '')}>
                {isCashInflow(t.kind) ? '+' : t.kind === 'transfer' ? '' : '−'} {brl(t.amount)}
              </TableCell>
              {!compact && (
                <TableCell>
                  {t.status === 'planned' ? (
                    <button
                      className="small-button"
                      disabled={busy}
                      onClick={() => mutate({ action: 'settle', id: t.id })}
                    >
                      Confirmar
                    </button>
                  ) : (
                    <span className="muted">Confirmado</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                {!compact && (
                  <>
                    <button
                      className="icon-button"
                      aria-label={'Editar ' + t.name}
                      onClick={() => edit(t)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={'Excluir ' + t.name}
                      onClick={() => setConfirm(t)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }
  return (
    <SidebarProvider className={energy ? 'energy-on' : 'energy-muted'}>
      <Toaster theme="dark" richColors />
      <CelebrationToast event={celebration} onClose={closeCelebration} />
      <Sidebar className="app-sidebar">
        <SidebarHeader>
          <a className="brand" href="/" aria-label="Reino Financeiro">
            <span className="brand-mark">
              <Crown size={23} />
            </span>
            <span>
              REINO<span className="brand-sub">FINANCEIRO</span>
            </span>
          </a>
        </SidebarHeader>
        <SidebarContent>
          <div className="nav-label">SEU FINANCEIRO</div>
          <SidebarMenu>
            {navigation.map(([id, label, Icon]) => (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  aria-label={label}
                  isActive={view === id}
                  onClick={() => {
                    setView(id);
                    setSearch('');
                    setFilter('all');
                    setTablePage(1);
                  }}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {id === 'goals' && goals.length > 0 && (
                    <small className="count">{goals.length}</small>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="journey-card">
            <div className="between">
              <Flame size={17} />
              <span>Nível {level}</span>
            </div>
            <strong>
              {level < 3
                ? 'Aprendiz do reino'
                : level < 6
                  ? 'Construtor financeiro'
                  : 'Guardião do reino'}
            </strong>
            <Progress
              aria-label="Progresso para o próximo nível"
              value={(journey.levelProgress * 100) / 150}
            />
            <small>{journey.levelProgress} / 150 XP para o próximo nível</small>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenuButton isActive={view === 'settings'} onClick={() => setView('settings')}>
            <Settings size={18} />
            Configurações
          </SidebarMenuButton>
          <div className="profile">
            <span>{name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{name}</strong>
              <small>Meu reino pessoal</small>
            </div>
            <ShieldCheck size={17} />
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <SidebarTrigger />
            <span>
              Meu reino <ChevronRight size={14} />{' '}
              {navigation.find((n) => n[0] === view)?.[1] || 'Configurações'}
            </span>
          </div>
          <div className="topbar-right">
            <span className="private-label">
              <ShieldCheck size={15} /> {demo ? 'Demonstração pública' : 'Espaço privado'}
            </span>
            <button className="icon-button" aria-label="Atualizar dados" onClick={load}>
              <RefreshCw size={17} />
            </button>
          </div>
        </header>
        <div className="page">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {view === 'dashboard' ? 'CADA PASSO CONSTRÓI O SEU FUTURO' : 'REINO FINANCEIRO'}
              </p>
              <h1>{titles[view]}</h1>
              <p className="muted">
                {view === 'dashboard'
                  ? `Olá, ${name.split(' ')[0]}. Veja como estão suas finanças.`
                  : view === 'forecast'
                    ? 'Uma estimativa com base nos compromissos registrados.'
                    : view === 'goals'
                      ? 'Transforme planos em conquistas reais.'
                      : ''}
              </p>
            </div>
            <div className="heading-actions">
              {['dashboard', 'transactions', 'budgets', 'reports', 'assistant', 'cards'].includes(
                view,
              ) && (
                <label className="month-picker">
                  <CalendarDays size={16} />
                  <input
                    type="month"
                    aria-label="Mês selecionado"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  />
                </label>
              )}
              {!['settings', 'journey', 'import', 'assistant', 'alerts'].includes(view) && (
                <button
                  className="primary"
                  onClick={() =>
                    open(
                      (
                        {
                          accounts: 'account',
                          cards: 'card',
                          budgets: 'budget',
                          goals: 'goal',
                          investments: 'investment',
                          debts: 'debt',
                          recurring: 'recurring',
                        } as Record<string, string>
                      )[view] || 'transaction',
                    )
                  }
                >
                  <Plus size={17} />
                  {view === 'goals'
                    ? 'Nova meta'
                    : view === 'accounts'
                      ? 'Nova conta'
                      : view === 'cards'
                        ? 'Novo cartão'
                        : view === 'budgets'
                          ? 'Novo orçamento'
                          : 'Novo registro'}
                </button>
              )}
            </div>
          </div>
          {error ? (
            <div className="error-box" role="alert">
              <strong>{error}</strong>
              <button className="small-button" onClick={load}>
                Tentar novamente
              </button>
            </div>
          ) : loading ? (
            <div className="loading">Carregando seu reino…</div>
          ) : (
            <>
              {demo && (
                <div className="notice demo-notice" role="status">
                  <ShieldCheck size={20} />
                  <p>
                    <strong>Demonstração · dados 100% fictícios</strong>
                    <br />
                    Explore telas, filtros e simulações. Edições desativadas; nenhum acesso aos
                    registros pessoais.
                  </p>
                  <a className="secondary" href="/apresentacao">
                    Sobre o projeto
                  </a>
                </div>
              )}
              {!demo && items.some((x) => x.type === 'metadata' && x.name === 'demo') && (
                <div className="notice">
                  <Sparkles size={18} />
                  <p>
                    Dados fictícios de demonstração. Para começar com seus dados, apague os
                    registros em Configurações.
                  </p>
                  <button className="text-button" onClick={() => setView('settings')}>
                    Configurações
                  </button>
                </div>
              )}
              {!financialItemCount && view === 'dashboard' && (
                <div className="onboarding">
                  <div>
                    <strong>Seu reino começa com o primeiro registro.</strong>
                    <p>
                      Adicione uma conta e seu saldo inicial, ou explore com exemplos fictícios.
                    </p>
                  </div>
                  <div className="heading-actions">
                    <a className="secondary" href="/demo">
                      Explorar demonstração
                    </a>
                    <button className="primary" onClick={() => open('account')}>
                      <Plus size={16} />
                      Adicionar conta
                    </button>
                  </div>
                </div>
              )}
              {view === 'dashboard' && (
                <>
                  <section className="metrics">
                    <article className="metric">
                      <span>
                        Saldo em contas <Wallet size={17} />
                      </span>
                      <strong>{brl(summary.balance)}</strong>
                      <small>Disponível nos registros confirmados</small>
                    </article>
                    <article className="metric">
                      <span>
                        Receitas do mês <ArrowDownLeft size={17} />
                      </span>
                      <strong className="green">{brl(summary.income)}</strong>
                      <small>Entradas confirmadas</small>
                    </article>
                    <article className="metric">
                      <span>
                        Despesas do mês <ArrowUpRight size={17} />
                      </span>
                      <strong>{brl(summary.expenses)}</strong>
                      <small>Inclui parcelas da fatura do mês</small>
                    </article>
                    <article className="metric">
                      <span>
                        Patrimônio líquido <Landmark size={17} />
                      </span>
                      <strong>{brl(summary.netWorth)}</strong>
                      <small>Contas + investimentos − obrigações</small>
                    </article>
                  </section>
                  <div className="dashboard-grid">
                    <section className="panel kingdom-panel">
                      <div className="panel-heading">
                        <div>
                          <p className="eyebrow gold">SEU REINO FINANCEIRO</p>
                          <h2>{journey.stageName}</h2>
                        </div>
                        <span className="level-badge">
                          <Crown size={15} /> NÍVEL {level}
                        </span>
                      </div>
                      <div className="kingdom-art">
                        <World stage={journey.stage} />
                        <div className="world-companions" aria-hidden="true">
                          <Companion
                            index={journey.stage === 0 ? 4 : journey.stage === 1 ? 3 : 0}
                            mood={celebration ? 'happy' : 'idle'}
                            small
                          />
                        </div>
                        <div className="art-gradient" />
                        <div className="kingdom-caption">
                          <span className="gold">✦</span>
                          <div>
                            <strong>{journey.achievements.length} conquistas desbloqueadas</strong>
                            <small>{journey.distinct} dias de cuidado com suas finanças</small>
                          </div>
                          <button onClick={() => setView('journey')} className="secondary">
                            Minha jornada
                          </button>
                        </div>
                      </div>
                      <div className="kingdom-footer">
                        <span>
                          <ShieldCheck size={18} /> Progresso ligado aos seus registros
                        </span>
                        <span>{xp} XP acumulados</span>
                      </div>
                      <div className="world-stage-track">
                        {['Acampamento', 'Vila', 'Reino'].map((stage, i) => (
                          <span className={journey.stage >= i ? 'unlocked' : ''} key={stage}>
                            {journey.stage >= i ? <Check size={14} /> : <ShieldCheck size={14} />}{' '}
                            {stage}
                          </span>
                        ))}
                      </div>
                    </section>
                    <section className="panel insight-panel">
                      <div className="panel-heading">
                        <h2>
                          <Sparkles size={18} className="gold" /> Um olhar sobre seu dinheiro
                        </h2>
                        <span className="tag">Insights</span>
                      </div>
                      {analysis.slice(0, 3).map((s, i) => (
                        <div className="insight" key={s}>
                          <span className="insight-number">0{i + 1}</span>
                          <p>{s}</p>
                        </div>
                      ))}
                      <div className="insight-note">
                        <ShieldCheck size={16} />
                        <span>Análises calculadas a partir dos seus registros.</span>
                      </div>
                    </section>
                  </div>
                  <JourneyPanel
                    items={items}
                    rewards={rewards}
                    onAction={missionAction}
                    busy={busy}
                    compact
                  />
                  <div className="companion-message">
                    <Companion
                      index={journey.todayDone ? 3 : 0}
                      mood={journey.todayDone ? 'happy' : 'thinking'}
                      small
                    />
                    <div>
                      <strong>{companions[journey.todayDone ? 3 : 0].name}</strong>
                      <p>
                        {journey.todayDone
                          ? 'A obra avançou hoje. Seu próximo passo pode esperar o momento certo.'
                          : 'Escolha um passo possível. Organização começa com clareza, não com pressa.'}
                      </p>
                    </div>
                    <button className="text-button" onClick={() => setView('journey')}>
                      Ver jornada
                    </button>
                  </div>
                  <div className="dashboard-lower">
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Projeção de saldo</h2>
                        <button className="text-button" onClick={() => setView('forecast')}>
                          Próximos 30 dias <ChevronRight size={15} />
                        </button>
                      </div>
                      <Chart data={forecast(items, 30)} />
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Metas em construção</h2>
                        <button className="text-button" onClick={() => setView('goals')}>
                          Ver todas <ChevronRight size={15} />
                        </button>
                      </div>
                      {goals.length ? (
                        <div className="mini-goals">
                          {goals.slice(0, 2).map((g) => (
                            <GoalCard key={g.id} g={g} />
                          ))}
                        </div>
                      ) : (
                        <Empty
                          title="Dê um destino ao seu dinheiro"
                          body="Crie sua primeira meta financeira."
                          action="Criar meta"
                          onClick={() => open('goal')}
                        />
                      )}
                    </section>
                  </div>
                  <section className="panel recent">
                    <div className="panel-heading">
                      <h2>Últimas movimentações</h2>
                      <button className="text-button" onClick={() => setView('transactions')}>
                        Ver todas <ChevronRight size={15} />
                      </button>
                    </div>
                    <TransactionTable compact />
                  </section>
                </>
              )}
              {view === 'transactions' && (
                <section className="panel">
                  <div className="toolbar">
                    <label className="search">
                      <Search size={17} />
                      <input
                        aria-label="Buscar descrição"
                        placeholder="Buscar descrição"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <Choose
                      value={filter}
                      onChange={setFilter}
                      label="Tipo de movimentação"
                      options={[
                        { value: 'all', label: 'Todos os tipos' },
                        { value: 'income', label: 'Receitas' },
                        { value: 'expense', label: 'Despesas' },
                        { value: 'transfer', label: 'Transferências' },
                        { value: 'card_payment', label: 'Pagamentos de cartão' },
                      ]}
                    />
                    <button className="secondary" onClick={exportData}>
                      <Download size={16} />
                      Exportar
                    </button>
                  </div>
                  <TransactionTable />
                  <Pagination className="table-pagination">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setTablePage((p) => Math.max(1, p - 1))}
                          aria-disabled={tablePage === 1}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <span>Página {tablePage}</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setTablePage((p) =>
                              Math.min(
                                p + 1,
                                Math.max(
                                  1,
                                  Math.ceil(
                                    transactions.filter(
                                      (t) =>
                                        t.date?.startsWith(month) &&
                                        (filter === 'all' || t.kind === filter) &&
                                        t.name?.toLowerCase().includes(search.toLowerCase()),
                                    ).length / 25,
                                  ),
                                ),
                              ),
                            )
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </section>
              )}
              {view === 'accounts' && (
                <div className="card-grid">
                  {accounts.map((a) => (
                    <article className="panel account-card" key={a.id}>
                      <div className="between">
                        <span className="goal-icon">
                          <Wallet size={22} />
                        </span>
                        <button
                          className="icon-button"
                          aria-label={'Editar ' + a.name}
                          onClick={() => edit(a)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={'Excluir ' + a.name}
                          onClick={() => setConfirm(a)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h2>{a.name}</h2>
                      <span className="muted">Saldo confirmado · BRL</span>
                      <strong className="large-value">
                        {brl(accountBalance(a, transactions))}
                      </strong>
                      <p className="muted">Saldo inicial: {brl(a.initial)}</p>
                      <button
                        className="secondary"
                        onClick={() => open('transaction', { accountId: a.id })}
                      >
                        Registrar movimentação
                      </button>
                      <button
                        className="text-button"
                        onClick={() =>
                          open('reconcile', {
                            id: a.id,
                            balance: (accountBalance(a, transactions) / 100).toFixed(2),
                          })
                        }
                      >
                        <Scale size={15} />
                        Conferir saldo
                      </button>
                    </article>
                  ))}
                  {!accounts.length && (
                    <Empty
                      title="Adicione sua primeira conta"
                      body="Informe o saldo atual para começar a organizar seu dinheiro."
                      action="Nova conta"
                      onClick={() => open('account')}
                    />
                  )}
                </div>
              )}
              {view === 'goals' && (
                <>
                  <div className="notice">
                    <ShieldCheck size={18} />
                    <p>
                      O valor reservado representa uma parte do dinheiro que você já possui.
                      Reservar para uma meta não altera o saldo das contas.
                    </p>
                  </div>
                  <div className="card-grid">
                    {goals.map((g) => (
                      <GoalCard key={g.id} g={g} />
                    ))}
                    {!goals.length && (
                      <Empty
                        title="Qual é seu próximo objetivo?"
                        body="Uma reserva, uma viagem ou uma conquista que importa para você."
                        action="Nova meta"
                        onClick={() => open('goal')}
                      />
                    )}
                  </div>
                  <GoalSimulator items={items} />
                  <ContributionHistory items={items} />
                </>
              )}
              {view === 'budgets' && (
                <>
                  <button
                    className="secondary review-button"
                    disabled={busy}
                    onClick={() => mutate({ action: 'review_budget', month })}
                  >
                    <Check size={16} />
                    Orçamento revisado hoje
                  </button>
                  <div className="card-grid">
                    {items
                      .filter((b) => b.type === 'budget' && b.month === month)
                      .map((b) => {
                        const spent = items
                          .filter(
                            (x) =>
                              ((x.type === 'transaction' &&
                                x.kind === 'expense' &&
                                x.status === 'posted' &&
                                x.date?.startsWith(month)) ||
                                (x.type === 'purchase' && x.month === month)) &&
                              x.category === b.category,
                          )
                          .reduce((s, x) => s + x.amount!, 0);
                        return (
                          <article className="panel budget-card" key={b.id}>
                            <div className="between">
                              <h2>{b.category}</h2>
                              <button
                                className="icon-button"
                                aria-label={'Editar orçamento ' + b.category}
                                onClick={() => edit(b)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={'Excluir orçamento ' + b.category}
                                onClick={() => setConfirm(b)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <strong className="large-value">
                              {brl(spent)} <small className="muted">/ {brl(b.amount)}</small>
                            </strong>
                            <Progress
                              aria-label={'Orçamento utilizado em ' + b.category}
                              value={Math.min(100, (spent * 100) / b.amount!)}
                            />
                            <p className={spent > b.amount! ? 'red' : 'muted'}>
                              {spent > b.amount!
                                ? `${brl(spent - b.amount!)} acima do orçamento`
                                : `${brl(b.amount! - spent)} restantes`}
                            </p>
                          </article>
                        );
                      })}
                    {!items.some((b) => b.type === 'budget' && b.month === month) && (
                      <Empty
                        title="Planeje o mês por categoria"
                        body="Defina um limite e acompanhe seus gastos reais."
                        action="Novo orçamento"
                        onClick={() => open('budget')}
                      />
                    )}
                  </div>
                </>
              )}
              {view === 'cards' && (
                <CardsPanel
                  items={items}
                  cards={cards}
                  transactions={transactions}
                  month={month}
                  localDate={localDate}
                  edit={edit}
                  open={open}
                  setConfirm={setConfirm}
                />
              )}
              {view === 'investments' && (
                <>
                  <div className="notice">
                    <Landmark size={18} />
                    <p>
                      Avaliações manuais. Registre compras, vendas e rendimentos para vincular a
                      carteira ao fluxo das contas. Cotações automáticas ainda não estão conectadas.
                    </p>
                  </div>
                  <button
                    className="secondary review-button"
                    disabled={busy}
                    onClick={() => mutate({ action: 'review_investments' })}
                  >
                    <Check size={16} />
                    Carteira revisada hoje
                  </button>
                  <section className="panel">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ativo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Custo</TableHead>
                          <TableHead>Valor atual</TableHead>
                          <TableHead>Variação de avaliação</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items
                          .filter((x) => x.type === 'investment')
                          .map((i) => (
                            <TableRow key={i.id}>
                              <TableCell>
                                <strong>{i.name}</strong>
                                <small className="block muted">{i.category}</small>
                              </TableCell>
                              <TableCell>{i.quantity}</TableCell>
                              <TableCell>{brl(i.cost)}</TableCell>
                              <TableCell>{brl(i.value)}</TableCell>
                              <TableCell className={i.value! >= i.cost! ? 'green' : 'red'}>
                                {brl(i.value! - i.cost!)}
                              </TableCell>
                              <TableCell>
                                <button
                                  className="small-button"
                                  onClick={() => open('trade', { id: i.id })}
                                >
                                  Operação
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={'Editar ' + i.name}
                                  onClick={() => edit(i)}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={'Excluir ' + i.name}
                                  onClick={() => setConfirm(i)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    {!items.some((x) => x.type === 'investment') && (
                      <Empty
                        title="Veja seus ativos em um só lugar"
                        body="Cadastre o custo e a avaliação atual de cada posição."
                        action="Adicionar investimento"
                        onClick={() => open('investment')}
                      />
                    )}
                  </section>
                </>
              )}
              {view === 'debts' && (
                <div className="card-grid">
                  {items
                    .filter((x) => x.type === 'debt')
                    .map((d) => (
                      <article className="panel account-card" key={d.id}>
                        <div className="between">
                          <Coins className="gold" />
                          <span className="tag">{d.amount === 0 ? 'Quitada' : 'Em andamento'}</span>
                        </div>
                        <h2>{d.name}</h2>
                        <strong className="large-value">{brl(d.amount)}</strong>
                        <p className="muted">Prazo: {d.deadline?.split('-').reverse().join('/')}</p>
                        <p className="muted">
                          Juros informados: {d.rate || 'Não informado'} · Sem capitalização
                          automática
                        </p>
                        <button
                          className="primary"
                          disabled={!d.amount}
                          onClick={() => open('pay_debt', { id: d.id })}
                        >
                          Registrar pagamento
                        </button>
                      </article>
                    ))}
                  {!items.some((x) => x.type === 'debt') && (
                    <Empty
                      title="Enxergue suas obrigações"
                      body="Acompanhe o saldo devedor e registre pagamentos."
                      action="Adicionar dívida"
                      onClick={() => open('debt')}
                    />
                  )}
                </div>
              )}
              {view === 'forecast' && (
                <>
                  <div className="notice">
                    <CalendarDays size={18} />
                    <p>
                      Estimativa a partir do saldo confirmado, movimentações previstas, recorrências
                      e faturas. Não considera gastos não registrados nem rendimentos futuros.
                    </p>
                  </div>
                  <section className="panel">
                    <div className="panel-heading">
                      <div>
                        <span className="muted">Saldo ao final do período</span>
                        <strong
                          className={
                            'large-value ' + (points.at(-1)!.balance < 0 ? 'red' : 'green')
                          }
                        >
                          {brl(points.at(-1)!.balance)}
                        </strong>
                      </div>
                      <Choose
                        label="Horizonte da projeção"
                        value={days}
                        onChange={setDays}
                        options={['7', '30', '90', '180', '365'].map((d) => ({
                          value: d,
                          label: d + ' dias',
                        }))}
                      />
                    </div>
                    <Chart data={points} />
                  </section>
                  <section className="panel recent">
                    <div className="panel-heading">
                      <h2>Eventos previstos</h2>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Saldo projetado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {points.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell>{p.date.split('-').reverse().join('/')}</TableCell>
                            <TableCell className={p.balance < 0 ? 'red' : ''}>
                              {brl(p.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>
                </>
              )}
              {view === 'recurring' && (
                <RecurringPanel
                  items={items}
                  mutate={mutate}
                  busy={busy}
                  edit={edit}
                  open={open}
                  setConfirm={setConfirm}
                />
              )}
              {view === 'reports' && (
                <>
                  <section className="metrics">
                    <article className="metric">
                      <span>Receitas</span>
                      <strong>{brl(summary.income)}</strong>
                    </article>
                    <article className="metric">
                      <span>Despesas</span>
                      <strong>{brl(summary.expenses)}</strong>
                    </article>
                    <article className="metric">
                      <span>Resultado do mês</span>
                      <strong>{brl(summary.income - summary.expenses)}</strong>
                    </article>
                    <article className="metric">
                      <span>Taxa de poupança</span>
                      <strong>{summary.savings === null ? '—' : summary.savings + '%'}</strong>
                    </article>
                  </section>
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Despesas por categoria</h2>
                      <button className="secondary" onClick={exportData}>
                        <Download size={16} />
                        Exportar dados
                      </button>
                    </div>
                    {categories.map((category) => {
                      const value = items
                        .filter(
                          (x) =>
                            x.category === category &&
                            ((x.type === 'transaction' &&
                              x.kind === 'expense' &&
                              x.status === 'posted' &&
                              x.date?.startsWith(month)) ||
                              (x.type === 'purchase' && x.month === month)),
                        )
                        .reduce((s, x) => s + x.amount!, 0);
                      return value > 0 ? (
                        <div className="category-row" key={category}>
                          <span>{category}</span>
                          <Progress
                            aria-label="Participação nas despesas"
                            value={(value * 100) / (summary.expenses || 1)}
                          />
                          <strong>{brl(value)}</strong>
                        </div>
                      ) : null;
                    })}
                    {summary.expenses === 0 && (
                      <Empty
                        title="Sem despesas neste período"
                        body="Os gráficos serão calculados conforme você registrar seus gastos."
                      />
                    )}
                  </section>
                </>
              )}
              {view === 'journey' && (
                <JourneyPanel
                  items={items}
                  rewards={rewards}
                  onAction={missionAction}
                  busy={busy}
                />
              )}
              {view === 'import' &&
                (demo ? (
                  <div className="notice">
                    <ShieldCheck />
                    <p>
                      Importação de arquivos desativada na demonstração. Os exemplos deste passeio
                      são fictícios; use o ambiente privado para seus extratos.
                    </p>
                  </div>
                ) : (
                  <ImportPanel items={items} mutate={mutate} busy={busy} />
                ))}
              {view === 'assistant' && <AssistantPanel items={items} month={month} />}
              {view === 'alerts' && <AlertsPanel items={items} onAction={setView} />}
              {view === 'investments' && items.some((x) => x.type === 'trade') && (
                <section className="panel recent">
                  <div className="panel-heading">
                    <h2>Histórico de operações</h2>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Operação</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Taxas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items
                        .filter((x) => x.type === 'trade')
                        .map((t) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.name}</TableCell>
                            <TableCell>
                              {t.kind === 'buy'
                                ? 'Compra'
                                : t.kind === 'sell'
                                  ? 'Venda'
                                  : 'Rendimento'}
                            </TableCell>
                            <TableCell>{t.date?.split('-').reverse().join('/')}</TableCell>
                            <TableCell>{t.quantity}</TableCell>
                            <TableCell>{brl(t.amount)}</TableCell>
                            <TableCell>{brl(t.fee)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </section>
              )}
              {view === 'settings' && (
                <>
                  <section className="panel settings-panel energy-settings">
                    <h2>Seu ritmo e sua energia</h2>
                    <div className="setting-row">
                      <div>
                        <strong>Visual energético e microanimações</strong>
                        <p className="muted">
                          Brilhos suaves, personagens e celebrações. A redução de movimento do
                          dispositivo sempre tem prioridade.
                        </p>
                      </div>
                      <Switch
                        checked={energy}
                        aria-label="Visual energético"
                        onCheckedChange={(v) => {
                          setEnergy(v);
                          localStorage.setItem('reino-energy', String(v));
                        }}
                      />
                    </div>
                    <div className="setting-row">
                      <div>
                        <strong>Sons de conquista</strong>
                        <p className="muted">
                          Um toque curto ao registrar progresso. Desligados por padrão.
                        </p>
                      </div>
                      <Switch
                        checked={sound}
                        aria-label="Sons de conquista"
                        onCheckedChange={(v) => {
                          setSound(v);
                          localStorage.setItem('reino-sound', String(v));
                          if (v) playChime();
                        }}
                      />
                    </div>
                    <div className="setting-row weekly-plan">
                      <div>
                        <strong>Meu plano semanal</strong>
                        <p className="muted">Uma intenção pessoal, ajustável e sem cobrança.</p>
                      </div>
                      <label className="field">
                        Reserva planejada (R$)
                        <input
                          inputMode="decimal"
                          value={weeklyTarget}
                          onChange={(e) => setWeeklyTarget(e.target.value)}
                        />
                      </label>
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() => {
                          try {
                            void mutate({
                              action: 'preferences',
                              weeklyTarget: money(weeklyTarget),
                              reminderDay: Number(reminderDay),
                            });
                          } catch {
                            toast.error('Confira o valor do plano.');
                          }
                        }}
                      >
                        Salvar plano
                      </button>
                    </div>
                    <div className="setting-row">
                      <div>
                        <strong>Use como aplicativo</strong>
                        <p className="muted">
                          No navegador do celular, escolha Adicionar à tela inicial. Sem conexão,
                          você pode anotar despesas para importar depois.
                        </p>
                      </div>
                      <a className="secondary" href="/offline.html">
                        Anotações offline
                      </a>
                    </div>
                  </section>
                  <section className="panel settings-panel recent">
                    <h2>Privacidade e dados</h2>
                    <p className="muted">
                      Seus registros são associados à sua conta. A aplicação não solicita senhas
                      bancárias nem movimenta dinheiro.
                    </p>
                    <div className="setting-row">
                      <div>
                        <strong>Exportar todos os registros</strong>
                        <p className="muted">
                          Arquivo JSON com contas, movimentações, metas e planejamentos.
                        </p>
                      </div>
                      <button className="secondary" onClick={exportData}>
                        <Download size={16} />
                        Exportar
                      </button>
                    </div>
                    <div className="setting-row">
                      <div>
                        <strong>Apagar registros financeiros</strong>
                        <p className="muted">
                          Remove os registros desta aplicação. O histórico técnico de operações é
                          preservado.
                        </p>
                      </div>
                      <button
                        className="danger"
                        onClick={() => setConfirm({ id: 'all', type: 'clear' })}
                      >
                        Apagar registros
                      </button>
                    </div>
                    <div className="setting-row">
                      <div>
                        <strong>Integrações</strong>
                        <p className="muted">
                          Open Finance, cotações automáticas e IA generativa precisam de provedores
                          e credenciais. O guia local já consulta seus registros.
                        </p>
                      </div>
                      <span className="tag">Não conectadas</span>
                    </div>
                  </section>
                  <section className="panel settings-panel recent">
                    <h2>Sobre esta versão</h2>
                    <p className="muted">
                      Uso pessoal em BRL, datas em America/Cuiaba. Conquistas e XP reconhecem
                      organização e planejamento. Dados financeiros oficiais são salvos online;
                      anotações offline são rascunhos até serem importadas.
                    </p>
                    <a className="text-button" href="/signout-with-chatgpt?return_to=/">
                      Sair da conta
                    </a>
                  </section>
                </>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              <Crown size={14} /> REINO FINANCEIRO
            </span>
            <span>Construído um passo de cada vez.</span>
          </footer>
        </div>
      </main>
      <Dialog
        open={!!modal}
        onOpenChange={(v) => {
          if (!v && !busy) setModal('');
        }}
      >
        <DialogContent className="form-dialog">
          <DialogHeader>
            <DialogTitle>
              {form.editingId
                ? 'Editar registro'
                : (
                    {
                      account: 'Nova conta',
                      transaction: 'Registrar movimentação',
                      goal: 'Nova meta',
                      budget: 'Novo orçamento',
                      card: 'Novo cartão',
                      purchase: 'Compra no cartão',
                      debt: 'Adicionar dívida',
                      investment: 'Adicionar investimento',
                      recurring: 'Nova recorrência',
                      contribute: 'Reservar para a meta',
                      pay_debt: 'Registrar pagamento',
                      trade: 'Operação de investimento',
                      reconcile: 'Conferir saldo real',
                      withdraw_contribution: 'Retirar da reserva',
                      card_cycle: 'Datas da fatura',
                      move_purchase: 'Mover parcela para outra fatura',
                    } as Record<string, string>
                  )[modal]}
            </DialogTitle>
            <DialogDescription>
              {modal === 'transaction'
                ? 'Valores em reais. Datas futuras ficam como previstas.'
                : modal === 'contribute'
                  ? 'Esta reserva não movimenta dinheiro entre contas.'
                  : 'Registre os valores reais do seu planejamento.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="record-form">
            {[
              'account',
              'transaction',
              'goal',
              'card',
              'purchase',
              'debt',
              'investment',
              'recurring',
            ].includes(modal) && input('name', 'Nome ou descrição')}
            {modal === 'trade' && (
              <>
                {select('tradeKind', 'Operação', [
                  { value: 'buy', label: 'Compra / aporte' },
                  { value: 'sell', label: 'Venda / resgate' },
                  { value: 'income', label: 'Rendimento / provento' },
                ])}
                {form.tradeKind !== 'income' && input('quantity', 'Quantidade')}
                {moneyField('fee', 'Taxas (R$)')}
                <p className="muted">
                  Movimenta o saldo da conta informada. Não executa ordens no mercado.
                </p>
              </>
            )}
            {modal === 'reconcile' && (
              <>
                {moneyField('balance', 'Saldo real informado (R$)')}
                <p className="muted">
                  A diferença será registrada como ajuste, sem alterar receitas e despesas do mês.
                </p>
              </>
            )}
            {modal === 'account' && moneyField('initial', 'Saldo inicial (R$)')}
            {['transaction', 'recurring'].includes(modal) &&
              select(
                'kind',
                'Tipo',
                modal === 'recurring'
                  ? [
                      { value: 'income', label: 'Receita' },
                      { value: 'expense', label: 'Despesa' },
                    ]
                  : [
                      { value: 'expense', label: 'Despesa' },
                      { value: 'income', label: 'Receita' },
                      { value: 'transfer', label: 'Transferência' },
                      { value: 'card_payment', label: 'Pagamento de cartão' },
                    ],
              )}
            {[
              'transaction',
              'purchase',
              'debt',
              'recurring',
              'budget',
              'contribute',
              'withdraw_contribution',
              'pay_debt',
              'trade',
            ].includes(modal) && moneyField('amount', 'Valor (R$)')}
            {['transaction', 'recurring', 'pay_debt', 'trade'].includes(modal) &&
              select('accountId', 'Conta', accountOptions)}
            {modal === 'transaction' &&
              form.kind === 'transfer' &&
              select('destinationId', 'Conta de destino', accountOptions)}
            {(modal === 'card_cycle' ||
              modal === 'purchase' ||
              (modal === 'transaction' && form.kind === 'card_payment')) &&
              select('cardId', 'Cartão', cardOptions)}
            {['transaction', 'purchase', 'recurring', 'budget', 'investment'].includes(modal) &&
              select(
                'category',
                'Categoria',
                categories.map((c) => ({ value: c, label: c })),
              )}
            {['transaction', 'purchase', 'recurring', 'pay_debt', 'trade', 'reconcile'].includes(
              modal,
            ) && input('date', modal === 'recurring' ? 'Primeira ocorrência' : 'Data', 'date')}
            {modal === 'transaction' &&
              select('status', 'Situação', [
                { value: 'posted', label: 'Confirmado' },
                { value: 'planned', label: 'Previsto' },
              ])}
            {modal === 'goal' && (
              <>
                {moneyField('target', 'Valor da meta (R$)')}
                {moneyField('current', 'Já reservado (R$)')}
                {input('deadline', 'Prazo', 'date')}
              </>
            )}
            {modal === 'budget' && input('month', 'Mês', 'month')}
            {modal === 'recurring' && (
              <>
                {input('endDate', 'Data final (opcional, inclusive)', 'date')}
                <p className="muted">
                  Em branco, repete sem prazo final. Encerrar não apaga ocorrências já confirmadas.
                </p>
              </>
            )}
            {modal === 'card' && (
              <>
                {moneyField('limit', 'Limite (R$)')}
                <div className="form-grid">
                  {input('closing', 'Dia de fechamento previsto (1–31)', 'number')}
                  {input('due', 'Dia de vencimento fixo (1–31)', 'number')}
                </div>
                {select('dueRule', 'Regra de vencimento', [
                  { value: 'fixed', label: 'Dia fixo' },
                  { value: 'business7', label: '7º dia útil do mês' },
                ])}
                {input('holidays', 'Feriados do banco (AAAA-MM-DD, separados por vírgula)')}
                <p className="muted">
                  O cálculo exclui sábados, domingos e os feriados que você informar. As datas
                  exatas por fatura prevalecem. Alterar o cartão não muda o mês das compras
                  existentes.
                </p>
              </>
            )}
            {modal === 'purchase' && (
              <>
                {input('installments', 'Número de parcelas (1–60)', 'number')}
                {input('invoiceMonth', 'Mês da primeira fatura (opcional)', 'month')}
                <p className="muted">
                  Escolha o mês de vencimento informado pelo banco. Sem seleção, usamos as datas
                  cadastradas ou uma estimativa pelo fechamento previsto.
                </p>
              </>
            )}
            {modal === 'card_cycle' && (
              <>
                {input('month', 'Mês de vencimento da fatura', 'month')}
                {input('closingDate', 'Data real de fechamento', 'date')}
                {input('deadline', 'Data real de vencimento', 'date')}
              </>
            )}
            {modal === 'move_purchase' && (
              <>
                {input('month', 'Mês de vencimento da fatura', 'month')}
                <p className="muted">
                  Altera somente esta parcela. O valor, as demais parcelas e os pagamentos
                  permanecem iguais. Os relatórios por mês serão recalculados.
                </p>
              </>
            )}
            {modal === 'debt' && (
              <>
                {input('deadline', 'Prazo', 'date')}
                {input('rate', 'Juros informados (opcional)')}
              </>
            )}
            {modal === 'investment' && (
              <>
                {input('quantity', 'Quantidade', 'text', '1')}
                {moneyField('cost', 'Custo total (R$)')}
                {moneyField('value', 'Valor atual total (R$)')}
                {input('quoteAt', 'Data da avaliação', 'date')}
              </>
            )}
            {['transaction', 'recurring', 'pay_debt', 'trade'].includes(modal) &&
              !accounts.length && (
                <p className="red">Adicione uma conta antes de registrar esta operação.</p>
              )}
            <div className="form-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => setModal('')}
              >
                Cancelar
              </button>
              <button className="primary" disabled={busy || demo}>
                {demo ? 'Somente visualização' : busy ? 'Salvando…' : 'Salvar registro'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!confirm}
        onOpenChange={(v) => {
          if (!v) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.type === 'clear' ? 'Apagar todos os registros?' : 'Excluir este registro?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === 'clear'
                ? 'Esta ação remove suas contas, metas e movimentações. Exporte seus dados antes de continuar.'
                : 'A exclusão altera os saldos e relatórios relacionados.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async () => {
                if (
                  await mutate(
                    confirm?.type === 'clear'
                      ? { action: 'clear' }
                      : confirm?.type === 'delete_purchase'
                        ? { action: 'delete_purchase', id: confirm.id }
                        : { action: 'delete', id: confirm?.id },
                  )
                )
                  setConfirm(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
