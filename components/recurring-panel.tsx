'use client';
import { type Entity, brl } from '../domain/finance';
import { Repeat, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Empty } from './empty-state';
import { RecurringConfirmations } from '../app/financial-tools';
export function RecurringPanel({
  items,
  mutate,
  busy,
  edit,
  open,
  setConfirm,
}: {
  items: Entity[];
  edit: (r: Entity) => void;
  open: (type: string, preset?: Record<string, string>) => void;
  setConfirm: (r: Entity) => void;
  mutate: (x: object) => Promise<boolean>;
  busy: boolean;
}) {
  return (
    <>
      <div className="notice">
        <Repeat size={18} />
        <p>
          Recorrências entram na projeção. Confirme cada ocorrência quando ela acontecer; o saldo
          será atualizado sem gerar duplicatas.
        </p>
      </div>
      <RecurringConfirmations items={items} mutate={mutate} busy={busy} />
      <section className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor mensal</TableHead>
              <TableHead>Primeira data</TableHead>
              <TableHead>Data final</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items
              .filter((x) => x.type === 'recurring')
              .map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.kind === 'income' ? 'Receita' : 'Despesa'}</TableCell>
                  <TableCell>{brl(r.amount)}</TableCell>
                  <TableCell>{r.date?.split('-').reverse().join('/')}</TableCell>
                  <TableCell>
                    {r.endDate?.split('-').reverse().join('/') || 'Sem prazo final'}
                  </TableCell>
                  <TableCell>
                    <button className="small-button" onClick={() => edit(r)}>
                      Editar recorrência
                    </button>
                    <button
                      className="icon-button"
                      aria-label={'Excluir ' + r.name}
                      onClick={() => setConfirm(r)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {!items.some((x) => x.type === 'recurring') && (
          <Empty
            title="Planeje o que se repete"
            body="Salário, aluguel e assinaturas ajudam a projetar o saldo futuro."
            action="Nova recorrência"
            onClick={() => open('recurring')}
          />
        )}
      </section>
    </>
  );
}
