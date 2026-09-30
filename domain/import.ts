import { money } from './finance';
export type ImportRow = {
  externalId?: string;
  name: string;
  amount: number;
  date: string;
  kind: 'income' | 'expense';
  category: string;
};
function normalizeDate(value: string) {
  let s = value.trim();
  if (/^\d{8}/.test(s)) s = s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
  else if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) s = s.split('/').reverse().join('-');
  const d = new Date(s + 'T12:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(d.valueOf()) || d.toISOString().slice(0, 10) !== s)
    throw new Error('Data inválida no extrato: ' + value);
  return s;
}
function signedAmount(value: string) {
  let s = value
    .trim()
    .replace(/^R\$\s*/, '')
    .replace(/\s/g, '');
  const negative = s.startsWith('-');
  s = s.replace(/^[-+]/, '');
  if (s.includes(',')) s = s.replace(/\./g, '');
  return { amount: money(s), kind: negative ? ('expense' as const) : ('income' as const) };
}
function csvCells(line: string, delimiter: string) {
  const result: string[] = [];
  let text = '',
    quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        text += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      result.push(text.trim());
      text = '';
    } else text += c;
  }
  if (quoted) throw new Error('Aspas não fechadas no CSV.');
  result.push(text.trim());
  return result;
}
export function parseImport(text: string, format: 'csv' | 'ofx'): ImportRow[] {
  if (text.length > 500000) throw new Error('O extrato deve ter até 500 KB.');
  if (format === 'ofx') {
    const blocks = [
      ...text.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>))/gi),
    ];
    const tag = (b: string, t: string) =>
      b.match(new RegExp('<' + t + '>([^<\\r\\n]+)', 'i'))?.[1]?.trim() || '';
    const rows = blocks.map((m) => ({
      externalId: tag(m[1], 'FITID') || undefined,
      name: (tag(m[1], 'MEMO') || tag(m[1], 'NAME') || 'Movimentação importada').slice(0, 120),
      date: normalizeDate(tag(m[1], 'DTPOSTED')),
      ...signedAmount(tag(m[1], 'TRNAMT')),
      category: 'Outros',
    }));
    if (!rows.length) throw new Error('Nenhuma movimentação OFX encontrada.');
    if (rows.length > 200) throw new Error('Importe no máximo 200 linhas por vez.');
    return rows.filter((r) => r.amount > 0);
  }
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((x) => x.trim());
  if (lines.length < 2) throw new Error('O CSV precisa de cabeçalho e ao menos uma linha.');
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const header = csvCells(lines[0], delimiter).map((s) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase(),
  );
  const index = (names: string[]) => header.findIndex((h) => names.includes(h));
  const d = index(['data', 'date']),
    n = index(['descricao', 'description', 'nome', 'name']),
    v = index(['valor', 'amount']),
    c = index(['categoria', 'category']),
    id = index(['id', 'fitid', 'external_id']);
  if (d < 0 || n < 0 || v < 0)
    throw new Error('Cabeçalhos necessários: data;descricao;valor. Valor negativo indica despesa.');
  if (lines.length > 201) throw new Error('Importe no máximo 200 linhas por vez.');
  return lines
    .slice(1)
    .map((line, i) => {
      const cells = csvCells(line, delimiter);
      try {
        return {
          date: normalizeDate(cells[d] || ''),
          name: (cells[n] || 'Movimentação importada').slice(0, 120),
          ...signedAmount(cells[v] || ''),
          category: (c >= 0 ? cells[c] : 'Outros') || 'Outros',
          externalId: id >= 0 ? cells[id] || undefined : undefined,
        };
      } catch (e) {
        throw new Error(`Linha ${i + 2}: ${e instanceof Error ? e.message : 'dados inválidos'}`);
      }
    })
    .filter((r) => r.amount > 0);
}
