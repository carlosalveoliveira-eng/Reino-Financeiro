'use client';
import { Check, Trophy, Flame, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ACHIEVEMENTS, progress, type Reward } from '../domain/journey';
import { type Entity, today, brl } from '../domain/finance';
import { Companion, companions } from './companion';
type Props = {
  items: Entity[];
  rewards: Reward[];
  onAction: (action: string) => void;
  busy: boolean;
  compact?: boolean;
};
export default function JourneyPanel({ items, rewards, onAction, busy, compact = false }: Props) {
  const j = progress(rewards, items),
    preferences = items.find((x) => x.type === 'preferences');
  const start = new Date(today() + 'T12:00:00Z');
  start.setUTCDate(start.getUTCDate() - 6);
  const weekStart = start.toISOString().slice(0, 10);
  const reserved = items
    .filter((x) => x.type === 'contribution' && x.date! >= weekStart)
    .reduce((s, x) => s + (x.kind === 'withdrawal' ? -x.amount! : x.amount!), 0);
  return (
    <div className={'journey-surface ' + (compact ? 'compact' : '')}>
      <section className="mission-panel panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">SUA PRÓXIMA CONQUISTA COMEÇA PEQUENA</p>
            <h2>{compact ? 'Um passo para hoje' : 'Missões do seu dia'}</h2>
          </div>
          <span className="mission-count">{j.todayDone}/4</span>
        </div>
        <div className="mission-list">
          {j.missions.slice(0, compact ? 3 : 4).map((m, i) => (
            <button
              key={m.code}
              className={'mission ' + (m.done ? 'complete' : '')}
              onClick={() => onAction(m.action)}
              disabled={m.done || busy}
            >
              <span className="mission-check">
                {m.done ? <Check size={17} /> : <span>{i + 1}</span>}
              </span>
              <span className="mission-copy">
                <strong>{m.title}</strong>
                <small>{m.detail}</small>
              </span>
              <span className="xp-chip">{m.done ? 'Feito' : `+${m.xp} XP`}</span>
            </button>
          ))}
        </div>
        <div className="mission-footer">
          <Flame size={16} />
          <p>Um passo já conta. Você não precisa concluir tudo hoje.</p>
        </div>
      </section>
      {!compact && (
        <>
          <section className="panel rhythm-panel">
            <div>
              <p className="eyebrow">CONSTÂNCIA COM FLEXIBILIDADE</p>
              <h2>Seu ritmo, sua jornada</h2>
              <p className="muted">
                {j.streak
                  ? `${j.streak} ${j.streak === 1 ? 'dia seguido' : 'dias seguidos'} de organização.`
                  : 'Uma pausa não apaga suas conquistas.'}{' '}
                {j.distinct} dias de cuidado registrados.
              </p>
            </div>
            <div className="week-dots">
              {j.week.map((d) => (
                <div key={d.date}>
                  <span className={d.done ? 'done' : ''}>
                    {d.done ? <Check size={16} /> : new Date(d.date + 'T12:00:00Z').getUTCDate()}
                  </span>
                  <small>
                    {
                      ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][
                        new Date(d.date + 'T12:00:00Z').getUTCDay()
                      ]
                    }
                  </small>
                </div>
              ))}
            </div>
            <div className="weekly-reserve">
              <span>Reservado nos últimos 7 dias</span>
              <strong>{brl(Math.max(0, reserved))}</strong>
              {(preferences?.amount ?? 0) > 0 ? (
                <>
                  <Progress
                    aria-label="Progresso da reserva semanal"
                    value={Math.min(100, (Math.max(0, reserved) * 100) / preferences!.amount!)}
                  />
                  <small>Seu plano semanal: {brl(preferences?.amount)}</small>
                </>
              ) : (
                <button className="text-button" onClick={() => onAction('settings')}>
                  Definir meu plano semanal
                </button>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">MARCOS QUE CONTAM SUA HISTÓRIA</p>
                <h2>Galeria de conquistas</h2>
              </div>
              <span className="tag">
                {j.achievements.length}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="achievement-grid">
              {ACHIEVEMENTS.map((a) => {
                const earned = j.achievements.some((e) => e.code === a.code);
                return (
                  <article key={a.code} className={'achievement ' + (earned ? 'earned' : '')}>
                    <span className="achievement-emblem">
                      {earned ? <Trophy size={25} /> : <LockKeyhole size={22} />}
                    </span>
                    <div>
                      <h3>{a.title}</h3>
                      <p>{a.description}</p>
                      <small>{earned ? `Conquistado · +${a.xp} XP` : `+${a.xp} XP`}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Conheça os habitantes do seu reino</h2>
            </div>
            <div className="companions-gallery">
              {companions.map((c, i) => (
                <article key={c.name}>
                  <Companion index={i} />
                  <h3>{c.name}</h3>
                  <small>{c.role}</small>
                  <p>{c.message}</p>
                </article>
              ))}
            </div>
          </section>
          <div className="notice">
            <ShieldCheck size={18} />
            <p>
              XP reconhece organização e planejamento. O tamanho da sua renda, da reserva ou dos
              investimentos não define seu valor nem a qualidade da sua jornada.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
