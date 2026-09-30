import test from 'node:test';
import assert from 'node:assert/strict';
import {today, forecast, totals, isCashInflow} from '../.sites-runtime/test-build/finance.js';
import {invoiceState, invoiceClosing} from '../.sites-runtime/test-build/invoices.js';
import {rewardsFor} from '../.sites-runtime/test-build/journey.js';

test('investment proceeds and positive adjustments have incoming cash display',()=>{
 for(const kind of ['income','investment_sell','investment_income','adjustment_income'])assert.equal(isCashInflow(kind),true);
 for(const kind of ['expense','investment_buy','card_payment','transfer','adjustment_expense'])assert.equal(isCashInflow(kind),false);
});

test('invoice closes after closing day in Cuiaba, without a payment state', () => {
  assert.equal(invoiceState('2026-09-29','2026-09-28'),'Aberta');
  assert.equal(invoiceState('2026-09-29','2026-09-29'),'Fecha hoje');
  assert.equal(invoiceState('2026-09-29','2026-09-30'),'Fechada');
  assert.equal(today(new Date('2026-09-30T03:59:59Z')),'2026-09-29');
  assert.equal(today(new Date('2026-09-30T04:00:00Z')),'2026-09-30');
});
test('invoice estimates and overrides preserve every financial record and balance', () => {
  const card={id:'c',type:'card',closing:29,due:5};
  const items=[card,{id:'cycle',type:'card_cycle',cardId:'c',month:'2026-10',closingDate:'2026-09-29',deadline:'2026-10-07'}, {id:'p',type:'purchase',cardId:'c',month:'2026-10',amount:101}];
  const original=structuredClone(items), before=totals(items,'2026-10');
  assert.deepEqual(invoiceClosing(items,card,'2026-10'),{date:'2026-09-29',estimated:false});
  assert.deepEqual(invoiceClosing([],card,'2026-10'),{date:'2026-09-29',estimated:true});
  assert.equal(invoiceClosing([],{...card,closing:31,due:31},'2026-03').date,'2026-02-28');
  invoiceState(items[1].closingDate,'2026-10-01');
  assert.deepEqual(items,original); assert.deepEqual(totals(items,'2026-10'),before);
});
test('recurring end date is inclusive, retains anchor and legacy unlimited behavior', () => {
  const r={id:'r',type:'recurring',kind:'expense',amount:100,date:'2024-01-31',endDate:'2024-03-31'};
  assert.deepEqual(forecast([r],120,'2024-01-31').slice(1,-1).map(x=>x.date),['2024-01-31','2024-02-29','2024-03-31']);
  assert.equal(forecast([r],365,'2024-04-01').at(-1).balance,0);
  assert.equal(forecast([{...r,endDate:undefined}],120,'2024-01-31').at(-1).balance,-400);
});
test('investment transaction never unlocks debt payment; historical rewards remain', () => {
  const items=[{id:'t',type:'transaction',parentId:'trade',kind:'investment_buy',status:'posted'},{id:'trade',type:'trade'}];
  assert.equal(rewardsFor('sync_journey',items,[],'2026-09-30').some(x=>x.code==='first_debt_payment'),false);
  const prior=[{key:'achievement:first_debt_payment',code:'first_debt_payment',xp:40,date:'2026-09-01'}];
  const saved=structuredClone(prior);rewardsFor('sync_journey',items,prior,'2026-09-30');assert.deepEqual(prior,saved);
  assert.equal(rewardsFor('pay_debt',[{id:'d',type:'debt'},{id:'t',type:'transaction',parentId:'d',kind:'expense',status:'posted'}],[],'2026-09-30').some(x=>x.code==='first_debt_payment'),true);
});
